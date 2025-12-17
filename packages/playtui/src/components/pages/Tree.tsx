import { useState, useRef, useCallback } from 'react'
import { COLORS } from '../../theme'
import type { Renderable } from '../../lib/types'
import { Bind, isKeybind } from '../../lib/shortcuts'
import { RENDERABLE_REGISTRY } from '../renderables'
import { findRenderable, findParent } from '../../lib/tree'

interface TreeNodeProps {
  node: Renderable
  selectedId: string | null
  collapsed: Set<string>
  editingId: string | null
  draggedId: string | null
  dropTargetId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onStartEdit: (id: string) => void
  onFocusRenderable: (id: string) => void
  onRename: (id: string, name: string) => void
  onBlurEdit: () => void
  onDragStart: (id: string) => void
  onDragOver: (id: string | null) => void
  onDrop: (draggedId: string, targetId: string) => void
  depth?: number
}

function TreeNode({
  node,
  selectedId,
  collapsed,
  editingId,
  draggedId,
  dropTargetId,
  onSelect,
  onToggle,
  onStartEdit,
  onFocusRenderable,
  onRename,
  onBlurEdit,
  onDragStart,
  onDragOver,
  onDrop,
  depth = 0,
}: TreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = node.id === selectedId
  const isEditing = node.id === editingId
  const isCollapsed = collapsed.has(node.id)
  const isDragged = node.id === draggedId
  const isDropTarget = dropTargetId === node.id
  const hasChildren = node.children.length > 0
  const indent = '  '.repeat(depth)
  const lastClickRef = useRef<number>(0)

  const canCollapse =
    hasChildren && (node.type === 'box' || node.type === 'scrollbox')

  const icon = canCollapse
    ? isCollapsed
      ? '▸'
      : '▾'
    : RENDERABLE_REGISTRY[node.type]?.icon || '?'
  const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1)

  const label =
    node.name ||
    (node.type === 'text' ? `"${(node.content || '').slice(0, 8)}"` : typeLabel)

  const handleMouseDown = (e: any) => {
    e.stopPropagation()

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

    if (isSelected && timeSinceLastClick < 400) {
      onStartEdit(node.id)
      onFocusRenderable(node.id)
    } else {
      onSelect(node.id)
      onDragStart(node.id)
    }
  }

  const handleMouseUp = (e: any) => {
    if (draggedId && isDropTarget) {
      onDrop(draggedId, node.id)
      e.stopPropagation()
    }
  }

  const handleMouseOver = (e: any) => {
    e.stopPropagation()
    setIsHovered(true)
    if (draggedId && draggedId !== node.id) {
      onDragOver(node.id)
    }
  }

  const handleMouseOut = (e: any) => {
    e.stopPropagation()
    setIsHovered(false)
    if (draggedId && isDropTarget) {
      onDragOver(null)
    }
  }

  return (
    <box id={`tree-${node.id}`} style={{ flexDirection: 'column' }}>
      <box
        id={`tree-item-${node.id}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        style={{
          flexDirection: 'row',
          backgroundColor: isSelected
            ? COLORS.accent
            : isDropTarget
            ? COLORS.accent + '44'
            : isHovered && !draggedId
            ? COLORS.cardHover
            : 'transparent',
        }}
      >
        {isEditing ? (
          <box style={{ flexDirection: 'row' }}>
            <text fg={COLORS.bg} selectable={false}>
              <strong>
                {indent}
                {icon}{' '}
              </strong>
            </text>
            <input
              value={node.name || ''}
              focused
              width={12}
              placeholder="name..."
              backgroundColor={COLORS.accent}
              textColor={COLORS.bg}
              onSubmit={(val) => onRename(node.id, val)}
              onKeyDown={(key) => {
                if (isKeybind(key, Bind.MODAL_CLOSE))
                  onRename(node.id, node.name || '')
              }}
            />
          </box>
        ) : (
          <text fg={isSelected ? COLORS.bg : COLORS.muted} selectable={false}>
            {indent}
            {icon}{' '}
            {isSelected ? (
              <strong>
                <span fg={COLORS.bg}>{label}</span>
              </strong>
            ) : (
              <span fg={isDragged ? COLORS.muted : COLORS.text}>{label}</span>
            )}
          </text>
        )}
      </box>

      {!isCollapsed &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            selectedId={selectedId}
            collapsed={collapsed}
            editingId={editingId}
            draggedId={draggedId}
            dropTargetId={dropTargetId}
            onSelect={onSelect}
            onToggle={onToggle}
            onStartEdit={onStartEdit}
            onFocusRenderable={onFocusRenderable}
            onRename={onRename}
            onBlurEdit={onBlurEdit}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            depth={depth + 1}
          />
        ))}
    </box>
  )
}

interface TreeViewProps {
  root: Renderable
  selectedId: string | null
  collapsed: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onRename: (id: string, name: string) => void
  onFocusRenderable: (id: string) => void
  onReorder: (id: string, targetParentId: string, targetIndex: number) => void
}

export function TreeView({
  root,
  selectedId,
  collapsed,
  onSelect,
  onToggle,
  onRename,
  onFocusRenderable,
  onReorder,
}: TreeViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const handleStartEdit = (id: string) => setEditingId(id)
  const handleRename = (id: string, name: string) => {
    onRename(id, name)
    setEditingId(null)
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (id: string | null) => {
    setDropTargetId(id)
  }

  const handleDrop = useCallback(
    (draggedId: string, targetId: string) => {
      // Handle root drop
      if (targetId === 'root') {
        onReorder(draggedId, root.id, root.children.length)
        setDraggedId(null)
        setDropTargetId(null)
        return
      }

      const targetNode = findRenderable(root, targetId)
      const targetParent = findParent(root, targetId)
      if (!targetNode || !targetParent) return

      const isContainer =
        RENDERABLE_REGISTRY[targetNode.type]?.capabilities.supportsChildren
      const isExpanded = !collapsed.has(targetId)

      let newParentId = targetParent.id
      let newIndex =
        targetParent.children.findIndex((c) => c.id === targetId) + 1

      if (isContainer && isExpanded) {
        newParentId = targetId
        newIndex = 0
      }

      onReorder(draggedId, newParentId, newIndex)
      setDraggedId(null)
      setDropTargetId(null)
    },
    [root, collapsed, onReorder],
  )

  const handleMouseUpGlobal = () => {
    setDraggedId(null)
    setDropTargetId(null)
  }

  if (root.children.length === 0) {
    return (
      <box id="tree-empty" style={{ padding: 1 }}>
        <text fg={COLORS.muted} selectable={false}>
          No components yet
        </text>
        <text fg={COLORS.muted} selectable={false}>
          Press <span fg={COLORS.accent}>A</span> to add
        </text>
      </box>
    )
  }

  return (
    <box
      id="tree-root-container"
      style={{ flexDirection: 'row', flexGrow: 1 }}
      onMouseUp={handleMouseUpGlobal}
    >
      {/* Root Drop Zone - Left Column */}
      <box
        id="tree-root-dropzone"
        onMouseOver={() => draggedId && setDropTargetId('root')}
        onMouseOut={() => dropTargetId === 'root' && setDropTargetId(null)}
        onMouseUp={(e) => {
          if (draggedId && dropTargetId === 'root') {
            handleDrop(draggedId, 'root')
            e.stopPropagation()
          }
        }}
        style={{
          width: 1,
          backgroundColor:
            dropTargetId === 'root' ? COLORS.accent + '44' : 'transparent',
        }}
      />

      <box
        id="tree-root"
        style={{ flexDirection: 'column', flexGrow: 1 }}
        onMouseDown={() => {
          if (editingId) setEditingId(null)
        }}
      >
        {root.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            selectedId={selectedId}
            collapsed={collapsed}
            editingId={editingId}
            draggedId={draggedId}
            dropTargetId={dropTargetId}
            onSelect={onSelect}
            onToggle={onToggle}
            onStartEdit={handleStartEdit}
            onFocusRenderable={onFocusRenderable}
            onRename={handleRename}
            onBlurEdit={() => setEditingId(null)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            depth={0}
          />
        ))}

        {/* Bottom Drop Zone - moves to root level */}
        <box
          id="tree-bottom-dropzone"
          onMouseOver={() => draggedId && setDropTargetId('root')}
          onMouseOut={() => dropTargetId === 'root' && setDropTargetId(null)}
          onMouseUp={(e) => {
            if (draggedId && dropTargetId === 'root') {
              handleDrop(draggedId, 'root')
              e.stopPropagation()
            }
          }}
          style={{
            height: 1,
            flexGrow: 1,
          }}
        />
      </box>
    </box>
  )
}
