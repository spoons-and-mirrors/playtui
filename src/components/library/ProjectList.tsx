import { COLORS } from "../../theme"
import { ProjectPreview } from "./ProjectPreview"
import type { ProjectMeta } from "../../lib/projectTypes"
import { useEffect, useState, useCallback } from "react"
import { createDefaultTree } from "../../lib/projectTypes"
import type { ElementNode } from "../../lib/types"

interface ProjectListProps {
  projects: ProjectMeta[]
  selectedIndex: number
  onSelect: (index: number) => void
  onConfirm: (project: ProjectMeta) => void
  getProjectTree: (fileName: string) => Promise<ElementNode | null>
}

export function ProjectList({ 
  projects, 
  selectedIndex, 
  onSelect, 
  onConfirm,
  getProjectTree 
}: ProjectListProps) {
  
  // Cache for loaded trees
  const [treeCache, setTreeCache] = useState<Record<string, ElementNode>>({})

  // Load all project trees on mount
  useEffect(() => {
    const loadAllTrees = async () => {
      for (const proj of projects) {
        if (treeCache[proj.fileName]) continue
        const tree = await getProjectTree(proj.fileName)
        if (tree) {
          setTreeCache(prev => ({ ...prev, [proj.fileName]: tree }))
        }
      }
    }
    loadAllTrees()
  }, [projects, getProjectTree]) // Intentionally not including treeCache to avoid infinite loop

  const handleMouseOver = useCallback((index: number) => {
    onSelect(index)
  }, [onSelect])

  return (
    <scrollbox 
      id="library-scroll"
      viewportCulling={true}
      style={{ 
        flexGrow: 1,
        rootOptions: {
          overflow: "hidden",
        },
        viewportOptions: {
          overflow: "hidden",
        },
        contentOptions: { 
          flexDirection: "column", 
          gap: 1, 
          padding: 1,
        } 
      }}
    >
      {projects.map((proj, i) => {
        const isSelected = i === selectedIndex
        const tree = treeCache[proj.fileName] || createDefaultTree()

        return (
          <box 
            key={proj.fileName}
            id={`project-row-${i}`}
            flexDirection="row" 
            height={12}
            backgroundColor={isSelected ? COLORS.bgAlt : undefined}
            padding={1}
            gap={2}
            onMouseOver={() => handleMouseOver(i)}
            onMouseDown={() => onConfirm(proj)}
          >
            {/* Left: Metadata */}
            <box width={30} flexDirection="column" justifyContent="center">
              <text fg={isSelected ? COLORS.accent : COLORS.text}>
                {isSelected ? <strong>{proj.name}</strong> : proj.name}
              </text>
              <text fg={COLORS.muted}>
                {new Date(proj.updatedAt).toLocaleDateString()}
              </text>
              <text fg={COLORS.muted}>
                {proj.fileName}
              </text>
            </box>

            {/* Right: Preview */}
            <ProjectPreview 
              tree={tree} 
              width={40} 
              height={10} 
              isSelected={isSelected} 
            />
          </box>
        )
      })}
    </scrollbox>
  )
}
