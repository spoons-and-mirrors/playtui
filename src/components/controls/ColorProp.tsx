import { COLORS } from "../../theme"
import { COLOR_PALETTE } from "../../lib/constants"
import { PropRow } from "./PropRow"

export function ColorProp({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <PropRow label={label}>
      <box style={{ flexDirection: "row", gap: 0 }}>
        {COLOR_PALETTE.map((c) => {
          const isSelected = c.value === value
          const isTrans = c.value === "transparent"
          return (
            <box
              key={c.name}
              id={`clr-${label}-${c.name}`}
              onMouseDown={() => onChange(c.value)}
              style={{ width: 2, height: 1 }}
            >
              <text fg={isTrans ? COLORS.muted : c.value}>
                {isTrans ? "╳╳" : isSelected ? "▓▓" : "░░"}
              </text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}

export function ColorPropWithHex({ label, value, onChange, focused, onFocus }: {
  label: string; value: string; onChange: (v: string) => void; focused?: boolean; onFocus?: () => void
}) {
  return (
    <box id={`color-hex-${label}`} style={{ flexDirection: "column", gap: 0 }}>
      <PropRow label={label}>
        <box style={{ flexDirection: "row", gap: 0 }}>
          {COLOR_PALETTE.slice(0, 8).map((c) => {
            const isSelected = c.value === value
            const isTrans = c.value === "transparent"
            return (
              <box
                key={c.name}
                id={`clr-${label}-${c.name}`}
                onMouseDown={() => onChange(c.value)}
                style={{ width: 2, height: 1 }}
              >
                <text fg={isTrans ? COLORS.muted : c.value}>
                  {isTrans ? "╳╳" : isSelected ? "▓▓" : "░░"}
                </text>
              </box>
            )
          })}
        </box>
      </PropRow>
      <box style={{ flexDirection: "row", gap: 1, height: 1, paddingLeft: 9 }}>
        <text fg={COLORS.muted}>#</text>
        <box
          id={`hex-input-${label}`}
          onMouseDown={onFocus}
          style={{ width: 8, backgroundColor: focused ? COLORS.bgAlt : COLORS.input }}
        >
          <input
            value={value.replace("#", "").replace("transparent", "")}
            focused={focused}
            placeholder="hex..."
            onInput={(v) => {
              const hex = v.replace("#", "").slice(0, 6)
              if (/^[0-9a-fA-F]*$/.test(hex)) {
                onChange(hex.length > 0 ? `#${hex}` : "")
              }
            }}
          />
        </box>
        <text fg={value || COLORS.muted}>■■</text>
      </box>
    </box>
  )
}
