import type { Renderable, InputRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// INPUT DEFAULTS
// =============================================================================

export const INPUT_DEFAULTS: Partial<InputRenderable> = {
  width: 20,
  height: 1,
  placeholder: 'Enter text...',
}

// =============================================================================
// INPUT RENDERER
// =============================================================================

interface InputRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function InputRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: InputRendererProps) {
  const node = genericNode as InputRenderable

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
      <text fg={node.placeholderColor || COLORS.muted}>
        {node.placeholder || 'Input...'}
      </text>
    </box>
  )
}

// =============================================================================
// INPUT PROPERTIES PANEL
// =============================================================================

// Input properties are now rendered generically via PROPERTY_SECTIONS and
// SerializableProp metadata in renderables/index.ts.
