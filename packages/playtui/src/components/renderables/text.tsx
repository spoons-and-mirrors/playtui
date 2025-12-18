import { TextAttributes } from '@opentui/core'
import type { Renderable, TextRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// TEXT DEFAULTS
// =============================================================================

export const TEXT_DEFAULTS: Partial<TextRenderable> = {
  content: 'Text',
  fg: COLORS.text,
}

// =============================================================================
// TEXT RENDERER
// =============================================================================

interface TextRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function TextRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: TextRendererProps) {
  const node = genericNode as TextRenderable

  const { handleMouseDown, handleMouseOver, handleMouseOut } =
    useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  // Build text attributes bitmask
  let attrs = 0
  if (node.bold) attrs |= TextAttributes.BOLD
  if (node.italic) attrs |= TextAttributes.ITALIC
  if (node.underline) attrs |= TextAttributes.UNDERLINE
  if (node.dim) attrs |= TextAttributes.DIM
  if (node.strikethrough) attrs |= TextAttributes.STRIKETHROUGH

  const wrapperStyle = {
    ...buildPositioningStyle(node),
    backgroundColor: 'transparent',
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
  }

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      visible={node.visible !== false}
      style={wrapperStyle}
    >
      <text
        fg={node.fg || COLORS.text}
        bg={node.bg}
        wrapMode={node.wrapMode}
        selectable={node.selectable}
        attributes={attrs || undefined}
      >
        {node.content || ''}
      </text>
    </box>
  )
}
