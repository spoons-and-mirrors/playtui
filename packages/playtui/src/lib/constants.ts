import { COLORS } from "../theme"
import type { PropertySection } from "../components/elements"

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
