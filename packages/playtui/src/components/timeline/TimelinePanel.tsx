import { COLORS } from "../../theme"
import { Dopesheet } from "./Dopesheet"
import { ValueGraph } from "./CurveEditor"
import type { UseProjectReturn } from "../../hooks/useProject"

export function TimelinePanel({ 
  projectHook,
  width
}: { 
  projectHook: UseProjectReturn
  width: number
}) {
  const { project, setTimelineView } = projectHook
  const timeline = project?.animation.keyframing.timeline
  const view = timeline?.view ?? { type: "dopesheet" }
 
  return (
    <box
      id="timeline-panel"

      height={14}
      width={width}
      backgroundColor={COLORS.bg}
      flexDirection="column"
      overflow="hidden"
    >
      {view.type === "dopesheet" ? (
        <Dopesheet 
          projectHook={projectHook}
          width={width}
          onSelectProperty={(nodeId, property) =>
            setTimelineView({ type: "curve", nodeId, property })
          }
        />
      ) : (
        <ValueGraph 
          projectHook={projectHook}
          width={width}
          nodeId={view.nodeId} 
          property={view.property} 
          onBack={() => setTimelineView({ type: "dopesheet" })}
        />
      )}
    </box>
  )
}
