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
    <box id="margin-control" style={{ flexDirection: "row", gap: 1 }}>
      <ValueCounter id="margin-top" label="t" property="marginTop" value={top} onChange={(v) => handleChange("top", v)} onChangeEnd={(v) => handleChangeEnd("top", v)} />
      <ValueCounter id="margin-right" label="r" property="marginRight" value={right} onChange={(v) => handleChange("right", v)} onChangeEnd={(v) => handleChangeEnd("right", v)} />
      <ValueCounter id="margin-bottom" label="b" property="marginBottom" value={bottom} onChange={(v) => handleChange("bottom", v)} onChangeEnd={(v) => handleChangeEnd("bottom", v)} />
      <ValueCounter id="margin-left" label="l" property="marginLeft" value={left} onChange={(v) => handleChange("left", v)} onChangeEnd={(v) => handleChangeEnd("left", v)} />
    </box>
  )
}
