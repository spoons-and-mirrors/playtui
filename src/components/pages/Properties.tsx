import { useState, useRef } from "react"
import type { InputRenderable } from "@opentui/core"
import type { ElementNode, BorderSide, PropertySection, BoxNode, ScrollboxNode } from "../../lib/types"
import { isContainerNode } from "../../lib/types"
import { PROPERTIES, SECTION_LABELS, SECTION_ORDER, EXPANDED_BY_DEFAULT } from "../../lib/constants"
import { 
   NumberProp, SelectProp, ToggleProp, StringProp, SizeProp, 
   SectionHeader, BorderSidesProp, SpacingControl, MarginControl, ColorPropWithHex, 
   PositionControl, FlexDirectionPicker, FlexAlignmentGrid, GapControl,
   OverflowPicker, DimensionsControl
} from "../controls"
import { ValueSlider } from "../ui/ValueSlider"
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
  const lastNameClickRef = useRef<number>(0)

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

  // Render padding section with visual SpacingControl
  const renderPaddingSection = () => {
    const section: "padding" = "padding"
    const isCollapsed = collapsed[section]
    const handleChange = (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => {
      const prefix = section
      if (key === "all") onUpdate({ [prefix]: val } as Partial<ElementNode>)
      if (key !== "all") onUpdate({ [`${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`]: val } as Partial<ElementNode>)
    }

    if (!isContainerNode(node)) return null
    const container = node as BoxNode | ScrollboxNode

    const values = {
      all: container.padding,
      top: container.paddingTop,
      right: container.paddingRight,
      bottom: container.paddingBottom,
      left: container.paddingLeft,
    }

    return (
      <box key={section} id={`section-${section}`} style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS[section]} collapsed={isCollapsed} onToggle={() => toggleSection(section)} />
        {!isCollapsed && (
          <box style={{ paddingLeft: 1 }}>
            <SpacingControl label="" values={values} onChange={handleChange} />
          </box>
        )}
      </box>
    )
  }

  // Render margin section with MarginControl (TRBL layout)
  const renderMarginSection = () => {
    const section: "margin" = "margin"
    const isCollapsed = collapsed[section]

    const values = {
      top: node.marginTop ?? 0,
      right: node.marginRight ?? 0,
      bottom: node.marginBottom ?? 0,
      left: node.marginLeft ?? 0,
    }

    const handleChange = (key: "top" | "right" | "bottom" | "left", val: number | undefined) => {
      if (key === "top") onUpdate({ marginTop: val } as Partial<ElementNode>)
      if (key === "right") onUpdate({ marginRight: val } as Partial<ElementNode>)
      if (key === "bottom") onUpdate({ marginBottom: val } as Partial<ElementNode>)
      if (key === "left") onUpdate({ marginLeft: val } as Partial<ElementNode>)
    }

    return (
      <box key={section} id={`section-${section}`} style={{ flexDirection: "column" }}>
        {/* Header with inline margin value sliders */}
        <box id="margin-header" flexDirection="row" alignItems="center" justifyContent="space-between">
          <SectionHeader title={SECTION_LABELS[section]} collapsed={isCollapsed} onToggle={() => toggleSection(section)} />
          {/* Inline margin sliders right-aligned */}
          <box id="margin-inline-sliders" flexDirection="row" gap={1}>
            <ValueSlider id="margin-t" label="t" value={values.top} onChange={(v) => handleChange("top", v)} />
            <ValueSlider id="margin-r" label="r" value={values.right} onChange={(v) => handleChange("right", v)} />
            <ValueSlider id="margin-b" label="b" value={values.bottom} onChange={(v) => handleChange("bottom", v)} />
            <ValueSlider id="margin-l" label="l" value={values.left} onChange={(v) => handleChange("left", v)} />
          </box>
        </box>
        {!isCollapsed && (
          <box style={{ paddingLeft: 1 }}>
            <MarginControl values={values} onChange={handleChange} />
          </box>
        )}
      </box>
    )
  }


  // Render dimensions section with DimensionsControl
  const renderDimensionsSection = () => {
    const isCollapsed = collapsed["dimensions"]
    return (
      <box key="dimensions" id="section-dimensions" style={{ flexDirection: "column" }}>
        <SectionHeader title={SECTION_LABELS["dimensions"]} collapsed={isCollapsed} onToggle={() => toggleSection("dimensions")} />
        {!isCollapsed && (
          <box style={{ flexDirection: "column", gap: 0, paddingLeft: 1 }}>
            <DimensionsControl 
              width={node.width} 
              height={node.height}
              flexGrow={node.flexGrow}
              minWidth={node.minWidth}
              maxWidth={node.maxWidth}
              minHeight={node.minHeight}
              maxHeight={node.maxHeight}
              onChange={(k, v) => onUpdate({ [k]: v } as Partial<ElementNode>)} 
            />
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
        {/* Header with right-aligned Rel/Abs tabs */}
        <box id="position-header" flexDirection="row" alignItems="center" justifyContent="space-between">
          <SectionHeader title={SECTION_LABELS["position"]} collapsed={isCollapsed} onToggle={() => toggleSection("position")} />
          {/* Rel/Abs tabs right-aligned */}
          <box id="pos-mode-tabs" flexDirection="row" gap={1}>
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
    <scrollbox 
      id="prop-pane-scroll" 
      style={{ flexGrow: 1, contentOptions: { flexDirection: "column", gap: 0, paddingBottom: 2 } }}
      scrollbarOptions={{
        trackOptions: { foregroundColor: "transparent", backgroundColor: "transparent" }
      }}
      onMouseDown={() => {
        if (focusedField === "name") setFocusedField(null)
      }}
    >
      <box id="element-header" style={{ marginBottom: 1, flexDirection: "column", gap: 1, paddingRight: 1 }}>
        <box id="element-type-row" style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <box id="element-type" style={{ flexDirection: "row" }}>
            <text fg={COLORS.muted}>Type </text>
            <box style={{ backgroundColor: COLORS.accent, paddingLeft: 1, paddingRight: 1 }}>
              <text fg={COLORS.bg}><strong>{node.type}</strong></text>
            </box>
          </box>
          <box
            id="visibility-toggle"
            style={{ flexDirection: "row" }}
            onMouseDown={() => onUpdate({ visible: !node.visible } as Partial<ElementNode>)}
          >
            <text fg={node.visible !== false ? COLORS.accent : COLORS.danger} selectable={false}>
              {node.visible !== false ? "⬢" : "⬡"}
            </text>
          </box>
        </box>
        <box id="element-name" style={{ flexDirection: "row" }} onMouseDown={(e) => e.stopPropagation()}>
          <text fg={COLORS.muted}>Name </text>
          {focusedField === "name" ? (
            <input
              id="name-input"
              value={node.name || ""}
              focused
              width={(node.name?.length || 1) + 2}
              backgroundColor={COLORS.cardHover}
              textColor={COLORS.text}
              onInput={(v) => onUpdate({ name: v } as Partial<ElementNode>)}
              onSubmit={() => setFocusedField(null)}
            />
          ) : (
            <box
              id="name-display"
              style={{ backgroundColor: COLORS.cardHover, paddingLeft: 1, paddingRight: 1 }}
              onMouseDown={() => {
                const now = Date.now()
                if (now - lastNameClickRef.current < 400) {
                  setFocusedField("name")
                }
                lastNameClickRef.current = now
              }}
            >
              <text fg={COLORS.text}>{node.name || ""}</text>
            </box>
          )}
        </box>
      </box>
      {unsectioned.map(renderProp)}
      {activeSections.map(renderSection)}
    </scrollbox>
  )
}
