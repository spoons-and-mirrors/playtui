import { COLORS } from "../../theme"

export type ViewMode = "editor" | "code" | "docs"

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
      style={{ flexDirection: "row", marginRight: 2 }}
    >
      <box
        style={{
          backgroundColor: isActive ? COLORS.accent : COLORS.card,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{fKey}</strong> : fKey}
        </text>
      </box>
      <box
        style={{
          backgroundColor: isActive ? COLORS.accentBright : COLORS.bgAlt,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <text fg={isActive ? COLORS.bg : COLORS.muted}>
          {isActive ? <strong>{label}</strong> : label}
        </text>
      </box>
    </box>
  )
}

interface FooterProps {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
}

export function Footer({ mode, onModeChange }: FooterProps) {
  return (
    <box
      id="footer"
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 1,
        flexShrink: 0,
      }}
    >
      <ModeTab fKey="F1" label="Editor" isActive={mode === "editor"} onPress={() => onModeChange("editor")} />
      <ModeTab fKey="F2" label="Code" isActive={mode === "code"} onPress={() => onModeChange("code")} />
      <ModeTab fKey="F3" label="—" isActive={false} onPress={() => {}} />
      <ModeTab fKey="F4" label="Docs" isActive={mode === "docs"} onPress={() => onModeChange("docs")} />
    </box>
  )
}
