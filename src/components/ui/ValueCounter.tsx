import { useRef, useState } from "react"
import type { MouseEvent } from "@opentui/core"
import { COLORS } from "../../theme"

interface ValueCounterProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  resetTo?: number
}

// Generic value counter: | - | label:value | + |
export function ValueCounter({ id, label, value, onChange, onChangeEnd, resetTo = 0 }: ValueCounterProps) {
  const [pressing, setPressing] = useState<"dec" | "inc" | null>(null)
  const [dragging, setDragging] = useState(false)
  const lastClickTime = useRef<number>(0)
  const dragStart = useRef<{ x: number; value: number } | null>(null)

  const step = 1

  const handleDec = () => {
    onChange(value - step)
  }

  const handleInc = () => {
    onChange(value + step)
  }

  const handleValueMouseDown = (e: MouseEvent) => {
    const now = Date.now()
    if (now - lastClickTime.current < 300) {
      onChange(resetTo)
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now

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
    if (dragStart.current && onChangeEnd) {
      onChangeEnd(value)
    }
    dragStart.current = null
    setDragging(false)
  }

  return (
    <box id={id} flexDirection="row">
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
        <text fg={ COLORS.accent } selectable={false}>-</text>
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
        <text fg={COLORS.bg} selectable={false}>
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
        <text fg={ COLORS.accent } selectable={false}>+</text>
      </box>
    </box>
  )
}
