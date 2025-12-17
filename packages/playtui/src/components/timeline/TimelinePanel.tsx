import { COLORS } from '../../theme'
import { Dopesheet } from './Dopesheet'
import { ValueGraph } from './CurveEditor'
import type { UseProjectReturn } from '../../hooks/useProject'

export function TimelinePanel({
  projectHook,
  width,
}: {
  projectHook: UseProjectReturn
  width: number
}) {
  const { project, setTimelineView } = projectHook
  const timeline = project?.animation.keyframing.timeline
  const view = timeline?.view ?? { type: 'dopesheet' }

  return (
    <box
      id="timeline-panel"
      width={width}
      backgroundColor={COLORS.bg}
      flexDirection="column"
      overflow="hidden"
    >
      {view.type === 'dopesheet' ? (
        <Dopesheet
          projectHook={projectHook}
          width={width}
          onSelectProperty={(renderableId, property) =>
            setTimelineView({ type: 'curve', renderableId, property })
          }
        />
      ) : (
        <ValueGraph
          projectHook={projectHook}
          width={width}
          renderableId={view.renderableId}
          property={view.property}
          onBack={() => setTimelineView({ type: 'dopesheet' })}
        />
      )}
    </box>
  )
}
