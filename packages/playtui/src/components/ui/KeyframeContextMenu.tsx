import { COLORS } from "../../theme"

interface KeyframeContextMenuProps {
  x: number
  y: number
  hasKeyframeAtCurrent: boolean
  onAddKeyframe: () => void
  onRemoveKeyframe: () => void
  onClose: () => void
}

export function KeyframeContextMenu({
  x,
  y,
  hasKeyframeAtCurrent,
  onAddKeyframe,
  onRemoveKeyframe,
  onClose,
}: KeyframeContextMenuProps) {
  return (
    <box
      position="absolute"
      left={x}
      top={y}
      width={20}
      height={hasKeyframeAtCurrent ? 4 : 3}
      border
      borderStyle="single"
      borderColor={COLORS.border}
      backgroundColor={COLORS.bgAlt}
      zIndex={100}
      flexDirection="column"
      onMouseUp={(e) => {
        // Close if clicking outside (this is a bit tricky in TUI, often done via overlay)
        // For now, rely on specific actions closing it or clicking outside in parent
        e.stopPropagation()
      }}
    >
      <box
        height={1}
        paddingLeft={1}
        backgroundColor={hasKeyframeAtCurrent ? COLORS.bg : COLORS.accent}
        onMouseDown={(e) => {
          e.stopPropagation()
          onAddKeyframe()
          onClose()
        }}
      >
        <text fg={hasKeyframeAtCurrent ? COLORS.text : COLORS.bg}>
          {hasKeyframeAtCurrent ? "Update Keyframe" : "Add Keyframe"}
        </text>
      </box>
      
      {hasKeyframeAtCurrent && (
        <box
          height={1}
          paddingLeft={1}
          onMouseDown={(e) => {
            e.stopPropagation()
            onRemoveKeyframe()
            onClose()
          }}
        >
          <text fg={COLORS.danger}>Remove Keyframe</text>
        </box>
      )}
    </box>
  )
}
