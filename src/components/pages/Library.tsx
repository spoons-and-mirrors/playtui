import { useKeyboard } from "@opentui/react"
import { useState, useEffect } from "react"
import { ProjectList } from "../library/ProjectList"
import { LoadConfirmation } from "../library/LoadConfirmation"
import { COLORS } from "../../theme"
import type { UseProjectReturn } from "../../hooks/useProject"
import * as storage from "../../lib/storage"
import type { ProjectMeta } from "../../lib/projectTypes"
import type { ElementNode } from "../../lib/types"

interface LibraryPageProps {
  projectHook: UseProjectReturn
  onLoadProject: () => void
  width: number
  height: number
}

export function LibraryPage({ projectHook, onLoadProject, width, height }: LibraryPageProps) {
  const { projects, refreshProjects, loadProject } = projectHook
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [confirmingProject, setConfirmingProject] = useState<ProjectMeta | null>(null)

  // Refresh list on mount
  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  // Helper to fetch tree for preview
  const getProjectTree = async (fileName: string): Promise<ElementNode | null> => {
    // We use the direct storage call here to avoid updating the main app state
    // just for a preview.
    const proj = await storage.loadProject(fileName)
    return proj ? proj.tree : null
  }

  useKeyboard((key) => {
    if (confirmingProject) {
      if (key.name === "escape") {
        setConfirmingProject(null)
      } else if (key.name === "return") {
        handleConfirmLoad()
      }
      return
    }

    if (key.name === "up" || key.name === "k") {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
    } else if (key.name === "down" || key.name === "j") {
      setSelectedIndex((prev) => Math.min(projects.length - 1, prev + 1))
    } else if (key.name === "return") {
      const proj = projects[selectedIndex]
      if (proj) setConfirmingProject(proj)
    }
  })

  const handleConfirmLoad = async () => {
    if (!confirmingProject) return
    
    const success = await loadProject(confirmingProject.fileName)
    if (success) {
      setConfirmingProject(null)
      onLoadProject()
    }
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
        <text fg={COLORS.muted}>Select a project to load</text>
      </box>

      <box flexGrow={1} overflow="hidden">
        {projects.length === 0 ? (
          <box flexGrow={1} alignItems="center" justifyContent="center">
            <text fg={COLORS.muted}>No projects found.</text>
          </box>
        ) : (
          <ProjectList
            projects={projects}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
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
