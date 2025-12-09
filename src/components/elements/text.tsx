import { TextAttributes } from "@opentui/core"
import type { MouseEvent } from "@opentui/core"
import type { ElementNode, TextNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  ToggleProp, SelectProp, StringProp, ColorPropWithHex, SectionHeader
} from "../controls"

// =============================================================================
// TEXT DEFAULTS
// =============================================================================

export const TEXT_DEFAULTS: Partial<TextNode> = {
  content: "Text",
  fg: COLORS.text,
}

// =============================================================================
// TEXT RENDERER
// =============================================================================

interface TextRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function TextRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: TextRendererProps) {
  const node = genericNode as TextNode
  
  // Only enable dragging for absolute positioned elements
  const isDraggable = node.position === "absolute"
  
  // Build text attributes bitmask
  let attrs = 0
  if (node.bold) attrs |= TextAttributes.BOLD
  if (node.italic) attrs |= TextAttributes.ITALIC
  if (node.underline) attrs |= TextAttributes.UNDERLINE
  if (node.dim) attrs |= TextAttributes.DIM
  if (node.strikethrough) attrs |= TextAttributes.STRIKETHROUGH

  // Drag start handler - canvas handles move/end
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (isDraggable && onDragStart) {
      onDragStart(e.x, e.y)
    }
  }

  const wrapperStyle = {
    backgroundColor: "transparent",
    margin: node.margin,
    marginTop: node.marginTop,
    marginRight: node.marginRight,
    marginBottom: node.marginBottom,
    marginLeft: node.marginLeft,
    position: node.position,
    top: node.y,
    left: node.x,
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
      <text
        fg={node.fg || COLORS.text}
        bg={node.bg}
        wrapMode={node.wrapMode}
        selectable={node.selectable}
        attributes={attrs || undefined}
      >
        {node.content || ""}
      </text>
    </box>
  )
}

// =============================================================================
// TEXT PROPERTIES PANEL
// =============================================================================

interface TextPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function TextProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: TextPropertiesProps) {
  const node = genericNode as TextNode
  return (
    <box id="section-text" style={{ flexDirection: "column" }}>
      <SectionHeader title="T Text" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Content */}
          <StringProp
            label="Content"
            value={node.content || ""}
            focused={focusedField === "content"}
            onFocus={() => setFocusedField("content")}
            onChange={(v) => onUpdate({ content: v })}
          />

          {/* Colors row */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ColorPropWithHex
                label="Color"
                value={node.fg || ""}
                focused={focusedField === "fg"}
                onFocus={() => setFocusedField("fg")}
                onChange={(v) => onUpdate({ fg: v })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ColorPropWithHex
                label="BG"
                value={node.bg || ""}
                focused={focusedField === "bg"}
                onFocus={() => setFocusedField("bg")}
                onChange={(v) => onUpdate({ bg: v })}
              />
            </box>
          </box>

          {/* Wrap mode */}
          <SelectProp
            label="Wrap"
            value={node.wrapMode || "none"}
            options={["none", "word", "char"]}
            onChange={(v) => onUpdate({ wrapMode: v as any })}
          />

          {/* Text style toggles - compact row */}
          <box style={{ flexDirection: "row", gap: 0, marginTop: 1 }}>
            <text fg={COLORS.muted} style={{ width: 8 }}>Style</text>
            <box style={{ flexDirection: "row", gap: 1 }}>
              <TextStyleToggle label="B" active={node.bold} onChange={(v) => onUpdate({ bold: v })} style="bold" />
              <TextStyleToggle label="I" active={node.italic} onChange={(v) => onUpdate({ italic: v })} style="italic" />
              <TextStyleToggle label="U" active={node.underline} onChange={(v) => onUpdate({ underline: v })} style="underline" />
              <TextStyleToggle label="D" active={node.dim} onChange={(v) => onUpdate({ dim: v })} style="dim" />
              <TextStyleToggle label="S" active={node.strikethrough} onChange={(v) => onUpdate({ strikethrough: v })} style="strike" />
            </box>
          </box>

          {/* Selectable */}
          <ToggleProp
            label="Select"
            value={node.selectable === true}
            onChange={(v) => onUpdate({ selectable: v || undefined })}
          />
        </box>
      )}
    </box>
  )
}

// Compact text style toggle button
function TextStyleToggle({ 
  label, 
  active, 
  onChange, 
  style 
}: { 
  label: string
  active?: boolean
  onChange: (v: boolean) => void
  style: "bold" | "italic" | "underline" | "dim" | "strike"
}) {
  const fg = active ? COLORS.accent : COLORS.muted
  const bg = active ? COLORS.bgAlt : "transparent"
  
  // Map style to TextAttributes
  const attrMap: Record<string, number> = {
    bold: TextAttributes.BOLD,
    italic: TextAttributes.ITALIC,
    underline: TextAttributes.UNDERLINE,
    dim: TextAttributes.DIM,
    strike: TextAttributes.STRIKETHROUGH,
  }
  
  return (
    <box
      onMouseDown={() => onChange(!active)}
      style={{ 
        width: 3, 
        height: 1, 
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <text fg={fg} attributes={attrMap[style]}>{label}</text>
    </box>
  )
}
