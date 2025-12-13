import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { PlayPanel } from "../play/PlayPanel"
import { TimelinePanel } from "../timeline/TimelinePanel"
import type { UseProjectReturn } from "../../hooks/useProject"

interface PlayPageProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  onTogglePlay: () => void
}

export function PlayPage({ projectHook, isPlaying, onTogglePlay }: PlayPageProps) {
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
        <PlayPanel projectHook={projectHook} isPlaying={isPlaying} onTogglePlay={onTogglePlay} />
      </box>

      {/* Timeline Panel Overlay/Section */}
      {showTimeline && (
        <box height={14} flexShrink={0}>
          <TimelinePanel onClose={() => setShowTimeline(false)} />
        </box>
      )}
    </box>
  )
}
