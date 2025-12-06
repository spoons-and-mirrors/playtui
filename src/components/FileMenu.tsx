import { useState } from "react"
import { COLORS } from "../theme"

export type MenuAction = "new" | "load" | "delete"

interface FileMenuProps {
  onAction: (action: MenuAction) => void
  projectName: string
}

export function FileMenu({ onAction, projectName }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems: { id: MenuAction; label: string }[] = [
    { id: "new", label: "New Project" },
    { id: "load", label: "Load Project" },
    { id: "delete", label: "Delete Project" },
  ]

  const handleSelect = (action: MenuAction) => {
    setIsOpen(false)
    onAction(action)
  }

  return (
    <box style={{ flexDirection: "column" }}>
      {/* Top row: File button + project name */}
      <box style={{ flexDirection: "row" }}>
        <box
          onMouseDown={() => setIsOpen(!isOpen)}
          onMouseOver={() => setHoveredItem("file-btn")}
          onMouseOut={() => setHoveredItem(null)}
          style={{
            backgroundColor: isOpen || hoveredItem === "file-btn" ? COLORS.cardHover : COLORS.card,
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          <text fg={COLORS.accent}>File {isOpen ? "▴" : "▾"}</text>
        </box>
        <box style={{ paddingLeft: 2 }}>
          <text fg={COLORS.muted}>{projectName}</text>
        </box>
      </box>

      {/* Dropdown menu - renders below when open */}
      {isOpen && (
        <box
          border
          borderStyle="rounded"
          borderColor={COLORS.border}
          style={{
            backgroundColor: COLORS.card,
            flexDirection: "column",
            width: 18,
          }}
        >
          {menuItems.map((item) => (
            <box
              key={item.id}
              onMouseDown={() => handleSelect(item.id)}
              onMouseOver={() => setHoveredItem(item.id)}
              onMouseOut={() => setHoveredItem(null)}
              style={{
                backgroundColor: hoveredItem === item.id ? COLORS.cardHover : "transparent",
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <text fg={item.id === "delete" ? COLORS.danger : COLORS.text}>{item.label}</text>
            </box>
          ))}
        </box>
      )}
    </box>
  )
}
