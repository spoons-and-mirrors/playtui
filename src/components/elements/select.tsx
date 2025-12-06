import type { ElementNode, SelectNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  ToggleProp, NumberProp, StringProp, ColorPropWithHex, SectionHeader
} from "../controls"

// =============================================================================
// SELECT DEFAULTS
// =============================================================================

export const SELECT_DEFAULTS: Partial<SelectNode> = {
  width: 20,
  height: 5,
  options: ["Option 1", "Option 2", "Option 3"],
}

// =============================================================================
// SELECT RENDERER
// =============================================================================

interface SelectRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
}

export function SelectRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover }: SelectRendererProps) {
  const node = genericNode as SelectNode
  const options = node.options || ["Option 1", "Option 2"]
  const bgColor = node.backgroundColor || COLORS.bgAlt
  const selBgColor = node.selectedBackgroundColor || COLORS.accent
  const textColor = node.textColor || COLORS.text
  const selTextColor = node.selectedTextColor || COLORS.bg

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={(e) => { e.stopPropagation(); onSelect() }}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={{
        width: node.width,
        height: node.height || options.length + 2,
        margin: node.margin,
        marginTop: node.marginTop,
        marginRight: node.marginRight,
        marginBottom: node.marginBottom,
        marginLeft: node.marginLeft,
        backgroundColor: bgColor,
        flexDirection: "column",
        gap: node.itemSpacing,
      }}
    >
      {options.slice(0, 5).map((opt, i) => (
        <box key={i} style={{ paddingLeft: 1, backgroundColor: i === 0 ? selBgColor : "transparent" }}>
          <text fg={i === 0 ? selTextColor : textColor}>
            {i === 0 ? "▶ " : "  "}{opt}
          </text>
        </box>
      ))}
      {node.showScrollIndicator && options.length > 5 && (
        <text fg={COLORS.muted} style={{ paddingLeft: 1 }}>  ↓ more...</text>
      )}
    </box>
  )
}

// =============================================================================
// SELECT PROPERTIES PANEL
// =============================================================================

interface SelectPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function SelectProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: SelectPropertiesProps) {
  const node = genericNode as SelectNode
  return (
    <box id="section-select" style={{ flexDirection: "column" }}>
      <SectionHeader title="≡ Select" collapsed={collapsed} onToggle={onToggle} />
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

          {/* Behavior toggles */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Behavior ─</text>
          </box>

          <box style={{ flexDirection: "row", gap: 2 }}>
            <ToggleProp
              label="Scroll"
              value={node.showScrollIndicator === true}
              onChange={(v) => onUpdate({ showScrollIndicator: v })}
            />
            <ToggleProp
              label="Wrap"
              value={node.wrapSelection === true}
              onChange={(v) => onUpdate({ wrapSelection: v })}
            />
          </box>

          <ToggleProp
            label="Show Desc"
            value={node.showDescription === true}
            onChange={(v) => onUpdate({ showDescription: v })}
          />

          {/* Spacing controls */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                label="Spacing"
                value={node.itemSpacing ?? 0}
                min={0}
                max={10}
                onChange={(v) => onUpdate({ itemSpacing: v || undefined })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                label="Fast Step"
                value={node.fastScrollStep ?? 5}
                min={1}
                max={20}
                onChange={(v) => onUpdate({ fastScrollStep: v })}
              />
            </box>
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

          {/* Description colors - only when showDescription is on */}
          {node.showDescription && (
            <box style={{ flexDirection: "row", gap: 1 }}>
              <box style={{ flexGrow: 1 }}>
                <ColorPropWithHex
                  label="Desc"
                  value={node.descriptionColor || ""}
                  focused={focusedField === "descriptionColor"}
                  onFocus={() => setFocusedField("descriptionColor")}
                  onChange={(v) => onUpdate({ descriptionColor: v })}
                />
              </box>
              <box style={{ flexGrow: 1 }}>
                <ColorPropWithHex
                  label="Sel Desc"
                  value={node.selectedDescriptionColor || ""}
                  focused={focusedField === "selectedDescriptionColor"}
                  onFocus={() => setFocusedField("selectedDescriptionColor")}
                  onChange={(v) => onUpdate({ selectedDescriptionColor: v })}
                />
              </box>
            </box>
          )}
        </box>
      )}
    </box>
  )
}

// List of select-specific property keys
export const SELECT_PROPERTY_KEYS = [
  "options", "showScrollIndicator", "showDescription", "wrapSelection",
  "itemSpacing", "fastScrollStep", "backgroundColor", "textColor",
  "selectedBackgroundColor", "selectedTextColor", "descriptionColor", "selectedDescriptionColor"
] as const
