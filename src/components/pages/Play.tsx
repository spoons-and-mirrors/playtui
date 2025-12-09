import { PlayPanel } from "../play/PlayPanel"
import type { UseProjectReturn } from "../../hooks/useProject"
import { COLORS } from "../../theme"

interface PlayPageProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  onTogglePlay: () => void
}

export function PlayPage({ projectHook, isPlaying, onTogglePlay }: PlayPageProps) {
  return (
    <box width="100%" height="100%" backgroundColor={COLORS.bg}>
      <PlayPanel 
        projectHook={projectHook} 
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
      />
    </box>
  )
}
