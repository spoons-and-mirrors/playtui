import { COLORS } from "../../theme"
import { useKeyframing } from "../contexts/KeyframingContext"

export function FrameRuler({ 
  frameCount, 
  currentFrame, 
  width, 
  onSeek 
}: { 
  frameCount: number
  currentFrame: number
  width: number
  onSeek: (frame: number) => void
}) {
  const startFrame = 0 // Scroll offset not implemented yet

  // Visible range
  const visibleFrames = Math.floor((width - 20) / 2) // Rough estimate
  
  return (
    <box height={1} flexDirection="row" backgroundColor={COLORS.bgAlt}>
      <box width={20} paddingRight={1} justifyContent="flex-end">
        <text fg={COLORS.muted}>Frame</text>
      </box>
      <box flexDirection="row" flexGrow={1} overflow="hidden">
        {Array.from({ length: Math.min(frameCount, 100) }).map((_, i) => (
          <box
            key={i}
            width={1}
            height={1}
            justifyContent="center"
            backgroundColor={i === currentFrame ? COLORS.accent : "transparent"}
            onMouseDown={() => onSeek(i)}
          >
            <text fg={i === currentFrame ? COLORS.bg : COLORS.muted}>
              {i % 5 === 0 ? (i % 10 === 0 ? "│" : "·") : "·"}
            </text>
          </box>
        ))}
      </box>
    </box>
  )
}
