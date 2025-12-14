import { useState, useRef } from "react"
import { COLORS } from "../../theme"
import type { ElementType, ElementNode } from "../../lib/types"
import { ELEMENT_REGISTRY } from "../elements"

// ============================================================================
// Types
// ============================================================================
// Test Animation Data (exported from Play tab)
// ============================================================================



// ============================================================================
// Types
// ============================================================================

export type MenuAction = "new" | "load" | "delete" | "saveAs"

interface HeaderProps {
  addMode: boolean
  onFileAction: (action: MenuAction) => void
  onToggleAddMode: () => void
  onAddElement: (type: ElementType) => void
  // Selected node for type/name display
  selectedNode?: ElementNode | null
  onUpdateNode?: (updates: Partial<ElementNode>) => void
  focusedField?: string | null
  setFocusedField?: (field: string | null) => void
}

// ============================================================================
// Element Options
// ============================================================================

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

// ============================================================================
// Project Menu
// ============================================================================

const FILE_MENU_ITEMS: { id: MenuAction; label: string }[] = [
  { id: "new", label: "New" },
  { id: "load", label: "Open" },
  { id: "saveAs", label: "Save As" },
  { id: "delete", label: "Delete" },
]

function FileMenu({ onAction }: { onAction: (action: MenuAction) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleSelect = (action: MenuAction) => {
    setIsOpen(false)
    onAction(action)
  }

  return (
    <box id="file-menu" style={{ flexDirection: "row", alignItems: "center" }}>
      <box
        id="file-menu-btn"
        onMouseDown={() => setIsOpen(!isOpen)}
        onMouseOver={() => setHoveredItem("file-btn")}
        onMouseOut={() => setHoveredItem(null)}
        style={{
          backgroundColor: isOpen || hoveredItem === "file-btn" ? COLORS.cardHover : COLORS.card,
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
         <text id="file-menu-label" fg={COLORS.accent}>
           {isOpen ? <strong>Project ▸</strong> : "Project ▸"}
         </text>
       </box>

      {isOpen && (
        <box id="file-menu-inline" style={{ flexDirection: "row", marginLeft: 1 }}>
          {FILE_MENU_ITEMS.map((item) => {
            const isHovered = hoveredItem === item.id
            const isDelete = item.id === "delete"

            return (
              <box
                key={item.id}
                id={`file-menu-${item.id}`}
                onMouseDown={() => handleSelect(item.id)}
                onMouseOver={() => setHoveredItem(item.id)}
                onMouseOut={() => setHoveredItem(null)}
                border={["left"]}
                borderStyle="heavy"
                borderColor={isDelete ? COLORS.danger : item.id === "saveAs" ? COLORS.success : COLORS.accentBright}
                style={{
                  flexDirection: "row",
                  backgroundColor: COLORS.cardHover,
                  paddingLeft: 1,
                  paddingRight: 1,
                  marginLeft: 1,
                }}
              >
                <text id={`file-menu-label-${item.id}`} fg={isDelete ? COLORS.danger : item.id === "saveAs" ? COLORS.success : COLORS.text}>
                  {isHovered ? <strong>{item.label}</strong> : item.label}
                </text>
              </box>
            )
          })}
        </box>
      )}
    </box>
  )
}




// ============================================================================
// Element Toolbar
// ============================================================================

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
        flexDirection: "row",
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

function ElementToolbar({
  expanded,
  onToggle,
  onAddElement,
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
          alignItems: "center",
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

// ============================================================================
// Header (Main Export)
// ============================================================================

export function Header({
  addMode,
  onFileAction,
  onToggleAddMode,
  onAddElement,
  selectedNode,
  onUpdateNode,
  focusedField,
  setFocusedField,
}: HeaderProps) {
  const lastNameClickRef = useRef<number>(0)

  return (
    <box id="header" style={{ flexDirection: "column", gap: 0, flexShrink: 0, paddingLeft: 2, paddingRight: 2 }}>
      {/* Row 1: File menu (left) + Animation (center) + Type/Name boxes (right) */}
      <box style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
        <FileMenu onAction={onFileAction} />
        {/*<AnimationPlayer data={TEST_ANIMATION} /> */}
        {selectedNode && onUpdateNode && setFocusedField && (
          <box id="element-type-name" style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
            {/* Type badge - click to toggle visibility */}
            <box 
              id="element-type" 
              style={{ backgroundColor: selectedNode.visible !== false ? COLORS.accent : COLORS.bg, paddingLeft: 1, paddingRight: 1 }}
              onMouseDown={() => onUpdateNode({ visible: !selectedNode.visible } as Partial<ElementNode>)}
            >
              <text fg={selectedNode.visible !== false ? COLORS.bg : COLORS.muted}><strong>{selectedNode.type}</strong></text>
            </box>
            
            {/* Name - inline with type */}
            <box id="element-name" onMouseDown={(e) => e.stopPropagation()}>
              {focusedField === "name" ? (
                <box style={{ backgroundColor: COLORS.bg, paddingLeft: 1, paddingRight: 1 }}>
                  <input
                    id="name-input"
                    value={selectedNode.name || ""}
                    focused
                    width={(selectedNode.name?.length || 0) + 2}
                    height={1}
                    backgroundColor={COLORS.bg}
                    textColor={COLORS.text}
                    onInput={(v) => onUpdateNode({ name: v } as Partial<ElementNode>)}
                    onSubmit={() => setFocusedField(null)}
                  />
                </box>
              ) : (
                <box
                  id="name-display"
                  style={{ backgroundColor: COLORS.bg, paddingLeft: 1, paddingRight: 1 }}
                  onMouseDown={() => {
                    const now = Date.now()
                    if (now - lastNameClickRef.current < 400) {
                      setFocusedField("name")
                    }
                    lastNameClickRef.current = now
                  }}
                >
                  <text fg={selectedNode.name && selectedNode.name !== ELEMENT_REGISTRY[selectedNode.type]?.label ? COLORS.accent : COLORS.muted}>
                    {selectedNode.name && selectedNode.name !== ELEMENT_REGISTRY[selectedNode.type]?.label ? selectedNode.name : "unnamed"}
                  </text>
                </box>
              )}
            </box>
          </box>
        )}
      </box>

      {/* Row 2: Element toolbar */}
      <box style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <ElementToolbar expanded={addMode} onToggle={onToggleAddMode} onAddElement={onAddElement} />
      </box>

      {/* Separator line */}
      <box style={{ height: 1, marginTop: 0 }}>
        <text fg={COLORS.border}>{"─".repeat(200)}</text>
      </box>
    </box>
  )
}
