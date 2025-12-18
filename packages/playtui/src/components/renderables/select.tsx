import type { Renderable, SelectRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// SELECT DEFAULTS
// =============================================================================

export const SELECT_DEFAULTS: Partial<SelectRenderable> = {
  width: 20,
  height: 5,
  options: ['Option 1', 'Option 2', 'Option 3'],
}

// =============================================================================
// SELECT RENDERER
// =============================================================================

interface SelectRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function SelectRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: SelectRendererProps) {
  const node = genericNode as SelectRenderable
  const options = node.options || ['Option 1', 'Option 2']
  const selBgColor = node.selectedBackgroundColor || COLORS.accent
  const textColor = node.textColor || COLORS.text
  const selTextColor = node.selectedTextColor || COLORS.bg

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
      {options.slice(0, 5).map((opt, i) => (
        <box
          key={i}
          style={{
            paddingLeft: 1,
            backgroundColor: i === 0 ? selBgColor : 'transparent',
          }}
        >
          <text fg={i === 0 ? selTextColor : textColor}>
            {i === 0 ? '▶ ' : '  '}
            {opt}
          </text>
        </box>
      ))}
      {node.showScrollIndicator && options.length > 5 && (
        <text fg={COLORS.muted} style={{ paddingLeft: 1 }}>
          {' '}
          ↓ more...
        </text>
      )}
    </box>
  )
}
