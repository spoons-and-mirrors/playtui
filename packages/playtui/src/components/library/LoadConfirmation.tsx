import { RGBA } from "@opentui/core"
import { COLORS } from "../../theme"
import type { ProjectMeta } from "../../lib/projectTypes"

interface LoadConfirmationProps {
  project: ProjectMeta
  onConfirm: () => void
  onCancel: () => void
  width: number
  height: number
}

export function LoadConfirmation({ project, onConfirm, onCancel, width, height }: LoadConfirmationProps) {
  const modalWidth = Math.min(50, width - 10)
  const modalHeight = Math.min(12, height - 6)

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width={width}
      height={height}
      alignItems="center"
      justifyContent="center"
      backgroundColor={RGBA.fromInts(0, 0, 0, 180)}
      zIndex={200}
      onMouseDown={onCancel}
    >
      <box
        width={modalWidth}
        height={modalHeight}
        border
        borderStyle="rounded"
        borderColor={COLORS.accent}
        title="Open Project"
        backgroundColor={COLORS.card}
        padding={1}
        flexDirection="column"
        gap={1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <box alignItems="center" flexGrow={1} justifyContent="center">
          <text>Open project</text>
          <text fg={COLORS.accent}><strong>"{project.name}"</strong></text>
          <text fg={COLORS.muted} marginTop={1}>Unsaved changes will be lost.</text>
        </box>

        <box flexDirection="row" gap={2} justifyContent="flex-end">
          <box
            onMouseDown={onCancel}
            style={{ backgroundColor: COLORS.muted, paddingLeft: 2, paddingRight: 2 }}
          >
            <text fg={COLORS.bg}>Cancel</text>
          </box>
          <box
            onMouseDown={onConfirm}
            style={{ backgroundColor: COLORS.success, paddingLeft: 2, paddingRight: 2 }}
          >
            <text fg={COLORS.bg}>Open</text>
          </box>
        </box>
      </box>
    </box>
  )
}
