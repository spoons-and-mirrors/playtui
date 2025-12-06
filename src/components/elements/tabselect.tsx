import type { ElementNode, TabSelectNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  StringProp, NumberProp, ToggleProp, ColorPropWithHex, SectionHeader
} from "../controls"

// =============================================================================
// TAB-SELECT DEFAULTS
// =============================================================================

export const TABSELECT_DEFAULTS: Partial<TabSelectNode> = {
  width: 40,
  options: ["Tab 1", "Tab 2", "Tab 3"],
  tabWidth: 12,
}

// =============================================================================
// TAB-SELECT RENDERER
// =============================================================================

interface TabSelectRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
}

export function TabSelectRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover }: TabSelectRendererProps) {
  const node = genericNode as TabSelectNode
  const options = node.options || ["Tab 1", "Tab 2", "Tab 3"]
  const tabW = node.tabWidth || 12
  const bgColor = node.backgroundColor || COLORS.bgAlt
  const selBgColor = node.selectedBackgroundColor || "transparent"
  const textColor = node.textColor || COLORS.text
  const selTextColor = node.selectedTextColor || COLORS.accent

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={(e) => { e.stopPropagation(); onSelect() }}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      border={isSelected || isHovered}
      borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
      visible={node.visible !== false}
      style={{
        width: node.width || options.length * tabW,
        height: 3,
        flexDirection: "row",
        backgroundColor: bgColor,
      }}
    >
      {options.slice(0, 5).map((opt, i) => (
        <box
          key={i}
          border={node.showUnderline !== false ? ["bottom"] : undefined}
          borderColor={i === 0 ? selTextColor : COLORS.border}
          style={{
            width: tabW,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: i === 0 ? selBgColor : "transparent",
          }}
        >
          <text fg={i === 0 ? selTextColor : textColor}>{opt}</text>
        </box>
      ))}
    </box>
  )
}

// =============================================================================
// TAB-SELECT PROPERTIES PANEL
// =============================================================================

interface TabSelectPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function TabSelectProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: TabSelectPropertiesProps) {
  const node = genericNode as TabSelectNode
  return (
    <box id="section-tabselect" style={{ flexDirection: "column" }}>
      <SectionHeader title="◰ Tabs" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Options input */}
          <StringProp
            label="Options"
            value={(node.options || []).join(", ")}
            focused={focusedField === "options"}
            onFocus={() => setFocusedField("options")}
            onChange={(v) => onUpdate({ options: v.split(",").map(s => s.trim()).filter(Boolean) })}
          />

          {/* Tab width */}
          <NumberProp
            label="Width"
            value={node.tabWidth ?? 12}
            min={5}
            max={40}
            onChange={(v) => onUpdate({ tabWidth: v })}
          />

          {/* Behavior toggles */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Behavior ─</text>
          </box>

          <box style={{ flexDirection: "row", gap: 2 }}>
            <ToggleProp
              label="Underline"
              value={node.showUnderline !== false}
              onChange={(v) => onUpdate({ showUnderline: v })}
            />
            <ToggleProp
              label="Wrap"
              value={node.wrapSelection === true}
              onChange={(v) => onUpdate({ wrapSelection: v })}
            />
          </box>

          {/* Colors section */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Colors ─</text>
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
                label="Sel BG"
                value={node.selectedBackgroundColor || ""}
                focused={focusedField === "selectedBackgroundColor"}
                onFocus={() => setFocusedField("selectedBackgroundColor")}
                onChange={(v) => onUpdate({ selectedBackgroundColor: v })}
              />
            </box>
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
                label="Sel Text"
                value={node.selectedTextColor || ""}
                focused={focusedField === "selectedTextColor"}
                onFocus={() => setFocusedField("selectedTextColor")}
                onChange={(v) => onUpdate({ selectedTextColor: v })}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}

// List of tab-select-specific property keys
export const TABSELECT_PROPERTY_KEYS = [
  "options", "tabWidth", "showUnderline", "wrapSelection",
  "backgroundColor", "textColor", "selectedBackgroundColor", "selectedTextColor"
] as const
