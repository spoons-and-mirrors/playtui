import type { MouseEvent } from "@opentui/core"
import type { Renderable, InputRenderable } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  StringProp, NumberProp, SelectProp, SectionHeader, ManagedColorControl
} from "../controls"
import { useRenderableMouseHandlers } from "./useRenderableMouseHandlers"
import { buildPositioningStyle } from "./styleHelpers"

// =============================================================================
// INPUT DEFAULTS
// =============================================================================

export const INPUT_DEFAULTS: Partial<InputRenderable> = {
  width: 20,
  height: 1,
  placeholder: "Enter text...",
}

// =============================================================================
// INPUT RENDERER
// =============================================================================

interface InputRendererProps {
  node: Renderable
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
}

export function InputRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart }: InputRendererProps) {
  const node = genericNode as InputRenderable
  
  const { handleMouseDown, handleMouseOver, handleMouseOut } = useRenderableMouseHandlers(onSelect, onHover, onDragStart)

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      visible={node.visible !== false}
      style={buildPositioningStyle(node)}
    >
      <text fg={node.placeholderColor || COLORS.muted}>
        {node.placeholder || "Input..."}
      </text>
    </box>
  )
}

// =============================================================================
// INPUT PROPERTIES PANEL
// =============================================================================

interface InputPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function InputProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle, pickingForField, setPickingForField }: InputPropertiesProps) {
  const node = genericNode as InputRenderable
  return (
    <box id="section-input" style={{ flexDirection: "column" }}>
      <SectionHeader title="▭ Input" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Placeholder */}
          <StringProp
            label="Placeholder"
            value={node.placeholder || ""}
            focused={focusedField === "placeholder"}
            onFocus={() => setFocusedField("placeholder")}
            onChange={(v) => onUpdate({ placeholder: v })}
          />

          {/* Max length */}
          <NumberProp
            id="input-max-len"
            label="Max Len"
            value={node.maxLength ?? 0}

            min={1}
            max={1000}
            onChange={(v) => onUpdate({ maxLength: v || undefined })}
          />

          {/* Colors section header */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Colors ─</text>
          </box>

          {/* Text colors row */}
          <box style={{ flexDirection: "row", gap: 1 }}>
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
                label="Foc Txt"
                field="focusedTextColor"
                value={node.focusedTextColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
          </box>

          {/* Background colors row */}
          <box style={{ flexDirection: "row", gap: 1 }}>
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
                label="Foc BG"
                field="focusedBackgroundColor"
                value={node.focusedBackgroundColor}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onUpdate={onUpdate}
                pickingForField={pickingForField}
                setPickingForField={setPickingForField}
              />
            </box>
          </box>

          {/* Placeholder color */}
          <ManagedColorControl
            label="Plchld Clr"
            field="placeholderColor"
            value={node.placeholderColor}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            onUpdate={onUpdate}
            pickingForField={pickingForField}
            setPickingForField={setPickingForField}
          />

          {/* Cursor section header */}
          <box style={{ marginTop: 1 }}>
            <text fg={COLORS.muted}>─ Cursor ─</text>
          </box>

          {/* Cursor style and color */}
          <box style={{ flexDirection: "row", gap: 1 }}>
            <box style={{ flexGrow: 1 }}>
              <SelectProp
                label="Style"
                value={node.cursorStyle || "block"}
                options={["block", "line", "underline"]}
                onChange={(v) => onUpdate({ cursorStyle: v as any })}
              />
            </box>
            <box style={{ flexGrow: 1 }}>
              <ManagedColorControl
                label="Color"
                field="cursorColor"
                value={node.cursorColor}
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
