import type { MouseEvent } from "@opentui/core"
import type { RenderableNode, InputNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  StringProp, NumberProp, SelectProp, ColorControl, SectionHeader
} from "../controls"

// =============================================================================
// INPUT DEFAULTS
// =============================================================================

export const INPUT_DEFAULTS: Partial<InputNode> = {
  width: 20,
  height: 1,
  placeholder: "Enter text...",
}

// =============================================================================
// INPUT RENDERER
// =============================================================================

interface InputRendererProps {
  node: RenderableNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function InputRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: InputRendererProps) {
  const node = genericNode as InputNode
  // Enable dragging for all positioned elements
  const isDraggable = true

  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (isDraggable && onDragStart) {
      onDragStart(e.x, e.y)
    }
  }

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={{
        margin: node.margin,
        marginTop: node.marginTop,
        marginRight: node.marginRight,
        marginBottom: node.marginBottom,
        marginLeft: node.marginLeft,
        position: node.position,
        top: node.y,
        left: node.x,
        zIndex: node.zIndex,
      }}
    >
      <text fg={node.placeholderColor || COLORS.muted}>
        {node.placeholder || "Input..."}
      </text>
    </box>
  )
}

// =============================================================================
// INPUT PROPERTIES PANEL
// =============================================================================

interface InputPropertiesProps {
  node: RenderableNode
  onUpdate: (updates: Partial<RenderableNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function InputProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle, pickingForField, setPickingForField }: InputPropertiesProps) {
  const node = genericNode as InputNode
  return (
    <box id="section-input" style={{ flexDirection: "column" }}>
      <SectionHeader title="▭ Input" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Placeholder */}
          <StringProp
            label="Placeholder"
            value={node.placeholder || ""}
            focused={focusedField === "placeholder"}
            onFocus={() => setFocusedField("placeholder")}
            onChange={(v) => onUpdate({ placeholder: v })}
          />

          {/* Max length */}
          <NumberProp
            id="input-max-len"
            label="Max Len"
            value={node.maxLength ?? 0}

            min={1}
            max={1000}
            onChange={(v) => onUpdate({ maxLength: v || undefined })}
          />

          {/* Colors section header */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Colors ─</text>
          </box>

          {/* Text colors row */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ColorControl
                label="Text"
                value={node.textColor || ""}
                focused={focusedField === "textColor"}
                onFocus={() => setFocusedField("textColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ textColor: v })}
                pickMode={pickingForField === "textColor"}
                onPickStart={() => setPickingForField?.("textColor")}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ColorControl
                label="Foc Txt"
                value={node.focusedTextColor || ""}
                focused={focusedField === "focusedTextColor"}
                onFocus={() => setFocusedField("focusedTextColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ focusedTextColor: v })}
                pickMode={pickingForField === "focusedTextColor"}
                onPickStart={() => setPickingForField?.("focusedTextColor")}
              />
            </box>
          </box>

          {/* Background colors row */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ColorControl
                label="BG"
                value={node.backgroundColor || ""}
                focused={focusedField === "backgroundColor"}
                onFocus={() => setFocusedField("backgroundColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ backgroundColor: v })}
                pickMode={pickingForField === "backgroundColor"}
                onPickStart={() => setPickingForField?.("backgroundColor")}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ColorControl
                label="Foc BG"
                value={node.focusedBackgroundColor || ""}
                focused={focusedField === "focusedBackgroundColor"}
                onFocus={() => setFocusedField("focusedBackgroundColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ focusedBackgroundColor: v })}
                pickMode={pickingForField === "focusedBackgroundColor"}
                onPickStart={() => setPickingForField?.("focusedBackgroundColor")}
              />
            </box>
          </box>

          {/* Placeholder color */}
          <ColorControl
            label="Plchld Clr"
            value={node.placeholderColor || ""}
            focused={focusedField === "placeholderColor"}
            onFocus={() => setFocusedField("placeholderColor")}
            onBlur={() => setFocusedField(null)}
            onChange={(v) => onUpdate({ placeholderColor: v })}
            pickMode={pickingForField === "placeholderColor"}
            onPickStart={() => setPickingForField?.("placeholderColor")}
          />

          {/* Cursor section header */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Cursor ─</text>
          </box>

          {/* Cursor style and color */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <SelectProp
                label="Style"
                value={node.cursorStyle || "block"}
                options={["block", "line", "underline"]}
                onChange={(v) => onUpdate({ cursorStyle: v as any })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ColorControl
                label="Color"
                value={node.cursorColor || ""}
                focused={focusedField === "cursorColor"}
                onFocus={() => setFocusedField("cursorColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ cursorColor: v })}
                pickMode={pickingForField === "cursorColor"}
                onPickStart={() => setPickingForField?.("cursorColor")}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}
