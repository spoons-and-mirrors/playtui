import type { MouseEvent } from "@opentui/core"
import type { Renderable, TabSelectNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  StringProp, NumberProp, ToggleProp, ColorControl, SectionHeader
} from "../controls"

// =============================================================================
// TABSELECT DEFAULTS
// =============================================================================

export const TABSELECT_DEFAULTS: Partial<TabSelectNode> = {
  options: ["Tab 1", "Tab 2"],
  tabWidth: 15,
}

// =============================================================================
// TABSELECT RENDERER
// =============================================================================

interface TabSelectRendererProps {
  node: Renderable
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function TabSelectRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: TabSelectRendererProps) {
  const node = genericNode as TabSelectNode
  const options = node.options || ["Tab 1", "Tab 2"]
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
      <tab-select
        options={options.map(o => ({ name: o, description: "" }))}
        tabWidth={node.tabWidth || 15}
        focused={false} // Editor view is not interactive
        backgroundColor={node.backgroundColor || COLORS.bgAlt}
        textColor={node.textColor || COLORS.text}
        selectedBackgroundColor={node.selectedBackgroundColor || "transparent"}
        selectedTextColor={node.selectedTextColor || COLORS.accent}
        showUnderline={node.showUnderline !== false}
      />
    </box>
  )
}

// =============================================================================
// TAB-SELECT PROPERTIES PANEL
// =============================================================================

interface TabSelectPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function TabSelectProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle, pickingForField, setPickingForField }: TabSelectPropertiesProps) {
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
            id="tab-width"
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
                label="Sel BG"
                value={node.selectedBackgroundColor || ""}
                focused={focusedField === "selectedBackgroundColor"}
                onFocus={() => setFocusedField("selectedBackgroundColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ selectedBackgroundColor: v })}
                pickMode={pickingForField === "selectedBackgroundColor"}
                onPickStart={() => setPickingForField?.("selectedBackgroundColor")}
              />
            </box>
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
                label="Sel Text"
                value={node.selectedTextColor || ""}
                focused={focusedField === "selectedTextColor"}
                onFocus={() => setFocusedField("selectedTextColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ selectedTextColor: v })}
                pickMode={pickingForField === "selectedTextColor"}
                onPickStart={() => setPickingForField?.("selectedTextColor")}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}
