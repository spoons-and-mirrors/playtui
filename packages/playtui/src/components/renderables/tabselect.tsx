import type { Renderable, TabSelectRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// TABSELECT DEFAULTS
// =============================================================================

export const TABSELECT_DEFAULTS: Partial<TabSelectRenderable> = {
  options: ['Tab 1', 'Tab 2'],
  tabWidth: 15,
}

// =============================================================================
// TABSELECT RENDERER
// =============================================================================

interface TabSelectRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function TabSelectRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: TabSelectRendererProps) {
  const node = genericNode as TabSelectRenderable
  const options = node.options || ['Tab 1', 'Tab 2']

  const { handleMouseDown, handleMouseOver, handleMouseOut } =
    useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      visible={node.visible !== false}
      style={buildPositioningStyle(node)}
    >
      <tab-select
        options={options.map((o) => ({ name: o, description: '' }))}
        tabWidth={node.tabWidth || 15}
        focused={false} // Editor view is not interactive
        backgroundColor={node.backgroundColor || COLORS.bgAlt}
        textColor={node.textColor || COLORS.text}
        selectedBackgroundColor={node.selectedBackgroundColor || 'transparent'}
        selectedTextColor={node.selectedTextColor || COLORS.accent}
        showUnderline={node.showUnderline !== false}
      />
    </box>
  )
}

// =============================================================================
// TAB-SELECT PROPERTIES PANEL
// =============================================================================

// TabSelect properties are now rendered generically via PROPERTY_SECTIONS and
// SerializableProp metadata in renderables/index.ts.
