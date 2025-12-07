import { COLORS } from "../../theme"

export function SpacingControl({ label, values, onChange }: {
  label: string
  values: { all?: number; top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
}) {
  const { all, top, right, bottom, left } = values
  const hasIndividual = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  const renderVal = (key: "all" | "top" | "right" | "bottom" | "left", v: number | undefined) => {
    const display = v ?? 0
    return (
      <box
        id={`spacing-${label}-${key}`}
        style={{ flexDirection: "row", alignItems: "center", gap: 0 }}
      >
        <box
          id={`spacing-${label}-${key}-dec`}
          onMouseDown={() => onChange(key, Math.max(0, display - 1))}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.warning}>‹</text>
        </box>
        <text fg={COLORS.text}>{display}</text>
        <box
          id={`spacing-${label}-${key}-inc`}
          onMouseDown={() => onChange(key, Math.min(20, display + 1))}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.success}>›</text>
        </box>
      </box>
    )
  }

  return (
    <box id={`spacing-ctrl-${label}`} style={{ flexDirection: "column" }}>
      {label && <text fg={COLORS.muted}>{label}</text>}
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, backgroundColor: COLORS.bgAlt, paddingTop: 1, paddingLeft: 1, paddingRight: 1 }}>
        {/* Top row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "top" : "all", hasIndividual ? top : all)}
        </box>
        {/* Middle row: Left - Right */}
        <box style={{ flexDirection: "row", justifyContent: "center", gap: 2 }}>
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
