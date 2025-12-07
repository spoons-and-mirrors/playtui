import { useRef } from "react"
import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"

export function StringProp({ label, value, focused, onFocus, onChange }: {
  label: string; value: string; focused: boolean; onFocus: () => void; onChange: (v: string) => void
}) {
  const lastPropValueRef = useRef(value)
  const lastInputValueRef = useRef(value)
  
  // Detect if value prop changed (sync during render, not in effect)
  if (value !== lastPropValueRef.current) {
    lastPropValueRef.current = value
    lastInputValueRef.current = value  // Accept the new prop value
  }
  
  const handleInput = (newValue: string) => {
    // Only fire onChange if this is a NEW value (user typing)
    if (newValue !== lastInputValueRef.current) {
      lastInputValueRef.current = newValue
      onChange(newValue)
    }
  }
  
  return (
    <PropRow label={label}>
      <box id={`str-${label}`} onMouseDown={onFocus}
        style={{ flexGrow: 1, height: 1, backgroundColor: focused ? COLORS.bgAlt : COLORS.input }}>
        <input value={value} focused={focused} onInput={handleInput} placeholder="..." />
      </box>
    </PropRow>
  )
}
