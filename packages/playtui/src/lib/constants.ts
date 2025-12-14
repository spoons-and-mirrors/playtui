import { COLORS } from "../theme"
import type { PropertyDef, PropertySection } from "./types"

export const SECTION_LABELS: Record<PropertySection, string> = {
  dimensions: "◫ Dimensions",
  flexContainer: "⬓ Layout",
  flexItem: "◧ Flex Item",
  padding: "⊞ Padding",
  margin: "⊟ Margin",
  position: "◎ Position",
  overflow: "⋯ Overflow",
  visibility: "◉ Display",
  background: "▦ Fill",
  border: "▢ Border",
  text: "T Text",
  input: "▭ Input",
  textarea: "▯ Textarea",
  select: "≡ Select",
  slider: "─ Slider",
  asciiFont: "A ASCII Font",
  tabSelect: "◰ Tabs",
  scrollbox: "↕ Scrollbox",
}

// Section ordering for property panel - most used first
export const SECTION_ORDER: PropertySection[] = [
  "dimensions",
  "position",
  "margin",
  "padding",
  "flexContainer",
  "flexItem",
  "background",
  "border",
  "overflow",
  "visibility",
  // Component-specific (handled by element Properties components via registry)
  "text",
  "input",
  "textarea",
  "select",
  "slider",
  "asciiFont",
  "tabSelect",
  "scrollbox",
]

// Sections that start expanded by default
export const EXPANDED_BY_DEFAULT: PropertySection[] = [
  "dimensions",
  "flexContainer",
  "background",
  "border",
  "text",
  "input",
]

// =============================================================================
// COMMON PROPERTIES - Used by PropertyEditor for generic section rendering
// Element-specific properties are handled by each element's Properties component
// =============================================================================

export const PROPERTIES: PropertyDef[] = [
  // === DIMENSIONS === (common to most elements)
  { key: "width", label: "Width", type: "size", section: "dimensions" },
  { key: "height", label: "Height", type: "size", section: "dimensions" },
  { key: "minWidth", label: "Min W", type: "number", min: 0, max: 200, section: "dimensions", appliesTo: ["box", "scrollbox", "input"] },
  { key: "maxWidth", label: "Max W", type: "number", min: 0, max: 200, section: "dimensions", appliesTo: ["box", "scrollbox", "input"] },
  { key: "minHeight", label: "Min H", type: "number", min: 0, max: 100, section: "dimensions", appliesTo: ["box", "scrollbox", "input"] },
  { key: "maxHeight", label: "Max H", type: "number", min: 0, max: 100, section: "dimensions", appliesTo: ["box", "scrollbox", "input"] },
  { key: "aspectRatio", label: "Ratio", type: "number", min: 0, max: 10, section: "dimensions", appliesTo: ["box", "scrollbox"] },

  // === FLEX CONTAINER === (container elements only)
  { key: "flexDirection", label: "Direction", type: "select", options: ["row", "column"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "flexWrap", label: "Wrap", type: "select", options: ["no-wrap", "wrap"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "justifyContent", label: "Justify", type: "select", options: ["flex-start", "center", "flex-end", "space-between", "space-around"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "alignItems", label: "Align", type: "select", options: ["flex-start", "center", "flex-end", "stretch"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "alignContent", label: "Content", type: "select", options: ["flex-start", "center", "flex-end", "stretch", "space-between", "space-around"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "gap", label: "Gap", type: "number", min: 0, max: 20, section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "rowGap", label: "Row Gap", type: "number", min: 0, max: 20, section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "columnGap", label: "Col Gap", type: "number", min: 0, max: 20, section: "flexContainer", appliesTo: ["box", "scrollbox"] },

  // === FLEX ITEM === (elements that can be flex children)
  { key: "flexGrow", label: "Grow", type: "number", min: 0, max: 10, section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },
  { key: "flexShrink", label: "Shrink", type: "number", min: 0, max: 10, section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },
  { key: "flexBasis", label: "Basis", type: "size", section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },
  { key: "alignSelf", label: "Align Self", type: "select", options: ["auto", "flex-start", "center", "flex-end", "stretch"], section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },

  // === PADDING === (container elements and text)
  { key: "padding", label: "All", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox", "text"] },
  { key: "paddingTop", label: "Top", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox", "text"] },
  { key: "paddingRight", label: "Right", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox", "text"] },
  { key: "paddingBottom", label: "Bottom", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox", "text"] },
  { key: "paddingLeft", label: "Left", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox", "text"] },

  // === MARGIN === (common to many elements)
  { key: "margin", label: "All", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginTop", label: "Top", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginRight", label: "Right", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginBottom", label: "Bottom", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginLeft", label: "Left", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },

  // === POSITIONING === (all elements can be positioned)
  { key: "position", label: "Position", type: "select", options: ["relative", "absolute"], section: "position" },
  { key: "x", label: "X", type: "number", min: -100, max: 200, section: "position" },
  { key: "y", label: "Y", type: "number", min: -100, max: 200, section: "position" },
  { key: "zIndex", label: "Z", type: "number", min: -100, max: 100, section: "position" },

  // === OVERFLOW === (container elements only)
  { key: "overflow", label: "Overflow", type: "select", options: ["visible", "hidden", "scroll"], section: "overflow", appliesTo: ["box", "scrollbox"] },

  // === BACKGROUND === (elements with background color)
  { key: "backgroundColor", label: "BG Color", type: "color", section: "background", appliesTo: ["box", "scrollbox", "input"] },
]

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const COLOR_PALETTE = [
  { name: "bg", value: COLORS.bg },
  { name: "bgAlt", value: COLORS.bgAlt },
  { name: "card", value: COLORS.card },
  { name: "border", value: COLORS.border },
  { name: "text", value: COLORS.text },
  { name: "muted", value: COLORS.muted },
  { name: "accent", value: COLORS.accent },
  { name: "accentBright", value: COLORS.accentBright },
  { name: "success", value: COLORS.success },
  { name: "warning", value: COLORS.warning },
  { name: "danger", value: COLORS.danger },
  { name: "transparent", value: "transparent" },
]

// SHORTCUTS are now defined in shortcuts.ts - use KEYBOARD_SHORTCUTS from there
