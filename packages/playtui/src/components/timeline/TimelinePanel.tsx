import { useState } from "react"
import { COLORS } from "../../theme"
import { Dopesheet } from "./Dopesheet"
import { ValueGraph } from "./CurveEditor"
import type { UseProjectReturn } from "../../hooks/useProject"

export function TimelinePanel({ 
  projectHook
}: { 
  projectHook: UseProjectReturn
}) {
  const [view, setView] = useState<{ type: "dopesheet" } | { type: "curve", nodeId: string, property: string }>({ type: "dopesheet" })

  return (
    <box
      height={14}
      backgroundColor={COLORS.bg}
      flexDirection="column"
    >
      {view.type === "dopesheet" ? (
        <Dopesheet 
          projectHook={projectHook}
          onSelectProperty={(nodeId, property) => setView({ type: "curve", nodeId, property })} 
        />
      ) : (
        <ValueGraph 
          projectHook={projectHook}
          nodeId={view.nodeId} 
          property={view.property} 
          onBack={() => setView({ type: "dopesheet" })} 
        />
      )}
    </box>
  )
}
