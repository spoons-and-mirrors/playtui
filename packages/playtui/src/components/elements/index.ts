// Element-specific components (defaults are internal to registry)
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
import type { ElementType, ElementNode } from "../../lib/types"
import type { ColorPalette } from "../../lib/projectTypes"

// Renderer props shared by all element renderers
export interface RendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd?: () => void
  children?: React.ReactNode
}

// Properties panel props shared by all element property panels
export interface ElementPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  // Palette support (optional - not all elements need it)
  palettes?: ColorPalette[]
  activePaletteIndex?: number
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
  // Color picking support
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

// Property schema for serialization/deserialization (codegen + parseCode)
// This is the single source of truth for element-specific props
export type SerializablePropType = "string" | "boolean" | "number" | "color" | "options"

export interface SerializableProp {
  key: string
  type: SerializablePropType
  default?: unknown           // Skip serialization if value equals default
  escape?: boolean            // Escape string for JSX (quotes, special chars)
  jsxBoolean?: boolean        // Serialize as standalone prop when true, {false} when false
  jsxBooleanDefault?: boolean // The default value for jsxBoolean props (used to determine when to omit)
}

// Element capability metadata
export interface ElementCapabilities {
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
  
  // Animation
  animatableProperties: readonly string[]
}

// Registry entry type
export interface ElementRegistryEntry {
  type: ElementType
  label: string
  icon?: string
  Renderer: (props: RendererProps) => React.ReactNode
  Properties: ((props: ElementPropertiesProps) => React.ReactNode) | null
  defaults: Partial<ElementNode>
  capabilities: ElementCapabilities
  properties: SerializableProp[]  // Element-specific props for codegen/parseCode
}

// Central registry - single source of truth for all element types
export const ELEMENT_REGISTRY: Record<ElementType, ElementRegistryEntry> = {
  box: {
    type: "box",
    label: "Box",
    icon: "▢",
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gap", "rowGap", "columnGap", "flexGrow", "flexShrink"],
    },
    properties: [
      // Box-specific props are handled in codegen's container logic (border, title, backgroundColor, visible)
      // This array is for element-specific NON-style props only
    ],
  },
  text: {
    type: "text",
    label: "Text",
    icon: "T",
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
    },
    properties: [
      { key: "fg", type: "color" },
      { key: "bg", type: "color" },
      { key: "wrapMode", type: "string", default: "none" },
      { key: "selectable", type: "boolean", jsxBoolean: true },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  input: {
    type: "input",
    label: "Input",
    icon: "⌨",
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft"],
    },
    properties: [
      { key: "placeholder", type: "string", escape: true },
      { key: "placeholderColor", type: "color" },
      { key: "maxLength", type: "number" },
      { key: "textColor", type: "color" },
      { key: "focusedTextColor", type: "color" },
      { key: "backgroundColor", type: "color" },
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft"],
    },
    properties: [
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft"],
    },
    properties: [
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
    label: "Scroll",
    icon: "☰",
    Renderer: ScrollboxRenderer,
    Properties: ScrollboxProperties,
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gap", "rowGap", "columnGap", "flexGrow", "flexShrink"],
    },
    properties: [
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
    icon: "─●─",
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft"],
    },
    properties: [
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
    label: "AsciiFont",
    icon: "Aa",
    Renderer: AsciiFontRenderer,
    Properties: AsciiFontProperties,
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft"],
    },
    properties: [
      { key: "text", type: "string", escape: true },
      { key: "font", type: "string" },
      { key: "color", type: "color" },
      { key: "visible", type: "boolean", jsxBoolean: true, jsxBooleanDefault: true },
    ],
  },
  "tab-select": {
    type: "tab-select",
    label: "Tabs",
    icon: "⎔",
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
      animatableProperties: ["x", "y", "zIndex", "marginTop", "marginRight", "marginBottom", "marginLeft"],
    },
    properties: [
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

// All element types
export const ELEMENT_TYPES = Object.keys(ELEMENT_REGISTRY) as ElementType[]
