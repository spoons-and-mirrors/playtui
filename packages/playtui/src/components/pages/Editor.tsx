/**
 * EditorPanel - The central canvas area where elements are rendered and manipulated.
 * 
 * This is the mental entry point for all canvas-related concerns:
 * - Element rendering (via Renderer)
 * - Selection/hover visual feedback
 * - Auto-layout centering
 * - Background click handling
 * - Canvas panning (middle-mouse drag)
 * 
 * DRAG ARCHITECTURE:
 * Drag events are captured at the CANVAS level, not the element level.
 * This ensures smooth dragging even when the mouse moves outside an element's bounds.
 * Elements only report drag start (via onMouseDown), then the canvas tracks all movement.
 * 
 * CANVAS PANNING:
 * Middle-mouse drag pans the canvas viewport. The offset state is managed by the parent
 * and passed down, allowing the canvas position to persist across mode switches.
 */

import type { MouseEvent } from "@opentui/core"
import { MouseButton } from "@opentui/core"
import { COLORS } from "../../theme"
import type { Renderable } from "../../lib/types"
import { Renderer, type DragEvent } from "../Renderer"
import { useRef } from "react"

// Re-export Renderer for consumers who need direct access
export { Renderer } from "../Renderer"

export interface CanvasOffset {
  x: number
  y: number
}

interface EditorPanelProps {
  tree: Renderable
  treeKey: number
  selectedId: string | null
  hoveredId: string | null
  canvasOffset: CanvasOffset
  canvasOffsetAdjustY?: number
  onCanvasOffsetChange: (offset: CanvasOffset) => void
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onBackgroundClick: () => void
  onDragStart?: (event: DragEvent) => void
  onDragMove?: (event: DragEvent) => void
  onDragEnd?: (renderableId: string) => void
}

export function EditorPanel({
  tree,
  treeKey,
  selectedId,
  hoveredId,
  canvasOffset,
  canvasOffsetAdjustY = 0,
  onCanvasOffsetChange,
  onSelect,
  onHover,
  onBackgroundClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: EditorPanelProps) {
  // Track which node is being dragged (captured at canvas level)
  const draggingRenderableId = useRef<string | null>(null)

  // Track pan start position
  const panStartRef = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number } | null>(null)

  // Handle drag start from an element - store the node ID for canvas-level tracking
  const handleElementDragStart = (event: DragEvent) => {
    draggingRenderableId.current = event.renderableId
    onDragStart?.(event)
  }

  // Canvas-level drag handler - fires for all mouse drags on the canvas
  const handleCanvasDrag = (e: MouseEvent) => {
    // Handle canvas panning (middle-mouse)
    if (panStartRef.current) {
      const deltaX = e.x - panStartRef.current.mouseX
      const deltaY = e.y - panStartRef.current.mouseY
      onCanvasOffsetChange({
        x: panStartRef.current.offsetX + deltaX,
        y: panStartRef.current.offsetY + deltaY,
      })
      return
    }

    // Handle element dragging
    if (!draggingRenderableId.current || !onDragMove) return

    e.stopPropagation()
    onDragMove({
      renderableId: draggingRenderableId.current,
      x: e.x,
      y: e.y,
    })
  }

  // Canvas-level drag end handler
  const handleCanvasDragEnd = (e: MouseEvent) => {
    // End canvas panning
    if (panStartRef.current) {
      panStartRef.current = null
      return
    }

    // End element dragging
    if (!draggingRenderableId.current || !onDragEnd) return

    e.stopPropagation()
    const renderableId = draggingRenderableId.current
    draggingRenderableId.current = null
    onDragEnd(renderableId)
  }

  return (
    <box
      id="editor-panel"
      style={{
        backgroundColor: COLORS.bg,
        flexGrow: 1,
        flexDirection: "column",
      }}
    >
      {/* Canvas area - captures drag events at this level for smooth dragging */}
      <box
        id="editor-canvas"
        onMouseDown={(e: MouseEvent) => {
          // Middle-mouse: start canvas panning
          if (e.button === MouseButton.MIDDLE) {
            panStartRef.current = {
              mouseX: e.x,
              mouseY: e.y,
              offsetX: canvasOffset.x,
              offsetY: canvasOffset.y,
            }
            e.stopPropagation()
            return
          }

          // Left-click on background: deselect
          onBackgroundClick()
        }}
        onMouseDrag={handleCanvasDrag}
        onMouseDragEnd={handleCanvasDragEnd}
        style={{
          flexGrow: 1,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <box
          id="canvas-viewport"
          position="relative"
          left={canvasOffset.x}
          top={canvasOffset.y + canvasOffsetAdjustY / 2}
        >
          <Renderer
            key={treeKey}
            node={tree}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onDragStart={handleElementDragStart}
          />
        </box>
      </box>
    </box>
  )
}
