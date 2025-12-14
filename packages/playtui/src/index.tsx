import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { COLORS, ThinBorderRight, ThinBorderLeft, BORDER_ACCENT } from "./theme"
import type { ElementNode } from "./lib/types"
import { clearLog } from "./lib/logger"
import { resetIdCounter, findNode, countNodes, updateNode, getNodePosition } from "./lib/tree"
import { generateChildrenCode } from "./lib/codegen"
import { TreeView } from "./components/pages/Tree"
import { PropertyPane } from "./components/pages/Properties"
import { LibraryPage } from "./components/pages/Library"
import { PlayPage } from "./components/pages/Play"
import { Title } from "./components/ui/Title"
import { Footer, type ViewMode, CodePanel, type MenuAction, ProjectModal, DocsPanel, EditorPanel, Header, NavBar } from "./components/ui"
import { FilmStrip } from "./components/play/FilmStrip"
import { KeyframingContext } from "./components/contexts/KeyframingContext"
import { useProject } from "./hooks/useProject"
import { useBuilderKeyboard } from "./hooks/useBuilderKeyboard"
import { useBuilderActions } from "./hooks/useBuilderActions"
import type { DragEvent } from "./components/Renderer"
import type { CanvasOffset } from "./components/pages/Editor"

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
    duplicateProject,
    updateTree,
    setSelectedId: setProjectSelectedId,
    setCollapsed: setProjectCollapsed,
    undo,
    redo,
    // Keyframing
    toggleAutoKey,
    addKeyframe,
    removeKeyframe,
    // Animation methods
    setCurrentFrame,
    duplicateFrame,
    deleteFrame,
    setFps,
    setFrameCount,
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
  const [mode, _setMode] = useState<ViewMode>("editor")
  
  // Wrap setMode to track last editor/play mode
  const setMode = useCallback((newMode: ViewMode) => {
    if (newMode === "editor" || newMode === "play") {
      setLastEditorPlayMode(newMode)
    }
    _setMode(newMode)
  }, [])
  const [modalMode, setModalMode] = useState<"new" | "load" | "delete" | "saveAs" | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [clipboard, setClipboard] = useState<ElementNode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCodePanel, setShowCodePanel] = useState(false)
  const [lastEditorPlayMode, setLastEditorPlayMode] = useState<"editor" | "play">("editor")
  const [canvasOffset, setCanvasOffset] = useState<CanvasOffset>({ x: 0, y: 0 })
  
  // Panel visibility state per mode: 0 = both, 1 = none, 2 = tree only, 3 = props only
  const [panelStatePerMode, setPanelStatePerMode] = useState<Record<string, number>>({
    editor: 0,
    play: 0,
  })

  // Derive panel visibility from current mode's state
  const panelState = panelStatePerMode[mode] ?? 0
  const showTree = panelState === 0 || panelState === 2      // both or tree-only
  const showProperties = panelState === 0 || panelState === 3 // both or props-only

  // Cycle through 4 states for current mode
  const togglePanels = useCallback(() => {
    setPanelStatePerMode(prev => ({
      ...prev,
      [mode]: ((prev[mode] ?? 0) + 1) % 4
    }))
  }, [mode])

  // Track dragging state for positioned elements
  const dragStartRef = useRef<{
    nodeId: string
    mouseX: number
    mouseY: number
    nodeX: number
    nodeY: number
  } | null>(null)

  const keyframingContextValue = useMemo(() => {
    if (!project || !project.animation.keyframing) return null
    
    return {
      autoKeyEnabled: project.animation.keyframing.autoKeyEnabled,
      currentFrame: project.animation.currentFrameIndex,
      animatedProperties: project.animation.keyframing.animatedProperties,
      hasKeyframe: (nodeId: string, property: string, frame: number) => {
        const { hasKeyframeAt } = require("./lib/keyframing")
        return hasKeyframeAt(project.animation.keyframing.animatedProperties, nodeId, property, frame)
      },
      addKeyframe,
      removeKeyframe,
      selectedId: project.selectedId
    }
  }, [project, addKeyframe, removeKeyframe])

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
    lastEditorPlayMode,
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
    onToggleCode: () => setShowCodePanel(v => !v),
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

  const handleSaveAsProject = useCallback(async (name: string) => {
    const success = await duplicateProject(name)
    if (success) setModalMode(null)
  }, [duplicateProject])

  // Handle drag for positioned elements (both absolute and relative)
  const handleDragStart = useCallback((event: DragEvent) => {
    if (!tree) return
    const node = findNode(tree, event.nodeId)
    if (!node) return
    
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
    
    // If in play mode and properties are keyframed, update keyframes during drag
    // This ensures the baked display tree shows the dragged position
    if (mode === "play" && project?.animation.keyframing.animatedProperties) {
      const animProps = project.animation.keyframing.animatedProperties
      const hasXKeyframe = animProps.some(p => p.nodeId === event.nodeId && p.property === "x")
      const hasYKeyframe = animProps.some(p => p.nodeId === event.nodeId && p.property === "y")
      
      if (hasXKeyframe) addKeyframe(event.nodeId, "x", newX)
      if (hasYKeyframe) addKeyframe(event.nodeId, "y", newY)
    }
  }, [tree, updateTree, mode, project?.animation.keyframing.animatedProperties, addKeyframe])

  const handleDragEnd = useCallback((nodeId: string) => {
    if (!dragStartRef.current) return
    
    const node = tree ? findNode(tree, nodeId) : null
    const finalX = node ? (node as any).x ?? 0 : dragStartRef.current.nodeX
    const finalY = node ? (node as any).y ?? 0 : dragStartRef.current.nodeY
    
    // If in play mode and properties are keyframed, ensure final keyframe is set
    if (mode === "play" && project?.animation.keyframing.animatedProperties) {
      const animProps = project.animation.keyframing.animatedProperties
      const hasXKeyframe = animProps.some(p => p.nodeId === nodeId && p.property === "x")
      const hasYKeyframe = animProps.some(p => p.nodeId === nodeId && p.property === "y")
      
      if (hasXKeyframe) addKeyframe(nodeId, "x", finalX)
      if (hasYKeyframe) addKeyframe(nodeId, "y", finalY)
    }
    
    // Reset drag start position
    dragStartRef.current = null
    
    // Add final state to history
    if (tree) {
      updateTree(tree, true) // true = add to history
    }
  }, [tree, updateTree, mode, project?.animation.keyframing.animatedProperties, addKeyframe])

  // Layout constants
  const treeWidth = 27
  const sidebarWidth = 35
  const filmStripHeight = 6
  const codePanelHeight = 12
  const footerHeight = 1
  const mainContentHeight = height - footerHeight 
    - (mode === "play" ? filmStripHeight : 0)
    - (showCodePanel ? codePanelHeight : 0)

  // Handle focusing an element in the canvas (double-click in tree)
  // Centers the element in the visible canvas area
  const handleFocusElement = useCallback((nodeId: string) => {
    if (!tree) return
    
    const node = findNode(tree, nodeId)
    if (!node) return
    
    // Get the node's accumulated position from tree root
    const pos = getNodePosition(tree, nodeId)
    if (!pos) return
    
    // Get element dimensions (use defaults if not set)
    const nodeWidth = typeof node.width === "number" ? node.width : 10
    const nodeHeight = typeof node.height === "number" ? node.height : 3
    
    // The root is centered by flexbox. To center a specific element,
    // offset by the negative of its position (plus half its size to center it)
    const newOffsetX = Math.round(-pos.x - nodeWidth / 2)
    const newOffsetY = Math.round(-pos.y - nodeHeight / 2)
    
    setCanvasOffset({ x: newOffsetX, y: newOffsetY })
  }, [tree])

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
      <box id="builder" style={{ width, height, flexDirection: "column" }}>
        <box style={{ flexGrow: 1, flexDirection: "column" }}>
          {mode === "library" ? (
            <LibraryPage 
              projectHook={projectHook} 
              onLoadProject={() => setMode("editor")} 
              width={width}
              height={height - 1}
            />
          ) : (
            <DocsPanel />
          )}
        </box>
        <NavBar mode={mode} width={width} showCodePanel={showCodePanel} onModeChange={setMode} onToggleCode={() => setShowCodePanel(v => !v)} />
      </box>
    )
  }

  // Ensure project is loaded for other modes
  if (!project || !tree) {
    // Should generally not happen if isLoading handled, but safe guard
    return (
       <box style={{ width, height, flexDirection: "column", alignItems: "stretch", justifyContent: "space-between" }}>
        <box style={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
          <text fg={COLORS.muted}>No project loaded.</text>
        </box>
        <NavBar mode={mode} width={width} showCodePanel={showCodePanel} onModeChange={setMode} onToggleCode={() => setShowCodePanel(v => !v)} />
      </box>
    )
  }

  return (
    <box id="builder" style={{ width, height, flexDirection: "column" }}>
      {/* Main content area - horizontal panels */}
      <box id="builder-main" style={{ width, height: mainContentHeight, flexDirection: "row" }}>
        {/* Left Panel - Tree */}
        {showTree && (
          <box id="builder-tree" border={["right"]} borderColor={COLORS.border} customBorderChars={ThinBorderRight}
            style={{ width: treeWidth, backgroundColor: COLORS.bgAlt, padding: 1, flexDirection: "column", flexShrink: 0 }}>
            <Title onLogoClick={() => setMode("docs")} />
            <scrollbox id="tree-scroll" style={{ flexGrow: 1, contentOptions: { flexDirection: "column" } }}>
              <TreeView key={treeKey} root={tree} selectedId={selectedId} collapsed={new Set(collapsed)}
                onSelect={setProjectSelectedId} onToggle={handleToggleCollapse} onRename={handleRename} onFocusElement={handleFocusElement} />
            </scrollbox>
          </box>
        )}

        {/* Center Area - header, canvas */}
        <KeyframingContext.Provider value={keyframingContextValue}>
        <box id="builder-center" style={{ width: width - (showTree ? treeWidth : 0) - (showProperties ? sidebarWidth : 0), flexDirection: "column", paddingTop: 1 }}>
          <Header
          addMode={addMode}
          onFileAction={handleFileAction}
          onToggleAddMode={() => setAddMode(!addMode)}
          onAddElement={handleAddElement}
          selectedNode={selectedNode}
          onUpdateNode={handleUpdate}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        {/* Canvas - grows to fill middle */}
        {mode === "play" ? (
           <PlayPage 
             projectHook={projectHook} 
             isPlaying={isPlaying}
             canvasOffset={canvasOffset}
             canvasOffsetAdjustY={filmStripHeight + (showCodePanel ? codePanelHeight : 0)}
             onCanvasOffsetChange={setCanvasOffset}
             onTogglePlay={() => setIsPlaying(p => !p)}
             onDragStart={handleDragStart}
             onDragMove={handleDragMove}
             onDragEnd={handleDragEnd}
           />
         ) : (
          <EditorPanel
            tree={tree}
            treeKey={treeKey}
            selectedId={selectedId}
            hoveredId={hoveredId}
            canvasOffset={canvasOffset}
            canvasOffsetAdjustY={showCodePanel ? codePanelHeight : 0}
            onCanvasOffsetChange={setCanvasOffset}
            onSelect={(id) => { setProjectSelectedId(id); setFocusedField(null) }}
            onHover={setHoveredId}
            onBackgroundClick={() => setFocusedField(null)}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
          )}
        </box>

        {/* Right Panel - Properties */}
        {showProperties && (
          <box id="builder-sidebar" border={["left"]} borderColor={COLORS.border} customBorderChars={ThinBorderLeft}
            style={{ width: sidebarWidth, flexDirection: "column", backgroundColor: COLORS.card, padding: 1, flexShrink: 0 }}>
            {!selectedNode && <text fg={COLORS.muted} style={{ marginBottom: 1 }}>Properties</text>}
            {selectedNode ? (
              <PropertyPane key={selectedId} node={selectedNode} onUpdate={handleUpdate}
                focusedField={focusedField} setFocusedField={setFocusedField}
                palettes={palettes} activePaletteIndex={activePaletteIndex}
                selectedColor={selectedNode?.type === "text" ? (selectedNode as any).fg : (selectedNode as any)?.backgroundColor}
                onSelectColor={(color) => {
                  if (selectedNode?.type === "text") {
                    handleUpdate({ fg: color })
                  } else if (selectedNode?.type === "box" || selectedNode?.type === "scrollbox") {
                    handleUpdate({ backgroundColor: color })
                  }
                }}
                onUpdateSwatch={updateSwatch} onChangePalette={setActivePalette} />
            ) : (
              <text fg={COLORS.muted}>Select an element</text>
            )}
          </box>
        )}
        </KeyframingContext.Provider>
      </box>

      {/* Bottom Bar - Mode tabs spanning full width */}
      {mode === "play" && (
        <FilmStrip
          frames={animation?.frames ?? []}
          animatedProperties={animation?.keyframing.animatedProperties ?? []}
          currentIndex={animation?.currentFrameIndex ?? 0}
          onSelectFrame={(index) => {
            if (isPlaying) setIsPlaying(false)
            setCurrentFrame(index)
          }}
          onDuplicateFrame={duplicateFrame}
          onDeleteFrame={deleteFrame}
          fps={animation?.fps ?? 10}
          onFpsChange={setFps}
          onFrameCountChange={setFrameCount}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(p => !p)}
          onImport={projectHook.importAnimation}
        />
      )}
      
      {/* Code Panel - bottom panel toggled with F2 */}
      {showCodePanel && (
        <box height={codePanelHeight} flexShrink={0}>
          <CodePanel code={code} tree={tree} updateTree={updateTree} onClose={() => setShowCodePanel(false)} />
        </box>
      )}
      
      <NavBar mode={mode} width={width} projectName={project.name} saveStatus={saveStatus} showCodePanel={showCodePanel} onModeChange={setMode} onToggleCode={() => setShowCodePanel(v => !v)} />

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
          onSaveAs={handleSaveAsProject}
          width={width}
          height={height}
        />
      )}
    </box>
  )
}
