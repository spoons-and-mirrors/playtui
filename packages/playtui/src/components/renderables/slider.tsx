import type { Renderable, SliderRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
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

// Slider properties are now rendered generically via PROPERTY_SECTIONS and
// SerializableProp metadata in renderables/index.ts.
