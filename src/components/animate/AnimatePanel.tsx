import { useEffect, useRef } from "react"
import { FilmStrip } from "./FilmStrip"
import { EditorPanel } from "../pages/Editor"
import type { UseProjectReturn } from "../../hooks/useProject"

interface AnimatePanelProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  onTogglePlay: () => void
}

export function AnimatePanel({ projectHook, isPlaying, onTogglePlay }: AnimatePanelProps) {
  const { 
    project, 
    updateTree, 
    setCurrentFrame, 
    duplicateFrame, 
    deleteFrame, 
    setFps,
    setSelectedId 
  } = projectHook

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  if (!project) return null

  const { animation, tree } = project
  const { fps, frames, currentFrameIndex } = animation

  // Playback logic
  useEffect(() => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      
      timerRef.current = setInterval(() => {
        const nextIndex = (currentFrameIndex + 1) % frames.length
        setCurrentFrame(nextIndex)
      }, 1000 / fps)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, fps, frames.length, currentFrameIndex, setCurrentFrame])

  // Stop playing if user interacts manually (optional, but good UX)
  const handleSelectFrame = (index: number) => {
    if (isPlaying) onTogglePlay()
    setCurrentFrame(index)
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <FilmStrip
        frames={frames}
        currentIndex={currentFrameIndex}
        onSelectFrame={handleSelectFrame}
        onDuplicateFrame={duplicateFrame}
        onDeleteFrame={deleteFrame}
        fps={fps}
        onFpsChange={setFps}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
      />

      <EditorPanel
        tree={tree}
        treeKey={currentFrameIndex}
        selectedId={project.selectedId}
        hoveredId={null}
        autoLayout={true}
        onSelect={setSelectedId}
        onHover={() => {}}
        onBackgroundClick={() => setSelectedId(null)}
        onToggleAutoLayout={() => {}}
        hideCenterButton={true}
      />
    </box>
  )
}
