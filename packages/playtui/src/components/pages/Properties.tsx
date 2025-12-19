import { useState, useRef } from 'react'
import { type ScrollBoxRenderable } from '@opentui/core'
import type {
  Renderable,
  BorderSide,
} from '../../lib/types'
import {
  NumberProp,
  SelectProp,
  ToggleProp,
  StringProp,
  SizeProp,
  SectionHeader,
  BorderSidesProp,
  ColorControl,
  PropRow,
} from '../controls'
import {
  DimensionsContent,
  PositionContent,
  SpacingContent,
  FlexItemContent,
  FlexContainerContent,
  OverflowContent,
} from '../controls/PropSections'
import {
  DragCaptureContext,
  useDragCaptureImplementation,
} from '../contexts/DragCaptureContext'
import {
  RENDERABLE_REGISTRY,
  PROPERTY_SECTIONS,
  isContainerRenderable,
  type SerializableProp,
  type PropertySection,
} from '../renderables'
import { COLORS } from '../../theme'

// Helper type for dynamic property access
type AnyNodeProps = Record<string, unknown>

interface PropertyPaneProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>, pushHistory?: boolean) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  // Palette support
  palettes?: Array<{
    id: string
    name: string
    swatches: Array<{ id: string; color: string }>
  }>
  activePaletteIndex?: number
  onShowHex?: (color: string) => void
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
  // Color picking support - lifted from parent
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

export function PropertyPane({
  node,
  onUpdate,
  focusedField,
  setFocusedField,
  palettes,
  activePaletteIndex,
  onUpdateSwatch,
  onChangePalette,
  pickingForField,
  setPickingForField,
}: PropertyPaneProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    PROPERTY_SECTIONS.forEach((meta) => {
      initial[meta.id] = !meta.defaultExpanded
    })
    return initial
  })

  const scrollRef = useRef<ScrollBoxRenderable>(null)

  // Drag capture system for value controls (sliders, counters)
  const { registerDrag, handleDrag, handleDragEnd } =
    useDragCaptureImplementation()

    const cycleProp = (key: string, current: any) => {
      const opts =
        (RENDERABLE_REGISTRY[node.type].properties.find((p) => p.key === key)
          ?.options as any[]) || []
      const idx = opts.indexOf(current || opts[0])
      const next = opts[(idx + 1) % opts.length]
      onUpdate({ [key]: next } as Partial<Renderable>)
    }

    const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Get properties from the renderable registry - single source of truth
  // NOTE: We filter out 'visible' here because it's already managed in the Header.
  // DO NOT re-add 'visible' back to the property panel to avoid redundancy.
  const props = RENDERABLE_REGISTRY[node.type].properties.filter(
    (p) => p.key !== 'visible',
  )

  const unsectioned = props.filter((p) => !p.section)

  const activeSections = PROPERTY_SECTIONS.filter((meta) => {
    const section = meta.id
    if (props.some((p) => p.section === section)) return true
    if (meta.ownerTypes && meta.ownerTypes.includes(node.type)) return true
    return false
  }).map((meta) => meta.id)

  const renderProp = (prop: SerializableProp) => {
    if (prop.visible && !prop.visible(node)) {
      return null
    }
    const nodeProps = node as unknown as AnyNodeProps
    const val = nodeProps[prop.key]
    const key = prop.key
    const label = prop.label || prop.key

    if (prop.customRenderer) {
      return (
        <box key={key}>
          {prop.customRenderer({
            node,
            onUpdate: (updates) => onUpdate(updates as Partial<Renderable>),
            focusedField,
            setFocusedField,
            collapsed: false,
            onToggle: () => {},
            palettes: palettes as any,
            activePaletteIndex,
            onUpdateSwatch,
            onChangePalette,
            pickingForField,
            setPickingForField,
          })}
        </box>
      )
    }

    if (prop.type === 'header') {
      return (
        <box key={`header-${prop.label}`} style={{ marginTop: 1 }}>
          <text fg={COLORS.muted}>─ {prop.label} ─</text>
        </box>
      )
    }
    if (prop.type === 'options') {
      return (
        <box key={key}>
          <StringProp
            label={label}
            value={((val as string[]) || []).join(', ')}
            focused={focusedField === prop.key}
            onFocus={() => setFocusedField(prop.key)}
            onChange={(v: string) =>
              onUpdate({
                [prop.key]: v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              } as Partial<Renderable>)
            }
          />
        </box>
      )
    }
    if (prop.type === 'number') {
      return (
        <NumberProp
          key={key}
          id={`prop-${prop.key}`}
          label={label}
          value={typeof val === 'number' ? val : 0}
          focused={focusedField === prop.key}
          onFocus={() => setFocusedField(prop.key)}
          onChange={(v: number) =>
            onUpdate({ [prop.key]: v } as Partial<Renderable>)
          }
          min={prop.min}
          max={prop.max}
          property={prop.animatable ? prop.key : undefined}
        />
      )
    }
    if (prop.type === 'size') {
      return (
        <SizeProp
          key={key}
          label={label}
          value={val as number | 'auto' | `${number}%` | undefined}
          onChange={(v: any) =>
            onUpdate({ [prop.key]: v } as Partial<Renderable>)
          }
        />
      )
    }
    if (prop.type === 'select' && prop.options) {
      return (
        <SelectProp
          key={key}
          label={label}
          value={String(val || prop.options[0])}
          options={prop.options}
          onChange={(v: string) =>
            onUpdate({ [prop.key]: v } as Partial<Renderable>)
          }
        />
      )
    }
    if (prop.type === 'color') {
      return (
        <ColorControl
          key={key}
          label={label}
          value={String(val || '')}
          focused={focusedField === prop.key}
          onFocus={() => setFocusedField(prop.key)}
          onBlur={() => setFocusedField(null)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
          pickMode={pickingForField === prop.key}
          onPickStart={() => setPickingForField?.(prop.key)}
          palettes={palettes}
          activePaletteIndex={activePaletteIndex}
          onUpdateSwatch={onUpdateSwatch}
          onChangePalette={onChangePalette}
        />
      )
    }
    if (prop.type === 'toggle' || prop.type === 'boolean') {
      return (
        <ToggleProp
          key={key}
          label={label}
          value={Boolean(val)}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
        />
      )
    }
    if (prop.type === 'borderSides') {
      return (
        <BorderSidesProp
          key={key}
          label={label}
          value={val as BorderSide[] | undefined}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
        />
      )
    }
    if (prop.type === 'object') {
      return null
    }
    return (
      <StringProp
        key={key}
        label={label}
        value={String(val || '')}
        focused={focusedField === prop.key}
        onFocus={() => setFocusedField(prop.key)}
        onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
      />
    )
  }

  const renderSection = (section: PropertySection) => {
    const meta = PROPERTY_SECTIONS.find((s) => s.id === section)
    if (!meta) return null

    // Filter by ownerTypes if specified (section only shows for matching node types)
    if (meta.ownerTypes && !meta.ownerTypes.includes(node.type)) return null

    const collapsible = meta.collapsible !== false
    const isCollapsed = collapsible ? collapsed[section] : false

    // Spacing between major layout blocks
    const needsTopSpacing = meta.hasTopSpacing

    const commonProps = {
      node,
      onUpdate,
      meta,
      focusedField,
      setFocusedField,
      cycleProp,
    }

    let sectionContent = null

    if (!isCollapsed) {
      if (meta.layout === 'dimensions') {
        sectionContent = <DimensionsContent {...commonProps} />
      } else if (meta.layout === 'position') {
        sectionContent = <PositionContent {...commonProps} />
      } else if (meta.layout === 'spacing') {
        sectionContent = <SpacingContent {...commonProps} />
      } else if (meta.layout === 'flex') {
        sectionContent = <FlexContainerContent {...commonProps} />
      } else if (meta.layout === 'overflow') {
        sectionContent = <OverflowContent {...commonProps} />
      } else if (section === 'flexItem') {
        sectionContent = <FlexItemContent {...commonProps} />
      } else {
        const sectionProps = props.filter((p) => p.section === section)
        if (sectionProps.length === 0) return null

        // Group props by 'group' field for horizontal layout
        const groups: Record<string, SerializableProp[]> = {}
        const ungrouped: SerializableProp[] = []

        sectionProps.forEach((p) => {
          if (p.group) {
            if (!groups[p.group]) groups[p.group] = []
            groups[p.group].push(p)
          } else {
            ungrouped.push(p)
          }
        })

        sectionContent = (
          <box style={{ flexDirection: 'column', gap: 1, paddingLeft: 1 }}>
            {ungrouped.map((prop) => renderProp(prop))}
            {Object.entries(groups).map(([group, groupProps]) => (
              <PropRow key={group} label="">
                {groupProps.map((prop) => renderProp(prop))}
              </PropRow>
            ))}
          </box>
        )
      }
    }

    // For position and spacing sections, content includes its own inline label
    const hasInlineLabel = meta.layout === 'position' || meta.layout === 'spacing'

    return (
      <box
        key={section}
        id={`section-${section}`}
        style={{
          flexDirection: 'column',
          marginTop: needsTopSpacing ? 1 : 0,
        }}
      >
        {!hasInlineLabel && (
          <SectionHeader
            title={meta.label}
            collapsed={isCollapsed}
            onToggle={() => toggleSection(section)}
            collapsible={collapsible}
          />
        )}
        {sectionContent}
      </box>
    )
  }


  return (
    <DragCaptureContext.Provider value={registerDrag}>
      <scrollbox
        id="prop-pane-scroll"
        ref={scrollRef}
        style={{
          flexGrow: 1,
          backgroundColor: COLORS.bgAlt,
          contentOptions: {
            flexDirection: 'column',
            gap: 0,
            paddingBottom: 2,
            backgroundColor: COLORS.bgAlt,
          },
        }}
        scrollbarOptions={{
          visible: false,
          trackOptions: {
            foregroundColor: 'transparent',
            backgroundColor: 'transparent',
          },
        }}
        onMouseScroll={(e) => {
          const sb = scrollRef.current
          if (!sb || !e.scroll) return
          const delta = e.scroll.direction === 'up' ? -1 : 1
          sb.scrollBy(delta * 6)
        }}
        onMouseDrag={handleDrag}
        onMouseDragEnd={handleDragEnd}
        onMouseDown={(e) => {
          if (e.target === scrollRef.current) {
            setFocusedField(null)
            setPickingForField?.(null)
          }
        }}
      >
        {unsectioned.map(renderProp)}
        {activeSections.map(renderSection)}
      </scrollbox>
    </DragCaptureContext.Provider>
  )
}
