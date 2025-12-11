import { useEffect, useRef } from "react"
import { EditorPanel } from "../pages/Editor"
import type { UseProjectReturn } from "../../hooks/useProject"

interface PlayPanelProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  onTogglePlay: () => void
}

export function PlayPanel({ projectHook, isPlaying, onTogglePlay }: PlayPanelProps) {
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
  const { fps, frames, currentFrameIndex } = animation

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
        tree={tree}
        treeKey={currentFrameIndex}
        selectedId={project.selectedId}
        hoveredId={null}
        autoLayout={true}
        onSelect={setSelectedId}
        onHover={() => {}}
        onBackgroundClick={() => setSelectedId(null)}
      />
    </box>
  )
}
