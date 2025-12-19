import { COLORS } from '../../theme'
import { ValueControl } from '../ui/ValueControl'
import { PropRow } from './PropRow'
import type {
  FlexDirection,
  JustifyContent,
  AlignItems,
  Overflow,
} from '../../lib/types'

export function FlexDirectionPicker({
  value,
  onChange,
  label = 'Direction',
}: {
  value: FlexDirection | undefined
  onChange: (v: FlexDirection) => void
  label?: string | null
}) {
  const current = value || 'column'
  const isRow = current === 'row' || current === 'row-reverse'
  const isCol = current === 'column' || current === 'column-reverse'
  const isReverse = current.endsWith('-reverse')

  const toggleReverse = () => {
    const base = isRow ? 'row' : 'column'
    if (isReverse) {
      onChange(base)
    } else {
      onChange(`${base}-reverse` as FlexDirection)
    }
  }

  const content = (
    <box style={{ flexDirection: 'row', gap: 1 }}>
      <box
        id="flex-dir-row"
        onMouseDown={() => onChange(isReverse ? 'row-reverse' : 'row')}
        style={{
          backgroundColor: isRow ? COLORS.accent : COLORS.bg,
          paddingLeft: 1,
          paddingRight: 1,
          flexDirection: 'row',
          gap: 0,
        }}
      >
        <text fg={isRow ? COLORS.bg : COLORS.text}>Row</text>
      </box>
      <box
        id="flex-dir-col"
        onMouseDown={() => onChange(isReverse ? 'column-reverse' : 'column')}
        style={{
          backgroundColor: isCol ? COLORS.accent : COLORS.bg,
          paddingLeft: 1,
          paddingRight: 1,
          flexDirection: 'row',
          gap: 0,
        }}
      >
        <text fg={isCol ? COLORS.bg : COLORS.text}>Col</text>
      </box>
      <box
        id="flex-dir-reverse"
        onMouseDown={toggleReverse}
        style={{
          backgroundColor: isReverse ? COLORS.accent : COLORS.bg,
          paddingLeft: 1,
          paddingRight: 1,
          flexDirection: 'row',
          gap: 0,
        }}
      >
        <text fg={isReverse ? COLORS.bg : COLORS.text}>Rev</text>
      </box>
    </box>
  )

  if (label === null) return content

  return <PropRow label={label}>{content}</PropRow>
}

export function FlexAlignmentGrid({
  justify,
  align,
  direction,
  onBothChange,
}: {
  justify: JustifyContent | undefined
  align: AlignItems | undefined
  direction: FlexDirection | undefined
  onJustifyChange?: (v: JustifyContent) => void
  onAlignChange?: (v: AlignItems) => void
  onBothChange: (j: JustifyContent, a: AlignItems) => void
}) {
  const opts: JustifyContent[] = [
    'flex-start',
    'center',
    'flex-end',
    'space-between',
    'space-around',
    'space-evenly',
  ]

  const currentJ =
    (justify as any) === 'auto' ? 'flex-start' : (justify ?? 'flex-start')
  const currentA =
    (align as any) === 'auto' ? 'flex-start' : (align ?? 'flex-start')

  const isRow = direction === 'row' || direction === 'row-reverse'

  const jIdx = opts.indexOf(currentJ as any)
  const aIdx = opts.indexOf(
    (currentA === 'stretch' ? 'flex-start' : currentA) as any,
  )

  return (
    <box id="flex-align-grid" style={{ flexDirection: 'column', gap: 0 }}>
      <box id="align-matrix" style={{ flexDirection: 'column', gap: 0 }}>
        {[0, 1, 2].map((rowIdx) => (
          <box
            key={rowIdx}
            id={`align-row-${rowIdx}`}
            style={{ flexDirection: 'row', gap: 1 }}
          >
            {[0, 1, 2].map((colIdx) => {
              const cellJIdx = isRow ? colIdx : rowIdx
              const cellAIdx = isRow ? rowIdx : colIdx
              const isSelected = jIdx === cellJIdx && aIdx === cellAIdx
              return (
                <box
                  key={`${colIdx}-${rowIdx}`}
                  id={`align-cell-${colIdx}-${rowIdx}`}
                  onMouseDown={() => {
                    onBothChange(opts[cellJIdx], opts[cellAIdx] as AlignItems)
                  }}
                  style={{ width: 1, height: 1 }}
                >
                  <text fg={isSelected ? COLORS.accent : COLORS.border}>●</text>
                </box>
              )
            })}
          </box>
        ))}
      </box>
    </box>
  )
}

export function OverflowPicker({
  value,
  onChange,
}: {
  value: Overflow | undefined
  onChange: (v: Overflow) => void
}) {
  const options: { val: Overflow; label: string }[] = [
    { val: 'visible', label: 'Vis' },
    { val: 'hidden', label: 'Hide' },
    { val: 'scroll', label: 'Scroll' },
  ]
  const current = value || 'visible'

  return (
    <PropRow label="Overflow">
      <box style={{ flexDirection: 'row', gap: 1 }}>
        {options.map((opt) => {
          const isSelected = current === opt.val
          return (
            <box
              key={opt.val}
              id={`overflow-${opt.val}`}
              onMouseDown={() => onChange(opt.val)}
              style={{
                backgroundColor: isSelected ? COLORS.accent : COLORS.bgAlt,
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <text fg={isSelected ? COLORS.bg : COLORS.text}>{opt.label}</text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}
