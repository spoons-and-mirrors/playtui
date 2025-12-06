import { COLORS } from "../../theme"

export function PositionControl({ values, onChange }: {
  values: { top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "top" | "right" | "bottom" | "left", val: number | undefined) => void
}) {
  const { top, right, bottom, left } = values

  const renderVal = (key: "top" | "right" | "bottom" | "left", v: number | undefined, char: string) => {
    const isSet = v !== undefined
    const display = v ?? "-"
    return (
      <box
        id={`pos-${key}`}
        style={{ flexDirection: "row", alignItems: "center", gap: 0 }}
      >
        <box
          id={`pos-${key}-dec`}
          onMouseDown={() => onChange(key, (v ?? 0) - 1)}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.warning}>‹</text>
        </box>
        <text fg={COLORS.muted} style={{ width: 1 }}>{char}</text>
        <box
          id={`pos-${key}-val`}
          onMouseDown={() => onChange(key, isSet ? undefined : 0)}
          style={{ width: 3, alignItems: "center" }}
        >
          <text fg={isSet ? COLORS.text : COLORS.muted}>{display}</text>
        </box>
        <box
          id={`pos-${key}-inc`}
          onMouseDown={() => onChange(key, (v ?? 0) + 1)}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.success}>›</text>
        </box>
      </box>
    )
  }

  return (
    <box id="pos-ctrl" style={{ flexDirection: "column", marginBottom: 1 }}>
      <text fg={COLORS.muted}>Position Offsets</text>
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, backgroundColor: COLORS.bgAlt, padding: 1 }}>
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal("top", top, "↑")}
        </box>
        <box style={{ flexDirection: "row", justifyContent: "space-between", width: 24 }}>
          {renderVal("left", left, "←")}
          <box style={{ width: 2, alignItems: "center" }}>
            <text fg={COLORS.accent}>◎</text>
          </box>
          {renderVal("right", right, "→")}
        </box>
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal("bottom", bottom, "↓")}
        </box>
      </box>
    </box>
  )
}
