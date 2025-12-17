import { useState, useRef, useEffect } from 'react'
import { TextAttributes } from '@opentui/core'
import type { MouseEvent, ScrollBoxRenderable } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import { COLORS } from '../../theme'
import type { UseProjectReturn } from '../../hooks/useProject'
import {
  getAnimatedProperty,
  getDrivenValue,
  getKeyframeAt,
  createDefaultHandle,
  getPrevKeyframeFrame,
  getNextKeyframeFrame,
} from '../../lib/keyframing'
import { ValueSlider } from '../ui/ValueSlider'
import { findRenderable } from '../../lib/tree'
import { Bind, isKeybind } from '../../lib/shortcuts'

// Get display name for an element (capitalize type)
function getRenderableName(tree: any, renderableId: string): string {
  const node = findRenderable(tree, renderableId)
  if (!node) return renderableId
  const type = node.type as string
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Graph height in rows (fills TimelinePanel height: 14 - 1 header - 1 border = 12)

const GRAPH_HEIGHT = 12

export function ValueGraph({
  projectHook,
  width,
  renderableId,
  property,
  onBack,
}: {
  projectHook: UseProjectReturn
  width: number
  renderableId: string
  property: string
  onBack: () => void
}) {
  const { project, setCurrentFrame, setKeyframeHandle, addKeyframe } =
    projectHook
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null)
  const [zoom2x, setZoom2x] = useState(true)
  const scrollRef = useRef<ScrollBoxRenderable>(null)
  const handleRef = useRef({ x: 33, y: 0 })

  const currentFrame = project?.animation.currentFrameIndex ?? 0

  // J/K shortcuts for prev/next keyframe
  useKeyboard((key) => {
    if (!project) return
    const animProp = getAnimatedProperty(
      project.animation.keyframing.animatedProperties,
      renderableId,
      property,
    )
    if (!animProp) return

    if (isKeybind(key, Bind.TIMELINE_PREV_KEYFRAME)) {
      const prev = getPrevKeyframeFrame(animProp.keyframes, currentFrame)
      if (prev !== null) setCurrentFrame(prev)
    } else if (isKeybind(key, Bind.TIMELINE_NEXT_KEYFRAME)) {
      const next = getNextKeyframeFrame(animProp.keyframes, currentFrame)
      if (next !== null) setCurrentFrame(next)
    }
  })

  // Auto-scroll logic
  useEffect(() => {
    const sb = scrollRef.current
    if (!sb) return
    const cellW = zoom2x ? 2 : 1
    const framePos = currentFrame * cellW
    const viewportWidth = sb.width ?? 0
    const scrollLeft = sb.scrollLeft ?? 0

    const playheadLeft = framePos
    const playheadRight = framePos + cellW

    // If playhead is left of viewport, scroll to it
    if (playheadLeft < scrollLeft) {
      sb.scrollTo({ x: playheadLeft, y: 0 })
      // If playhead is right of viewport, scroll so it's visible at the end
    } else if (playheadRight > scrollLeft + viewportWidth) {
      sb.scrollTo({ x: playheadRight - viewportWidth + 4, y: 0 }) // +4 for padding
    }
  }, [currentFrame, zoom2x])

  if (!project) return null

  // Removed redundant definition of currentFrame

  const animatedProp = getAnimatedProperty(
    project.animation.keyframing.animatedProperties,
    renderableId,
    property,
  )

  if (!animatedProp) {
    return (
      <box id="curve-editor-empty" flexDirection="column">
        <text fg={COLORS.danger} selectable={false}>
          Property not found
        </text>
        <box id="curve-back-btn" onMouseDown={onBack}>
          <text selectable={false}>[Back]</text>
        </box>
      </box>
    )
  }

  const frameCount = project.animation.frames.length
  const keyframes = animatedProp.keyframes

  // Calculate value range for display
  const values = keyframes.map((k) => k.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1 // Avoid division by zero

  // Get the normalized percent (0-100) for a frame
  const getPercentAtFrame = (frame: number): number => {
    // If it's a keyframe, calculate based on value position in range
    const kf = keyframes.find((k) => k.frame === frame)
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
    renderableId,
    property,
    currentFrame,
  )

  const handle = currentKeyframe
    ? currentKeyframe.handleOut
    : createDefaultHandle()

  // Update ref with latest handle values for slider callbacks (avoids stale closures)
  handleRef.current = handle

  // Find if we are sitting ON a keyframe (to enable sliders)
  const isKeyframeSelected = !!currentKeyframe

  // Current value at this frame (for ValueSlider)
  const currentValue = getDrivenValue(animatedProp, currentFrame)

  // Calculate value at hovered frame (if any)
  const hoveredValue =
    hoveredFrame !== null ? getDrivenValue(animatedProp, hoveredFrame) : null

  // Value to display in the slider (hovered takes precedence for display)
  const displayValue = hoveredValue !== null ? hoveredValue : currentValue

  // Handle value change from the slider
  const handleValueChange = (newValue: number) => {
    addKeyframe(renderableId, property, newValue)
  }

  // Handle click on timeline cell to navigate to that frame
  const handleCellClick = (e: MouseEvent, frame: number) => {
    e.stopPropagation()
    setCurrentFrame(frame)
  }

  // Cell width based on zoom
  const cellWidth = zoom2x ? 2 : 1

  return (
    <box
      id="curve-editor"
      flexDirection="column"
      width={width}
      overflow="hidden"
    >
      {/* Header row */}
      <box
        id="curve-header"
        flexDirection="row"
        alignItems="center"
        height={1}
        backgroundColor={COLORS.bgAlt}
      >
        {/* Left: Element:property name */}
        <box paddingLeft={0} paddingRight={2}>
          <text
            fg={COLORS.accent}
            attributes={TextAttributes.BOLD}
            selectable={false}
          >
            {getRenderableName(project.tree, renderableId)}:{property}
          </text>
        </box>

        {/* Frame indicator */}
        <box paddingRight={1}>
          <text fg={COLORS.muted} selectable={false}>
            f:{hoveredFrame ?? currentFrame}
          </text>
        </box>

        {/* Value slider - editable */}
        <ValueSlider
          id="curve-value"
          label="val"
          value={Math.round(displayValue)}
          onChange={handleValueChange}
        />

        {/* Easing controls when keyframe selected */}
        {isKeyframeSelected && (
          <>
            <ValueSlider
              id="handle-x"
              label="spd"
              value={handle.x}
              onChange={(v) =>
                setKeyframeHandle(
                  renderableId,
                  property,
                  currentFrame,
                  v,
                  handleRef.current.y,
                )
              }
              resetTo={33}
            />
            <ValueSlider
              id="handle-y"
              label="bnc"
              value={handle.y}
              onChange={(v) =>
                setKeyframeHandle(
                  renderableId,
                  property,
                  currentFrame,
                  handleRef.current.x,
                  v,
                )
              }
              resetTo={0}
            />
          </>
        )}

        {/* Spacer pushes buttons to right */}
        <box flexGrow={1} />

        {/* 2x zoom toggle - fixed width button */}
        <box
          id="curve-zoom-btn"
          onMouseDown={() => setZoom2x((z) => !z)}
          backgroundColor={zoom2x ? COLORS.accent : COLORS.bg}
          paddingLeft={1}
          paddingRight={1}
          marginRight={1}
        >
          <text fg={zoom2x ? COLORS.bg : COLORS.muted} selectable={false}>
            2x
          </text>
        </box>

        {/* Back button */}
        <box
          id="curve-back-btn"
          onMouseDown={onBack}
          backgroundColor={COLORS.bg}
          paddingLeft={1}
          paddingRight={1}
        >
          <text fg={COLORS.accent} selectable={false}>
            Back
          </text>
        </box>
      </box>

      {/* Border separator */}
      <box
        height={1}
        border={['top']}
        borderColor={COLORS.border}
        borderStyle="single"
      />

      <box
        id="curve-body"
        flexDirection="row"
        height={GRAPH_HEIGHT + 1}
        backgroundColor={COLORS.bg}
        overflow="hidden"
      >
        {/* Y Axis Labels */}
        <box
          id="curve-y-axis"
          width={5}
          flexDirection="column"
          justifyContent="space-between"
          paddingRight={1}
          flexShrink={0}
        >
          <text
            fg={COLORS.muted}
            attributes={TextAttributes.DIM}
            selectable={false}
          >
            {maxValue}
          </text>
          <text
            fg={COLORS.muted}
            attributes={TextAttributes.DIM}
            selectable={false}
          >
            {Math.round((maxValue + minValue) / 2)}
          </text>
          <text
            fg={COLORS.muted}
            attributes={TextAttributes.DIM}
            selectable={false}
          >
            {minValue}
          </text>
        </box>

        {/* Graph Area with ScrollBox */}
        <box
          id="curve-graph-container"
          flexGrow={1}
          flexShrink={1}
          overflow="hidden"
        >
          <scrollbox
            ref={scrollRef}
            scrollX
            scrollY={false}
            height={GRAPH_HEIGHT + 1}
            scrollbarOptions={{
              showArrows: false,
              trackOptions: {
                foregroundColor: 'transparent',
                backgroundColor: 'transparent',
              },
            }}
            style={{
              rootOptions: {
                overflow: 'hidden',
              },
              contentOptions: {
                flexDirection: 'column',
                flexShrink: 0,
              },
            }}
            onMouseScroll={(e) => {
              const sb = scrollRef.current
              if (!sb || !e.scroll) return
              const delta = e.scroll.direction === 'up' ? -1 : 1
              sb.scrollBy({ x: delta * (zoom2x ? 10 : 5), y: 0 })
            }}
          >
            {Array.from({ length: GRAPH_HEIGHT }).map((_, row) => (
              <box
                id={`curve-row-${row}`}
                key={row}
                flexDirection="row"
                height={1}
                flexShrink={0}
              >
                {Array.from({ length: frameCount }).map((_, frame) => {
                  const percent = getPercentAtFrame(frame)
                  const targetRow = percentToRow(percent)
                  const isKeyframe = keyframes.some((k) => k.frame === frame)
                  const isCurrent = frame === currentFrame
                  const isHovered = frame === hoveredFrame

                  // Determine cell content
                  let char = ' '
                  let fg = COLORS.muted
                  let bg = 'transparent'

                  // Grid lines
                  if (
                    row === 0 ||
                    row === GRAPH_HEIGHT - 1 ||
                    row === Math.floor(GRAPH_HEIGHT / 2)
                  ) {
                    char = '·'
                    fg = COLORS.border
                  }

                  // Current frame highlight
                  if (isCurrent) {
                    bg = COLORS.bgAlt
                  }

                  // Plot the value
                  if (row === targetRow) {
                    if (isKeyframe) {
                      char = '◆'
                      fg = COLORS.danger
                    } else {
                      char = '●'
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
                      char = '│'
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
                      <text fg={fg} selectable={false}>
                        {zoom2x ? char + ' ' : char}
                      </text>
                    </box>
                  )
                })}
              </box>
            ))}
          </scrollbox>
        </box>
      </box>
    </box>
  )
}
