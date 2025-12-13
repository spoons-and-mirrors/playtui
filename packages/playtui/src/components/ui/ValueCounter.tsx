import { useRef, useState } from "react"
import type { MouseEvent } from "@opentui/core"
import { MouseButton } from "@opentui/core"
import { COLORS } from "../../theme"
import { useDragCapture } from "../pages/Properties"
import { useKeyframing } from "../contexts/KeyframingContext"
import { KeyframeContextMenu } from "./KeyframeContextMenu"

interface ValueCounterProps {
  id: string
  label: string
  property?: string // property name for keyframing
  value: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  resetTo?: number
}

// Generic value counter: | - | label:value | + |
// Shows warning color when property has keyframes
export function ValueCounter({ id, label, property, value, onChange, onChangeEnd, resetTo = 0 }: ValueCounterProps) {
  const [pressing, setPressing] = useState<"dec" | "inc" | null>(null)
  const [dragging, setDragging] = useState(false)
  const lastClickTime = useRef<number>(0)
  const dragStart = useRef<{ x: number; y: number; value: number } | null>(null)
  const registerDrag = useDragCapture()
  const keyframing = useKeyframing()
  const [showMenu, setShowMenu] = useState<{ x: number; y: number } | null>(null)

  // Check if this property is keyframed (has any keyframes)
  const isKeyframed = keyframing && keyframing.selectedId && property 
    ? keyframing.animatedProperties?.some(p => p.nodeId === keyframing.selectedId && p.property === property)
    : false

  // Check if there's a keyframe at the current frame
  const hasKeyframeAtCurrent = keyframing && keyframing.selectedId && property 
    ? keyframing.hasKeyframe(keyframing.selectedId, property, keyframing.currentFrame) 
    : false
  
  const step = 1

  const handleDec = () => {
    onChange(value - step)
    if (keyframing?.autoKeyEnabled && keyframing.selectedId && property && onChangeEnd) {
      onChangeEnd(value - step) 
    }
  }

  const handleInc = () => {
    onChange(value + step)
    if (keyframing?.autoKeyEnabled && keyframing.selectedId && property && onChangeEnd) {
      onChangeEnd(value + step)
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
    if (now - lastClickTime.current < 300) {
      onChange(resetTo)
      if (keyframing?.autoKeyEnabled && keyframing.selectedId && property && onChangeEnd) {
        onChangeEnd(resetTo)
      }
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now

    dragStart.current = { x: e.x, y: e.y, value }
    setDragging(true)
    
    const wrappedOnChangeEnd = (v: number) => {
      if (onChangeEnd) onChangeEnd(v)
    }

    if (registerDrag) {
      registerDrag(e.x, e.y, value, onChange, wrappedOnChangeEnd)
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
    if (dragStart.current && onChangeEnd) {
      onChangeEnd(value)
    }
    dragStart.current = null
    setDragging(false)
  }

  // Use warning color if property is keyframed
  const valueTextColor = isKeyframed ? COLORS.warning : COLORS.bg

  return (
    <box id={id} flexDirection="row" alignItems="center">
      <box
        id={`${id}-dec`}
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => {
          setPressing("dec")
          handleDec()
        }}
        onMouseUp={() => setPressing(null)}
        onMouseOut={() => setPressing(null)}
      >
        <text fg={COLORS.accent} selectable={false}>-</text>
      </box>
      <box
        id={`${id}-value`}
        backgroundColor={pressing || dragging ? COLORS.accent : COLORS.muted}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        onMouseDown={handleValueMouseDown}
        onMouseDrag={handleValueDrag}
        onMouseDragEnd={handleValueDragEnd}
      >
        <text fg={valueTextColor} selectable={false}>
          <strong>{label.toLowerCase()}:{value}</strong>
        </text>
      </box>
      <box
        id={`${id}-inc`}
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => {
          setPressing("inc")
          handleInc()
        }}
        onMouseUp={() => setPressing(null)}
        onMouseOut={() => setPressing(null)}
      >
        <text fg={COLORS.accent} selectable={false}>+</text>
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
    </box>
  )
}
