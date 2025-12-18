import { COLORS } from '../../theme'

export function SectionHeader({
  title,
  collapsed,
  onToggle,
  collapsible = true,
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
  collapsible?: boolean
}) {
  return (
    <box
      id={`section-${title}`}
      onMouseDown={collapsible ? onToggle : undefined}
      style={{
        flexDirection: 'row',
        gap: 1,
        height: 1,
        marginBottom: 1,
      }}
    >
      {collapsible ? (
        <text fg={COLORS.accent}>{collapsed ? '▸' : '▾'}</text>
      ) : (
        <box width={1} />
      )}
      <text fg={COLORS.text}>
        <strong>{title}</strong>
      </text>
    </box>
  )
}
