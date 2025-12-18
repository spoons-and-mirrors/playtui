import { useRef, useState, useEffect } from 'react'
import type { MouseEvent } from '@opentui/core'
import { MouseButton } from '@opentui/core'
import { COLORS } from '../../theme'
import { useDragCapture } from '../contexts/DragCaptureContext'
import { useKeyframing } from '../contexts/KeyframingContext'
import { KeyframeContextMenu } from './KeyframeContextMenu'

interface ValueControlBaseProps {
  id: string
  label: string
  property?: string
  value: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  resetTo?: number
}

interface CounterProps extends ValueControlBaseProps {
  variant: 'counter'
}

interface SliderProps extends ValueControlBaseProps {
  variant: 'slider'
}

type ValueControlProps = CounterProps | SliderProps

/**
 * Unified value control component with two variants:
 * - counter: | - | label:value | + | with increment/decrement buttons
 * - slider: draggable value with inline edit mode on single click
 *
 * Both support:
 * - Drag to change value
 * - Double-click to reset
 * - Right-click for keyframe context menu
 * - Auto-keyframing when property is animated
 */
export function ValueControl({
  id,
  label,
  property,
  value,
  onChange,
  onChangeEnd,
  resetTo = 0,
  variant,
}: ValueControlProps) {
  const [pressing, setPressing] = useState<'dec' | 'inc' | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMoved = useRef(false)
  const lastClickTime = useRef<number>(0)
  const dragStart = useRef<{ x: number; y: number; value: number } | null>(null)
  const registerDrag = useDragCapture()
  const keyframing = useKeyframing()
  const [showMenu, setShowMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current)
    }
  }, [])

  const isKeyframed =
    keyframing && keyframing.selectedId && property
      ? keyframing.animatedProperties?.some(
          (p) =>
            p.renderableId === keyframing.selectedId && p.property === property,
        )
      : false

  const hasKeyframeAtCurrent =
    keyframing && keyframing.selectedId && property
      ? keyframing.hasKeyframe(
          keyframing.selectedId,
          property,
          keyframing.currentFrame,
        )
      : false

  const handleAutoKeyframe = (newValue: number) => {
    if (isKeyframed && keyframing && keyframing.selectedId && property) {
      keyframing.addKeyframe(keyframing.selectedId, property, newValue)
    }
  }

  // Counter-specific handlers
  const handleDec = () => {
    const newVal = value - 1
    onChange(newVal)
    if (onChangeEnd) onChangeEnd(newVal)
    handleAutoKeyframe(newVal)
  }

  const handleInc = () => {
    const newVal = value + 1
    onChange(newVal)
    if (onChangeEnd) onChangeEnd(newVal)
    handleAutoKeyframe(newVal)
  }

  // Counter drag handlers
  const handleCounterMouseDown = (e: MouseEvent) => {
    if (e.button === MouseButton.RIGHT && keyframing && property) {
      e.stopPropagation()
      setShowMenu({ x: e.x, y: e.y })
      return
    }

    const now = Date.now()
    if (now - lastClickTime.current < 200) {
      onChange(resetTo)
      if (onChangeEnd) onChangeEnd(resetTo)
      handleAutoKeyframe(resetTo)
      lastClickTime.current = 0
      return
    }
    lastClickTime.current = now

    dragStart.current = { x: e.x, y: e.y, value }
    setDragging(true)

    if (registerDrag) {
      registerDrag(e.x, e.y, value, onChange, (v) => {
        if (onChangeEnd) onChangeEnd(v)
        handleAutoKeyframe(v)
      })
    }
  }

  const handleCounterDrag = (e: MouseEvent) => {
    if (!dragStart.current) return
    const deltaX = e.x - dragStart.current.x
    const deltaY = dragStart.current.y - e.y
    const next = dragStart.current.value + deltaX + deltaY
    if (next === value) return
    onChange(next)
  }

  const handleCounterDragEnd = () => {
    if (dragStart.current) {
      if (onChangeEnd) onChangeEnd(value)
      handleAutoKeyframe(value)
    }
    dragStart.current = null
    setDragging(false)
  }

  // Slider mouse handler
  const handleSliderMouseDown = (e: MouseEvent) => {
    if (isEditing) return

    if (e.button === MouseButton.RIGHT && keyframing && property) {
      e.stopPropagation()
      setShowMenu({ x: e.x, y: e.y })
      return
    }

    const now = Date.now()
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

  const valueTextColor = isKeyframed ? COLORS.warning : COLORS.text
  const isZero = value === 0
  const sliderTextColor = dragging
    ? COLORS.accentBright
    : isKeyframed
      ? COLORS.warning
      : isZero
        ? COLORS.muted
        : COLORS.accent

  const contextMenu =
    showMenu && keyframing && keyframing.selectedId && property ? (
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
    ) : null

  if (variant === 'counter') {
    return (
      <box id={id} flexDirection="row" alignItems="center">
        <box
          id={`${id}-dec`}
          backgroundColor={COLORS.bg}
          paddingLeft={1}
          paddingRight={1}
          onMouseDown={() => {
            setPressing('dec')
            handleDec()
          }}
          onMouseUp={() => setPressing(null)}
          onMouseOut={() => setPressing(null)}
        >
          <text fg={COLORS.accent} selectable={false}>
            -
          </text>
        </box>
        <box
          id={`${id}-value`}
          backgroundColor={pressing || dragging ? COLORS.accent : COLORS.muted}
          paddingLeft={1}
          paddingRight={1}
          flexDirection="row"
          onMouseDown={handleCounterMouseDown}
          onMouseDrag={handleCounterDrag}
          onMouseDragEnd={handleCounterDragEnd}
        >
          <text fg={valueTextColor} selectable={false}>
            <strong>
              {label.toLowerCase()}:{value}
            </strong>
          </text>
        </box>
        <box
          id={`${id}-inc`}
          backgroundColor={COLORS.bg}
          paddingLeft={1}
          paddingRight={1}
          onMouseDown={() => {
            setPressing('inc')
            handleInc()
          }}
          onMouseUp={() => setPressing(null)}
          onMouseOut={() => setPressing(null)}
        >
          <text fg={COLORS.accent} selectable={false}>
            +
          </text>
        </box>
        {contextMenu}
      </box>
    )
  }

  // Slider variant
  return (
    <>
      <box
        id={`${id}-slider`}
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        alignItems="center"
        onMouseDown={handleSliderMouseDown}
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
          <text fg={sliderTextColor} selectable={false}>
            <strong>{label ? `${label.toLowerCase()}:${value}` : value}</strong>
          </text>
        )}
      </box>
      {contextMenu}
    </>
  )
}
