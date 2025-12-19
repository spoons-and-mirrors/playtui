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
| `requestRender()` triggers re-render | ✅ VERIFIED | Standard Renderable pattern |

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

**Goal:** Extend `RENDERABLE_REGISTRY` with metadata needed for class generation.

**File:** `packages/playtui/src/components/renderables/index.ts`

**Changes:**

```typescript
export interface RenderableRegistryEntry {
  // ... existing fields
  
  // NEW: Class generation metadata
  baseClass: string                    // e.g., "BoxRenderable"
  coreImports: string[]                // e.g., ["BoxRenderable", "RGBA", "extend"]
  apiMethods?: ApiMethodDef[]          // Custom methods beyond property setters
}

interface ApiMethodDef {
  name: string
  params: { name: string; type: string }[]
  returnType: string
  body: string                         // Template for method body
}
```

**Registry updates:**

```typescript
box: {
  // ... existing
  baseClass: "BoxRenderable",
  coreImports: ["BoxRenderable", "RGBA", "extend", "type RenderContext", "type BoxOptions"],
},
text: {
  baseClass: "TextRenderable", 
  coreImports: ["TextRenderable", "RGBA", "extend", "type RenderContext", "type TextOptions"],
},
scrollbox: {
  baseClass: "ScrollBoxRenderable",
  coreImports: ["ScrollBoxRenderable", "RGBA", "extend", "type RenderContext", "type ScrollBoxOptions"],
},
// ... etc for all types
```

**Effort:** Small - metadata additions only, no logic changes.

---

### Phase 2: Class Generator Module

**Goal:** Create dedicated module for generating TypeScript class code.

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
// API INTERFACE GENERATION
// ============================================================================

function generateApiInterface(
  name: string,
  type: RenderableType,
  node: Renderable
): string {
  const entry = RENDERABLE_REGISTRY[type]
  const props = entry.properties.filter(p => p.type !== 'header')
  
  const setters = props.map(p => 
    `  set${capitalize(p.key)}(value: ${PROP_TYPE_TO_TS[p.type] || 'unknown'}): void`
  )
  const getters = props.map(p =>
    `  get${capitalize(p.key)}(): ${PROP_TYPE_TO_TS[p.type] || 'unknown'}`
  )
  
  return `export interface ${name}API {\n${setters.join('\n')}\n${getters.join('\n')}\n}`
}

// ============================================================================
// CLASS GENERATION
// ============================================================================

function generateClassBody(
  name: string,
  type: RenderableType,
  node: Renderable
): string {
  const entry = RENDERABLE_REGISTRY[type]
  const props = entry.properties.filter(p => p.type !== 'header')
  
  // Private state declarations
  const privateState = props
    .map(p => {
      const value = (node as any)[p.key]
      const defaultVal = formatDefaultValue(p, value)
      return `  private _${p.key}${defaultVal !== undefined ? ` = ${defaultVal}` : ''}`
    })
    .join('\n')
  
  // Getters and setters
  const accessors = props.map(p => `
  get ${p.key}(): ${PROP_TYPE_TO_TS[p.type] || 'unknown'} {
    return this._${p.key}
  }
  
  set ${p.key}(value: ${PROP_TYPE_TO_TS[p.type] || 'unknown'}) {
    this._${p.key} = value
    this.requestRender()
  }`).join('\n')
  
  return `${privateState}\n${accessors}`
}

// ============================================================================
// CONSTRUCTOR GENERATION
// ============================================================================

function generateConstructor(
  type: RenderableType,
  node: Renderable
): string {
  const entry = RENDERABLE_REGISTRY[type]
  const optionsType = `${entry.baseClass.replace('Renderable', '')}Options`
  
  // Extract non-default values from node
  const initialProps = extractNonDefaultProps(type, node)
  
  return `
  constructor(ctx: RenderContext, options: Partial<${optionsType}> = {}) {
    super(ctx, {
      ...options,
${initialProps.map(([k, v]) => `      ${k}: ${v},`).join('\n')}
    })
  }`
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
// MAIN EXPORT
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
  const apiInterface = generateApiInterface(componentName, node.type, node)
  const className = `${componentName}Renderable`
  const classBody = generateClassBody(componentName, node.type, node)
  const constructor = generateConstructor(node.type, node)
  const registration = generateRegistration(componentName, className)
  const typeAugmentation = generateTypeAugmentation(componentName, className)
  
  return `${imports}

${apiInterface}

class ${className} extends ${entry.baseClass} implements ${componentName}API {
${classBody}
${constructor}
}

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
