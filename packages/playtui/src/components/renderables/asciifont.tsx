import type { MouseEvent } from '@opentui/core'
import type { Renderable, AsciiFontRenderable } from '../../lib/types'
import { COLORS } from '../../theme'

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
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function AsciiFontRenderer({
  node: genericNode,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDragStart,
}: AsciiFontRendererProps) {
  const node = genericNode as AsciiFontRenderable

  const safeFont =
    node.font && VALID_FONTS.includes(node.font as any) ? node.font : 'block'

  // Enable dragging for all positioned elements
  const isDraggable = true

  // Drag start handler - canvas handles move/end
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (isDraggable && onDragStart) {
      onDragStart(e.x, e.y)
    }
  }

  const wrapperStyle = {
    margin: node.margin,
    marginTop: node.marginTop,
    marginRight: node.marginRight,
    marginBottom: node.marginBottom,
    marginLeft: node.marginLeft,
    position: node.position,
    top: node.y,
    left: node.x,
    zIndex: node.zIndex,
  }

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={wrapperStyle}
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
