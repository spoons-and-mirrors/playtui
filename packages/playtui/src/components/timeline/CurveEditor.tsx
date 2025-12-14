import { useState, useRef } from "react"
import { TextAttributes } from "@opentui/core"
import type { MouseEvent } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { COLORS } from "../../theme"
import type { UseProjectReturn } from "../../hooks/useProject"
import { getAnimatedProperty, getDrivenValue, getKeyframeAt, createDefaultHandle } from "../../lib/keyframing"
import { ValueSlider } from "../ui/ValueSlider"
import { findNode } from "../../lib/tree"

// Get display name for an element (capitalize type)
function getElementName(tree: any, nodeId: string): string {
  const node = findNode(tree, nodeId)
  if (!node) return nodeId
  const type = node.type as string
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Find previous keyframe frame number
function findPrevKeyframe(keyframes: { frame: number }[], currentFrame: number): number | null {
  const sorted = [...keyframes].sort((a, b) => b.frame - a.frame) // descending
  for (const kf of sorted) {
    if (kf.frame < currentFrame) return kf.frame
  }
  return null
}

// Find next keyframe frame number
function findNextKeyframe(keyframes: { frame: number }[], currentFrame: number): number | null {
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame) // ascending
  for (const kf of sorted) {
    if (kf.frame > currentFrame) return kf.frame
  }
  return null
}

// Graph height in rows
const GRAPH_HEIGHT = 10

export function ValueGraph({ 
  projectHook,
  nodeId, 
  property,
  onBack
}: { 
  projectHook: UseProjectReturn
  nodeId: string
  property: string
  onBack: () => void
}) {
  const { project, setCurrentFrame, setKeyframeHandle } = projectHook
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null)
  const handleRef = useRef({ x: 33, y: 0 })

  // J/K shortcuts for prev/next keyframe (VIM-style: j=next/down, k=prev/up)
  useKeyboard((key) => {
    if (!project) return
    const animProp = getAnimatedProperty(project.animation.keyframing.animatedProperties, nodeId, property)
    if (!animProp) return
    
    const currentFrame = project.animation.currentFrameIndex
    
    if (key.name === "k") {
      // K = up/previous keyframe
      const prev = findPrevKeyframe(animProp.keyframes, currentFrame)
      if (prev !== null) setCurrentFrame(prev)
    } else if (key.name === "j") {
      // J = down/next keyframe
      const next = findNextKeyframe(animProp.keyframes, currentFrame)
      if (next !== null) setCurrentFrame(next)
    }
  })

  if (!project) return null
  
  const currentFrame = project.animation.currentFrameIndex
  
  const animatedProp = getAnimatedProperty(
    project.animation.keyframing.animatedProperties, 
    nodeId, 
    property
  )

  if (!animatedProp) {
    return (
      <box id="curve-editor-empty" flexDirection="column">
        <text fg={COLORS.danger} selectable={false}>Property not found</text>
        <box id="curve-back-btn" onMouseDown={onBack}><text selectable={false}>[Back]</text></box>
      </box>
    )
  }

  const frameCount = project.animation.frames.length
  const keyframes = animatedProp.keyframes
  
  // Calculate value range for display
  const values = keyframes.map(k => k.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1 // Avoid division by zero

  // Get the normalized percent (0-100) for a frame
  const getPercentAtFrame = (frame: number): number => {
    // If it's a keyframe, calculate based on value position in range
    const kf = keyframes.find(k => k.frame === frame)
    if (kf) {
      return Math.round(((kf.value - minValue) / valueRange) * 100)
    }
    
    // For interpolated frames, get the driven value and normalize
    const driven = getDrivenValue(animatedProp, frame)
    return Math.round(((driven - minValue) / valueRange) * 100)
  }

  // Convert percent to row
  const percentToRow = (percent: number): number => {
    return Math.round((1 - percent / 100) * (GRAPH_HEIGHT - 1))
  }

  const handleMouseMove = (_e: MouseEvent, frame: number) => {
    setHoveredFrame(frame)
  }

  const handleMouseLeave = () => {
    setHoveredFrame(null)
  }

  // Visible frame limit for display
  const visibleFrames = Math.min(frameCount, 60)

  // Get current keyframe if one exists at current frame
  const currentKeyframe = getKeyframeAt(
    project.animation.keyframing.animatedProperties,
    nodeId,
    property,
    currentFrame
  )

  const handle = currentKeyframe ? currentKeyframe.handleOut : createDefaultHandle()

  // Update ref with latest handle values for slider callbacks (avoids stale closures)
  handleRef.current = handle

  // Find if we are sitting ON a keyframe (to enable sliders)
  const isKeyframeSelected = !!currentKeyframe

  // Handle click on timeline cell to navigate to that frame
  const handleCellClick = (e: MouseEvent, frame: number) => {
    e.stopPropagation()
    setCurrentFrame(frame)
  }

  return (
    <box id="curve-editor" flexDirection="column" flexGrow={1}>
      {/* Header - styled like filmstrip */}
      <box 
        id="curve-header" 
        flexDirection="row" 
        justifyContent="space-between" 
        alignItems="center"
        paddingLeft={1} 
        paddingRight={1}
        height={1}
        backgroundColor={COLORS.bgAlt}
        border={["bottom"]}
        borderColor={COLORS.border}
        borderStyle="single"
      >
        <text fg={COLORS.accent} attributes={TextAttributes.BOLD} selectable={false}>{getElementName(project.tree, nodeId)}:{property}</text>
        
        {/* Frame/Value status - moved to header */}
        <box id="curve-status" flexDirection="row" gap={2}>
          <text fg={COLORS.muted} selectable={false}>
            Frame: <span fg={COLORS.text}>{hoveredFrame !== null ? hoveredFrame : currentFrame}</span>
          </text>
          <text fg={COLORS.muted} selectable={false}>
            Value: <span fg={COLORS.text}>{hoveredFrame !== null 
              ? getDrivenValue(animatedProp, hoveredFrame).toFixed(1) 
              : getDrivenValue(animatedProp, currentFrame).toFixed(1)}</span>
          </text>
        </box>

        <box id="curve-controls" flexDirection="row" gap={2}>
          {isKeyframeSelected ? (
            <>
              <ValueSlider
                id="handle-x"
                label="Speed"
                value={handle.x}
                onChange={(v) => setKeyframeHandle(nodeId, property, currentFrame, v, handleRef.current.y)}
                resetTo={33}
              />
              <ValueSlider
                id="handle-y"
                label="Bounce"
                value={handle.y}
                onChange={(v) => setKeyframeHandle(nodeId, property, currentFrame, handleRef.current.x, v)}
                resetTo={0}
              />
            </>
          ) : (
            <text fg={COLORS.muted} selectable={false}>Select keyframe to edit easing</text>
          )}
        </box>
        <box id="curve-back-btn" onMouseDown={onBack} backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1}>
          <text fg={COLORS.accent} selectable={false}>Back</text>
        </box>
      </box>
      
      <box id="curve-body" flexDirection="row" height={GRAPH_HEIGHT} backgroundColor={COLORS.bg}>
        {/* Y Axis Labels */}
        <box id="curve-y-axis" width={5} flexDirection="column" justifyContent="space-between" paddingRight={1}>
          <text fg={COLORS.muted} attributes={TextAttributes.DIM} selectable={false}>{maxValue}</text>
          <text fg={COLORS.muted} attributes={TextAttributes.DIM} selectable={false}>{Math.round((maxValue + minValue) / 2)}</text>
          <text fg={COLORS.muted} attributes={TextAttributes.DIM} selectable={false}>{minValue}</text>
        </box>

        {/* Graph Area */}
        <box id="curve-graph" flexDirection="column" flexGrow={1}>
          {Array.from({ length: GRAPH_HEIGHT }).map((_, row) => (
            <box id={`curve-row-${row}`} key={row} flexDirection="row" height={1}>
              {Array.from({ length: visibleFrames }).map((_, frame) => {
                const percent = getPercentAtFrame(frame)
                const targetRow = percentToRow(percent)
                const isKeyframe = keyframes.some(k => k.frame === frame)
                const isCurrent = frame === currentFrame
                const isHovered = frame === hoveredFrame
                
                // Determine cell content
                let char = " "
                let fg = COLORS.muted
                let bg = "transparent"
                
                // Grid lines
                if (row === 0 || row === GRAPH_HEIGHT - 1 || row === Math.floor(GRAPH_HEIGHT / 2)) {
                  char = "·"
                  fg = COLORS.border
                }
                
                // Current frame highlight
                if (isCurrent) {
                  bg = COLORS.bgAlt
                }
                
                // Plot the value
                if (row === targetRow) {
                  if (isKeyframe) {
                    char = "◆"
                    fg = COLORS.danger
                  } else {
                    char = "●"
                    fg = COLORS.accent
                  }
                }
                
                // Draw vertical line connecting to value - FULL HEIGHT for cursor/keyframe
                if (isKeyframe || isHovered) {
                  // Only draw line if NOT the value point itself
                  if (row !== targetRow) {
                     // Determine color based on if it's keyframe or just hover
                     fg = isKeyframe ? COLORS.danger : COLORS.muted
                     
                     // Draw full line
                     char = "│"
                  }
                }

                return (
                  <box
                    id={`curve-cell-${frame}-${row}`}
                    key={frame}
                    width={1}
                    height={1}
                    backgroundColor={bg}
                    onMouseMove={(e) => handleMouseMove(e, frame)}
                    onMouseOut={handleMouseLeave}
                    onMouseDown={(e) => handleCellClick(e, frame)}
                  >
                    <text fg={fg} selectable={false}>{char}</text>
                  </box>
                )
              })}
            </box>
          ))}
        </box>
      </box>
    </box>
  )
}
