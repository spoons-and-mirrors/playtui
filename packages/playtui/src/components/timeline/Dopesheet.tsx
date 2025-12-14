import { TextAttributes } from "@opentui/core"
import { COLORS } from "../../theme"
import { DopesheetRow } from "./DopesheetRow"
import type { UseProjectReturn } from "../../hooks/useProject"
import { findNode } from "../../lib/tree"

// Get display name for an element (capitalize type)
function getElementName(tree: any, nodeId: string): string {
  const node = findNode(tree, nodeId)
  if (!node) return nodeId
  const type = node.type as string
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function Dopesheet({ 
  projectHook,
  onSelectProperty 
}: { 
  projectHook: UseProjectReturn
  onSelectProperty: (nodeId: string, property: string) => void 
}) {
  const { project } = projectHook
  
  if (!project) return null
  
  const animatedProperties = project.animation.keyframing.animatedProperties
  const frameCount = project.animation.frames.length
  const currentFrame = project.animation.currentFrameIndex
  const tree = project.tree
  
  // Group by Node ID
  const grouped: Record<string, typeof animatedProperties> = {}
  for (const prop of animatedProperties) {
    if (!grouped[prop.nodeId]) grouped[prop.nodeId] = []
    grouped[prop.nodeId].push(prop)
  }

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
