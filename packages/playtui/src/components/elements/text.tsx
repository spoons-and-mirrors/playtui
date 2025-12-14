import { useRef } from "react"
import { TextAttributes } from "@opentui/core"
import type { MouseEvent } from "@opentui/core"
import type { ElementNode, TextNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  ToggleProp, SelectProp, FillColorProp, PropRow
} from "../controls"

import type { ColorPalette } from "../../lib/projectTypes"

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
  
  // Enable dragging for all positioned elements
  const isDraggable = true
  
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
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
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
  onUpdate: (updates: Partial<TextNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean  // kept for interface compatibility, but ignored
  onToggle: () => void  // kept for interface compatibility, but ignored
  // Palette support (optional with defaults)
  palettes?: ColorPalette[]
  activePaletteIndex?: number
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
}

export function TextProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, palettes = [], activePaletteIndex = 0, onUpdateSwatch, onChangePalette }: TextPropertiesProps) {
  const node = genericNode as TextNode
  
  const lastContentClickRef = useRef<number>(0)
  
  return (
    <box id="section-text" style={{ flexDirection: "column", gap: 1, marginTop: 2 }}>
      {/* Header row: Text label (col1) + inline content (col2) - matches PropRow layout */}
      <box style={{ flexDirection: "row", gap: 1, height: 1, alignItems: "center" }}>
        <text fg={COLORS.text} style={{ width: 9 }}><strong>Text</strong></text>
        <box style={{ flexDirection: "row", flexGrow: 1, justifyContent: "center" }}>
          {focusedField === "content" ? (
            <input
              id="content-input"
              value={node.content || ""}
              focused
              width={(node.content?.length || 1) + 2}
              backgroundColor={COLORS.cardHover}
              textColor={COLORS.text}
              onInput={(v) => onUpdate({ content: v })}
              onSubmit={() => setFocusedField(null)}
            />
          ) : (
            <box
              id="content-display"
              style={{ backgroundColor: COLORS.cardHover, paddingLeft: 1, paddingRight: 1, height: 1 }}
              onMouseDown={() => {
                const now = Date.now()
                if (now - lastContentClickRef.current < 400) {
                  setFocusedField("content")
                }
                lastContentClickRef.current = now
              }}
            >
              <text fg={COLORS.text}>{node.content || ""}</text>
            </box>
          )}
        </box>
      </box>

      {/* Properties - no extra paddingLeft since PropRow handles alignment */}
      <box style={{ flexDirection: "column", gap: 1 }}>
        {/* Style - directly under Text header */}
        <PropRow label="Style">
          <box style={{ flexDirection: "row", gap: 0 }}>
            <TextStyleToggle label="B" active={node.bold} onChange={(v) => onUpdate({ bold: v })} style="bold" />
            <TextStyleToggle label="I" active={node.italic} onChange={(v) => onUpdate({ italic: v })} style="italic" />
            <TextStyleToggle label="U" active={node.underline} onChange={(v) => onUpdate({ underline: v })} style="underline" />
            <TextStyleToggle label="D" active={node.dim} onChange={(v) => onUpdate({ dim: v })} style="dim" />
            <TextStyleToggle label="S" active={node.strikethrough} onChange={(v) => onUpdate({ strikethrough: v })} style="strike" />
          </box>
        </PropRow>

        {/* Fill color */}
        <FillColorProp
          value={node.fg || ""}
          onChange={(v) => onUpdate({ fg: v || undefined })}
          focused={focusedField === "fg"}
          onFocus={() => setFocusedField("fg")}
        />

        {/* Wrap */}
        <SelectProp
          label="Wrap"
          value={node.wrapMode || "none"}
          options={["none", "word", "char"]}
          onChange={(v) => onUpdate({ wrapMode: v as TextNode["wrapMode"] })}
        />

        {/* Select */}
        <ToggleProp
          label="Select"
          value={node.selectable === true}
          onChange={(v) => onUpdate({ selectable: v || undefined })}
        />
      </box>
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
