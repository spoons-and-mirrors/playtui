import { COLORS } from "../../theme"
import { ValueCounter } from "../ui/ValueCounter"

interface MarginValues {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

interface MarginControlProps {
  values: MarginValues
  onChange: (key: keyof MarginValues, value: number | undefined) => void
  onChangeEnd?: (key: keyof MarginValues, value: number | undefined) => void
}

export function MarginControl({ values, onChange, onChangeEnd }: MarginControlProps) {
  const top = values.top ?? 0
  const right = values.right ?? 0
  const bottom = values.bottom ?? 0
  const left = values.left ?? 0

  const handleChange = (key: keyof MarginValues, value: number) => {
    onChange(key, value)
  }

  const handleChangeEnd = (key: keyof MarginValues, value: number) => {
    onChangeEnd?.(key, value)
  }

  return (
    <box id="margin-control" style={{ flexDirection: "column", alignItems: "center", gap: 1, backgroundColor: COLORS.bgAlt, paddingTop: 1, paddingLeft: 1, paddingRight: 1 }}>
      {/* Top */}
      <box id="margin-top-row" style={{ flexDirection: "row", justifyContent: "center" }}>
        <ValueCounter id="margin-top" label="t" value={top} onChange={(v) => handleChange("top", v)} onChangeEnd={(v) => handleChangeEnd("top", v)} />
      </box>
      {/* Left / Right */}
      <box id="margin-middle-row" style={{ flexDirection: "row", justifyContent: "center", gap: 2 }}>
        <ValueCounter id="margin-left" label="l" value={left} onChange={(v) => handleChange("left", v)} onChangeEnd={(v) => handleChangeEnd("left", v)} />
        <ValueCounter id="margin-right" label="r" value={right} onChange={(v) => handleChange("right", v)} onChangeEnd={(v) => handleChangeEnd("right", v)} />
      </box>
      {/* Bottom */}
      <box id="margin-bottom-row" style={{ flexDirection: "row", justifyContent: "center" }}>
        <ValueCounter id="margin-bottom" label="b" value={bottom} onChange={(v) => handleChange("bottom", v)} onChangeEnd={(v) => handleChangeEnd("bottom", v)} />
      </box>
    </box>
  )
}
