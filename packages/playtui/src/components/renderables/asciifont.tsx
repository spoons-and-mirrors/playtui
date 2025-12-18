import type { Renderable, AsciiFontRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// Valid font names in OpenTUI
const VALID_FONTS = ['tiny', 'block', 'slick', 'shade'] as const

// =============================================================================
// ASCIIFONT DEFAULTS
// =============================================================================

export const ASCIIFONT_DEFAULTS: Partial<AsciiFontRenderable> = {
  text: '',
  font: 'block',
  color: COLORS.accent,
}

// =============================================================================
// ASCIIFONT RENDERER
// =============================================================================

interface AsciiFontRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function AsciiFontRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: AsciiFontRendererProps) {
  const node = genericNode as AsciiFontRenderable

  const safeFont =
    node.font && VALID_FONTS.includes(node.font as any) ? node.font : 'block'

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
      {node.text ? (
        <ascii-font
          text={node.text}
          font={safeFont}
          color={node.color || COLORS.accent}
        />
      ) : null}
    </box>
  )
}
