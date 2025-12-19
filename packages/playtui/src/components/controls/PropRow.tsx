import { COLORS } from '../../theme'

export function PropRow({
  label,
  children,
  isSet,
  focused,
  onMouseDown,
  backgroundColor,
  id,
}: {
  label: string | null
  children: React.ReactNode
  isSet?: boolean
  focused?: boolean
  onMouseDown?: () => void
  backgroundColor?: string
  id?: string
}) {
  const bg = backgroundColor ?? (focused ? COLORS.bgAlt : 'transparent')

  return (
    <box
      id={id ?? `prop-row-${label}`}
      style={{ flexDirection: 'row', gap: 1, height: 1, alignItems: 'center' }}
    >
      {label !== null && (
        <box style={{ flexDirection: 'row', width: 9, flexShrink: 0 }}>
          {isSet !== undefined && (
            <text
              fg={isSet ? COLORS.accent : 'transparent'}
              style={{ width: 1 }}
            >
              •
            </text>
          )}
          <text fg={COLORS.text} style={{ width: 8 }}>
            {label}
          </text>
        </box>
      )}
      <box
        onMouseDown={onMouseDown}
        style={{
          flexDirection: 'row',
          flexGrow: 1,
          justifyContent: 'flex-start',
          backgroundColor: bg,
          height: 1,
        }}
      >
        {children}
      </box>
    </box>
  )
}
