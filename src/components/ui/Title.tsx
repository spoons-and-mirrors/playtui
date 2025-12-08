import { RGBA } from "@opentui/core"
import { COLORS } from "../../theme"
import type { SaveStatus } from "../../hooks/useProject"

// ============================================================================
// Save Indicator
// ============================================================================

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return <text> </text>

  const text = status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Error saving"
  const color = status === "error" ? COLORS.danger : COLORS.muted

  return <text fg={color}>{text}</text>
}

// ============================================================================
// Title (Main Export)
// ============================================================================

interface TitleProps {
  saveStatus: SaveStatus
  onLogoClick: () => void
}

export function Title({ saveStatus, onLogoClick }: TitleProps) {
  return (
    <box
      id="title"
      style={{ alignItems: "center", marginBottom: 1, flexDirection: "column" }}
      onMouseDown={onLogoClick}
    >
      <ascii-font text="PLAYTUI" font="tiny" color={RGBA.fromHex("#4da8da")} />
      <box style={{ width: 25, height: 1, flexDirection: "row", justifyContent: "space-between" }}>
        <SaveIndicator status={saveStatus} />
        <text fg="#d8dce5">
          <strong>opentui builder</strong>
        </text>
      </box>
      <box
        border={["bottom"]}
        borderStyle="single"
        borderColor="#2a3545"
        style={{ width: 25, height: 0, flexDirection: "column" }}
      />
    </box>
  )
}
