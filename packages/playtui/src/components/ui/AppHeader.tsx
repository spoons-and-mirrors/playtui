import { useState, useEffect } from "react"
import { COLORS } from "../../theme"
import type { SaveStatus } from "../../hooks/useProject"

export type ViewMode = "editor" | "code" | "play" | "library" | "docs"

// ============================================================================
// Save Indicator
// ============================================================================

const SPINNER_FRAMES = ["◐", "◓", "◑", "◒"]

function SaveIndicator({ status }: { status: SaveStatus }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (status === "saving") {
      const timer = setInterval(() => {
        setFrame((f) => (f + 1) % SPINNER_FRAMES.length)
      }, 100)
      return () => clearInterval(timer)
    }
  }, [status])

  if (status === "idle") return null

  let text = ""
  if (status === "saving") {
    text = `${SPINNER_FRAMES[frame]}`
  } else if (status === "saved") {
    text = "●"
  } else {
    text = "!"
  }

  const color = status === "error" ? COLORS.danger : COLORS.accent

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
      style={{ flexDirection: "row" }}
    >
      <box backgroundColor={isActive ? COLORS.accentBright : COLORS.bg} paddingLeft={1} paddingRight={1}>
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
      <box backgroundColor={isActive ? COLORS.accent : COLORS.bg} paddingLeft={1} paddingRight={1}>
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{label}</strong> : label}
        </text>
      </box>
    </box>
  )
}

interface DualModeTabProps {
  fKey: string
  label1: string
  label2: string
  activeMode: "editor" | "play" | null
  onPressLabel1: () => void
  onPressLabel2: () => void
}

function DualModeTab({ fKey, label1, label2, activeMode, onPressLabel1, onPressLabel2 }: DualModeTabProps) {
  const isLabel1Active = activeMode === "editor"
  const isLabel2Active = activeMode === "play"
  const isAnyActive = isLabel1Active || isLabel2Active
  
  return (
    <box id="mode-tab-dual" style={{ flexDirection: "row" }}>
      <box backgroundColor={isAnyActive ? COLORS.accentBright : COLORS.bg} paddingLeft={1} paddingRight={1}>
        <text fg={isAnyActive ? COLORS.bg : COLORS.muted}>
          {isAnyActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
      <box 
        id="mode-tab-dual-label1"
        backgroundColor={isLabel1Active ? COLORS.accent : COLORS.bg} 
        paddingLeft={1} 
        paddingRight={1}
        onMouseDown={onPressLabel1}
      >
        <text fg={isLabel1Active ? COLORS.bg : COLORS.muted}>
          {isLabel1Active ? <strong>{label1}</strong> : label1}
        </text>
      </box>
      <box 
        id="mode-tab-dual-label2"
        backgroundColor={isLabel2Active ? COLORS.accent : COLORS.bg} 
        paddingLeft={1} 
        paddingRight={1}
        onMouseDown={onPressLabel2}
      >
        <text fg={isLabel2Active ? COLORS.bg : COLORS.muted}>
          {isLabel2Active ? <strong>{label2}</strong> : label2}
        </text>
      </box>
    </box>
  )
}

interface AppHeaderProps {
  mode: ViewMode
  width: number
  projectName?: string
  saveStatus?: SaveStatus
  onModeChange: (mode: ViewMode) => void
}

export function AppHeader({ mode, width, projectName, saveStatus, onModeChange }: AppHeaderProps) {
  return (
    <box
      id="app-header"
      backgroundColor={COLORS.bgAlt}
      style={{
        width,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 1,
        flexShrink: 0,
        paddingLeft: 1,
      }}
    >
      {/* Left: Mode tabs */}
      <box id="app-header-tabs" style={{ flexDirection: "row", gap: 1 }}>
        <DualModeTab 
          fKey="F1" 
          label1="Edit" 
          label2="Play" 
          activeMode={mode === "editor" ? "editor" : mode === "play" ? "play" : null}
          onPressLabel1={() => onModeChange("editor")} 
          onPressLabel2={() => onModeChange("play")} 
        />
        <ModeTab fKey="F2" label="Code" isActive={mode === "code"} onPress={() => onModeChange("code")} />
        <ModeTab fKey="F3" label="Library" isActive={mode === "library"} onPress={() => onModeChange("library")} />
        <ModeTab fKey="F4" label="Docs" isActive={mode === "docs"} onPress={() => onModeChange("docs")} />
      </box>

      {/* Right: Save indicator + Project name in card */}
      <box id="app-header-project-container" style={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
        {saveStatus && <SaveIndicator status={saveStatus} />}
        {projectName && (
          <box id="app-header-project" backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1}>
            <text fg={COLORS.muted}>{projectName}</text>
          </box>
        )}
      </box>
    </box>
  )
}

// Legacy exports for backwards compatibility
export const ModeTabBar = AppHeader
export const Footer = AppHeader
