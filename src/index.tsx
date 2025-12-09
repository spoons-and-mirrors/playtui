import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { COLORS, ThinBorderRight, ThinBorderLeft, BORDER_ACCENT } from "./theme"
import type { ElementNode } from "./lib/types"
import { clearLog } from "./lib/logger"
import { resetIdCounter, findNode, countNodes, updateNode } from "./lib/tree"
import { generateChildrenCode } from "./lib/codegen"
import { TreeView } from "./components/pages/Tree"
import { PropertyPane } from "./components/pages/Properties"
import { LibraryPage } from "./components/pages/Library"
import { PlayPage } from "./components/pages/Play"
import { Title } from "./components/ui/Title"
import { Footer, type ViewMode, CodePanel, type MenuAction, ProjectModal, DocsPanel, EditorPanel, Header } from "./components/ui"
import { useProject } from "./hooks/useProject"
import { useBuilderKeyboard } from "./hooks/useBuilderKeyboard"
import { useBuilderActions } from "./hooks/useBuilderActions"
import type { DragEvent } from "./components/Renderer"

interface BuilderProps {
  width: number
  height: number
}

export function Builder({ width, height }: BuilderProps) {
  const projectHook = useProject()
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
    // Animation methods
    setCurrentFrame,
    duplicateFrame,
    deleteFrame,
    setFps,
    // Palette methods
    palettes,
    activePaletteIndex,
    updateSwatch,
    setActivePalette,
  } = projectHook

  // Clear debug log on startup
  useEffect(() => { clearLog() }, [])

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>("editor")
  const [modalMode, setModalMode] = useState<"new" | "load" | "delete" | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [clipboard, setClipboard] = useState<ElementNode | null>(null)
  const [autoLayout, setAutoLayout] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [panelsHiddenPerMode, setPanelsHiddenPerMode] = useState<Record<string, boolean>>({
    editor: false,
    play: false,
    code: true,
  })

  // Derive panelsHidden from current mode
  const panelsHidden = panelsHiddenPerMode[mode] ?? false

  // Toggle panels for current mode
  const togglePanels = useCallback(() => {
    setPanelsHiddenPerMode(prev => ({ ...prev, [mode]: !prev[mode] }))
  }, [mode])

  // Track dragging state for absolute positioned elements
  const dragStartRef = useRef<{
    nodeId: string
    mouseX: number
    mouseY: number
    nodeX: number
    nodeY: number
  } | null>(null)

  // Extract commonly used values from project
  const tree = project?.tree ?? null
  const selectedId = project?.selectedId ?? null
  const collapsed = project?.collapsed ?? []
  const animation = project?.animation
  const treeKey = project?.history?.length ?? 0
  const selectedNode = tree && selectedId ? findNode(tree, selectedId) : null
  const code = useMemo(() => tree ? generateChildrenCode(tree) : "", [tree])

  const {
    handleAddElement,
    handleCopy,
    handlePaste,
    handleDelete,
    handleDuplicate,
    handleMoveNode,
    handleUpdate,
    handleRename,
    navigateTree,
  } = useBuilderActions({
    tree,
    selectedId,
    clipboard,
    setClipboard,
    updateTree,
    setSelectedId: setProjectSelectedId,
  })

  // Use keyboard hook
  useBuilderKeyboard({
    modalMode,
    mode,
    focusedField,
    addMode,
    setModalMode,
    setMode,
    setFocusedField,
    setAddMode,
    setSelectedId: setProjectSelectedId,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onUndo: undo,
    onRedo: redo,
    onMoveNode: handleMoveNode,
    onNavigateTree: navigateTree,
    onAddElement: handleAddElement,
    // Animation Actions
    onAnimNextFrame: () => project?.animation && setCurrentFrame(Math.min(project.animation.frames.length - 1, project.animation.currentFrameIndex + 1)),
    onAnimPrevFrame: () => project?.animation && setCurrentFrame(Math.max(0, project.animation.currentFrameIndex - 1)),
    onAnimPlayToggle: () => setIsPlaying(p => !p),
    onAnimDuplicateFrame: duplicateFrame,
    onAnimDeleteFrame: () => project?.animation && deleteFrame(project.animation.currentFrameIndex),
    onTogglePanels: togglePanels,
  })

  const handleToggleCollapse = useCallback((id: string) => {
    const current = project?.collapsed ?? []
    const currentSet = new Set(current)
    if (currentSet.has(id)) currentSet.delete(id)
    else currentSet.add(id)
    setProjectCollapsed(Array.from(currentSet))
  }, [project?.collapsed, setProjectCollapsed])

  const handleFileAction = useCallback(async (action: MenuAction) => {
    await refreshProjects()
    setModalMode(action)
  }, [refreshProjects])

  const handleCreateProject = useCallback(async (name: string) => {
    resetIdCounter()
    const success = await createProject(name)
    if (success) setModalMode(null)
  }, [createProject])

  const handleLoadProject = useCallback(async (fileName: string) => {
    const success = await loadProject(fileName)
    if (success) setModalMode(null)
  }, [loadProject])

  const handleDeleteProject = useCallback(async (fileName: string) => {
    await deleteProject(fileName)
    await refreshProjects()
  }, [deleteProject, refreshProjects])

  // Handle drag for absolute positioned elements
  const handleDragStart = useCallback((event: DragEvent) => {
    if (!tree) return
    const node = findNode(tree, event.nodeId)
    if (!node || !("position" in node) || node.position !== "absolute") return
    
    // Store initial mouse position and node position
    dragStartRef.current = {
      nodeId: event.nodeId,
      mouseX: event.x,
      mouseY: event.y,
      nodeX: (node as any).x ?? 0,
      nodeY: (node as any).y ?? 0,
    }
  }, [tree])

  const handleDragMove = useCallback((event: DragEvent) => {
    if (!tree || !dragStartRef.current) return
    if (dragStartRef.current.nodeId !== event.nodeId) return
    
    // Calculate delta from initial mouse position
    const deltaX = event.x - dragStartRef.current.mouseX
    const deltaY = event.y - dragStartRef.current.mouseY
    
    const node = findNode(tree, event.nodeId)
    if (!node) return

    const newX = dragStartRef.current.nodeX + deltaX
    const newY = dragStartRef.current.nodeY + deltaY
    
    // Update node position (without adding to history during drag)
    const updated = { ...node, x: newX, y: newY } as ElementNode
    const newTree = updateNode(tree, event.nodeId, updated)
    updateTree(newTree, false) // false = don't add to history
  }, [tree, updateTree])

  const handleDragEnd = useCallback((nodeId: string) => {
    // Reset drag start position
    dragStartRef.current = null
    // Add final state to history
    if (tree) {
      updateTree(tree, true) // true = add to history
    }
  }, [tree, updateTree])

  const treeWidth = 30
  const sidebarWidth = 40

  // Loading state
  if (isLoading) { // Allow project to be null if we are in library mode?
                   // But useProject loads the last project by default.
    return (
      <box style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <text fg={COLORS.muted}>Loading...</text>
      </box>
    )
  }
  
  // Library Mode - Full Screen (hides tree and sidebar)
  if (mode === "library" || mode === "docs") {
    return (
      <box id="builder" style={{ width, height, flexDirection: "column", paddingBottom: 1, paddingTop: 1, gap: 1 }}>
        {mode === "library" ? (
          <LibraryPage 
            projectHook={projectHook} 
            onLoadProject={() => setMode("editor")} 
            width={width}
            height={height - 3}
          />
        ) : (
          <DocsPanel />
        )}
        <Footer mode={mode} onModeChange={setMode} />
      </box>
    )
  }

  // Ensure project is loaded for other modes
  if (!project || !tree) {
    // Should generally not happen if isLoading handled, but safe guard
    return (
       <box style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <text fg={COLORS.muted}>No project loaded.</text>
        <Footer mode={mode} onModeChange={setMode} />
      </box>
    )
  }

  return (
    <box id="builder" style={{ width, height, flexDirection: "row" }}>
      {/* Left Panel - Tree */}
      {!panelsHidden && (
        <box id="builder-tree" border={["right"]} borderColor={BORDER_ACCENT} customBorderChars={ThinBorderRight}
          style={{ width: treeWidth, height, backgroundColor: COLORS.bgAlt, padding: 1, flexDirection: "column", flexShrink: 0 }}>
          <Title saveStatus={saveStatus} onLogoClick={() => setMode("docs")} />
          <scrollbox id="tree-scroll" style={{ flexGrow: 1, contentOptions: { flexDirection: "column" } }}>
            <TreeView key={treeKey} root={tree} selectedId={selectedId} collapsed={new Set(collapsed)}
              onSelect={setProjectSelectedId} onToggle={handleToggleCollapse} onRename={handleRename} />
          </scrollbox>
        </box>
      )}

      {/* Center Area - header top, canvas middle, footer bottom */}
      <box id="builder-center" style={{ width: panelsHidden ? width : width - treeWidth - sidebarWidth, height, flexDirection: "column", padding: 1 }}>
        <Header
          projectName={project.name}
          addMode={addMode}
          onFileAction={handleFileAction}
          onToggleAddMode={() => setAddMode(!addMode)}
          onAddElement={handleAddElement}
        />

        {/* Canvas or Code Panel - grows to fill middle */}
        {mode === "code" ? (
          <CodePanel code={code} tree={tree} updateTree={updateTree} onClose={() => setMode("editor")} />
        ) : mode === "play" ? (
           <PlayPage 
             projectHook={projectHook} 
             isPlaying={isPlaying}
             onTogglePlay={() => setIsPlaying(p => !p)}
           />
        ) : (
          <EditorPanel
            tree={tree}
            treeKey={treeKey}
            selectedId={selectedId}
            hoveredId={hoveredId}
            autoLayout={autoLayout}
            onSelect={(id) => { setProjectSelectedId(id); setFocusedField(null) }}
            onHover={setHoveredId}
            onBackgroundClick={() => setFocusedField(null)}
            onToggleAutoLayout={() => setAutoLayout(!autoLayout)}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* Footer - mode tabs centered */}
        <Footer mode={mode} onModeChange={setMode} />
      </box>

      {/* Right Panel - Properties */}
      {!panelsHidden && (
        <box id="builder-sidebar" border={["left"]} borderColor={BORDER_ACCENT} customBorderChars={ThinBorderLeft}
          style={{ width: sidebarWidth, height, flexDirection: "column", backgroundColor: COLORS.card, padding: 1, flexShrink: 0 }}>
          {!selectedNode && <text fg={COLORS.muted} style={{ marginBottom: 1 }}>Properties</text>}
          {selectedNode ? (
            <PropertyPane key={selectedId} node={selectedNode} onUpdate={handleUpdate}
              focusedField={focusedField} setFocusedField={setFocusedField}
              palettes={palettes} activePaletteIndex={activePaletteIndex}
              onUpdateSwatch={updateSwatch} onChangePalette={setActivePalette} />
          ) : (
            <text fg={COLORS.muted}>Select an element</text>
          )}
        </box>
      )}


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
