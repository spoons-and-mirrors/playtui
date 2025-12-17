import { COLORS } from '../../theme'
import { PropRow } from './PropRow'

// Reusable color control with hex input and palette picker button
// [Label] [██ #hexinput [pick]]
export function ColorControl({
  label,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  pickMode,
  onPickStart,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  focused?: boolean
  onFocus?: () => void
  onBlur?: () => void
  pickMode?: boolean
  onPickStart?: () => void
}) {
  const handleInput = (v: string) => {
    // Handle both typed and pasted input - strip # and non-hex chars
    const hex = v
      .replace(/#/g, '')
      .replace(/[^0-9a-fA-F]/g, '')
      .slice(0, 8)
    onChange(hex.length > 0 ? `#${hex}` : '')
  }

  const handlePaste = (e: { text: string; preventDefault: () => void }) => {
    e.preventDefault()
    const hex = e.text
      .trim()
      .replace(/#/g, '')
      .replace(/[^0-9a-fA-F]/g, '')
      .slice(0, 8)
    if (hex.length > 0) {
      onChange(`#${hex}`)
    }
  }

  return (
    <PropRow label={label}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
        <text fg={value || COLORS.muted}>██</text>
        <box
          id={`color-input-${label}`}
          onMouseDown={(e) => {
            e.stopPropagation()
            onFocus?.()
          }}
          style={{
            flexDirection: 'row',
            backgroundColor: focused ? COLORS.bgAlt : 'transparent',
          }}
        >
          <text fg={COLORS.muted}>#</text>
          <input
            value={(value || '').replace('#', '').slice(0, 8)}
            focused={focused}
            width={8}
            onInput={handleInput}
            onPaste={handlePaste}
            onSubmit={() => onBlur?.()}
          />
        </box>
        <box
          id={`color-pick-${label}`}
          onMouseDown={(e) => {
            e.stopPropagation()
            onPickStart?.()
          }}
          style={{
            backgroundColor: pickMode ? COLORS.accent : COLORS.cardHover,
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          <text fg={pickMode ? COLORS.bg : COLORS.text} selectable={false}>
            {pickMode ? <strong>pick</strong> : 'pick'}
          </text>
        </box>
      </box>
    </PropRow>
  )
}
