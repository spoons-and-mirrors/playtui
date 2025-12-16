// Keyframing + bezier curve interpolation (hybrid overlay)

import type { RenderableNode } from "./types"
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
  // Bezier handle for the curve coming INTO this keyframe (from previous keyframe)
  handleIn: BezierHandle
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

export function getPrevKeyframeFrame(
  keyframes: Keyframe[],
  currentFrame: number,
): number | null {
  const sorted = [...keyframes].sort((a, b) => b.frame - a.frame)
  for (const kf of sorted) {
    if (kf.frame < currentFrame) return kf.frame
  }
  return null
}

export function getNextKeyframeFrame(
  keyframes: Keyframe[],
  currentFrame: number,
): number | null {
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame)
  for (const kf of sorted) {
    if (kf.frame > currentFrame) return kf.frame
  }
  return null
}

export function getPrevKeyframeFrameForNode(
  props: AnimatedProperty[],
  currentFrame: number,
): number | null {
  let bestPrev: number | null = null

  for (const prop of props) {
    for (const kf of prop.keyframes) {
      if (kf.frame < currentFrame) {
        if (bestPrev === null || kf.frame > bestPrev) {
          bestPrev = kf.frame
        }
      }
    }
  }

  return bestPrev
}

export function getNextKeyframeFrameForNode(
  props: AnimatedProperty[],
  currentFrame: number,
): number | null {
  let bestNext: number | null = null

  for (const prop of props) {
    for (const kf of prop.keyframes) {
      if (kf.frame > currentFrame) {
        if (bestNext === null || kf.frame < bestNext) {
          bestNext = kf.frame
        }
      }
    }
  }

  return bestNext
}

// Solve cubic bezier for t given x using Newton-Raphson iteration
// This finds the parameter t where the bezier curve has the given x value
function solveCubicBezierX(x: number, p1x: number, p2x: number, epsilon = 0.0001): number {
  // For extreme cases, return linear
  if (x <= 0) return 0
  if (x >= 1) return 1
  
  // Newton-Raphson iteration
  let t = x // Initial guess
  for (let i = 0; i < 8; i++) {
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const t2 = t * t
    const t3 = t2 * t
    
    // Bezier X(t) = 3(1-t)²t*p1x + 3(1-t)t²*p2x + t³
    const currentX = 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3
    
    // If close enough, we're done
    const error = currentX - x
    if (Math.abs(error) < epsilon) break
    
    // Derivative: dX/dt = 3(1-t)²p1x + 6(1-t)t(p2x-p1x) + 3t²(1-p2x)
    const derivative = 3 * mt2 * p1x + 6 * mt * t * (p2x - p1x) + 3 * t2 * (1 - p2x)
    
    // Avoid division by zero
    if (Math.abs(derivative) < 0.000001) break
    
    t = t - error / derivative
    t = clamp(t, 0, 1)
  }
  
  return clamp(t, 0, 1)
}

// Cubic bezier interpolation (CSS-style cubic-bezier timing function)
// x = time (0-1), returns eased value (0-1)
// handleOut.x controls ease-out (speed at start): 0=instant, 100=very slow start
// handleOut.y controls overshoot: negative=undershoot, positive=overshoot
function cubicBezier(x: number, handleOut: BezierHandle, handleIn: BezierHandle): number {
  // Control points for the bezier curve
  // P0 = (0, 0) - start
  // P1 = (p1x, p1y) - first control point (from handleOut)
  // P2 = (p2x, p2y) - second control point (from handleIn)  
  // P3 = (1, 1) - end
  
  // Speed (x): 0-100, controls horizontal position of control point
  // 0 = control point at x=0 (sharp/instant)
  // 33 = linear-ish (default)
  // 100 = control point at x=1 (very slow ease)
  const p1x = handleOut.x / 100
  const p2x = 1 - handleIn.x / 100
  
  // Bounce (y): -100 to 100, controls vertical position
  // 0 = normal interpolation
  // positive = overshoot (goes past target then back)
  // negative = undershoot (hesitates before reaching target)
  const p1y = handleOut.y / 100 + 0.33 // Offset so 0 gives roughly linear
  const p2y = 1 - handleIn.y / 100 - 0.33
  
  // Find the bezier parameter t for the given x (time)
  const t = solveCubicBezierX(x, p1x, p2x)
  
  // Now calculate Y at parameter t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t
  
  // Bezier Y(t) = 3(1-t)²t*p1y + 3(1-t)t²*p2y + t³
  const y = 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3
  
  // Allow slight overshoot but clamp extremes
  return clamp(y, -0.5, 1.5)
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
      keyframes: [{ 
        frame, 
        value, 
        handleOut: createDefaultHandle(),
        handleIn: createDefaultHandle()
      }],
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
    nextKeyframes = [...existing.keyframes, { 
      frame, 
      value, 
      handleOut: createDefaultHandle(),
      handleIn: createDefaultHandle()
    }]
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

// Update bezier handle for a keyframe (updates both In and Out symmetrically)
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
      handleIn: {
        x: clamp(handleX, 0, 100),
        y: clamp(handleY, -100, 100),
      }
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
  
  // Apply cubic bezier easing using both handles
  // startKf.handleOut controls departure
  // endKf.handleIn controls arrival
  // Provide defaults for migration safety (old keyframes might lack handleIn)
  const handleOut = startKf.handleOut || createDefaultHandle()
  const handleIn = endKf.handleIn || createDefaultHandle()
  
  const easedT = cubicBezier(t, handleOut, handleIn)
  
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

function applyDrivenValue(frameTree: RenderableNode, nodeId: string, property: PropertyPath, value: number): void {
  const node = findNode(frameTree, nodeId)
  if (!node) return
  ;(node as any)[property] = value
}

export function bakeFrame(frameTree: RenderableNode, animated: AnimatedProperty[], frameIndex: number): RenderableNode {
  if (animated.length === 0) return frameTree

  const nextTree = JSON.parse(JSON.stringify(frameTree)) as RenderableNode

  for (const prop of animated) {
    const value = getDrivenValue(prop, frameIndex)
    applyDrivenValue(nextTree, prop.nodeId, prop.property, value)
  }

  return nextTree
}

export function bakeKeyframedFrames(frames: RenderableNode[], animated: AnimatedProperty[]): RenderableNode[] {
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
