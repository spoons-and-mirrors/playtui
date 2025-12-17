import { useCallback, useRef, useEffect, useMemo } from "react"
import type { Renderable, RenderableType } from "../lib/types"
import { log } from "../lib/logger"
import {
  genId,
  findNode,
  findParent,
  updateNode,
  addChild,
  removeNode,
  flattenTree,
  cloneNode,
  moveNode,
} from "../lib/tree"
import { RENDERABLE_REGISTRY } from "../components/renderables"

interface UseBuilderActionsParams {
  tree: Renderable | null
  selectedId: string | null
  clipboard: Renderable | null
  setClipboard: (node: Renderable | null) => void
  updateTree: (tree: Renderable, addToHistory?: boolean, newSelectedId?: string | null) => void
  setSelectedId: (id: string | null) => void
}

export function useBuilderActions({
  tree,
  selectedId,
  clipboard,
  setClipboard,
  updateTree,
  setSelectedId,
}: UseBuilderActionsParams) {
  // Store selectedId in a ref to avoid stale closure issues
  const selectedIdRef = useRef(selectedId)
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  // Flatten tree excluding root for navigation
  const flatNodes = useMemo(() => {
    if (!tree) return []
    const all = flattenTree(tree)
    return all.filter(n => n.id !== tree.id)
  }, [tree])

  // Get the parent container for adding new renderables (selected container or root)
  const getAddParent = useCallback((): Renderable | null => {
    if (!tree) return null
    if (!selectedId) return tree
    const node = findRenderable(tree, selectedId)
    if (!node) return tree
    if (RENDERABLE_REGISTRY[node.type]?.capabilities.supportsChildren) return node
    const parent = findParent(tree, selectedId)
    return parent || tree
  }, [tree, selectedId])

  const handleAddElement = useCallback((type: RenderableType) => {
    if (!tree) return
    const parent = getAddParent()
    if (!parent) return

    const entry = RENDERABLE_REGISTRY[type]
    if (!entry) return

    const newNode: Renderable = {
      id: genId(),
      type,
      name: entry.label,
      ...entry.defaults,
      children: [],
    }
    log("ADD_ELEMENT", { type, parentId: parent.id, parentChildren: parent.children.length, newNodeId: newNode.id, selectedId })
    const newTree = addChild(tree, parent.id, newNode)
    const parentAfter = findRenderable(newTree, parent.id)
    log("ADD_RESULT", { parentChildrenAfter: parentAfter?.children.length, newTreeRootChildren: newTree.children.length })
    updateTree(newTree, true, newNode.id)
    log("AFTER_UPDATE", { calledUpdateTree: true })
  }, [tree, selectedId, getAddParent, updateTree])

  const handleCopy = useCallback(() => {
    if (!selectedId || !tree) return
    const node = findRenderable(tree, selectedId)
    if (node) setClipboard(node)
  }, [selectedId, tree, setClipboard])

  const handlePaste = useCallback(() => {
    if (!clipboard || !tree) return
    const parent = getAddParent()
    if (!parent) return
    const cloned = cloneRenderable(clipboard)
    const newTree = addChild(tree, parent.id, cloned)
    updateTree(newTree, true, cloned.id)
  }, [clipboard, tree, getAddParent, updateTree])

  const handleDelete = useCallback(() => {
    if (!selectedId || !tree || selectedId === tree.id) return
    const parent = findParent(tree, selectedId)
    const newTree = removeRenderable(tree, selectedId)
    let nextId: string | null = null
    if (parent && parent.id !== tree.id) {
      nextId = parent.id
    } else if (parent && parent.children.length > 1) {
      const siblings = parent.children.filter(c => c.id !== selectedId)
      nextId = siblings[0]?.id || null
    }
    updateTree(newTree, true, nextId)
  }, [selectedId, tree, updateTree])

  const handleDuplicate = useCallback(() => {
    if (!selectedId || !tree) return
    const node = findRenderable(tree, selectedId)
    const parent = findParent(tree, selectedId)
    if (!node || !parent) return
    const cloned = cloneRenderable(node)
    const newTree = addChild(tree, parent.id, cloned)
    updateTree(newTree, true, cloned.id)
  }, [selectedId, tree, updateTree])

  const handleMoveNode = useCallback((direction: "up" | "down") => {
    if (!selectedId || !tree) return
    const newTree = moveRenderable(tree, selectedId, direction)
    if (newTree) updateTree(newTree, true)
  }, [selectedId, tree, updateTree])

  const handleUpdate = useCallback((updates: Partial<Renderable>, pushHistory = true) => {
    const currentSelectedId = selectedIdRef.current
    log("HANDLE_UPDATE", { updates, selectedId: currentSelectedId, pushHistory })
    if (!tree || !currentSelectedId) return
    const node = findRenderable(tree, currentSelectedId)
    if (!node) return
    const updated = { ...node, ...updates } as Renderable
    const newTree = updateRenderable(tree, currentSelectedId, updated)
    updateTree(newTree, pushHistory)
  }, [tree, updateTree])

  const handleRename = useCallback((id: string, name: string) => {
    log("HANDLE_RENAME", { id, name })
    if (!tree) return
    const node = findRenderable(tree, id)
    if (!node) return
    const updated = { ...node, name } as Renderable
    const newTree = updateRenderable(tree, id, updated)
    updateTree(newTree)
  }, [tree, updateTree])

  const navigateTree = useCallback((dir: "up" | "down") => {
    const idx = flatNodes.findIndex((n) => n.id === selectedId)
    if (idx === -1) { setSelectedId(flatNodes[0]?.id || null); return }
    const next = dir === "up" ? Math.max(0, idx - 1) : Math.min(flatNodes.length - 1, idx + 1)
    setSelectedId(flatNodes[next].id)
  }, [flatNodes, selectedId, setSelectedId])

  return {
    handleAddElement,
    handleCopy,
    handlePaste,
    handleDelete,
    handleDuplicate,
    handleMoveNode,
    handleUpdate,
    handleRename,
    navigateTree,
  }
}
