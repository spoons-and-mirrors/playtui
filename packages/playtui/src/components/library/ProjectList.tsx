import { useRef, useState, useEffect, useCallback } from 'react'
import { COLORS } from '../../theme'
import { ProjectPreview } from './ProjectPreview'
import type { ProjectMeta, Renderable } from '../../lib/types'
import { createDefaultTree } from '../../lib/types'
import type { ScrollBoxRenderable } from '@opentui/core'

const ROW_HEIGHT = 12
const SCROLL_SPEED = 6

interface ProjectListProps {
  projects: ProjectMeta[]
  selectedColumn: number
  selectedRow: number
  onSelect: (column: number, row: number) => void
  onConfirm: (project: ProjectMeta) => void
  getProjectTree: (fileName: string) => Promise<Renderable | null>
}

export function ProjectList({
  projects,
  selectedColumn,
  selectedRow,
  onSelect,
  onConfirm,
  getProjectTree,
}: ProjectListProps) {
  const scrollRefA = useRef<ScrollBoxRenderable>(null)
  const scrollRefB = useRef<ScrollBoxRenderable>(null)

  // Cache for loaded trees
  const [treeCache, setTreeCache] = useState<Record<string, Renderable>>({})

  // Split projects into two columns
  const columnA = projects.filter((_, i) => i % 2 === 0)
  const columnB = projects.filter((_, i) => i % 2 === 1)

  // Open all project trees on mount
  useEffect(() => {
    const loadAllTrees = async () => {
      for (const proj of projects) {
        if (treeCache[proj.fileName]) continue
        const tree = await getProjectTree(proj.fileName)
        if (tree) {
          setTreeCache((prev) => ({ ...prev, [proj.fileName]: tree }))
        }
      }
    }
    loadAllTrees()
  }, [projects, getProjectTree])

  // Sync scroll both columns
  const scrollBoth = useCallback((y: number) => {
    scrollRefA.current?.scrollTo({ x: 0, y })
    scrollRefB.current?.scrollTo({ x: 0, y })
  }, [])

  const scrollBothBy = useCallback(
    (delta: number) => {
      const currentY = scrollRefA.current?.scrollTop ?? 0
      const newY = Math.max(0, currentY + delta)
      scrollBoth(newY)
    },
    [scrollBoth],
  )

  // Scroll selected item into view when selection changes
  useEffect(() => {
    const sb = scrollRefA.current
    if (!sb) return

    const itemTop = selectedRow * (ROW_HEIGHT + 1)
    const itemBottom = itemTop + ROW_HEIGHT
    const viewportHeight = sb.height ?? 0
    const scrollTop = sb.scrollTop ?? 0

    if (itemTop < scrollTop) {
      scrollBoth(itemTop)
    } else if (itemBottom > scrollTop + viewportHeight) {
      scrollBoth(itemBottom - viewportHeight)
    }
  }, [selectedColumn, selectedRow, scrollBoth])

  const handleMouseOver = useCallback(
    (column: number, row: number) => {
      onSelect(column, row)
    },
    [onSelect],
  )

  const handleScroll = useCallback(
    (direction: 'up' | 'down') => {
      const delta = direction === 'up' ? -SCROLL_SPEED : SCROLL_SPEED
      scrollBothBy(delta)
    },
    [scrollBothBy],
  )

  const renderColumn = (
    columnProjects: ProjectMeta[],
    columnIndex: number,
    scrollRef: React.RefObject<ScrollBoxRenderable | null>,
    hideScrollbar: boolean = false,
  ) => (
    <scrollbox
      ref={scrollRef}
      id={`library-scroll-${columnIndex}`}
      viewportCulling={true}
      onMouseScroll={(e) => {
        if (!e.scroll) return
        const dir = e.scroll.direction
        if (dir === 'up' || dir === 'down') handleScroll(dir)
      }}
      style={{
        flexGrow: 1,
        rootOptions: { overflow: 'hidden' },
        viewportOptions: { overflow: 'hidden' },
        contentOptions: { flexDirection: 'column', gap: 1, padding: 1 },
        scrollbarOptions: hideScrollbar
          ? {
              trackOptions: {
                foregroundColor: 'transparent',
                backgroundColor: 'transparent',
              },
            }
          : undefined,
      }}
    >
      {columnProjects.map((proj, rowIndex) => {
        const isSelected =
          selectedColumn === columnIndex && selectedRow === rowIndex
        const tree = treeCache[proj.fileName] || createDefaultTree()

        return (
          <box
            key={proj.fileName}
            id={`project-${columnIndex}-${rowIndex}`}
            flexDirection="row"
            height={ROW_HEIGHT}
            backgroundColor={isSelected ? COLORS.bgAlt : undefined}
            padding={1}
            gap={2}
            onMouseOver={() => handleMouseOver(columnIndex, rowIndex)}
            onMouseDown={() => onConfirm(proj)}
          >
            {/* Left: Metadata */}
            <box width={24} flexDirection="column" justifyContent="center">
              <text fg={isSelected ? COLORS.accent : COLORS.text}>
                {isSelected ? <strong>{proj.name}</strong> : proj.name}
              </text>
              <text fg={COLORS.muted}>
                {new Date(proj.updatedAt).toLocaleDateString()}
              </text>
              <text fg={COLORS.muted}>{proj.fileName}</text>
            </box>

            {/* Right: Preview */}
            <ProjectPreview
              tree={tree}
              width={30}
              height={10}
              isSelected={isSelected}
            />
          </box>
        )
      })}
    </scrollbox>
  )

  return (
    <box flexDirection="row" flexGrow={1} gap={1}>
      {renderColumn(columnA, 0, scrollRefA, true)}
      <box width={1} backgroundColor={COLORS.border} />
      {renderColumn(columnB, 1, scrollRefB, false)}
    </box>
  )
}
