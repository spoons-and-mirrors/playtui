import { useState, useRef } from "react"
import { COLORS } from "../../theme"
import type { ElementNode } from "../../lib/types"
import { Bind, isKeybind } from "../../lib/shortcuts"
import { ELEMENT_REGISTRY } from "../elements"


interface TreeNodeProps {
  node: ElementNode
  selectedId: string | null
  collapsed: Set<string>
  editingId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onStartEdit: (id: string) => void
  onFocusElement: (id: string) => void
  onRename: (id: string, name: string) => void
  onBlurEdit: () => void
  depth?: number
}

function TreeNode({ node, selectedId, collapsed, editingId, onSelect, onToggle, onStartEdit, onFocusElement, onRename, onBlurEdit, depth = 0 }: TreeNodeProps) {
  const isSelected = node.id === selectedId
  const isEditing = node.id === editingId
  const isCollapsed = collapsed.has(node.id)
  const hasChildren = node.children.length > 0
  const indent = "  ".repeat(depth)
  const lastClickRef = useRef<number>(0)
  
  const canCollapse = hasChildren && (node.type === "box" || node.type === "scrollbox")
  let icon = ELEMENT_REGISTRY[node.type]?.icon || "?"
  if (canCollapse) {
    icon = isCollapsed ? "" : ""
  }
  const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1)

  const label = node.name || (node.type === "text" ? `"${(node.content || "").slice(0, 8)}"` : typeLabel)

  const handleMouseDown = (e: any) => {
    // If we're editing another node, blur first
    if (editingId && editingId !== node.id) {
      onBlurEdit()
    }
    
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
      onFocusElement(node.id)
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
            <text fg={COLORS.bg}><strong>{indent}{icon} </strong></text>
            <input
              value={node.name || ""}
              focused
              width={12}
              placeholder="name..."
              backgroundColor={COLORS.accent}
              textColor={COLORS.bg}
              onSubmit={(val) => onRename(node.id, val)}
              onKeyDown={(key) => {
                if (isKeybind(key, Bind.MODAL_CLOSE)) onRename(node.id, node.name || "")
              }}
            />
          </box>
        ) : (
          <text fg={isSelected ? COLORS.bg : COLORS.muted}>
            {indent}{icon} {isSelected ? <strong><span fg={COLORS.bg}>{label}</span></strong> : <span fg={COLORS.text}>{label}</span>}
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
          onFocusElement={onFocusElement}
          onRename={onRename}
          onBlurEdit={onBlurEdit}
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
  onFocusElement: (id: string) => void
}

// TreeView renders root's children directly, hiding the implicit root container
export function TreeView({ root, selectedId, collapsed, onSelect, onToggle, onRename, onFocusElement }: TreeViewProps) {
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
    <box id="tree-root" style={{ flexDirection: "column" }} onMouseDown={() => { if (editingId) setEditingId(null) }}>
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
          onFocusElement={onFocusElement}
          onRename={handleRename}
          onBlurEdit={() => setEditingId(null)}
          depth={0}
        />
      ))}
    </box>
  )
}
