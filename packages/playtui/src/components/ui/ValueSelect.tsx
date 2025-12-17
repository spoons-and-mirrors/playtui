import { useState } from "react"
import type { MouseEvent } from "@opentui/core"
import { COLORS } from "../../theme"

interface ValueSelectProps {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

// Card-style value selector: | ◂ | label:value | ▸ |
// Click arrows or drag on value to cycle through options
export function ValueSelect({ id, label, value, options, onChange }: ValueSelectProps) {
  const [pressing, setPressing] = useState<"prev" | "next" | null>(null)
  const [hovering, setHovering] = useState(false)

  const idx = options.indexOf(value)
  const safeIdx = idx === -1 ? 0 : idx

  const handlePrev = () => {
    const newIdx = (safeIdx - 1 + options.length) % options.length
    onChange(options[newIdx])
  }

  const handleNext = () => {
    const newIdx = (safeIdx + 1) % options.length
    onChange(options[newIdx])
  }

  const handleValueClick = (e: MouseEvent) => {
    e.stopPropagation()
    handleNext()
  }

  return (
    <box id={id} flexDirection="row" alignItems="center">
      <box
        id={`${id}-prev`}
        backgroundColor={pressing === "prev" ? COLORS.accent : COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => {
          setPressing("prev")
          handlePrev()
        }}
        onMouseUp={() => setPressing(null)}
        onMouseOut={() => setPressing(null)}
      >
        <text fg={pressing === "prev" ? COLORS.bg : COLORS.accent} selectable={false}>◂</text>
      </box>
      <box
        id={`${id}-value`}
        backgroundColor={hovering ? COLORS.accent : COLORS.muted}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        onMouseDown={handleValueClick}
        onMouseOver={() => setHovering(true)}
        onMouseOut={() => setHovering(false)}
      >
        <text fg={hovering ? COLORS.bg : COLORS.bg} selectable={false}>
          <strong>{label.toLowerCase()}:{value}</strong>
        </text>
      </box>
      <box
        id={`${id}-next`}
        backgroundColor={pressing === "next" ? COLORS.accent : COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={() => {
          setPressing("next")
          handleNext()
        }}
        onMouseUp={() => setPressing(null)}
        onMouseOut={() => setPressing(null)}
      >
        <text fg={pressing === "next" ? COLORS.bg : COLORS.accent} selectable={false}>▸</text>
      </box>
    </box>
  )
}
