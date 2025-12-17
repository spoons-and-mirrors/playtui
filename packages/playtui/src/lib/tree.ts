import { COLORS } from "../theme"
import type { Renderable } from "./types"

let idCounter = 0
export const genId = (): string => `el-${++idCounter}`
export const resetIdCounter = () => { idCounter = 0 }

// Sync idCounter to be higher than any existing ID in the tree
export function syncIdCounter(root: Renderable): void {
  const extractNum = (id: string): number => {
    const match = id.match(/^el-(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }
  
  const findMaxId = (renderable: Renderable): number => {
    const renderableNum = extractNum(renderable.id)
    const childMax = renderable.children.reduce((max, c) => Math.max(max, findMaxId(c)), 0)
    return Math.max(renderableNum, childMax)
  }
  
  const maxId = findMaxId(root)
  idCounter = maxId
}

export function findRenderable(root: Renderable, id: string): Renderable | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findRenderable(child, id)
    if (found) return found
  }
  return null
}

export function findParent(root: Renderable, id: string): Renderable | null {
  for (const child of root.children) {
    if (child.id === id) return root
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

export function updateRenderable(root: Renderable, id: string, updates: Partial<Renderable>): Renderable {
  if (root.id === id) return { ...root, ...updates }
  return { ...root, children: root.children.map((c) => updateRenderable(c, id, updates)) }
}

export function addChild(root: Renderable, parentId: string, newChild: Renderable): Renderable {
  if (root.id === parentId) return { ...root, children: [...root.children, newChild] }
  return { ...root, children: root.children.map((c) => addChild(c, parentId, newChild)) }
}

export function removeRenderable(root: Renderable, id: string): Renderable {
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeRenderable(c, id)),
  }
}

export function flattenTree(renderable: Renderable, acc: Renderable[] = []): Renderable[] {
  acc.push(renderable)
  renderable.children.forEach((c) => flattenTree(c, acc))
  return acc
}

export function countRenderables(renderable: Renderable): number {
  return 1 + renderable.children.reduce((sum, c) => sum + countRenderables(c), 0)
}

export function cloneRenderable(r: Renderable): Renderable {
  return { ...r, id: genId(), children: r.children.map(cloneRenderable) }
}

// Move a renderable up or down within its parent's children array (sibling-only movement)
// Returns null if move is not possible (at boundary or renderable not found)
export function moveRenderable(root: Renderable, renderableId: string, direction: "up" | "down"): Renderable | null {
  const parent = findParent(root, renderableId)
  if (!parent) return null
  
  const idx = parent.children.findIndex(c => c.id === renderableId)
  if (idx === -1) return null
  
  const newIdx = direction === "up" ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= parent.children.length) return null // at boundary
  
  // Swap the renderables
  const newChildren = [...parent.children]
  const temp = newChildren[idx]
  newChildren[idx] = newChildren[newIdx]
  newChildren[newIdx] = temp
  
  return updateRenderable(root, parent.id, { children: newChildren })
}

// Calculate approximate position of a renderable by accumulating x/y offsets up the tree
// Returns { x, y } representing the renderable's offset from the root
export function getRenderablePosition(root: Renderable, renderableId: string): { x: number; y: number } | null {
  const path: Renderable[] = []
  
  function findPath(renderable: Renderable): boolean {
    path.push(renderable)
    if (renderable.id === renderableId) return true
    for (const child of renderable.children) {
      if (findPath(child)) return true
    }
    path.pop()
    return false
  }
  
  if (!findPath(root)) return null
  
  let x = 0
  let y = 0
  for (const renderable of path) {
    x += renderable.x ?? 0
    y += renderable.y ?? 0
  }
  
  return { x, y }
}
