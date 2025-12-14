import { COLORS } from "../../theme"

export function PropRow({ label, children, isSet }: { label: string; children: React.ReactNode; isSet?: boolean }) {
  return (
    <box id={`prop-row-${label}`} style={{ flexDirection: "row", gap: 1, height: 1, alignItems: "center" }}>
      <box style={{ flexDirection: "row", width: 9 }}>
        {isSet !== undefined && (
          <text fg={isSet ? COLORS.accent : "transparent"} style={{ width: 1 }}>•</text>
        )}
        <text fg={COLORS.text} style={{ width: 8 }}><strong>{label}</strong></text>
      </box>
      <box style={{ flexDirection: "row", flexGrow: 1, justifyContent: "center" }}>
        {children}
      </box>
    </box>
  )
}
