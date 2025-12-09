// Element-specific components and defaults
export { BoxRenderer, BoxBorderProperties, BOX_PROPERTY_KEYS, BOX_DEFAULTS } from "./box"
export { TextRenderer, TextProperties, TEXT_PROPERTY_KEYS, TEXT_DEFAULTS } from "./text"
export { InputRenderer, InputProperties, INPUT_PROPERTY_KEYS, INPUT_DEFAULTS } from "./input"
export { TextareaRenderer, TextareaProperties, TEXTAREA_PROPERTY_KEYS, TEXTAREA_DEFAULTS } from "./textarea"
export { SelectRenderer, SelectProperties, SELECT_PROPERTY_KEYS, SELECT_DEFAULTS } from "./select"
export { ScrollboxRenderer, ScrollboxProperties, SCROLLBOX_PROPERTY_KEYS, SCROLLBOX_DEFAULTS } from "./scrollbox"
export { SliderRenderer, SliderProperties, SLIDER_PROPERTY_KEYS, SLIDER_DEFAULTS } from "./slider"
export { AsciiFontRenderer, AsciiFontProperties, ASCIIFONT_PROPERTY_KEYS, ASCIIFONT_DEFAULTS } from "./asciifont"
export { TabSelectRenderer, TabSelectProperties, TABSELECT_PROPERTY_KEYS, TABSELECT_DEFAULTS } from "./tabselect"
export { DraggableWrapper } from "./DraggableWrapper"

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
}

// Registry entry type
export interface ElementRegistryEntry {
  Renderer: (props: RendererProps) => React.ReactNode
  Properties: ((props: ElementPropertiesProps) => React.ReactNode) | null
  defaults: Partial<ElementNode>
  hasChildren: boolean
  label: string  // Display name for UI
}

// Central registry - single source of truth for all element types
export const ELEMENT_REGISTRY: Record<ElementType, ElementRegistryEntry> = {
  box: {
    Renderer: BoxRenderer,
    Properties: BoxBorderProperties,
    defaults: BOX_DEFAULTS,
    hasChildren: true,
    label: "Box",
  },
  text: {
    Renderer: TextRenderer,
    Properties: TextProperties,
    defaults: TEXT_DEFAULTS,
    hasChildren: false,
    label: "Text",
  },
  input: {
    Renderer: InputRenderer,
    Properties: InputProperties,
    defaults: INPUT_DEFAULTS,
    hasChildren: false,
    label: "Input",
  },
  textarea: {
    Renderer: TextareaRenderer,
    Properties: TextareaProperties,
    defaults: TEXTAREA_DEFAULTS,
    hasChildren: false,
    label: "Textarea",
  },
  select: {
    Renderer: SelectRenderer,
    Properties: SelectProperties,
    defaults: SELECT_DEFAULTS,
    hasChildren: false,
    label: "Select",
  },
  scrollbox: {
    Renderer: ScrollboxRenderer,
    Properties: ScrollboxProperties,
    defaults: SCROLLBOX_DEFAULTS,
    hasChildren: true,
    label: "Scroll",
  },
  slider: {
    Renderer: SliderRenderer,
    Properties: SliderProperties,
    defaults: SLIDER_DEFAULTS,
    hasChildren: false,
    label: "Slider",
  },
  "ascii-font": {
    Renderer: AsciiFontRenderer,
    Properties: AsciiFontProperties,
    defaults: ASCIIFONT_DEFAULTS,
    hasChildren: false,
    label: "AsciiFont",
  },
  "tab-select": {
    Renderer: TabSelectRenderer,
    Properties: TabSelectProperties,
    defaults: TABSELECT_DEFAULTS,
    hasChildren: false,
    label: "Tabs",
  },
}

// Helper to get all element types
export const ELEMENT_TYPES = Object.keys(ELEMENT_REGISTRY) as ElementType[]
