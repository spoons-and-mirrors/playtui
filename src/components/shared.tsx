import { useState, useRef, useEffect, useCallback } from "react"
import type { TextareaRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { COLORS, syntaxStyle } from "../theme"
import { log } from "../lib/logger"
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
  { key: "Tab", desc: "code" },
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

// ============================================
// CODE PANEL - Live bidirectional code editor
// ============================================

interface CodePanelProps {
  code: string
  error?: string | null
  onCodeChange: (newCode: string) => void
  onClose: () => void
}

export function CodePanel({ code, error, onCodeChange, onClose }: CodePanelProps) {
  const textareaRef = useRef<TextareaRenderable>(null)
  const codeRef = useRef(code)
  const initializedRef = useRef(false)

  log("CODE_PANEL_RENDER", { codeLength: code.length, codePreview: code.slice(0, 80), initialized: initializedRef.current })

  // Initialize textarea with code on mount (using timeout to wait for ref)
  useEffect(() => {
    log("CODE_PANEL_INIT_EFFECT", { initialized: initializedRef.current, hasRef: !!textareaRef.current, codeRefLen: codeRef.current.length })
    if (initializedRef.current) return
    const tryInit = () => {
      log("CODE_PANEL_TRY_INIT", { hasRef: !!textareaRef.current, codeRefLen: codeRef.current.length, codeRefPreview: codeRef.current.slice(0, 80) })
      if (textareaRef.current) {
        // Use codeRef.current which is always up-to-date
        textareaRef.current.setText(codeRef.current, { history: false })
        initializedRef.current = true
        log("CODE_PANEL_INIT_DONE", { setText: codeRef.current.slice(0, 80) })
      } else {
        // Ref not ready, try again next frame
        requestAnimationFrame(tryInit)
      }
    }
    tryInit()
  }, [])

  // Keep codeRef in sync with prop
  useEffect(() => {
    log("CODE_PANEL_SYNC_REF", { oldLen: codeRef.current.length, newLen: code.length })
    codeRef.current = code
  }, [code])

  // Sync textarea with code prop when it changes externally (after init)
  useEffect(() => {
    if (!initializedRef.current || !textareaRef.current) return
    const currentText = textareaRef.current.plainText
    // Only update if code changed externally (not from our own edits)
    if (code !== currentText) {
      textareaRef.current.setText(code, { history: false })
    }
  }, [code])

  // Handle content changes from textarea - sync back to tree
  const handleContentChange = useCallback(() => {
    const newCode = textareaRef.current?.plainText
    // Only sync if actually different from current code ref (avoids echo)
    if (newCode !== undefined && newCode !== codeRef.current) {
      codeRef.current = newCode
      onCodeChange(newCode)
    }
  }, [onCodeChange])

  // Copy code to clipboard using system clipboard tools
  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCallback(() => {
    const proc = Bun.spawn(["xclip", "-selection", "clipboard"], {
      stdin: "pipe",
    })
    proc.stdin.write(code)
    proc.stdin.end()
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }, [code])

  return (
    <box id="code-panel" style={{ flexGrow: 1, flexDirection: "column", backgroundColor: COLORS.bg }}>
      <box id="code-panel-header" style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 1 }}>
        <box style={{ flexDirection: "row" }}>
          <text fg={error ? COLORS.danger : COLORS.accent}>
            {error ? `Error: ${error}` : "Code Editor"}
          </text>
          <text fg={COLORS.muted}> | </text>
          <box onMouseDown={copyToClipboard} backgroundColor={copied ? COLORS.success : COLORS.card} style={{ paddingLeft: 1, paddingRight: 1 }}>
            <text fg={copied ? COLORS.bg : COLORS.accent}>{copied ? "✓ Copied" : "⎘ Copy"}</text>
          </box>
        </box>
        <text fg={COLORS.muted}>Esc to close</text>
      </box>
      <scrollbox id="code-scroll" style={{ flexGrow: 1, backgroundColor: COLORS.card }}>
        <textarea
          ref={textareaRef}
          placeholder="Paste or edit JSX code here..."
          focused
          textColor={COLORS.text}
          backgroundColor={COLORS.card}
          focusedBackgroundColor={COLORS.card}
          cursorColor={COLORS.accent}
          style={{ width: "100%" }}
          onContentChange={handleContentChange}
          onKeyDown={(key) => {
            if (key.name === "tab" || key.name === "escape") {
              key.preventDefault()
              onClose()
            }
          }}
        />
      </scrollbox>
      <box style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 1 }}>
        <text fg={COLORS.muted}>Edit code to update canvas live</text>
        {error && <text fg={COLORS.danger}>Parse error - fix to apply</text>}
      </box>
    </box>
  )
}
