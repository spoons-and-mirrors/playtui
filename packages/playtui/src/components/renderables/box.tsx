import type { Renderable, BoxRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle, parseSize } from './styleHelpers'

// =============================================================================
// BOX DEFAULTS
// =============================================================================

export const BOX_DEFAULTS: Partial<BoxRenderable> = {
  width: 12,
  height: 4,
  backgroundColor: COLORS.bgAlt,
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  border: true,
  borderStyle: 'single',
  borderColor: COLORS.border,
}

// =============================================================================
// BOX RENDERER
// =============================================================================

interface BoxRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  children?: React.ReactNode
}

export function BoxRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
  children,
}: BoxRendererProps) {
  const node = genericNode as BoxRenderable
  const hasBorder = node.border === true

  const { handleMouseDown, handleMouseOver, handleMouseOut } =
    useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  const boxStyle = {
    ...buildPositioningStyle(node),

    // Sizing
    width: parseSize(node.width),
    height: parseSize(node.height),
    minWidth: node.minWidth,
    maxWidth: node.maxWidth,
    minHeight: node.minHeight,
    maxHeight: node.maxHeight,
    aspectRatio: node.aspectRatio,

    // Flex container
    flexDirection: node.flexDirection || 'column',
    flexWrap: node.flexWrap,
    justifyContent: node.justifyContent,
    alignItems: node.alignItems,
    alignContent: node.alignContent,
    gap: node.gap,
    rowGap: node.rowGap,
    columnGap: node.columnGap,

    // Flex item
    flexGrow: node.flexGrow,
    flexShrink: node.flexShrink,
    flexBasis: node.flexBasis,
    alignSelf: node.alignSelf,

    // Padding
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,

    // Overflow
    overflow: node.overflow,

    // Background
    backgroundColor: node.backgroundColor || 'transparent',
  } as const

  // Border props - only include when border is enabled
  const borderProps = hasBorder
    ? {
        border:
          node.borderSides && node.borderSides.length > 0
            ? node.borderSides
            : true,
        borderStyle: node.borderStyle || 'single',
        borderColor: node.borderColor,
        focusedBorderColor: node.focusedBorderColor,
        customBorderChars: node.customBorderChars,
      }
    : {}

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      {...borderProps}
      shouldFill={node.shouldFill}
      visible={node.visible !== false}
      title={hasBorder ? node.title : undefined}
      titleAlignment={hasBorder ? node.titleAlignment : undefined}
      style={boxStyle}
    >
      {children}
    </box>
  )
}
