import { COLORS } from "../theme"
import type { ElementNode } from "./types"

let idCounter = 0
export const genId = (): string => `el-${++idCounter}`
export const resetIdCounter = () => { idCounter = 0 }

// Sync idCounter to be higher than any existing ID in the tree
export function syncIdCounter(root: ElementNode): void {
  const extractNum = (id: string): number => {
    const match = id.match(/^el-(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  }
  
  const findMaxId = (node: ElementNode): number => {
    const nodeNum = extractNum(node.id)
    const childMax = node.children.reduce((max, c) => Math.max(max, findMaxId(c)), 0)
    return Math.max(nodeNum, childMax)
  }
  
  const maxId = findMaxId(root)
  idCounter = maxId
}

export function findNode(root: ElementNode, id: string): ElementNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParent(root: ElementNode, id: string): ElementNode | null {
  for (const child of root.children) {
    if (child.id === id) return root
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

export function updateNode(root: ElementNode, id: string, updates: Partial<ElementNode>): ElementNode {
  if (root.id === id) return { ...root, ...updates }
  return { ...root, children: root.children.map((c) => updateNode(c, id, updates)) }
}

export function addChild(root: ElementNode, parentId: string, newChild: ElementNode): ElementNode {
  if (root.id === parentId) return { ...root, children: [...root.children, newChild] }
  return { ...root, children: root.children.map((c) => addChild(c, parentId, newChild)) }
}

export function removeNode(root: ElementNode, id: string): ElementNode {
  return {
    ...root,
    children: root.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  }
}

export function flattenTree(node: ElementNode, acc: ElementNode[] = []): ElementNode[] {
  acc.push(node)
  node.children.forEach((c) => flattenTree(c, acc))
  return acc
}

export function cloneNode(n: ElementNode): ElementNode {
  return { ...n, id: genId(), children: n.children.map(cloneNode) }
}
