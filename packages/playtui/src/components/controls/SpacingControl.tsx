import { COLORS } from "../../theme"
import { ValueCounter } from "../ui/ValueCounter"

export function SpacingControl({ label, values, onChange, onChangeEnd, properties }: {
  label: string
  values: { all?: number; top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
  onChangeEnd?: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
  properties?: { all?: string; top?: string; right?: string; bottom?: string; left?: string }
}) {
  const { all, top, right, bottom, left } = values
  // Only fallback to "all" if NO individual values are set, otherwise treat as 0 for undefined individual slots
  const hasIndividual = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  const renderVal = (key: "all" | "top" | "right" | "bottom" | "left", v: number | undefined) => {
    const display = v ?? 0
    const propName = properties?.[key]
    
    return (
      <ValueCounter
        id={`spacing-${label}-${key}`}
        label=""
        property={propName}
        value={display}
        onChange={(newVal) => onChange(key, Math.max(0, newVal))}
        onChangeEnd={onChangeEnd ? (newVal) => onChangeEnd(key, Math.max(0, newVal)) : undefined}
      />
    )
  }

  return (
    <box id={`spacing-ctrl-${label}`} style={{ flexDirection: "column" }}>
      {label && <text fg={COLORS.muted} style={{ marginBottom: 0 }}>{label}</text>}
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, backgroundColor: COLORS.bgAlt, padding: 0, width: "100%" }}>
        {/* Top row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "top" : "all", hasIndividual ? top : all)}
        </box>
        {/* Middle row: Left - Spacer - Right */}
        <box style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", paddingLeft: 1, paddingRight: 1 }}>
          {renderVal("left", left)}
          {renderVal("right", right)}
        </box>
        {/* Bottom row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "bottom" : "all", hasIndividual ? bottom : all)}
        </box>
      </box>
    </box>
  )
}
