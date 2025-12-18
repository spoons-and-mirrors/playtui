import { useState, useRef } from 'react'
import { MouseEvent } from '@opentui/core'
import { COLORS } from '../../theme'
import { useDragCapture } from '../contexts/DragCaptureContext'
import type { SizeValue } from '../../lib/types'

type SizeMode = 'hug' | 'fill' | 'fixed' | 'percent'

interface DimensionRowProps {
  id: string
  label: string
  value: SizeValue | undefined
  property?: string
  flexGrow?: number
  onChange: (value: SizeValue, flexGrow?: number) => void
  onChangeEnd?: (value: SizeValue, flexGrow?: number) => void
  minValue?: number
  maxValue?: number
  minProperty?: string
  maxProperty?: string
  onMinChange: (v: number | undefined) => void
  onMaxChange: (v: number | undefined) => void
  onMinChangeEnd?: (v: number | undefined) => void
  onMaxChangeEnd?: (v: number | undefined) => void
}

function getMode(value: SizeValue | undefined, flexGrow?: number): SizeMode {
  if (flexGrow && flexGrow > 0) return 'fill'
  if (value === 'auto' || value === undefined) return 'hug'
  if (typeof value === 'string' && value.endsWith('%')) return 'percent'
  return 'fixed'
}

function ModeButton({
  id,
  label,
  active,
  onClick,
}: {
  id: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <box
      id={id}
      backgroundColor={active ? COLORS.accent : COLORS.bg}
      paddingLeft={1}
      paddingRight={1}
      onMouseDown={onClick}
    >
      <text
        fg={active ? COLORS.bg : COLORS.muted}
        selectable={false}
        onMouseDown={onClick}
      >
        {label}
      </text>
    </box>
  )
}

function DimensionRow({
  id,
  label,
  value,
  flexGrow,
  onChange,
  onChangeEnd,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onMinChangeEnd,
  onMaxChangeEnd,
}: DimensionRowProps) {
  const [pressing, setPressing] = useState<'dec' | 'inc' | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; value: number } | null>(null)
  const registerDrag = useDragCapture()

  const mode = getMode(value, flexGrow)
  const isPercent = typeof value === 'string' && value.endsWith('%')
  const numVal =
    typeof value === 'number'
      ? value
      : isPercent
        ? parseInt(value as string)
        : 0
  const canAdjust = mode === 'fixed' || mode === 'percent'

  const hasMin = minValue !== undefined
  const hasMax = maxValue !== undefined

  const setMode = (newMode: SizeMode) => {
    switch (newMode) {
      case 'hug':
        onChange('auto', 0)
        break
      case 'fill':
        onChange('auto', 1)
        break
      case 'fixed':
        onChange(numVal || 20, 0)
        break
      case 'percent':
        onChange(`${numVal || 50}%`, 0)
        break
    }
  }

  const adjust = (delta: number) => {
    if (!canAdjust) return
    const max = isPercent ? 100 : 999
    const next = Math.max(0, Math.min(max, numVal + delta))
    onChange(isPercent ? `${next}%` : next, flexGrow)
  }

  const handleValueMouseDown = (e: MouseEvent) => {
    if (canAdjust) {
      dragStart.current = { x: e.x, y: e.y, value: numVal }
      setDragging(true)
      // Register with panel for cross-bounds dragging
      if (registerDrag) {
        const maxVal = isPercent ? 100 : 999
        registerDrag(
          e.x,
          e.y,
          numVal,
          (next) => {
            const clamped = Math.max(0, Math.min(maxVal, next))
            onChange(isPercent ? `${clamped}%` : clamped, flexGrow)
          },
          (next) => {
            if (onChangeEnd) {
              const clamped = Math.max(0, Math.min(maxVal, next))
              onChangeEnd(isPercent ? `${clamped}%` : clamped, flexGrow)
            }
          },
        )
      }
    }
  }

  const handleValueDrag = (e: MouseEvent) => {
    if (!dragStart.current || !canAdjust) return
    const deltaX = e.x - dragStart.current.x
    const deltaY = dragStart.current.y - e.y // up = positive
    const max = isPercent ? 100 : 999
    const next = Math.max(
      0,
      Math.min(max, dragStart.current.value + deltaX + deltaY),
    )
    if (next === numVal) return
    onChange(isPercent ? `${next}%` : next, flexGrow)
  }

  const handleValueDragEnd = () => {
    if (dragStart.current && onChangeEnd) {
      const isPercent = typeof value === 'string' && value.endsWith('%')
      const numVal =
        typeof value === 'number'
          ? value
          : isPercent
            ? parseInt(value as string)
            : 0
      onChangeEnd(isPercent ? `${numVal}%` : numVal, flexGrow)
    }
    dragStart.current = null
    setDragging(false)
  }

  return (
    <box id={id} flexDirection="column" gap={1}>
      {/* Row 1: Label + Mode selector left, Value counter right */}
      <box
        id={`${id}-modes`}
        flexDirection="row"
        justifyContent="space-between"
      >
        <box id={`${id}-mode-btns`} flexDirection="row" gap={0}>
          <box paddingRight={1}>
            <text fg={COLORS.text} selectable={false}>
              <strong>{label}</strong>
            </text>
          </box>
          <ModeButton
            id={`${id}-hug`}
            label="hug"
            active={mode === 'hug'}
            onClick={() => setMode('hug')}
          />
          <ModeButton
            id={`${id}-fill`}
            label="fill"
            active={mode === 'fill'}
            onClick={() => setMode('fill')}
          />
          <ModeButton
            id={`${id}-fixed`}
            label="px"
            active={mode === 'fixed'}
            onClick={() => setMode('fixed')}
          />
          <ModeButton
            id={`${id}-pct`}
            label="%"
            active={mode === 'percent'}
            onClick={() => setMode('percent')}
          />
        </box>
        {/* Value counter right-aligned */}
        {canAdjust && (
          <box id={`${id}-value-ctrl`} flexDirection="row">
            <box
              id={`${id}-dec`}
              backgroundColor={COLORS.bg}
              paddingLeft={1}
              paddingRight={1}
              onMouseDown={() => {
                setPressing('dec')
                adjust(-1)
              }}
              onMouseUp={() => setPressing(null)}
              onMouseOut={() => setPressing(null)}
            >
              <text
                fg={COLORS.accent}
                selectable={false}
                onMouseDown={() => {
                  setPressing('dec')
                  adjust(-1)
                }}
              >
                -
              </text>
            </box>
            <box
              id={`${id}-value`}
              backgroundColor={
                pressing || dragging ? COLORS.accent : COLORS.muted
              }
              paddingLeft={1}
              paddingRight={1}
              onMouseDown={handleValueMouseDown}
              onMouseDrag={handleValueDrag}
              onMouseDragEnd={handleValueDragEnd}
            >
              <text
                fg={COLORS.bg}
                selectable={false}
                onMouseDown={handleValueMouseDown}
              >
                <strong>{numVal}</strong>
              </text>
            </box>
            <box
              id={`${id}-inc`}
              backgroundColor={COLORS.bg}
              paddingLeft={1}
              paddingRight={1}
              onMouseDown={() => {
                setPressing('inc')
                adjust(1)
              }}
              onMouseUp={() => setPressing(null)}
              onMouseOut={() => setPressing(null)}
            >
              <text
                fg={COLORS.accent}
                selectable={false}
                onMouseDown={() => {
                  setPressing('inc')
                  adjust(1)
                }}
              >
                +
              </text>
            </box>
          </box>
        )}
      </box>

      {/* Row 2: Bounds toggles left-aligned (only for fixed/percent) */}
      {canAdjust && (
        <box id={`${id}-bounds`} flexDirection="row" gap={1} paddingLeft={3}>
          <BoundToggle
            id={`${id}-min`}
            label="min"
            value={minValue}
            enabled={hasMin}
            onToggle={() => onMinChange(hasMin ? undefined : 0)}
            onChange={onMinChange}
            onChangeEnd={onMinChangeEnd}
          />
          <BoundToggle
            id={`${id}-max`}
            label="max"
            value={maxValue}
            enabled={hasMax}
            onToggle={() => onMaxChange(hasMax ? undefined : 0)}
            onChange={onMaxChange}
            onChangeEnd={onMaxChangeEnd}
          />
        </box>
      )}
    </box>
  )
}

interface BoundToggleProps {
  id: string
  label: string
  value: number | undefined
  enabled: boolean
  onToggle: () => void
  onChange: (v: number | undefined) => void
  onChangeEnd?: (v: number | undefined) => void
}

function BoundToggle({
  id,
  label,
  value,
  enabled,
  onToggle,
  onChange,
  onChangeEnd,
}: BoundToggleProps) {
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; value: number } | null>(null)
  const registerDrag = useDragCapture()

  const handleValueMouseDown = (e: MouseEvent) => {
    if (enabled && value !== undefined) {
      dragStart.current = { x: e.x, y: e.y, value }
      setDragging(true)
      // Register with panel for cross-bounds dragging
      if (registerDrag) {
        registerDrag(
          e.x,
          e.y,
          value,
          (next) => {
            const clamped = Math.max(0, Math.min(999, next))
            onChange(clamped)
          },
          (next) => {
            if (onChangeEnd) {
              const clamped = Math.max(0, Math.min(999, next))
              onChangeEnd(clamped)
            }
          },
        )
      }
    }
  }

  const handleDrag = (e: MouseEvent) => {
    if (!dragStart.current || !enabled) return
    const deltaX = e.x - dragStart.current.x
    const deltaY = dragStart.current.y - e.y // up = positive
    const next = Math.max(
      0,
      Math.min(999, dragStart.current.value + deltaX + deltaY),
    )
    if (next !== value) onChange(next)
  }

  const handleDragEnd = () => {
    if (dragStart.current && onChangeEnd) {
      onChangeEnd(value)
    }
    dragStart.current = null
    setDragging(false)
  }

  return (
    <box id={id} flexDirection="row">
      {/* Toggle checkbox */}
      <box
        id={`${id}-toggle`}
        backgroundColor={COLORS.bg}
        paddingLeft={1}
        paddingRight={1}
        onMouseDown={onToggle}
      >
        <text fg={enabled ? COLORS.accent : COLORS.muted} selectable={false}>
          {enabled ? '☑' : '☐'} {label}
        </text>
      </box>
      {/* Value (only if enabled) */}
      {enabled && (
        <box
          id={`${id}-value`}
          backgroundColor={dragging ? COLORS.accent : COLORS.card}
          paddingLeft={1}
          paddingRight={1}
          onMouseDown={handleValueMouseDown}
          onMouseDrag={handleDrag}
          onMouseDragEnd={handleDragEnd}
        >
          <text fg={COLORS.text} selectable={false}>
            {value}
          </text>
        </box>
      )}
    </box>
  )
}

export interface DimensionsControlProps {
  width: SizeValue | undefined
  height: SizeValue | undefined
  flexGrow?: number
  flexShrink?: number
  minWidth?: SizeValue
  maxWidth?: SizeValue
  minHeight?: SizeValue
  maxHeight?: SizeValue
  onChange: (
    update: Partial<{
      width: SizeValue
      height: SizeValue
      flexGrow: number
      flexShrink: number
      minWidth: SizeValue
      maxWidth: SizeValue
      minHeight: SizeValue
      maxHeight: SizeValue
    }>,
    isFinal: boolean,
  ) => void
}

export function DimensionsControl({
  width,
  height,
  flexGrow,
  flexShrink,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  onChange,
}: DimensionsControlProps) {
  const asNumber = (v: SizeValue | undefined): number | undefined =>
    typeof v === 'number' ? v : undefined

  return (
    <box
      id="dimensions-ctrl"
      style={{
        flexDirection: 'column',
        gap: 1,
        backgroundColor: COLORS.bgAlt,
        paddingTop: 1,
        paddingBottom: 1,
      }}
    >
      {/* Width */}
      <DimensionRow
        id="dim-w"
        label="W"
        value={width}
        flexGrow={flexGrow}
        onChange={(v, fg) => onChange({ width: v, flexGrow: fg }, false)}
        onChangeEnd={(v, fg) => onChange({ width: v, flexGrow: fg }, true)}
        minValue={asNumber(minWidth)}
        maxValue={asNumber(maxWidth)}
        onMinChange={(v) => onChange({ minWidth: v }, false)}
        onMaxChange={(v) => onChange({ maxWidth: v }, false)}
        onMinChangeEnd={(v) => onChange({ minWidth: v }, true)}
        onMaxChangeEnd={(v) => onChange({ maxWidth: v }, true)}
      />
      {/* Height */}
      <DimensionRow
        id="dim-h"
        label="H"
        value={height}
        flexGrow={flexGrow}
        onChange={(v, fg) => onChange({ height: v, flexGrow: fg }, false)}
        onChangeEnd={(v, fg) => onChange({ height: v, flexGrow: fg }, true)}
        minValue={asNumber(minHeight)}
        maxValue={asNumber(maxHeight)}
        onMinChange={(v) => onChange({ minHeight: v }, false)}
        onMaxChange={(v) => onChange({ maxHeight: v }, false)}
        onMinChangeEnd={(v) => onChange({ minHeight: v }, true)}
        onMaxChangeEnd={(v) => onChange({ maxHeight: v }, true)}
      />
    </box>
  )
}
