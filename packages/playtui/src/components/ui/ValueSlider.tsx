import { useRef, useState } from "react"
import type { MouseEvent } from "@opentui/core"
import { MouseButton } from "@opentui/core"
import { COLORS } from "../../theme"
import { useDragCapture } from "../pages/Properties"
import { useKeyframing } from "../contexts/KeyframingContext"
import { KeyframeContextMenu } from "./KeyframeContextMenu"

interface ValueSliderProps {
  id: string
  label: string
  property?: string // property name for keyframing
  value: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  resetTo?: number
}

/**
 * Draggable value slider component: shows label:value
 * - Click and drag to change value
 * - Double click to reset to default
 * - Uses accent text on bg color styling
 * - Shows warning color when property has keyframes
 * - Auto-keyframes when property is already keyframed (always on)
 */
export function ValueSlider({ id, label, property, value, onChange, onChangeEnd, resetTo = 0 }: ValueSliderProps) {
  const [dragging, setDragging] = useState(false)
  const lastClickTime = useRef<number>(0)
  const dragStart = useRef<{ x: number; y: number; value: number } | null>(null)
  const registerDrag = useDragCapture()
  const keyframing = useKeyframing()
  const [showMenu, setShowMenu] = useState<{ x: number; y: number } | null>(null)

  // Check if this property is keyframed (has any keyframes, not just at current frame)
  const isKeyframed = keyframing && keyframing.selectedId && property 
    ? keyframing.animatedProperties?.some(p => p.nodeId === keyframing.selectedId && p.property === property)
    : false

  // Check if there's a keyframe at the current frame
  const hasKeyframeAtCurrent = keyframing && keyframing.selectedId && property 
    ? keyframing.hasKeyframe(keyframing.selectedId, property, keyframing.currentFrame) 
    : false

  // Auto-keyframe: when property is keyframed and value changes, add/update keyframe
  const handleAutoKeyframe = (newValue: number) => {
    if (isKeyframed && keyframing && keyframing.selectedId && property) {
      keyframing.addKeyframe(keyframing.selectedId, property, newValue)
    }
  }

  const handleValueMouseDown = (e: MouseEvent) => {
    // Right click -> Context menu
    if (e.button === MouseButton.RIGHT && keyframing && property) {
      e.stopPropagation()
      setShowMenu({ x: e.x, y: e.y })
      return
    }

    const now = Date.now()
    // Double click detection
    if (now - lastClickTime.current < 300) {
      onChange(resetTo)
      if (onChangeEnd) onChangeEnd(resetTo)
      handleAutoKeyframe(resetTo)
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now

    // Start drag
    dragStart.current = { x: e.x, y: e.y, value }
    setDragging(true)
    if (registerDrag) {
      registerDrag(e.x, e.y, value, onChange, (v) => {
        if (onChangeEnd) onChangeEnd(v)
        handleAutoKeyframe(v)
      })
    }
  }

  const handleValueDrag = (e: MouseEvent) => {
    if (!dragStart.current) return
    const deltaX = e.x - dragStart.current.x
    const deltaY = dragStart.current.y - e.y
    const next = dragStart.current.value + deltaX + deltaY
    if (next === value) return
    onChange(next)
  }

  const handleValueDragEnd = () => {
    if (dragStart.current) {
      if (onChangeEnd) onChangeEnd(value)
      handleAutoKeyframe(value)
    }
    dragStart.current = null
    setDragging(false)
  }

  const isZero = value === 0
  // Use warning color if property is keyframed, otherwise normal colors
  const textColor = dragging 
    ? COLORS.accentBright 
    : isKeyframed 
      ? COLORS.warning 
      : (isZero ? COLORS.muted : COLORS.accent)

  return (
    <>
      <box
        id={`${id}-slider`}
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        alignItems="center"
        onMouseDown={handleValueMouseDown}
        onMouseDrag={handleValueDrag}
        onMouseDragEnd={handleValueDragEnd}
      >
        <text fg={textColor} selectable={false}>
          <strong>{label.toLowerCase()}:{value}</strong>
        </text>
      </box>
      {showMenu && keyframing && keyframing.selectedId && property && (
        <KeyframeContextMenu
          x={showMenu.x}
          y={showMenu.y}
          hasKeyframeAtCurrent={hasKeyframeAtCurrent || false}
          onAddKeyframe={() => {
            if (keyframing.selectedId && property) {
              keyframing.addKeyframe(keyframing.selectedId, property, value)
            }
          }}
          onRemoveKeyframe={() => {
            if (keyframing.selectedId && property) {
              keyframing.removeKeyframe(keyframing.selectedId, property)
            }
          }}
          onClose={() => setShowMenu(null)}
        />
      )}
    </>
  )
}
