import type { MouseEvent } from '@opentui/core'
import type { Renderable, TextareaRenderable } from '../../lib/types'
import { COLORS } from '../../theme'
import {
  StringProp,
  NumberProp,
  ToggleProp,
  SectionHeader,
  ManagedColorControl,
} from '../controls'
import { useRenderableMouseHandlers } from './useRenderableMouseHandlers'
import { buildPositioningStyle } from './styleHelpers'

// =============================================================================
// TEXTAREA DEFAULTS
// =============================================================================

export const TEXTAREA_DEFAULTS: Partial<TextareaRenderable> = {
  width: 30,
  height: 4,
  placeholder: 'Enter multi-line text...',
  minHeight: 1,
  maxHeight: 6,
}

// =============================================================================
// TEXTAREA RENDERER
// =============================================================================

interface TextareaRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function TextareaRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: TextareaRendererProps) {
  const node = genericNode as TextareaRenderable

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
      <text fg={node.placeholderColor || COLORS.muted} wrapMode="word">
        {node.initialValue || node.placeholder || 'Multi-line input...'}
      </text>
    </box>
  )
}

// =============================================================================
// TEXTAREA PROPERTIES PANEL
// =============================================================================

interface TextareaPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function TextareaProperties({
  node: genericNode,
  onUpdate,
  focusedField,
  setFocusedField,
  collapsed,
  onToggle,
  pickingForField,
  setPickingForField,
}: TextareaPropertiesProps) {
  const node = genericNode as TextareaRenderable
  return (
    <box id="section-textarea" style={{ flexDirection: 'column' }}>
      <SectionHeader
        title="▯ Textarea"
        collapsed={collapsed}
        onToggle={onToggle}
      />
      {!collapsed && (
        <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
          {/* Initial value */}
          <StringProp
            label="Initial"
            value={node.initialValue || ''}
            focused={focusedField === 'initialValue'}
            onFocus={() => setFocusedField('initialValue')}
            onChange={(v) => onUpdate({ initialValue: v })}
          />

          {/* Cursor options */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Cursor ─</text>
          </box>

          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ToggleProp
                label="Show"
                value={node.showCursor !== false}
                onChange={(v) =>
                  onUpdate({ showCursor: v ? undefined : false })
                }
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ToggleProp
                label="Blink"
                value={node.blinking !== false}
                onChange={(v) => onUpdate({ blinking: v ? undefined : false })}
              />
            </box>
          </box>

          {/* Scroll margin */}
          <NumberProp
            id="textarea-scroll-margin"
            label="Scroll Margin"
            value={node.scrollMargin ?? 0}
            min={0}
            max={10}
            onChange={(v) => onUpdate({ scrollMargin: v || undefined })}
          />

          {/* Tab indicator color */}
          <ManagedColorControl
            label="Tab Clr"
            field="tabIndicatorColor"
            value={node.tabIndicatorColor}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            onUpdate={onUpdate}
            pickingForField={pickingForField}
            setPickingForField={setPickingForField}
          />
        </box>
      )}
    </box>
  )
}
