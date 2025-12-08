import type { ElementNode } from "../lib/types"
import { ELEMENT_REGISTRY } from "./elements"
import { log } from "../lib/logger"

export interface RendererProps {
  node: ElementNode
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function Renderer({ node, selectedId, hoveredId, onSelect, onHover }: RendererProps) {
  const isSelected = node.id === selectedId
  const isHovered = node.id === hoveredId && !isSelected
  const isRoot = node.id === "root"

  log("RENDER", { id: node.id, type: node.type, childCount: node.children.length, childIds: node.children.map(c => c.id) })

  // Root element: render children directly (canvas is the root container)
  if (isRoot) {
    return (
      <>
        {node.children.map((child) => (
          <Renderer key={child.id} node={child} selectedId={selectedId} hoveredId={hoveredId} onSelect={onSelect} onHover={onHover} />
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
        />
      ))
    : undefined

  return ElementRenderer({
    node,
    isSelected,
    isHovered,
    onSelect: () => onSelect(node.id),
    onHover: (h: boolean) => onHover(h ? node.id : null),
    children,
  })
}
