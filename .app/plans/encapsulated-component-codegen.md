# Encapsulated Component Codegen Implementation Plan

## Overview

Transform PlayTUI's codegen from outputting raw JSX markup to generating **encapsulated Renderable classes** with imperative APIs. This enables cross-reconciler compatibility (React, SolidJS, Vue) and self-contained, reusable components.

---

## Validation Status

> **Last validated:** Deep research completed via Context7 on OpenTUI architecture.
> **Confidence level:** HIGH - All core assumptions verified against OpenTUI source.

### Verified Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `extend()` works across all reconcilers | ✅ VERIFIED | Same pattern in React, Solid, Vue docs |
| Custom components support JSX children | ✅ VERIFIED | Reconciler calls `add()` internally |
| Event props work cross-reconciler | ✅ VERIFIED | `onMouseDown`, `onChange` etc. mapped to renderable |
| Module augmentation per reconciler | ✅ VERIFIED | Each reconciler needs separate `declare module` |
| `requestRender()` triggers re-render | ✅ VERIFIED | Setter pattern: `set prop(v) { this._prop = v; this.requestRender() }` |

---

## Critical Holes Identified (Round 2)

> **STOP AND READ THIS SECTION BEFORE IMPLEMENTATION**

### HOLE #1: Only BoxRenderable Can Be Extended

**Problem:** ALL OpenTUI documentation examples ONLY show extending `BoxRenderable`. There are NO examples of extending `TextRenderable`, `InputRenderable`, `SelectRenderable`, `SliderRenderable`, etc.

**Evidence:** Searched Context7 extensively - every `extend()` example uses `BoxRenderable` as base.

**Implication:** The plan's assumption that we can generate `class MyText extends TextRenderable` is UNVERIFIED and likely unsupported.

**Solution Options:**
1. **Composition over inheritance** - Always generate `BoxRenderable` subclass, compose non-box elements inside via `add()`
2. **Verify with OpenTUI maintainers** - Ask if extending non-Box renderables is supported
3. **Limit scope** - Only support class generation for box-based components

**Recommendation:** Option 1 (Composition). A "Text component" becomes:
```typescript
class MyLabelRenderable extends BoxRenderable {
  private _text: TextRenderable
  
  constructor(ctx: RenderContext, options: BoxOptions) {
    super(ctx, options)
    this._text = new TextRenderable(ctx, { content: "Hello", fg: "#fff" })
    this.add(this._text)
  }
  
  setContent(value: string) {
    this._text.content = value // or use TextRenderable's API
    this.requestRender()
  }
}
```

### HOLE #2: Constructor Signature Mismatch

**Problem:** Different renderable types have DIFFERENT option shapes:
- `BoxRenderable`: `{ backgroundColor, borderColor, border, ... }`
- `TextRenderable`: `{ content, fg, attributes, ... }`
- `InputRenderable`: `{ placeholder, value, maxLength, ... }`
- `SelectRenderable`: `{ options: SelectOption[], ... }`

**Implication:** Cannot have a generic `generateConstructor()` that works for all types. Each type needs specific option mapping.

**Solution:** Create type-specific option mappers in the registry:
```typescript
box: {
  baseClass: "BoxRenderable",
  mapOptions: (node) => ({
    backgroundColor: node.backgroundColor,
    border: node.border,
    // ... box-specific mapping
  })
},
text: {
  baseClass: "TextRenderable", 
  mapOptions: (node) => ({
    content: node.content,
    fg: node.fg,
    attributes: computeTextAttributes(node), // bold, italic, etc -> bitmask
  })
}
```

### HOLE #3: TextRenderable Uses Bitmask Attributes

**Problem:** PlayTUI stores `bold`, `italic`, `underline`, `dim`, `strikethrough` as separate booleans. OpenTUI's `TextRenderable` uses a `TextAttributes` bitmask.

**Evidence from codebase:** `text.tsx:17-21` shows PlayTUI's `TextRenderable` type has boolean flags. OpenTUI uses `TextAttributes.BOLD | TextAttributes.ITALIC`.

**Solution:** Add attribute conversion in codegen:
```typescript
function computeTextAttributes(node: TextRenderable): number {
  let attrs = 0
  if (node.bold) attrs |= TextAttributes.BOLD
  if (node.italic) attrs |= TextAttributes.ITALIC
  if (node.underline) attrs |= TextAttributes.UNDERLINE
  if (node.dim) attrs |= TextAttributes.DIM
  if (node.strikethrough) attrs |= TextAttributes.STRIKETHROUGH
  return attrs
}
```

### HOLE #4: Focus Routing Requires getRenderable()

**Problem:** For composite components with focusable children (e.g., a form with inputs), calling `.focus()` on the container does NOT focus the internal input.

**Evidence:** OpenTUI docs show `getRenderable(id)?.focus()` pattern for routing focus.

**Implication:** Generated composites need focus delegation logic, not just simple `add()`.

**Solution:** Generate focus routing methods:
```typescript
class MyFormRenderable extends BoxRenderable {
  private _emailInput: InputRenderable
  
  focus() {
    // Route focus to primary input
    this._emailInput.focus()
  }
  
  // Or expose child for manual control
  get emailInput() { return this._emailInput }
}
```

### HOLE #5: Event Emitters vs Props

**Problem:** Some renderables use event emitter pattern (`.on('change', cb)`) while others use constructor options (`onChange: (v) => {}`). The plan doesn't account for this difference.

**Evidence:** `SelectRenderable` and `SliderRenderable` use `.on()` event emitter. `InputRenderable` uses constructor options.

**Solution:** Registry should specify event pattern:
```typescript
select: {
  eventPattern: 'emitter', // uses .on('change', cb)
  events: ['change', 'select']
},
input: {
  eventPattern: 'options', // uses onChange in constructor
  events: ['onInput', 'onChange', 'onSubmit']
}
```

### HOLE #6: RGBA vs String Colors

**Problem:** OpenTUI core uses `RGBA` class for colors. JSX accepts string colors. Generated classes need to handle both.

**Evidence:** `BoxRenderable` constructor expects `RGBA.fromHex('#fff')`, but JSX `<box backgroundColor="#fff">` works because reconciler converts.

**Implication:** Generated imperative API must convert strings to RGBA:
```typescript
setBackgroundColor(value: string) {
  this.backgroundColor = RGBA.fromHex(value)
  this.requestRender()
}
```

---

### Critical Findings

1. **JSX syntax is IDENTICAL across React and Solid** - Both use `<text>`, `<box>`, `<ascii-font>`. Only Vue differs (`<textRenderable>`). The original concern about `<ascii-font>` vs `<ascii_font>` was incorrect.

2. **Children handling is automatic** - Custom classes extending `BoxRenderable` inherit the `add()` method. Reconcilers handle JSX children automatically by calling `add()` internally.

3. **Type augmentation requires THREE declarations** - For full cross-reconciler support:
   ```typescript
   declare module "@opentui/react" { interface OpenTUIComponents { name: typeof Class } }
   declare module "@opentui/solid" { interface OpenTUIComponents { name: typeof Class } }
   declare module "@opentui/vue" { interface OpenTUIComponents { name: typeof Class } }
   ```

4. **`delegate()` pattern for composites** - For complex components where API calls need routing to children (e.g., `.focus()` should focus an internal input), use `delegate({focus: 'child-id'}, VNode)`. This is a core-only imperative pattern, not needed for basic class generation.

---

## Problem Statement

### Current State

```typescript
// Current codegen output: Raw JSX
<box name="Panel" border backgroundColor="#1a1a2e" style={{ width: 40 }}>
  <text fg="#fff">Hello</text>
</box>
```

**Limitations:**
1. **No encapsulation** - Consumers must understand full prop schema
2. **No imperative API** - Cannot programmatically mutate without parent re-render
3. **Static** - Animation requires full tree reconciliation
4. **Vue differs** - Vue uses `<boxRenderable>` suffix (minor issue)

### Target State

```typescript
// New codegen output: Encapsulated class
export class PanelComponent extends BoxRenderable {
  setTitle(value: string): void
  setBackgroundColor(value: string): void
  // ... imperative API
}

extend({ panel: PanelComponent })
```

**Benefits:**
- Works identically across React, Solid, Vue via `extend()`
- Exposes clean imperative API via getters/setters
- Self-contained state management with `requestRender()`
- Animatable properties have dedicated methods

---

## Architecture

### OpenTUI Extension Pattern

OpenTUI uses a unified extension system across all reconcilers:

```
@opentui/core    ─┬─> extend({ name: Class })
                  │
@opentui/react   ─┼─> getComponentCatalogue() ─> <name ... />
@opentui/solid   ─┤                               (same syntax)
@opentui/vue     ─┴─> getComponentCatalogue() ─> <nameRenderable ... />
```

**Key insight:** The `extend()` function registers a Renderable class with the core engine. Each reconciler accesses registered components via `getComponentCatalogue()`. Same class definition works across all frameworks.

**Children support:** Custom components extending `BoxRenderable` automatically support JSX children. The reconciler handles the `add()` calls internally - no special handling required in the generated class.

### Existing Codebase Structure

```
packages/playtui/src/
├── lib/
│   ├── codegen.ts        # Current JSX generation
│   ├── parseCode.ts      # JSX parsing (reverse of codegen)
│   ├── types.ts          # Renderable type definitions
│   └── tree.ts           # Tree manipulation utilities
├── components/
│   └── renderables/
│       ├── index.ts      # RENDERABLE_REGISTRY (single source of truth)
│       ├── box.tsx       # BoxRenderer + BOX_DEFAULTS
│       ├── text.tsx      # TextRenderer + TEXT_DEFAULTS
│       └── ...           # Other renderable implementations
```

**Key file: `renderables/index.ts`**
- `RENDERABLE_REGISTRY` defines all renderable types, their properties, capabilities, and defaults
- `SerializableProp` schema includes: `key`, `type`, `styleProp`, `animatable`, `default`
- Already tracks which properties are animatable (`animatable: true`)

---

## Implementation Phases

### Phase 1: Registry Enhancement

**Goal:** Extend `RENDERABLE_REGISTRY` with metadata needed for class generation, accounting for the architectural constraints discovered.

**File:** `packages/playtui/src/components/renderables/index.ts`

**Changes:**

```typescript
export interface RenderableRegistryEntry {
  // ... existing fields
  
  // NEW: Class generation metadata
  baseClass: string                    // The OpenTUI renderable class to extend/compose
  coreImports: string[]                // Required imports from @opentui/core
  compositionStrategy: 'extend' | 'compose'  // NEW: How to generate the class
  eventPattern: 'options' | 'emitter'  // NEW: How events are handled
  events?: string[]                    // NEW: Event names for this type
  mapOptions?: (node: Renderable) => Record<string, unknown>  // NEW: Type-specific option mapping
}
```

**Critical insight:** Only `box` and `scrollbox` use `extend` strategy. All other types use `compose` - they are wrapped in a BoxRenderable container.

**Registry updates:**

```typescript
box: {
  // ... existing
  baseClass: "BoxRenderable",
  compositionStrategy: 'extend',  // Can directly extend
  eventPattern: 'options',
  coreImports: ["BoxRenderable", "RGBA", "extend", "type RenderContext", "type BoxOptions"],
},
scrollbox: {
  baseClass: "ScrollBoxRenderable",
  compositionStrategy: 'extend',  // Can directly extend
  eventPattern: 'options',
  coreImports: ["ScrollBoxRenderable", "RGBA", "extend", "type RenderContext"],
},
text: {
  baseClass: "TextRenderable", 
  compositionStrategy: 'compose',  // Must wrap in BoxRenderable
  eventPattern: 'options',
  coreImports: ["BoxRenderable", "TextRenderable", "TextAttributes", "RGBA", "extend", "type RenderContext"],
  mapOptions: (node) => ({
    content: node.content,
    fg: node.fg ? RGBA.fromHex(node.fg) : undefined,
    attributes: computeTextAttributes(node),
  }),
},
input: {
  baseClass: "InputRenderable",
  compositionStrategy: 'compose',  // Must wrap in BoxRenderable
  eventPattern: 'options',
  events: ['onInput', 'onChange', 'onSubmit'],
  coreImports: ["BoxRenderable", "InputRenderable", "RGBA", "extend", "type RenderContext"],
},
select: {
  baseClass: "SelectRenderable",
  compositionStrategy: 'compose',
  eventPattern: 'emitter',  // Uses .on('change', cb)
  events: ['change', 'select'],
  coreImports: ["BoxRenderable", "SelectRenderable", "RGBA", "extend", "type RenderContext"],
},
slider: {
  baseClass: "SliderRenderable",
  compositionStrategy: 'compose',
  eventPattern: 'emitter',
  events: ['change'],
  coreImports: ["BoxRenderable", "SliderRenderable", "RGBA", "extend", "type RenderContext"],
},
// ... etc for all types
```

**Effort:** Medium - requires careful mapping of each type's constraints.

---

### Phase 2: Class Generator Module

**Goal:** Create dedicated module for generating TypeScript class code, handling both `extend` and `compose` strategies.

**New file:** `packages/playtui/src/lib/classgen.ts`

**Structure:**

```typescript
import type { Renderable, RenderableType } from './types'
import { RENDERABLE_REGISTRY, type SerializableProp } from '../components/renderables'

// ============================================================================
// TYPE MAPPING
// ============================================================================

const PROP_TYPE_TO_TS: Record<string, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  color: 'string',
  size: 'number | "auto" | `${number}%`',
  select: 'string',
  options: 'string[]',
  borderSides: 'BorderSide[]',
  object: 'Record<string, unknown>',
}

// ============================================================================
// TEXT ATTRIBUTES HELPER (HOLE #3 FIX)
// ============================================================================

function generateTextAttributesHelper(): string {
  return `
function computeTextAttributes(opts: {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  dim?: boolean
  strikethrough?: boolean
}): number {
  let attrs = 0
  if (opts.bold) attrs |= TextAttributes.BOLD
  if (opts.italic) attrs |= TextAttributes.ITALIC
  if (opts.underline) attrs |= TextAttributes.UNDERLINE
  if (opts.dim) attrs |= TextAttributes.DIM
  if (opts.strikethrough) attrs |= TextAttributes.STRIKETHROUGH
  return attrs
}
`
}

// ============================================================================
// COMPOSITION STRATEGY (HOLE #1 FIX)
// ============================================================================

function generateComposedClass(
  node: Renderable,
  componentName: string
): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  const innerType = entry.baseClass  // e.g., "TextRenderable"
  const className = `${componentName}Renderable`
  
  // All composed classes extend BoxRenderable and contain the target type
  return `
class ${className} extends BoxRenderable {
  private _inner: ${innerType}
  
  constructor(ctx: RenderContext, options: Partial<BoxOptions> = {}) {
    super(ctx, {
      ...options,
      // Positioning from PlayTUI node
      position: "${node.position || 'relative'}",
      left: ${node.x ?? 0},
      top: ${node.y ?? 0},
    })
    
    // Create inner renderable with type-specific options
    this._inner = new ${innerType}(ctx, ${generateInnerOptions(node)})
    this.add(this._inner)
  }
  
  // Expose inner renderable for direct access
  get inner(): ${innerType} { return this._inner }
  
  ${generateComposedAccessors(node)}
  
  ${generateFocusRouting(node)}
}
`
}

function generateInnerOptions(node: Renderable): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  if (entry.mapOptions) {
    // Use type-specific mapper from registry
    return `entry.mapOptions(node)` // Actually inline the mapped values
  }
  // Fallback: extract known props
  return '{}'
}

function generateFocusRouting(node: Renderable): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  // Only generate focus routing for focusable types
  if (['input', 'textarea', 'select'].includes(node.type)) {
    return `
  focus() {
    this._inner.focus()
  }
  
  blur() {
    this._inner.blur()
  }
`
  }
  return ''
}

// ============================================================================
// EXTEND STRATEGY (for box/scrollbox only)
// ============================================================================

function generateExtendedClass(
  node: Renderable,
  componentName: string
): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  const className = `${componentName}Renderable`
  
  return `
class ${className} extends ${entry.baseClass} {
  ${generatePrivateState(node)}
  
  constructor(ctx: RenderContext, options: Partial<${entry.baseClass.replace('Renderable', '')}Options> = {}) {
    super(ctx, {
      ...options,
      ${generateConstructorProps(node)}
    })
  }
  
  ${generateAccessors(node)}
  ${generateColorAccessors(node)}
}
`
}

// ============================================================================
// COLOR HANDLING (HOLE #6 FIX)
// ============================================================================

function generateColorAccessors(node: Renderable): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  const colorProps = entry.properties.filter(p => p.type === 'color')
  
  return colorProps.map(p => `
  set${capitalize(p.key)}(value: string) {
    this.${p.key} = RGBA.fromHex(value)
    this.requestRender()
  }
  
  get${capitalize(p.key)}Hex(): string {
    return this.${p.key}?.toHex() ?? ''
  }
`).join('\n')
}

// ============================================================================
// EVENT HANDLING (HOLE #5 FIX)
// ============================================================================

function generateEventSetup(node: Renderable): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  
  if (entry.eventPattern === 'emitter') {
    // Generate .on() event subscriptions
    return (entry.events || []).map(evt => `
  on${capitalize(evt)}(callback: (...args: unknown[]) => void) {
    this._inner.on('${evt}', callback)
    return () => this._inner.off('${evt}', callback)
  }
`).join('\n')
  }
  
  // 'options' pattern - events are passed in constructor, no special methods needed
  return ''
}

// ============================================================================
// TYPE AUGMENTATION (CROSS-RECONCILER)
// ============================================================================

function generateTypeAugmentation(
  componentName: string,
  className: string
): string {
  const tagName = camelCase(componentName)
  
  // Generate augmentation for ALL THREE reconcilers
  return `
// Type augmentation for cross-reconciler support
declare module "@opentui/react" {
  interface OpenTUIComponents {
    ${tagName}: typeof ${className}
  }
}

declare module "@opentui/solid" {
  interface OpenTUIComponents {
    ${tagName}: typeof ${className}
  }
}

declare module "@opentui/vue" {
  interface OpenTUIComponents {
    ${tagName}: typeof ${className}
  }
}
`
}

// ============================================================================
// MAIN EXPORT - STRATEGY DISPATCHER
// ============================================================================

export function generateComponentClass(
  node: Renderable,
  componentName: string
): string {
  const entry = RENDERABLE_REGISTRY[node.type]
  if (!entry?.baseClass) {
    throw new Error(`No baseClass defined for type: ${node.type}`)
  }
  
  const imports = generateImports(entry)
  const className = `${componentName}Renderable`
  
  // CRITICAL: Dispatch based on composition strategy (HOLE #1 FIX)
  let classBody: string
  if (entry.compositionStrategy === 'extend') {
    // box, scrollbox - can directly extend
    classBody = generateExtendedClass(node, componentName)
  } else {
    // text, input, select, etc - must wrap in BoxRenderable
    classBody = generateComposedClass(node, componentName)
  }
  
  const registration = generateRegistration(componentName, className)
  const typeAugmentation = generateTypeAugmentation(componentName, className)
  
  // Add helper functions if needed
  const helpers = node.type === 'text' ? generateTextAttributesHelper() : ''
  
  return `${imports}
${helpers}
${classBody}

${registration}

${typeAugmentation}

export { ${className} }
`
}

// ============================================================================
// CHILDREN HANDLING
// ============================================================================

export function generateCompositeClass(
  node: Renderable,
  componentName: string
): string {
  // For nodes with children, generate class that builds child tree in constructor
  // Uses add() method to attach children
  // ...
}
```

**Effort:** Medium - new module, ~300-400 lines.

---

### Phase 3: Codegen Mode Extension

**Goal:** Add class generation mode to existing codegen.ts.

**File:** `packages/playtui/src/lib/codegen.ts`

**Changes:**

```typescript
import { generateComponentClass, generateCompositeClass } from './classgen'

export type CodegenFormat = 'jsx' | 'class'

export interface CodegenOptions {
  stripInternal?: boolean
  format?: CodegenFormat
  componentName?: string
}

// Existing function - add format switch
export function generateCode(
  node: Renderable,
  indent = 0,
  opts: CodegenOptions = {},
): string {
  const { format = 'jsx' } = opts
  
  if (format === 'class') {
    return generateComponentClass(node, opts.componentName || 'Component')
  }
  
  // ... existing JSX generation logic
}

// New: Generate complete module with class + registration
export function generateComponentModule(
  node: Renderable,
  name: string,
  opts: { includeChildren?: boolean } = {}
): string {
  if (node.children.length > 0 && opts.includeChildren) {
    return generateCompositeClass(node, name)
  }
  return generateComponentClass(node, name)
}
```

**Effort:** Small - integration layer only.

---

### Phase 4: Animation Method Generation

**Goal:** Generate animation helper methods for animatable properties.

**File:** `packages/playtui/src/lib/classgen.ts` (extension)

**Changes:**

```typescript
function generateAnimationMethods(
  type: RenderableType,
  node: Renderable
): string {
  const entry = RENDERABLE_REGISTRY[type]
  const animatableProps = entry.properties.filter(p => p.animatable)
  
  if (animatableProps.length === 0) return ''
  
  return animatableProps.map(p => `
  /**
   * Animate ${p.key} from current value to target over duration.
   * @param to Target value
   * @param duration Duration in milliseconds
   * @param ease Easing function (default: 'easeInOut')
   */
  animate${capitalize(p.key)}(
    to: number,
    duration: number,
    ease: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'easeInOut'
  ): void {
    // Animation implementation using OpenTUI timeline
    const from = this._${p.key} ?? 0
    this.animateProperty('${p.key}', from, to, duration, ease)
  }`).join('\n')
}

// Base animation helper (added to generated class)
function generateAnimatePropertyMethod(): string {
  return `
  protected animateProperty(
    prop: string,
    from: number,
    to: number,
    duration: number,
    ease: string
  ): void {
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = this.applyEasing(progress, ease)
      const value = from + (to - from) * eased
      ;(this as any)[\`_\${prop}\`] = value
      this.requestRender()
      if (progress < 1) requestAnimationFrame(animate)
    }
    animate()
  }
  
  protected applyEasing(t: number, ease: string): number {
    switch (ease) {
      case 'linear': return t
      case 'easeIn': return t * t
      case 'easeOut': return t * (2 - t)
      case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      default: return t
    }
  }`
}
```

**Effort:** Medium - animation logic integration.

---

### Phase 5: UI Integration

**Goal:** Add "Export as Component" option to PlayTUI UI.

**Files:**
- `packages/playtui/src/components/ui/RenderPreviewModal.tsx` (if exists)
- `packages/playtui/src/components/pages/Code.tsx`

**Changes:**

```typescript
// Add export format toggle
const [exportFormat, setExportFormat] = useState<'jsx' | 'class'>('jsx')

// Generate code based on format
const code = useMemo(() => {
  if (exportFormat === 'class') {
    return generateComponentModule(selectedNode, componentName)
  }
  return generateCode(selectedNode)
}, [selectedNode, exportFormat, componentName])
```

**Effort:** Small - UI toggle addition.

---

### Phase 6: Composite Component Support

**Goal:** Handle components with children - both static (baked in) and dynamic (JSX children).

**File:** `packages/playtui/src/lib/classgen.ts` (extension)

**Two Strategies:**

#### Strategy A: Static Children (Baked In)

For components where children are part of the component definition:

```typescript
function generateCompositeClass(
  node: Renderable,
  componentName: string
): string {
  const children = node.children
  
  // Generate child instance declarations
  const childDeclarations = children.map((child, i) => {
    const childName = child.name || `child${i}`
    return `  private _${camelCase(childName)}: ${getClassName(child.type)}`
  })
  
  // Generate child instantiation in constructor
  const childInstantiations = children.map((child, i) => {
    const childName = child.name || `child${i}`
    const childClass = getClassName(child.type)
    const childOptions = extractOptions(child)
    return `
    this._${camelCase(childName)} = new ${childClass}(ctx, ${childOptions})
    this.add(this._${camelCase(childName)})`
  })
  
  // Generate child accessors for imperative control
  const childAccessors = children.map((child, i) => {
    const childName = child.name || `child${i}`
    return `
  get ${camelCase(childName)}(): ${getClassName(child.type)} {
    return this._${camelCase(childName)}
  }`
  })
  
  // ... compose into full class
}
```

#### Strategy B: Dynamic Children (Pass-Through)

For components that accept JSX children at usage time:

```typescript
// Generated class extends BoxRenderable - children work automatically
// The reconciler handles <myComponent><text>child</text></myComponent>
// by calling add() internally. No special handling needed.

class MyPanelRenderable extends BoxRenderable {
  // Just extend BoxRenderable - children support is inherited
}

// Usage in React/Solid:
<myPanel border>
  <text>Dynamic child</text>
  {items.map(i => <box key={i}>{i}</box>)}
</myPanel>
```

**Critical insight from validation:** Extending `BoxRenderable` automatically provides children support. The reconciler handles JSX children by calling `add()` internally.

**Effort:** Medium - recursive tree handling for static children.

---

## File Changes Summary

| File | Action | Effort |
|------|--------|--------|
| `components/renderables/index.ts` | Modify - add baseClass, coreImports | Small |
| `lib/classgen.ts` | Create - class generation module | Medium |
| `lib/codegen.ts` | Modify - add format option | Small |
| `components/pages/Code.tsx` | Modify - add export toggle | Small |
| `lib/types.ts` | No changes needed | - |

---

## Testing Strategy

### Unit Tests

```typescript
// classgen.test.ts
describe('generateComponentClass', () => {
  it('generates valid TypeScript for box', () => {
    const node = createBoxNode({ width: 40, backgroundColor: '#fff' })
    const code = generateComponentClass(node, 'MyBox')
    
    expect(code).toContain('class MyBoxRenderable extends BoxRenderable')
    expect(code).toContain('set width(value:')
    expect(code).toContain('extend({ myBox: MyBoxRenderable })')
  })
  
  it('includes animation methods for animatable props', () => {
    const node = createBoxNode({ width: 40 })
    const code = generateComponentClass(node, 'AnimatedBox')
    
    expect(code).toContain('animateWidth(')
    expect(code).toContain('animateHeight(')
  })
  
  it('generates composite class for nodes with children', () => {
    const node = createBoxNode({
      children: [createTextNode({ content: 'Hello' })]
    })
    const code = generateCompositeClass(node, 'Panel')
    
    expect(code).toContain('this.add(')
  })
})
```

### Integration Tests

1. Generate class from PlayTUI node
2. Compile with TypeScript
3. Instantiate in test React app
4. Verify imperative API works
5. Test animation methods

---

## Migration Path

### Backward Compatibility

- Default `format` remains `'jsx'` - no breaking changes
- New `'class'` format is opt-in
- Existing projects continue working unchanged

### Rollout Phases

1. **Alpha:** Class generation behind feature flag
2. **Beta:** Add to export modal as option
3. **GA:** Make default for "Export as Component"

---

## Open Questions

1. **Naming convention:** Should generated classes use `XxxRenderable` or `XxxComponent` suffix?
   - **Recommendation:** Use `XxxRenderable` to match OpenTUI conventions.

2. **Module format:** CommonJS, ESM, or both?
   - **Recommendation:** ESM only - OpenTUI is ESM-first.

3. **TypeScript target:** ES2020+ or provide multiple targets?
   - **Recommendation:** ES2020+ (matches OpenTUI requirements).

4. **Animation integration:** Use OpenTUI's `useTimeline` or implement standalone?
   - **Recommendation:** Standalone for class-based, `useTimeline` is hook-based (React/Solid only).

5. **Vue naming:** Vue uses `<nameRenderable>` suffix - should we generate Vue-specific JSX examples?
   - **Recommendation:** Document the difference, don't generate separate code.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenTUI API changes | Generated code breaks | Pin to specific OpenTUI version, add version check |
| Complex nested trees | Explosion of generated code | Limit depth, offer "flatten" option |
| Event handling edge cases | Callbacks not firing | Use constructor options pattern (verified working) |
| Vue reconciler unmaintained | Vue support gaps | Document as "experimental", focus React/Solid |
| **Only BoxRenderable extensible** | Cannot extend text/input/select | **Use composition strategy - wrap in BoxRenderable** |
| **Constructor option shapes differ** | Type-specific mapping needed | **Add mapOptions to registry per type** |
| **TextAttributes bitmask** | Boolean flags need conversion | **Add computeTextAttributes() helper** |
| **Focus routing in composites** | .focus() on container fails | **Generate focus delegation to inner renderable** |
| **RGBA vs string colors** | API inconsistency | **Generate both setX(string) and getXHex() methods** |
| **Event patterns differ** | .on() vs constructor options | **Registry tracks eventPattern, generate accordingly** |

---

## Dependencies

- OpenTUI core types: `BoxRenderable`, `TextRenderable`, etc.
- OpenTUI `extend()` function
- TypeScript for generated output validation

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Registry Enhancement | 1 day | None |
| Phase 2: Class Generator Module | 3-4 days | Phase 1 |
| Phase 3: Codegen Mode Extension | 1 day | Phase 2 |
| Phase 4: Animation Methods | 2 days | Phase 2 |
| Phase 5: UI Integration | 1 day | Phase 3 |
| Phase 6: Composite Support | 2-3 days | Phase 2 |

**Total:** ~10-12 days

---

## Success Criteria

1. Generated classes compile without errors
2. Components work in React, Solid, and Vue apps
3. Imperative API correctly updates rendered output
4. Animation methods produce smooth transitions
5. Composite components correctly manage children
6. Existing JSX export remains functional
