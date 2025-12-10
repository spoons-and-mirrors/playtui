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
        <ModeTab fKey="F1" label="Editor" isActive={mode === "editor"} onPress={() => onModeChange("editor")} />
        <ModeTab fKey="F2" label="Play" isActive={mode === "play"} onPress={() => onModeChange("play")} />
        <ModeTab fKey="F3" label="Code" isActive={mode === "code"} onPress={() => onModeChange("code")} />
        <ModeTab fKey="F4" label="Library" isActive={mode === "library"} onPress={() => onModeChange("library")} />
        <ModeTab fKey="F5" label="Docs" isActive={mode === "docs"} onPress={() => onModeChange("docs")} />
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
