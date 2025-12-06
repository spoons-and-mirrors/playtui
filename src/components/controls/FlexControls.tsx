import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"
import type { FlexDirection, JustifyContent, AlignItems, Overflow } from "../../lib/types"

export function FlexDirectionPicker({ value, onChange }: {
  value: FlexDirection | undefined
  onChange: (v: FlexDirection) => void
}) {
  const isRow = value === "row"
  const isCol = value === "column" || !value

  return (
    <PropRow label="Direction">
      <box style={{ flexDirection: "row", gap: 1 }}>
        <box
          id="flex-dir-row"
          onMouseDown={() => onChange("row")}
          style={{
            backgroundColor: isRow ? COLORS.accent : COLORS.bgAlt,
            paddingLeft: 1, paddingRight: 1,
            flexDirection: "row", gap: 0
          }}
        >
          <text fg={isRow ? COLORS.bg : COLORS.muted}>→ Row</text>
        </box>
        <box
          id="flex-dir-col"
          onMouseDown={() => onChange("column")}
          style={{
            backgroundColor: isCol ? COLORS.accent : COLORS.bgAlt,
            paddingLeft: 1, paddingRight: 1,
            flexDirection: "row", gap: 0
          }}
        >
          <text fg={isCol ? COLORS.bg : COLORS.muted}>↓ Col</text>
        </box>
      </box>
    </PropRow>
  )
}

export function FlexAlignmentGrid({ 
  justify, 
  align, 
  direction,
  onJustifyChange, 
  onAlignChange 
}: {
  justify: JustifyContent | undefined
  align: AlignItems | undefined
  direction: FlexDirection | undefined
  onJustifyChange: (v: JustifyContent) => void
  onAlignChange: (v: AlignItems) => void
}) {
  const justifyOpts: JustifyContent[] = ["flex-start", "center", "flex-end"]
  const alignOpts: AlignItems[] = ["flex-start", "center", "flex-end"]
  
  const currentJ = justify || "flex-start"
  const currentA = align || "stretch"
  
  const jIdx = justifyOpts.indexOf(currentJ)
  const aIdx = alignOpts.indexOf(currentA === "stretch" ? "flex-start" : currentA)
  
  const isRow = direction === "row"

  const renderCell = (jI: number, aI: number) => {
    const isSelected = jIdx === jI && aIdx === aI
    const cellJ = justifyOpts[jI]
    const cellA = alignOpts[aI]
    
    const chars = isRow 
      ? ["╔", "╦", "╗", "╠", "╬", "╣", "╚", "╩", "╝"]
      : ["╔", "╠", "╚", "╦", "╬", "╩", "╗", "╣", "╝"]
    
    const idx = isRow ? aI * 3 + jI : jI * 3 + aI
    const char = chars[idx]
    
    return (
      <box
        key={`${jI}-${aI}`}
        id={`align-${jI}-${aI}`}
        onMouseDown={() => {
          onJustifyChange(cellJ)
          onAlignChange(cellA)
        }}
        style={{
          width: 3, height: 1,
          backgroundColor: isSelected ? COLORS.accent : COLORS.bgAlt,
          alignItems: "center", justifyContent: "center"
        }}
      >
        <text fg={isSelected ? COLORS.bg : COLORS.muted}>{char}</text>
      </box>
    )
  }

  return (
    <box id="flex-align-grid" style={{ flexDirection: "column", gap: 0, marginTop: 1 }}>
      <text fg={COLORS.muted} style={{ marginBottom: 0 }}>Alignment</text>
      <box style={{ flexDirection: "column", gap: 0 }}>
        {[0, 1, 2].map(aI => (
          <box key={aI} style={{ flexDirection: "row", gap: 0 }}>
            {[0, 1, 2].map(jI => renderCell(jI, aI))}
          </box>
        ))}
      </box>
      <box style={{ flexDirection: "row", gap: 1, marginTop: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Justify:</text>
        <text fg={COLORS.accent}>{(currentJ || "start").replace("flex-", "")}</text>
      </box>
      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Align:</text>
        <text fg={COLORS.accent}>{(currentA || "stretch").replace("flex-", "")}</text>
      </box>
    </box>
  )
}

export function GapControl({ gap, rowGap, colGap, onChange }: {
  gap?: number
  rowGap?: number
  colGap?: number
  onChange: (key: "gap" | "rowGap" | "columnGap", val: number | undefined) => void
}) {
  const hasIndividual = rowGap !== undefined || colGap !== undefined
  const displayGap = gap ?? 0
  const displayRow = rowGap ?? gap ?? 0
  const displayCol = colGap ?? gap ?? 0

  const toggleMode = () => {
    if (hasIndividual) {
      const v = rowGap ?? colGap ?? 0
      onChange("gap", v)
      onChange("rowGap", undefined)
      onChange("columnGap", undefined)
    } else {
      onChange("rowGap", displayGap)
      onChange("columnGap", displayGap)
      onChange("gap", undefined)
    }
  }

  const renderGapVal = (label: string, key: "gap" | "rowGap" | "columnGap", val: number) => (
    <box style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
      <text fg={COLORS.muted} style={{ width: 2 }}>{label}</text>
      <box id={`gap-${key}-dec`} onMouseDown={() => onChange(key, Math.max(0, val - 1))}
        style={{ paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.warning}>‹</text>
      </box>
      <text fg={COLORS.text} style={{ width: 2 }}>{val}</text>
      <box id={`gap-${key}-inc`} onMouseDown={() => onChange(key, Math.min(20, val + 1))}
        style={{ paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.success}>›</text>
      </box>
    </box>
  )

  return (
    <box id="gap-ctrl" style={{ flexDirection: "column", marginTop: 1 }}>
      <box style={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
        <text fg={COLORS.muted}>Gap</text>
        <box id="gap-mode" onMouseDown={toggleMode}
          style={{ backgroundColor: COLORS.card, paddingLeft: 1, paddingRight: 1 }}>
          <text fg={COLORS.accent}>{hasIndividual ? "⊟" : "⊞"}</text>
        </box>
      </box>
      <box style={{ flexDirection: hasIndividual ? "column" : "row", gap: 1, marginTop: 0 }}>
        {hasIndividual ? (
          <>
            {renderGapVal("R:", "rowGap", displayRow)}
            {renderGapVal("C:", "columnGap", displayCol)}
          </>
        ) : (
          renderGapVal("", "gap", displayGap)
        )}
      </box>
    </box>
  )
}

export function OverflowPicker({ value, onChange }: {
  value: Overflow | undefined
  onChange: (v: Overflow) => void
}) {
  const options: { val: Overflow; icon: string; label: string }[] = [
    { val: "visible", icon: "◻", label: "Vis" },
    { val: "hidden", icon: "▣", label: "Hide" },
    { val: "scroll", icon: "↕", label: "Scroll" },
  ]
  const current = value || "visible"

  return (
    <PropRow label="Overflow">
      <box style={{ flexDirection: "row", gap: 1 }}>
        {options.map(opt => {
          const isSelected = current === opt.val
          return (
            <box
              key={opt.val}
              id={`overflow-${opt.val}`}
              onMouseDown={() => onChange(opt.val)}
              style={{
                backgroundColor: isSelected ? COLORS.accent : COLORS.bgAlt,
                paddingLeft: 1, paddingRight: 1
              }}
            >
              <text fg={isSelected ? COLORS.bg : COLORS.muted}>{opt.icon}{opt.label}</text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}
