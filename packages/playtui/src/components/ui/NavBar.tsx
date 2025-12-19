import { useState, useEffect } from 'react'
import { COLORS } from '../../theme'
import type { SaveStatus } from '../../hooks/useProject'
import type { ViewMode } from '../../lib/viewState'
import { VIEW_MODES, VIEW_MODE_BY_MODE, NAV_ITEMS } from '../../lib/viewState'
import { Bind, getShortcutLabel } from '../../lib/shortcuts'
import { NAVBAR_HEIGHT } from '../../lib/constants'

// ============================================================================
// Save Indicator
// ============================================================================

const SPINNER_FRAMES = ['◐', '◓', '◑', '◒']

function SaveIndicator({ status }: { status: SaveStatus }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (status === 'saving') {
      const timer = setInterval(() => {
        setFrame((f) => (f + 1) % SPINNER_FRAMES.length)
      }, 100)
      return () => clearInterval(timer)
    }
  }, [status])

  if (status === 'idle') return null

  let text = ''
  if (status === 'saving') {
    text = `${SPINNER_FRAMES[frame]}`
  } else if (status === 'saved') {
    text = '●'
  } else {
    text = '!'
  }

  const color = status === 'error' ? COLORS.danger : COLORS.accent

  return <text fg={color}>{text}</text>
}

interface ModeTabProps {
  fKey: string
  label: string
  isActive: boolean
  onPress: () => void
}

function ModeTab({ fKey, label, isActive, onPress }: ModeTabProps) {
  return (
    <box
      id={`mode-tab-${fKey.toLowerCase()}`}
      onMouseDown={onPress}
      style={{ flexDirection: 'row' }}
    >
      <box
        backgroundColor={isActive ? COLORS.accentBright : COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
      >
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
      <box
        backgroundColor={isActive ? COLORS.accent : COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
      >
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{label}</strong> : label}
        </text>
      </box>
    </box>
  )
}

interface NavBarProps {
  mode: ViewMode
  width: number
  projectName?: string
  saveStatus?: SaveStatus
  showCodePanel?: boolean
  showTimeline?: boolean
  onModeChange: (mode: ViewMode) => void
  onToggleCode?: () => void
  onPlayPress?: () => void
}

export function NavBar({
  mode,
  width,
  projectName,
  saveStatus,
  showCodePanel,
  showTimeline,
  onModeChange,
  onToggleCode,
  onPlayPress,
}: NavBarProps) {
  const currentViewMode = VIEW_MODE_BY_MODE[mode]

  return (
    <box
      id="app-header"
      backgroundColor={COLORS.bgAlt}
      style={{
        width,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: NAVBAR_HEIGHT,
        flexShrink: 0,
      }}
    >
      {/* Left: Mode tabs */}
      <box id="app-header-tabs" style={{ flexDirection: 'row', gap: 1 }}>
        {NAV_ITEMS.map((item) => {
          let isActive = false
          let onPress = () => {}

          // Determine if this item is a mode switch or a specialized toggle
          const modeCfg = VIEW_MODES.find((m) => m.bind === item.bind)

          if (modeCfg) {
            isActive = mode === modeCfg.mode
            onPress =
              item.bind === Bind.VIEW_PLAY
                ? () => onPlayPress?.()
                : () => onModeChange(modeCfg.mode)
          } else if (item.bind === Bind.TOGGLE_CODE) {
            isActive = !!showCodePanel && currentViewMode.supportsCodePanel
            onPress = () => onToggleCode?.()
          }

          return (
            <ModeTab
              key={item.bind}
              fKey={getShortcutLabel(item.bind)}
              label={item.label}
              isActive={isActive}
              onPress={onPress}
            />
          )
        })}
      </box>

      {/* Right: Save indicator + Project name in card */}
      <box
        id="app-header-project-container"
        style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}
      >
        {saveStatus && <SaveIndicator status={saveStatus} />}
        {projectName && (
          <box
            id="app-header-project"
            backgroundColor={COLORS.bg}
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg={COLORS.muted}>{projectName}</text>
          </box>
        )}
      </box>
    </box>
  )
}

// Legacy exports for backwards compatibility
export const ModeTabBar = NavBar
export const Footer = NavBar
