import { useRef, useState } from "react"
import { COLORS } from "../../theme"
import { COLOR_PALETTE } from "../../lib/constants"
import { PropRow } from "./PropRow"
import type { ColorSwatch, ColorPalette } from "../../lib/projectTypes"

export function ColorProp({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <PropRow label={label}>
      <box style={{ flexDirection: "row", gap: 0 }}>
        {COLOR_PALETTE.map((c) => {
          const isSelected = c.value === value
          const isTrans = c.value === "transparent"
          return (
            <box
              key={c.name}
              id={`clr-${label}-${c.name}`}
              onMouseDown={() => onChange(c.value)}
              style={{ width: 2, height: 1 }}
            >
              <text fg={isTrans ? COLORS.muted : c.value}>
                {isTrans ? "╳╳" : isSelected ? "▓▓" : "░░"}
              </text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}

export function ColorPropWithHex({ label, value, onChange, focused, onFocus }: {
  label: string; value: string; onChange: (v: string) => void; focused?: boolean; onFocus?: () => void
}) {
  return (
    <box id={`color-hex-${label}`} style={{ flexDirection: "column", gap: 0 }}>
      <PropRow label={label}>
        <box style={{ flexDirection: "row", gap: 0 }}>
          {COLOR_PALETTE.slice(0, 8).map((c) => {
            const isSelected = c.value === value
            const isTrans = c.value === "transparent"
            return (
              <box
                key={c.name}
                id={`clr-${label}-${c.name}`}
                onMouseDown={() => onChange(c.value)}
                style={{ width: 2, height: 1 }}
              >
                <text fg={isTrans ? COLORS.muted : c.value}>
                  {isTrans ? "╳╳" : isSelected ? "▓▓" : "░░"}
                </text>
              </box>
            )
          })}
        </box>
      </PropRow>
      <box style={{ flexDirection: "row", gap: 1, height: 1, paddingLeft: 9 }}>
        <text fg={COLORS.muted}>#</text>
        <box
          id={`hex-input-${label}`}
          onMouseDown={onFocus}
          style={{ width: 8, backgroundColor: focused ? COLORS.bgAlt : COLORS.input }}
        >
          <input
            value={value.replace("#", "").replace("transparent", "")}
            focused={focused}
            placeholder="hex..."
            onInput={(v) => {
              const hex = v.replace("#", "").slice(0, 6)
              if (/^[0-9a-fA-F]*$/.test(hex)) {
                onChange(hex.length > 0 ? `#${hex}` : "")
              }
            }}
          />
        </box>
        <text fg={value || COLORS.muted}>■■</text>
      </box>
    </box>
  )
}

// Single editable swatch component
function EditableSwatch({ swatch, isSelected, onSelect, onUpdateColor, focused, onFocus, onBlur }: {
  swatch: ColorSwatch
  isSelected: boolean
  onSelect: () => void
  onUpdateColor: (color: string) => void
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  const [editing, setEditing] = useState(false)
  const lastClickRef = useRef<number>(0)
  
  const handleClick = () => {
    const now = Date.now()
    if (now - lastClickRef.current < 400) {
      // Double click - edit swatch
      setEditing(true)
      onFocus()
    } else {
      // Single click - select this color
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
      <text fg={swatch.color} onMouseDown={handleClick}>
        {isSelected ? "▓▓" : "██"}
      </text>
    </box>
  )
}

// Fill color input - 2 column layout via PropRow
// [Fill] [██ #hexinput]
export function FillColorProp({ 
  value, 
  onChange, 
  focused,
  onFocus,
}: {
  value: string
  onChange: (v: string) => void
  focused?: boolean
  onFocus?: () => void
}) {
  return (
    <PropRow label="Fill">
      <box style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <text fg={value || COLORS.muted}>██</text>
        <box
          onMouseDown={onFocus}
          style={{ flexDirection: "row", backgroundColor: focused ? COLORS.bgAlt : "transparent" }}
        >
          <text fg={COLORS.muted}>#</text>
          <input
            value={(value || "").replace("#", "").slice(0, 8)}
            focused={focused}
            width={8}
            onInput={(v) => {
              const hex = v.replace("#", "").slice(0, 8)
              if (/^[0-9a-fA-F]*$/.test(hex)) {
                onChange(hex.length > 0 ? `#${hex}` : "")
              }
            }}
          />
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
  selectedColor,
  onSelectColor,
  onUpdateSwatch,
  onChangePalette,
}: {
  palettes: ColorPalette[]
  activePaletteIndex: number
  selectedColor?: string
  onSelectColor: (color: string) => void
  onUpdateSwatch?: (swatchId: string, color: string) => void
  onChangePalette?: (index: number) => void
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
            isSelected={swatch.color === selectedColor}
            onSelect={() => onSelectColor(swatch.color)}
            onUpdateColor={(color) => {
              onUpdateSwatch?.(swatch.id, color)
              if (swatch.color === selectedColor) {
                onSelectColor(color)
              }
            }}
            focused={editingSwatchId === swatch.id}
            onFocus={() => setEditingSwatchId(swatch.id)}
            onBlur={() => setEditingSwatchId(null)}
          />
        ))}
        
        <box backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1} onMouseDown={handleNextPalette}>
          <text fg={COLORS.accent} selectable={false}>›</text>
        </box>
      </box>
      
      {/* Row 2: palette name centered */}
      <box style={{ flexDirection: "row", justifyContent: "center" }}>
        <text fg={COLORS.muted}>{paletteName}</text>
      </box>
    </box>
  )
}
