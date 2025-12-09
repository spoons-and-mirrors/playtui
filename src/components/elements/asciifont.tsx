import type { MouseEvent } from "@opentui/core"
import type { ElementNode, AsciiFontNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  StringProp, SelectProp, ColorPropWithHex, SectionHeader
} from "../controls"

// =============================================================================
// ASCIIFONT DEFAULTS
// =============================================================================

export const ASCIIFONT_DEFAULTS: Partial<AsciiFontNode> = {
  text: "HELLO",
  font: "block",
  color: COLORS.accent,
}

// =============================================================================
// ASCIIFONT RENDERER
// =============================================================================

interface AsciiFontRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function AsciiFontRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: AsciiFontRendererProps) {
  const node = genericNode as AsciiFontNode
  
  // Only enable dragging for absolute positioned elements
  const isDraggable = node.position === "absolute"

  // Drag start handler - canvas handles move/end
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (isDraggable && onDragStart) {
      onDragStart(e.x, e.y)
    }
  }

  const wrapperStyle = {
    margin: node.margin,
    marginTop: node.marginTop,
    marginRight: node.marginRight,
    marginBottom: node.marginBottom,
    marginLeft: node.marginLeft,
    position: node.position,
    top: node.top,
    left: node.left,
    right: node.right,
    bottom: node.bottom,
    zIndex: node.zIndex,
  }

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={wrapperStyle}
    >
      <ascii-font
        text={node.text || "HELLO"}
        font={node.font || "block"}
        color={node.color || COLORS.accent}
      />
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
