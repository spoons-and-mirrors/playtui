import { useTerminalDimensions } from "@opentui/react"
import { COLORS } from "../../theme"

export type ViewMode = "editor" | "code" | "play" | "library" | "docs"

interface ModeTabProps {
  fKey: string
  label: string
  isActive: boolean
  compact: boolean
  onPress: () => void
}

function ModeTab({ fKey, label, isActive, compact, onPress }: ModeTabProps) {
  if (compact) {
    return (
      <box
        id={`mode-tab-${fKey.toLowerCase()}`}
        onMouseDown={onPress}
        backgroundColor={isActive ? COLORS.accentBright : COLORS.card}
        paddingLeft={1}
        paddingRight={1}
        marginRight={1}
      >
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
    )
  }

  return (
    <box
      id={`mode-tab-${fKey.toLowerCase()}`}
      onMouseDown={onPress}
      style={{ 
        flexDirection: "row", 
        marginRight: 1,
      }}
    >
      <box backgroundColor={isActive ? COLORS.accentBright : COLORS.card} paddingLeft={1} paddingRight={1}>
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
      <box backgroundColor={isActive ? COLORS.accent : COLORS.card} paddingLeft={1} paddingRight={1}>
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{label}</strong> : label}
        </text>
      </box>
    </box>
  )
}

interface FooterProps {
  mode: ViewMode
  width: number
  onModeChange: (mode: ViewMode) => void
}

// Full tabs content requires about 60-65 chars.
// Setting threshold to 75 to be safe and avoid edge-case wrapping.
const FULL_WIDTH_THRESHOLD = 75

export function Footer({ mode, width, onModeChange }: FooterProps) {
  // Use the passed width to decide compactness
  const compact = width < FULL_WIDTH_THRESHOLD

  return (
    <box
      id="footer"
      style={{
        flexDirection: "row",
        flexWrap: "no-wrap",
        justifyContent: "center",
        alignItems: "center",
        height: 1,
        flexShrink: 0,
        marginTop: 1,
      }}
    >
      <ModeTab fKey="F1" label="Editor" isActive={mode === "editor"} compact={compact} onPress={() => onModeChange("editor")} />
      <ModeTab fKey="F2" label="Play" isActive={mode === "play"} compact={compact} onPress={() => onModeChange("play")} />
      <ModeTab fKey="F3" label="Code" isActive={mode === "code"} compact={compact} onPress={() => onModeChange("code")} />
      <ModeTab fKey="F4" label="Library" isActive={mode === "library"} compact={compact} onPress={() => onModeChange("library")} />
      <ModeTab fKey="F5" label="Docs" isActive={mode === "docs"} compact={compact} onPress={() => onModeChange("docs")} />
    </box>
  )
}
