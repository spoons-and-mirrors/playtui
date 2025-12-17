/**
 * Flipbook - Animation Player React Component
 *
 * Plays pre-rendered JSX frames exported from PlayTUI.
 */

import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  cloneElement,
  isValidElement,
} from 'react'
import type { Animation } from './types'

export interface FlipbookProps {
  animation: Animation
  fpsOverride?: number
  loop?: boolean
  pingPong?: boolean
  paused?: boolean
  reverse?: boolean
  startFrame?: number
  onFrame?: (index: number) => void
  onComplete?: () => void
}

export interface FlipbookRef {
  play: () => void
  pause: () => void
  reset: () => void
  goToFrame: (index: number) => void
  getCurrentFrame: () => number
  getFrameCount: () => number
}

export const Flipbook = forwardRef<FlipbookRef, FlipbookProps>(
  (
    {
      animation,
      fpsOverride,
      loop = true,
      pingPong = false,
      paused: pausedProp = false,
      reverse: reverseProp = false,
      startFrame = 0,
      onFrame,
      onComplete,
    },
    ref,
  ) => {
    const [frameIndex, setFrameIndex] = useState(startFrame)
    const [internalPaused, setInternalPaused] = useState(pausedProp)
    const [direction, setDirection] = useState<1 | -1>(reverseProp ? -1 : 1)
    const fps = fpsOverride ?? animation.fps
    const paused = pausedProp || internalPaused

    const reset = useCallback(() => {
      setDirection(reverseProp ? -1 : 1)
      setFrameIndex(reverseProp ? animation.frames.length - 1 : 0)
    }, [reverseProp, animation.frames.length])

    const goToFrame = useCallback(
      (index: number) => {
        const clamped = Math.max(
          0,
          Math.min(index, animation.frames.length - 1),
        )
        setFrameIndex(clamped)
      },
      [animation.frames.length],
    )

    useImperativeHandle(
      ref,
      () => ({
        play: () => setInternalPaused(false),
        pause: () => setInternalPaused(true),
        reset,
        goToFrame,
        getCurrentFrame: () => frameIndex,
        getFrameCount: () => animation.frames.length,
      }),
      [frameIndex, animation.frames.length, reset, goToFrame],
    )

    useEffect(() => {
      if (animation.frames.length <= 1 || paused) return

      const id = setInterval(() => {
        setFrameIndex((f) => {
          const next = f + direction

          // Hit end
          if (next >= animation.frames.length) {
            if (pingPong) {
              setDirection(-1)
              return f - 1
            }
            if (loop) return 0
            onComplete?.()
            return f
          }

          // Hit start
          if (next < 0) {
            if (pingPong) {
              setDirection(1)
              return f + 1
            }
            if (loop) return animation.frames.length - 1
            onComplete?.()
            return f
          }

          return next
        })
      }, 1000 / fps)

      return () => clearInterval(id)
    }, [
      animation.frames.length,
      fps,
      loop,
      pingPong,
      paused,
      direction,
      onComplete,
    ])

    useEffect(() => {
      onFrame?.(frameIndex)
    }, [frameIndex, onFrame])

    const frame = animation.frames[frameIndex]

    // Clone with unique key to force React to fully re-render each frame
    if (isValidElement(frame)) {
      return cloneElement(frame, { key: `frame-${frameIndex}` })
    }

    return <>{frame}</>
  },
)
