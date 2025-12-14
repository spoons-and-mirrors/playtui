import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { PlayPanel } from "../play/PlayPanel"
import { TimelinePanel } from "../timeline/TimelinePanel"
import type { UseProjectReturn } from "../../hooks/useProject"
import type { DragEvent } from "../Renderer"
import type { CanvasOffset } from "./Editor"
import { Bind, isKeybind } from "../../lib/shortcuts"

interface PlayPageProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  canvasOffset: CanvasOffset
  canvasOffsetAdjustY?: number
  onCanvasOffsetChange: (offset: CanvasOffset) => void
  onTogglePlay: () => void
  onToggleTimeline: () => void
  onDragStart?: (event: DragEvent) => void
  onDragMove?: (event: DragEvent) => void
  onDragEnd?: (nodeId: string) => void
}

export function PlayPage({ projectHook, isPlaying, canvasOffset, canvasOffsetAdjustY, onCanvasOffsetChange, onTogglePlay, onToggleTimeline, onDragStart, onDragMove, onDragEnd }: PlayPageProps) {
  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Main Play Area */}
      <box flexGrow={1}>
        <PlayPanel 
          projectHook={projectHook} 
          isPlaying={isPlaying} 
          canvasOffset={canvasOffset}
          canvasOffsetAdjustY={canvasOffsetAdjustY}
          onCanvasOffsetChange={onCanvasOffsetChange}
          onTogglePlay={onTogglePlay}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      </box>
    </box>
  )
}
