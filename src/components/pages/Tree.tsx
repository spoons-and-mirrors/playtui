import { useState, useRef } from "react"
import { COLORS } from "../../theme"
import type { ElementNode, ElementType } from "../../lib/types"

const TYPE_ICONS: Record<ElementType, string> = {
  box: "□",
  text: "T",
  scrollbox: "⊟",
  input: "▭",
  textarea: "▤",
  select: "▼",
  slider: "═",
  "ascii-font": "A",
  "tab-select": "⊞",
}

interface TreeNodeProps {
  node: ElementNode
  selectedId: string | null
  collapsed: Set<string>
  editingId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onStartEdit: (id: string) => void
  onRename: (id: string, name: string) => void
  depth?: number
}

function TreeNode({ node, selectedId, collapsed, editingId, onSelect, onToggle, onStartEdit, onRename, depth = 0 }: TreeNodeProps) {
  const isSelected = node.id === selectedId
  const isEditing = node.id === editingId
  const isCollapsed = collapsed.has(node.id)
  const hasChildren = node.children.length > 0
  const indent = "  ".repeat(depth)
  const lastClickRef = useRef<number>(0)
  
  const canCollapse = hasChildren && (node.type === "box" || node.type === "scrollbox")
  const icon = canCollapse ? (isCollapsed ? "▸" : "▾") : TYPE_ICONS[node.type]
  const label = node.name || (node.type === "text" ? `"${(node.content || "").slice(0, 8)}"` : node.id.slice(3, 8))

  const handleMouseDown = (e: any) => {
    if (canCollapse && e.x < depth * 2 + 2) {
      onToggle(node.id)
      return
    }
    
    const now = Date.now()
    const timeSinceLastClick = now - lastClickRef.current
    lastClickRef.current = now
    
    // Double-click detection (< 400ms between clicks)
    if (isSelected && timeSinceLastClick < 400) {
      onStartEdit(node.id)
    } else {
      onSelect(node.id)
    }
  }

  return (
    <box id={`tree-${node.id}`} style={{ flexDirection: "column" }}>
      <box
        id={`tree-item-${node.id}`}
        onMouseDown={handleMouseDown}
        style={{
          flexDirection: "row",
          backgroundColor: isSelected ? COLORS.accent : "transparent",
        }}
      >
        {isEditing ? (
          <box style={{ flexDirection: "row" }}>
            <text fg={COLORS.muted}>{indent}{icon} </text>
            <input
              value={node.name || ""}
              focused
              width={12}
              placeholder="name..."
              backgroundColor={COLORS.bg}
              textColor={COLORS.text}
              onSubmit={(val) => onRename(node.id, val)}
              onKeyDown={(key) => {
                if (key.name === "escape") onRename(node.id, node.name || "")
              }}
            />
          </box>
        ) : (
          <text fg={isSelected ? COLORS.bg : COLORS.muted}>
            {indent}{icon} <span fg={isSelected ? COLORS.bg : COLORS.text}>{label}</span>
          </text>
        )}
      </box>
      {!isCollapsed && node.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          selectedId={selectedId}
          collapsed={collapsed}
          editingId={editingId}
          onSelect={onSelect}
          onToggle={onToggle}
          onStartEdit={onStartEdit}
          onRename={onRename}
          depth={depth + 1}
        />
      ))}
    </box>
  )
}

interface TreeViewProps {
  root: ElementNode
  selectedId: string | null
  collapsed: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onRename: (id: string, name: string) => void
}

// TreeView renders root's children directly, hiding the implicit root container
export function TreeView({ root, selectedId, collapsed, onSelect, onToggle, onRename }: TreeViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleStartEdit = (id: string) => setEditingId(id)
  const handleRename = (id: string, name: string) => {
    onRename(id, name)
    setEditingId(null)
  }

  if (root.children.length === 0) {
    return (
      <box id="tree-empty" style={{ padding: 1 }}>
        <text fg={COLORS.muted}>No components yet</text>
        <text fg={COLORS.muted}>Press <span fg={COLORS.accent}>A</span> to add</text>
      </box>
    )
  }

  return (
    <box id="tree-root" style={{ flexDirection: "column" }}>
      {root.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          selectedId={selectedId}
          collapsed={collapsed}
          editingId={editingId}
          onSelect={onSelect}
          onToggle={onToggle}
          onStartEdit={handleStartEdit}
          onRename={handleRename}
          depth={0}
        />
      ))}
    </box>
  )
}
