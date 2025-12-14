import { useState } from "react"
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
  const [view, setView] = useState<{ type: "dopesheet" } | { type: "curve", nodeId: string, property: string }>({ type: "dopesheet" })

  return (
    <box
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
          onSelectProperty={(nodeId, property) => setView({ type: "curve", nodeId, property })} 
        />
      ) : (
        <ValueGraph 
          projectHook={projectHook}
          width={width}
          nodeId={view.nodeId} 
          property={view.property} 
          onBack={() => setView({ type: "dopesheet" })} 
        />
      )}
    </box>
  )
}
