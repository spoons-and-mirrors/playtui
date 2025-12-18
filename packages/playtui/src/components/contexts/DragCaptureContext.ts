import { createContext, useContext, useRef } from 'react'
import type { MouseEvent } from '@opentui/core'

/**
 * Drag capture context - allows value controls to register drags at the panel level.
 * This ensures dragging continues even when the mouse leaves the control bounds.
 */
export type DragRegisterFn = (
  startX: number,
  startY: number,
  startValue: number,
  onChange: (value: number) => void,
  onChangeEnd?: (value: number) => void,
) => void

export const DragCaptureContext = createContext<DragRegisterFn | null>(null)
export const useDragCapture = () => useContext(DragCaptureContext)

/**
 * Hook to implement drag capture logic in a container.
 * Returns the register function and the event handlers to be placed on the container.
 */
export function useDragCaptureImplementation() {
  const activeDrag = useRef<{
    startX: number
    startY: number
    startValue: number
    lastValue: number
    hasMoved: boolean
    onChange: (value: number) => void
    onChangeEnd?: (value: number) => void
  } | null>(null)

  const handleDrag = (e: MouseEvent) => {
    if (!activeDrag.current) return
    const deltaX = e.x - activeDrag.current.startX
    const deltaY = activeDrag.current.startY - e.y // up = positive
    const next = activeDrag.current.startValue + deltaX + deltaY
    activeDrag.current.lastValue = next
    activeDrag.current.hasMoved = true
    activeDrag.current.onChange(next)
  }

  const handleDragEnd = () => {
    if (!activeDrag.current) return
    if (activeDrag.current.hasMoved && activeDrag.current.onChangeEnd) {
      activeDrag.current.onChangeEnd(activeDrag.current.lastValue)
    }
    activeDrag.current = null
  }

  const registerDrag: DragRegisterFn = (
    startX,
    startY,
    startValue,
    onChange,
    onChangeEnd,
  ) => {
    activeDrag.current = {
      startX,
      startY,
      startValue,
      lastValue: startValue,
      hasMoved: false,
      onChange,
      onChangeEnd,
    }
  }

  return {
    registerDrag,
    handleDrag,
    handleDragEnd,
    isDragging: !!activeDrag.current,
  }
}
