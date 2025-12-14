import { useEffect, useMemo, useRef } from "react"
import { EditorPanel } from "../pages/Editor"
import type { UseProjectReturn } from "../../hooks/useProject"
import type { DragEvent } from "../Renderer"
import type { CanvasOffset } from "../pages/Editor"
import { bakeFrame } from "../../lib/keyframing"

interface PlayPanelProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  canvasOffset: CanvasOffset
  canvasOffsetAdjustY?: number
  onCanvasOffsetChange: (offset: CanvasOffset) => void
  onTogglePlay: () => void
  onDragStart?: (event: DragEvent) => void
  onDragMove?: (event: DragEvent) => void
  onDragEnd?: (nodeId: string) => void
}

export function PlayPanel({ projectHook, isPlaying, canvasOffset, canvasOffsetAdjustY, onCanvasOffsetChange, onTogglePlay, onDragStart, onDragMove, onDragEnd }: PlayPanelProps) {
  const { 
    project, 
    updateTree, 
    setCurrentFrame, 
    duplicateFrame, 
    deleteFrame, 
    setFps,
    setSelectedId,
    importAnimation
  } = projectHook

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameIndexRef = useRef(0)

  if (!project) return null

  const { animation, tree } = project
  const { fps, frames, currentFrameIndex, keyframing } = animation

  // Create a stable key for keyframing state to detect deep changes
  // This ensures curve edits trigger re-baking
  const keyframingKey = useMemo(() => {
    return JSON.stringify(keyframing.animatedProperties)
  }, [keyframing.animatedProperties])

  // Use the snapshot from frames array as the base, then bake driven values
  const displayTree = useMemo(() => {
    const snapshotTree = frames[currentFrameIndex] ?? tree
    return bakeFrame(snapshotTree, keyframing.animatedProperties, currentFrameIndex)
  }, [frames, currentFrameIndex, keyframing.animatedProperties, tree, keyframingKey])

  // Keep ref in sync
  frameIndexRef.current = currentFrameIndex

  // Playback logic
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      const nextIndex = (frameIndexRef.current + 1) % frames.length
      setCurrentFrame(nextIndex)
    }, 1000 / fps)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, fps, frames.length, setCurrentFrame])

  // Stop playing if user interacts manually (optional, but good UX)
  const handleSelectFrame = (index: number) => {
    if (isPlaying) onTogglePlay()
    setCurrentFrame(index)
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <EditorPanel
        tree={displayTree}
        treeKey={currentFrameIndex}
        selectedId={project.selectedId}
        hoveredId={null}
        canvasOffset={canvasOffset}
        canvasOffsetAdjustY={canvasOffsetAdjustY}
        onCanvasOffsetChange={onCanvasOffsetChange}
        onSelect={setSelectedId}
        onHover={() => {}}
        onBackgroundClick={() => setSelectedId(null)}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    </box>
  )
}
