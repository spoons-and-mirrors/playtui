import { useRef, useState } from "react"
import { COLORS } from "../../theme"
import type { ColorSwatch, ColorPalette } from "../../lib/projectTypes"

// Single swatch component - no inline editing
function Swatch({ swatch, onSelect, pickMode }: {
  swatch: ColorSwatch
  onSelect: () => void
  pickMode?: boolean
}) {
  const handleClick = () => {
    onSelect()
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

// Palette control - shows swatches and hex input next to palette name
// Row 1: [‹ ██████ ›]
// Row 2: [palette name | #hexinput when editing]
export function PaletteControl({
  palettes,
  activePaletteIndex,
  onShowHex,
  onUpdateSwatch,
  onChangePalette,
  pickMode,
  onPickComplete,
  focusedField,
  setFocusedField,
}: {
  palettes: ColorPalette[]
  activePaletteIndex: number
  onShowHex?: (color: string) => void
  onUpdateSwatch?: (swatchId: string, color: string) => void
  onChangePalette?: (index: number) => void
  pickMode?: boolean
  onPickComplete?: (color: string) => void
  focusedField?: string | null
  setFocusedField?: (f: string | null) => void
}) {
  const [editingSwatch, setEditingSwatch] = useState<ColorSwatch | null>(null)

  const activePalette = palettes[activePaletteIndex] || palettes[0]
  const swatches = activePalette?.swatches || []
  const visibleSwatches = swatches.slice(0, 8)
  const paletteName = activePalette?.name || "Palette"

  if (!palettes || palettes.length === 0) {
    return (
      <box style={{ flexDirection: "row", justifyContent: "center" }}>
        <text fg={COLORS.muted}>No palettes</text>
      </box>
    )
  }

  const handlePrevPalette = () => {
    const newIndex = activePaletteIndex <= 0 ? palettes.length - 1 : activePaletteIndex - 1
    onChangePalette?.(newIndex)
    setEditingSwatch(null)
  }

  const handleNextPalette = () => {
    const newIndex = activePaletteIndex >= palettes.length - 1 ? 0 : activePaletteIndex + 1
    onChangePalette?.(newIndex)
    setEditingSwatch(null)
  }

  const handleSwatchClick = (swatch: ColorSwatch) => {
    if (pickMode) {
      onPickComplete?.(swatch.color)
    } else {
      // Show hex input for this swatch
      setEditingSwatch(swatch)
      setFocusedField?.("palette-hex")
      onShowHex?.(swatch.color)
    }
  }

  const handleHexInput = (v: string) => {
    if (!editingSwatch) return
    const hex = v.replace("#", "").slice(0, 8)
    if (/^[0-9a-fA-F]*$/.test(hex) && (hex.length === 6 || hex.length === 8)) {
      onUpdateSwatch?.(editingSwatch.id, `#${hex}`)
      setEditingSwatch({ ...editingSwatch, color: `#${hex}` })
    }
  }

  const handleHexSubmit = () => {
    setEditingSwatch(null)
    setFocusedField?.(null)
  }

  return (
    <box style={{ flexDirection: "column", gap: 1 }}>
      {/* Row 1: chevrons + swatches, centered */}
      <box style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 0 }}>
        <box backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1} onMouseDown={handlePrevPalette}>
          <text fg={COLORS.accent} selectable={false}>‹</text>
        </box>
        
        {visibleSwatches.map((swatch) => (
          <Swatch
            key={swatch.id}
            swatch={swatch}
            onSelect={() => handleSwatchClick(swatch)}
            pickMode={pickMode}
          />
        ))}
        
        <box backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1} onMouseDown={handleNextPalette}>
          <text fg={COLORS.accent} selectable={false}>›</text>
        </box>
      </box>
      
      {/* Row 2: palette name OR hex input when editing */}
      <box style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 1 }}>
        {editingSwatch && focusedField === "palette-hex" ? (
          <>
            <text fg={editingSwatch.color}>██</text>
            <box
              id="palette-hex-input"
              onMouseDown={(e) => e.stopPropagation()}
              style={{ flexDirection: "row", backgroundColor: COLORS.bgAlt }}
            >
              <text fg={COLORS.muted}>#</text>
              <input
                value={editingSwatch.color.replace("#", "")}
                focused
                width={8}
                onInput={handleHexInput}
                onSubmit={handleHexSubmit}
              />
            </box>
          </>
        ) : (
          <text fg={pickMode ? COLORS.accent : COLORS.muted}>
            {pickMode ? <strong>{paletteName}</strong> : paletteName}
          </text>
        )}
      </box>
    </box>
  )
}
