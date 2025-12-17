import { COLORS } from "../../theme"
import { Renderer } from "../Renderer"
import type { Renderable } from "../../lib/types"

interface ProjectPreviewProps {
  tree: Renderable
  width: number
  height: number
  isSelected: boolean
}

export function ProjectPreview({ tree, width, height, isSelected }: ProjectPreviewProps) {
  return (
    <box
      width={width}
      height={height}
      border
      borderColor={isSelected ? COLORS.accent : COLORS.border}
      overflow="hidden" // Crop content that exceeds the preview area
    >
      <Renderer
        node={tree}
        selectedId={null}
        hoveredId={null}
        onSelect={() => {}}
        onHover={() => {}}
      />
    </box>
  )
}
