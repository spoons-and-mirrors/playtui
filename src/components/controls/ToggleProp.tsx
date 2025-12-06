import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"

export function ToggleProp({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <PropRow label={label}>
      <box id={`tog-${label}`} onMouseDown={() => onChange(!value)}
        style={{ backgroundColor: value ? COLORS.accent : COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={value ? COLORS.bg : COLORS.muted}>{value ? "ON" : "OFF"}</text>
      </box>
    </PropRow>
  )
}
