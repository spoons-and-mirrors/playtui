import type { ElementNode, SliderNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  NumberProp, SelectProp, ColorPropWithHex, SectionHeader
} from "../controls"
import { DraggableWrapper } from "./DraggableWrapper"

// =============================================================================
// SLIDER DEFAULTS
// =============================================================================

export const SLIDER_DEFAULTS: Partial<SliderNode> = {
  width: 20,
  orientation: "horizontal",
  value: 50,
  min: 0,
  max: 100,
  foregroundColor: COLORS.accent,
}

// =============================================================================
// SLIDER RENDERER
// =============================================================================

interface SliderRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function SliderRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: SliderRendererProps) {
  const node = genericNode as SliderNode
  const isHorizontal = node.orientation !== "vertical"
  const val = node.value ?? 50
  const min = node.min ?? 0
  const max = node.max ?? 100
  const pct = Math.round(((val - min) / (max - min)) * 100)
  const trackChar = isHorizontal ? "─" : "│"
  const thumbChar = "●"

  return (
    <DraggableWrapper
      node={node}
      isSelected={isSelected}
      isHovered={isHovered}
      onSelect={onSelect}
      onHover={onHover}
      onDragStart={onDragStart}
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
      <text fg={node.foregroundColor || COLORS.accent}>
        {isHorizontal
          ? trackChar.repeat(Math.floor(pct / 10)) + thumbChar + trackChar.repeat(10 - Math.floor(pct / 10))
          : `${thumbChar} ${pct}%`
        }
      </text>
    </DraggableWrapper>
  )
}

// =============================================================================
// SLIDER PROPERTIES PANEL
// =============================================================================

interface SliderPropertiesProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function SliderProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: SliderPropertiesProps) {
  const node = genericNode as SliderNode
  const min = node.min ?? 0
  const max = node.max ?? 100

  return (
    <box id="section-slider" style={{ flexDirection: "column" }}>
      <SectionHeader title="─ Slider" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Orientation */}
          <SelectProp
            label="Orient"
            value={node.orientation || "horizontal"}
            options={["horizontal", "vertical"]}
            onChange={(v) => onUpdate({ orientation: v as any })}
          />

          {/* Value range */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Range ─</text>
          </box>

          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                label="Min"
                value={min}
                min={0}
                max={1000}
                onChange={(v) => onUpdate({ min: v })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                label="Max"
                value={max}
                min={0}
                max={1000}
                onChange={(v) => onUpdate({ max: v })}
              />
            </box>
          </box>

          <NumberProp
            label="Value"
            value={node.value ?? 50}
            min={min}
            max={max}
            onChange={(v) => onUpdate({ value: v })}
          />

          <NumberProp
            label="Viewport"
            value={node.viewPortSize ?? Math.max(1, (max - min) * 0.1)}
            min={1}
            max={100}
            onChange={(v) => onUpdate({ viewPortSize: v })}
          />

          {/* Colors */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Colors ─</text>
          </box>

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
                label="Thumb"
                value={node.foregroundColor || ""}
                focused={focusedField === "foregroundColor"}
                onFocus={() => setFocusedField("foregroundColor")}
                onChange={(v) => onUpdate({ foregroundColor: v })}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}

// List of slider-specific property keys
export const SLIDER_PROPERTY_KEYS = [
  "orientation", "value", "min", "max", "viewPortSize",
  "backgroundColor", "foregroundColor"
] as const
