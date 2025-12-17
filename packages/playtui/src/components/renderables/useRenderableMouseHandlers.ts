import type { MouseEvent } from "@opentui/core"

/**
 * Shared mouse event handlers for all renderable components.
 * Consolidates select, hover, and drag initiation logic.
 */
export function useRenderableMouseHandlers(
  onSelect: () => void,
  onHover: (hovering: boolean) => void,
  onDragStart?: (x: number, y: number) => void
) {
  return {
    handleMouseDown: (e: MouseEvent) => {
      e.stopPropagation()
      onSelect()
      if (onDragStart) {
        onDragStart(e.x, e.y)
      }
    },
    handleMouseOver: () => onHover(true),
    handleMouseOut: () => onHover(false),
  }
}
