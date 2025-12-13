// Keyframing + bezier curve interpolation (hybrid overlay)

import type { ElementNode } from "./types"
import { findNode } from "./tree"

export type PropertyPath = string
export type KeyframedPropertyId = string

// Bezier handles for easing control
// Each keyframe has an "out" handle that affects the curve going TO the next keyframe
// handleX: 0-100, controls horizontal tension (0 = sharp, 100 = smooth ease)
// handleY: -100 to 100, controls vertical overshoot/undershoot
export interface BezierHandle {
  x: number // 0-100: horizontal tension (how far the control point extends)
  y: number // -100 to 100: vertical influence (overshoot/undershoot)
}

export interface Keyframe {
  frame: number
  value: number
  // Bezier handle for the curve going OUT of this keyframe (toward next keyframe)
  handleOut: BezierHandle
}

export interface AnimatedProperty {
  nodeId: string
  property: PropertyPath
  keyframes: Keyframe[]
}

export interface KeyframingState {
  enabled: boolean
  autoKeyEnabled: boolean
  animatedProperties: AnimatedProperty[]
  timeline: {
    panelOpen: boolean
    view: { type: "dopesheet" } | { type: "curve"; nodeId: string; property: PropertyPath }
  }
}

export const ANIMATABLE_PROPERTIES = [
  "x",
  "y",
  "zIndex",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "rowGap",
  "columnGap",
  "flexGrow",
  "flexShrink",
] as const

export type AnimatableProperty = (typeof ANIMATABLE_PROPERTIES)[number]

// Default bezier handle: linear interpolation
export function createDefaultHandle(): BezierHandle {
  return { x: 33, y: 0 }
}

export function createDefaultKeyframingState(): KeyframingState {
  return {
    enabled: true,
    autoKeyEnabled: false,
    animatedProperties: [],
    timeline: {
      panelOpen: false,
      view: { type: "dopesheet" },
    },
  }
}

export function keyframedPropertyId(nodeId: string, property: PropertyPath): KeyframedPropertyId {
  return `${nodeId}:${property}`
}

export function isAnimatableProperty(property: string): property is AnimatableProperty {
  return (ANIMATABLE_PROPERTIES as readonly string[]).includes(property)
}

export function getAnimatedProperty(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath
): AnimatedProperty | undefined {
  return animated.find((p) => p.nodeId === nodeId && p.property === property)
}

export function hasKeyframeAt(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number
): boolean {
  const prop = getAnimatedProperty(animated, nodeId, property)
  if (!prop) return false
  return prop.keyframes.some((k) => k.frame === frame)
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}

function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.frame - b.frame)
}

// Cubic bezier interpolation
// t is normalized time (0-1) within the segment
// Returns normalized value (0-1)
function cubicBezier(t: number, handleOut: BezierHandle, handleIn: BezierHandle): number {
  // Convert handles to control points
  // P0 = (0, 0), P3 = (1, 1)
  // P1 = control point from start keyframe's handleOut
  // P2 = control point from end keyframe's handleIn (we derive from handleOut of start)
  
  const p1x = handleOut.x / 100
  const p1y = handleOut.y / 100 + t * (1 - handleOut.y / 100) * 0.5
  const p2x = 1 - handleIn.x / 100
  const p2y = 1 - handleIn.y / 100 * 0.5
  
  // Simplified cubic bezier for Y given T
  // Using De Casteljau's algorithm approximation
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t
  
  // Bezier curve: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
  // For Y value interpolation:
  const y = mt3 * 0 + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * 1
  
  return clamp(y, 0, 1)
}

// Simplified easing based on single handle
function easeWithHandle(t: number, handle: BezierHandle): number {
  // x controls horizontal easing (ease-in vs ease-out)
  // y controls overshoot
  
  const tension = handle.x / 100 // 0 = linear, 1 = max ease
  const overshoot = handle.y / 100 // -1 to 1
  
  // Apply easing curve
  let eased: number
  if (tension < 0.5) {
    // More ease-out (fast start, slow end)
    const power = 1 + (0.5 - tension) * 4
    eased = 1 - Math.pow(1 - t, power)
  } else {
    // More ease-in (slow start, fast end)  
    const power = 1 + (tension - 0.5) * 4
    eased = Math.pow(t, power)
  }
  
  // Apply overshoot/undershoot
  if (overshoot !== 0) {
    // Add sine wave for overshoot effect
    const wave = Math.sin(t * Math.PI) * overshoot * 0.3
    eased = eased + wave
  }
  
  return clamp(eased, -0.2, 1.2) // Allow slight overshoot
}

export function upsertKeyframe(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number,
  value: number
): AnimatedProperty[] {
  const existing = getAnimatedProperty(animated, nodeId, property)

  if (!existing) {
    const newProp: AnimatedProperty = {
      nodeId,
      property,
      keyframes: [{ frame, value, handleOut: createDefaultHandle() }],
    }
    return [...animated, newProp]
  }

  // Check if keyframe exists at this frame
  const existingKf = existing.keyframes.find((k) => k.frame === frame)
  
  let nextKeyframes: Keyframe[]
  if (existingKf) {
    // Update existing keyframe value, keep handle
    nextKeyframes = existing.keyframes.map((k) => 
      k.frame === frame ? { ...k, value } : k
    )
  } else {
    // Add new keyframe
    nextKeyframes = [...existing.keyframes, { frame, value, handleOut: createDefaultHandle() }]
  }
  
  nextKeyframes = sortKeyframes(nextKeyframes)

  return animated.map((p) => {
    if (p.nodeId === nodeId && p.property === property) {
      return { ...p, keyframes: nextKeyframes }
    }
    return p
  })
}

export function removeKeyframe(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number
): AnimatedProperty[] {
  const existing = getAnimatedProperty(animated, nodeId, property)
  if (!existing) return animated

  const nextKeyframes = existing.keyframes.filter((k) => k.frame !== frame)
  if (nextKeyframes.length === 0) {
    return animated.filter((p) => !(p.nodeId === nodeId && p.property === property))
  }

  return animated.map((p) => {
    if (p.nodeId === nodeId && p.property === property) {
      return { ...p, keyframes: nextKeyframes }
    }
    return p
  })
}

// Update bezier handle for a keyframe
export function setKeyframeHandle(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number,
  handleX: number,
  handleY: number
): AnimatedProperty[] {
  const existing = getAnimatedProperty(animated, nodeId, property)
  if (!existing) return animated

  const nextKeyframes = existing.keyframes.map((k) => {
    if (k.frame !== frame) return k
    return {
      ...k,
      handleOut: {
        x: clamp(handleX, 0, 100),
        y: clamp(handleY, -100, 100),
      },
    }
  })

  return animated.map((p) => {
    if (p.nodeId === nodeId && p.property === property) {
      return { ...p, keyframes: nextKeyframes }
    }
    return p
  })
}

export function getDrivenValue(prop: AnimatedProperty, frame: number): number {
  const keyframes = prop.keyframes
  if (keyframes.length === 0) return 0

  const sortedKf = sortKeyframes(keyframes)
  
  // Exact keyframe match
  const exact = sortedKf.find((k) => k.frame === frame)
  if (exact) return exact.value

  // Before first keyframe - hold
  const first = sortedKf[0]
  if (frame < first.frame) return first.value

  // After last keyframe - hold
  const last = sortedKf[sortedKf.length - 1]
  if (frame > last.frame) return last.value

  // Find surrounding keyframes
  let startKf = first
  let endKf = last
  for (let i = 0; i < sortedKf.length - 1; i++) {
    if (sortedKf[i].frame <= frame && sortedKf[i + 1].frame >= frame) {
      startKf = sortedKf[i]
      endKf = sortedKf[i + 1]
      break
    }
  }

  // Calculate normalized time within segment
  const duration = endKf.frame - startKf.frame
  if (duration === 0) return startKf.value
  
  const t = (frame - startKf.frame) / duration
  
  // Apply bezier easing
  const easedT = easeWithHandle(t, startKf.handleOut)
  
  // Interpolate value
  return startKf.value + (endKf.value - startKf.value) * easedT
}

// Legacy function - now unused but kept for compatibility
export function setSegmentPoint(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number,
  percent: number
): AnimatedProperty[] {
  // This is now a no-op - bezier handles replace per-frame editing
  return animated
}

function applyDrivenValue(frameTree: ElementNode, nodeId: string, property: PropertyPath, value: number): void {
  const node = findNode(frameTree, nodeId)
  if (!node) return
  ;(node as any)[property] = value
}

export function bakeFrame(frameTree: ElementNode, animated: AnimatedProperty[], frameIndex: number): ElementNode {
  if (animated.length === 0) return frameTree

  const nextTree = JSON.parse(JSON.stringify(frameTree)) as ElementNode

  for (const prop of animated) {
    const value = getDrivenValue(prop, frameIndex)
    applyDrivenValue(nextTree, prop.nodeId, prop.property, value)
  }

  return nextTree
}

export function bakeKeyframedFrames(frames: ElementNode[], animated: AnimatedProperty[]): ElementNode[] {
  if (animated.length === 0) return frames

  return frames.map((frameTree, frameIndex) => bakeFrame(frameTree, animated, frameIndex))
}

function shiftFrameIndex(frame: number, at: number, delta: 1 | -1): number {
  if (frame < at) return frame
  return frame + delta
}

export function shiftKeyframesOnInsert(animated: AnimatedProperty[], atIndex: number): AnimatedProperty[] {
  return animated.map((prop) => {
    const nextKeyframes = prop.keyframes.map((k) => ({ 
      ...k, 
      frame: shiftFrameIndex(k.frame, atIndex, 1) 
    }))
    return { ...prop, keyframes: nextKeyframes }
  })
}

export function shiftKeyframesOnDelete(animated: AnimatedProperty[], atIndex: number): AnimatedProperty[] {
  return animated
    .map((prop) => {
      const nextKeyframes = prop.keyframes
        .filter((k) => k.frame !== atIndex)
        .map((k) => ({ ...k, frame: k.frame > atIndex ? k.frame - 1 : k.frame }))

      if (nextKeyframes.length === 0) return null
      return { ...prop, keyframes: nextKeyframes }
    })
    .filter((p): p is AnimatedProperty => p !== null)
}

// Get keyframe at specific frame for handle editing
export function getKeyframeAt(
  animated: AnimatedProperty[],
  nodeId: string,
  property: PropertyPath,
  frame: number
): Keyframe | undefined {
  const prop = getAnimatedProperty(animated, nodeId, property)
  if (!prop) return undefined
  return prop.keyframes.find((k) => k.frame === frame)
}
