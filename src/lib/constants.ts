import { COLORS } from "../theme"
import type { PropertyDef, PropertySection } from "./types"

export const SECTION_LABELS: Record<PropertySection, string> = {
  sizing: "◫ Size",
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
  "sizing",
  "flexContainer",
  "flexItem",
  "padding",
  "margin",
  "background",
  "border",
  "position",
  "overflow",
  "visibility",
  // Component-specific
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
  "sizing",
  "flexContainer",
  "background",
  "border",
  "text",
  "input",
]

export const PROPERTIES: PropertyDef[] = [
  // === IDENTITY ===
  { key: "name", label: "Name", type: "string" },

  // === SIZING ===
  { key: "width", label: "Width", type: "size", section: "sizing" },
  { key: "height", label: "Height", type: "size", section: "sizing" },
  { key: "minWidth", label: "Min W", type: "number", min: 0, max: 200, section: "sizing", appliesTo: ["box", "scrollbox", "input"] },
  { key: "maxWidth", label: "Max W", type: "number", min: 0, max: 200, section: "sizing", appliesTo: ["box", "scrollbox", "input"] },
  { key: "minHeight", label: "Min H", type: "number", min: 0, max: 100, section: "sizing", appliesTo: ["box", "scrollbox", "input"] },
  { key: "maxHeight", label: "Max H", type: "number", min: 0, max: 100, section: "sizing", appliesTo: ["box", "scrollbox", "input"] },

  // === FLEX CONTAINER ===
  { key: "flexDirection", label: "Direction", type: "select", options: ["row", "column"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "flexWrap", label: "Wrap", type: "select", options: ["nowrap", "wrap"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "justifyContent", label: "Justify", type: "select", options: ["flex-start", "center", "flex-end", "space-between", "space-around"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "alignItems", label: "Align", type: "select", options: ["flex-start", "center", "flex-end", "stretch"], section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "gap", label: "Gap", type: "number", min: 0, max: 20, section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "rowGap", label: "Row Gap", type: "number", min: 0, max: 20, section: "flexContainer", appliesTo: ["box", "scrollbox"] },
  { key: "columnGap", label: "Col Gap", type: "number", min: 0, max: 20, section: "flexContainer", appliesTo: ["box", "scrollbox"] },

  // === FLEX ITEM ===
  { key: "flexGrow", label: "Grow", type: "number", min: 0, max: 10, section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },
  { key: "flexShrink", label: "Shrink", type: "number", min: 0, max: 10, section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },
  { key: "flexBasis", label: "Basis", type: "size", section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },
  { key: "alignSelf", label: "Align Self", type: "select", options: ["auto", "flex-start", "center", "flex-end", "stretch"], section: "flexItem", appliesTo: ["box", "scrollbox", "input"] },

  // === PADDING ===
  { key: "padding", label: "All", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox"] },
  { key: "paddingTop", label: "Top", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox"] },
  { key: "paddingRight", label: "Right", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox"] },
  { key: "paddingBottom", label: "Bottom", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox"] },
  { key: "paddingLeft", label: "Left", type: "number", min: 0, max: 20, section: "padding", appliesTo: ["box", "scrollbox"] },

  // === MARGIN ===
  { key: "margin", label: "All", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginTop", label: "Top", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginRight", label: "Right", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginBottom", label: "Bottom", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },
  { key: "marginLeft", label: "Left", type: "number", min: 0, max: 20, section: "margin", appliesTo: ["box", "scrollbox", "text", "input"] },

  // === POSITIONING ===
  { key: "position", label: "Position", type: "select", options: ["relative", "absolute"], section: "position", appliesTo: ["box", "scrollbox"] },
  { key: "top", label: "Top", type: "number", min: -100, max: 100, section: "position", appliesTo: ["box", "scrollbox"] },
  { key: "right", label: "Right", type: "number", min: -100, max: 100, section: "position", appliesTo: ["box", "scrollbox"] },
  { key: "bottom", label: "Bottom", type: "number", min: -100, max: 100, section: "position", appliesTo: ["box", "scrollbox"] },
  { key: "left", label: "Left", type: "number", min: -100, max: 100, section: "position", appliesTo: ["box", "scrollbox"] },
  { key: "zIndex", label: "Z-Index", type: "number", min: -100, max: 100, section: "position", appliesTo: ["box", "scrollbox"] },

  // === OVERFLOW ===
  { key: "overflow", label: "Overflow", type: "select", options: ["visible", "hidden", "scroll"], section: "overflow", appliesTo: ["box", "scrollbox"] },

  // === VISIBILITY ===
  { key: "visible", label: "Visible", type: "toggle", section: "visibility", appliesTo: ["box", "text", "scrollbox", "input"] },

  // === BACKGROUND ===
  { key: "backgroundColor", label: "BG Color", type: "color", section: "background", appliesTo: ["box", "scrollbox", "input"] },

  // === BORDER ===
  { key: "border", label: "Border", type: "toggle", section: "border", appliesTo: ["box", "scrollbox"] },
  { key: "borderSides", label: "Sides", type: "borderSides", section: "border", appliesTo: ["box", "scrollbox"] },
  { key: "borderStyle", label: "Style", type: "select", options: ["single", "rounded", "double", "heavy"], section: "border", appliesTo: ["box", "scrollbox"] },
  { key: "borderColor", label: "Color", type: "color", section: "border", appliesTo: ["box", "scrollbox"] },
  { key: "focusedBorderColor", label: "Focus Clr", type: "color", section: "border", appliesTo: ["box", "scrollbox", "input"] },
  { key: "title", label: "Title", type: "string", section: "border", appliesTo: ["box", "scrollbox"] },
  { key: "titleAlignment", label: "Title Align", type: "select", options: ["left", "center", "right"], section: "border", appliesTo: ["box", "scrollbox"] },

  // === TEXT ===
  { key: "content", label: "Content", type: "string", section: "text", appliesTo: ["text"] },
  { key: "fg", label: "Color", type: "color", section: "text", appliesTo: ["text"] },
  { key: "bg", label: "Background", type: "color", section: "text", appliesTo: ["text"] },
  { key: "wrapMode", label: "Wrap", type: "select", options: ["none", "word", "char"], section: "text", appliesTo: ["text"] },
  { key: "bold", label: "Bold", type: "toggle", section: "text", appliesTo: ["text"] },
  { key: "italic", label: "Italic", type: "toggle", section: "text", appliesTo: ["text"] },
  { key: "underline", label: "Underline", type: "toggle", section: "text", appliesTo: ["text"] },

  // === INPUT ===
  { key: "placeholder", label: "Placeholder", type: "string", section: "input", appliesTo: ["input", "textarea"] },

  // === TEXTAREA ===
  { key: "minLines", label: "Min Lines", type: "number", min: 1, max: 20, section: "textarea", appliesTo: ["textarea"] },
  { key: "maxLines", label: "Max Lines", type: "number", min: 1, max: 50, section: "textarea", appliesTo: ["textarea"] },

  // === SELECT ===
  { key: "options", label: "Options", type: "string", section: "select", appliesTo: ["select", "tab-select"] },

  // === SLIDER ===
  { key: "orientation", label: "Orientation", type: "select", options: ["horizontal", "vertical"], section: "slider", appliesTo: ["slider"] },
  { key: "value", label: "Value", type: "number", min: 0, max: 100, section: "slider", appliesTo: ["slider"] },
  { key: "min", label: "Min", type: "number", min: 0, max: 1000, section: "slider", appliesTo: ["slider"] },
  { key: "max", label: "Max", type: "number", min: 0, max: 1000, section: "slider", appliesTo: ["slider"] },
  { key: "viewPortSize", label: "Viewport", type: "number", min: 1, max: 100, section: "slider", appliesTo: ["slider"] },
  { key: "foregroundColor", label: "FG Color", type: "color", section: "slider", appliesTo: ["slider"] },

  // === ASCII FONT ===
  { key: "text", label: "Text", type: "string", section: "asciiFont", appliesTo: ["ascii-font"] },
  { key: "font", label: "Font", type: "select", options: ["tiny", "block", "slick", "shade"], section: "asciiFont", appliesTo: ["ascii-font"] },
  { key: "color", label: "Color", type: "color", section: "asciiFont", appliesTo: ["ascii-font"] },

  // === TAB SELECT ===
  { key: "tabWidth", label: "Tab Width", type: "number", min: 5, max: 40, section: "tabSelect", appliesTo: ["tab-select"] },

  // === SCROLLBOX ===
  { key: "stickyScroll", label: "Sticky", type: "toggle", section: "scrollbox", appliesTo: ["scrollbox"] },
  { key: "scrollX", label: "Scroll X", type: "toggle", section: "scrollbox", appliesTo: ["scrollbox"] },
  { key: "scrollY", label: "Scroll Y", type: "toggle", section: "scrollbox", appliesTo: ["scrollbox"] },
  { key: "viewportCulling", label: "Cull VP", type: "toggle", section: "scrollbox", appliesTo: ["scrollbox"] },

  // === INPUT COLORS ===
  { key: "textColor", label: "Text Clr", type: "color", section: "input", appliesTo: ["input", "textarea"] },
  { key: "focusedTextColor", label: "Foc Text", type: "color", section: "input", appliesTo: ["input", "textarea"] },
  { key: "focusedBackgroundColor", label: "Foc BG", type: "color", section: "input", appliesTo: ["input", "textarea"] },
]

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

export const SHORTCUTS = [
  { key: "Del", desc: "delete" },
  { key: "D", desc: "duplicate" },
  { key: "B", desc: "add box" },
  { key: "T", desc: "add text" },
  { key: "S", desc: "add scrollbox" },
  { key: "I", desc: "add input" },
  { key: "A", desc: "add textarea" },
  { key: "E", desc: "add select" },
  { key: "L", desc: "add slider" },
  { key: "F", desc: "add ascii-font" },
  { key: "W", desc: "add tab-select" },
  { key: "↑↓/jk", desc: "navigate" },
  { key: "C", desc: "view code" },
  { key: "Z", desc: "undo" },
  { key: "Y", desc: "redo" },
  { key: "Esc", desc: "deselect" },
  { key: "^Q", desc: "quit" },
]
