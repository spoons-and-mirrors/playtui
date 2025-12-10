import { COLORS } from "../../theme"

export type ViewMode = "editor" | "code" | "play" | "library" | "docs"

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
  onModeChange: (mode: ViewMode) => void
}

export function AppHeader({ mode, width, projectName, onModeChange }: AppHeaderProps) {
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

      {/* Right: Project name in card */}
      {projectName && (
        <box id="app-header-project" backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1}>
          <text fg={COLORS.muted}>{projectName}</text>
        </box>
      )}
    </box>
  )
}

// Legacy exports for backwards compatibility
export const ModeTabBar = AppHeader
export const Footer = AppHeader
