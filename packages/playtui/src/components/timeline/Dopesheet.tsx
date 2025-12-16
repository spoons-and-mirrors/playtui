import { useRef, useEffect } from "react"
import { TextAttributes } from "@opentui/core"
import type { ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { COLORS } from "../../theme"
import { DopesheetRow } from "./DopesheetRow"
import type { UseProjectReturn } from "../../hooks/useProject"
import { findNode } from "../../lib/tree"
import { Bind, isKeybind } from "../../lib/shortcuts"
import { getPrevKeyframeFrameForNode, getNextKeyframeFrameForNode } from "../../lib/keyframing"
 
// Get display name for an element (capitalize type)
function getElementName(tree: any, nodeId: string): string {
  const node = findNode(tree, nodeId)
  if (!node) return nodeId
  const type = node.type as string
  return type.charAt(0).toUpperCase() + type.slice(1)
}
 
export function Dopesheet({ 

  projectHook,
  width: _width,
  onSelectProperty 
}: { 
  projectHook: UseProjectReturn
  width: number
  onSelectProperty: (nodeId: string, property: string) => void 
}) {
  const { project, setCurrentFrame } = projectHook
  const scrollRefs = useRef<Map<string, React.RefObject<ScrollBoxRenderable | null>>>(new Map())
  
  if (!project) return null
  
  const animatedProperties = project.animation.keyframing.animatedProperties
  const frameCount = project.animation.frames.length
  const currentFrame = project.animation.currentFrameIndex
  const fps = project.animation.fps
  const tree = project.tree
  const selectedId = project.selectedId
  
  // Group by Node ID
  const grouped: Record<string, typeof animatedProperties> = {}
  for (const prop of animatedProperties) {
    if (!grouped[prop.nodeId]) grouped[prop.nodeId] = []
    grouped[prop.nodeId].push(prop)
  }

  // Create refs for each row (no hooks in loop - just create ref objects)
  const rowKeys = Object.entries(grouped).flatMap(([_, props]) => 
    props.map(prop => `${prop.nodeId}:${prop.property}`)
  )
  
  // Initialize refs for all rows
  rowKeys.forEach(key => {
    if (!scrollRefs.current.has(key)) {
      scrollRefs.current.set(key, { current: null })
    }
  })

  // Auto-scroll to current frame when it changes
  useEffect(() => {
    const cellW = 1
    const framePos = currentFrame * cellW
    
    // Sync all row scrollboxes
    scrollRefs.current.forEach(ref => {
      const sb = ref.current
      if (!sb) return
      const viewportWidth = sb.width ?? 0
      const scrollLeft = sb.scrollLeft ?? 0
      
      const playheadLeft = framePos
      const playheadRight = framePos + cellW
      
      // If playhead is left of viewport, scroll to it
      if (playheadLeft < scrollLeft) {
        sb.scrollTo({ x: playheadLeft, y: 0 })
      // If playhead is right of viewport, scroll so it's visible at the end
      } else if (playheadRight > scrollLeft + viewportWidth) {
        sb.scrollTo({ x: playheadRight - viewportWidth + 4, y: 0 })
      }
    })
  }, [currentFrame])

  // J/K shortcuts for prev/next keyframe
  useKeyboard((key) => {
    if (!selectedId) return

    const props = grouped[selectedId]
    if (!props || props.length === 0) return
 
    if (isKeybind(key, Bind.TIMELINE_PREV_KEYFRAME)) {
      const prev = getPrevKeyframeFrameForNode(props, currentFrame)
      if (prev !== null) setCurrentFrame(prev)
    } else if (isKeybind(key, Bind.TIMELINE_NEXT_KEYFRAME)) {
      const next = getNextKeyframeFrameForNode(props, currentFrame)
      if (next !== null) setCurrentFrame(next)
    }

  })

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="column" overflow="scroll">
        {Object.entries(grouped).map(([nodeId, props]) => (
          <box key={nodeId} flexDirection="column">
            {/* Node Header */}
            <box height={1} backgroundColor={COLORS.bgAlt} paddingLeft={1}>
              <text fg={COLORS.accent} attributes={TextAttributes.BOLD}>{getElementName(tree, nodeId)}</text>
            </box>
            {/* Properties */}
            {props.map(prop => {
              const rowKey = `${prop.nodeId}:${prop.property}`
              const scrollRef = scrollRefs.current.get(rowKey)
              return (
                <DopesheetRow
                  key={rowKey}
                  property={prop}
                  frameCount={frameCount}
                  currentFrame={currentFrame}
                  fps={fps}
                  onSelect={() => onSelectProperty(prop.nodeId, prop.property)}
                  scrollRef={scrollRef}
                />
              )
            })}
          </box>
        ))}
        {animatedProperties.length === 0 && (
          <box height={3} justifyContent="center" alignItems="center">
            <text fg={COLORS.muted}>No animated properties. Add keyframes to start.</text>
          </box>
        )}
      </box>
    </box>
  )
}
