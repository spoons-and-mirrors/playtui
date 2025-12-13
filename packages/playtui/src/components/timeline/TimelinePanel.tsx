import { useState } from "react"
import { COLORS } from "../../theme"
import { Dopesheet } from "./Dopesheet"
import { ValueGraph } from "./CurveEditor"

export function TimelinePanel({ 
  onClose 
}: { 
  onClose: () => void 
}) {
  const [view, setView] = useState<{ type: "dopesheet" } | { type: "curve", nodeId: string, property: string }>({ type: "dopesheet" })

  return (
    <box
      height={14}
      border
      borderStyle="single"
      borderColor={COLORS.border}
      backgroundColor={COLORS.bg}
      flexDirection="column"
    >
      {view.type === "dopesheet" ? (
        <Dopesheet 
          onSelectProperty={(nodeId, property) => setView({ type: "curve", nodeId, property })} 
        />
      ) : (
        <ValueGraph 
          nodeId={view.nodeId} 
          property={view.property} 
          onBack={() => setView({ type: "dopesheet" })} 
        />
      )}
    </box>
  )
}
