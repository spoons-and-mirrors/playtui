import type { Renderable, TextareaRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// TEXTAREA DEFAULTS
// =============================================================================

export const TEXTAREA_DEFAULTS: Partial<TextareaRenderable> = {
  width: 30,
  height: 4,
  placeholder: 'Enter multi-line text...',
  minHeight: 1,
  maxHeight: 6,
}

// =============================================================================
// TEXTAREA RENDERER
// =============================================================================

interface TextareaRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function TextareaRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: TextareaRendererProps) {
  const node = genericNode as TextareaRenderable

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
      <text fg={node.placeholderColor || COLORS.muted} wrapMode="word">
        {node.initialValue || node.placeholder || 'Multi-line input...'}
      </text>
    </box>
  )
}

// =============================================================================
// TEXTAREA PROPERTIES PANEL
// =============================================================================

// Textarea properties are now rendered generically via PROPERTY_SECTIONS and
// SerializableProp metadata in renderables/index.ts.
