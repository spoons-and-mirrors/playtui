import type { Renderable, BoxRenderable } from "../../lib/types"
import type { MouseEvent } from "@opentui/core"
import { COLORS } from "../../theme"
import {
  ToggleProp, SelectProp, StringProp, ColorControl, SectionHeader, BorderSidesProp
} from "../controls"

// =============================================================================
// BOX DEFAULTS
// =============================================================================

export const BOX_DEFAULTS: Partial<BoxRenderable> = {
  width: 12,
  height: 4,
  backgroundColor: COLORS.bgAlt,
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  border: true,
  borderStyle: "single",
  borderColor: COLORS.border,
}

// =============================================================================
// BOX RENDERER
// =============================================================================

interface BoxRendererProps {
  node: Renderable
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  children?: React.ReactNode
}

// Parse size value (number, "auto", or percentage string)
const parseSize = (val: number | "auto" | `${number}%` | undefined) => {
  if (val === undefined || val === "auto") return undefined
  return val
}

export function BoxRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, onDragStart, children }: BoxRendererProps) {
  const node = genericNode as BoxRenderable
  const hasBorder = node.border === true
  
  // Enable dragging for all positioned elements
  const isDraggable = true

  const boxStyle = {
    // Sizing
    width: parseSize(node.width),
    height: parseSize(node.height),
    minWidth: node.minWidth,
    maxWidth: node.maxWidth,
    minHeight: node.minHeight,
    maxHeight: node.maxHeight,
    aspectRatio: node.aspectRatio,

    // Flex container
    flexDirection: node.flexDirection || "column",
    flexWrap: node.flexWrap,
    justifyContent: node.justifyContent,
    alignItems: node.alignItems,
    alignContent: node.alignContent,
    gap: node.gap,
    rowGap: node.rowGap,
    columnGap: node.columnGap,

    // Flex item
    flexGrow: node.flexGrow,
    flexShrink: node.flexShrink,
    flexBasis: node.flexBasis,
    alignSelf: node.alignSelf,

    // Padding
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,

    // Margin
    margin: node.margin,
    marginTop: node.marginTop,
    marginRight: node.marginRight,
    marginBottom: node.marginBottom,
    marginLeft: node.marginLeft,

    // Positioning
    position: node.position,
    top: node.y,
    left: node.x,
    zIndex: node.zIndex,

    // Overflow
    overflow: node.overflow,

    // Background
    backgroundColor: node.backgroundColor || "transparent",
  } as const

  // Drag start handler - canvas handles move/end
  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    onSelect()
    if (isDraggable && onDragStart) {
      onDragStart(e.x, e.y)
    }
  }

  // Border props - only include when border is enabled
  const borderProps = hasBorder ? {
    border: node.borderSides && node.borderSides.length > 0 ? node.borderSides : true,
    borderStyle: node.borderStyle || "single",
    borderColor: node.borderColor,
    focusedBorderColor: node.focusedBorderColor,
    customBorderChars: node.customBorderChars,
  } : {}

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={handleMouseDown}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      {...borderProps}
      shouldFill={node.shouldFill}
      visible={node.visible !== false}
      title={hasBorder ? node.title : undefined}
      titleAlignment={hasBorder ? node.titleAlignment : undefined}
      style={boxStyle}
    >
      {children}
    </box>
  )
}

// =============================================================================
// BOX PROPERTIES PANEL
// =============================================================================

interface BoxPropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function BoxBorderProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle, pickingForField, setPickingForField }: BoxPropertiesProps) {
  const node = genericNode as BoxRenderable
  const hasBorder = node.border === true

  return (
    <box id="section-border" style={{ flexDirection: "column" }}>
      <SectionHeader title="Border" collapsed={collapsed} onToggle={onToggle} />
      {!collapsed && (
        <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
          {/* Border toggle - always visible */}
          <ToggleProp
            label="Border"
            value={hasBorder}
            onChange={(v) => onUpdate({ border: v })}
          />

          {/* Border-specific controls - only when border is ON */}
          {hasBorder && (
            <>
              {/* Border sides */}
              <BorderSidesProp
                label="Sides"
                value={node.borderSides}
                onChange={(v) => onUpdate({ borderSides: v })}
              />

              {/* Border style */}
              <SelectProp
                label="Style"
                value={node.borderStyle || "single"}
                options={["single", "rounded", "double", "heavy"]}
                onChange={(v) => onUpdate({ borderStyle: v as any })}
              />

              {/* Border color */}
              <ColorControl
                label="Color"
                value={node.borderColor || ""}
                focused={focusedField === "borderColor"}
                onFocus={() => setFocusedField("borderColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ borderColor: v })}
                pickMode={pickingForField === "borderColor"}
                onPickStart={() => setPickingForField?.("borderColor")}
              />

              {/* Focused border color */}
              <ColorControl
                label="Focus Clr"
                value={node.focusedBorderColor || ""}
                focused={focusedField === "focusedBorderColor"}
                onFocus={() => setFocusedField("focusedBorderColor")}
                onBlur={() => setFocusedField(null)}
                onChange={(v) => onUpdate({ focusedBorderColor: v })}
                pickMode={pickingForField === "focusedBorderColor"}
                onPickStart={() => setPickingForField?.("focusedBorderColor")}
              />

              {/* Title */}
              <StringProp
                label="Title"
                value={node.title || ""}
                focused={focusedField === "title"}
                onFocus={() => setFocusedField("title")}
                onChange={(v) => onUpdate({ title: v })}
              />

              {/* Title alignment - only when title is set */}
              {node.title && (
                <SelectProp
                  label="Title Pos"
                  value={node.titleAlignment || "left"}
                  options={["left", "center", "right"]}
                  onChange={(v) => onUpdate({ titleAlignment: v as any })}
                />
              )}
            </>
          )}

          {/* shouldFill - always relevant for boxes even without border */}
          <ToggleProp
            label="Fill BG"
            value={node.shouldFill !== false}
            onChange={(v) => onUpdate({ shouldFill: v ? undefined : false })}
          />
        </box>
      )}
    </box>
  )
}
