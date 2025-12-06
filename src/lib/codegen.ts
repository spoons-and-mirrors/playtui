import type { ElementNode, SizeValue, BorderSide } from "./types"

function formatSize(val: SizeValue | undefined): string | undefined {
  if (val === undefined) return undefined
  if (typeof val === "number") return String(val)
  return `"${val}"`
}

function formatBorderSides(sides: BorderSide[] | undefined): string | undefined {
  if (!sides || sides.length === 0) return undefined
  return `{[${sides.map(s => `"${s}"`).join(", ")}]}`
}

export function generateCode(node: ElementNode, indent = 0): string {
  const pad = "  ".repeat(indent)
  const props: string[] = []

  if (node.type === "box" || node.type === "scrollbox") {
    // Border properties
    if (node.border) {
      if (node.borderSides && node.borderSides.length > 0) {
        props.push(`border={[${node.borderSides.map(s => `"${s}"`).join(", ")}]}`)
      } else {
        props.push("border")
      }
      if (node.borderStyle && node.borderStyle !== "single") {
        props.push(`borderStyle="${node.borderStyle}"`)
      }
    }
    if (node.borderColor) props.push(`borderColor="${node.borderColor}"`)
    if (node.focusedBorderColor) props.push(`focusedBorderColor="${node.focusedBorderColor}"`)
    if (node.title) props.push(`title="${node.title}"`)
    if (node.titleAlignment && node.titleAlignment !== "left") {
      props.push(`titleAlignment="${node.titleAlignment}"`)
    }
    if (node.backgroundColor) props.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.visible === false) props.push("visible={false}")
  }

  const styleProps: string[] = []

  // Sizing
  const w = formatSize(node.width)
  const h = formatSize(node.height)
  if (w) styleProps.push(`width: ${w}`)
  if (h) styleProps.push(`height: ${h}`)
  if (node.minWidth) styleProps.push(`minWidth: ${node.minWidth}`)
  if (node.maxWidth) styleProps.push(`maxWidth: ${node.maxWidth}`)
  if (node.minHeight) styleProps.push(`minHeight: ${node.minHeight}`)
  if (node.maxHeight) styleProps.push(`maxHeight: ${node.maxHeight}`)

  // Flex container
  if (node.flexDirection) styleProps.push(`flexDirection: "${node.flexDirection}"`)
  if (node.flexWrap) styleProps.push(`flexWrap: "${node.flexWrap === "nowrap" ? "no-wrap" : node.flexWrap}"`)
  if (node.justifyContent) styleProps.push(`justifyContent: "${node.justifyContent}"`)
  if (node.alignItems) styleProps.push(`alignItems: "${node.alignItems}"`)
  if (node.gap) styleProps.push(`gap: ${node.gap}`)
  if (node.rowGap) styleProps.push(`rowGap: ${node.rowGap}`)
  if (node.columnGap) styleProps.push(`columnGap: ${node.columnGap}`)

  // Flex item
  if (node.flexGrow) styleProps.push(`flexGrow: ${node.flexGrow}`)
  if (node.flexShrink !== undefined) styleProps.push(`flexShrink: ${node.flexShrink}`)
  const fb = formatSize(node.flexBasis)
  if (fb) styleProps.push(`flexBasis: ${fb}`)
  if (node.alignSelf && node.alignSelf !== "auto") styleProps.push(`alignSelf: "${node.alignSelf}"`)

  // Padding
  if (node.padding) styleProps.push(`padding: ${node.padding}`)
  if (node.paddingTop) styleProps.push(`paddingTop: ${node.paddingTop}`)
  if (node.paddingRight) styleProps.push(`paddingRight: ${node.paddingRight}`)
  if (node.paddingBottom) styleProps.push(`paddingBottom: ${node.paddingBottom}`)
  if (node.paddingLeft) styleProps.push(`paddingLeft: ${node.paddingLeft}`)

  // Margin
  if (node.margin) styleProps.push(`margin: ${node.margin}`)
  if (node.marginTop) styleProps.push(`marginTop: ${node.marginTop}`)
  if (node.marginRight) styleProps.push(`marginRight: ${node.marginRight}`)
  if (node.marginBottom) styleProps.push(`marginBottom: ${node.marginBottom}`)
  if (node.marginLeft) styleProps.push(`marginLeft: ${node.marginLeft}`)

  // Positioning
  if (node.position) styleProps.push(`position: "${node.position}"`)
  if (node.top !== undefined) styleProps.push(`top: ${node.top}`)
  if (node.right !== undefined) styleProps.push(`right: ${node.right}`)
  if (node.bottom !== undefined) styleProps.push(`bottom: ${node.bottom}`)
  if (node.left !== undefined) styleProps.push(`left: ${node.left}`)
  if (node.zIndex !== undefined) styleProps.push(`zIndex: ${node.zIndex}`)

  // Overflow
  if (node.overflow) styleProps.push(`overflow: "${node.overflow}"`)

  if (styleProps.length > 0) {
    props.push(`style={{ ${styleProps.join(", ")} }}`)
  }

  // Text element
  if (node.type === "text") {
    const textProps: string[] = []
    if (node.fg) textProps.push(`fg="${node.fg}"`)
    if (node.bg) textProps.push(`bg="${node.bg}"`)
    if (node.wrapMode) textProps.push(`wrapMode="${node.wrapMode}"`)
    if (node.visible === false) textProps.push("visible={false}")
    const content = node.content || ""
    
    let formattedContent = content
    if (node.bold && node.italic) {
      formattedContent = `<strong><em>${content}</em></strong>`
    } else if (node.bold) {
      formattedContent = `<strong>${content}</strong>`
    } else if (node.italic) {
      formattedContent = `<em>${content}</em>`
    }
    if (node.underline) {
      formattedContent = `<u>${formattedContent}</u>`
    }
    
    return `${pad}<text ${textProps.join(" ")}>${formattedContent}</text>`
  }

  // Input element
  if (node.type === "input") {
    const inputProps: string[] = []
    if (node.placeholder) inputProps.push(`placeholder="${node.placeholder}"`)
    if (node.focusedBorderColor) inputProps.push(`focusedBorderColor="${node.focusedBorderColor}"`)
    if (node.textColor) inputProps.push(`textColor="${node.textColor}"`)
    if (node.focusedTextColor) inputProps.push(`focusedTextColor="${node.focusedTextColor}"`)
    if (node.focusedBackgroundColor) inputProps.push(`focusedBackgroundColor="${node.focusedBackgroundColor}"`)
    if (node.visible === false) inputProps.push("visible={false}")
    if (styleProps.length > 0) {
      inputProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    return `${pad}<input ${inputProps.join(" ")} />`
  }

  // Textarea element
  if (node.type === "textarea") {
    const taProps: string[] = []
    if (node.placeholder) taProps.push(`placeholder="${node.placeholder}"`)
    if (node.minLines) taProps.push(`minHeight={${node.minLines}}`)
    if (node.maxLines) taProps.push(`maxHeight={${node.maxLines}}`)
    if (node.focusedBorderColor) taProps.push(`focusedBorderColor="${node.focusedBorderColor}"`)
    if (node.textColor) taProps.push(`textColor="${node.textColor}"`)
    if (node.focusedTextColor) taProps.push(`focusedTextColor="${node.focusedTextColor}"`)
    if (node.focusedBackgroundColor) taProps.push(`focusedBackgroundColor="${node.focusedBackgroundColor}"`)
    if (node.visible === false) taProps.push("visible={false}")
    if (styleProps.length > 0) {
      taProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    return `${pad}<textarea ${taProps.join(" ")} />`
  }

  // Select element
  if (node.type === "select") {
    const selProps: string[] = []
    if (node.options && node.options.length > 0) {
      const optionsStr = node.options.map(o => `{ name: "${o}", value: "${o.toLowerCase().replace(/\s+/g, "_")}" }`).join(", ")
      selProps.push(`options={[${optionsStr}]}`)
    }
    if (node.visible === false) selProps.push("visible={false}")
    if (styleProps.length > 0) {
      selProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    return `${pad}<select ${selProps.join(" ")} />`
  }

  // Slider element
  if (node.type === "slider") {
    const sliderProps: string[] = []
    if (node.orientation) sliderProps.push(`orientation="${node.orientation}"`)
    if (node.value !== undefined) sliderProps.push(`value={${node.value}}`)
    if (node.min !== undefined) sliderProps.push(`min={${node.min}}`)
    if (node.max !== undefined) sliderProps.push(`max={${node.max}}`)
    if (node.viewPortSize) sliderProps.push(`viewPortSize={${node.viewPortSize}}`)
    if (node.backgroundColor) sliderProps.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.foregroundColor) sliderProps.push(`foregroundColor="${node.foregroundColor}"`)
    if (node.visible === false) sliderProps.push("visible={false}")
    if (styleProps.length > 0) {
      sliderProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    return `${pad}<slider ${sliderProps.join(" ")} />`
  }

  // ASCII-font element
  if (node.type === "ascii-font") {
    const asciiProps: string[] = []
    if (node.text) asciiProps.push(`text="${node.text}"`)
    if (node.font) asciiProps.push(`font="${node.font}"`)
    if (node.color) asciiProps.push(`color={RGBA.fromHex("${node.color}")}`)
    if (node.visible === false) asciiProps.push("visible={false}")
    return `${pad}<ascii-font ${asciiProps.join(" ")} />`
  }

  // Tab-select element
  if (node.type === "tab-select") {
    const tabProps: string[] = []
    if (node.options && node.options.length > 0) {
      const optionsStr = node.options.map(o => `{ name: "${o}", value: "${o.toLowerCase().replace(/\s+/g, "_")}" }`).join(", ")
      tabProps.push(`options={[${optionsStr}]}`)
    }
    if (node.tabWidth) tabProps.push(`tabWidth={${node.tabWidth}}`)
    if (node.visible === false) tabProps.push("visible={false}")
    if (styleProps.length > 0) {
      tabProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    return `${pad}<tab-select ${tabProps.join(" ")} />`
  }

  // Scrollbox element
  if (node.type === "scrollbox") {
    if (node.stickyScroll) props.push(`stickyScroll={true}`)
    if (node.scrollX !== undefined) props.push(`scrollX={${node.scrollX}}`)
    if (node.scrollY !== undefined) props.push(`scrollY={${node.scrollY}}`)
    if (node.viewportCulling) props.push(`viewportCulling={true}`)
    if (node.children.length === 0) {
      return `${pad}<scrollbox ${props.join(" ")} />`
    }
    const childCode = node.children.map((c) => generateCode(c, indent + 1)).join("\n")
    return `${pad}<scrollbox ${props.join(" ")}>\n${childCode}\n${pad}</scrollbox>`
  }

  // Box element (default)
  if (node.children.length === 0) {
    return `${pad}<box ${props.join(" ")} />`
  }

  const childCode = node.children.map((c) => generateCode(c, indent + 1)).join("\n")
  return `${pad}<box ${props.join(" ")}>\n${childCode}\n${pad}</box>`
}
