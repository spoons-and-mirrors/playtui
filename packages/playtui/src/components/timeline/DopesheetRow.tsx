import { TextAttributes } from "@opentui/core"
import { COLORS } from "../../theme"
import type { AnimatedProperty } from "../../lib/keyframing"

interface DopesheetRowProps {
  property: AnimatedProperty
  frameCount: number
  currentFrame: number
  onSelect: () => void
}

export function DopesheetRow({ property, frameCount, currentFrame, onSelect }: DopesheetRowProps) {
  const keyframes = property.keyframes
  const hasKeyframeAtCurrent = keyframes.some(k => k.frame === currentFrame)

  return (
    <box height={1} flexDirection="row" onMouseDown={onSelect}>
      {/* Label */}
      <box width={20} paddingRight={1} justifyContent="flex-end" backgroundColor={COLORS.bg}>
        <text fg={COLORS.text} attributes={TextAttributes.DIM}>
          {property.property}
        </text>
      </box>
      
      {/* Track */}
      <box flexDirection="row" flexGrow={1} backgroundColor={COLORS.bgAlt} overflow="hidden">
        {Array.from({ length: Math.min(frameCount, 100) }).map((_, i) => {
          const isKeyframe = keyframes.some(k => k.frame === i)
          const isCurrent = i === currentFrame
          
          let char = "·"
          let fg = COLORS.muted
          
          if (isKeyframe) {
            char = "◆"
            fg = isCurrent ? COLORS.accent : COLORS.text
          } else if (isCurrent) {
            char = "│"
            fg = COLORS.accent
          }

          return (
            <box key={i} width={1} justifyContent="center">
              <text fg={fg}>{char}</text>
            </box>
          )
        })}
      </box>
    </box>
  )
}
