import { useState, useCallback, useMemo, useEffect } from "react"
import { COLORS, ThinBorderRight, ThinBorderLeft, BORDER_ACCENT } from "./theme"
import type { ElementNode } from "./lib/types"
import { clearLog } from "./lib/logger"
import { resetIdCounter, findNode, countNodes } from "./lib/tree"
import { generateChildrenCode } from "./lib/codegen"
import { TreeView } from "./components/pages/Tree"
import { PropertyPane } from "./components/pages/Properties"
import { Title } from "./components/ui/Title"
import { Footer, type ViewMode, CodePanel, type MenuAction, ProjectModal, DocsPanel, EditorPanel, Header } from "./components/ui"
import { useProject } from "./hooks/useProject"
import { useBuilderKeyboard } from "./hooks/useBuilderKeyboard"
import { useBuilderActions } from "./hooks/useBuilderActions"

interface BuilderProps {
  width: number
  height: number
}

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
  } = useProject()

  // Clear debug log on startup
  useEffect(() => { clearLog() }, [])

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>("editor")
  const [modalMode, setModalMode] = useState<"new" | "load" | "delete" | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [clipboard, setClipboard] = useState<ElementNode | null>(null)
  const [autoLayout, setAutoLayout] = useState(true)

  // Derive state from project
  const tree = project?.tree ?? null
  const selectedId = project?.selectedId ?? null
  const collapsed = useMemo(() => new Set(project?.collapsed ?? []), [project?.collapsed])

  const selectedNode = selectedId && tree ? findNode(tree, selectedId) : null
  const code = useMemo(() => tree ? generateChildrenCode(tree) : "", [tree])
  const treeKey = useMemo(() => (tree ? countNodes(tree) : 0), [tree])

  // Use builder actions hook
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
      {/* Left Panel - Tree */}
      <box id="builder-tree" border={["right"]} borderColor={BORDER_ACCENT} customBorderChars={ThinBorderRight}
        style={{ width: treeWidth, height, backgroundColor: COLORS.bgAlt, padding: 1, flexDirection: "column", flexShrink: 0 }}>
        <Title saveStatus={saveStatus} onLogoClick={() => setMode(mode === "docs" ? "editor" : "docs")} />
        <scrollbox id="tree-scroll" style={{ flexGrow: 1, contentOptions: { flexDirection: "column" } }}>
          <TreeView key={treeKey} root={tree} selectedId={selectedId} collapsed={collapsed}
            onSelect={setProjectSelectedId} onToggle={handleToggleCollapse} onRename={handleRename} />
        </scrollbox>
      </box>

      {/* Center Area - header top, canvas middle, footer bottom */}
      <box id="builder-center" style={{ width: width - treeWidth - sidebarWidth, height, flexDirection: "column", padding: 1 }}>
        <Header
          projectName={project.name}
          addMode={addMode}
          onFileAction={handleFileAction}
          onToggleAddMode={() => setAddMode(!addMode)}
          onAddElement={handleAddElement}
        />

        {/* Canvas or Code or Docs Panel - grows to fill middle */}
        {mode === "code" ? (
          <CodePanel code={code} tree={tree} updateTree={updateTree} onClose={() => setMode("editor")} />
        ) : mode === "docs" ? (
          <DocsPanel />
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
          />
        )}

        {/* Footer - mode tabs centered */}
        <Footer mode={mode} onModeChange={setMode} />
      </box>

      {/* Right Panel - Properties */}
      <box id="builder-sidebar" border={["left"]} borderColor={BORDER_ACCENT} customBorderChars={ThinBorderLeft}
        style={{ width: sidebarWidth, height, flexDirection: "column", backgroundColor: COLORS.card, padding: 1, flexShrink: 0 }}>
        {!selectedNode && <text fg={COLORS.muted} style={{ marginBottom: 1 }}>Properties</text>}
        {selectedNode ? (
          <PropertyPane key={selectedId} node={selectedNode} onUpdate={handleUpdate}
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
