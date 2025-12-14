import { COLORS } from "../../theme"
import { ValueCounter } from "../ui/ValueCounter"
import { PropRow } from "./PropRow"
import type { FlexDirection, JustifyContent, AlignItems, Overflow } from "../../lib/types"

export function GapControl({
  label,
  value,
  property,
  onChange,
  onChangeEnd,
}: {
  label: string
  value: number | undefined
  property: string
  onChange: (v: number) => void
  onChangeEnd?: (v: number) => void
}) {
  const val = value ?? 0

  return (
    <ValueCounter
      id={`gap-${label}`}
      label={label}
      property={property}
      value={val}
      onChange={onChange}
      onChangeEnd={onChangeEnd}
    />
  )
}

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
  onAlignChange,
  onBothChange 
}: {
  justify: JustifyContent | undefined
  align: AlignItems | undefined
  direction: FlexDirection | undefined
  onJustifyChange: (v: JustifyContent) => void
  onAlignChange: (v: AlignItems) => void
  onBothChange: (j: JustifyContent, a: AlignItems) => void
}) {
  const opts: JustifyContent[] = ["flex-start", "center", "flex-end"]
  
  const currentJ = justify ?? "flex-start"
  const currentA = align ?? "flex-start"
  
  const isRow = direction === "row"
  
  const jIdx = opts.indexOf(currentJ)
  const aIdx = opts.indexOf(currentA === "stretch" ? "flex-start" : currentA)

  // For row: cols = justify (X main), rows = align (Y cross)
  // For column: cols = align (X cross), rows = justify (Y main)
  return (
    <box id="flex-align-grid" style={{ flexDirection: "column", gap: 0, marginTop: 1 }}>
      <text fg={COLORS.muted} style={{ marginBottom: 0 }}>Alignment</text>
      <box id="align-matrix" style={{ flexDirection: "column", gap: 0 }}>
        {[0, 1, 2].map(rowIdx => (
          <box key={rowIdx} id={`align-row-${rowIdx}`} style={{ flexDirection: "row", gap: 1 }}>
            {[0, 1, 2].map(colIdx => {
              const cellJIdx = isRow ? colIdx : rowIdx
              const cellAIdx = isRow ? rowIdx : colIdx
              const isSelected = jIdx === cellJIdx && aIdx === cellAIdx
              return (
                <box
                  key={`${colIdx}-${rowIdx}`}
                  id={`align-cell-${colIdx}-${rowIdx}`}
                  onMouseDown={() => {
                    onBothChange(opts[cellJIdx], opts[cellAIdx] as AlignItems)
                  }}
                  style={{ width: 1, height: 1 }}
                >
                  <text fg={isSelected ? COLORS.accent : COLORS.border}>●</text>
                </box>
              )
            })}
          </box>
        ))}
      </box>
      <box style={{ flexDirection: "row", gap: 1, marginTop: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Justify:</text>
        <text fg={COLORS.accent}>{currentJ.replace("flex-", "")}</text>
      </box>
      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Align:</text>
        <text fg={COLORS.accent}>{currentA.replace("flex-", "")}</text>
      </box>
    </box>
  )
}

// Removed duplicate GapControl

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
