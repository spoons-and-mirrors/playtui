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

// Graph height in rows (fills TimelinePanel height: 14 - 1 header - 1 border = 12)
const GRAPH_HEIGHT = 12

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
  const { project, setCurrentFrame, setKeyframeHandle, addKeyframe } = projectHook
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null)
  const [zoom2x, setZoom2x] = useState(true)
  const handleRef = useRef({ x: 33, y: 0 })

  // J/K shortcuts for prev/next keyframe (J=prev, K=next)
  useKeyboard((key) => {
    if (!project) return
    const animProp = getAnimatedProperty(project.animation.keyframing.animatedProperties, nodeId, property)
    if (!animProp) return
    
    const currentFrame = project.animation.currentFrameIndex
    
    if (key.name === "j") {
      // J = previous keyframe
      const prev = findPrevKeyframe(animProp.keyframes, currentFrame)
      if (prev !== null) setCurrentFrame(prev)
    } else if (key.name === "k") {
      // K = next keyframe
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

  // Current value at this frame (for ValueSlider)
  const currentValue = getDrivenValue(animatedProp, currentFrame)

  // Handle value change from the slider
  const handleValueChange = (newValue: number) => {
    addKeyframe(nodeId, property, newValue)
  }

  // Handle click on timeline cell to navigate to that frame
  const handleCellClick = (e: MouseEvent, frame: number) => {
    e.stopPropagation()
    setCurrentFrame(frame)
  }

  // Cell width based on zoom
  const cellWidth = zoom2x ? 2 : 1

  return (
    <box id="curve-editor" flexDirection="column" flexGrow={1}>
      {/* Header row */}
      <box 
        id="curve-header" 
        flexDirection="row" 
        alignItems="center"
        height={1}
        backgroundColor={COLORS.bgAlt}
      >
        {/* Left: Element:property name */}
        <box paddingLeft={1} paddingRight={2}>
          <text fg={COLORS.accent} attributes={TextAttributes.BOLD} selectable={false}>{getElementName(project.tree, nodeId)}:{property}</text>
        </box>
        
        {/* Frame indicator */}
        <box paddingRight={1}>
          <text fg={COLORS.muted} selectable={false}>f:{hoveredFrame ?? currentFrame}</text>
        </box>
        
        {/* Value slider - editable */}
        <ValueSlider
          id="curve-value"
          label="val"
          value={Math.round(currentValue)}
          onChange={handleValueChange}
        />
        
        {/* Easing controls when keyframe selected */}
        {isKeyframeSelected && (
          <>
            <ValueSlider
              id="handle-x"
              label="spd"
              value={handle.x}
              onChange={(v) => setKeyframeHandle(nodeId, property, currentFrame, v, handleRef.current.y)}
              resetTo={33}
            />
            <ValueSlider
              id="handle-y"
              label="bnc"
              value={handle.y}
              onChange={(v) => setKeyframeHandle(nodeId, property, currentFrame, handleRef.current.x, v)}
              resetTo={0}
            />
          </>
        )}
        
        {/* Spacer pushes buttons to right */}
        <box flexGrow={1} />
        
        {/* 2x zoom toggle - fixed width button */}
        <box 
          id="curve-zoom-btn" 
          onMouseDown={() => setZoom2x(z => !z)} 
          backgroundColor={zoom2x ? COLORS.accent : COLORS.bg} 
          paddingLeft={1} 
          paddingRight={1}
          marginRight={1}
        >
          <text fg={zoom2x ? COLORS.bg : COLORS.muted} selectable={false}>2x</text>
        </box>
        
        {/* Back button */}
        <box id="curve-back-btn" onMouseDown={onBack} backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1}>
          <text fg={COLORS.accent} selectable={false}>Back</text>
        </box>
      </box>
      
      {/* Border separator */}
      <box height={1} border={["top"]} borderColor={COLORS.border} borderStyle="single" />
      
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
                    width={cellWidth}
                    height={1}
                    backgroundColor={bg}
                    onMouseMove={(e) => handleMouseMove(e, frame)}
                    onMouseOut={handleMouseLeave}
                    onMouseDown={(e) => handleCellClick(e, frame)}
                  >
                    <text fg={fg} selectable={false}>{zoom2x ? char + " " : char}</text>
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
