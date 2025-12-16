import { useRef, useState } from "react"
import { COLORS } from "../../theme"
import { PropRow } from "./PropRow"
import type { ColorSwatch, ColorPalette } from "../../lib/projectTypes"

// Single editable swatch component
function EditableSwatch({ swatch, onSelect, onUpdateColor, focused, onFocus, onBlur, pickMode }: {
  swatch: ColorSwatch
  onSelect: () => void
  onUpdateColor: (color: string) => void
  focused: boolean
  onFocus: () => void
  onBlur: () => void
  pickMode?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const lastClickRef = useRef<number>(0)
  
  const handleClick = () => {
    // In pick mode, single click selects immediately
    if (pickMode) {
      onSelect()
      return
    }

    const now = Date.now()
    if (now - lastClickRef.current < 400) {
      // Double click - edit swatch
      setEditing(true)
      onFocus()
    } else {
      // Single click - just show hex (handled by onSelect)
      onSelect()
    }
    lastClickRef.current = now
  }
  
  const handleSubmit = () => {
    setEditing(false)
    onBlur()
  }
  
  const handleInput = (v: string) => {
    const hex = v.replace("#", "").slice(0, 8) // Support HEXA
    if (/^[0-9a-fA-F]*$/.test(hex) && (hex.length === 6 || hex.length === 8)) {
      onUpdateColor(`#${hex}`)
    }
  }

  if (editing && focused) {
    return (
      <box style={{ flexDirection: "row", backgroundColor: COLORS.cardHover, height: 1 }}>
        <text fg={COLORS.muted}>#</text>
        <input
          value={swatch.color.replace("#", "")}
          focused
          width={8}
          onInput={handleInput}
          onSubmit={handleSubmit}
        />
      </box>
    )
  }

  return (
    <box
      id={`swatch-${swatch.id}`}
      onMouseDown={handleClick}
      style={{ height: 1 }}
    >
      <text fg={swatch.color} onMouseDown={handleClick}>██</text>
    </box>
  )
}

// Reusable color control with hex input and palette picker button
// [Label] [██ #hexinput [pick]]
export function ColorControl({ 
  label,
  value, 
  onChange, 
  focused,
  onFocus,
  onBlur,
  pickMode,
  onPickStart,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  focused?: boolean
  onFocus?: () => void
  onBlur?: () => void
  pickMode?: boolean
  onPickStart?: () => void
}) {
  const handleInput = (v: string) => {
    // Handle both typed and pasted input - strip # and non-hex chars
    const hex = v.replace(/#/g, "").replace(/[^0-9a-fA-F]/g, "").slice(0, 8)
    onChange(hex.length > 0 ? `#${hex}` : "")
  }

  const handlePaste = (e: { text: string; preventDefault: () => void }) => {
    e.preventDefault()
    const hex = e.text.trim().replace(/#/g, "").replace(/[^0-9a-fA-F]/g, "").slice(0, 8)
    if (hex.length > 0) {
      onChange(`#${hex}`)
    }
  }

  return (
    <PropRow label={label}>
      <box 
        style={{ flexDirection: "row", alignItems: "center", gap: 1 }}
      >
        <text fg={value || COLORS.muted}>██</text>
        <box
          id={`color-input-${label}`}
          onMouseDown={(e) => {
            e.stopPropagation()
            onFocus?.()
          }}
          style={{ flexDirection: "row", backgroundColor: focused ? COLORS.bgAlt : "transparent" }}
        >
          <text fg={COLORS.muted}>#</text>
          <input
            value={(value || "").replace("#", "").slice(0, 8)}
            focused={focused}
            width={8}
            onInput={handleInput}
            onPaste={handlePaste}
            onSubmit={() => onBlur?.()}
          />
        </box>
        <box
          id={`color-pick-${label}`}
          onMouseDown={(e) => {
            e.stopPropagation()
            onPickStart?.()
          }}
          style={{ 
            backgroundColor: pickMode ? COLORS.accent : COLORS.cardHover,
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          <text fg={pickMode ? COLORS.bg : COLORS.text} selectable={false}>
            {pickMode ? <strong>pick</strong> : "pick"}
          </text>
        </box>
      </box>
    </PropRow>
  )
}

// Palette selector - 2 column layout via PropRow
// [Palette] [‹ ██████ ›]
//    (row2) [palette name right-aligned]
export function PaletteProp({
  palettes,
  activePaletteIndex,
  onShowHex,
  onUpdateSwatch,
  onChangePalette,
  pickMode,
  onPickComplete,
}: {
  palettes: ColorPalette[]
  activePaletteIndex: number
  onShowHex?: (color: string) => void
  onUpdateSwatch?: (swatchId: string, color: string) => void
  onChangePalette?: (index: number) => void
  pickMode?: boolean
  onPickComplete?: (color: string) => void
}) {
  const [editingSwatchId, setEditingSwatchId] = useState<string | null>(null)

  const activePalette = palettes[activePaletteIndex] || palettes[0]
  const swatches = activePalette?.swatches || []
  const visibleSwatches = swatches.slice(0, 8)
  const paletteName = activePalette?.name || "Palette"

  const handlePrevPalette = () => {
    const newIndex = activePaletteIndex <= 0 ? palettes.length - 1 : activePaletteIndex - 1
    onChangePalette?.(newIndex)
  }

  const handleNextPalette = () => {
    const newIndex = activePaletteIndex >= palettes.length - 1 ? 0 : activePaletteIndex + 1
    onChangePalette?.(newIndex)
  }

  const handleSwatchClick = (swatch: ColorSwatch) => {
    if (pickMode) {
      onPickComplete?.(swatch.color)
    } else {
      // Just show the hex code, don't apply to any control
      onShowHex?.(swatch.color)
    }
  }

  return (
    <box style={{ flexDirection: "column", gap: 1 }}>
      {/* Row 1: chevrons + swatches, centered */}
      <box style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 0 }}>
        <box backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1} onMouseDown={handlePrevPalette}>
          <text fg={COLORS.accent} selectable={false}>‹</text>
        </box>
        
        {visibleSwatches.map((swatch) => (
          <EditableSwatch
            key={swatch.id}
            swatch={swatch}
            onSelect={() => handleSwatchClick(swatch)}
            onUpdateColor={(color) => {
              onUpdateSwatch?.(swatch.id, color)
            }}
            focused={editingSwatchId === swatch.id}
            onFocus={() => setEditingSwatchId(swatch.id)}
            onBlur={() => setEditingSwatchId(null)}
            pickMode={pickMode}
          />
        ))}
        
        <box backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1} onMouseDown={handleNextPalette}>
          <text fg={COLORS.accent} selectable={false}>›</text>
        </box>
      </box>
      
      {/* Row 2: palette name centered */}
      <box style={{ flexDirection: "row", justifyContent: "center" }}>
        <text fg={pickMode ? COLORS.accent : COLORS.muted}>
          {pickMode ? <strong>{paletteName}</strong> : paletteName}
        </text>
      </box>
    </box>
  )
}
