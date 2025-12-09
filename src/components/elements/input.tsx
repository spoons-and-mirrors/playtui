import type { ElementNode, InputNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  SelectProp, StringProp, ColorPropWithHex, NumberProp, SectionHeader
} from "../controls"
import { DraggableWrapper } from "./DraggableWrapper"

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
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function InputRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: InputRendererProps) {
  const node = genericNode as InputNode
  return (
    <DraggableWrapper
      node={node}
      isSelected={isSelected}
      isHovered={isHovered}
      onSelect={onSelect}
      onHover={onHover}
      onDragStart={onDragStart}
      style={{
        width: node.width,
        height: node.height || 1,
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
        backgroundColor: node.backgroundColor || COLORS.input,
      }}
    >
      <text fg={node.placeholderColor || COLORS.muted}>
        {node.placeholder || "Input..."}
      </text>
    </DraggableWrapper>
  )
}

// =============================================================================
// INPUT PROPERTIES PANEL
// =============================================================================

interface InputPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function InputProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: InputPropertiesProps) {
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
              <ColorPropWithHex
                label="Text"
                value={node.textColor || ""}
                focused={focusedField === "textColor"}
                onFocus={() => setFocusedField("textColor")}
                onChange={(v) => onUpdate({ textColor: v })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ColorPropWithHex
                label="Foc Txt"
                value={node.focusedTextColor || ""}
                focused={focusedField === "focusedTextColor"}
                onFocus={() => setFocusedField("focusedTextColor")}
                onChange={(v) => onUpdate({ focusedTextColor: v })}
              />
            </box>
          </box>

          {/* Background colors row */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ColorPropWithHex
                label="BG"
                value={node.backgroundColor || ""}
                focused={focusedField === "backgroundColor"}
                onFocus={() => setFocusedField("backgroundColor")}
                onChange={(v) => onUpdate({ backgroundColor: v })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ColorPropWithHex
                label="Foc BG"
                value={node.focusedBackgroundColor || ""}
                focused={focusedField === "focusedBackgroundColor"}
                onFocus={() => setFocusedField("focusedBackgroundColor")}
                onChange={(v) => onUpdate({ focusedBackgroundColor: v })}
              />
            </box>
          </box>

          {/* Placeholder color */}
          <ColorPropWithHex
            label="Plchld Clr"
            value={node.placeholderColor || ""}
            focused={focusedField === "placeholderColor"}
            onFocus={() => setFocusedField("placeholderColor")}
            onChange={(v) => onUpdate({ placeholderColor: v })}
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
              <ColorPropWithHex
                label="Color"
                value={node.cursorColor || ""}
                focused={focusedField === "cursorColor"}
                onFocus={() => setFocusedField("cursorColor")}
                onChange={(v) => onUpdate({ cursorColor: v })}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}

// List of input-specific property keys
export const INPUT_PROPERTY_KEYS = [
  "placeholder", "placeholderColor", "maxLength",
  "textColor", "focusedTextColor", "backgroundColor", "focusedBackgroundColor",
  "cursorColor", "cursorStyle"
] as const
