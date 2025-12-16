// Renderable-specific components (defaults are internal to registry)
export { BoxRenderer, BoxBorderProperties } from "./box"
export { TextRenderer, TextProperties } from "./text"
export { InputRenderer, InputProperties } from "./input"
export { TextareaRenderer, TextareaProperties } from "./textarea"
export { SelectRenderer, SelectProperties } from "./select"
export { ScrollboxRenderer, ScrollboxProperties } from "./scrollbox"
export { SliderRenderer, SliderProperties } from "./slider"
export { AsciiFontRenderer, AsciiFontProperties } from "./asciifont"
export { TabSelectRenderer, TabSelectProperties } from "./tabselect"

import { BoxRenderer, BoxBorderProperties, BOX_DEFAULTS } from "./box"
import { TextRenderer, TextProperties, TEXT_DEFAULTS } from "./text"
import { InputRenderer, InputProperties, INPUT_DEFAULTS } from "./input"
import { TextareaRenderer, TextareaProperties, TEXTAREA_DEFAULTS } from "./textarea"
import { SelectRenderer, SelectProperties, SELECT_DEFAULTS } from "./select"
import { ScrollboxRenderer, ScrollboxProperties, SCROLLBOX_DEFAULTS } from "./scrollbox"
import { SliderRenderer, SliderProperties, SLIDER_DEFAULTS } from "./slider"
import { AsciiFontRenderer, AsciiFontProperties, ASCIIFONT_DEFAULTS } from "./asciifont"
import { TabSelectRenderer, TabSelectProperties, TABSELECT_DEFAULTS } from "./tabselect"
import type { RenderableType, RenderableNode, BoxNode, ScrollboxNode } from "../../lib/types"
import type { ColorPalette } from "../../lib/projectTypes"

// Renderer props shared by all renderable renderers
export interface RendererProps {
  node: RenderableNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd?: () => void
  children?: React.ReactNode
}

// Properties panel props shared by all renderable property panels
export interface RenderablePropertiesProps {
  node: RenderableNode
  onUpdate: (updates: Partial<RenderableNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  // Palette support (optional - not all renderables need it)
  palettes?: ColorPalette[]
  activePaletteIndex?: number
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
  // Color picking support
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

// Property schema - SINGLE SOURCE OF TRUTH for both UI and serialization
// Consolidates property metadata that was previously split between PROPERTIES and RENDERABLE_REGISTRY
export type SerializablePropType = "string" | "boolean" | "number" | "color" | "options" | "size" | "select" | "toggle" | "borderSides"

export type PropertySection =
  | "dimensions"
  | "flexContainer"
  | "flexItem"
  | "padding"
  | "margin"
  | "position"
  | "overflow"
  | "visibility"
  | "background"
  | "border"
  | "text"
  | "input"
  | "textarea"
  | "select"
  | "slider"
  | "asciiFont"
  | "tabSelect"
  | "scrollbox"
 
interface PropertySectionMeta {
  id: PropertySection
  label: string
  defaultExpanded: boolean
  ownerTypes?: RenderableType[]
}

export const PROPERTY_SECTIONS: PropertySectionMeta[] = [
  {
    id: "dimensions",
    label: "◫ Dimensions",
    defaultExpanded: true,
  },
  {
    id: "position",
    label: "◎ Position",
    defaultExpanded: false,
  },
  {
    id: "margin",
    label: "⊟ Margin",
    defaultExpanded: false,
  },
  {
    id: "padding",
    label: "⊞ Padding",
    defaultExpanded: false,
  },
  {
    id: "flexContainer",
    label: "⬓ Layout",
    defaultExpanded: true,
  },
  {
    id: "flexItem",
    label: "▧ Flex Item",
    defaultExpanded: false,
  },
  {
    id: "background",
    label: "▦ Fill",
    defaultExpanded: true,
  },
  {
    id: "border",
    label: "▢ Border",
    defaultExpanded: true,
    ownerTypes: ["box", "scrollbox"],
  },
  {
    id: "overflow",
    label: "⋯ Overflow",
    defaultExpanded: false,
  },
  {
    id: "visibility",
    label: "◉ Display",
    defaultExpanded: false,
  },
  {
    id: "text",
    label: "T Text",
    defaultExpanded: true,
    ownerTypes: ["text"],
  },
  {
    id: "input",
    label: "▭ Input",
    defaultExpanded: true,
    ownerTypes: ["input"],
  },
  {
    id: "textarea",
    label: "▯ Textarea",
    defaultExpanded: false,
    ownerTypes: ["textarea"],
  },
  {
    id: "select",
    label: "≡ Select",
    defaultExpanded: false,
    ownerTypes: ["select"],
  },
  {
    id: "slider",
    label: "─ Slider",
    defaultExpanded: false,
    ownerTypes: ["slider"],
  },
  {
    id: "asciiFont",
    label: "A ASCII Font",
    defaultExpanded: false,
    ownerTypes: ["ascii-font"],
  },
  {
    id: "tabSelect",
    label: "◰ Tabs",
    defaultExpanded: false,
    ownerTypes: ["tab-select"],
  },
  {
    id: "scrollbox",
    label: "↕ Scrollbox",
    defaultExpanded: false,
    ownerTypes: ["scrollbox"],
  },
]

export interface SerializableProp {

  key: string
  type: SerializablePropType
  // UI fields (for property panel rendering)
  label?: string              // Display label in property panel
  section?: PropertySection   // Which section to group under
  options?: string[]          // For select type
  min?: number                // For number type
  max?: number                // For number type
  // Serialization fields (for codegen/parseCode)
  default?: unknown           // Skip serialization if value equals default
  escape?: boolean            // Escape string for JSX (quotes, special chars)
  jsxBoolean?: boolean        // Serialize as standalone prop when true, {false} when false
  jsxBooleanDefault?: boolean // The default value for jsxBoolean props (used to determine when to omit)
  styleProp?: string          // If set, this prop belongs in the style object with this key (e.g. "width", "left")
  animatable?: boolean        // Can this property be animated?
}

// =============================================================================
// SHARED PROPERTY DEFINITIONS - Reusable across renderable types
// =============================================================================

// Dimensions - common to most elements
const DIMENSION_PROPS: SerializableProp[] = [
  { key: "width", label: "Width", type: "size", section: "dimensions", styleProp: "width", animatable: true },
  { key: "height", label: "Height", type: "size", section: "dimensions", styleProp: "height", animatable: true },
]

// Extended dimensions - for containers and inputs
const EXTENDED_DIMENSION_PROPS: SerializableProp[] = [
  ...DIMENSION_PROPS,
  { key: "minWidth", label: "Min W", type: "number", min: 0, max: 200, section: "dimensions", styleProp: "minWidth", animatable: true },
  { key: "maxWidth", label: "Max W", type: "number", min: 0, max: 200, section: "dimensions", styleProp: "maxWidth", animatable: true },
  { key: "minHeight", label: "Min H", type: "number", min: 0, max: 100, section: "dimensions", styleProp: "minHeight", animatable: true },
  { key: "maxHeight", label: "Max H", type: "number", min: 0, max: 100, section: "dimensions", styleProp: "maxHeight", animatable: true },
  { key: "aspectRatio", label: "Ratio", type: "number", min: 0, max: 10, section: "dimensions", styleProp: "aspectRatio", animatable: true },
]

// Flex container props
const FLEX_CONTAINER_PROPS: SerializableProp[] = [
  { key: "flexDirection", label: "Direction", type: "select", options: ["row", "column"], section: "flexContainer", styleProp: "flexDirection" },
  { key: "flexWrap", label: "Wrap", type: "select", options: ["no-wrap", "wrap"], section: "flexContainer", styleProp: "flexWrap" },
  { key: "justifyContent", label: "Justify", type: "select", options: ["flex-start", "center", "flex-end", "space-between", "space-around"], section: "flexContainer", styleProp: "justifyContent" },
  { key: "alignItems", label: "Align", type: "select", options: ["flex-start", "center", "flex-end", "stretch"], section: "flexContainer", styleProp: "alignItems" },
  { key: "alignContent", label: "Content", type: "select", options: ["flex-start", "center", "flex-end", "stretch", "space-between", "space-around"], section: "flexContainer", styleProp: "alignContent" },
  { key: "gap", label: "Gap", type: "number", min: 0, max: 20, section: "flexContainer", styleProp: "gap", animatable: true },
  { key: "rowGap", label: "Row Gap", type: "number", min: 0, max: 20, section: "flexContainer", styleProp: "rowGap", animatable: true },
  { key: "columnGap", label: "Col Gap", type: "number", min: 0, max: 20, section: "flexContainer", styleProp: "columnGap", animatable: true },
]

// Flex item props
const FLEX_ITEM_PROPS: SerializableProp[] = [
  { key: "flexGrow", label: "Grow", type: "number", min: 0, max: 10, section: "flexItem", styleProp: "flexGrow", animatable: true },
  { key: "flexShrink", label: "Shrink", type: "number", min: 0, max: 10, section: "flexItem", styleProp: "flexShrink", animatable: true },
  { key: "flexBasis", label: "Basis", type: "size", section: "flexItem", styleProp: "flexBasis" },
  { key: "alignSelf", label: "Align Self", type: "select", options: ["auto", "flex-start", "center", "flex-end", "stretch"], section: "flexItem", styleProp: "alignSelf" },
]

// Padding props
const PADDING_PROPS: SerializableProp[] = [
  { key: "padding", label: "All", type: "number", min: 0, max: 20, section: "padding", styleProp: "padding" },
  { key: "paddingTop", label: "Top", type: "number", min: 0, max: 20, section: "padding", styleProp: "paddingTop", animatable: true },
  { key: "paddingRight", label: "Right", type: "number", min: 0, max: 20, section: "padding", styleProp: "paddingRight", animatable: true },
  { key: "paddingBottom", label: "Bottom", type: "number", min: 0, max: 20, section: "padding", styleProp: "paddingBottom", animatable: true },
  { key: "paddingLeft", label: "Left", type: "number", min: 0, max: 20, section: "padding", styleProp: "paddingLeft", animatable: true },
]

// Margin props
const MARGIN_PROPS: SerializableProp[] = [
  { key: "margin", label: "All", type: "number", min: 0, max: 20, section: "margin", styleProp: "margin" },
  { key: "marginTop", label: "Top", type: "number", min: 0, max: 20, section: "margin", styleProp: "marginTop", animatable: true },
  { key: "marginRight", label: "Right", type: "number", min: 0, max: 20, section: "margin", styleProp: "marginRight", animatable: true },
  { key: "marginBottom", label: "Bottom", type: "number", min: 0, max: 20, section: "margin", styleProp: "marginBottom", animatable: true },
  { key: "marginLeft", label: "Left", type: "number", min: 0, max: 20, section: "margin", styleProp: "marginLeft", animatable: true },
]

// Position props - universal
const POSITION_PROPS: SerializableProp[] = [
  { key: "position", label: "Position", type: "select", options: ["relative", "absolute"], section: "position", styleProp: "position" },
  { key: "x", label: "X", type: "number", min: -100, max: 200, section: "position", styleProp: "left", animatable: true },
  { key: "y", label: "Y", type: "number", min: -100, max: 200, section: "position", styleProp: "top", animatable: true },
  { key: "zIndex", label: "Z", type: "number", min: -100, max: 100, section: "position", styleProp: "zIndex", animatable: true },
]

// Overflow prop
const OVERFLOW_PROPS: SerializableProp[] = [
  { key: "overflow", label: "Overflow", type: "select", options: ["visible", "hidden", "scroll"], section: "overflow", styleProp: "overflow" },
]

// Background color prop
const BACKGROUND_PROPS: SerializableProp[] = [
  { key: "backgroundColor", label: "BG Color", type: "color", section: "background", styleProp: "backgroundColor" },
]

// Renderable capability metadata
export interface RenderableCapabilities {
  // Layout capabilities
  supportsChildren: boolean
  supportsBorder: boolean
  supportsPadding: boolean
  supportsMargin: boolean
  supportsPositioning: boolean
  supportsFlexContainer: boolean
  supportsFlexItem: boolean
  
  // Visual capabilities
  supportsBackgroundColor: boolean
  supportsTextStyling: boolean
}

// Registry entry type
export interface RenderableRegistryEntry {
  type: RenderableType
  label: string
  icon?: string
  addModeKey?: string  // Single character key for adding this renderable in add mode (e.g., "b" for box)
  Renderer: (props: RendererProps) => React.ReactNode
  Properties: ((props: RenderablePropertiesProps) => React.ReactNode) | null
  defaults: Partial<RenderableNode>
  capabilities: RenderableCapabilities
  properties: SerializableProp[]  // Renderable-specific props for codegen/parseCode
}

// Central registry - single source of truth for all renderable types
export const RENDERABLE_REGISTRY: Record<RenderableType, RenderableRegistryEntry> = {
  box: {
    type: "box",
    label: "Box",
    icon: "▢",
    addModeKey: "b",
    Renderer: BoxRenderer,
    Properties: BoxBorderProperties,
    defaults: BOX_DEFAULTS,
    capabilities: {
      supportsChildren: true,
      supportsBorder: true,
      supportsPadding: true,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: true,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...EXTENDED_DIMENSION_PROPS,
      ...FLEX_CONTAINER_PROPS,
      ...FLEX_ITEM_PROPS,
      ...PADDING_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      ...OVERFLOW_PROPS,
      ...BACKGROUND_PROPS,
      // Box-specific border props are handled via BoxBorderProperties component
    ],
  },
  text: {
    type: "text",
    label: "Text",
    icon: "T",
    addModeKey: "t",
    Renderer: TextRenderer,
    Properties: TextProperties,
    defaults: TEXT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: true,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: false,
      supportsTextStyling: true,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...PADDING_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Text-specific props
      { key: "fg", type: "color", label: "Color", section: "text" },
      { key: "bg", type: "color", label: "BG", section: "text" },
      { key: "wrapMode", type: "string", default: "none" },
      { key: "selectable", type: "boolean", jsxBoolean: true },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  input: {
    type: "input",
    label: "Input",
    icon: "⌨",
    addModeKey: "i",
    Renderer: InputRenderer,
    Properties: InputProperties,
    defaults: INPUT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...EXTENDED_DIMENSION_PROPS.filter(p => p.key !== "aspectRatio"),
      ...FLEX_ITEM_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      ...BACKGROUND_PROPS,
      // Input-specific props
      { key: "placeholder", type: "string", escape: true },
      { key: "placeholderColor", type: "color" },
      { key: "maxLength", type: "number" },
      { key: "textColor", type: "color" },
      { key: "focusedTextColor", type: "color" },
      { key: "focusedBackgroundColor", type: "color" },
      { key: "cursorColor", type: "color" },
      { key: "cursorStyle", type: "string", default: "block" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  textarea: {
    type: "textarea",
    label: "Textarea",
    icon: "≡",
    addModeKey: "x",
    Renderer: TextareaRenderer,
    Properties: TextareaProperties,
    defaults: TEXTAREA_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Textarea-specific props
      { key: "placeholder", type: "string", escape: true },
      { key: "placeholderColor", type: "color" },
      { key: "initialValue", type: "string", escape: true },
      { key: "textColor", type: "color" },
      { key: "focusedTextColor", type: "color" },
      { key: "backgroundColor", type: "color" },
      { key: "focusedBackgroundColor", type: "color" },
      { key: "cursorColor", type: "color" },
      { key: "cursorStyle", type: "string", default: "block" },
      { key: "blinking", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
      { key: "showCursor", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
      { key: "scrollMargin", type: "number" },
      { key: "tabIndicatorColor", type: "color" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  select: {
    type: "select",
    label: "Select",
    icon: "▼",
    addModeKey: "e",
    Renderer: SelectRenderer,
    Properties: SelectProperties,
    defaults: SELECT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Select-specific props
      { key: "options", type: "options" },
      { key: "showScrollIndicator", type: "boolean", jsxBoolean: true },
      { key: "showDescription", type: "boolean", jsxBoolean: true },
      { key: "wrapSelection", type: "boolean", jsxBoolean: true },
      { key: "itemSpacing", type: "number" },
      { key: "fastScrollStep", type: "number", default: 5 },
      { key: "backgroundColor", type: "color" },
      { key: "textColor", type: "color" },
      { key: "selectedBackgroundColor", type: "color" },
      { key: "selectedTextColor", type: "color" },
      { key: "descriptionColor", type: "color" },
      { key: "selectedDescriptionColor", type: "color" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  scrollbox: {
    type: "scrollbox",
    label: "Scrollbox",
    icon: "⇟",
    addModeKey: "s",
    Renderer: ScrollboxRenderer,
    Properties: null,
    defaults: SCROLLBOX_DEFAULTS,
    capabilities: {
      supportsChildren: true,
      supportsBorder: true,
      supportsPadding: true,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: true,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...EXTENDED_DIMENSION_PROPS,
      ...FLEX_CONTAINER_PROPS,
      ...FLEX_ITEM_PROPS,
      ...PADDING_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      ...OVERFLOW_PROPS,
      ...BACKGROUND_PROPS,
      // Scrollbox-specific props
      { key: "stickyScroll", type: "boolean", jsxBoolean: true },
      { key: "stickyStart", type: "string", default: "bottom" },
      { key: "scrollX", type: "boolean", jsxBoolean: true },
      { key: "scrollY", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
      { key: "viewportCulling", type: "boolean", jsxBoolean: true },
    ],
  },
  slider: {
    type: "slider",
    label: "Slider",
    icon: "▪",
    addModeKey: "l",
    Renderer: SliderRenderer,
    Properties: SliderProperties,
    defaults: SLIDER_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Slider-specific props
      { key: "orientation", type: "string" },
      { key: "value", type: "number" },
      { key: "min", type: "number" },
      { key: "max", type: "number" },
      { key: "viewPortSize", type: "number" },
      { key: "backgroundColor", type: "color" },
      { key: "foregroundColor", type: "color" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  "ascii-font": {
    type: "ascii-font",
    label: "ASCII Font",
    icon: "Ⓐ",
    addModeKey: "f",
    Renderer: AsciiFontRenderer,
    Properties: null,
    defaults: ASCIIFONT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: false,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // AsciiFont-specific props
      { key: "text", type: "string", escape: true },
      { key: "font", type: "string" },
      { key: "color", type: "color" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  "tab-select": {
    type: "tab-select",
    label: "Tab Select",
    icon: "⊞",
    addModeKey: "w",
    Renderer: TabSelectRenderer,
    Properties: TabSelectProperties,
    defaults: TABSELECT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // TabSelect-specific props
      { key: "options", type: "options" },
      { key: "tabWidth", type: "number" },
      { key: "showUnderline", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
      { key: "wrapSelection", type: "boolean", jsxBoolean: true },
      { key: "backgroundColor", type: "color" },
      { key: "textColor", type: "color" },
      { key: "selectedBackgroundColor", type: "color" },
      { key: "selectedTextColor", type: "color" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
}

// All renderable types
export const RENDERABLE_TYPES = Object.keys(RENDERABLE_REGISTRY) as RenderableType[]

// =============================================================================
// TYPE GUARDS - Derived from registry (single source of truth)
// =============================================================================

/**
 * Check if a node supports children. Derived from RENDERABLE_REGISTRY.capabilities.
 * This replaces the hardcoded check that was previously in types.ts.
 */
export function isContainerNode(node: RenderableNode): node is BoxNode | ScrollboxNode {
  return RENDERABLE_REGISTRY[node.type]?.capabilities.supportsChildren === true
}

/**
 * Get all renderable types that have add-mode keybindings.
 * Returns array of [renderableType, key] tuples.
 * Derived from RENDERABLE_REGISTRY.addModeKey (single source of truth).
 */
export function getAddModeBindings(): Array<[RenderableType, string]> {
  return Object.entries(RENDERABLE_REGISTRY)
    .filter(([, entry]) => entry.addModeKey)
    .map(([, entry]) => [entry.type, entry.addModeKey!])
}
