import { useRef } from 'react'
import { PropRow } from './PropRow'

export function StringProp({
  label,
  value,
  focused,
  onFocus,
  onChange,
}: {
  label: string
  value: string
  focused: boolean
  onFocus: () => void
  onChange: (v: string) => void
}) {
  const lastPropValueRef = useRef(value)
  const lastInputValueRef = useRef(value)

  // Detect if value prop changed (sync during render, not in effect)
  if (value !== lastPropValueRef.current) {
    lastPropValueRef.current = value
    lastInputValueRef.current = value // Accept the new prop value
  }

  const handleInput = (newValue: string) => {
    // Only fire onChange if this is a NEW value (user typing)
    if (newValue !== lastInputValueRef.current) {
      lastInputValueRef.current = newValue
      onChange(newValue)
    }
  }

  return (
    <PropRow label={label} focused={focused} onMouseDown={onFocus}>
      <input
        value={value}
        focused={focused}
        onInput={handleInput}
        placeholder="..."
      />
    </PropRow>
  )
}
