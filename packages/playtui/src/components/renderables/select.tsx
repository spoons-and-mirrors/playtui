import type { Renderable, SelectRenderable } from '../../lib/types'
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
// SELECT DEFAULTS
// =============================================================================

export const SELECT_DEFAULTS: Partial<SelectRenderable> = {
  width: 20,
  height: 5,
  options: ['Option 1', 'Option 2', 'Option 3'],
}

// =============================================================================
// SELECT RENDERER
// =============================================================================

interface SelectRendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function SelectRenderer({
  node: genericNode,
  onSelect,
  onHover,
  onDragStart,
}: SelectRendererProps) {
  const node = genericNode as SelectRenderable
  const options = node.options || ['Option 1', 'Option 2']
  const selBgColor = node.selectedBackgroundColor || COLORS.accent
  const textColor = node.textColor || COLORS.text
  const selTextColor = node.selectedTextColor || COLORS.bg

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
      {options.slice(0, 5).map((opt, i) => (
        <box
          key={i}
          style={{
            paddingLeft: 1,
            backgroundColor: i === 0 ? selBgColor : 'transparent',
          }}
        >
          <text fg={i === 0 ? selTextColor : textColor}>
            {i === 0 ? '▶ ' : '  '}
            {opt}
          </text>
        </box>
      ))}
      {node.showScrollIndicator && options.length > 5 && (
        <text fg={COLORS.muted} style={{ paddingLeft: 1 }}>
          {' '}
          ↓ more...
        </text>
      )}
    </box>
  )
}

// =============================================================================
// SELECT PROPERTIES PANEL
// =============================================================================

interface SelectPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function SelectProperties({
  node: genericNode,
  onUpdate,
  focusedField,
  setFocusedField,
  collapsed,
  onToggle,
  pickingForField,
  setPickingForField,
}: SelectPropertiesProps) {
  const node = genericNode as SelectRenderable
  return (
    <box id="section-select" style={{ flexDirection: 'column' }}>
      <SectionHeader
        title="≡ Select"
        collapsed={collapsed}
        onToggle={onToggle}
      />
      {!collapsed && (
        <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
          {/* Options input */}
          <StringProp
            label="Options"
            value={(node.options || []).join(', ')}
            focused={focusedField === 'options'}
            onFocus={() => setFocusedField('options')}
            onChange={(v) =>
              onUpdate({
                options: v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />

          {/* Behavior toggles */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Behavior ─</text>
          </box>

          <box style={{ flexDirection: 'row', gap: 2 }}>
            <ToggleProp
              label="Scroll"
              value={node.showScrollIndicator === true}
              onChange={(v) => onUpdate({ showScrollIndicator: v })}
            />
            <ToggleProp
              label="Wrap"
              value={node.wrapSelection === true}
              onChange={(v) => onUpdate({ wrapSelection: v })}
            />
          </box>

          <ToggleProp
            label="Show Desc"
            value={node.showDescription === true}
            onChange={(v) => onUpdate({ showDescription: v })}
          />

          {/* Spacing controls */}
          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                id="select-spacing"
                label="Spacing"
                value={node.itemSpacing ?? 0}
                min={0}
                max={10}
                onChange={(v) => onUpdate({ itemSpacing: v || undefined })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <NumberProp
                id="select-fast-step"
                label="Fast Step"
                value={node.fastScrollStep ?? 5}
                min={1}
                max={20}
                onChange={(v) => onUpdate({ fastScrollStep: v })}
              />
            </box>
          </box>

          {/* Colors section */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Colors ─</text>
          </box>

          {/* Background colors row */}
          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="BG"
                field="backgroundColor"
                value={node.backgroundColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="Sel BG"
                field="selectedBackgroundColor"
                value={node.selectedBackgroundColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
          </box>

          {/* Text colors row */}
          <box style={{ flexDirection: 'row', gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="Text"
                field="textColor"
                value={node.textColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="Sel Text"
                field="selectedTextColor"
                value={node.selectedTextColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
          </box>

          {/* Description colors - only when showDescription is on */}
          {node.showDescription && (
            <box style={{ flexDirection: 'row', gap: 1 }}>
              <box style={{ flexGrow: 1 }}>
                <ManagedColorControl
                  label="Desc"
                  field="descriptionColor"
                  value={node.descriptionColor}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  onUpdate={onUpdate}
                  pickingForField={pickingForField}
                  setPickingForField={setPickingForField}
                />
              </box>
              <box style={{ flexGrow: 1 }}>
                <ManagedColorControl
                  label="Sel Desc"
                  field="selectedDescriptionColor"
                  value={node.selectedDescriptionColor}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  onUpdate={onUpdate}
                  pickingForField={pickingForField}
                  setPickingForField={setPickingForField}
                />
              </box>
            </box>
          )}
        </box>
      )}
    </box>
  )
}
