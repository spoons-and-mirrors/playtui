import { COLORS } from '../../theme'
import { PropRow } from './PropRow'

export function SelectProp({
  label,
  value,
  options,
  onChange,
}: {
  label: string | null
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const idx = options.indexOf(value)
  const display = value
    .replace('flex-', '')
    .replace('space-', 'sp-')
    .slice(0, 10)

  const content = (
    <box
      id={`sel-${label || value}`}
      onMouseDown={() => onChange(options[(idx + 1) % options.length])}
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.bgAlt,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      <text fg={COLORS.accent}>{display}</text>
    </box>
  )

  if (label === null) return content

  return <PropRow label={label}>{content}</PropRow>
}
