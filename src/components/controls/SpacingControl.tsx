import { COLORS } from "../../theme"

export function SpacingControl({ label, values, onChange }: {
  label: string
  values: { all?: number; top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
}) {
  const { all, top, right, bottom, left } = values
  const hasIndividual = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  const renderVal = (key: "all" | "top" | "right" | "bottom" | "left", v: number | undefined, char: string) => {
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
        <text fg={COLORS.muted} style={{ width: 1 }}>{char}</text>
        <text fg={COLORS.text} style={{ width: 2 }}>{display}</text>
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
    <box id={`spacing-ctrl-${label}`} style={{ flexDirection: "column", marginBottom: 1 }}>
      <text fg={COLORS.muted} style={{ marginBottom: 0 }}>{label}</text>
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, backgroundColor: COLORS.bgAlt, padding: 1 }}>
        {/* Top row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "top" : "all", hasIndividual ? top : all, "↑")}
        </box>
        {/* Middle row: Left - Center - Right */}
        <box style={{ flexDirection: "row", justifyContent: "space-between", width: 22 }}>
          {renderVal("left", left, "←")}
          <box
            id={`spacing-${label}-mode`}
            onMouseDown={() => {
              if (hasIndividual) {
                const v = top ?? right ?? bottom ?? left ?? 0
                onChange("all", v)
                onChange("top", undefined)
                onChange("right", undefined)
                onChange("bottom", undefined)
                onChange("left", undefined)
              } else {
                const v = all ?? 0
                onChange("top", v)
                onChange("right", v)
                onChange("bottom", v)
                onChange("left", v)
                onChange("all", undefined)
              }
            }}
            style={{ backgroundColor: COLORS.card, paddingLeft: 1, paddingRight: 1 }}
          >
            <text fg={COLORS.accent}>{hasIndividual ? "□" : "■"}</text>
          </box>
          {renderVal("right", right, "→")}
        </box>
        {/* Bottom row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "bottom" : "all", hasIndividual ? bottom : all, "↓")}
        </box>
      </box>
    </box>
  )
}
