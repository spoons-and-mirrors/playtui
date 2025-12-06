import type { ElementNode, BoxNode } from "../../lib/types"
import { COLORS } from "../../theme"
import {
  ToggleProp, SelectProp, StringProp, ColorPropWithHex, BorderSidesProp, SectionHeader
} from "../controls"

// =============================================================================
// BOX DEFAULTS
// =============================================================================

export const BOX_DEFAULTS: Partial<BoxNode> = {
  width: 12,
  height: 4,
  backgroundColor: COLORS.bgAlt,
  flexDirection: "column",
  border: true,
  borderStyle: "single",
  borderColor: COLORS.border,
}

// =============================================================================
// BOX RENDERER
// =============================================================================

interface BoxRendererProps {
  node: ElementNode
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
  children?: React.ReactNode
}

// Parse size value (number, "auto", or percentage string)
const parseSize = (val: number | "auto" | `${number}%` | undefined) => {
  if (val === undefined || val === "auto") return undefined
  return val
}

export function BoxRenderer({ node: genericNode, isSelected, isHovered, onSelect, onHover, children }: BoxRendererProps) {
  const node = genericNode as BoxNode
  const hasBorder = node.border === true
  const borderValue = hasBorder
    ? (node.borderSides && node.borderSides.length > 0 ? node.borderSides : true)
    : undefined

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
    top: node.top,
    right: node.right,
    bottom: node.bottom,
    left: node.left,
    zIndex: node.zIndex,

    // Overflow
    overflow: node.overflow,

    // Background
    backgroundColor: node.backgroundColor || "transparent",
  } as const

  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={(e) => { e.stopPropagation(); onSelect() }}
      onMouseOver={() => onHover(true)}
      onMouseOut={() => onHover(false)}
      border={borderValue}
      borderStyle={hasBorder ? (node.borderStyle || "single") : "single"}
      borderColor={node.borderColor}
      focusedBorderColor={node.focusedBorderColor}
      shouldFill={node.shouldFill}
      visible={node.visible !== false}
      title={node.title}
      titleAlignment={node.titleAlignment}
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
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
}

export function BoxBorderProperties({ node: genericNode, onUpdate, focusedField, setFocusedField, collapsed, onToggle }: BoxPropertiesProps) {
  const node = genericNode as BoxNode
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
              <ColorPropWithHex
                label="Color"
                value={node.borderColor || ""}
                focused={focusedField === "borderColor"}
                onFocus={() => setFocusedField("borderColor")}
                onChange={(v) => onUpdate({ borderColor: v })}
              />

              {/* Focused border color */}
              <ColorPropWithHex
                label="Focus Clr"
                value={node.focusedBorderColor || ""}
                focused={focusedField === "focusedBorderColor"}
                onFocus={() => setFocusedField("focusedBorderColor")}
                onChange={(v) => onUpdate({ focusedBorderColor: v })}
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

// List of box-specific property keys for filtering
export const BOX_PROPERTY_KEYS = [
  "border", "borderSides", "borderStyle", "borderColor", "focusedBorderColor",
  "shouldFill", "title", "titleAlignment", "backgroundColor", "visible"
] as const
