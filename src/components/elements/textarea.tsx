import type { ElementNode, TextareaNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  ToggleProp, StringProp, ColorPropWithHex, NumberProp, SectionHeader
} from "../controls"

// =============================================================================
// TEXTAREA DEFAULTS
// =============================================================================

export const TEXTAREA_DEFAULTS: Partial<TextareaNode> = {
  width: 30,
  height: 4,
  placeholder: "Enter multi-line text...",
  minHeight: 1,
  maxHeight: 6,
}

// =============================================================================
// TEXTAREA RENDERER
// =============================================================================

interface TextareaRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
}

export function TextareaRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover }: TextareaRendererProps) {
  const node = genericNode as TextareaNode
  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={(e) => { e.stopPropagation(); onSelect() }}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={{
        width: node.width,
        height: node.height || 4,
        minHeight: node.minHeight,
        maxHeight: node.maxHeight,
        margin: node.margin,
        marginTop: node.marginTop,
        marginRight: node.marginRight,
        marginBottom: node.marginBottom,
        marginLeft: node.marginLeft,
        backgroundColor: node.backgroundColor || COLORS.input,
        padding: 1,
      }}
    >
      <text fg={node.placeholderColor || COLORS.muted} wrapMode="word">
        {node.initialValue || node.placeholder || "Multi-line input..."}
      </text>
    </box>
  )
}

// =============================================================================
// TEXTAREA PROPERTIES PANEL
// =============================================================================

interface TextareaPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function TextareaProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: TextareaPropertiesProps) {
  const node = genericNode as TextareaNode
  return (
    <box id="section-textarea" style={{ flexDirection: "column" }}>
      <SectionHeader title="▯ Textarea" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Initial value */}
          <StringProp
            label="Initial"
            value={node.initialValue || ""}
            focused={focusedField === "initialValue"}
            onFocus={() => setFocusedField("initialValue")}
            onChange={(v) => onUpdate({ initialValue: v })}
          />

          {/* Cursor options */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Cursor ─</text>
          </box>

          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ToggleProp
                label="Show"
                value={node.showCursor !== false}
                onChange={(v) => onUpdate({ showCursor: v ? undefined : false })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ToggleProp
                label="Blink"
                value={node.blinking !== false}
                onChange={(v) => onUpdate({ blinking: v ? undefined : false })}
              />
            </box>
          </box>

          {/* Scroll margin */}
          <NumberProp
            label="Scroll Margin"
            value={node.scrollMargin ?? 0}
            min={0}
            max={10}
            onChange={(v) => onUpdate({ scrollMargin: v || undefined })}
          />

          {/* Tab indicator color */}
          <ColorPropWithHex
            label="Tab Clr"
            value={node.tabIndicatorColor || ""}
            focused={focusedField === "tabIndicatorColor"}
            onFocus={() => setFocusedField("tabIndicatorColor")}
            onChange={(v) => onUpdate({ tabIndicatorColor: v })}
          />
        </box>
      )}
    </box>
  )
}

// List of textarea-specific property keys
export const TEXTAREA_PROPERTY_KEYS = [
  "initialValue", "blinking", "showCursor", "scrollMargin", "tabIndicatorColor"
] as const
