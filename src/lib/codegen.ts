import type { ElementNode, SizeValue, BorderSide, BoxNode, ScrollboxNode } from "./types"
import { isContainerNode } from "./types"
import { log } from "./logger"

function formatSize(val: SizeValue | undefined): string | undefined {
  if (val === undefined) return undefined
  if (typeof val === "number") return String(val)
  return `"${val}"`
}

function formatBorderSides(sides: BorderSide[] | undefined): string | undefined {
  if (!sides || sides.length === 0) return undefined
  return `{[${sides.map(s => `"${s}"`).join(", ")}]}`
}

// Generate code for children only (hides root wrapper)
export function generateChildrenCode(node: ElementNode): string {
  if (node.children.length === 0) {
    return ""
  }
  return node.children.map((c) => generateCode(c, 0)).join("\n")
}

export function generateCode(node: ElementNode, indent = 0): string {
  const pad = "  ".repeat(indent)
  const props: string[] = []

  log("CODEGEN", { type: node.type, name: node.name, id: node.id })

  // Name attribute (preserve element names for round-trip editing)
  // Use explicit name, or generate default from type for unnamed elements
  const name = node.name || node.type.charAt(0).toUpperCase() + node.type.slice(1)
  props.push(`name="${name}"`)

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
    if (node.shouldFill === false) props.push("shouldFill={false}")
    if (node.title) props.push(`title="${node.title}"`)
    if (node.titleAlignment && node.titleAlignment !== "left") {
      props.push(`titleAlignment="${node.titleAlignment}"`)
    }
    if (node.backgroundColor) props.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.visible === false) props.push("visible={false}")
  }

  const styleProps: string[] = []

  // Sizing (common to all elements)
  const w = formatSize(node.width)
  const h = formatSize(node.height)
  if (w) styleProps.push(`width: ${w}`)
  if (h) styleProps.push(`height: ${h}`)
  if (node.minWidth) styleProps.push(`minWidth: ${node.minWidth}`)
  if (node.maxWidth) styleProps.push(`maxWidth: ${node.maxWidth}`)
  if (node.minHeight) styleProps.push(`minHeight: ${node.minHeight}`)
  if (node.maxHeight) styleProps.push(`maxHeight: ${node.maxHeight}`)
  if (node.aspectRatio) styleProps.push(`aspectRatio: ${node.aspectRatio}`)

  // Container-only properties (flex, padding, position, overflow)
  if (isContainerNode(node)) {
    const container = node as BoxNode | ScrollboxNode
    
    // Flex container
    if (container.flexDirection) styleProps.push(`flexDirection: "${container.flexDirection}"`)
    if (container.flexWrap) styleProps.push(`flexWrap: "${container.flexWrap}"`)  // OpenTUI uses "no-wrap"
    if (container.justifyContent) styleProps.push(`justifyContent: "${container.justifyContent}"`)
    if (container.alignItems) styleProps.push(`alignItems: "${container.alignItems}"`)
    if (container.alignContent) styleProps.push(`alignContent: "${container.alignContent}"`)
    if (container.gap) styleProps.push(`gap: ${container.gap}`)
    if (container.rowGap) styleProps.push(`rowGap: ${container.rowGap}`)
    if (container.columnGap) styleProps.push(`columnGap: ${container.columnGap}`)

    // Padding
    if (container.padding) styleProps.push(`padding: ${container.padding}`)
    if (container.paddingTop) styleProps.push(`paddingTop: ${container.paddingTop}`)
    if (container.paddingRight) styleProps.push(`paddingRight: ${container.paddingRight}`)
    if (container.paddingBottom) styleProps.push(`paddingBottom: ${container.paddingBottom}`)
    if (container.paddingLeft) styleProps.push(`paddingLeft: ${container.paddingLeft}`)

    // Positioning - our x/y map to OpenTUI's left/top
    if (container.position) styleProps.push(`position: "${container.position}"`)
    if (container.x !== undefined) styleProps.push(`left: ${container.x}`)
    if (container.y !== undefined) styleProps.push(`top: ${container.y}`)
    if (container.zIndex !== undefined) styleProps.push(`zIndex: ${container.zIndex}`)

    // Overflow
    if (container.overflow) styleProps.push(`overflow: "${container.overflow}"`)
  }

  // Flex item (common to all elements)
  if (node.flexGrow) styleProps.push(`flexGrow: ${node.flexGrow}`)
  if (node.flexShrink !== undefined) styleProps.push(`flexShrink: ${node.flexShrink}`)
  const fb = formatSize(node.flexBasis)
  if (fb) styleProps.push(`flexBasis: ${fb}`)
  if (node.alignSelf && node.alignSelf !== "auto") styleProps.push(`alignSelf: "${node.alignSelf}"`)

  // Margin (common to all elements)
  if (node.margin) styleProps.push(`margin: ${node.margin}`)
  if (node.marginTop) styleProps.push(`marginTop: ${node.marginTop}`)
  if (node.marginRight) styleProps.push(`marginRight: ${node.marginRight}`)
  if (node.marginBottom) styleProps.push(`marginBottom: ${node.marginBottom}`)
  if (node.marginLeft) styleProps.push(`marginLeft: ${node.marginLeft}`)

  // Scrollbar options (for scrollbox) - must be added before style prop generation
  if (node.type === "scrollbox") {
    const hasScrollbarOpts = node.showScrollArrows || node.scrollbarForeground || node.scrollbarBackground
    if (hasScrollbarOpts) {
      const scrollbarParts: string[] = []
      if (node.showScrollArrows) scrollbarParts.push("showArrows: true")
      if (node.scrollbarForeground || node.scrollbarBackground) {
        const trackParts: string[] = []
        if (node.scrollbarForeground) trackParts.push(`foregroundColor: "${node.scrollbarForeground}"`)
        if (node.scrollbarBackground) trackParts.push(`backgroundColor: "${node.scrollbarBackground}"`)
        scrollbarParts.push(`trackOptions: { ${trackParts.join(", ")} }`)
      }
      styleProps.push(`scrollbarOptions: { ${scrollbarParts.join(", ")} }`)
    }
  }

  if (styleProps.length > 0) {
    props.push(`style={{ ${styleProps.join(", ")} }}`)
  }

  // Text element
  if (node.type === "text") {
    const textProps: string[] = []
    if (node.fg) textProps.push(`fg="${node.fg}"`)
    if (node.bg) textProps.push(`bg="${node.bg}"`)
    if (node.wrapMode && node.wrapMode !== "none") textProps.push(`wrapMode="${node.wrapMode}"`)
    if (node.selectable) textProps.push("selectable")
    if (node.visible === false) textProps.push("visible={false}")
    const content = node.content || ""
    
    // Build nested formatting tags
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
    if (node.strikethrough) {
      formattedContent = `<span strikethrough>${formattedContent}</span>`
    }
    if (node.dim) {
      formattedContent = `<span dim>${formattedContent}</span>`
    }
    
    const propsStr = textProps.length > 0 ? ` ${textProps.join(" ")}` : ""
    return `${pad}<text${propsStr}>${formattedContent}</text>`
  }

  // Input element
  if (node.type === "input") {
    const inputProps: string[] = []
    if (node.placeholder) inputProps.push(`placeholder="${node.placeholder}"`)
    if (node.placeholderColor) inputProps.push(`placeholderColor="${node.placeholderColor}"`)
    if (node.maxLength) inputProps.push(`maxLength={${node.maxLength}}`)
    if (node.textColor) inputProps.push(`textColor="${node.textColor}"`)
    if (node.focusedTextColor) inputProps.push(`focusedTextColor="${node.focusedTextColor}"`)
    if (node.backgroundColor) inputProps.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.focusedBackgroundColor) inputProps.push(`focusedBackgroundColor="${node.focusedBackgroundColor}"`)
    if (node.cursorColor) inputProps.push(`cursorColor="${node.cursorColor}"`)
    if (node.cursorStyle && node.cursorStyle !== "block") inputProps.push(`cursorStyle="${node.cursorStyle}"`)
    if (node.visible === false) inputProps.push("visible={false}")
    if (styleProps.length > 0) {
      inputProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    const propsStr = inputProps.length > 0 ? ` ${inputProps.join(" ")}` : ""
    return `${pad}<input${propsStr} />`
  }

  // Textarea element
  if (node.type === "textarea") {
    const taProps: string[] = []
    if (node.placeholder) taProps.push(`placeholder="${node.placeholder}"`)
    if (node.placeholderColor) taProps.push(`placeholderColor="${node.placeholderColor}"`)
    if (node.initialValue) taProps.push(`initialValue="${node.initialValue}"`)
    if (node.textColor) taProps.push(`textColor="${node.textColor}"`)
    if (node.focusedTextColor) taProps.push(`focusedTextColor="${node.focusedTextColor}"`)
    if (node.backgroundColor) taProps.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.focusedBackgroundColor) taProps.push(`focusedBackgroundColor="${node.focusedBackgroundColor}"`)
    if (node.cursorColor) taProps.push(`cursorColor="${node.cursorColor}"`)
    if (node.cursorStyle && node.cursorStyle !== "block") taProps.push(`cursorStyle="${node.cursorStyle}"`)
    if (node.blinking === false) taProps.push("blinking={false}")
    if (node.showCursor === false) taProps.push("showCursor={false}")
    if (node.scrollMargin) taProps.push(`scrollMargin={${node.scrollMargin}}`)
    if (node.tabIndicatorColor) taProps.push(`tabIndicatorColor="${node.tabIndicatorColor}"`)
    if (node.visible === false) taProps.push("visible={false}")
    if (styleProps.length > 0) {
      taProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    const propsStr = taProps.length > 0 ? ` ${taProps.join(" ")}` : ""
    return `${pad}<textarea${propsStr} />`
  }

  // Select element
  if (node.type === "select") {
    const selProps: string[] = []
    if (node.options && node.options.length > 0) {
      const optionsStr = node.options.map(o => `{ name: "${o}", value: "${o.toLowerCase().replace(/\s+/g, "_")}" }`).join(", ")
      selProps.push(`options={[${optionsStr}]}`)
    }
    if (node.showScrollIndicator) selProps.push("showScrollIndicator")
    if (node.showDescription) selProps.push("showDescription")
    if (node.wrapSelection) selProps.push("wrapSelection")
    if (node.itemSpacing) selProps.push(`itemSpacing={${node.itemSpacing}}`)
    if (node.fastScrollStep && node.fastScrollStep !== 5) selProps.push(`fastScrollStep={${node.fastScrollStep}}`)
    if (node.backgroundColor) selProps.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.textColor) selProps.push(`textColor="${node.textColor}"`)
    if (node.selectedBackgroundColor) selProps.push(`selectedBackgroundColor="${node.selectedBackgroundColor}"`)
    if (node.selectedTextColor) selProps.push(`selectedTextColor="${node.selectedTextColor}"`)
    if (node.descriptionColor) selProps.push(`descriptionColor="${node.descriptionColor}"`)
    if (node.selectedDescriptionColor) selProps.push(`selectedDescriptionColor="${node.selectedDescriptionColor}"`)
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
    // Include name for round-trip editing
    const name = node.name || "AsciiFont"
    asciiProps.push(`name="${name}"`)
    if (node.text) asciiProps.push(`text="${node.text}"`)
    if (node.font) asciiProps.push(`font="${node.font}"`)
    if (node.color) asciiProps.push(`color="${node.color}"`)
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
    if (node.showUnderline === false) tabProps.push("showUnderline={false}")
    if (node.wrapSelection) tabProps.push("wrapSelection")
    if (node.backgroundColor) tabProps.push(`backgroundColor="${node.backgroundColor}"`)
    if (node.textColor) tabProps.push(`textColor="${node.textColor}"`)
    if (node.selectedBackgroundColor) tabProps.push(`selectedBackgroundColor="${node.selectedBackgroundColor}"`)
    if (node.selectedTextColor) tabProps.push(`selectedTextColor="${node.selectedTextColor}"`)
    if (node.visible === false) tabProps.push("visible={false}")
    if (styleProps.length > 0) {
      tabProps.push(`style={{ ${styleProps.join(", ")} }}`)
    }
    return `${pad}<tab-select ${tabProps.join(" ")} />`
  }

  // Scrollbox element
  if (node.type === "scrollbox") {
    if (node.stickyScroll) props.push("stickyScroll")
    if (node.stickyStart && node.stickyStart !== "bottom") props.push(`stickyStart="${node.stickyStart}"`)
    if (node.scrollX) props.push("scrollX")
    if (node.scrollY === false) props.push("scrollY={false}")
    if (node.viewportCulling) props.push("viewportCulling")
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
