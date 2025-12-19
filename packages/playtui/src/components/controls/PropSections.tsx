import { COLORS } from '../../theme'
import { DimensionsControl } from './DimensionsControl'
import { PositionControl } from './PositionControl'
import { SpacingControl } from './SpacingControl'
import { SelectProp } from './SelectProp'
import { NumberProp } from './NumberProp'
import { SizeProp } from './SizeProp'
import { FlexAlignmentGrid, OverflowPicker } from './FlexControls'
import { RENDERABLE_REGISTRY, isContainerRenderable, type PropertySectionMeta } from '../renderables'
import type {
  Renderable,
  BoxRenderable,
  ScrollboxRenderable,
  FlexDirection,
} from '../../lib/types'

export interface SectionProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>, pushHistory?: boolean) => void
  meta: PropertySectionMeta
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  cycleProp: (key: string, current: any) => void
}

export function DimensionsContent({ node, onUpdate }: SectionProps) {
  return (
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
  )
}

export function PositionContent({ node, onUpdate }: SectionProps) {
  return (
    <box flexDirection="column" gap={0}>
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
  )
}

export function SpacingContent({ node, onUpdate, meta }: SectionProps) {
  if (!meta.keys) return null

  const nodeProps = node as any
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
    <box style={{ flexDirection: 'column', gap: 0 }}>
      <SpacingControl
        label={meta.id}
        values={values}
        properties={meta.keys as any}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
      />
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
    </box>
  )
}

export function FlexContainerContent({
  node,
  onUpdate,
  cycleProp,
}: SectionProps) {
  const container = node as BoxRenderable | ScrollboxRenderable
  const flexProps = RENDERABLE_REGISTRY.box.properties
  const flexDirectionOpts =
    flexProps.find((p) => p.key === 'flexDirection')?.options || []
  const flexWrapOpts =
    flexProps.find((p) => p.key === 'flexWrap')?.options || []

  return (
    <box style={{ flexDirection: 'column', gap: 1 }}>
      <box style={{ flexDirection: 'row', gap: 0, alignItems: 'flex-start' }}>
        <box
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            flexGrow: 1,
            flexBasis: 0,
          }}
        >
          <SelectProp
            label={null}
            value={String(container.flexDirection || 'row')}
            options={flexDirectionOpts}
            onChange={(v) =>
              onUpdate({
                flexDirection: v as FlexDirection,
              } as Partial<Renderable>)
            }
          />
        </box>
        <box
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            flexGrow: 1,
            flexBasis: 0,
          }}
        >
          <SelectProp
            label={null}
            value={String((node as any).flexWrap || 'nowrap')}
            options={flexWrapOpts}
            onChange={(v) => onUpdate({ flexWrap: v } as Partial<Renderable>)}
          />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 0, alignItems: 'flex-start' }}>
        <box
          style={{
            flexDirection: 'column',
            gap: 1,
            alignItems: 'center',
            flexGrow: 1,
            flexBasis: 0,
          }}
        >
          <box id="flex-gap-sliders" flexDirection="column" gap={0}>
            <NumberProp
              id="flex-gap"
              label="gap"
              property="gap"
              value={container.gap}
              onChange={(v: number) =>
                onUpdate({ gap: v } as Partial<Renderable>)
              }
              onChangeEnd={(v: number) =>
                onUpdate({ gap: v } as Partial<Renderable>, true)
              }
            />
            <NumberProp
              id="flex-row-gap"
              label="row"
              property="rowGap"
              value={container.rowGap}
              onChange={(v: number) =>
                onUpdate({ rowGap: v } as Partial<Renderable>)
              }
              onChangeEnd={(v: number) =>
                onUpdate({ rowGap: v } as Partial<Renderable>, true)
              }
            />
            <NumberProp
              id="flex-col-gap"
              label="col"
              property="columnGap"
              value={container.columnGap}
              onChange={(v: number) =>
                onUpdate({ columnGap: v } as Partial<Renderable>)
              }
              onChangeEnd={(v: number) =>
                onUpdate({ columnGap: v } as Partial<Renderable>, true)
              }
            />
          </box>
        </box>

        <box
          style={{
            flexDirection: 'column',
            gap: 1,
            alignItems: 'center',
            flexGrow: 1,
            flexBasis: 0,
          }}
        >
          <FlexAlignmentGrid
            justify={container.justifyContent}
            align={container.alignItems}
            direction={container.flexDirection}
            onBothChange={(j, a) =>
              onUpdate({
                justifyContent: j,
                alignItems: a,
              } as Partial<Renderable>)
            }
          />
        </box>
      </box>

      <box style={{ flexDirection: 'row', gap: 0 }}>
        <box
          id="click-justify"
          style={{
            flexDirection: 'column',
            flexGrow: 1,
            flexBasis: 0,
            alignItems: 'center',
          }}
          onMouseDown={() =>
            cycleProp('justifyContent', container.justifyContent)
          }
        >
          <text fg={COLORS.muted}>Justify</text>
          <text fg={COLORS.accent}>
            {(container.justifyContent || 'start').replace('flex-', '')}
          </text>
        </box>
        <box
          id="click-align"
          style={{
            flexDirection: 'column',
            flexGrow: 1,
            flexBasis: 0,
            alignItems: 'center',
          }}
          onMouseDown={() => cycleProp('alignItems', container.alignItems)}
        >
          <text fg={COLORS.muted}>Align</text>
          <text fg={COLORS.accent}>
            {(container.alignItems || 'start').replace('flex-', '')}
          </text>
        </box>
        {(container.flexWrap === 'wrap' ||
          container.flexWrap === 'wrap-reverse') && (
          <box
            id="click-content"
            style={{
              flexDirection: 'column',
              flexGrow: 1,
              flexBasis: 0,
              alignItems: 'center',
            }}
            onMouseDown={() =>
              cycleProp('alignContent', container.alignContent)
            }
          >
            <text fg={COLORS.muted}>Content</text>
            <text fg={COLORS.accent}>
              {(container.alignContent || 'start').replace('flex-', '')}
            </text>
          </box>
        )}
      </box>
    </box>
  )
}

export function FlexItemContent({ node, onUpdate, cycleProp }: SectionProps) {
  return (
    <box id="flex-item-2x2" style={{ flexDirection: 'column', gap: 1 }}>
      <box style={{ flexDirection: 'row', gap: 0 }}>
        <box style={{ flexGrow: 1, flexBasis: 0 }}>
          <NumberProp
            id="flex-grow"
            label="grow"
            property="flexGrow"
            value={node.flexGrow}
            onChange={(v: number) =>
              onUpdate({ flexGrow: v } as Partial<Renderable>)
            }
            onChangeEnd={(v: number) =>
              onUpdate({ flexGrow: v } as Partial<Renderable>, true)
            }
          />
        </box>
        <box style={{ flexGrow: 1, flexBasis: 0 }}>
          <SizeProp
            label="basis"
            value={node.flexBasis as any}
            onChange={(v) => onUpdate({ flexBasis: v } as Partial<Renderable>)}
          />
        </box>
      </box>
      <box style={{ flexDirection: 'row', gap: 0 }}>
        <box style={{ flexGrow: 1, flexBasis: 0 }}>
          <NumberProp
            id="flex-shrink"
            label="shrink"
            property="flexShrink"
            value={node.flexShrink}
            onChange={(v: number) =>
              onUpdate({ flexShrink: v } as Partial<Renderable>)
            }
            onChangeEnd={(v: number) =>
              onUpdate({ flexShrink: v } as Partial<Renderable>, true)
            }
          />
        </box>
        <box
          style={{
            flexGrow: 1,
            flexBasis: 0,
            flexDirection: 'column',
            alignItems: 'center',
          }}
          onMouseDown={() => cycleProp('alignSelf', node.alignSelf)}
        >
          <text fg={COLORS.muted}>align</text>
          <text fg={COLORS.accent}>
            {String(node.alignSelf || 'auto')
              .replace('flex-', '')
              .slice(0, 10)}
          </text>
        </box>
      </box>
    </box>
  )
}

export function OverflowContent({ node, onUpdate }: SectionProps) {
  if (!isContainerRenderable(node)) return null
  const container = node as BoxRenderable | ScrollboxRenderable

  return (
    <box style={{ flexDirection: 'column', gap: 0 }}>
      <OverflowPicker
        value={container.overflow}
        onChange={(v) => onUpdate({ overflow: v } as Partial<Renderable>)}
      />
    </box>
  )
}
