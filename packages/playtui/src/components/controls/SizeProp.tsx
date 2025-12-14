import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"

export function SizeProp({ label, value, onChange }: {
  label: string; value: number | "auto" | `${number}%` | undefined; onChange: (v: number | "auto" | `${number}%` | undefined) => void
}) {
  const isAuto = value === "auto"
  const isPercent = typeof value === "string" && value.endsWith("%")
  const numVal = typeof value === "number" ? value : (isPercent ? parseInt(value as string) : 0)

  const cycleMode = () => {
    if (isAuto) onChange(`${numVal || 50}%`)
    else if (isPercent) onChange(numVal || 0)
    else onChange("auto")
  }

  const modeLabel = isAuto ? "A" : isPercent ? "%" : "#"
  const modeColor = isAuto ? COLORS.accent : isPercent ? COLORS.warning : COLORS.bgAlt

  return (
    <PropRow label={label}>
      <box id={`size-mode-${label}`} onMouseDown={cycleMode}
        style={{ backgroundColor: modeColor, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={isAuto || isPercent ? COLORS.bg : COLORS.muted}>{modeLabel}</text>
      </box>
      {!isAuto && (
        <>
          <box id={`size-dec5-${label}`} onMouseDown={() => {
            const next = Math.max(0, numVal - 5)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.danger}>«</text>
          </box>
          <box id={`size-dec-${label}`} onMouseDown={() => {
            const next = Math.max(0, numVal - 1)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.warning}>‹</text>
          </box>
          <box style={{ width: 4, alignItems: "center" }}>
            <text fg={COLORS.text}>{numVal}{isPercent ? "%" : ""}</text>
          </box>
          <box id={`size-inc-${label}`} onMouseDown={() => {
            const max = isPercent ? 100 : 999
            const next = Math.min(max, numVal + 1)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.success}>›</text>
          </box>
          <box id={`size-inc5-${label}`} onMouseDown={() => {
            const max = isPercent ? 100 : 999
            const next = Math.min(max, numVal + 5)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.success}>»</text>
          </box>
        </>
      )}
    </PropRow>
  )
}
