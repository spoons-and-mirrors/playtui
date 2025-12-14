import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { COLORS } from "../../theme"
import { DopesheetRow } from "./DopesheetRow"
import type { UseProjectReturn } from "../../hooks/useProject"
import { findNode } from "../../lib/tree"
import { Bind, isKeybind } from "../../lib/shortcuts"

// Get display name for an element (capitalize type)
function getElementName(tree: any, nodeId: string): string {
  const node = findNode(tree, nodeId)
  if (!node) return nodeId
  const type = node.type as string
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Find previous keyframe frame number across ALL properties for a node
function findPrevKeyframeForNode(props: any[], currentFrame: number): number | null {
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

// Find next keyframe frame number across ALL properties for a node
function findNextKeyframeForNode(props: any[], currentFrame: number): number | null {
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

export function Dopesheet({ 
  projectHook,
  onSelectProperty 
}: { 
  projectHook: UseProjectReturn
  onSelectProperty: (nodeId: string, property: string) => void 
}) {
  const { project, setCurrentFrame } = projectHook
  
  if (!project) return null
  
  const animatedProperties = project.animation.keyframing.animatedProperties
  const frameCount = project.animation.frames.length
  const currentFrame = project.animation.currentFrameIndex
  const tree = project.tree
  const selectedId = project.selectedId
  
  // Group by Node ID
  const grouped: Record<string, typeof animatedProperties> = {}
  for (const prop of animatedProperties) {
    if (!grouped[prop.nodeId]) grouped[prop.nodeId] = []
    grouped[prop.nodeId].push(prop)
  }

  // J/K shortcuts for prev/next keyframe
  useKeyboard((key) => {
    if (!selectedId) return

    const props = grouped[selectedId]
    if (!props || props.length === 0) return

    if (isKeybind(key, Bind.TIMELINE_PREV_KEYFRAME)) {
      const prev = findPrevKeyframeForNode(props, currentFrame)
      if (prev !== null) setCurrentFrame(prev)
    } else if (isKeybind(key, Bind.TIMELINE_NEXT_KEYFRAME)) {
      const next = findNextKeyframeForNode(props, currentFrame)
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
            {props.map(prop => (
              <DopesheetRow
                key={`${prop.nodeId}:${prop.property}`}
                property={prop}
                frameCount={frameCount}
                currentFrame={currentFrame}
                onSelect={() => onSelectProperty(prop.nodeId, prop.property)}
              />
            ))}
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
