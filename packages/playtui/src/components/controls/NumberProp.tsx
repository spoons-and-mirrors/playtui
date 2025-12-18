import { ValueControl } from '../ui/ValueControl'
import { PropRow } from './PropRow'

interface NumberPropProps {
  id: string
  label: string
  value: number | undefined
  property?: string
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function NumberProp({
  id,
  label,
  value,
  property,
  onChange,
  onChangeEnd,
  min = -Infinity,
  max = Infinity,
  step = 1,
}: NumberPropProps) {
  const val = value ?? 0

  const handleChange = (v: number) => {
    if (v < min) v = min
    if (v > max) v = max
    onChange(v)
  }

  const handleChangeEnd = (v: number) => {
    if (v < min) v = min
    if (v > max) v = max
    if (onChangeEnd) onChangeEnd(v)
  }

  return (
    <PropRow label={label}>
      <ValueControl
        variant="counter"
        id={id}
        label=""
        property={property}
        value={val}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
      />
    </PropRow>
  )
}
