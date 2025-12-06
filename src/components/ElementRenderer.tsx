import type { ElementNode } from "../lib/types"
import { ELEMENT_REGISTRY } from "./elements"

interface ElementRendererProps {
  node: ElementNode
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function ElementRenderer({ node, selectedId, hoveredId, onSelect, onHover }: ElementRendererProps) {
  const isSelected = node.id === selectedId
  const isHovered = node.id === hoveredId && !isSelected
  const isRoot = node.id === "root"

  // Root element: render children directly (canvas is the root container)
  if (isRoot) {
    return (
      <>
        {node.children.map((child) => (
          <ElementRenderer key={child.id} node={child} selectedId={selectedId} hoveredId={hoveredId} onSelect={onSelect} onHover={onHover} />
        ))}
      </>
    )
  }

  const entry = ELEMENT_REGISTRY[node.type]
  if (!entry) return null

  const { Renderer, hasChildren } = entry

  // Recursively render children for container elements
  const children = hasChildren
    ? node.children.map((child) => (
        <ElementRenderer
          key={child.id}
          node={child}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))
    : undefined

  return Renderer({
    node,
    isSelected,
    isHovered,
    onSelect: () => onSelect(node.id),
    onHover: (h: boolean) => onHover(h ? node.id : null),
    children,
  })
}
