import { useState, useEffect, useRef } from "react"
import { COLORS } from "../../theme"
import type { SaveStatus } from "../../hooks/useProject"
import { Flipbook } from "@playtui/flipbook"
import { animation as f1ToggleAnim } from "../animations/f1-toggle"

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
  isAnimating?: boolean
}

function DualModeTab({ fKey, label1, label2, activeMode, onPressLabel1, onPressLabel2, isAnimating }: DualModeTabProps) {
  if (isAnimating) {
    return <Flipbook animation={f1ToggleAnim} />
  }

  const isLabel1Active = activeMode === "editor"
  const isLabel2Active = activeMode === "play"
  const isAnyActive = isLabel1Active || isLabel2Active
  
  // Swap order: if Play is active, show [F1 Play Edit], else show [F1 Edit Play]
  const firstLabel = isLabel2Active ? label2 : label1
  const secondLabel = isLabel2Active ? label1 : label2
  const firstIsActive = isLabel2Active ? isLabel2Active : isLabel1Active
  const secondIsActive = isLabel2Active ? isLabel1Active : isLabel2Active
  const firstOnPress = isLabel2Active ? onPressLabel2 : onPressLabel1
  const secondOnPress = isLabel2Active ? onPressLabel1 : onPressLabel2
  
  return (
    <box id="mode-tab-dual" style={{ flexDirection: "row" }}>
      <box backgroundColor={isAnyActive ? COLORS.accentBright : COLORS.bg} paddingLeft={1} paddingRight={1}>
        <text fg={isAnyActive ? COLORS.bg : COLORS.muted}>
          {isAnyActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
      <box 
        id="mode-tab-dual-label-first"
        backgroundColor={firstIsActive ? COLORS.accent : COLORS.bg} 
        paddingLeft={1} 
        paddingRight={1}
        onMouseDown={firstOnPress}
      >
        <text fg={firstIsActive ? COLORS.bg : COLORS.muted}>
          {firstIsActive ? <strong>{firstLabel}</strong> : firstLabel}
        </text>
      </box>
      <box 
        id="mode-tab-dual-label-second"
        backgroundColor={secondIsActive ? COLORS.accent : COLORS.bg} 
        paddingLeft={1} 
        paddingRight={1}
        onMouseDown={secondOnPress}
      >
        <text fg={secondIsActive ? COLORS.bg : COLORS.muted}>
          {secondIsActive ? <strong>{secondLabel}</strong> : secondLabel}
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
  const [isAnimating, setIsAnimating] = useState(false)
  const prevModeRef = useRef<ViewMode>(mode)

  useEffect(() => {
    const prevMode = prevModeRef.current
    // Trigger animation when switching between editor and play
    if ((prevMode === "editor" && mode === "play") || (prevMode === "play" && mode === "editor")) {
      setIsAnimating(true)
      const duration = (f1ToggleAnim.frames.length / f1ToggleAnim.fps) * 1000
      const timer = setTimeout(() => setIsAnimating(false), duration)
      prevModeRef.current = mode
      return () => clearTimeout(timer)
    }
    prevModeRef.current = mode
  }, [mode])

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
          isAnimating={isAnimating}
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
