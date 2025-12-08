/**
 * EditorPanel - The central canvas area where elements are rendered and manipulated.
 * 
 * This is the mental entry point for all canvas-related concerns:
 * - Element rendering (via Renderer)
 * - Selection/hover visual feedback
 * - Auto-layout centering
 * - Background click handling
 */

import { COLORS } from "../../theme"
import type { ElementNode } from "../../lib/types"
import { Renderer } from "../Renderer"

// Re-export Renderer for consumers who need direct access
export { Renderer } from "../Renderer"

interface EditorPanelProps {
  tree: ElementNode
  treeKey: number
  selectedId: string | null
  hoveredId: string | null
  autoLayout: boolean
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onBackgroundClick: () => void
  onToggleAutoLayout: () => void
  hideCenterButton?: boolean
}

export function EditorPanel({
  tree,
  treeKey,
  selectedId,
  hoveredId,
  autoLayout,
  onSelect,
  onHover,
  onBackgroundClick,
  onToggleAutoLayout,
  hideCenterButton = false,
}: EditorPanelProps) {
  return (
    <box
      id="editor-panel"
      style={{
        backgroundColor: COLORS.bg,
        flexGrow: 1,
        flexDirection: "column",
      }}
    >
      {/* Header row with Center toggle */}
      <box style={{ flexDirection: "row", justifyContent: "flex-end", flexShrink: 0, height: 1 }}>
        {!hideCenterButton && (
          <box
            id="auto-layout-toggle"
            onMouseDown={onToggleAutoLayout}
            style={{
              backgroundColor: autoLayout ? COLORS.accent : COLORS.card,
              paddingLeft: 1,
              paddingRight: 1,
            }}
          >
            <text fg={autoLayout ? COLORS.bg : COLORS.muted}>⊞ Center</text>
          </box>
        )}
      </box>

      {/* Canvas area */}
      <box
        id="editor-canvas"
        onMouseDown={onBackgroundClick}
        style={{
          flexGrow: 1,
          justifyContent: autoLayout ? "center" : "flex-start",
          alignItems: autoLayout ? "center" : "flex-start",
        }}
      >
        <Renderer
          key={treeKey}
          node={tree}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      </box>
    </box>
  )
}
