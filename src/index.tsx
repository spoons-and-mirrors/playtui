import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useKeyboard } from "@opentui/react"
import { RGBA } from "@opentui/core"
import { COLORS } from "./theme"
import type { ElementNode, ElementType } from "./lib/types"
import { log, clearLog } from "./lib/logger"
import {
  genId, resetIdCounter,
  findNode, findParent, updateNode, addChild, removeNode, flattenTree, cloneNode, countNodes, moveNode
} from "./lib/tree"
import { generateCode, generateChildrenCode } from "./lib/codegen"
import { parseCode, parseCodeMultiple } from "./lib/parseCode"
import { ElementRenderer } from "./components/ElementRenderer"
import { ELEMENT_REGISTRY } from "./components/elements"
import { TreeView } from "./components/TreeView"
import { PropertyEditor } from "./components/PropertyEditor"
import { ActionBtn, Footer, CodePanel, ElementToolbar } from "./components/shared"
import { FileMenu, type MenuAction } from "./components/FileMenu"
import { ProjectModal } from "./components/ProjectModal"
import { DocsPanel } from "./components/DocsPanel"
import { useProject, type SaveStatus } from "./hooks/useProject"

// Keyboard shortcut to element type mapping
const ADD_SHORTCUTS: Record<string, ElementType> = {
  b: "box",
  t: "text",
  s: "scrollbox",
  i: "input",
  x: "textarea",
  e: "select",
  l: "slider",
  f: "ascii-font",
  w: "tab-select",
}

interface BuilderProps {
  width: number
  height: number
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null
  
  const text = status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Error saving"
  const color = status === "error" ? COLORS.danger : COLORS.muted
  
  return <text fg={color}>{text}</text>
}

// Half-char border characters for thin borders
const ThinBorderRight = {
  horizontal: " ", vertical: "▕", topLeft: " ", topRight: " ",
  bottomLeft: " ", bottomRight: " ", cross: " ",
  left: " ", right: " ", top: " ", bottom: " ",
  topT: " ", bottomT: " ", leftT: " ", rightT: " ",
}

const ThinBorderLeft = {
  horizontal: " ", vertical: "▏", topLeft: " ", topRight: " ",
  bottomLeft: " ", bottomRight: " ", cross: " ",
  left: " ", right: " ", top: " ", bottom: " ",
  topT: " ", bottomT: " ", leftT: " ", rightT: " ",
}

// Semi-transparent accent color for panel borders (50% opacity)
const BORDER_ACCENT = RGBA.fromInts(77, 168, 218, 128)

export function Builder({ width, height }: BuilderProps) {
  const {
    project,
    isLoading,
    saveStatus,
    projects,
    refreshProjects,
    createProject,
    loadProject,
    deleteProject,
    updateTree,
    setSelectedId: setProjectSelectedId,
    setCollapsed: setProjectCollapsed,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProject()

  // Clear debug log on startup
  useEffect(() => { clearLog() }, [])

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<"new" | "load" | "delete" | null>(null)
  const [showDocs, setShowDocs] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [clipboard, setClipboard] = useState<ElementNode | null>(null)
  const [autoLayout, setAutoLayout] = useState(true)

  // Derive state from project
  const tree = project?.tree ?? null
  const selectedId = project?.selectedId ?? null
  const collapsed = useMemo(() => new Set(project?.collapsed ?? []), [project?.collapsed])

  const selectedNode = selectedId && tree ? findNode(tree, selectedId) : null
  // Flatten tree excluding root for navigation
  const flatNodes = useMemo(() => {
    if (!tree) return []
    const all = flattenTree(tree)
    return all.filter(n => n.id !== tree.id)  // Exclude hidden root
  }, [tree])
  const code = useMemo(() => {
    if (!tree) return ""
    log("CODE_MEMO", { 
      treeId: tree.id, 
      treeName: tree.name,
      childCount: tree.children.length,
      children: tree.children.map(c => ({ id: c.id, type: c.type, name: c.name }))
    })
    return generateChildrenCode(tree)
  }, [tree])
  const treeKey = useMemo(() => (tree ? countNodes(tree) : 0), [tree])

  // Handle live code editing - parse code and update tree
  const handleCodeChange = useCallback((newCode: string) => {
    log("HANDLE_CODE_CHANGE", { newCodeLength: newCode.length, showCode })
    if (!tree) return
    
    // Empty code = clear all children
    if (!newCode.trim()) {
      updateTree({ ...tree, children: [] })
      setCodeError(null)
      return
    }
    
    // Parse the code - can be one or multiple elements
    const result = parseCodeMultiple(newCode)
    if (!result.success) {
      setCodeError(result.error || "Parse error")
      return
    }
    
    // Set parsed nodes as children of root
    const newChildren = result.nodes || (result.node ? [result.node] : [])
    updateTree({ ...tree, children: newChildren })
    setCodeError(null)
  }, [tree, updateTree])

  // Get the parent container for adding new elements (selected container or root)
  const getAddParent = useCallback((): ElementNode | null => {
    if (!tree) return null
    if (!selectedId) return tree  // Nothing selected = add to root
    const node = findNode(tree, selectedId)
    if (!node) return tree
    // If selected is a container, add to it; otherwise add to its parent
    if (node.type === "box" || node.type === "scrollbox") return node
    const parent = findParent(tree, selectedId)
    return parent || tree
  }, [tree, selectedId])

  // Add element by type using registry (single function replaces 9 handleAddXXX functions)
  const handleAddElement = useCallback((type: ElementType) => {
    if (!tree) return
    const parent = getAddParent()
    if (!parent) return
    
    const entry = ELEMENT_REGISTRY[type]
    if (!entry) return
    
    const newNode: ElementNode = {
      id: genId(),
      type,
      name: entry.label,
      ...entry.defaults,
      children: [],
    }
    log("ADD_ELEMENT", { type, parentId: parent.id, parentChildren: parent.children.length, newNodeId: newNode.id, selectedId })
    const newTree = addChild(tree, parent.id, newNode)
    const parentAfter = findNode(newTree, parent.id)
    log("ADD_RESULT", { parentChildrenAfter: parentAfter?.children.length, newTreeRootChildren: newTree.children.length })
    updateTree(newTree, true, newNode.id)
    log("AFTER_UPDATE", { calledUpdateTree: true })
  }, [tree, getAddParent, updateTree])

  // Copy/Paste (C and V keys)
  const handleCopy = useCallback(() => {
    if (!selectedId || !tree) return
    const node = findNode(tree, selectedId)
    if (node) setClipboard(node)
  }, [selectedId, tree])

  const handlePaste = useCallback(() => {
    if (!clipboard || !tree) return
    const parent = getAddParent()
    if (!parent) return
    const cloned = cloneNode(clipboard)
    const newTree = addChild(tree, parent.id, cloned)
    updateTree(newTree, true, cloned.id)
  }, [clipboard, tree, getAddParent, updateTree])

  const handleDelete = useCallback(() => {
    if (!selectedId || !tree || selectedId === tree.id) return
    const parent = findParent(tree, selectedId)
    const newTree = removeNode(tree, selectedId)
    // Determine next selection: sibling or parent (don't select hidden root)
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
    const node = findNode(tree, selectedId)
    const parent = findParent(tree, selectedId)
    if (!node || !parent) return
    const cloned = cloneNode(node)
    const newTree = addChild(tree, parent.id, cloned)
    updateTree(newTree, true, cloned.id)
  }, [selectedId, tree, updateTree])

  const handleMoveNode = useCallback((direction: "up" | "down") => {
    if (!selectedId || !tree) return
    const newTree = moveNode(tree, selectedId, direction)
    if (newTree) updateTree(newTree, true)
  }, [selectedId, tree, updateTree])

  const handleToggleCollapse = useCallback((id: string) => {
    const current = project?.collapsed ?? []
    const currentSet = new Set(current)
    if (currentSet.has(id)) currentSet.delete(id)
    else currentSet.add(id)
    setProjectCollapsed(Array.from(currentSet))
  }, [project?.collapsed, setProjectCollapsed])

  const handleRename = useCallback((id: string, name: string) => {
    log("HANDLE_RENAME", { id, name })
    if (!tree) return
    const node = findNode(tree, id)
    if (!node) return
    const updated = { ...node, name } as ElementNode
    const newTree = updateNode(tree, id, updated)
    updateTree(newTree)
  }, [tree, updateTree])

  // Store selectedId in a ref to avoid stale closure issues
  const selectedIdRef = useRef(selectedId)
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const handleUpdate = useCallback((updates: Partial<ElementNode>) => {
    // Use ref to get current selectedId, avoiding stale closure race conditions
    const currentSelectedId = selectedIdRef.current
    log("HANDLE_UPDATE", { updates, selectedId: currentSelectedId })
    if (!tree || !currentSelectedId) return
    const node = findNode(tree, currentSelectedId)
    if (!node) return
    const updated = { ...node, ...updates } as ElementNode
    const newTree = updateNode(tree, currentSelectedId, updated)
    updateTree(newTree)
  }, [tree, updateTree])

  const navigateTree = useCallback((dir: "up" | "down") => {
    const idx = flatNodes.findIndex((n) => n.id === selectedId)
    if (idx === -1) { setProjectSelectedId(flatNodes[0]?.id || null); return }
    const next = dir === "up" ? Math.max(0, idx - 1) : Math.min(flatNodes.length - 1, idx + 1)
    setProjectSelectedId(flatNodes[next].id)
  }, [flatNodes, selectedId, setProjectSelectedId])

  const handleFileAction = useCallback(async (action: MenuAction) => {
    await refreshProjects()
    setModalMode(action)
  }, [refreshProjects])

  const handleCreateProject = useCallback(async (name: string) => {
    resetIdCounter()
    const success = await createProject(name)
    if (success) {
      setModalMode(null)
    }
  }, [createProject])

  const handleLoadProject = useCallback(async (fileName: string) => {
    const success = await loadProject(fileName)
    if (success) {
      setModalMode(null)
    }
  }, [loadProject])

  const handleDeleteProject = useCallback(async (fileName: string) => {
    await deleteProject(fileName)
    await refreshProjects()
  }, [deleteProject, refreshProjects])

  useKeyboard((key) => {
    // Close modal on escape
    if (modalMode) {
      if (key.name === "escape") setModalMode(null)
      return
    }

    if (showDocs) {
      if (key.name === "escape") setShowDocs(false)
      return
    }

    if (showCode) {
      if (key.name === "escape") setShowCode(false)
      return
    }
    if (focusedField) {
      if (key.name === "escape" || key.name === "return") setFocusedField(null)
      return
    }

    // Add mode: A toggles out, other keys add components using ADD_SHORTCUTS mapping
    if (addMode) {
      if (key.name === "escape" || key.name === "a") { setAddMode(false); return }
      const elementType = ADD_SHORTCUTS[key.name as string]
      if (elementType) handleAddElement(elementType)
      return
    }

    // Main shortcuts
    if (key.name === "delete" || key.name === "backspace") handleDelete()
    else if (key.name === "d") handleDuplicate()
    else if (key.name === "a") setAddMode(true)
    else if (key.name === "c" && key.shift) handleCopy()
    else if (key.name === "v" && !key.ctrl) handlePaste()
    else if (key.name === "tab") setShowCode(true)
    else if (key.name === "z" && !key.shift) undo()
    else if (key.name === "y" || (key.name === "z" && key.shift)) redo()
    else if (key.option && key.name === "up") handleMoveNode("up")
    else if (key.option && key.name === "down") handleMoveNode("down")
    else if (key.name === "up" || key.name === "k") navigateTree("up")
    else if (key.name === "down" || key.name === "j") navigateTree("down")
    else if (key.name === "escape") setProjectSelectedId(null)
  })

  const treeWidth = 30
  const sidebarWidth = 40

  // Loading state
  if (isLoading || !project || !tree) {
    return (
      <box style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <text fg={COLORS.muted}>Loading...</text>
      </box>
    )
  }

  return (
    <box id="builder" style={{ width, height, flexDirection: "row" }}>
      {/* Left Panel - Tree (full height, thin right border) */}
      <box id="builder-tree" border={["right"]} borderColor={BORDER_ACCENT} customBorderChars={ThinBorderRight}
        style={{ width: treeWidth, height: "100%", backgroundColor: COLORS.bgAlt, padding: 1, flexDirection: "column" }}>
        <box style={{ alignItems: "center", marginBottom: 1 }} onMouseDown={() => setShowDocs(v => !v)}>
          <ascii-font text="playtui" font="tiny" color={RGBA.fromHex(COLORS.accent)} />
        </box>
        <scrollbox id="tree-scroll" style={{ flexGrow: 1, contentOptions: { flexDirection: "column" } }}>
          <TreeView key={treeKey} root={tree} selectedId={selectedId} collapsed={collapsed}
            onSelect={setProjectSelectedId} onToggle={handleToggleCollapse} onRename={handleRename} />
        </scrollbox>
      </box>

      {/* Center Area - header top, canvas middle, footer bottom */}
      <box id="builder-center" style={{ flexGrow: 1, height: "100%", flexDirection: "column", padding: 1 }}>
        {/* Header row: FileMenu, Save indicator, Code button */}
        <box id="center-header" style={{ flexDirection: "column", gap: 0 }}>
          <box style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <FileMenu projectName={project.name} onAction={handleFileAction} />
            <box style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
              <box 
                id="auto-layout-toggle"
                onMouseDown={() => setAutoLayout(!autoLayout)}
                style={{ backgroundColor: autoLayout ? COLORS.accent : COLORS.card, paddingLeft: 1, paddingRight: 1 }}
              >
                <text fg={autoLayout ? COLORS.bg : COLORS.muted}>⊞</text>
              </box>
              <SaveIndicator status={saveStatus} />
            </box>
          </box>
          {/* Element toolbar - second line, left aligned */}
          <box style={{ flexDirection: "row", justifyContent: "flex-start", marginTop: 1 }}>
            <ElementToolbar 
              expanded={addMode} 
              onToggle={() => setAddMode(!addMode)} 
              onAddElement={handleAddElement} 
            />
          </box>
          {/* Separator line */}
          <box style={{ height: 1, marginTop: 1 }}>
            <text fg={COLORS.border}>{"─".repeat(200)}</text>
          </box>
        </box>

        {/* Canvas or Code or Docs Panel - grows to fill middle */}
        {showCode ? (
          <CodePanel code={code} error={codeError} onCodeChange={handleCodeChange} />
        ) : showDocs ? (
          <DocsPanel />
        ) : (
          <box id="builder-canvas"
            onMouseDown={() => setFocusedField(null)} style={{ 
              backgroundColor: COLORS.bg, 
              flexGrow: 1,
              justifyContent: autoLayout ? "center" : "flex-start",
              alignItems: autoLayout ? "center" : "flex-start",
            }}>
            <ElementRenderer key={treeKey} node={tree} selectedId={selectedId} hoveredId={hoveredId}
              onSelect={(id) => { setProjectSelectedId(id); setFocusedField(null) }} onHover={setHoveredId} />
          </box>
        )}

        {/* Footer - shortcuts at bottom */}
        <Footer addMode={addMode} />
      </box>

      {/* Right Panel - Properties (full height, thin left border) */}
      <box id="builder-sidebar" border={["left"]} borderColor={BORDER_ACCENT} customBorderChars={ThinBorderLeft}
        style={{ width: sidebarWidth, height: "100%", flexDirection: "column", backgroundColor: COLORS.card, padding: 1 }}>
        <text fg={COLORS.muted} style={{ marginBottom: 1 }}>
          {selectedNode ? <span fg={COLORS.accent}>{selectedNode.type}</span> : "Properties"}
        </text>
        {selectedNode ? (
          <PropertyEditor key={selectedId} node={selectedNode} onUpdate={handleUpdate}
            focusedField={focusedField} setFocusedField={setFocusedField} />
        ) : (
          <text fg={COLORS.muted}>Select an element</text>
        )}
      </box>


      
      {/* Project Modal (for new/load/delete) */}
      {modalMode && (
        <ProjectModal
          mode={modalMode}
          projects={projects}
          currentProjectName={project.name}
          onClose={() => setModalMode(null)}
          onCreate={handleCreateProject}
          onLoad={handleLoadProject}
          onDelete={handleDeleteProject}
          width={width}
          height={height}
        />
      )}
    </box>
  )
}
