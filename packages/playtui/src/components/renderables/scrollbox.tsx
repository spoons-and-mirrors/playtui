import type { Renderable, ScrollboxRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// SCROLLBOX DEFAULTS
// =============================================================================

export const SCROLLBOX_DEFAULTS: Partial<ScrollboxRenderable> = {
  width: 20,
  height: 8,
  backgroundColor: COLORS.bgAlt,
  flexDirection: 'column',
  border: true,
  borderStyle: 'rounded',
  borderColor: COLORS.border,
}

// =============================================================================
// SCROLLBOX RENDERER
// =============================================================================

interface ScrollboxRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  children?: React.ReactNode
}

export function ScrollboxRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
  children,
}: ScrollboxRendererProps) {
  const node = genericNode as ScrollboxRenderable
  const hasBorder = node.border === true
  const borderValue = hasBorder
    ? node.borderSides && node.borderSides.length > 0
      ? node.borderSides
      : true
    : undefined

  const { handleMouseDown, handleMouseOver, handleMouseOut } =
    useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  const scrollboxStyle = {
    flexDirection: node.flexDirection || 'column',
    flexWrap: node.flexWrap,
    justifyContent: node.justifyContent,
    alignItems: node.alignItems,
    gap: node.gap,
    rowGap: node.rowGap,
    columnGap: node.columnGap,
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
    overflow: node.overflow,
    backgroundColor: node.backgroundColor || 'transparent',
  } as const

  // Build scrollbar options if any are set
  const scrollbarOptions =
    node.showScrollArrows ||
    node.scrollbarForeground ||
    node.scrollbarBackground
      ? {
          showArrows: node.showScrollArrows,
          trackOptions: {
            foregroundColor: node.scrollbarForeground,
            backgroundColor: node.scrollbarBackground,
          },
        }
      : undefined

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      visible={node.visible !== false}
      style={buildPositioningStyle(node)}
    >
      <scrollbox
        border={borderValue}
        borderStyle={hasBorder ? node.borderStyle || 'single' : 'single'}
        borderColor={node.borderColor}
        visible={node.visible !== false}
        title={node.title}
        titleAlignment={node.titleAlignment}
        stickyScroll={node.stickyScroll}
        stickyStart={node.stickyStart}
        scrollX={node.scrollX}
        scrollY={node.scrollY}
        viewportCulling={node.viewportCulling}
        style={{
          ...scrollboxStyle,
          width: '100%', // Fill wrapper
          height: '100%', // Fill wrapper
          contentOptions: {
            flexDirection: node.flexDirection || 'column',
            gap: node.gap,
          },
          scrollbarOptions,
        }}
      >
        {children}
      </scrollbox>
    </box>
  )
}
