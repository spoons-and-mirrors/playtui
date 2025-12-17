import type { Renderable, ScrollboxRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import {
  ToggleProp,
  SelectProp,
  ManagedColorControl,
  SectionHeader,
} from '../controls'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// SCROLLBOX DEFAULTS
// =============================================================================

export const SCROLLBOX_DEFAULTS: Partial<ScrollboxRenderable> = {
  width: 20,
  height: 8,
  backgroundColor: COLORS.bgAlt,
  flexDirection: 'column',
  border: true,
  borderStyle: 'rounded',
  borderColor: COLORS.border,
}

// =============================================================================
// SCROLLBOX RENDERER
// =============================================================================

interface ScrollboxRendererProps {
  node: Renderable
  isSelected?: boolean
  isHovered?: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  children?: React.ReactNode
}

export function ScrollboxRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
  children,
}: ScrollboxRendererProps) {
  const node = genericNode as ScrollboxRenderable
  const hasBorder = node.border === true
  const borderValue = hasBorder
    ? node.borderSides && node.borderSides.length > 0
      ? node.borderSides
      : true
    : undefined

  const { handleMouseDown, handleMouseOver, handleMouseOut } =
    useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  const scrollboxStyle = {
    flexDirection: node.flexDirection || 'column',
    flexWrap: node.flexWrap,
    justifyContent: node.justifyContent,
    alignItems: node.alignItems,
    gap: node.gap,
    rowGap: node.rowGap,
    columnGap: node.columnGap,
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
    overflow: node.overflow,
    backgroundColor: node.backgroundColor || 'transparent',
  } as const

  // Build scrollbar options if any are set
  const scrollbarOptions =
    node.showScrollArrows ||
    node.scrollbarForeground ||
    node.scrollbarBackground
      ? {
          showArrows: node.showScrollArrows,
          trackOptions: {
            foregroundColor: node.scrollbarForeground,
            backgroundColor: node.scrollbarBackground,
          },
        }
      : undefined

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      visible={node.visible !== false}
      style={buildPositioningStyle(node)}
    >
      <scrollbox
        border={borderValue}
        borderStyle={hasBorder ? node.borderStyle || 'single' : 'single'}
        borderColor={node.borderColor}
        visible={node.visible !== false}
        title={node.title}
        titleAlignment={node.titleAlignment}
        stickyScroll={node.stickyScroll}
        stickyStart={node.stickyStart}
        scrollX={node.scrollX}
        scrollY={node.scrollY}
        viewportCulling={node.viewportCulling}
        style={{
          ...scrollboxStyle,
          width: '100%', // Fill wrapper
          height: '100%', // Fill wrapper
          contentOptions: {
            flexDirection: node.flexDirection || 'column',
            gap: node.gap,
          },
          scrollbarOptions,
        }}
      >
        {children}
      </scrollbox>
    </box>
  )
}

// =============================================================================
// SCROLLBOX PROPERTIES PANEL
// =============================================================================

interface ScrollboxPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function ScrollboxProperties({
  node: genericNode,
  onUpdate,
  focusedField,
  setFocusedField,
  collapsed,
  onToggle,
  pickingForField,
  setPickingForField,
}: ScrollboxPropertiesProps) {
  const node = genericNode as ScrollboxRenderable
  return (
    <box id="section-scrollbox" style={{ flexDirection: 'column' }}>
      <SectionHeader
        title="↕ Scrollbox"
        collapsed={collapsed}
        onToggle={onToggle}
      />
      {!collapsed && (
        <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
          {/* Scroll direction toggles */}
          <box style={{ flexDirection: 'row', gap: 2 }}>
            <ToggleProp
              label="X"
              value={node.scrollX === true}
              onChange={(v) => onUpdate({ scrollX: v })}
            />
            <ToggleProp
              label="Y"
              value={node.scrollY !== false}
              onChange={(v) => onUpdate({ scrollY: v })}
            />
            <ToggleProp
              label="Cull"
              value={node.viewportCulling === true}
              onChange={(v) => onUpdate({ viewportCulling: v })}
            />
          </box>

          {/* Sticky scroll options */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Sticky ─</text>
          </box>

          <box style={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
            <ToggleProp
              label="Sticky"
              value={node.stickyScroll === true}
              onChange={(v) => onUpdate({ stickyScroll: v })}
            />
            {node.stickyScroll && (
              <box style={{ flexGrow: 1 }}>
                <SelectProp
                  label="To"
                  value={node.stickyStart || 'bottom'}
                  options={['bottom', 'top', 'left', 'right']}
                  onChange={(v) => onUpdate({ stickyStart: v as any })}
                />
              </box>
            )}
          </box>

          {/* Scrollbar styling */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Scrollbar ─</text>
          </box>

          <ToggleProp
            label="Arrows"
            value={node.showScrollArrows === true}
            onChange={(v) => onUpdate({ showScrollArrows: v })}
          />

          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="FG"
                field="scrollbarForeground"
                value={node.scrollbarForeground}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="BG"
                field="scrollbarBackground"
                value={node.scrollbarBackground}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  )
}
