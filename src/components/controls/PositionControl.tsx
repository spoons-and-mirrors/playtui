import { COLORS } from "../../theme"
import { useState, useRef } from "react"
import type { MouseEvent } from "@opentui/core"

interface PositionControlProps {
  x?: number
  y?: number
  zIndex?: number
  onChange: (key: "x" | "y" | "zIndex", val: number | undefined) => void
}

// Value unit: | - | x:0 | + |
function ValueUnit({ label, value, onDecrement, onIncrement, onReset, onDragChange }: {
  label: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  onReset: () => void
  onDragChange: (delta: number) => void
}) {
  const [pressing, setPressing] = useState<"dec" | "inc" | null>(null)
  const [dragging, setDragging] = useState(false)
  const lastClickTime = useRef<number>(0)
  const dragStart = useRef<{ x: number; value: number } | null>(null)

  const handleValueMouseDown = (e: MouseEvent) => {
    // Check for double-click
    const now = Date.now()
    if (now - lastClickTime.current < 300) {
      onReset()
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now
    
    // Start drag tracking
    dragStart.current = { x: e.x, value }
    setDragging(true)
  }

  const handleValueDrag = (e: MouseEvent) => {
    if (!dragStart.current) return
    const deltaX = e.x - dragStart.current.x
    const newValue = dragStart.current.value + deltaX
    if (newValue !== value) {
      onDragChange(newValue)
    }
  }

  const handleValueDragEnd = () => {
    dragStart.current = null
    setDragging(false)
  }

  return (
    <box id={`pos-${label.toLowerCase()}`} flexDirection="row">
      <box
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => { setPressing("dec"); onDecrement() }}
        onMouseUp={() => setPressing(null)}
        onMouseOut={() => setPressing(null)}
      >
        <text fg={COLORS.accent} selectable={false}>-</text>
      </box>
      <box
        backgroundColor={pressing || dragging ? COLORS.accent : COLORS.muted}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        onMouseDown={handleValueMouseDown}
        onMouseDrag={handleValueDrag}
        onMouseDragEnd={handleValueDragEnd}
      >
        <text fg={COLORS.bg} selectable={false}><strong>{label.toLowerCase()}:{value}</strong></text>
      </box>
      <box
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => { setPressing("inc"); onIncrement() }}
        onMouseUp={() => setPressing(null)}
        onMouseOut={() => setPressing(null)}
      >
        <text fg={COLORS.accent} selectable={false}>+</text>
      </box>
    </box>
  )
}

export function PositionControl({ x = 0, y = 0, zIndex = 0, onChange }: PositionControlProps) {
  return (
    <box id="position-control" flexDirection="column" gap={1} marginTop={1}>
      {/* X/Y/Z Values - stacked vertically */}
      <ValueUnit
        label="X"
        value={x}
        onDecrement={() => onChange("x", x - 1)}
        onIncrement={() => onChange("x", x + 1)}
        onReset={() => onChange("x", 0)}
        onDragChange={(v) => onChange("x", v)}
      />
      <ValueUnit
        label="Y"
        value={y}
        onDecrement={() => onChange("y", y - 1)}
        onIncrement={() => onChange("y", y + 1)}
        onReset={() => onChange("y", 0)}
        onDragChange={(v) => onChange("y", v)}
      />
      <ValueUnit
        label="Z"
        value={zIndex}
        onDecrement={() => onChange("zIndex", zIndex - 1)}
        onIncrement={() => onChange("zIndex", zIndex + 1)}
        onReset={() => onChange("zIndex", 0)}
        onDragChange={(v) => onChange("zIndex", v)}
      />
    </box>
  )
}
