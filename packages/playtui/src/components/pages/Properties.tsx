import { useState, useRef, createContext, useContext } from "react"
import { MouseButton, type MouseEvent, type ScrollBoxRenderable } from "@opentui/core"
import type { ElementNode, BorderSide, BoxNode, ScrollboxNode, TextNode } from "../../lib/types"
import { 
   NumberProp, SelectProp, ToggleProp, StringProp, SizeProp, 
   SectionHeader, BorderSidesProp, SpacingControl, MarginControl, ColorControl, 
   PositionControl, FlexDirectionPicker, FlexAlignmentGrid, GapControl,
    OverflowPicker, DimensionsControl
} from "../controls"
import { ELEMENT_REGISTRY, PROPERTY_SECTIONS, isContainerNode, type SerializableProp, type PropertySection } from "../elements"
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
    PROPERTY_SECTIONS.forEach((meta) => {
      initial[meta.id] = !meta.defaultExpanded
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

  // Get properties from the element registry - single source of truth
  const props = ELEMENT_REGISTRY[node.type].properties
  const unsectioned = props.filter((p) => !p.section)

  const activeSections = PROPERTY_SECTIONS
    .filter((meta) => {
      const section = meta.id
      if (props.some((p) => p.section === section)) return true
      if (meta.ownerTypes && meta.ownerTypes.includes(node.type)) return true
      return false
    })
    .map((meta) => meta.id)

  const renderProp = (prop: SerializableProp) => {
    const nodeProps = node as unknown as AnyNodeProps
    const val = nodeProps[prop.key]
    const key = prop.key
    const label = prop.label || prop.key

    if (prop.type === "number") {
      return (
        <NumberProp 
          key={key} 
          id={`prop-${prop.key}`} 
          label={label} 
          value={typeof val === "number" ? val : 0}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} 
          min={prop.min} 
          max={prop.max}
          property={prop.animatable ? prop.key : undefined}
        />
      )
    }
    if (prop.type === "size") {
      return (
        <SizeProp key={key} label={label} value={val as number | "auto" | `${number}%` | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    if (prop.type === "select" && prop.options) {
      return (
        <SelectProp key={key} label={label} value={String(val || prop.options[0])} options={prop.options}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    if (prop.type === "color") {
      return (
        <ColorControl key={key} label={label} value={String(val || "")} focused={focusedField === prop.key}
          onFocus={() => setFocusedField(prop.key)} onBlur={() => setFocusedField(null)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
          pickMode={pickingForField === prop.key} onPickStart={() => setPickingForField(prop.key)} />
      )
    }
    if (prop.type === "toggle" || prop.type === "boolean") {
      return (
        <ToggleProp key={key} label={label} value={Boolean(val)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    if (prop.type === "borderSides") {
      return (
        <BorderSidesProp key={key} label={label} value={val as BorderSide[] | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
      )
    }
    return (
      <StringProp key={key} label={label} value={String(val || "")} focused={focusedField === prop.key}
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

    const handleChange = (key: "top" | "right" | "bottom" | "left" | "all", val: number) => {
      if (key === "all") {
        onUpdate({
          paddingTop: val,
          paddingRight: val,
          paddingBottom: val,
          paddingLeft: val
        } as Partial<ElementNode>, false)
        return
      }
      const propKey = `padding${key.charAt(0).toUpperCase()}${key.slice(1)}`
      onUpdate({ [propKey]: val } as Partial<ElementNode>, false)
    }

    const handleChangeEnd = (key: "top" | "right" | "bottom" | "left" | "all", val: number) => {
      if (key === "all") {
        onUpdate({
          paddingTop: val,
          paddingRight: val,
          paddingBottom: val,
          paddingLeft: val
        } as Partial<ElementNode>, true)
        return
      }
      const propKey = `padding${key.charAt(0).toUpperCase()}${key.slice(1)}`
      onUpdate({ [propKey]: val } as Partial<ElementNode>, true)
    }

    // Using SpacingControl which wraps ValueCounter (supporting context menus)
    return (
      <box key="padding" id="section-padding" flexDirection="column" marginTop={1}>
        <SpacingControl
          label="Padding"
          values={values}
          properties={{
            top: "paddingTop",
            right: "paddingRight",
            bottom: "paddingBottom",
            left: "paddingLeft"
          }}
          onChange={(key, v) => handleChange(key, v ?? 0)}
          onChangeEnd={(key, v) => handleChangeEnd(key, v ?? 0)}
        />
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

    const handleChange = (key: "top" | "right" | "bottom" | "left" | "all", val: number | undefined) => {
      if (key === "all") {
        onUpdate({
          marginTop: val,
          marginRight: val,
          marginBottom: val,
          marginLeft: val
        } as Partial<ElementNode>, false)
        return
      }
      if (key === "top") onUpdate({ marginTop: val } as Partial<ElementNode>, false)
      if (key === "right") onUpdate({ marginRight: val } as Partial<ElementNode>, false)
      if (key === "bottom") onUpdate({ marginBottom: val } as Partial<ElementNode>, false)
      if (key === "left") onUpdate({ marginLeft: val } as Partial<ElementNode>, false)
    }

    const handleChangeEnd = (key: "top" | "right" | "bottom" | "left" | "all", val: number | undefined) => {
      if (key === "all") {
        onUpdate({
          marginTop: val,
          marginRight: val,
          marginBottom: val,
          marginLeft: val
        } as Partial<ElementNode>, true)
        return
      }
      if (key === "top") onUpdate({ marginTop: val } as Partial<ElementNode>, true)
      if (key === "right") onUpdate({ marginRight: val } as Partial<ElementNode>, true)
      if (key === "bottom") onUpdate({ marginBottom: val } as Partial<ElementNode>, true)
      if (key === "left") onUpdate({ marginLeft: val } as Partial<ElementNode>, true)
    }

    // Using SpacingControl which wraps ValueCounter (supporting context menus)
    return (
      <box key="margin" id="section-margin" flexDirection="column" marginTop={1}>
        <SpacingControl
          label="Margin"
          values={values}
          properties={{
            top: "marginTop",
            right: "marginRight",
            bottom: "marginBottom",
            left: "marginLeft"
          }}
          onChange={handleChange}
          onChangeEnd={handleChangeEnd}
        />
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
            onChange={(update, isFinal) => onUpdate(update as Partial<ElementNode>, isFinal)}
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
    const flexMeta = PROPERTY_SECTIONS.find((meta) => meta.id === "flexContainer")
    if (!flexMeta) return null

    return (
      <box key="flexContainer" id="section-flexContainer" style={{ flexDirection: "column" }}>
        <SectionHeader title={flexMeta.label} collapsed={isCollapsed} onToggle={() => toggleSection("flexContainer")} />

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
          <PositionControl 
            x={node.x} 
            y={node.y} 
            zIndex={node.zIndex}
            onChange={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>, false)}
            onChangeEnd={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>, true)}
          />
        </box>
      </box>
    )
  }

  // Render overflow section
  const renderOverflowSection = () => {
    if (!isContainerNode(node)) return null
    const container = node as BoxNode | ScrollboxNode
    
    const isCollapsed = collapsed["overflow"]
    const hasOverflowProp = props.some(p => p.key === "overflow")
    if (!hasOverflowProp) return null
    const overflowMeta = PROPERTY_SECTIONS.find((meta) => meta.id === "overflow")
    if (!overflowMeta) return null

    return (
      <box key="overflow" id="section-overflow" style={{ flexDirection: "column" }}>
        <SectionHeader title={overflowMeta.label} collapsed={isCollapsed} onToggle={() => toggleSection("overflow")} />

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
    const meta = PROPERTY_SECTIONS.find((s) => s.id === section)
    if (!meta) return null
    if (meta.ownerTypes && !meta.ownerTypes.includes(node.type)) return null

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
    const meta = PROPERTY_SECTIONS.find((s) => s.id === section)
    if (!meta) return null

    if (meta.ownerTypes && meta.ownerTypes.length > 0) {
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
        <SectionHeader title={meta.label} collapsed={isCollapsed} onToggle={() => toggleSection(section)} />
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
        style={{ flexGrow: 1, backgroundColor: COLORS.bgAlt, contentOptions: { flexDirection: "column", gap: 0, paddingBottom: 2, backgroundColor: COLORS.bgAlt } }}
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
        {unsectioned.map(renderProp)}
        {activeSections.map(renderSection)}
      </scrollbox>
    </DragCaptureContext.Provider>
  )
}
