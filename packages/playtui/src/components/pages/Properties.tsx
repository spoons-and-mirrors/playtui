import { useState, useRef, createContext, useContext } from "react"
import { MouseButton, type MouseEvent, type ScrollBoxRenderable } from "@opentui/core"
import type { ElementNode, BorderSide, PropertySection, BoxNode, ScrollboxNode, TextNode } from "../../lib/types"
import { isContainerNode } from "../../lib/types"
import { PROPERTIES, SECTION_LABELS, SECTION_ORDER, EXPANDED_BY_DEFAULT } from "../../lib/constants"
import { 
   NumberProp, SelectProp, ToggleProp, StringProp, SizeProp, 
   SectionHeader, BorderSidesProp, SpacingControl, MarginControl, ColorControl, 
   PositionControl, FlexDirectionPicker, FlexAlignmentGrid, GapControl,
   OverflowPicker, DimensionsControl, PaletteProp
} from "../controls"
import { ValueSlider } from "../ui/ValueSlider"
import { ELEMENT_REGISTRY } from "../elements"
import { COLORS } from "../../theme"

// Drag capture context - allows value controls to register drags at the panel level
// This ensures dragging continues even when mouse leaves the control bounds
export type DragRegisterFn = (
  startX: number,
  startY: number,
  startValue: number,
  onChange: (value: number) => void,
  onChangeEnd?: (value: number) => void
) => void

export const DragCaptureContext = createContext<DragRegisterFn | null>(null)
export const useDragCapture = () => useContext(DragCaptureContext)

// Sections that are element-specific and handled by registry Properties components
const ELEMENT_SPECIFIC_SECTIONS: PropertySection[] = [
  "border", "text", "input", "textarea", "select", "scrollbox", "slider", "asciiFont", "tabSelect"
]

// Helper type for dynamic property access
type AnyNodeProps = Record<string, unknown>

interface PropertyPaneProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>, pushHistory?: boolean) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  // Palette support
  palettes?: Array<{ id: string; name: string; swatches: Array<{ id: string; color: string }> }>
  activePaletteIndex?: number
  onShowHex?: (color: string) => void
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
}

export function PropertyPane({ node, onUpdate, focusedField, setFocusedField, palettes, activePaletteIndex, onShowHex, onUpdateSwatch, onChangePalette }: PropertyPaneProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    SECTION_ORDER.forEach(section => {
      initial[section] = !EXPANDED_BY_DEFAULT.includes(section)
    })
    return initial
  })

  const [pickingForField, setPickingForField] = useState<string | null>(null)

  const scrollRef = useRef<ScrollBoxRenderable>(null)

  // Drag capture system for value controls (sliders, counters)
  // This allows drag to continue even when mouse leaves the control bounds
  const activeDrag = useRef<{
    startX: number
    startY: number
    startValue: number
    lastValue: number
    hasMoved: boolean
    onChange: (value: number) => void
    onChangeEnd?: (value: number) => void
  } | null>(null)

  const handlePanelDrag = (e: MouseEvent) => {
    if (!activeDrag.current) return
    const deltaX = e.x - activeDrag.current.startX
    const deltaY = activeDrag.current.startY - e.y // up = positive
    const next = activeDrag.current.startValue + deltaX + deltaY
    activeDrag.current.lastValue = next
    activeDrag.current.hasMoved = true
    activeDrag.current.onChange(next)
  }

  const handlePanelDragEnd = () => {
    if (!activeDrag.current) return
    // Only call onChangeEnd if drag actually moved
    if (activeDrag.current.hasMoved && activeDrag.current.onChangeEnd) {
      activeDrag.current.onChangeEnd(activeDrag.current.lastValue)
    }
    activeDrag.current = null
  }

  const registerDrag = (startX: number, startY: number, startValue: number, onChange: (v: number) => void, onChangeEnd?: (v: number) => void) => {
    activeDrag.current = { startX, startY, startValue, lastValue: startValue, hasMoved: false, onChange, onChangeEnd }
  }

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const props = PROPERTIES.filter((p) => !p.appliesTo || p.appliesTo.includes(node.type))
  const unsectioned = props.filter((p) => !p.section)
  
  // Get active sections: sections with props defined in PROPERTIES + element-specific sections for this node type
  const sectionToType: Record<string, string> = {
    border: "box", text: "text", input: "input", textarea: "textarea",
    select: "select", scrollbox: "scrollbox", slider: "slider",
    asciiFont: "ascii-font", tabSelect: "tab-select"
  }
  const activeSections = SECTION_ORDER.filter(section => {
    // Include if there are props for this section
    if (props.some(p => p.section === section)) return true
    // Include element-specific sections for matching node type
    if (ELEMENT_SPECIFIC_SECTIONS.includes(section) && sectionToType[section] === node.type) return true
    return false
  })

  const renderProp = (prop: (typeof props)[0]) => {
    const nodeProps = node as unknown as AnyNodeProps
    const val = nodeProps[prop.key]
    const key = prop.key

    if (prop.type === "number") {
      return (
        <NumberProp key={key} id={`prop-${prop.key}`} label={prop.label} value={typeof val === "number" ? val : 0}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} min={prop.min} max={prop.max} />
      )
    }
    if (prop.type === "size") {
      return (
        <SizeProp key={key} label={prop.label} value={val as number | "auto" | `${number}%` | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    if (prop.type === "select" && prop.options) {
      return (
        <SelectProp key={key} label={prop.label} value={String(val || prop.options[0])} options={prop.options}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    if (prop.type === "color") {
      return (
        <ColorControl key={key} label={prop.label} value={String(val || "")} focused={focusedField === prop.key}
          onFocus={() => setFocusedField(prop.key)} onBlur={() => setFocusedField(null)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
          pickMode={pickingForField === prop.key} onPickStart={() => setPickingForField(prop.key)} />
      )
    }
    if (prop.type === "toggle") {
      return (
        <ToggleProp key={key} label={prop.label} value={Boolean(val)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    if (prop.type === "borderSides") {
      return (
        <BorderSidesProp key={key} label={prop.label} value={val as BorderSide[] | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    return (
      <StringProp key={key} label={prop.label} value={String(val || "")} focused={focusedField === prop.key}
        onFocus={() => setFocusedField(prop.key)} onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
    )
  }

  // Render padding section - non-collapsible, all inline
  const renderPaddingSection = () => {
    if (!isContainerNode(node) && node.type !== "text") return null
    const container = node as BoxNode | ScrollboxNode | TextNode

    const values = {
      top: container.paddingTop ?? 0,
      right: container.paddingRight ?? 0,
      bottom: container.paddingBottom ?? 0,
      left: container.paddingLeft ?? 0,
    }

    const handleChange = (key: "top" | "right" | "bottom" | "left", val: number) => {
      const propKey = `padding${key.charAt(0).toUpperCase()}${key.slice(1)}`
      onUpdate({ [propKey]: val } as Partial<ElementNode>, false)
    }

    const handleChangeEnd = (key: "top" | "right" | "bottom" | "left", val: number) => {
      const propKey = `padding${key.charAt(0).toUpperCase()}${key.slice(1)}`
      onUpdate({ [propKey]: val } as Partial<ElementNode>, true)
    }

    return (
      <box key="padding" id="section-padding" flexDirection="row" alignItems="center" justifyContent="space-between" marginTop={1}>
        <text fg={COLORS.text}><strong>Padding</strong></text>
        <box id="padding-sliders" flexDirection="row" gap={1}>
          <ValueSlider
            id="padding-t"
            label="t"
            property="paddingTop"
            value={values.top}
            onChange={(v) => handleChange("top", v)}
            onChangeEnd={(v) => handleChangeEnd("top", v)}
          />
          <ValueSlider
            id="padding-r"
            label="r"
            property="paddingRight"
            value={values.right}
            onChange={(v) => handleChange("right", v)}
            onChangeEnd={(v) => handleChangeEnd("right", v)}
          />
          <ValueSlider
            id="padding-b"
            label="b"
            property="paddingBottom"
            value={values.bottom}
            onChange={(v) => handleChange("bottom", v)}
            onChangeEnd={(v) => handleChangeEnd("bottom", v)}
          />
          <ValueSlider
            id="padding-l"
            label="l"
            property="paddingLeft"
            value={values.left}
            onChange={(v) => handleChange("left", v)}
            onChangeEnd={(v) => handleChangeEnd("left", v)}
          />
        </box>

      </box>
    )
  }

  // Render margin section - non-collapsible, all inline
  const renderMarginSection = () => {
    const values = {
      top: node.marginTop ?? 0,
      right: node.marginRight ?? 0,
      bottom: node.marginBottom ?? 0,
      left: node.marginLeft ?? 0,
    }

    const handleChange = (key: "top" | "right" | "bottom" | "left", val: number | undefined) => {
      if (key === "top") onUpdate({ marginTop: val } as Partial<ElementNode>, false)
      if (key === "right") onUpdate({ marginRight: val } as Partial<ElementNode>, false)
      if (key === "bottom") onUpdate({ marginBottom: val } as Partial<ElementNode>, false)
      if (key === "left") onUpdate({ marginLeft: val } as Partial<ElementNode>, false)
    }

    const handleChangeEnd = (key: "top" | "right" | "bottom" | "left", val: number | undefined) => {
      if (key === "top") onUpdate({ marginTop: val } as Partial<ElementNode>, true)
      if (key === "right") onUpdate({ marginRight: val } as Partial<ElementNode>, true)
      if (key === "bottom") onUpdate({ marginBottom: val } as Partial<ElementNode>, true)
      if (key === "left") onUpdate({ marginLeft: val } as Partial<ElementNode>, true)
    }

    return (
      <box key="margin" id="section-margin" flexDirection="row" alignItems="center" justifyContent="space-between" marginTop={1}>
        <text fg={COLORS.text}><strong>Margin</strong></text>
        <box id="margin-sliders" flexDirection="row" gap={1}>
          <ValueSlider
            id="margin-t"
            label="t"
            property="marginTop"
            value={values.top}
            onChange={(v) => handleChange("top", v)}
            onChangeEnd={(v) => handleChangeEnd("top", v)}
          />
          <ValueSlider
            id="margin-r"
            label="r"
            property="marginRight"
            value={values.right}
            onChange={(v) => handleChange("right", v)}
            onChangeEnd={(v) => handleChangeEnd("right", v)}
          />
          <ValueSlider
            id="margin-b"
            label="b"
            property="marginBottom"
            value={values.bottom}
            onChange={(v) => handleChange("bottom", v)}
            onChangeEnd={(v) => handleChangeEnd("bottom", v)}
          />
          <ValueSlider
            id="margin-l"
            label="l"
            property="marginLeft"
            value={values.left}
            onChange={(v) => handleChange("left", v)}
            onChangeEnd={(v) => handleChangeEnd("left", v)}
          />
        </box>

      </box>
    )
  }


  // Render dimensions section - non-collapsible
  const renderDimensionsSection = () => {
    return (
      <box key="dimensions" id="section-dimensions" style={{ flexDirection: "column", marginTop: 1 }}>
        <text fg={COLORS.text}><strong>Dimensions</strong></text>
        <box style={{ flexDirection: "column", gap: 0 }}>
          <DimensionsControl 
            width={node.width} 
            height={node.height}
            flexGrow={node.flexGrow}
            minWidth={node.minWidth}
            maxWidth={node.maxWidth}
            minHeight={node.minHeight}
            maxHeight={node.maxHeight}
            onChange={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>, false)}
            onChangeEnd={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>, true)}
            onBatchUpdate={(updates) => onUpdate(updates as Partial<ElementNode>, false)}
            onBatchUpdateEnd={(updates) => onUpdate(updates as Partial<ElementNode>, true)}
          />
        </box>
      </box>
    )
  }

  // Render flex container section with visual controls
  const renderFlexContainerSection = () => {
    if (!isContainerNode(node)) return null
    const container = node as BoxNode | ScrollboxNode
    
    const isCollapsed = collapsed["flexContainer"]
    const wrapProp = props.find(p => p.key === "flexWrap")
    const alignContentProp = props.find(p => p.key === "alignContent")

    return (
      <box key="flexContainer" id="section-flexContainer" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["flexContainer"]} collapsed={isCollapsed} onToggle={() => toggleSection("flexContainer")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <FlexDirectionPicker value={container.flexDirection} onChange={(v) => onUpdate({ flexDirection: v } as Partial<ElementNode>)} />
            {wrapProp && renderProp(wrapProp)}
            <FlexAlignmentGrid justify={container.justifyContent} align={container.alignItems} direction={container.flexDirection}
              onJustifyChange={(v) => onUpdate({ justifyContent: v } as Partial<ElementNode>)} 
              onAlignChange={(v) => onUpdate({ alignItems: v } as Partial<ElementNode>)} 
              onBothChange={(j, a) => onUpdate({ justifyContent: j, alignItems: a } as Partial<ElementNode>)} />
            {container.flexWrap === "wrap" && alignContentProp && renderProp(alignContentProp)}
            <box id="flex-gap-sliders" flexDirection="column" gap={1} marginTop={1}>
              <GapControl
                label="gap"
                property="gap"
                value={container.gap}
                onChange={(v) => onUpdate({ gap: v } as Partial<ElementNode>)}
                onChangeEnd={(v) => onUpdate({ gap: v } as Partial<ElementNode>, true)}
              />
              <GapControl
                label="rowGap"
                property="rowGap"
                value={container.rowGap}
                onChange={(v) => onUpdate({ rowGap: v } as Partial<ElementNode>)}
                onChangeEnd={(v) => onUpdate({ rowGap: v } as Partial<ElementNode>, true)}
              />
              <GapControl
                label="colGap"
                property="columnGap"
                value={container.columnGap}
                onChange={(v) => onUpdate({ columnGap: v } as Partial<ElementNode>)}
                onChangeEnd={(v) => onUpdate({ columnGap: v } as Partial<ElementNode>, true)}
              />
            </box>
          </box>
        )}
      </box>
    )
  }

  // Render position section - non-collapsible
  const renderPositionSection = () => {
    return (
      <box key="position" id="section-position" flexDirection="column">
        {/* Rel/Abs tabs on top line, right-aligned */}
        <box id="pos-mode-tabs" flexDirection="row" gap={1} justifyContent="flex-end" marginBottom={1}>
          <box
            id="pos-tab-rel"
            border={["right"]}
            borderStyle="heavy"
            borderColor={node.position !== "absolute" ? COLORS.accent : "transparent"}
            backgroundColor={COLORS.bg}
            paddingLeft={1}
            paddingRight={1}
            onMouseDown={() => onUpdate({ position: "relative" } as Partial<ElementNode>)}
          >
            <text fg={node.position !== "absolute" ? COLORS.accent : COLORS.muted} selectable={false}>
              {node.position !== "absolute" ? <strong>Rel</strong> : "Rel"}
            </text>
          </box>
          <box
            id="pos-tab-abs"
            border={["right"]}
            borderStyle="heavy"
            borderColor={node.position === "absolute" ? COLORS.accent : "transparent"}
            backgroundColor={COLORS.bg}
            paddingLeft={1}
            paddingRight={1}
            onMouseDown={() => onUpdate({ position: "absolute" } as Partial<ElementNode>)}
          >
            <text fg={node.position === "absolute" ? COLORS.accent : COLORS.muted} selectable={false}>
              {node.position === "absolute" ? <strong>Abs</strong> : "Abs"}
            </text>
          </box>
        </box>
        {/* Position title left, x y z right */}
        <box id="pos-row" flexDirection="row" alignItems="center" justifyContent="space-between">
          <text fg={COLORS.text}><strong>Position</strong></text>
          <box id="pos-xyz" flexDirection="row" gap={1}>
            <ValueSlider id="pos-x" label="x" property="x" value={node.x ?? 0} onChange={(v) => onUpdate({ x: v } as Partial<ElementNode>, false)} onChangeEnd={(v) => onUpdate({ x: v } as Partial<ElementNode>, true)} />
            <ValueSlider id="pos-y" label="y" property="y" value={node.y ?? 0} onChange={(v) => onUpdate({ y: v } as Partial<ElementNode>, false)} onChangeEnd={(v) => onUpdate({ y: v } as Partial<ElementNode>, true)} />
            <ValueSlider id="pos-z" label="z" property="zIndex" value={node.zIndex ?? 0} onChange={(v) => onUpdate({ zIndex: v } as Partial<ElementNode>, false)} onChangeEnd={(v) => onUpdate({ zIndex: v } as Partial<ElementNode>, true)} />
          </box>
        </box>
      </box>
    )
  }

  // Render overflow section
  const renderOverflowSection = () => {
    if (!isContainerNode(node)) return null
    const container = node as BoxNode | ScrollboxNode
    
    const isCollapsed = collapsed["overflow"]
    const overflowProp = props.find(p => p.key === "overflow")
    if (!overflowProp) return null

    return (
      <box key="overflow" id="section-overflow" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["overflow"]} collapsed={isCollapsed} onToggle={() => toggleSection("overflow")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <OverflowPicker value={container.overflow} onChange={(v) => onUpdate({ overflow: v } as Partial<ElementNode>)} />
          </box>
        )}
      </box>
    )
  }

  // Render element-specific section using registry
  const renderElementSection = (section: PropertySection) => {
    // Map section name to element type that owns it
    const sectionToType: Record<string, string> = {
      border: "box", text: "text", input: "input", textarea: "textarea",
      select: "select", scrollbox: "scrollbox", slider: "slider",
      asciiFont: "ascii-font", tabSelect: "tab-select"
    }

    // Only render if this section belongs to the current element type
    const ownerType = sectionToType[section]
    // Border section applies to both box and scrollbox
    if (section === "border") {
      if (node.type !== "box" && node.type !== "scrollbox") return null
    } else if (ownerType !== node.type) {
      return null
    }

    // For border section on scrollbox, use box's Properties component
    const entry = section === "border" && node.type === "scrollbox" 
      ? ELEMENT_REGISTRY["box"] 
      : ELEMENT_REGISTRY[node.type]
    if (!entry?.Properties) return null

    return entry.Properties({
      node, onUpdate, focusedField, setFocusedField,
      collapsed: collapsed[section], onToggle: () => toggleSection(section),
      palettes, activePaletteIndex, onUpdateSwatch, onChangePalette,
      pickingForField, setPickingForField
    })
  }

  // Main section renderer
  const renderSection = (section: PropertySection) => {
    // Element-specific sections use registry
    if (ELEMENT_SPECIFIC_SECTIONS.includes(section)) {
      return renderElementSection(section)
    }
    // Custom visual sections
    if (section === "dimensions") return renderDimensionsSection()
    if (section === "padding") return renderPaddingSection()
    if (section === "margin") return renderMarginSection()
    if (section === "flexContainer") return renderFlexContainerSection()
    if (section === "position") return renderPositionSection()
    if (section === "overflow") return renderOverflowSection()

    // Generic section rendering
    const sectionProps = props.filter((p) => p.section === section)
    if (sectionProps.length === 0) return null
    const isCollapsed = collapsed[section]

    return (
      <box key={section} id={`section-${section}`} style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS[section]} collapsed={isCollapsed} onToggle={() => toggleSection(section)} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>{sectionProps.map(renderProp)}</box>
        )}
      </box>
    )
  }

  return (
    <DragCaptureContext.Provider value={registerDrag}>
      <scrollbox 
        id="prop-pane-scroll" 
        ref={scrollRef}
        style={{ flexGrow: 1, contentOptions: { flexDirection: "column", gap: 0, paddingBottom: 2 } }}
        scrollbarOptions={{
          trackOptions: { foregroundColor: "transparent", backgroundColor: "transparent" }
        }}
        onMouseScroll={(e) => {
          const sb = scrollRef.current
          if (!sb || !e.scroll) return
          const delta = e.scroll.direction === "up" ? -1 : 1
          sb.scrollBy(delta * 6)
        }}
        onMouseDrag={handlePanelDrag}
        onMouseDragEnd={handlePanelDragEnd}
        onMouseDown={(e) => {
          // Clicking on the panel background (not on controls) deselects focused fields
          // Controls that should maintain focus will stopPropagation
          if (e.target === scrollRef.current) {
            setFocusedField(null)
            setPickingForField(null)
          }
        }}
      >
        {/* Palette header - centered */}
        {palettes && palettes.length > 0 && (
          <box id="element-header" border={["bottom"]} borderColor={COLORS.border} style={{ marginBottom: 0, paddingBottom: 0, justifyContent: "center" }}>
            <PaletteProp
              palettes={palettes}
              activePaletteIndex={activePaletteIndex ?? 0}
              onShowHex={onShowHex}
              onUpdateSwatch={onUpdateSwatch}
              onChangePalette={onChangePalette}
              pickMode={pickingForField !== null}
              onPickComplete={(color) => {
                if (pickingForField) {
                  onUpdate({ [pickingForField]: color } as Partial<ElementNode>, true)
                  setPickingForField(null)
                }
              }}
            />
          </box>
        )}
        
        {unsectioned.map(renderProp)}
        {activeSections.map(renderSection)}
      </scrollbox>
    </DragCaptureContext.Provider>
  )
}
