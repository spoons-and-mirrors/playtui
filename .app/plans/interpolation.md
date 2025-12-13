# Keyframe Interpolation + Value Graph (Hybrid Overlay)

## Why this plan (constraints)

This plan implements keyframing + interpolation **without deleting** the existing snapshot animation system.

**Hard constraints from product**
- Keep the existing frame-by-frame snapshot system (`animation.frames[]`).
- Keep manual frame add/delete/duplicate semantics as-is.
- Only allow keyframing for numeric properties (no discrete/string props for now).
- Keyframing UX:
  - Right-click to add/remove keyframe.
  - Diamond indicator next to animatable numeric controls.
  - Auto-key toggle in header.
- Curve editor is a **value graph** (not a speed graph).
  - One char per frame (a plotted point), not a full bar histogram.
  - Values are in **%** and autoscale to the current keyframe segment.
  - Graph height is ~10 rows.
- Focus on functionality first; alignment with filmstrip frame-width can come later.

**Guiding principle**
- Add keyframing as an **overlay** system that can *drive* specific properties while everything else still behaves the same.

---

## Mental model (hybrid)

### Existing behavior (kept)
- `animation.frames[]` stores a full snapshot tree for every frame.
- When you edit on frame N, the snapshot for frame N changes.
- Export uses `frames[]` directly.

### New behavior (overlay)
Keyframing is opt-in per property.

Definitions:
- **Keyframed Property**: a specific `nodeId + propertyPath` that has keyframes.
- **Driven**: during playback / preview, that property’s value is computed from keyframes (interpolated) instead of taken from the snapshot.

Editing rules (important UX contract):
1. **Property is NOT keyframed**
   - Editing it should be **linked** across frames: apply the change to *all frames*, so frames stay consistent.
   - This matches the “linked state until keyframes exist” idea without rewriting the project schema.

2. **Property IS keyframed**
   - Editing it should affect keyframes, not direct snapshots:
     - If Auto-key is ON: create/update keyframe at current frame.
     - If Auto-key is OFF: right-click “Add keyframe” (manual), or we can choose the more intuitive default:
       - **Recommended**: if the property is already keyframed, changing it updates/creates a keyframe at current frame (even if Auto-key is off), because otherwise edits appear to “do nothing” during playback.

Playback/preview rules:
- When rendering frame N, start from `frames[N]` and then overlay the computed values for each driven property at frame N.

Export rules:
- Export should still produce a baked set of snapshots.
  - Option A: export the existing `frames[]` after applying overlay values freshly to clones.
  - Option B: generate “baked frames” on-the-fly without mutating `frames[]`.
  - **Recommended**: Option B (pure bake) to avoid corrupting authored snapshots.

---

## Scope (v1 of the feature)

### Animatable properties (numeric only)
Start with the properties that are currently edited via numeric controls and are reliably `number` in our node model.

Initial set (recommended):
- Position: `x`, `y`, `zIndex`
- Spacing: `marginTop|Right|Bottom|Left`, `paddingTop|Right|Bottom|Left`
- Layout: `gap`, `rowGap`, `columnGap`, `flexGrow`, `flexShrink`

Explicitly out of scope for v1:
- `width`, `height` (can be `"auto"` or `%`)
- Colors, strings, enums, booleans (discrete properties)
- “preset curves” logic (UI placeholder only)

---

## Data model additions (keep snapshots)

### New types (new file)
Create `packages/playtui/src/lib/keyframing.ts` (single source of truth for keyframing domain logic + types).

```ts
export type PropertyPath = string // e.g. "x" or "style.paddingTop" (keep simple initially)

export type KeyframedPropertyId = string // `${nodeId}:${property}`

export interface Keyframe {
  frame: number // 0-indexed
  value: number
}

// Value-graph data is per SEGMENT (between two keyframes).
// For each in-between frame we store a normalized 0..100 value representing
// the property value at that in-between frame relative to the segment range.
//
// Example: keyframes at 0 (10px) and 10 (50px)
// - in-between frames: 1..9 => 9 values
// - curveValues[i] is the plotted percent for frame (start+1+i)
export interface ValueGraphSegment {
  startFrame: number
  endFrame: number
  curveValues: number[] // length = endFrame - startFrame - 1, each 0..100
}

export interface AnimatedProperty {
  nodeId: string
  property: PropertyPath
  keyframes: Keyframe[] // kept sorted
  segments: ValueGraphSegment[] // derived/maintained when keyframes change
}

export interface KeyframingState {
  enabled: boolean // global toggle (optional); can be implied by presence of animatedProperties
  autoKeyEnabled: boolean
  animatedProperties: AnimatedProperty[]
  // Timeline UI state
  timeline: {
    panelOpen: boolean
    view: { type: "dopesheet" } | { type: "curve"; nodeId: string; property: PropertyPath }
  }
}

export const ANIMATABLE_PROPERTIES = [
  "x",
  "y",
  "zIndex",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "rowGap",
  "columnGap",
  "flexGrow",
  "flexShrink",
] as const

export type AnimatableProperty = (typeof ANIMATABLE_PROPERTIES)[number]
```

### Project schema changes (minimal)
Update `packages/playtui/src/lib/projectTypes.ts` to add the overlay state.

Current `Project.animation` already contains:
- `fps`
- `frames: ElementNode[]`
- `currentFrameIndex`

Add:
- `keyframing: KeyframingState`

No migration complexity required:
- Old projects load with `keyframing.animatedProperties = []`.

---

## Domain logic (single source of truth)

All keyframing logic should live in `packages/playtui/src/lib/keyframing.ts`.
No other layer should re-implement:
- “find animated property”
- “insert/update/remove keyframe”
- “compute interpolated value”
- “update segment curve array length”

### Core functions

```ts
export function keyframedPropertyId(nodeId: string, property: PropertyPath): KeyframedPropertyId

export function isAnimatableProperty(property: string): property is AnimatableProperty

export function getAnimatedProperty(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath
): AnimatedProperty | undefined

export function hasKeyframeAt(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number
): boolean

export function upsertKeyframe(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number,
  value: number
): AnimatedProperty[]

export function removeKeyframe(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number
): AnimatedProperty[]

// Ensures segment arrays exist and have correct lengths.
// When a new segment is created, it starts linear (0..100 evenly spread).
export function rebuildSegments(prop: AnimatedProperty): AnimatedProperty

// Returns a driven value for this property at frame.
// - if frame is exactly a keyframe => keyframe value
// - if before first / after last => hold nearest keyframe value
// - if between two keyframes => compute via segment curveValues
export function getDrivenValue(
  prop: AnimatedProperty,
  frame: number
): number

// Updates a single in-between point in the value graph.
// Normalized 0..100.
export function setSegmentPoint(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number,
  percent: number
): AnimatedProperty[]

// Bake: starting from snapshot frames, override driven properties at each frame.
export function bakeKeyframedFrames(
  frames: ElementNode[],
  animated: AnimatedProperty[]
): ElementNode[]
```

### Value-graph math (what the curve values mean)
This is a **value graph**.

For a segment between two keyframes:
- `startValue`, `endValue`
- `percent ∈ [0..100]` defines the value at that frame:

`value = startValue + (endValue - startValue) * (percent / 100)`

Default linear segment provides `percent` values evenly spaced from 0..100.

---

## How rendering & playback should work

### Rendering a frame (preview)
- Keep app state as-is: `project.tree` remains the snapshot of the current frame.
- When we need to “preview playback” or render in play mode:
  - Compute a derived tree for frame N:
    1. Deep-clone `frames[N]`.
    2. For each animated property, compute `getDrivenValue(prop, N)`.
    3. Apply that numeric value to the matching node+property.

This preserves all existing snapshot behavior and selection IDs.

### Export
- In export action (currently in FilmStrip), call `bakeKeyframedFrames(project.animation.frames, project.animation.keyframing.animatedProperties)` and pass baked frames to `generateAnimationModule`.

---

## Editing pipeline integration (where changes flow)

### `useProject.ts` changes (high-level)
Add new actions:
- `toggleAutoKey()`
- `addKeyframe(nodeId, property)` (uses current frame + current numeric value)
- `removeKeyframe(nodeId, property)`
- `setCurvePoint(nodeId, property, frame, percent)`

Modify existing update behavior to implement “linked unless keyframed”:
- Add a helper: `updateNumericProperty(nodeId, property, newValue, pushHistory)`

Rules:
1. If property is keyframed OR Auto-key is on:
   - `upsertKeyframe(... currentFrameIndex, newValue)`
   - (optional) also update `frames[currentFrameIndex]` so the snapshot visually matches even when not in play mode.
2. If property is not keyframed:
   - apply change to **all frames**:
     - for each frame tree in `frames[]`, mutate that property.

Note: applying to all frames can be implemented centrally (domain action in `useProject.ts`) to avoid a lot of duplicated UI logic.

### Undo/redo
We must include keyframing state in history entries.

Update `packages/playtui/src/lib/types.ts` `HistoryEntry` shape to include:
- `animationFrames` OR the whole `animation` object, or minimally:
  - `frames`
  - `currentFrameIndex`
  - `keyframing` (animatedProperties + autoKeyEnabled + timeline UI state)

Recommended minimal history changes:
- Add `animation` to history snapshots so undo/redo is coherent.

---

## UI/UX implementation

### Diamond indicator + right-click
Where to add it (based on current components):
- `ValueCounter` (position)
- `ValueSlider` (padding/margin/gap sliders)

Implementation approach:
- Add an optional “keyframing affordance” slot or inline diamond:
  - `diamond` shows:
    - muted hollow if animatable but no keyframes
    - muted filled if keyframes exist but not on current frame
    - accent/red filled if keyframe exists at current frame

Right-click:
- On the value control container, open a small context menu near mouse position.
- Menu items:
  - `Add keyframe` (enabled only if numeric + animatable)
  - `Remove keyframe` (only if there’s a keyframe at current frame)

OpenTUI detail:
- Use `onMouseDown` and check `e.button === MouseButton.RIGHT`.
- Use `stopPropagation()` in the menu container.

### Auto-key toggle
- Add to `AppHeader` as a small toggle next to existing mode buttons.
- When enabled, property edits create/update keyframes.

### Timeline panel (dopesheet + curve)
We should avoid new global “mode” initially.

Recommended:
- Timeline panel is a togglable panel **inside Play page**.
- Add a new keybind in play context (e.g. `t`) to toggle timeline panel.
  - Avoid collisions with existing play keys (`e/r/f/x/space`).
  - (If you strongly prefer F-keys, add `F5` as a *panel toggle*, not a new mode.)

#### Timeline: Dopesheet view
- List animated properties (rows):
  - label `nodeName.property`
  - show keyframe markers across frames (not necessarily aligned with filmstrip width yet; one char per frame is fine)
- Selecting a row opens Curve view.

#### Timeline: Curve view (Value Graph)
- Header: property name + back button.
- Graph:
  - X axis: frames (one column per frame)
  - Y axis: 0–100% (autoscaled per segment between keyframes)
  - Height: 10 rows
  - Render a single point (`█`) per frame at the appropriate normalized percent.

Drawing behavior:
- Click-drag sets normalized percent for frames **between** two keyframes.
- Keyframe frames are locked (their value is the segment endpoints).
- When dragging, snap percent to 10 levels (0, 10, … 100).

Presets:
- Add UI buttons (placeholder) that do nothing for now.

---

## Implementation phases (milestones)

### Phase 1 — Data model + bake engine
1. Add `lib/keyframing.ts` with types + domain functions.
2. Extend `Project.animation` to include `keyframing` state.
3. Implement `bakeKeyframedFrames()`.
4. Wire export to use baked frames.

**Milestone**: export/playback can use baked frames (even if no UI yet).

### Phase 2 — Keyframe recording UI
1. Add diamond + right-click menu to `ValueCounter` and `ValueSlider`.
2. Add Auto-key toggle in `AppHeader`.
3. Add `useProject` actions: add/remove keyframe, toggle autokey.

**Milestone**: can add keyframes to X/Y and see interpolation in playback/export.

### Phase 3 — “Linked-until-keyframed” editing behavior
1. Implement “edit applies to all frames if not keyframed”.
2. Implement “edit updates keyframe if keyframed” (and/or if autokey is on).
3. Update history model so undo/redo is correct.

**Milestone**: frames feel linked until you keyframe.

### Phase 4 — Timeline panel
1. Add panel toggle in Play page.
2. Dopesheet list of animated properties.
3. Curve view showing the value graph.
4. Click-drag editing of curve points.

**Milestone**: curve editor edits in-between values.

### Phase 5 — Polish + edge cases
- Handle:
  - single keyframe behavior (hold)
  - deleting keyframes (segment rebuild)
  - deleting/duplicating frames interaction with existing keyframes (see below)
- Improve visuals (current frame indicator, selection highlight).

---

## Edge cases / required decisions

### A) Frame insert/delete/duplicate vs keyframes
We are keeping snapshots, so frames can be inserted/deleted.
We must define how keyframes shift:
- **Recommended**:
  - Insert frame at index i: any keyframe with `frame >= i` shifts by +1.
  - Delete frame at index i: any keyframe with `frame > i` shifts by -1; keyframe at i is removed.
  - Duplicate frame: does not automatically create keyframes.

### B) Snapshots vs driven properties
If a property is driven, the snapshot value might not match at in-between frames.
That’s okay if:
- edit UI shows the driven value while in play preview
- edit UI sets keyframes rather than mutating snapshots
(Optional) Keep snapshots in sync for driven properties by updating `frames[current]` on keyframe edits.

### C) Numeric validation
Only enable diamonds/context menu when:
- property is in `ANIMATABLE_PROPERTIES`
- current value is `number`

---

## Success criteria
- User can:
  - Create a box
  - Right-click X (ValueCounter) → Add keyframe
  - Change frame → adjust X → Add keyframe (or autokey)
  - Play animation and see interpolated motion
  - Open timeline panel and draw value-graph points
  - Export produces baked snapshots reflecting the curve
