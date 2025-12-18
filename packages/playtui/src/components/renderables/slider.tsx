import type { Renderable, SliderRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import {
  NumberProp,
  SelectProp,
  ManagedColorControl,
  SectionHeader,
} from '../controls'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// SLIDER DEFAULTS
// =============================================================================

export const SLIDER_DEFAULTS: Partial<SliderRenderable> = {
  width: 20,
  orientation: 'horizontal',
  value: 50,
  min: 0,
  max: 100,
  foregroundColor: COLORS.accent,
}

// =============================================================================
// SLIDER RENDERER
// =============================================================================

interface SliderRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function SliderRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: SliderRendererProps) {
  const node = genericNode as SliderRenderable
  const isHorizontal = node.orientation !== 'vertical'
  const val = node.value ?? 50
  const min = node.min ?? 0
  const max = node.max ?? 100
  const pct = Math.round(((val - min) / (max - min)) * 100)
  const trackChar = isHorizontal ? '─' : '│'
  const thumbChar = '●'

  const { handleMouseDown, handleMouseOver, handleMouseOut } =
    useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      visible={node.visible !== false}
      style={buildPositioningStyle(node)}
    >
      <text fg={node.foregroundColor || COLORS.accent}>
        {isHorizontal
          ? trackChar.repeat(Math.floor(pct / 10)) +
            thumbChar +
            trackChar.repeat(10 - Math.floor(pct / 10))
          : `${thumbChar} ${pct}%`}
      </text>
    </box>
  )
}

// =============================================================================
// SLIDER PROPERTIES PANEL
// =============================================================================

interface SliderPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function SliderProperties({
  node: genericNode,
  onUpdate,
  focusedField,
  setFocusedField,
  collapsed,
  onToggle,
  pickingForField,
  setPickingForField,
}: SliderPropertiesProps) {
  const node = genericNode as SliderRenderable
  const min = node.min ?? 0
  const max = node.max ?? 100

  return (
    <box id="section-slider" style={{ flexDirection: 'column' }}>
      <SectionHeader
        title="─ Slider"
        collapsed={collapsed}
        onToggle={onToggle}
      />
      {!collapsed && (
        <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
          {/* Orientation */}
          <SelectProp
            label="Orient"
            value={node.orientation || 'horizontal'}
            options={['horizontal', 'vertical']}
            onChange={(v) => onUpdate({ orientation: v as any })}
          />

          {/* Value range */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Range ─</text>
          </box>

          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                id="slider-min"
                label="Min"
                value={min}
                min={0}
                max={1000}
                onChange={(v) => onUpdate({ min: v })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                id="slider-max"
                label="Max"
                value={max}
                min={0}
                max={1000}
                onChange={(v) => onUpdate({ max: v })}
              />
            </box>
          </box>

          <NumberProp
            id="slider-val"
            label="Value"
            value={node.value ?? 50}
            min={min}
            max={max}
            onChange={(v) => onUpdate({ value: v })}
          />

          <NumberProp
            id="slider-viewport"
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

          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="BG"
                field="backgroundColor"
                value={node.backgroundColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="Thumb"
                field="foregroundColor"
                value={node.foregroundColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}
