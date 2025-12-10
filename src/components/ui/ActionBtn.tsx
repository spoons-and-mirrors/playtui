import { useState } from "react"
import { COLORS } from "../../theme"

export function ActionBtn({ id, label, color, enabled, onPress }: {
  id: string; label: string; color: string; enabled: boolean; onPress: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const bg = enabled ? (hovered ? COLORS.accentBright : color) : COLORS.muted
  return (
    <box id={id} onMouseDown={enabled ? onPress : undefined}
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{ backgroundColor: bg, paddingLeft: 1, paddingRight: 1 }}>
      <text fg={COLORS.bg}>{label}</text>
    </box>
  )
}
