import { useState, useEffect } from 'react'
import { COLORS } from '../../theme'
import type { SaveStatus } from '../../hooks/useProject'
import type { ViewMode } from '../../lib/viewState'
import { VIEW_MODES } from '../../lib/viewState'
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
  const editorViewMode = VIEW_MODES.find(
    (viewMode) => viewMode.mode === 'editor',
  )!
  const playViewMode = VIEW_MODES.find((viewMode) => viewMode.mode === 'play')!
  const libraryViewMode = VIEW_MODES.find(
    (viewMode) => viewMode.mode === 'library',
  )!
  const docsViewMode = VIEW_MODES.find((viewMode) => viewMode.mode === 'docs')!
  const currentViewMode = VIEW_MODES.find((viewMode) => viewMode.mode === mode)!

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
        <ModeTab
          fKey={getShortcutLabel(editorViewMode.bind)}
          label={editorViewMode.label}
          isActive={mode === editorViewMode.mode}
          onPress={() => onModeChange(editorViewMode.mode)}
        />
        <ModeTab
          fKey={getShortcutLabel(playViewMode.bind)}
          label={playViewMode.label}
          isActive={mode === playViewMode.mode}
          onPress={() => onPlayPress?.()}
        />
        <ModeTab
          fKey={getShortcutLabel(Bind.TOGGLE_CODE)}
          label="Code"
          isActive={!!showCodePanel && currentViewMode.supportsCodePanel}
          onPress={() => onToggleCode?.()}
        />
        <ModeTab
          fKey={getShortcutLabel(libraryViewMode.bind)}
          label={libraryViewMode.label}
          isActive={mode === libraryViewMode.mode}
          onPress={() => onModeChange(libraryViewMode.mode)}
        />
        <ModeTab
          fKey={getShortcutLabel(docsViewMode.bind)}
          label={docsViewMode.label}
          isActive={mode === docsViewMode.mode}
          onPress={() => onModeChange(docsViewMode.mode)}
        />
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
