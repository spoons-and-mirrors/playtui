import { useState } from "react"
import { COLORS } from "../../theme"
import type { ElementType } from "../../lib/types"

interface ElementOption {
  type: ElementType
  icon: string
  label: string
  shortcut: string
}

const ELEMENT_OPTIONS: ElementOption[] = [
  { type: "box", icon: "□", label: "Box", shortcut: "B" },
  { type: "text", icon: "T", label: "Text", shortcut: "T" },
  { type: "scrollbox", icon: "⊟", label: "Scroll", shortcut: "S" },
  { type: "input", icon: "▭", label: "Input", shortcut: "I" },
  { type: "textarea", icon: "▤", label: "Textarea", shortcut: "X" },
  { type: "select", icon: "▼", label: "Select", shortcut: "E" },
  { type: "slider", icon: "═", label: "Slider", shortcut: "L" },
  { type: "ascii-font", icon: "A", label: "ASCII", shortcut: "F" },
  { type: "tab-select", icon: "⊞", label: "Tabs", shortcut: "W" },
]

function ElementToolbarBtn({ option, onPress }: { option: ElementOption; onPress: () => void }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <box
      id={`add-${option.type}`}
      onMouseDown={onPress}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? COLORS.bgAlt : "transparent",
        paddingLeft: 1,
        paddingRight: 1,
        flexDirection: "row"
      }}
    >
      <text fg={hovered ? COLORS.accent : COLORS.text}>{option.icon}</text>
      {hovered && (
        <text fg={COLORS.muted} style={{ marginLeft: 1 }}>
          {option.label} [{option.shortcut}]
        </text>
      )}
    </box>
  )
}

export function ElementToolbar({ 
  expanded, 
  onToggle, 
  onAddElement 
}: { 
  expanded: boolean
  onToggle: () => void
  onAddElement: (type: ElementType) => void 
}) {
  return (
    <box id="element-toolbar" style={{ flexDirection: "row", gap: 0 }}>
      <box
        id="element-toggle"
        onMouseDown={onToggle}
        style={{
          backgroundColor: expanded ? COLORS.accent : COLORS.card,
          paddingLeft: 1,
          paddingRight: 1,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <text fg={expanded ? COLORS.bg : COLORS.accent}>＋</text>
        <text fg={expanded ? COLORS.bg : COLORS.text} style={{ marginLeft: 1 }}>Add</text>
      </box>
      {expanded && (
        <box style={{ flexDirection: "row", gap: 0, backgroundColor: COLORS.card, paddingLeft: 1 }}>
          {ELEMENT_OPTIONS.map((opt) => (
            <ElementToolbarBtn key={opt.type} option={opt} onPress={() => onAddElement(opt.type)} />
          ))}
        </box>
      )}
    </box>
  )
}
