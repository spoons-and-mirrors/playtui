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
      height={hasKeyframeAtCurrent ? 3 : 3}
      border
      borderStyle="single"
      borderColor={COLORS.border}
      backgroundColor={COLORS.bgAlt}
      zIndex={100}
      flexDirection="column"
      onMouseUp={(e) => {
        e.stopPropagation()
      }}
    >
      {!hasKeyframeAtCurrent && (
        <box
          height={1}
          paddingLeft={1}
          backgroundColor={COLORS.accent}
          onMouseDown={(e) => {
            e.stopPropagation()
            onAddKeyframe()
            onClose()
          }}
        >
          <text fg={COLORS.bg}>Add Keyframe</text>
        </box>
      )}
      
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
