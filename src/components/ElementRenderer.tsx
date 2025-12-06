import { COLORS } from "../theme"
import type { ElementNode } from "../lib/types"

interface ElementRendererProps {
  node: ElementNode
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function ElementRenderer({ node, selectedId, hoveredId, onSelect, onHover }: ElementRendererProps) {
  const isSelected = node.id === selectedId
  const isHovered = node.id === hoveredId && !isSelected
  const isRoot = node.id === "root"

  // Root element: render children directly (canvas is the root container)
  if (isRoot) {
    return (
      <>
        {node.children.map((child) => (
          <ElementRenderer key={child.id} node={child} selectedId={selectedId} hoveredId={hoveredId} onSelect={onSelect} onHover={onHover} />
        ))}
      </>
    )
  }

  // Handle text element
  if (node.type === "text") {
    let textContent: React.ReactNode = node.content || ""
    if (node.bold) textContent = <strong>{textContent}</strong>
    if (node.italic) textContent = <em>{textContent}</em>
    if (node.underline) textContent = <u>{textContent}</u>

    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected ? ["left"] : isHovered ? ["left"] : undefined}
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.muted : undefined}
        visible={node.visible !== false}
        style={{
          backgroundColor: isSelected ? COLORS.bgAlt : "transparent",
          margin: node.margin,
          marginTop: node.marginTop,
          marginRight: node.marginRight,
          marginBottom: node.marginBottom,
          marginLeft: node.marginLeft,
        }}
      >
        <text fg={node.fg || COLORS.text} wrapMode={node.wrapMode}>
          {textContent}
        </text>
      </box>
    )
  }

  // Handle input element
  if (node.type === "input") {
    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected || isHovered}
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
        visible={node.visible !== false}
        style={{
          width: node.width,
          height: node.height || 1,
          margin: node.margin,
          marginTop: node.marginTop,
          marginRight: node.marginRight,
          marginBottom: node.marginBottom,
          marginLeft: node.marginLeft,
          backgroundColor: COLORS.input,
        }}
      >
        <text fg={COLORS.muted}>{node.placeholder || "Input..."}</text>
      </box>
    )
  }

  // Handle textarea element
  if (node.type === "textarea") {
    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected || isHovered}
        borderStyle="single"
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
        visible={node.visible !== false}
        style={{
          width: node.width,
          height: node.height || 4,
          margin: node.margin,
          marginTop: node.marginTop,
          marginRight: node.marginRight,
          marginBottom: node.marginBottom,
          marginLeft: node.marginLeft,
          backgroundColor: COLORS.input,
          padding: 1,
        }}
      >
        <text fg={COLORS.muted} wrapMode="word">{node.placeholder || "Multi-line input..."}</text>
      </box>
    )
  }

  // Handle select element
  if (node.type === "select") {
    const options = node.options || ["Option 1", "Option 2"]
    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected || isHovered}
        borderStyle="single"
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
        visible={node.visible !== false}
        style={{
          width: node.width,
          height: node.height || options.length + 2,
          margin: node.margin,
          marginTop: node.marginTop,
          marginRight: node.marginRight,
          marginBottom: node.marginBottom,
          marginLeft: node.marginLeft,
          backgroundColor: COLORS.bgAlt,
          flexDirection: "column",
        }}
      >
        {options.slice(0, 5).map((opt, i) => (
          <box key={i} style={{ paddingLeft: 1, backgroundColor: i === 0 ? COLORS.accent : "transparent" }}>
            <text fg={i === 0 ? COLORS.bg : COLORS.text}>{opt}</text>
          </box>
        ))}
      </box>
    )
  }

  // Handle slider element
  if (node.type === "slider") {
    const isHorizontal = node.orientation !== "vertical"
    const val = node.value ?? 50
    const min = node.min ?? 0
    const max = node.max ?? 100
    const pct = Math.round(((val - min) / (max - min)) * 100)
    const trackChar = isHorizontal ? "─" : "│"
    const thumbChar = isHorizontal ? "●" : "●"
    
    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected || isHovered}
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
        visible={node.visible !== false}
        style={{
          width: isHorizontal ? (node.width || 20) : 3,
          height: isHorizontal ? 3 : (node.height || 10),
          backgroundColor: node.backgroundColor || COLORS.bgAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <text fg={node.foregroundColor || COLORS.accent}>
          {isHorizontal 
            ? trackChar.repeat(Math.floor(pct / 10)) + thumbChar + trackChar.repeat(10 - Math.floor(pct / 10))
            : `${thumbChar} ${pct}%`
          }
        </text>
      </box>
    )
  }

  // Handle ascii-font element
  if (node.type === "ascii-font") {
    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected || isHovered}
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
        visible={node.visible !== false}
        style={{
          width: node.width,
          height: node.height,
          backgroundColor: "transparent",
          padding: 1,
        }}
      >
        <text fg={node.color || COLORS.accent}>
          <strong>[{node.font || "tiny"}] {node.text || "ASCII"}</strong>
        </text>
      </box>
    )
  }

  // Handle tab-select element
  if (node.type === "tab-select") {
    const options = node.options || ["Tab 1", "Tab 2", "Tab 3"]
    const tabW = node.tabWidth || 12
    return (
      <box
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={isSelected || isHovered}
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : COLORS.muted}
        visible={node.visible !== false}
        style={{
          width: node.width || options.length * tabW,
          height: 3,
          flexDirection: "row",
          backgroundColor: COLORS.bgAlt,
        }}
      >
        {options.slice(0, 5).map((opt, i) => (
          <box
            key={i}
            border={["bottom"]}
            borderColor={i === 0 ? COLORS.accent : COLORS.border}
            style={{ width: tabW, alignItems: "center", justifyContent: "center" }}
          >
            <text fg={i === 0 ? COLORS.accent : COLORS.text}>{opt}</text>
          </box>
        ))}
      </box>
    )
  }

  const hasBorder = node.border === true
  const borderValue = hasBorder 
    ? (node.borderSides && node.borderSides.length > 0 ? node.borderSides : true)
    : (isSelected || isHovered)

  // Determine size - handle "auto" and percentage strings
  const parseSize = (val: number | "auto" | `${number}%` | undefined) => {
    if (val === undefined || val === "auto") return undefined
    if (typeof val === "string") return val
    return val
  }

  const boxStyle = {
    // Sizing
    width: parseSize(node.width),
    height: parseSize(node.height),
    minWidth: node.minWidth,
    maxWidth: node.maxWidth,
    minHeight: node.minHeight,
    maxHeight: node.maxHeight,

    // Flex container
    flexDirection: node.flexDirection || "column",
    flexWrap: node.flexWrap === "nowrap" ? "no-wrap" : node.flexWrap,
    justifyContent: node.justifyContent,
    alignItems: node.alignItems,
    gap: node.gap,
    rowGap: node.rowGap,
    columnGap: node.columnGap,

    // Flex item
    flexGrow: node.flexGrow,
    flexShrink: node.flexShrink,
    flexBasis: node.flexBasis,
    alignSelf: node.alignSelf,

    // Padding
    padding: node.padding,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,

    // Margin
    margin: node.margin,
    marginTop: node.marginTop,
    marginRight: node.marginRight,
    marginBottom: node.marginBottom,
    marginLeft: node.marginLeft,

    // Positioning
    position: node.position,
    top: node.top,
    right: node.right,
    bottom: node.bottom,
    left: node.left,
    zIndex: node.zIndex,

    // Overflow
    overflow: node.overflow,

    // Background
    backgroundColor: node.backgroundColor || "transparent",
  } as const

  const children = node.children.map((child) => (
    <ElementRenderer
      key={child.id}
      node={child}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={onSelect}
      onHover={onHover}
    />
  ))

  // Handle scrollbox element
  if (node.type === "scrollbox") {
    return (
      <scrollbox
        id={`render-${node.id}`}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
        onMouseOver={() => onHover(node.id)}
        onMouseOut={() => onHover(null)}
        border={borderValue}
        borderStyle={hasBorder ? (node.borderStyle || "single") : "single"}
        borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : node.borderColor}
        visible={node.visible !== false}
        title={node.title}
        titleAlignment={node.titleAlignment}
        stickyScroll={node.stickyScroll}
        scrollX={node.scrollX}
        scrollY={node.scrollY}
        viewportCulling={node.viewportCulling}
        style={{
          ...boxStyle,
          contentOptions: { flexDirection: node.flexDirection || "column", gap: node.gap },
        }}
      >
        {children}
      </scrollbox>
    )
  }

  // Default: box element
  return (
    <box
      id={`render-${node.id}`}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id) }}
      onMouseOver={() => onHover(node.id)}
      onMouseOut={() => onHover(null)}
      border={borderValue}
      borderStyle={hasBorder ? (node.borderStyle || "single") : "single"}
      borderColor={isSelected ? COLORS.accentBright : isHovered ? COLORS.accent : node.borderColor}
      visible={node.visible !== false}
      title={node.title}
      titleAlignment={node.titleAlignment}
      style={boxStyle}
    >
      {children}
    </box>
  )
}
