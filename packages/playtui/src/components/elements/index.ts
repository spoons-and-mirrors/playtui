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
  },
}

// All element types
export const ELEMENT_TYPES = Object.keys(ELEMENT_REGISTRY) as ElementType[]
