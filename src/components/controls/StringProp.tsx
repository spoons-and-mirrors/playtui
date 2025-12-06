import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"

export function StringProp({ label, value, focused, onFocus, onChange }: {
  label: string; value: string; focused: boolean; onFocus: () => void; onChange: (v: string) => void
}) {
  return (
    <PropRow label={label}>
      <box id={`str-${label}`} onMouseDown={onFocus}
        style={{ flexGrow: 1, height: 1, backgroundColor: focused ? COLORS.bgAlt : COLORS.input }}>
        <input value={value} focused={focused} onInput={onChange} placeholder="..." />
      </box>
    </PropRow>
  )
}
