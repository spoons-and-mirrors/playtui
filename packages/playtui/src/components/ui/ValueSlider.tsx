import { useRef, useState, useEffect } from 'react'
import type { MouseEvent } from '@opentui/core'
import { MouseButton } from '@opentui/core'
import { COLORS } from '../../theme'
import { useDragCapture } from '../pages/Properties'
import { useKeyframing } from '../contexts/KeyframingContext'
import { KeyframeContextMenu } from './KeyframeContextMenu'

interface ValueSliderProps {
  id: string
  label: string
  property?: string // property name for keyframing
  value: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  resetTo?: number
}

/**
 * Draggable value slider component: shows label:value
 * - Click and drag to change value
 * - Single click to edit value via input
 * - Double click to reset to default
 * - Uses accent text on bg color styling
 * - Shows warning color when property has keyframes
 * - Auto-keyframes when property is already keyframed (always on)
 */
export function ValueSlider({
  id,
  label,
  property,
  value,
  onChange,
  onChangeEnd,
  resetTo = 0,
}: ValueSliderProps) {
  const [dragging, setDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMoved = useRef(false)
  const lastClickTime = useRef<number>(0)
  const registerDrag = useDragCapture()
  const keyframing = useKeyframing()
  const [showMenu, setShowMenu] = useState<{ x: number; y: number } | null>(
    null,
  )

  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current)
    }
  }, [])

  // Check if this property is keyframed (has any keyframes, not just at current frame)
  const isKeyframed =
    keyframing && keyframing.selectedId && property
      ? keyframing.animatedProperties?.some(
          (p) =>
            p.renderableId === keyframing.selectedId && p.property === property,
        )
      : false

  // Check if there's a keyframe at the current frame
  const hasKeyframeAtCurrent =
    keyframing && keyframing.selectedId && property
      ? keyframing.hasKeyframe(
          keyframing.selectedId,
          property,
          keyframing.currentFrame,
        )
      : false

  // Auto-keyframe: when property is keyframed and value changes, add/update keyframe
  const handleAutoKeyframe = (newValue: number) => {
    if (isKeyframed && keyframing && keyframing.selectedId && property) {
      keyframing.addKeyframe(keyframing.selectedId, property, newValue)
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (isEditing) return

    // Right click -> Context menu
    if (e.button === MouseButton.RIGHT && keyframing && property) {
      e.stopPropagation()
      setShowMenu({ x: e.x, y: e.y })
      return
    }

    const now = Date.now()
    // Double click detection
    if (now - lastClickTime.current < 200) {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
        clickTimeout.current = null
      }
      onChange(resetTo)
      if (onChangeEnd) onChangeEnd(resetTo)
      handleAutoKeyframe(resetTo)
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now
    hasMoved.current = false

    // Start drag
    if (registerDrag) {
      setDragging(true)
      registerDrag(
        e.x,
        e.y,
        value,
        (v) => {
          if (v !== value) hasMoved.current = true
          onChange(v)
        },
        (v) => {
          setDragging(false)
          if (onChangeEnd) onChangeEnd(v)
          handleAutoKeyframe(v)
        },
      )
    }

    if (clickTimeout.current) clearTimeout(clickTimeout.current)
    clickTimeout.current = setTimeout(() => {
      if (!hasMoved.current && !isEditing) {
        setIsEditing(true)
        setEditValue(String(value))
      }
      clickTimeout.current = null
    }, 200)
  }

  const handleCommit = () => {
    const val = parseFloat(editValue)
    if (!isNaN(val)) {
      onChange(val)
      if (onChangeEnd) onChangeEnd(val)
      handleAutoKeyframe(val)
    }
    setIsEditing(false)
  }

  const isZero = value === 0
  // Use warning color if property is keyframed, otherwise normal colors
  const textColor = dragging
    ? COLORS.accentBright
    : isKeyframed
    ? COLORS.warning
    : isZero
    ? COLORS.muted
    : COLORS.accent

  return (
    <>
      <box
        id={`${id}-slider`}
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        alignItems="center"
        onMouseDown={handleMouseDown}
      >
        {isEditing ? (
          <box
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {label && (
              <text fg={COLORS.muted} selectable={false}>
                {label.toLowerCase()}:
              </text>
            )}
            <input
              value={editValue}
              focused
              width={label ? 8 : 6}
              onInput={setEditValue}
              onSubmit={handleCommit}
              onKeyDown={(key) => {
                if (key.name === 'escape') {
                  setIsEditing(false)
                  key.preventDefault()
                }
              }}
            />
          </box>
        ) : (
          <text fg={textColor} selectable={false}>
            <strong>{label ? `${label.toLowerCase()}:${value}` : value}</strong>
          </text>
        )}
      </box>
      {showMenu && keyframing && keyframing.selectedId && property && (
        <KeyframeContextMenu
          x={showMenu.x}
          y={showMenu.y}
          hasKeyframeAtCurrent={hasKeyframeAtCurrent || false}
          onAddKeyframe={() => {
            if (keyframing.selectedId && property) {
              keyframing.addKeyframe(keyframing.selectedId, property, value)
            }
          }}
          onRemoveKeyframe={() => {
            if (keyframing.selectedId && property) {
              keyframing.removeKeyframe(keyframing.selectedId, property)
            }
          }}
          onClose={() => setShowMenu(null)}
        />
      )}
    </>
  )
}
