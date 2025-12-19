import { COLORS } from '../../theme'
import { PropRow } from './PropRow'

export function ToggleProp({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  const handleClick = () => onChange(!value)
  return (
    <PropRow
      label={label}
      onMouseDown={handleClick}
      backgroundColor={value ? COLORS.accent : COLORS.bgAlt}
    >
      <box style={{ paddingLeft: 1, paddingRight: 1 }}>
        <text fg={value ? COLORS.bg : COLORS.muted}>{value ? 'ON' : 'OFF'}</text>
      </box>
    </PropRow>
  )
}
