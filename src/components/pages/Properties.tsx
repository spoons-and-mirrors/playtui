import { useState } from "react"
import type { ElementNode, BorderSide, PropertySection, BoxNode, ScrollboxNode } from "../../lib/types"
import { isContainerNode } from "../../lib/types"
import { PROPERTIES, SECTION_LABELS, SECTION_ORDER, EXPANDED_BY_DEFAULT } from "../../lib/constants"
import { 
  NumberProp, SelectProp, ToggleProp, StringProp, SizeProp, 
  SectionHeader, BorderSidesProp, SpacingControl, ColorPropWithHex, 
  PositionControl, FlexDirectionPicker, FlexAlignmentGrid, GapControl,
  OverflowPicker, DimensionsControl
} from "../controls"
import { ELEMENT_REGISTRY } from "../elements"
import { COLORS } from "../../theme"

// Sections that are element-specific and handled by registry Properties components
const ELEMENT_SPECIFIC_SECTIONS: PropertySection[] = [
  "border", "text", "input", "textarea", "select", "scrollbox", "slider", "asciiFont", "tabSelect"
]

// Helper type for dynamic property access
type AnyNodeProps = Record<string, unknown>

interface PropertyPaneProps {
  node: ElementNode
  onUpdate: (updates: Partial<ElementNode>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
}

export function PropertyPane({ node, onUpdate, focusedField, setFocusedField }: PropertyPaneProps) {
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
        <NumberProp key={key} label={prop.label} value={typeof val === "number" ? val : 0}
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
        <ColorPropWithHex key={key} label={prop.label} value={String(val || "")} focused={focusedField === prop.key}
          onFocus={() => setFocusedField(prop.key)} onChange={(v) => onUpdate({ [prop.key]: v } as Partial<ElementNode>)} />
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

  // Render spacing sections (padding/margin) with visual SpacingControl
  const renderSpacingSection = (section: "padding" | "margin") => {
    const isCollapsed = collapsed[section]
    const handleChange = (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => {
      const prefix = section
      if (key === "all") onUpdate({ [prefix]: val } as Partial<ElementNode>)
      else onUpdate({ [`${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`]: val } as Partial<ElementNode>)
    }
    
    // Padding only applies to container nodes
    if (section === "padding" && !isContainerNode(node)) return null
    const container = node as BoxNode | ScrollboxNode
    
    const values = section === "padding"
      ? { all: container.padding, top: container.paddingTop, right: container.paddingRight, bottom: container.paddingBottom, left: container.paddingLeft }
      : { all: node.margin, top: node.marginTop, right: node.marginRight, bottom: node.marginBottom, left: node.marginLeft }

    return (
      <box key={section} id={`section-${section}`} style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS[section]} collapsed={isCollapsed} onToggle={() => toggleSection(section)} />
        {!isCollapsed && <box style={{ paddingLeft: 1 }}><SpacingControl label="" values={values} onChange={handleChange} /></box>}
      </box>
    )
  }

  // Render sizing section with DimensionsControl
  const renderSizingSection = () => {
    const isCollapsed = collapsed["sizing"]
    return (
      <box key="sizing" id="section-sizing" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["sizing"]} collapsed={isCollapsed} onToggle={() => toggleSection("sizing")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <DimensionsControl width={node.width} height={node.height} minWidth={node.minWidth} maxWidth={node.maxWidth}
              minHeight={node.minHeight} maxHeight={node.maxHeight} onChange={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>)} />
          </box>
        )}
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
              onJustifyChange={(v) => onUpdate({ justifyContent: v } as Partial<ElementNode>)} onAlignChange={(v) => onUpdate({ alignItems: v } as Partial<ElementNode>)} />
            {container.flexWrap === "wrap" && alignContentProp && renderProp(alignContentProp)}
            <GapControl gap={container.gap} rowGap={container.rowGap} colGap={container.columnGap}
              onChange={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>)} />
          </box>
        )}
      </box>
    )
  }

  // Render position section with visual control
  const renderPositionSection = () => {
    // Position applies to all elements now
    const isCollapsed = collapsed["position"]

    return (
      <box key="position" id="section-position" style={{ flexDirection: "column" }}>
        {/* Header with inline Rel/Abs tabs */}
        <box id="position-header" flexDirection="row" alignItems="center">
          <SectionHeader title={SECTION_LABELS["position"]} collapsed={isCollapsed} onToggle={() => toggleSection("position")} />
          {/* Rel/Abs tabs inline with title */}
          <box id="pos-mode-tabs" flexDirection="row" marginLeft={1}>
            <box
              id="pos-tab-rel"
              border={["left"]}
              borderStyle="heavy"
              borderColor={node.position !== "absolute" ? COLORS.accentBright : COLORS.muted}
              backgroundColor={COLORS.cardHover}
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
              border={["left"]}
              borderStyle="heavy"
              borderColor={node.position === "absolute" ? COLORS.accentBright : COLORS.muted}
              backgroundColor={COLORS.cardHover}
              paddingLeft={1}
              paddingRight={1}
              marginLeft={1}
              onMouseDown={() => onUpdate({ position: "absolute" } as Partial<ElementNode>)}
            >
              <text fg={node.position === "absolute" ? COLORS.accent : COLORS.muted} selectable={false}>
                {node.position === "absolute" ? <strong>Abs</strong> : "Abs"}
              </text>
            </box>
          </box>
        </box>
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <PositionControl
              x={node.x}
              y={node.y}
              zIndex={node.zIndex}
              onChange={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>)}
            />
          </box>
        )}
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
      collapsed: collapsed[section], onToggle: () => toggleSection(section)
    })
  }

  // Main section renderer
  const renderSection = (section: PropertySection) => {
    // Element-specific sections use registry
    if (ELEMENT_SPECIFIC_SECTIONS.includes(section)) {
      return renderElementSection(section)
    }
    // Custom visual sections
    if (section === "sizing") return renderSizingSection()
    if (section === "padding" || section === "margin") return renderSpacingSection(section)
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
    <scrollbox id="prop-pane-scroll" style={{ flexGrow: 1, contentOptions: { flexDirection: "column", gap: 0, paddingBottom: 2 } }}>
      <box id="element-header" style={{ marginBottom: 1, flexDirection: "row" }}>
        <box style={{ backgroundColor: COLORS.accent, paddingLeft: 1, paddingRight: 1, alignSelf: "flex-start" }}>
          <text fg={COLORS.bg}><strong>{node.type}</strong></text>
        </box>
      </box>
      {unsectioned.map(renderProp)}
      {activeSections.map(renderSection)}
    </scrollbox>
  )
}
