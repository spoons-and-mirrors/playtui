import { useState } from "react"
import type { ElementNode, BorderSide, PropertySection } from "../lib/types"
import { PROPERTIES, SECTION_LABELS, SECTION_ORDER, EXPANDED_BY_DEFAULT } from "../lib/constants"
import { 
  NumberProp, SelectProp, ToggleProp, StringProp, SizeProp, 
  SectionHeader, BorderSidesProp, SpacingControl, ColorPropWithHex, 
  PositionControl, FlexDirectionPicker, FlexAlignmentGrid, GapControl,
  OverflowPicker, DimensionsControl
} from "./PropertyControls"
import { COLORS } from "../theme"

interface PropertyEditorProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
}

export function PropertyEditor({ node, onUpdate, focusedField, setFocusedField }: PropertyEditorProps) {
  // Initialize collapsed state - sections NOT in EXPANDED_BY_DEFAULT start collapsed
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    SECTION_ORDER.forEach(section => {
      initial[section] = !EXPANDED_BY_DEFAULT.includes(section)
    })
    return initial
  })

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const props = PROPERTIES.filter((p) => !p.appliesTo || p.appliesTo.includes(node.type))

  // Group properties by section
  const unsectioned = props.filter((p) => !p.section)
  
  // Get sections that have properties for this element, ordered by SECTION_ORDER
  const activeSections = SECTION_ORDER.filter(section => 
    props.some(p => p.section === section)
  )

  const renderProp = (prop: (typeof props)[0]) => {
    const val = node[prop.key]
    const key = prop.key

    if (prop.type === "number") {
      return (
        <NumberProp
          key={key}
          label={prop.label}
          value={typeof val === "number" ? val : 0}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
          min={prop.min}
          max={prop.max}
        />
      )
    }
    if (prop.type === "size") {
      return (
        <SizeProp
          key={key}
          label={prop.label}
          value={val as number | "auto" | `${number}%` | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
        />
      )
    }
    if (prop.type === "select" && prop.options) {
      return (
        <SelectProp
          key={key}
          label={prop.label}
          value={String(val || prop.options[0])}
          options={prop.options}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
        />
      )
    }
    if (prop.type === "color") {
      return (
        <ColorPropWithHex
          key={key}
          label={prop.label}
          value={String(val || "")}
          focused={focusedField === prop.key}
          onFocus={() => setFocusedField(prop.key)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
        />
      )
    }
    if (prop.type === "toggle") {
      return (
        <ToggleProp
          key={key}
          label={prop.label}
          value={Boolean(val)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
        />
      )
    }
    if (prop.type === "borderSides") {
      return (
        <BorderSidesProp
          key={key}
          label={prop.label}
          value={val as BorderSide[] | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
        />
      )
    }
    return (
      <StringProp
        key={key}
        label={prop.label}
        value={String(val || "")}
        focused={focusedField === prop.key}
        onFocus={() => setFocusedField(prop.key)}
        onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)}
      />
    )
  }

  // Render padding/margin sections with SpacingControl
  const renderSpacingSection = (section: "padding" | "margin") => {
    const isCollapsed = collapsed[section]
    const label = SECTION_LABELS[section]

    const handleSpacingChange = (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => {
      if (section === "padding") {
        if (key === "all") onUpdate({ padding: val } as Partial<ElementNode>)
        else if (key === "top") onUpdate({ paddingTop: val } as Partial<ElementNode>)
        else if (key === "right") onUpdate({ paddingRight: val } as Partial<ElementNode>)
        else if (key === "bottom") onUpdate({ paddingBottom: val } as Partial<ElementNode>)
        else if (key === "left") onUpdate({ paddingLeft: val } as Partial<ElementNode>)
      } else {
        if (key === "all") onUpdate({ margin: val } as Partial<ElementNode>)
        else if (key === "top") onUpdate({ marginTop: val } as Partial<ElementNode>)
        else if (key === "right") onUpdate({ marginRight: val } as Partial<ElementNode>)
        else if (key === "bottom") onUpdate({ marginBottom: val } as Partial<ElementNode>)
        else if (key === "left") onUpdate({ marginLeft: val } as Partial<ElementNode>)
      }
    }

    const values = section === "padding"
      ? { all: node.padding, top: node.paddingTop, right: node.paddingRight, bottom: node.paddingBottom, left: node.paddingLeft }
      : { all: node.margin, top: node.marginTop, right: node.marginRight, bottom: node.marginBottom, left: node.marginLeft }

    return (
      <box key={section} id={`section-${section}`} style={{ flexDirection: "column" }}>
        <SectionHeader title={label} collapsed={isCollapsed} onToggle={() => toggleSection(section)} />
        {!isCollapsed && (
          <box style={{ paddingLeft: 1 }}>
            <SpacingControl label="" values={values} onChange={handleSpacingChange} />
          </box>
        )}
      </box>
    )
  }

  // Render flex container section with visual controls
  const renderFlexContainerSection = () => {
    const isCollapsed = collapsed["flexContainer"]
    const wrapProp = props.find(p => p.key === "flexWrap")

    return (
      <box key="flexContainer" id="section-flexContainer" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["flexContainer"]} collapsed={isCollapsed} onToggle={() => toggleSection("flexContainer")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <FlexDirectionPicker
              value={node.flexDirection}
              onChange={(v) => onUpdate({ flexDirection: v })}
            />
            {wrapProp && renderProp(wrapProp)}
            <FlexAlignmentGrid
              justify={node.justifyContent}
              align={node.alignItems}
              direction={node.flexDirection}
              onJustifyChange={(v) => onUpdate({ justifyContent: v as any })}
              onAlignChange={(v) => onUpdate({ alignItems: v as any })}
            />
            <GapControl
              gap={node.gap}
              rowGap={node.rowGap}
              colGap={node.columnGap}
              onChange={(key, val) => onUpdate({ [key]: val } as Partial<ElementNode>)}
            />
          </box>
        )}
      </box>
    )
  }

  // Render position section with visual control
  const renderPositionSection = () => {
    const isCollapsed = collapsed["position"]

    const handlePosChange = (key: "top" | "right" | "bottom" | "left", val: number | undefined) => {
      onUpdate({ [key]: val } as Partial<ElementNode>)
    }

    const positionProp = props.find(p => p.key === "position")
    const zIndexProp = props.find(p => p.key === "zIndex")

    return (
      <box key="position" id="section-position" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["position"]} collapsed={isCollapsed} onToggle={() => toggleSection("position")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            {positionProp && renderProp(positionProp)}
            {node.position === "absolute" && (
              <PositionControl
                values={{ top: node.top, right: node.right, bottom: node.bottom, left: node.left }}
                onChange={handlePosChange}
              />
            )}
            {zIndexProp && renderProp(zIndexProp)}
          </box>
        )}
      </box>
    )
  }

  // Render overflow section with visual picker
  const renderOverflowSection = () => {
    const isCollapsed = collapsed["overflow"]
    const overflowProp = props.find(p => p.key === "overflow")
    if (!overflowProp) return null

    return (
      <box key="overflow" id="section-overflow" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["overflow"]} collapsed={isCollapsed} onToggle={() => toggleSection("overflow")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <OverflowPicker
              value={node.overflow}
              onChange={(v) => onUpdate({ overflow: v as any })}
            />
          </box>
        )}
      </box>
    )
  }

  // Render a generic section
  const renderSection = (section: PropertySection) => {
    // Special rendering for certain sections
    if (section === "sizing") return renderSizingSection()
    if (section === "padding" || section === "margin") return renderSpacingSection(section)
    if (section === "flexContainer") return renderFlexContainerSection()
    if (section === "position") return renderPositionSection()
    if (section === "overflow") return renderOverflowSection()

    const sectionProps = props.filter((p) => p.section === section)
    if (sectionProps.length === 0) return null
    
    const isCollapsed = collapsed[section]

    return (
      <box key={section} id={`section-${section}`} style={{ flexDirection: "column" }}>
        <SectionHeader
          title={SECTION_LABELS[section]}
          collapsed={isCollapsed}
          onToggle={() => toggleSection(section)}
        />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            {sectionProps.map(renderProp)}
          </box>
        )}
      </box>
    )
  }

  // Render sizing section with visual DimensionsControl
  const renderSizingSection = () => {
    const isCollapsed = collapsed["sizing"]
    
    type SizeVal = number | "auto" | `${number}%` | undefined
    const handleDimChange = (key: string, val: SizeVal) => {
      onUpdate({ [key]: val } as Partial<ElementNode>)
    }

    return (
      <box key="sizing" id="section-sizing" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["sizing"]} collapsed={isCollapsed} onToggle={() => toggleSection("sizing")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <DimensionsControl
              width={node.width}
              height={node.height}
              minWidth={node.minWidth}
              maxWidth={node.maxWidth}
              minHeight={node.minHeight}
              maxHeight={node.maxHeight}
              onChange={handleDimChange}
            />
          </box>
        )}
      </box>
    )
  }

  return (
    <scrollbox
      id="prop-editor-scroll"
      style={{
        flexGrow: 1,
        contentOptions: { flexDirection: "column", gap: 0, paddingBottom: 2 },
      }}
    >
      {/* Element header with type badge */}
      <box id="element-header" style={{ flexDirection: "row", gap: 1, marginBottom: 1, alignItems: "center" }}>
        <box style={{ backgroundColor: COLORS.accent, paddingLeft: 1, paddingRight: 1 }}>
          <text fg={COLORS.bg}>{node.type}</text>
        </box>
        <text fg={COLORS.text}>{node.name || "unnamed"}</text>
      </box>

      {/* Unsectioned props (like name) */}
      {unsectioned.map(renderProp)}

      {/* Sectioned props in defined order */}
      {activeSections.map(renderSection)}
    </scrollbox>
  )
}
