import { COLORS } from "../../theme"

interface KeyframeDiamondProps {
  hasKeyframe: boolean
  isCurrentFrame: boolean
  active: boolean // Hovered or interacting
}

export function KeyframeDiamond({ hasKeyframe, isCurrentFrame, active }: KeyframeDiamondProps) {
  // ◇  - No keyframes on this property (hollow, muted color)
  // ◆  - Has keyframes, but not at current frame (filled, muted)
  // ◆  - Has keyframe at current frame (filled, red/accent color)

  let symbol = "◇"
  let color = COLORS.muted

  if (hasKeyframe) {
    symbol = "◆"
    if (isCurrentFrame) {
      color = COLORS.accent // Red/Active color
    } else {
      color = active ? COLORS.text : COLORS.muted
    }
  } else if (active) {
    color = COLORS.muted
  } else {
    color = COLORS.bgAlt // Nearly invisible
  }

  return <text fg={color}>{symbol}</text>
}
