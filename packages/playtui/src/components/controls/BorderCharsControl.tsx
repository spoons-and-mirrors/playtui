import { useState } from 'react'
import { COLORS } from '../../theme'
import { PropRow } from './PropRow'

type BorderChars = {
  horizontal?: string
  vertical?: string
  topLeft?: string
  topRight?: string
  bottomLeft?: string
  bottomRight?: string
  cross?: string
  left?: string
  right?: string
  top?: string
  bottom?: string
}

const CHAR_LABELS: Record<keyof BorderChars, string> = {
  topLeft: 'TL',
  top: 'T ',
  topRight: 'TR',
  left: 'L ',
  cross: 'C ',
  right: 'R ',
  bottomLeft: 'BL',
  bottom: 'B ',
  bottomRight: 'BR',
  horizontal: 'H ',
  vertical: 'V ',
}

const GRID_ORDER: (keyof BorderChars)[] = [
  'topLeft',
  'top',
  'topRight',
  'left',
  'cross',
  'right',
  'bottomLeft',
  'bottom',
  'bottomRight',
  'horizontal',
  'vertical',
]

export function BorderCharsControl({
  value,
  onChange,
  focusedField,
  setFocusedField,
}: {
  value: BorderChars | undefined
  onChange: (v: BorderChars) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
}) {
  const chars = value || {}

  const updateChar = (key: keyof BorderChars, char: string) => {
    // Only take the first character
    const c = char.charAt(0)
    onChange({ ...chars, [key]: c || undefined })
  }

  return (
    <box style={{ flexDirection: 'column', gap: 0, marginTop: 1 }}>
      <text fg={COLORS.muted} attributes={1 << 1}>
        Custom Characters
      </text>
      <box
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1, marginTop: 1 }}
      >
        {GRID_ORDER.map((key) => {
          const isFocused = focusedField === `border-char-${key}`
          return (
            <box
              key={key}
              style={{ flexDirection: 'column', width: 4, gap: 0 }}
            >
              <text fg={COLORS.muted} attributes={1 << 1}>
                {CHAR_LABELS[key]}
              </text>
              <box
                onMouseDown={() => setFocusedField(`border-char-${key}`)}
                style={{
                  backgroundColor: isFocused ? COLORS.accent : COLORS.bgAlt,
                  height: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <input
                  value={chars[key] || ''}
                  focused={isFocused}
                  onInput={(v) => updateChar(key, v)}
                />
              </box>
            </box>
          )
        })}
      </box>
      <box
        onMouseDown={() => onChange(undefined as any)}
        style={{
          marginTop: 1,
          paddingLeft: 1,
          paddingRight: 1,
          backgroundColor: COLORS.bgAlt,
        }}
      >
        <text fg={COLORS.danger}>Reset to Default</text>
      </box>
    </box>
  )
}
