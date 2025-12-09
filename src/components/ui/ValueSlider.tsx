import { useRef, useState } from "react"
import type { MouseEvent } from "@opentui/core"
import { COLORS } from "../../theme"

interface ValueSliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  resetTo?: number
}

/**
 * Draggable value slider component: shows label:value
 * - Click and drag to change value
 * - Double click to reset to default
 * - Uses accent text on bg color styling
 */
export function ValueSlider({ id, label, value, onChange, resetTo = 0 }: ValueSliderProps) {
  const [dragging, setDragging] = useState(false)
  const lastClickTime = useRef<number>(0)
  const dragStart = useRef<{ x: number; value: number } | null>(null)

  const handleValueMouseDown = (e: MouseEvent) => {
    const now = Date.now()
    // Double click detection
    if (now - lastClickTime.current < 300) {
      onChange(resetTo)
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now

    // Start drag
    dragStart.current = { x: e.x, value }
    setDragging(true)
  }

  const handleValueDrag = (e: MouseEvent) => {
    if (!dragStart.current) return
    const deltaX = e.x - dragStart.current.x
    const next = dragStart.current.value + deltaX
    if (next === value) return
    onChange(next)
  }

  const handleValueDragEnd = () => {
    dragStart.current = null
    setDragging(false)
  }

  return (
    <box
      id={`${id}-slider`}
      backgroundColor={COLORS.bg}
      paddingLeft={1}
      paddingRight={1}
      onMouseDown={handleValueMouseDown}
      onMouseDrag={handleValueDrag}
      onMouseDragEnd={handleValueDragEnd}
    >
      <text fg={dragging ? COLORS.accentBright : COLORS.accent} selectable={false}>
        <strong>{label.toLowerCase()}:{value}</strong>
      </text>
    </box>
  )
}
