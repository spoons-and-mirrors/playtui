import type { Renderable, SizeValue } from '../../lib/types'

/**
 * Consolidates positioning, margin, and size styles used by all renderable components.
 */

/**
 * Builds the standard positioning and margin style object for a renderable.
 */
export function buildPositioningStyle(node: Renderable) {
  return {
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
}

/**
 * Parses a size value (number, "auto", or percentage) for OpenTUI style properties.
 */
export function parseSize(val: SizeValue | undefined) {
  if (val === undefined || val === 'auto') return undefined
  return val
}
