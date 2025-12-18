import { useState, useRef } from 'react'
import {
  type ScrollBoxRenderable,
} from '@opentui/core'
import type {
  Renderable,
  BorderSide,
  BoxRenderable,
  ScrollboxRenderable,
  TextRenderable,
} from '../../lib/types'
import {
  NumberProp,
  SelectProp,
  ToggleProp,
  StringProp,
  SizeProp,
  SectionHeader,
  BorderSidesProp,
  SpacingControl,
  ColorControl,
  PositionControl,
  FlexDirectionPicker,
  FlexAlignmentGrid,
  GapControl,
  OverflowPicker,
  DimensionsControl,
  PropRow,
} from '../controls'
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

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Get properties from the renderable registry - single source of truth
  const props = RENDERABLE_REGISTRY[node.type].properties
  const unsectioned = props.filter((p) => !p.section)

  const activeSections = PROPERTY_SECTIONS.filter((meta) => {
    const section = meta.id
    if (props.some((p) => p.section === section)) return true
    if (meta.ownerTypes && meta.ownerTypes.includes(node.type)) return true
    return false
  }).map((meta) => meta.id)

  const renderProp = (prop: SerializableProp) => {
    const nodeProps = node as unknown as AnyNodeProps
    const val = nodeProps[prop.key]
    const key = prop.key
    const label = prop.label || prop.key

    if (prop.type === 'number') {
      return (
        <NumberProp
          key={key}
          id={`prop-${prop.key}`}
          label={label}
          value={typeof val === 'number' ? val : 0}
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
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
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
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
          onChange={(v) => onUpdate({ [prop.key]: v } as Partial<Renderable>)}
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

  const renderSpacingSection = (meta: typeof PROPERTY_SECTIONS[number]) => {
    if (!meta.keys) return null
    const label = meta.label.replace(/^[^\s]+\s/, '')

    const nodeProps = node as unknown as AnyNodeProps
    const values = {
      top: (nodeProps[meta.keys.top] as number) ?? 0,
      right: (nodeProps[meta.keys.right] as number) ?? 0,
      bottom: (nodeProps[meta.keys.bottom] as number) ?? 0,
      left: (nodeProps[meta.keys.left] as number) ?? 0,
    }

    const handleChange = (
      key: 'top' | 'right' | 'bottom' | 'left' | 'all',
      val: number | undefined,
    ) => {
      if (key === 'all') {
        const updates: Record<string, number | undefined> = {}
        Object.values(meta.keys!).forEach((k) => (updates[k] = val))
        onUpdate(updates as Partial<Renderable>, false)
        return
      }
      onUpdate({ [meta.keys![key]]: val } as Partial<Renderable>, false)
    }

    const handleChangeEnd = (
      key: 'top' | 'right' | 'bottom' | 'left' | 'all',
      val: number | undefined,
    ) => {
      if (key === 'all') {
        const updates: Record<string, number | undefined> = {}
        Object.values(meta.keys!).forEach((k) => (updates[k] = val))
        onUpdate(updates as Partial<Renderable>, true)
        return
      }
      onUpdate({ [meta.keys![key]]: val } as Partial<Renderable>, true)
    }

    return (
      <>
        <box
          key={meta.id}
          id={`section-${meta.id}`}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginTop={1}
        >
          <text fg={COLORS.text}>
            <strong>{label}</strong>
          </text>
          <SpacingControl
            label={meta.id}
            values={values}
            properties={meta.keys as any}
            onChange={handleChange}
            onChangeEnd={handleChangeEnd}
          />
        </box>
        {meta.id === 'padding' && (
          <box
            key={`${meta.id}-sep`}
            height={1}
            border={['top']}
            borderColor={COLORS.border}
            borderStyle="single"
            marginTop={1}
          />
        )}
      </>
    )
  }

  const renderDimensionsSection = () => {
    return (
      <box
        key="dimensions"
        id="section-dimensions"
        style={{ flexDirection: 'column', marginTop: 1 }}
      >
        <text fg={COLORS.text}>
          <strong>Dimensions</strong>
        </text>
        <box style={{ flexDirection: 'column', gap: 0 }}>
          <DimensionsControl
            width={node.width}
            height={node.height}
            flexGrow={node.flexGrow}
            minWidth={node.minWidth}
            maxWidth={node.maxWidth}
            minHeight={node.minHeight}
            maxHeight={node.maxHeight}
            onChange={(update, isFinal) =>
              onUpdate(update as Partial<Renderable>, isFinal)
            }
          />
        </box>
      </box>
    )
  }

  const renderFlexContainerSection = () => {
    if (!isContainerRenderable(node)) return null
    const container = node as BoxRenderable | ScrollboxRenderable

    const isCollapsed = collapsed['flexContainer']
    const wrapProp = props.find((p) => p.key === 'flexWrap')
    const alignContentProp = props.find((p) => p.key === 'alignContent')
    const flexMeta = PROPERTY_SECTIONS.find(
      (meta) => meta.id === 'flexContainer',
    )
    if (!flexMeta) return null

    return (
      <box
        key="flexContainer"
        id="section-flexContainer"
        style={{ flexDirection: 'column' }}
      >
        <SectionHeader
          title={flexMeta.label}
          collapsed={isCollapsed}
          onToggle={() => toggleSection('flexContainer')}
        />

        {!isCollapsed && (
          <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
            <FlexDirectionPicker
              value={container.flexDirection}
              onChange={(v) =>
                onUpdate({ flexDirection: v } as Partial<Renderable>)
              }
            />
            {wrapProp && renderProp(wrapProp)}

            <box style={{ marginTop: 1 }} />

            <box
              style={{
                flexDirection: 'row',
                gap: 2,
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <box id="flex-gap-sliders" flexDirection="column" gap={0}>
                <GapControl
                  label="gap"
                  property="gap"
                  value={container.gap}
                  onChange={(v) => onUpdate({ gap: v } as Partial<Renderable>)}
                  onChangeEnd={(v) =>
                    onUpdate({ gap: v } as Partial<Renderable>, true)
                  }
                />
                <GapControl
                  label="row"
                  property="rowGap"
                  value={container.rowGap}
                  onChange={(v) =>
                    onUpdate({ rowGap: v } as Partial<Renderable>)
                  }
                  onChangeEnd={(v) =>
                    onUpdate({ rowGap: v } as Partial<Renderable>, true)
                  }
                />
                <GapControl
                  label="col"
                  property="columnGap"
                  value={container.columnGap}
                  onChange={(v) =>
                    onUpdate({ columnGap: v } as Partial<Renderable>)
                  }
                  onChangeEnd={(v) =>
                    onUpdate({ columnGap: v } as Partial<Renderable>, true)
                  }
                />
              </box>

              <FlexAlignmentGrid
                justify={container.justifyContent}
                align={container.alignItems}
                direction={container.flexDirection}
                onJustifyChange={(v) =>
                  onUpdate({ justifyContent: v } as Partial<Renderable>)
                }
                onAlignChange={(v) =>
                  onUpdate({ alignItems: v } as Partial<Renderable>)
                }
                onBothChange={(j, a) =>
                  onUpdate({
                    justifyContent: j,
                    alignItems: a,
                  } as Partial<Renderable>)
                }
              />
            </box>

            <box style={{ marginTop: 1 }} />

            <PropRow label="Justify">
              <text fg={COLORS.accent}>
                {(container.justifyContent || 'start').replace('flex-', '')}
              </text>
            </PropRow>
            <PropRow label="Align">
              <text fg={COLORS.accent}>
                {(container.alignItems || 'start').replace('flex-', '')}
              </text>
            </PropRow>

            {container.flexWrap === 'wrap' &&
              alignContentProp &&
              renderProp(alignContentProp)}
          </box>
        )}
      </box>
    )
  }

  const renderPositionSection = () => {
    return (
      <box key="position" id="section-position" flexDirection="column">
        <box
          id="pos-mode-tabs"
          flexDirection="row"
          gap={1}
          justifyContent="flex-end"
          marginBottom={1}
        >
          <box
            id="pos-tab-rel"
            border={['right']}
            borderStyle="heavy"
            borderColor={
              node.position !== 'absolute' ? COLORS.accent : 'transparent'
            }
            backgroundColor={COLORS.bg}
            paddingLeft={1}
            paddingRight={1}
            onMouseDown={() =>
              onUpdate({ position: 'relative' } as Partial<Renderable>)
            }
          >
            <text
              fg={node.position !== 'absolute' ? COLORS.accent : COLORS.muted}
              selectable={false}
            >
              {node.position !== 'absolute' ? <strong>Rel</strong> : 'Rel'}
            </text>
          </box>
          <box
            id="pos-tab-abs"
            border={['right']}
            borderStyle="heavy"
            borderColor={
              node.position === 'absolute' ? COLORS.accent : 'transparent'
            }
            backgroundColor={COLORS.bg}
            paddingLeft={1}
            paddingRight={1}
            onMouseDown={() =>
              onUpdate({ position: 'absolute' } as Partial<Renderable>)
            }
          >
            <text
              fg={node.position === 'absolute' ? COLORS.accent : COLORS.muted}
              selectable={false}
            >
              {node.position === 'absolute' ? <strong>Abs</strong> : 'Abs'}
            </text>
          </box>
        </box>
        <box
          id="pos-row"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <text fg={COLORS.text}>
            <strong>Position</strong>
          </text>
          <PositionControl
            x={node.x}
            y={node.y}
            zIndex={node.zIndex}
            onChange={(k, v) =>
              onUpdate({ [k]: v } as Partial<Renderable>, false)
            }
            onChangeEnd={(k, v) =>
              onUpdate({ [k]: v } as Partial<Renderable>, true)
            }
          />
        </box>
      </box>
    )
  }

  const renderOverflowSection = () => {
    if (!isContainerRenderable(node)) return null
    const container = node as BoxRenderable | ScrollboxRenderable

    const isCollapsed = collapsed['overflow']
    const hasOverflowProp = props.some((p) => p.key === 'overflow')
    if (!hasOverflowProp) return null
    const overflowMeta = PROPERTY_SECTIONS.find(
      (meta) => meta.id === 'overflow',
    )
    if (!overflowMeta) return null

    return (
      <box
        key="overflow"
        id="section-overflow"
        style={{ flexDirection: 'column' }}
      >
        <SectionHeader
          title={overflowMeta.label}
          collapsed={isCollapsed}
          onToggle={() => toggleSection('overflow')}
        />

        {!isCollapsed && (
          <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
            <OverflowPicker
              value={container.overflow}
              onChange={(v) => onUpdate({ overflow: v } as Partial<Renderable>)}
            />
          </box>
        )}
      </box>
    )
  }

  const renderElementSection = (section: PropertySection) => {
    const meta = PROPERTY_SECTIONS.find((s) => s.id === section)
    if (!meta) return null
    if (meta.ownerTypes && !meta.ownerTypes.includes(node.type)) return null

    const entry =
      section === 'border' && node.type === 'scrollbox'
        ? RENDERABLE_REGISTRY['box']
        : RENDERABLE_REGISTRY[node.type]
    if (!entry?.Properties) return null

    return entry.Properties({
      node,
      onUpdate,
      focusedField,
      setFocusedField,
      collapsed: collapsed[section],
      onToggle: () => toggleSection(section),
      palettes,
      activePaletteIndex,
      onUpdateSwatch,
      onChangePalette,
      pickingForField,
      setPickingForField,
    })
  }

  const renderSection = (section: PropertySection) => {
    const meta = PROPERTY_SECTIONS.find((s) => s.id === section)
    if (!meta) return null

    if (meta.ownerTypes && meta.ownerTypes.length > 0) {
      return renderElementSection(section)
    }

    if (meta.layout === 'dimensions') return renderDimensionsSection()
    if (meta.layout === 'position') return renderPositionSection()
    if (meta.layout === 'spacing') return renderSpacingSection(meta)
    if (meta.layout === 'flex') return renderFlexContainerSection()
    if (meta.layout === 'overflow') return renderOverflowSection()

    const sectionProps = props.filter((p) => p.section === section)
    if (sectionProps.length === 0) return null
    const isCollapsed = collapsed[section]

    return (
      <box
        key={section}
        id={`section-${section}`}
        style={{ flexDirection: 'column' }}
      >
        <SectionHeader
          title={meta.label}
          collapsed={isCollapsed}
          onToggle={() => toggleSection(section)}
        />
        {!isCollapsed && (
          <box style={{ flexDirection: 'column', gap: 0, paddingLeft: 1 }}>
            {sectionProps.map(renderProp)}
          </box>
        )}
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
