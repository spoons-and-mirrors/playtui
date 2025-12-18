import { COLORS } from '../../theme'
import { PropRow } from './PropRow'
import { ValueSlider } from '../ui/ValueSlider'

/**
 * Reusable color control with hex input and palette picker button
 * - ValueSlider: Shows/adjusts alpha (0-100 mapped to 0-255)
 * - ██ Swatch: Shows current color
 * - #hex: Direct text input for hex colors (6 or 8 digits)
 * - p: Button to enter color picking mode
 */
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
  const getAlpha = (hex: string) => {
    const cleanHex = (hex || '').replace('#', '')
    if (cleanHex.length === 8) {
      return parseInt(cleanHex.slice(6, 8), 16)
    }
    return 255
  }

  const setAlpha = (hex: string, alpha: number) => {
    let raw = (hex || '').replace('#', '')
    if (raw.length === 0) raw = 'ffffff'

    // If it's 3 digits, expand it to 6
    if (raw.length === 3) {
      raw = raw
        .split('')
        .map((c) => c + c)
        .join('')
    }

    // Ensure we have 6 chars for RGB
    const rgb = raw.slice(0, 6).padEnd(6, 'f')
    const a = Math.max(0, Math.min(255, Math.round(alpha)))
      .toString(16)
      .padStart(2, '0')
    return `#${rgb}${a}`
  }

  const cleanHexStr = (v: string) =>
    v
      .replace(/#/g, '')
      .replace(/[^0-9a-fA-F]/g, '')
      .slice(0, 8)

  const handleInput = (v: string) => {
    const hex = cleanHexStr(v)
    onChange(hex.length > 0 ? `#${hex}` : '')
  }

  const handlePaste = (e: { text: string; preventDefault: () => void }) => {
    e.preventDefault()
    const hex = cleanHexStr(e.text.trim())
    if (hex.length > 0) {
      onChange(`#${hex}`)
    }
  }

  const alpha = getAlpha(value)

  return (
    <PropRow label={label}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
        <ValueSlider
          id={`color-alpha-${label}`}
          label=""
          value={Math.round((alpha / 255) * 100)}
          resetTo={100}
          onChange={(v) => onChange(setAlpha(value, (v / 100) * 255))}
        />
        <text fg={value || COLORS.muted} selectable={false}>
          ██
        </text>
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
            {pickMode ? <strong>p</strong> : 'p'}
          </text>
        </box>
      </box>
    </PropRow>
  )
}
