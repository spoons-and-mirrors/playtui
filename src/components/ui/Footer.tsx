import { COLORS } from "../../theme"

export function Footer({ autoLayout, onToggleAutoLayout, showCode }: { 
  autoLayout: boolean
  onToggleAutoLayout: () => void
  showCode?: boolean 
}) {
  return (
    <box id="footer" border={["top"]} borderColor={COLORS.border}
      style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 1 }}>
      {!showCode && (
        <text fg={COLORS.muted}>
          <span fg={COLORS.accent}>Shift+D</span> docs
        </text>
      )}
      {!showCode && (
        <box 
          id="auto-layout-toggle"
          onMouseDown={onToggleAutoLayout}
          style={{ backgroundColor: autoLayout ? COLORS.accent : COLORS.card, paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={autoLayout ? COLORS.bg : COLORS.muted}>⊞ Center</text>
        </box>
      )}
    </box>
  )
}
