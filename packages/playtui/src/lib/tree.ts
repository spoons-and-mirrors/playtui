import { COLORS } from "../theme"
import type { RenderableNode } from "./types"

let idCounter = 0
export const genId = (): string => `el-${++idCounter}`
export const resetIdCounter = () => { idCounter = 0 }

// Sync idCounter to be higher than any existing ID in the tree
export function syncIdCounter(root: RenderableNode): void {
  const extractNum = (id: string): number => {
    const match = id.match(/^el-(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }
  
  const findMaxId = (node: RenderableNode): number => {
    const nodeNum = extractNum(node.id)
    const childMax = node.children.reduce((max, c) => Math.max(max, findMaxId(c)), 0)
    return Math.max(nodeNum, childMax)
  }
  
  const maxId = findMaxId(root)
  idCounter = maxId
}

export function findNode(root: RenderableNode, id: string): RenderableNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParent(root: RenderableNode, id: string): RenderableNode | null {
  for (const child of root.children) {
    if (child.id === id) return root
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

export function updateNode(root: RenderableNode, id: string, updates: Partial<RenderableNode>): RenderableNode {
  if (root.id === id) return { ...root, ...updates }
  return { ...root, children: root.children.map((c) => updateNode(c, id, updates)) }
}

export function addChild(root: RenderableNode, parentId: string, newChild: RenderableNode): RenderableNode {
  if (root.id === parentId) return { ...root, children: [...root.children, newChild] }
  return { ...root, children: root.children.map((c) => addChild(c, parentId, newChild)) }
}

export function removeNode(root: RenderableNode, id: string): RenderableNode {
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  }
}

export function flattenTree(node: RenderableNode, acc: RenderableNode[] = []): RenderableNode[] {
  acc.push(node)
  node.children.forEach((c) => flattenTree(c, acc))
  return acc
}

export function countNodes(node: RenderableNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0)
}

export function cloneNode(n: RenderableNode): RenderableNode {
  return { ...n, id: genId(), children: n.children.map(cloneNode) }
}

// Move a node up or down within its parent's children array (sibling-only movement)
// Returns null if move is not possible (at boundary or node not found)
export function moveNode(root: RenderableNode, nodeId: string, direction: "up" | "down"): RenderableNode | null {
  const parent = findParent(root, nodeId)
  if (!parent) return null
  
  const idx = parent.children.findIndex(c => c.id === nodeId)
  if (idx === -1) return null
  
  const newIdx = direction === "up" ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= parent.children.length) return null // at boundary
  
  // Swap the nodes
  const newChildren = [...parent.children]
  const temp = newChildren[idx]
  newChildren[idx] = newChildren[newIdx]
  newChildren[newIdx] = temp
  
  return updateNode(root, parent.id, { children: newChildren })
}

// Calculate approximate position of a node by accumulating x/y offsets up the tree
// Returns { x, y } representing the node's offset from the root
export function getNodePosition(root: RenderableNode, nodeId: string): { x: number; y: number } | null {
  const path: RenderableNode[] = []
  
  function findPath(node: RenderableNode): boolean {
    path.push(node)
    if (node.id === nodeId) return true
    for (const child of node.children) {
      if (findPath(child)) return true
    }
    path.pop()
    return false
  }
  
  if (!findPath(root)) return null
  
  let x = 0
  let y = 0
  for (const node of path) {
    x += node.x ?? 0
    y += node.y ?? 0
  }
  
  return { x, y }
}
