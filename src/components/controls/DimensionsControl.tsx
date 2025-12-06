import { COLORS } from "../../theme"

type SizeValue = number | "auto" | `${number}%` | undefined

function InlineSizeControl({ value, onChange, label }: {
  value: SizeValue
  onChange: (v: SizeValue) => void
  label: string
}) {
  const isAuto = value === "auto"
  const isPercent = typeof value === "string" && value.endsWith("%")
  const numVal = typeof value === "number" ? value : (isPercent ? parseInt(value as string) : 0)
  const isSet = value !== undefined

  const cycleMode = () => {
    if (isAuto) onChange(`${numVal || 50}%`)
    else if (isPercent) onChange(numVal || 0)
    else onChange("auto")
  }

  const modeLabel = isAuto ? "A" : isPercent ? "%" : "#"
  const modeColor = isAuto ? COLORS.accent : isPercent ? COLORS.warning : COLORS.bgAlt

  const adjust = (delta: number) => {
    const max = isPercent ? 100 : 999
    const next = Math.max(0, Math.min(max, numVal + delta))
    onChange(isPercent ? `${next}%` : next)
  }

  return (
    <box style={{ flexDirection: "row", gap: 0, alignItems: "center" }}>
      <text fg={isSet ? COLORS.accent : COLORS.muted} style={{ width: 2 }}>{label}</text>
      <box id={`dim-mode-${label}`} onMouseDown={cycleMode}
        style={{ backgroundColor: modeColor, width: 2, alignItems: "center" }}>
        <text fg={isAuto || isPercent ? COLORS.bg : COLORS.muted}>{modeLabel}</text>
      </box>
      {!isAuto && (
        <>
          <box id={`dim-dec-${label}`} onMouseDown={() => adjust(-1)}
            style={{ paddingLeft: 1 }}>
            <text fg={COLORS.warning}>‹</text>
          </box>
          <box style={{ width: 4, alignItems: "center" }}>
            <text fg={COLORS.text}>{numVal}{isPercent ? "%" : ""}</text>
          </box>
          <box id={`dim-inc-${label}`} onMouseDown={() => adjust(1)}
            style={{ paddingRight: 1 }}>
            <text fg={COLORS.success}>›</text>
          </box>
        </>
      )}
    </box>
  )
}

function BoundControl({ label, value, onChange }: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  const isSet = value !== undefined
  const display = value ?? "-"
  
  return (
    <box style={{ flexDirection: "row", gap: 0, alignItems: "center" }}>
      <text fg={COLORS.muted} style={{ width: 3 }}>{label}:</text>
      <box id={`bound-${label}-dec`} onMouseDown={() => onChange(Math.max(0, (value ?? 0) - 5))}
        style={{ paddingLeft: 1 }}>
        <text fg={COLORS.warning}>‹</text>
      </box>
      <box 
        id={`bound-${label}-val`}
        onMouseDown={() => onChange(isSet ? undefined : 0)}
        style={{ width: 3, alignItems: "center" }}
      >
        <text fg={isSet ? COLORS.text : COLORS.muted}>{display}</text>
      </box>
      <box id={`bound-${label}-inc`} onMouseDown={() => onChange(Math.min(999, (value ?? 0) + 5))}
        style={{ paddingRight: 1 }}>
        <text fg={COLORS.success}>›</text>
      </box>
    </box>
  )
}

export function DimensionsControl({ 
  width, height, minWidth, maxWidth, minHeight, maxHeight,
  onChange 
}: {
  width: SizeValue
  height: SizeValue
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  onChange: (key: "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight", val: SizeValue) => void
}) {
  const hasMinMax = minWidth !== undefined || maxWidth !== undefined || minHeight !== undefined || maxHeight !== undefined

  return (
    <box id="dimensions-ctrl" style={{ flexDirection: "column", gap: 0 }}>
      {/* Main W x H row */}
      <box style={{ flexDirection: "row", gap: 1, alignItems: "center", backgroundColor: COLORS.bgAlt, padding: 1 }}>
        <InlineSizeControl value={width} onChange={(v) => onChange("width", v)} label="W" />
        <text fg={COLORS.muted}>×</text>
        <InlineSizeControl value={height} onChange={(v) => onChange("height", v)} label="H" />
      </box>
      
      {/* Min/Max toggle and controls */}
      <box style={{ flexDirection: "row", gap: 1, marginTop: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Bounds</text>
        <box 
          id="dim-bounds-toggle"
          onMouseDown={() => {
            if (hasMinMax) {
              onChange("minWidth", undefined)
              onChange("maxWidth", undefined)
              onChange("minHeight", undefined)
              onChange("maxHeight", undefined)
            } else {
              onChange("minWidth", 0)
              onChange("maxWidth", 100)
            }
          }}
          style={{ backgroundColor: hasMinMax ? COLORS.accent : COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={hasMinMax ? COLORS.bg : COLORS.muted}>{hasMinMax ? "ON" : "OFF"}</text>
        </box>
      </box>
      
      {hasMinMax && (
        <box style={{ flexDirection: "column", gap: 0, marginTop: 1, paddingLeft: 1 }}>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={COLORS.muted} style={{ width: 6 }}>Width</text>
            <BoundControl label="min" value={minWidth} onChange={(v) => onChange("minWidth", v)} />
            <BoundControl label="max" value={maxWidth} onChange={(v) => onChange("maxWidth", v)} />
          </box>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={COLORS.muted} style={{ width: 6 }}>Height</text>
            <BoundControl label="min" value={minHeight} onChange={(v) => onChange("minHeight", v)} />
            <BoundControl label="max" value={maxHeight} onChange={(v) => onChange("maxHeight", v)} />
          </box>
        </box>
      )}
    </box>
  )
}
