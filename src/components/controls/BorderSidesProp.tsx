import { COLORS } from "../../theme"
import type { BorderSide } from "../../lib/types"
import { PropRow } from "./PropRow"

const BORDER_SIDES: BorderSide[] = ["top", "right", "bottom", "left"]
const SIDE_LABELS: Record<BorderSide, string> = { top: "T", right: "R", bottom: "B", left: "L" }

export function BorderSidesProp({ label, value, onChange }: {
  label: string; value: BorderSide[] | undefined; onChange: (v: BorderSide[] | undefined) => void
}) {
  const selected = value || []
  const toggle = (side: BorderSide) => {
    const has = selected.includes(side)
    const next = has ? selected.filter(s => s !== side) : [...selected, side]
    onChange(next.length > 0 ? next : undefined)
  }

  return (
    <PropRow label={label}>
      <box style={{ flexDirection: "row", gap: 1 }}>
        {BORDER_SIDES.map(side => {
          const isOn = selected.includes(side)
          return (
            <box
              key={side}
              id={`bside-${side}`}
              onMouseDown={() => toggle(side)}
              style={{ backgroundColor: isOn ? COLORS.accent : COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}
            >
              <text fg={isOn ? COLORS.bg : COLORS.muted}>{SIDE_LABELS[side]}</text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}
