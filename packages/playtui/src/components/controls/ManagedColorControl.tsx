import { ColorControl } from './index'
import type { ColorPalette } from '../../lib/projectTypes'

interface ManagedColorControlProps {
  label: string
  field: string
  value: string | undefined
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  onUpdate: (updates: any) => void
  palettes?: ColorPalette[]
  activePaletteIndex?: number
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
  pickingForField?: string | null
  setPickingForField?: (field: string | null) => void
}

/**
 * A wrapper around ColorControl that automatically manages its own focus,
 * update, and picking state based on a field key.
 * Reduces repetitive prop passing in property panels.
 */
export function ManagedColorControl({
  label,
  field,
  value,
  focusedField,
  setFocusedField,
  onUpdate,
  pickingForField,
  setPickingForField,
  ...rest
}: ManagedColorControlProps) {
  return (
    <ColorControl
      label={label}
      value={value || ''}
      focused={focusedField === field}
      onFocus={() => setFocusedField(field)}
      onBlur={() => setFocusedField(null)}
      onChange={(v) => onUpdate({ [field]: v })}
      pickMode={pickingForField === field}
      onPickStart={() => setPickingForField?.(field)}
      {...rest}
    />
  )
}
