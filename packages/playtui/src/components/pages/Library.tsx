import { useKeyboard } from "@opentui/react"
import { useState, useEffect } from "react"
import { ProjectList } from "../library/ProjectList"
import { LoadConfirmation } from "../library/LoadConfirmation"
import { COLORS } from "../../theme"
import type { UseProjectReturn } from "../../hooks/useProject"
import * as storage from "../../lib/storage"
import type { ProjectMeta } from "../../lib/projectTypes"
import type { RenderableNode } from "../../lib/types"
import { Bind, isKeybind } from "../../lib/shortcuts"

interface LibraryPageProps {
  projectHook: UseProjectReturn
  onLoadProject: () => void
  width: number
  height: number
}

export function LibraryPage({ projectHook, onLoadProject, width, height }: LibraryPageProps) {
  const { projects, refreshProjects, loadProject } = projectHook
  
  const [selectedColumn, setSelectedColumn] = useState(0)
  const [selectedRow, setSelectedRow] = useState(0)
  const [confirmingProject, setConfirmingProject] = useState<ProjectMeta | null>(null)

  // Split projects into columns for row count calculation
  const columnA = projects.filter((_, i) => i % 2 === 0)
  const columnB = projects.filter((_, i) => i % 2 === 1)
  const getColumnProjects = (col: number) => col === 0 ? columnA : columnB

  // Refresh list on mount
  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  // Helper to fetch tree for preview
  const getProjectTree = async (fileName: string): Promise<RenderableNode | null> => {
    const proj = await storage.loadProject(fileName)
    return proj ? proj.tree : null
  }

  // Get the actual project from column/row selection
  const getSelectedProject = (): ProjectMeta | null => {
    const column = getColumnProjects(selectedColumn)
    return column[selectedRow] || null
  }

  const handleConfirmLoad = async () => {
    if (!confirmingProject) return
    
    const success = await loadProject(confirmingProject.fileName)
    if (success) {
      setConfirmingProject(null)
      onLoadProject()
    }
  }

  useKeyboard((key) => {
    if (confirmingProject) {
      if (isKeybind(key, Bind.MODAL_CLOSE)) {
        setConfirmingProject(null)
      } else if (isKeybind(key, Bind.CONFIRM)) {
        handleConfirmLoad()
      }
      return
    }

    const currentColumn = getColumnProjects(selectedColumn)
    const otherColumn = getColumnProjects(selectedColumn === 0 ? 1 : 0)

    if (key.name === "up") {
      setSelectedRow((prev) => Math.max(0, prev - 1))
    } else if (key.name === "down") {
      setSelectedRow((prev) => Math.min(currentColumn.length - 1, prev + 1))
    } else if (key.name === "left" && selectedColumn === 1) {
      setSelectedColumn(0)
      // Clamp row to new column's bounds
      setSelectedRow((prev) => Math.min(prev, columnA.length - 1))
    } else if (key.name === "right" && selectedColumn === 0 && columnB.length > 0) {
      setSelectedColumn(1)
      // Clamp row to new column's bounds
      setSelectedRow((prev) => Math.min(prev, columnB.length - 1))
    } else if (isKeybind(key, Bind.CONFIRM)) {
      const proj = getSelectedProject()
      if (proj) setConfirmingProject(proj)
    }
  })

  const handleSelect = (column: number, row: number) => {
    setSelectedColumn(column)
    setSelectedRow(row)
  }

  return (
    <box width="100%" flexGrow={1} flexDirection="column" backgroundColor={COLORS.bg}>
      <box 
        width="100%" 
        height={3} 
        border={["bottom"]} 
        borderColor={COLORS.border}
        paddingLeft={2}
        justifyContent="center"
        flexShrink={0}
      >
        <text fg={COLORS.text}><strong>Project Library</strong></text>
        <text fg={COLORS.muted}>  Select a project to load (←→ switch columns, ↑↓ navigate)</text>
      </box>

      <box flexGrow={1} overflow="hidden">
        {projects.length === 0 ? (
          <box flexGrow={1} alignItems="center" justifyContent="center">
            <text fg={COLORS.muted}>No projects found.</text>
          </box>
        ) : (
          <ProjectList
            projects={projects}
            selectedColumn={selectedColumn}
            selectedRow={selectedRow}
            onSelect={handleSelect}
            onConfirm={(p) => setConfirmingProject(p)}
            getProjectTree={getProjectTree}
          />
        )}
      </box>

      {confirmingProject && (
        <LoadConfirmation
          project={confirmingProject}
          onConfirm={handleConfirmLoad}
          onCancel={() => setConfirmingProject(null)}
          width={width}
          height={height}
        />
      )}
    </box>
  )
}
