/**
 * EditorPanel - The central canvas area where elements are rendered and manipulated.
 * 
 * This is the mental entry point for all canvas-related concerns:
 * - Element rendering (via Renderer)
 * - Selection/hover visual feedback
 * - Auto-layout centering
 * - Background click handling
 * 
 * DRAG ARCHITECTURE:
 * Drag events are captured at the CANVAS level, not the element level.
 * This ensures smooth dragging even when the mouse moves outside an element's bounds.
 * Elements only report drag start (via onMouseDown), then the canvas tracks all movement.
 */

import type { MouseEvent } from "@opentui/core"
import { COLORS } from "../../theme"
import type { ElementNode } from "../../lib/types"
import { Renderer, type DragEvent } from "../Renderer"
import { useRef } from "react"

// Re-export Renderer for consumers who need direct access
export { Renderer } from "../Renderer"

interface EditorPanelProps {
  tree: ElementNode
  treeKey: number
  selectedId: string | null
  hoveredId: string | null
  autoLayout: boolean
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onBackgroundClick: () => void
  onToggleAutoLayout: () => void
  onDragStart?: (event: DragEvent) => void
  onDragMove?: (event: DragEvent) => void
  onDragEnd?: (nodeId: string) => void
  hideCenterButton?: boolean
}

export function EditorPanel({
  tree,
  treeKey,
  selectedId,
  hoveredId,
  autoLayout,
  onSelect,
  onHover,
  onBackgroundClick,
  onToggleAutoLayout,
  onDragStart,
  onDragMove,
  onDragEnd,
  hideCenterButton = false,
}: EditorPanelProps) {
  // Track which node is being dragged (captured at canvas level)
  const draggingNodeId = useRef<string | null>(null)

  // Handle drag start from an element - store the node ID for canvas-level tracking
  const handleElementDragStart = (event: DragEvent) => {
    draggingNodeId.current = event.nodeId
    onDragStart?.(event)
  }

  // Canvas-level drag handler - fires for all mouse drags on the canvas
  const handleCanvasDrag = (e: MouseEvent) => {
    if (!draggingNodeId.current || !onDragMove) return
    e.stopPropagation()
    onDragMove({
      nodeId: draggingNodeId.current,
      x: e.x,
      y: e.y,
    })
  }

  // Canvas-level drag end handler
  const handleCanvasDragEnd = (e: MouseEvent) => {
    if (!draggingNodeId.current || !onDragEnd) return
    e.stopPropagation()
    const nodeId = draggingNodeId.current
    draggingNodeId.current = null
    onDragEnd(nodeId)
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
      {/* Header row with Center toggle */}
      <box style={{ flexDirection: "row", justifyContent: "flex-end", flexShrink: 0, height: 1 }}>
        {!hideCenterButton && (
          <box
            id="auto-layout-toggle"
            onMouseDown={onToggleAutoLayout}
            style={{
              backgroundColor: autoLayout ? COLORS.accent : COLORS.card,
              paddingLeft: 1,
              paddingRight: 1,
            }}
          >
            <text fg={autoLayout ? COLORS.bg : COLORS.muted}>⊞ Center</text>
          </box>
        )}
      </box>

      {/* Canvas area - captures drag events at this level for smooth dragging */}
      <box
        id="editor-canvas"
        onMouseDown={onBackgroundClick}
        onMouseDrag={handleCanvasDrag}
        onMouseDragEnd={handleCanvasDragEnd}
        style={{
          flexGrow: 1,
          justifyContent: autoLayout ? "center" : "flex-start",
          alignItems: autoLayout ? "center" : "flex-start",
        }}
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
  )
}
