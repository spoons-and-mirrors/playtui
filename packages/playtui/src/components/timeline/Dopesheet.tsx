import { TextAttributes } from "@opentui/core"
import { COLORS } from "../../theme"
import { DopesheetRow } from "./DopesheetRow"
import { FrameRuler } from "./FrameRuler"
import { useKeyframing } from "../contexts/KeyframingContext"
import { useProject } from "../../hooks/useProject"

export function Dopesheet({ 
  onSelectProperty 
}: { 
  onSelectProperty: (nodeId: string, property: string) => void 
}) {
  const { project, setCurrentFrame } = useProject()
  const keyframing = useKeyframing()
  
  if (!project || !keyframing) return null
  
  const animatedProperties = project.animation.keyframing.animatedProperties
  const frameCount = project.animation.frames.length
  
  // Group by Node ID
  const grouped: Record<string, typeof animatedProperties> = {}
  for (const prop of animatedProperties) {
    if (!grouped[prop.nodeId]) grouped[prop.nodeId] = []
    grouped[prop.nodeId].push(prop)
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <FrameRuler 
        frameCount={frameCount} 
        currentFrame={keyframing.currentFrame} 
        width={100} 
        onSeek={setCurrentFrame}
      />
      <box flexDirection="column" overflow="scroll">
        {Object.entries(grouped).map(([nodeId, props]) => (
          <box key={nodeId} flexDirection="column">
            {/* Node Header */}
            <box height={1} backgroundColor={COLORS.bgAlt} paddingLeft={1}>
              <text fg={COLORS.accent} attributes={TextAttributes.BOLD}>Node {nodeId.slice(0, 4)}</text>
            </box>
            {/* Properties */}
            {props.map(prop => (
              <DopesheetRow
                key={`${prop.nodeId}:${prop.property}`}
                property={prop}
                frameCount={frameCount}
                currentFrame={keyframing.currentFrame}
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
