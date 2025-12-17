import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { COLORS, ThinBorderRight, ThinBorderLeft, BORDER_ACCENT } from "./theme"
import type { Renderable } from "./lib/types"
import { clearLog } from "./lib/logger"
import { resetIdCounter, findRenderable, countRenderables, updateRenderable, getRenderablePosition } from "./lib/tree"
import { generateChildrenCode } from "./lib/codegen"
import { TreeView } from "./components/pages/Tree"
import { PaletteControl } from "./components/controls/PaletteControl"
import { PropertyPane } from "./components/pages/Properties"
import { LibraryPage } from "./components/pages/Library"
import { PlayPage } from "./components/pages/Play"
import { Title } from "./components/ui/Title"
import { Footer, CodePanel, type MenuAction, ProjectModal, DocsPanel, EditorPanel, Header, NavBar } from "./components/ui"
import { FilmStrip } from "./components/play/FilmStrip"
import { TimelinePanel } from "./components/timeline/TimelinePanel"
import { KeyframingContext } from "./components/contexts/KeyframingContext"
import { useProject } from "./hooks/useProject"
import { useBuilderKeyboard } from "./hooks/useBuilderKeyboard"
import { useBuilderActions } from "./hooks/useBuilderActions"
import type { DragEvent } from "./components/Renderer"
import type { CanvasOffset } from "./components/pages/Editor"
import { reduceViewState, VIEW_MODE_BY_MODE, type ViewAction, type ViewMode, type ViewLayoutState } from "./lib/viewState"
import { Bind } from "./lib/shortcuts"

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
  const [viewLayout, setViewLayout] = useState<ViewLayoutState>({
    mode: "editor",
    showCodePanel: false,
    codePanelHeight: 12,
    showTimeline: true,
  })
  const mode = viewLayout.mode
  const viewModeConfig = VIEW_MODE_BY_MODE[mode]
  const showCodePanel = viewLayout.showCodePanel
  const codePanelHeight = viewLayout.codePanelHeight
  const showTimeline = viewLayout.showTimeline
  const [modalMode, setModalMode] = useState<"new" | "load" | "delete" | "saveAs" | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [clipboard, setClipboard] = useState<Renderable | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [canvasOffset, setCanvasOffset] = useState<CanvasOffset>({ x: 0, y: 0 })
  const [filmStripEditing, setFilmStripEditing] = useState(false) // Track when FilmStrip input is active


  const applyViewAction = useCallback(
    (action: ViewAction) => {
      setViewLayout(prev => reduceViewState(prev, action))
    },
    [],
  )

  const setMode = useCallback((next: ViewMode) => {
    setViewLayout(prev => ({
      ...prev,
      mode: next,
    }))
  }, [])
  
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
  const selectedNode = tree && selectedId ? findRenderable(tree, selectedId) : null
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
    filmStripEditing,
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
    onViewAction: applyViewAction,
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
    const node = findRenderable(tree, event.nodeId)
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
    
    const node = findRenderable(tree, event.nodeId)
    if (!node) return

    const newX = dragStartRef.current.nodeX + deltaX
    const newY = dragStartRef.current.nodeY + deltaY
    
    // Update node position (without adding to history during drag)
    const updated = { ...node, x: newX, y: newY } as Renderable
    const newTree = updateRenderable(tree, event.nodeId, updated)
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
    
    const node = tree ? findRenderable(tree, nodeId) : null
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
  const timelineHeight = 14
  const footerHeight = 1
  const mainContentHeight = height - footerHeight 
    - (viewModeConfig.hasFilmStrip ? filmStripHeight : 0)
    - (showCodePanel ? codePanelHeight : 0)
    - (viewModeConfig.hasTimeline && showTimeline ? timelineHeight : 0)

  // Handle focusing an element in the canvas (double-click in tree)
  // Centers the element in the visible canvas area
  const handleFocusElement = useCallback((nodeId: string) => {
    if (!tree) return
    
    const node = findRenderable(tree, nodeId)
    if (!node) return
    
    // Get the node's accumulated position from tree root
    const pos = getRenderablePosition(tree, nodeId)
    if (!pos) return
    
    // Get element dimensions (use defaults if not set)
    const nodeWidth = typeof node.width === "number" ? node.width : 10
    const nodeHeight = typeof node.height === "number" ? node.height : 3
    
    // The root is centered by flexbox. To center a specific element,
    // offset by the negative of its position (plus half its size to center it)
    // We also need to account for the bottom panel which shifts the viewport center
    
    // Calculate total bottom panel height
    const bottomPanelHeight = 
      (viewModeConfig.hasFilmStrip ? filmStripHeight : 0) +
      (showCodePanel ? codePanelHeight : 0) +
      (viewModeConfig.hasTimeline && showTimeline ? timelineHeight : 0)

    // The canvas is vertically centered in the remaining space *above* the bottom panels.
    // However, the `canvasOffsetAdjustY` prop passed to EditorPanel is used to shift the 
    // visual center down to account for this.
    // 
    // Let's look at EditorPanel:
    // top={canvasOffset.y + canvasOffsetAdjustY / 2}
    //
    // So if we have a bottom panel of height H, the canvas visual center is shifted down by H/2.
    // This means the coordinate (0,0) which was at the physical center is now at physical center + H/2.
    //
    // Wait, if the canvas size *shrinks* because of bottom panels (flex layout), 
    // the flexbox centering moves the physical center UP by H/2.
    // To keep the visual content stable, we add H/2 to the top offset.
    //
    // So, effectively, (0,0) remains visually in the center of the *original* full height area
    // (minus footer/header/etc).
    //
    // If we want to center an element, we want its center to be at the new physical center 
    // of the VISIBLE canvas area.
    //
    // The visible canvas area has height: TotalHeight - TopBar - BottomPanels.
    // The physical center is at (TotalHeight - TopBar - BottomPanels) / 2.
    //
    // Relative to the "stable" (0,0) point (which is centered in the full area?), where is the new center?
    // 
    // Let's assume the previous logic was trying to maintain a stable world coordinate system.
    // 
    // If we want to center the element in the *visible* area:
    // We simply need the element's position relative to the world origin (0,0) to be offset such that
    // it aligns with the center of the visible area.
    //
    // The `canvasOffset` shifts the world origin.
    // If offset is (0,0), the world origin is at the *visual* center (which is shifted by `canvasOffsetAdjustY`).
    //
    // `canvasOffsetAdjustY` is typically passed as `bottomPanelHeight`.
    // So origin is at `PhysicalCenter + BottomPanelHeight / 2`.
    //
    // We want the element center `(pos.y + h/2)` to be at the `PhysicalCenter`.
    //
    // Current Y = `PhysicalCenter + BottomPanelHeight/2 + offset.y + pos.y + h/2`  (Wait, strictly, it's `top` relative to container)
    //
    // Let's trace EditorPanel render:
    // Container is flex-centered.
    // Inner box `canvas-viewport` has `top={canvasOffset.y + canvasOffsetAdjustY / 2}`
    //
    // So `canvas-viewport` origin (0,0) is at `PhysicalCenter + canvasOffset.y + canvasOffsetAdjustY / 2`.
    // The element is at `(pos.x, pos.y)` inside `canvas-viewport`.
    // So element top-left is at `PhysicalCenter + canvasOffset.y + canvasOffsetAdjustY / 2 + pos.y`.
    // Element center is at `... + pos.y + h/2`.
    //
    // We want Element Center to be at `PhysicalCenter`.
    // So: `PhysicalCenter + canvasOffset.y + canvasOffsetAdjustY / 2 + pos.y + h/2 = PhysicalCenter`
    // => `canvasOffset.y + canvasOffsetAdjustY / 2 + pos.y + h/2 = 0`
    // => `canvasOffset.y = -(pos.y + h/2) - canvasOffsetAdjustY / 2`
    
    const newOffsetX = Math.round(-pos.x - nodeWidth / 2)
    const newOffsetY = Math.round(-pos.y - nodeHeight / 2 - bottomPanelHeight / 2)
    
    setCanvasOffset({ x: newOffsetX, y: newOffsetY })
  }, [tree, mode, showCodePanel, showTimeline])

  // Loading state
  if (isLoading) { // Allow project to be null if we are in library mode?
                   // But useProject loads the last project by default.
    return (
      <box style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <text fg={COLORS.muted}>Loading...</text>
      </box>
    )
  }
  
  // Library/Docs Mode - Full Screen (hides tree and sidebar)
  if (viewModeConfig.kind === "browser") {
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
        <NavBar
          mode={mode}
          width={width}
          showCodePanel={showCodePanel}
          showTimeline={showTimeline}
          onModeChange={setMode}
          onToggleCode={() => applyViewAction(Bind.TOGGLE_CODE)}
          onPlayPress={() => applyViewAction(Bind.VIEW_PLAY)}
        />
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
        <NavBar
          mode={mode}
          width={width}
          showCodePanel={showCodePanel}
          showTimeline={showTimeline}
          onModeChange={setMode}
          onToggleCode={() => applyViewAction(Bind.TOGGLE_CODE)}
          onPlayPress={() => applyViewAction(Bind.VIEW_PLAY)}
        />
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
        <box id="builder-center" style={{ width: width - (showTree ? treeWidth : 0) - (showProperties ? sidebarWidth : 0), flexDirection: "column", paddingTop: 1 }}
        onMouseDown={() => {
            // Clicking anywhere in the main area (outside specific panels that handle stopPropagation)
            // should blur focused fields
            if (focusedField === "code-panel") {
                // We need to notify CodePanel to blur? 
                // CodePanel's focus state is internal.
                // But we can just clear the global focus lock.
                // Actually, if we click canvas, CodePanel should lose focus.
                setFocusedField(null)
            }
        }}
      >
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
             canvasOffsetAdjustY={
               (viewModeConfig.hasFilmStrip ? filmStripHeight : 0) +
               (showCodePanel ? codePanelHeight : 0) +
               (viewModeConfig.hasTimeline && showTimeline ? timelineHeight : 0)
             }
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
             style={{ width: sidebarWidth, flexDirection: "column", backgroundColor: COLORS.bgAlt, padding: 1, flexShrink: 0 }}>
            {/* Palette - always visible */}
            <box id="palette-header" border={["bottom"]} borderColor={COLORS.border} style={{ marginBottom: 1, justifyContent: "center" }}>
              <PaletteControl
                palettes={palettes}
                activePaletteIndex={activePaletteIndex}
                onShowHex={(color) => console.log("Palette color:", color)}
                onUpdateSwatch={updateSwatch}
                onChangePalette={setActivePalette}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
            </box>
            {selectedNode ? (
              <PropertyPane key={selectedId} node={selectedNode} onUpdate={handleUpdate}
                focusedField={focusedField} setFocusedField={setFocusedField}
                palettes={palettes} activePaletteIndex={activePaletteIndex}
                onShowHex={(color) => {
                  // Show hex in console or similar - just for reference, not applying
                  console.log("Palette color:", color)
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
          onEditingChange={setFilmStripEditing}
        />
      )}
      
      {/* Timeline Panel - visible in play mode, toggleable with F2 */}
      {mode === "play" && showTimeline && (
        <box height={timelineHeight} width={width} flexShrink={0} overflow="hidden">
          <TimelinePanel projectHook={projectHook} width={width} />
        </box>
      )}

      {/* Code Panel - bottom panel toggled with F2 */}
      {showCodePanel && (
        <box height={codePanelHeight} flexShrink={0} onMouseDown={(e) => {
            e.stopPropagation()
        }}>
          <CodePanel 
             code={code} 
             tree={tree} 
             updateTree={updateTree} 
             onClose={() => {
               setViewLayout(prev => ({
                 ...prev,
                 showCodePanel: false,
               }))
             }}
             onFocusChange={(focused) => {
                 if (focused) setFocusedField("code-panel")
                 else if (focusedField === "code-panel") setFocusedField(null)
             }}
             height={codePanelHeight}
             onHeightChange={(h) => setViewLayout(prev => ({ ...prev, codePanelHeight: Math.max(5, h) }))}
           />

        </box>
      )}
      
      <NavBar mode={mode} width={width} projectName={project.name} saveStatus={saveStatus} showCodePanel={showCodePanel} showTimeline={showTimeline} onModeChange={setMode} onToggleCode={() => applyViewAction(Bind.TOGGLE_CODE)} onPlayPress={() => applyViewAction(Bind.VIEW_PLAY)} />

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
