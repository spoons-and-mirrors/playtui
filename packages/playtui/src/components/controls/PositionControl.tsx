import { COLORS } from "../../theme"
import { ValueSlider } from "../ui/ValueSlider"

interface PositionControlProps {
  x?: number
  y?: number
  zIndex?: number
  onChange: (key: "x" | "y" | "zIndex", val: number | undefined) => void
  onChangeEnd?: (key: "x" | "y" | "zIndex", val: number | undefined) => void
}

export function PositionControl({ x = 0, y = 0, zIndex = 0, onChange, onChangeEnd }: PositionControlProps) {
  return (
    <box id="position-control" style={{ flexDirection: "row", gap: 1 }}>
      <ValueSlider
        id="pos-x"
        label="x"
        property="x"
        value={x}
        onChange={(v) => onChange("x", v)}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("x", v) : undefined}
      />
      <ValueSlider
        id="pos-y"
        label="y"
        property="y"
        value={y}
        onChange={(v) => onChange("y", v)}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("y", v) : undefined}
      />
      <ValueSlider
        id="pos-z"
        label="z"
        property="zIndex"
        value={zIndex}
        onChange={(v) => onChange("zIndex", v)}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("zIndex", v) : undefined}
      />
    </box>
  )
}
