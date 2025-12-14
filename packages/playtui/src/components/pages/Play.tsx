import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { PlayPanel } from "../play/PlayPanel"
import { TimelinePanel } from "../timeline/TimelinePanel"
import type { UseProjectReturn } from "../../hooks/useProject"
import type { DragEvent } from "../Renderer"

interface PlayPageProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  autoLayout: boolean
  onTogglePlay: () => void
  onDragStart?: (event: DragEvent) => void
  onDragMove?: (event: DragEvent) => void
  onDragEnd?: (nodeId: string) => void
}

export function PlayPage({ projectHook, isPlaying, autoLayout, onTogglePlay, onDragStart, onDragMove, onDragEnd }: PlayPageProps) {
  const [showTimeline, setShowTimeline] = useState(false)

  useKeyboard((key) => {
    if (key.name === "t") {
      setShowTimeline((v) => !v)
    }
  })

  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Main Play Area */}
      <box flexGrow={1}>
        <PlayPanel 
          projectHook={projectHook} 
          isPlaying={isPlaying} 
          autoLayout={autoLayout}
          onTogglePlay={onTogglePlay}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      </box>

      {/* Timeline Panel Overlay/Section */}
      {showTimeline && (
        <box height={14} flexShrink={0}>
          <TimelinePanel 
            projectHook={projectHook}
            onClose={() => setShowTimeline(false)} 
          />
        </box>
      )}
    </box>
  )
}
