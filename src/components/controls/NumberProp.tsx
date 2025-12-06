import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"

export function NumberProp({ label, value, onChange, min = 0, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <PropRow label={label}>
      <box id={`num-dec-${label}`} onMouseDown={() => onChange(Math.max(min, value - 5))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.danger}>«</text>
      </box>
      <box id={`num-dec1-${label}`} onMouseDown={() => onChange(Math.max(min, value - 1))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.warning}>‹</text>
      </box>
      <box style={{ width: 4, alignItems: "center" }}>
        <text fg={COLORS.text}>{value}</text>
      </box>
      <box id={`num-inc1-${label}`} onMouseDown={() => onChange(Math.min(max, value + 1))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.success}>›</text>
      </box>
      <box id={`num-inc-${label}`} onMouseDown={() => onChange(Math.min(max, value + 5))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.success}>»</text>
      </box>
    </PropRow>
  )
}
