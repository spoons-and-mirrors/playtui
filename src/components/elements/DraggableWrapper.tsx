/**
 * DraggableWrapper - A wrapper component that enables drag behavior for absolute positioned elements.
 * 
 * Handles:
 * - Selection on click
 * - Hover state
 * - Drag start for absolute positioned elements (canvas handles move/end)
 */

import type { MouseEvent } from "@opentui/core"
import type { ElementNode } from "../../lib/types"

interface DraggableWrapperProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  children: React.ReactNode
  style?: Record<string, any>
}

export function DraggableWrapper({
  node,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDragStart,
  children,
  style = {},
}: DraggableWrapperProps) {
  // Only enable dragging for absolute positioned elements
  const isDraggable = "position" in node && node.position === "absolute"

  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (isDraggable && onDragStart) {
      onDragStart(e.x, e.y)
    }
  }

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      visible={node.visible !== false}
      style={style}
    >
      {children}
    </box>
  )
}
