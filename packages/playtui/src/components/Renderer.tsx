import { useState, useEffect } from "react"
import type { ElementNode } from "../lib/types"
import { ELEMENT_REGISTRY } from "./elements"
import { log } from "../lib/logger"
import type { AnimationData } from "../lib/codegen"

// ============================================================================
// Animation Player - renders animation data using the Renderer
// ============================================================================

export interface AnimationPlayerProps {
  data: AnimationData
  fpsOverride?: number
}

export function AnimationPlayer({ data, fpsOverride }: AnimationPlayerProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const fps = fpsOverride ?? data.fps

  useEffect(() => {
    if (data.frames.length <= 1) return
    const id = setInterval(() => {
      setFrameIndex(f => (f + 1) % data.frames.length)
    }, 1000 / fps)
    return () => clearInterval(id)
  }, [data.frames.length, fps])

  const frame = data.frames[frameIndex]
  if (!frame) return null

  return (
    <Renderer
      node={frame}
      selectedId={null}
      hoveredId={null}
      onSelect={() => {}}
      onHover={() => {}}
    />
  )
}

// ============================================================================
// Renderer - renders ElementNode tree
// ============================================================================

export interface DragEvent {
  nodeId: string
  x: number
  y: number
}

export interface RendererProps {
  node: ElementNode
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onDragStart?: (event: DragEvent) => void
}

export function Renderer({ node, selectedId, hoveredId, onSelect, onHover, onDragStart }: RendererProps) {
  const isSelected = node.id === selectedId
  const isHovered = node.id === hoveredId && !isSelected
  const isRoot = node.id === "root"

  log("RENDER", { id: node.id, type: node.type, childCount: node.children.length, childIds: node.children.map(c => c.id) })

  // Root element: render children directly (canvas is the root container)
  if (isRoot) {
    return (
      <>
        {node.children.map((child) => (
          <Renderer key={child.id} node={child} selectedId={selectedId} hoveredId={hoveredId} onSelect={onSelect} onHover={onHover} onDragStart={onDragStart} />
        ))}
      </>
    )
  }

  const entry = ELEMENT_REGISTRY[node.type]
  if (!entry) return null

  const { Renderer: ElementRenderer, hasChildren } = entry

  // Recursively render children for container elements
  const children = hasChildren
    ? node.children.map((child) => (
        <Renderer
          key={child.id}
          node={child}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
          onDragStart={onDragStart}
        />
      ))
    : undefined

  return ElementRenderer({
    node,
    isSelected,
    isHovered,
    onSelect: () => onSelect(node.id),
    onHover: (h: boolean) => onHover(h ? node.id : null),
    onDragStart: onDragStart ? (x: number, y: number) => onDragStart({ nodeId: node.id, x, y }) : undefined,
    children,
  })
}
