import type { ElementNode, AsciiFontNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  StringProp, SelectProp, ColorPropWithHex, SectionHeader
} from "../controls"

// =============================================================================
// ASCII-FONT DEFAULTS
// =============================================================================

export const ASCIIFONT_DEFAULTS: Partial<AsciiFontNode> = {
  text: "HELLO",
  font: "tiny",
  color: COLORS.accent,
}

// =============================================================================
// ASCII-FONT RENDERER
// =============================================================================

interface AsciiFontRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
}

export function AsciiFontRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover }: AsciiFontRendererProps) {
  const node = genericNode as AsciiFontNode
  const fontName = node.font || "tiny"
  const textContent = node.text || "ASCII"

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={(e) => { e.stopPropagation(); onSelect() }}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={{
        width: node.width,
        height: node.height,
        backgroundColor: "transparent",
        padding: 1,
      }}
    >
      <text fg={node.color || COLORS.accent}>
        <strong>[{fontName}] {textContent}</strong>
      </text>
    </box>
  )
}

// =============================================================================
// ASCII-FONT PROPERTIES PANEL
// =============================================================================

interface AsciiFontPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function AsciiFontProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: AsciiFontPropertiesProps) {
  const node = genericNode as AsciiFontNode
  return (
    <box id="section-asciifont" style={{ flexDirection: "column" }}>
      <SectionHeader title="A ASCII Font" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Text content */}
          <StringProp
            label="Text"
            value={node.text || ""}
            focused={focusedField === "text"}
            onFocus={() => setFocusedField("text")}
            onChange={(v) => onUpdate({ text: v })}
          />

          {/* Font selection */}
          <SelectProp
            label="Font"
            value={node.font || "tiny"}
            options={["tiny", "block", "slick", "shade", "huge", "grid", "pallet"]}
            onChange={(v) => onUpdate({ font: v as any })}
          />

          {/* Color */}
          <ColorPropWithHex
            label="Color"
            value={node.color || ""}
            focused={focusedField === "color"}
            onFocus={() => setFocusedField("color")}
            onChange={(v) => onUpdate({ color: v })}
          />
        </box>
      )}
    </box>
  )
}

// List of ascii-font-specific property keys
export const ASCIIFONT_PROPERTY_KEYS = [
  "text", "font", "color"
] as const
