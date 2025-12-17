import { ValueSlider } from "../ui/ValueSlider"

export function SpacingControl({ label, values, onChange, onChangeEnd, properties }: {
  label: string
  values: { all?: number; top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
  onChangeEnd?: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
  properties?: { all?: string; top?: string; right?: string; bottom?: string; left?: string }
}) {
  const { top, right, bottom, left } = values

  return (
    <box id={`spacing-ctrl-${label}`} style={{ flexDirection: "row", gap: 1 }}>
      <ValueSlider
        id={`${label}-top`}
        label="t"
        property={properties?.top}
        value={top ?? 0}
        onChange={(v) => onChange("top", Math.max(0, v))}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("top", Math.max(0, v)) : undefined}
      />
      <ValueSlider
        id={`${label}-right`}
        label="r"
        property={properties?.right}
        value={right ?? 0}
        onChange={(v) => onChange("right", Math.max(0, v))}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("right", Math.max(0, v)) : undefined}
      />
      <ValueSlider
        id={`${label}-bottom`}
        label="b"
        property={properties?.bottom}
        value={bottom ?? 0}
        onChange={(v) => onChange("bottom", Math.max(0, v))}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("bottom", Math.max(0, v)) : undefined}
      />
      <ValueSlider
        id={`${label}-left`}
        label="l"
        property={properties?.left}
        value={left ?? 0}
        onChange={(v) => onChange("left", Math.max(0, v))}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd("left", Math.max(0, v)) : undefined}
      />
    </box>
  )
}
