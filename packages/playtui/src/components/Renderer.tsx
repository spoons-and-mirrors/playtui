import type { Renderable } from '../lib/types'
import { RENDERABLE_REGISTRY } from './renderables'
import { log } from '../lib/logger'

// ============================================================================
// Renderer - renders Renderable tree
// ============================================================================

export interface DragEvent {
  renderableId: string
  x: number
  y: number
}

export interface RendererProps {
  node: Renderable
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onDragStart?: (event: DragEvent) => void
}

export function Renderer({
  node,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onDragStart,
}: RendererProps) {
  const isSelected = node.id === selectedId
  const isHovered = node.id === hoveredId && !isSelected
  const isRoot = node.id === 'root'

  log('RENDER', {
    id: node.id,
    type: node.type,
    childCount: node.children.length,
    childIds: node.children.map((c) => c.id),
  })

  // Root element: render children directly (canvas is the root container)
  if (isRoot) {
    return (
      <>
        {node.children.map((child) => (
          <Renderer
            key={child.id}
            node={child}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onDragStart={onDragStart}
          />
        ))}
      </>
    )
  }

  const entry = RENDERABLE_REGISTRY[node.type]
  if (!entry) return null

  const { Renderer: RenderableRenderer, capabilities } = entry

  // Recursively render children for container renderables
  const children = capabilities.supportsChildren
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

  return RenderableRenderer({
    node,
    onSelect: () => onSelect(node.id),
    onHover: (h: boolean) => onHover(h ? node.id : null),
    onDragStart: onDragStart
      ? (x: number, y: number) => onDragStart({ renderableId: node.id, x, y })
      : undefined,
    children,
  })
}
