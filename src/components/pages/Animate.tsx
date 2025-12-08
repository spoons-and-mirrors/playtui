import { AnimatePanel } from "../animate/AnimatePanel"
import type { UseProjectReturn } from "../../hooks/useProject"
import { COLORS } from "../../theme"

interface AnimatePageProps {
  projectHook: UseProjectReturn
  isPlaying: boolean
  onTogglePlay: () => void
}

export function AnimatePage({ projectHook, isPlaying, onTogglePlay }: AnimatePageProps) {
  return (
    <box width="100%" height="100%" backgroundColor={COLORS.bg}>
      <AnimatePanel 
        projectHook={projectHook} 
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
      />
    </box>
  )
}
