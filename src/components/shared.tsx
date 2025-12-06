import { useState } from "react"
import { RGBA } from "@opentui/core"
import { COLORS } from "../theme"
import type { ElementType } from "../lib/types"

export function ActionBtn({ id, label, color, enabled, onPress }: {
  id: string; label: string; color: string; enabled: boolean; onPress: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const bg = enabled ? (hovered ? COLORS.accentBright : color) : COLORS.muted
  return (
    <box id={id} onMouseDown={enabled ? onPress : undefined}
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{ backgroundColor: bg, paddingLeft: 1, paddingRight: 1 }}>
      <text fg={COLORS.bg}>{label}</text>
    </box>
  )
}

// ============================================
// QUICK ACTIONS TOOLBAR - Figma-like bar
// ============================================

interface QuickAction {
  id: string
  icon: string
  label: string
  shortcut?: string
  enabled: boolean
  active?: boolean
  onPress: () => void
}

export function QuickActionsToolbar({ actions }: { actions: QuickAction[] }) {
  return (
    <box id="quick-actions" style={{ 
      flexDirection: "row", 
      gap: 0, 
      backgroundColor: COLORS.card,
      paddingLeft: 1, 
      paddingRight: 1 
    }}>
      {actions.map((action, idx) => (
        <QuickActionBtn key={action.id} action={action} showDivider={idx > 0 && idx % 3 === 0} />
      ))}
    </box>
  )
}

function QuickActionBtn({ action, showDivider }: { action: QuickAction; showDivider?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const bg = action.active ? COLORS.accent : (hovered && action.enabled ? COLORS.bgAlt : "transparent")
  const fg = !action.enabled ? COLORS.muted : action.active ? COLORS.bg : COLORS.text

  return (
    <box style={{ flexDirection: "row" }}>
      {showDivider && (
        <text fg={COLORS.border} style={{ paddingLeft: 1, paddingRight: 1 }}>│</text>
      )}
      <box
        id={`qa-${action.id}`}
        onMouseDown={action.enabled ? action.onPress : undefined}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        style={{
          backgroundColor: bg,
          paddingLeft: 1,
          paddingRight: 1,
          flexDirection: "row",
          gap: 0
        }}
      >
        <text fg={fg}>{action.icon}</text>
        {hovered && action.enabled && (
          <text fg={COLORS.muted} style={{ marginLeft: 1 }}>
            {action.label}{action.shortcut ? ` [${action.shortcut}]` : ""}
          </text>
        )}
      </box>
    </box>
  )
}

// ============================================
// ELEMENT TOOLBAR - Add elements quickly
// ============================================

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

const MAIN_SHORTCUTS = [
  { key: "A", desc: "add" },
  { key: "D", desc: "dup" },
  { key: "Del", desc: "del" },
  { key: "C/V", desc: "copy/paste" },
  { key: "↑↓", desc: "nav" },
  { key: "Z/Y", desc: "undo/redo" },
  { key: "O", desc: "code" },
  { key: "^Q", desc: "quit" },
]

const ADD_SHORTCUTS = [
  { key: "B", desc: "box" },
  { key: "T", desc: "text" },
  { key: "S", desc: "scrollbox" },
  { key: "I", desc: "input" },
  { key: "X", desc: "textarea" },
  { key: "E", desc: "select" },
  { key: "L", desc: "slider" },
  { key: "F", desc: "ascii" },
  { key: "W", desc: "tabs" },
  { key: "A/Esc", desc: "exit" },
]

export function Footer({ addMode }: { addMode?: boolean }) {
  const shortcuts = addMode ? ADD_SHORTCUTS : MAIN_SHORTCUTS

  return (
    <box id="footer" border={["top"]} borderColor={addMode ? COLORS.accent : COLORS.border}
      style={{ flexDirection: "row", justifyContent: "center", gap: 2, paddingTop: 1 }}>
      {addMode && (
        <box style={{ backgroundColor: COLORS.accent, paddingLeft: 1, paddingRight: 1 }}>
          <text fg={COLORS.bg}>ADD</text>
        </box>
      )}
      {shortcuts.map(({ key, desc }) => (
        <text key={key} fg={COLORS.muted}>
          <span fg={COLORS.accent}>{key}</span> {desc}
        </text>
      ))}
    </box>
  )
}

export function CodePanel({ code }: { code: string }) {
  return (
    <box id="code-panel" position="absolute" left={0} top={0}
      style={{ width: "100%", height: "100%", backgroundColor: RGBA.fromInts(0, 0, 0, 200), padding: 2 }}>
      <box id="code-panel-inner" border borderStyle="rounded" borderColor={COLORS.accent}
        title="Generated JSX (O or Esc to close)" style={{ flexGrow: 1, backgroundColor: COLORS.card, padding: 1 }}>
        <scrollbox id="code-scroll" style={{ flexGrow: 1, contentOptions: { flexDirection: "column" } }}>
          <text fg={COLORS.text} wrapMode="word">{code}</text>
        </scrollbox>
      </box>
    </box>
  )
}
