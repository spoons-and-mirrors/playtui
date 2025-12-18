import { ValueControl } from '../ui/ValueControl'

interface PositionControlProps {
  x?: number
  y?: number
  zIndex?: number
  onChange: (key: 'x' | 'y' | 'zIndex', val: number | undefined) => void
  onChangeEnd?: (key: 'x' | 'y' | 'zIndex', val: number | undefined) => void
}

export function PositionControl({
  x = 0,
  y = 0,
  zIndex = 0,
  onChange,
  onChangeEnd,
}: PositionControlProps) {
  return (
    <box id="position-control" style={{ flexDirection: 'row', gap: 1 }}>
      <ValueControl
        variant="slider"
        id="pos-x"
        label="x"
        property="x"
        value={x}
        onChange={(v) => onChange('x', v)}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd('x', v) : undefined}
      />
      <ValueControl
        variant="slider"
        id="pos-y"
        label="y"
        property="y"
        value={y}
        onChange={(v) => onChange('y', v)}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd('y', v) : undefined}
      />
      <ValueControl
        variant="slider"
        id="pos-z"
        label="z"
        property="zIndex"
        value={zIndex}
        onChange={(v) => onChange('zIndex', v)}
        onChangeEnd={onChangeEnd ? (v) => onChangeEnd('zIndex', v) : undefined}
      />
    </box>
  )
}
