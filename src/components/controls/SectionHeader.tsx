import { COLORS } from "../../theme"

export function SectionHeader({ title, collapsed, onToggle }: {
  title: string; collapsed: boolean; onToggle: () => void
}) {
  return (
    <box
      id={`section-${title}`}
      onMouseDown={onToggle}
      style={{ flexDirection: "row", gap: 1, height: 1, marginTop: 1 }}
    >
      <text fg={COLORS.accent}>{collapsed ? "▸" : "▾"}</text>
      <text fg={COLORS.text}><strong>{title}</strong></text>
    </box>
  )
}
