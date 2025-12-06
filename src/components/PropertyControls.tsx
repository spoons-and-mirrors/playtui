import { COLORS } from "../theme"
import { COLOR_PALETTE } from "../lib/constants"
import type { BorderSide } from "../lib/types"

const BORDER_SIDES: BorderSide[] = ["top", "right", "bottom", "left"]
const SIDE_LABELS: Record<BorderSide, string> = { top: "T", right: "R", bottom: "B", left: "L" }

// PropRow with optional "set" indicator (dot when value differs from default)
export function PropRow({ label, children, isSet }: { label: string; children: React.ReactNode; isSet?: boolean }) {
  return (
    <box id={`prop-row-${label}`} style={{ flexDirection: "row", gap: 1, height: 1 }}>
      <box style={{ flexDirection: "row", width: 9 }}>
        {isSet !== undefined && (
          <text fg={isSet ? COLORS.accent : "transparent"} style={{ width: 1 }}>•</text>
        )}
        <text fg={COLORS.muted} style={{ width: 8 }}>{label}</text>
      </box>
      {children}
    </box>
  )
}

export function NumberProp({ label, value, onChange, min = 0, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <PropRow label={label}>
      <box id={`num-dec-${label}`} onMouseDown={() => onChange(Math.max(min, value - 5))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.danger}>«</text>
      </box>
      <box id={`num-dec1-${label}`} onMouseDown={() => onChange(Math.max(min, value - 1))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.warning}>‹</text>
      </box>
      <box style={{ width: 4, alignItems: "center" }}>
        <text fg={COLORS.text}>{value}</text>
      </box>
      <box id={`num-inc1-${label}`} onMouseDown={() => onChange(Math.min(max, value + 1))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.success}>›</text>
      </box>
      <box id={`num-inc-${label}`} onMouseDown={() => onChange(Math.min(max, value + 5))}
        style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.success}>»</text>
      </box>
    </PropRow>
  )
}

export function SizeProp({ label, value, onChange }: {
  label: string; value: number | "auto" | `${number}%` | undefined; onChange: (v: number | "auto" | `${number}%` | undefined) => void
}) {
  const isAuto = value === "auto"
  const isPercent = typeof value === "string" && value.endsWith("%")
  const numVal = typeof value === "number" ? value : (isPercent ? parseInt(value as string) : 0)

  // Cycle mode: number -> auto -> percent -> number
  const cycleMode = () => {
    if (isAuto) onChange(`${numVal || 50}%`)
    else if (isPercent) onChange(numVal || 0)
    else onChange("auto")
  }

  const modeLabel = isAuto ? "A" : isPercent ? "%" : "#"
  const modeColor = isAuto ? COLORS.accent : isPercent ? COLORS.warning : COLORS.bgAlt

  return (
    <PropRow label={label}>
      <box id={`size-mode-${label}`} onMouseDown={cycleMode}
        style={{ backgroundColor: modeColor, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={isAuto || isPercent ? COLORS.bg : COLORS.muted}>{modeLabel}</text>
      </box>
      {!isAuto && (
        <>
          <box id={`size-dec5-${label}`} onMouseDown={() => {
            const next = Math.max(0, numVal - 5)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.danger}>«</text>
          </box>
          <box id={`size-dec-${label}`} onMouseDown={() => {
            const next = Math.max(0, numVal - 1)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.warning}>‹</text>
          </box>
          <box style={{ width: 4, alignItems: "center" }}>
            <text fg={COLORS.text}>{numVal}{isPercent ? "%" : ""}</text>
          </box>
          <box id={`size-inc-${label}`} onMouseDown={() => {
            const max = isPercent ? 100 : 999
            const next = Math.min(max, numVal + 1)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.success}>›</text>
          </box>
          <box id={`size-inc5-${label}`} onMouseDown={() => {
            const max = isPercent ? 100 : 999
            const next = Math.min(max, numVal + 5)
            onChange(isPercent ? `${next}%` : next)
          }}
            style={{ backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
            <text fg={COLORS.success}>»</text>
          </box>
        </>
      )}
    </PropRow>
  )
}

export function SelectProp({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  const idx = options.indexOf(value)
  const display = value.replace("flex-", "").replace("space-", "sp-").slice(0, 10)
  return (
    <PropRow label={label}>
      <box id={`sel-${label}`} onMouseDown={() => onChange(options[(idx + 1) % options.length])}
        style={{ flexDirection: "row", backgroundColor: COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.accent}>{display}</text>
        <text fg={COLORS.muted}> ◂▸</text>
      </box>
    </PropRow>
  )
}

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

export function ToggleProp({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <PropRow label={label}>
      <box id={`tog-${label}`} onMouseDown={() => onChange(!value)}
        style={{ backgroundColor: value ? COLORS.accent : COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={value ? COLORS.bg : COLORS.muted}>{value ? "ON" : "OFF"}</text>
      </box>
    </PropRow>
  )
}

export function StringProp({ label, value, focused, onFocus, onChange }: {
  label: string; value: string; focused: boolean; onFocus: () => void; onChange: (v: string) => void
}) {
  return (
    <PropRow label={label}>
      <box id={`str-${label}`} onMouseDown={onFocus}
        style={{ flexGrow: 1, height: 1, backgroundColor: focused ? COLORS.bgAlt : COLORS.input }}>
        <input value={value} focused={focused} onInput={onChange} placeholder="..." />
      </box>
    </PropRow>
  )
}

export function SectionHeader({ title, collapsed, onToggle }: {
  title: string; collapsed: boolean; onToggle: () => void
}) {
  return (
    <box
      id={`section-${title}`}
      onMouseDown={onToggle}
      style={{ flexDirection: "row", gap: 1, height: 1, marginTop: 1 }}
    >
      <text fg={COLORS.accent}>{collapsed ? "▸" : "▾"}</text>
      <text fg={COLORS.text}><strong>{title}</strong></text>
    </box>
  )
}

export function BorderSidesProp({ label, value, onChange }: {
  label: string; value: BorderSide[] | undefined; onChange: (v: BorderSide[] | undefined) => void
}) {
  const selected = value || []
  const toggle = (side: BorderSide) => {
    const has = selected.includes(side)
    const next = has ? selected.filter(s => s !== side) : [...selected, side]
    onChange(next.length > 0 ? next : undefined)
  }

  return (
    <PropRow label={label}>
      <box style={{ flexDirection: "row", gap: 1 }}>
        {BORDER_SIDES.map(side => {
          const isOn = selected.includes(side)
          return (
            <box
              key={side}
              id={`bside-${side}`}
              onMouseDown={() => toggle(side)}
              style={{ backgroundColor: isOn ? COLORS.accent : COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}
            >
              <text fg={isOn ? COLORS.bg : COLORS.muted}>{SIDE_LABELS[side]}</text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}

// Figma-like 4-box spacing control for padding/margin
export function SpacingControl({ label, values, onChange }: {
  label: string
  values: { all?: number; top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "all" | "top" | "right" | "bottom" | "left", val: number | undefined) => void
}) {
  const { all, top, right, bottom, left } = values
  const hasIndividual = top !== undefined || right !== undefined || bottom !== undefined || left !== undefined

  const renderVal = (key: "all" | "top" | "right" | "bottom" | "left", v: number | undefined, char: string) => {
    const display = v ?? 0
    return (
      <box
        id={`spacing-${label}-${key}`}
        style={{ flexDirection: "row", alignItems: "center", gap: 0 }}
      >
        <box
          id={`spacing-${label}-${key}-dec`}
          onMouseDown={() => onChange(key, Math.max(0, display - 1))}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.warning}>‹</text>
        </box>
        <text fg={COLORS.muted} style={{ width: 1 }}>{char}</text>
        <text fg={COLORS.text} style={{ width: 2 }}>{display}</text>
        <box
          id={`spacing-${label}-${key}-inc`}
          onMouseDown={() => onChange(key, Math.min(20, display + 1))}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.success}>›</text>
        </box>
      </box>
    )
  }

  return (
    <box id={`spacing-ctrl-${label}`} style={{ flexDirection: "column", marginBottom: 1 }}>
      <text fg={COLORS.muted} style={{ marginBottom: 0 }}>{label}</text>
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, backgroundColor: COLORS.bgAlt, padding: 1 }}>
        {/* Top row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "top" : "all", hasIndividual ? top : all, "↑")}
        </box>
        {/* Middle row: Left - Center - Right */}
        <box style={{ flexDirection: "row", justifyContent: "space-between", width: 22 }}>
          {renderVal("left", left, "←")}
          <box
            id={`spacing-${label}-mode`}
            onMouseDown={() => {
              if (hasIndividual) {
                // Collapse to all (use top value or 0)
                const v = top ?? right ?? bottom ?? left ?? 0
                onChange("all", v)
                onChange("top", undefined)
                onChange("right", undefined)
                onChange("bottom", undefined)
                onChange("left", undefined)
              } else {
                // Expand to individual
                const v = all ?? 0
                onChange("top", v)
                onChange("right", v)
                onChange("bottom", v)
                onChange("left", v)
                onChange("all", undefined)
              }
            }}
            style={{ backgroundColor: COLORS.card, paddingLeft: 1, paddingRight: 1 }}
          >
            <text fg={COLORS.accent}>{hasIndividual ? "□" : "■"}</text>
          </box>
          {renderVal("right", right, "→")}
        </box>
        {/* Bottom row */}
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal(hasIndividual ? "bottom" : "all", hasIndividual ? bottom : all, "↓")}
        </box>
      </box>
    </box>
  )
}

// Enhanced color prop with hex input
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

// Figma-like position control for absolute positioning (top/right/bottom/left)
export function PositionControl({ values, onChange }: {
  values: { top?: number; right?: number; bottom?: number; left?: number }
  onChange: (key: "top" | "right" | "bottom" | "left", val: number | undefined) => void
}) {
  const { top, right, bottom, left } = values

  const renderVal = (key: "top" | "right" | "bottom" | "left", v: number | undefined, char: string) => {
    const isSet = v !== undefined
    const display = v ?? "-"
    return (
      <box
        id={`pos-${key}`}
        style={{ flexDirection: "row", alignItems: "center", gap: 0 }}
      >
        <box
          id={`pos-${key}-dec`}
          onMouseDown={() => onChange(key, (v ?? 0) - 1)}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.warning}>‹</text>
        </box>
        <text fg={COLORS.muted} style={{ width: 1 }}>{char}</text>
        <box
          id={`pos-${key}-val`}
          onMouseDown={() => onChange(key, isSet ? undefined : 0)}
          style={{ width: 3, alignItems: "center" }}
        >
          <text fg={isSet ? COLORS.text : COLORS.muted}>{display}</text>
        </box>
        <box
          id={`pos-${key}-inc`}
          onMouseDown={() => onChange(key, (v ?? 0) + 1)}
          style={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={COLORS.success}>›</text>
        </box>
      </box>
    )
  }

  return (
    <box id="pos-ctrl" style={{ flexDirection: "column", marginBottom: 1 }}>
      <text fg={COLORS.muted}>Position Offsets</text>
      <box style={{ flexDirection: "column", alignItems: "center", gap: 0, backgroundColor: COLORS.bgAlt, padding: 1 }}>
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal("top", top, "↑")}
        </box>
        <box style={{ flexDirection: "row", justifyContent: "space-between", width: 24 }}>
          {renderVal("left", left, "←")}
          <box style={{ width: 2, alignItems: "center" }}>
            <text fg={COLORS.accent}>◎</text>
          </box>
          {renderVal("right", right, "→")}
        </box>
        <box style={{ flexDirection: "row", justifyContent: "center" }}>
          {renderVal("bottom", bottom, "↓")}
        </box>
      </box>
    </box>
  )
}

// ============================================
// FIGMA-LIKE VISUAL FLEX CONTROLS
// ============================================

// Visual flex direction picker with icons
export function FlexDirectionPicker({ value, onChange }: {
  value: "row" | "column" | undefined
  onChange: (v: "row" | "column") => void
}) {
  const isRow = value === "row"
  const isCol = value === "column" || !value

  return (
    <PropRow label="Direction">
      <box style={{ flexDirection: "row", gap: 1 }}>
        <box
          id="flex-dir-row"
          onMouseDown={() => onChange("row")}
          style={{
            backgroundColor: isRow ? COLORS.accent : COLORS.bgAlt,
            paddingLeft: 1, paddingRight: 1,
            flexDirection: "row", gap: 0
          }}
        >
          <text fg={isRow ? COLORS.bg : COLORS.muted}>→ Row</text>
        </box>
        <box
          id="flex-dir-col"
          onMouseDown={() => onChange("column")}
          style={{
            backgroundColor: isCol ? COLORS.accent : COLORS.bgAlt,
            paddingLeft: 1, paddingRight: 1,
            flexDirection: "row", gap: 0
          }}
        >
          <text fg={isCol ? COLORS.bg : COLORS.muted}>↓ Col</text>
        </box>
      </box>
    </PropRow>
  )
}

// Visual 3x3 grid for justify + align content
export function FlexAlignmentGrid({ 
  justify, 
  align, 
  direction,
  onJustifyChange, 
  onAlignChange 
}: {
  justify: string | undefined
  align: string | undefined
  direction: "row" | "column" | undefined
  onJustifyChange: (v: string) => void
  onAlignChange: (v: string) => void
}) {
  const justifyOpts = ["flex-start", "center", "flex-end"]
  const alignOpts = ["flex-start", "center", "flex-end"]
  
  const currentJ = justify || "flex-start"
  const currentA = align || "stretch"
  
  const jIdx = justifyOpts.indexOf(currentJ)
  const aIdx = alignOpts.indexOf(currentA === "stretch" ? "flex-start" : currentA)
  
  const isRow = direction === "row"

  // Grid shows main axis (justify) horizontal for row, vertical for column
  // Cross axis (align) is perpendicular
  const renderCell = (jI: number, aI: number) => {
    const isSelected = jIdx === jI && aIdx === aI
    const cellJ = justifyOpts[jI]
    const cellA = alignOpts[aI]
    
    // Visual representation based on direction
    // Row: horizontal = justify (jI), vertical = align (aI)  
    // Col: vertical = justify (jI), horizontal = align (aI)
    const chars = isRow 
      ? ["╔", "╦", "╗", "╠", "╬", "╣", "╚", "╩", "╝"]
      : ["╔", "╠", "╚", "╦", "╬", "╩", "╗", "╣", "╝"]
    
    const idx = isRow ? aI * 3 + jI : jI * 3 + aI
    const char = chars[idx]
    
    return (
      <box
        key={`${jI}-${aI}`}
        id={`align-${jI}-${aI}`}
        onMouseDown={() => {
          onJustifyChange(cellJ)
          onAlignChange(cellA)
        }}
        style={{
          width: 3, height: 1,
          backgroundColor: isSelected ? COLORS.accent : COLORS.bgAlt,
          alignItems: "center", justifyContent: "center"
        }}
      >
        <text fg={isSelected ? COLORS.bg : COLORS.muted}>{char}</text>
      </box>
    )
  }

  return (
    <box id="flex-align-grid" style={{ flexDirection: "column", gap: 0, marginTop: 1 }}>
      <text fg={COLORS.muted} style={{ marginBottom: 0 }}>Alignment</text>
      <box style={{ flexDirection: "column", gap: 0 }}>
        {[0, 1, 2].map(aI => (
          <box key={aI} style={{ flexDirection: "row", gap: 0 }}>
            {[0, 1, 2].map(jI => renderCell(jI, aI))}
          </box>
        ))}
      </box>
      <box style={{ flexDirection: "row", gap: 1, marginTop: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Justify:</text>
        <text fg={COLORS.accent}>{(currentJ || "start").replace("flex-", "")}</text>
      </box>
      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Align:</text>
        <text fg={COLORS.accent}>{(currentA || "stretch").replace("flex-", "")}</text>
      </box>
    </box>
  )
}

// Compact gap control with linked/unlinked mode
export function GapControl({ gap, rowGap, colGap, onChange }: {
  gap?: number
  rowGap?: number
  colGap?: number
  onChange: (key: "gap" | "rowGap" | "columnGap", val: number | undefined) => void
}) {
  const hasIndividual = rowGap !== undefined || colGap !== undefined
  const displayGap = gap ?? 0
  const displayRow = rowGap ?? gap ?? 0
  const displayCol = colGap ?? gap ?? 0

  const toggleMode = () => {
    if (hasIndividual) {
      // Collapse to single gap
      const v = rowGap ?? colGap ?? 0
      onChange("gap", v)
      onChange("rowGap", undefined)
      onChange("columnGap", undefined)
    } else {
      // Expand to individual
      onChange("rowGap", displayGap)
      onChange("columnGap", displayGap)
      onChange("gap", undefined)
    }
  }

  const renderGapVal = (label: string, key: "gap" | "rowGap" | "columnGap", val: number) => (
    <box style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
      <text fg={COLORS.muted} style={{ width: 2 }}>{label}</text>
      <box id={`gap-${key}-dec`} onMouseDown={() => onChange(key, Math.max(0, val - 1))}
        style={{ paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.warning}>‹</text>
      </box>
      <text fg={COLORS.text} style={{ width: 2 }}>{val}</text>
      <box id={`gap-${key}-inc`} onMouseDown={() => onChange(key, Math.min(20, val + 1))}
        style={{ paddingLeft: 1, paddingRight: 1 }}>
        <text fg={COLORS.success}>›</text>
      </box>
    </box>
  )

  return (
    <box id="gap-ctrl" style={{ flexDirection: "column", marginTop: 1 }}>
      <box style={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
        <text fg={COLORS.muted}>Gap</text>
        <box id="gap-mode" onMouseDown={toggleMode}
          style={{ backgroundColor: COLORS.card, paddingLeft: 1, paddingRight: 1 }}>
          <text fg={COLORS.accent}>{hasIndividual ? "⊟" : "⊞"}</text>
        </box>
      </box>
      <box style={{ flexDirection: hasIndividual ? "column" : "row", gap: 1, marginTop: 0 }}>
        {hasIndividual ? (
          <>
            {renderGapVal("R:", "rowGap", displayRow)}
            {renderGapVal("C:", "columnGap", displayCol)}
          </>
        ) : (
          renderGapVal("", "gap", displayGap)
        )}
      </box>
    </box>
  )
}

// Visual overflow selector
export function OverflowPicker({ value, onChange }: {
  value: string | undefined
  onChange: (v: string) => void
}) {
  const options = [
    { val: "visible", icon: "◻", label: "Vis" },
    { val: "hidden", icon: "▣", label: "Hide" },
    { val: "scroll", icon: "↕", label: "Scroll" },
  ]
  const current = value || "visible"

  return (
    <PropRow label="Overflow">
      <box style={{ flexDirection: "row", gap: 1 }}>
        {options.map(opt => {
          const isSelected = current === opt.val
          return (
            <box
              key={opt.val}
              id={`overflow-${opt.val}`}
              onMouseDown={() => onChange(opt.val)}
              style={{
                backgroundColor: isSelected ? COLORS.accent : COLORS.bgAlt,
                paddingLeft: 1, paddingRight: 1
              }}
            >
              <text fg={isSelected ? COLORS.bg : COLORS.muted}>{opt.icon}{opt.label}</text>
            </box>
          )
        })}
      </box>
    </PropRow>
  )
}

// ============================================
// FIGMA-LIKE DIMENSIONS CONTROL
// ============================================

type SizeValue = number | "auto" | `${number}%` | undefined

// Compact inline size control
function InlineSizeControl({ value, onChange, label }: {
  value: SizeValue
  onChange: (v: SizeValue) => void
  label: string
}) {
  const isAuto = value === "auto"
  const isPercent = typeof value === "string" && value.endsWith("%")
  const numVal = typeof value === "number" ? value : (isPercent ? parseInt(value as string) : 0)
  const isSet = value !== undefined

  const cycleMode = () => {
    if (isAuto) onChange(`${numVal || 50}%`)
    else if (isPercent) onChange(numVal || 0)
    else onChange("auto")
  }

  const modeLabel = isAuto ? "A" : isPercent ? "%" : "#"
  const modeColor = isAuto ? COLORS.accent : isPercent ? COLORS.warning : COLORS.bgAlt

  const adjust = (delta: number) => {
    const max = isPercent ? 100 : 999
    const next = Math.max(0, Math.min(max, numVal + delta))
    onChange(isPercent ? `${next}%` : next)
  }

  return (
    <box style={{ flexDirection: "row", gap: 0, alignItems: "center" }}>
      <text fg={isSet ? COLORS.accent : COLORS.muted} style={{ width: 2 }}>{label}</text>
      <box id={`dim-mode-${label}`} onMouseDown={cycleMode}
        style={{ backgroundColor: modeColor, width: 2, alignItems: "center" }}>
        <text fg={isAuto || isPercent ? COLORS.bg : COLORS.muted}>{modeLabel}</text>
      </box>
      {!isAuto && (
        <>
          <box id={`dim-dec-${label}`} onMouseDown={() => adjust(-1)}
            style={{ paddingLeft: 1 }}>
            <text fg={COLORS.warning}>‹</text>
          </box>
          <box style={{ width: 4, alignItems: "center" }}>
            <text fg={COLORS.text}>{numVal}{isPercent ? "%" : ""}</text>
          </box>
          <box id={`dim-inc-${label}`} onMouseDown={() => adjust(1)}
            style={{ paddingRight: 1 }}>
            <text fg={COLORS.success}>›</text>
          </box>
        </>
      )}
    </box>
  )
}

// Visual dimensions control with W x H layout
export function DimensionsControl({ 
  width, height, minWidth, maxWidth, minHeight, maxHeight,
  onChange 
}: {
  width: SizeValue
  height: SizeValue
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  onChange: (key: "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight", val: SizeValue) => void
}) {
  const hasMinMax = minWidth !== undefined || maxWidth !== undefined || minHeight !== undefined || maxHeight !== undefined

  return (
    <box id="dimensions-ctrl" style={{ flexDirection: "column", gap: 0 }}>
      {/* Main W x H row */}
      <box style={{ flexDirection: "row", gap: 1, alignItems: "center", backgroundColor: COLORS.bgAlt, padding: 1 }}>
        <InlineSizeControl value={width} onChange={(v) => onChange("width", v)} label="W" />
        <text fg={COLORS.muted}>×</text>
        <InlineSizeControl value={height} onChange={(v) => onChange("height", v)} label="H" />
      </box>
      
      {/* Min/Max toggle and controls */}
      <box style={{ flexDirection: "row", gap: 1, marginTop: 1 }}>
        <text fg={COLORS.muted} style={{ width: 8 }}>Bounds</text>
        <box 
          id="dim-bounds-toggle"
          onMouseDown={() => {
            if (hasMinMax) {
              // Clear all bounds
              onChange("minWidth", undefined)
              onChange("maxWidth", undefined)
              onChange("minHeight", undefined)
              onChange("maxHeight", undefined)
            } else {
              // Set default bounds
              onChange("minWidth", 0)
              onChange("maxWidth", 100)
            }
          }}
          style={{ backgroundColor: hasMinMax ? COLORS.accent : COLORS.bgAlt, paddingLeft: 1, paddingRight: 1 }}
        >
          <text fg={hasMinMax ? COLORS.bg : COLORS.muted}>{hasMinMax ? "ON" : "OFF"}</text>
        </box>
      </box>
      
      {hasMinMax && (
        <box style={{ flexDirection: "column", gap: 0, marginTop: 1, paddingLeft: 1 }}>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={COLORS.muted} style={{ width: 6 }}>Width</text>
            <BoundControl label="min" value={minWidth} onChange={(v) => onChange("minWidth", v)} />
            <BoundControl label="max" value={maxWidth} onChange={(v) => onChange("maxWidth", v)} />
          </box>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={COLORS.muted} style={{ width: 6 }}>Height</text>
            <BoundControl label="min" value={minHeight} onChange={(v) => onChange("minHeight", v)} />
            <BoundControl label="max" value={maxHeight} onChange={(v) => onChange("maxHeight", v)} />
          </box>
        </box>
      )}
    </box>
  )
}

function BoundControl({ label, value, onChange }: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  const isSet = value !== undefined
  const display = value ?? "-"
  
  return (
    <box style={{ flexDirection: "row", gap: 0, alignItems: "center" }}>
      <text fg={COLORS.muted} style={{ width: 3 }}>{label}:</text>
      <box id={`bound-${label}-dec`} onMouseDown={() => onChange(Math.max(0, (value ?? 0) - 5))}
        style={{ paddingLeft: 1 }}>
        <text fg={COLORS.warning}>‹</text>
      </box>
      <box 
        id={`bound-${label}-val`}
        onMouseDown={() => onChange(isSet ? undefined : 0)}
        style={{ width: 3, alignItems: "center" }}
      >
        <text fg={isSet ? COLORS.text : COLORS.muted}>{display}</text>
      </box>
      <box id={`bound-${label}-inc`} onMouseDown={() => onChange(Math.min(999, (value ?? 0) + 5))}
        style={{ paddingRight: 1 }}>
        <text fg={COLORS.success}>›</text>
      </box>
    </box>
  )
}
