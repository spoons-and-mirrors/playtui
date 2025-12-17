import { COLORS } from '../../theme'
import { PropRow } from './PropRow'

export function SelectProp({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const idx = options.indexOf(value)
  const display = value
    .replace('flex-', '')
    .replace('space-', 'sp-')
    .slice(0, 10)
  return (
    <PropRow label={label}>
      <box
        id={`sel-${label}`}
        onMouseDown={() => onChange(options[(idx + 1) % options.length])}
        style={{
          flexDirection: 'row',
          backgroundColor: COLORS.bgAlt,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <text fg={COLORS.accent}>{display}</text>
        <text fg={COLORS.muted}> ◂▸</text>
      </box>
    </PropRow>
  )
}
