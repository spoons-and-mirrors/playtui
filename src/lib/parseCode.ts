// JSX Parser - Reverse of codegen.ts
// Parses JSX code string into ElementNode tree

import type { ElementNode, ElementType, SizeValue, BorderSide } from "./types"
import { genId } from "./tree"
import { log } from "./logger"

interface ParseResult {
  success: boolean
  node?: ElementNode
  error?: string
}

// Tokenizer types
interface Token {
  type: "tagOpen" | "tagClose" | "tagSelfClose" | "text" | "eof"
  name?: string
  props?: Record<string, unknown>
  content?: string
}

// Parse size value: number, "auto", or percentage
function parseSizeValue(val: unknown): SizeValue | undefined {
  if (val === undefined || val === null) return undefined
  if (typeof val === "number") return val
  if (typeof val === "string") {
    if (val === "auto") return "auto"
    if (val.endsWith("%")) return val as SizeValue
    const num = parseFloat(val)
    if (!isNaN(num)) return num
  }
  return undefined
}

// Parse prop value from string representation
function parsePropValue(val: string): unknown {
  val = val.trim()
  
  // Boolean true (standalone prop like "border")
  if (val === "") return true
  
  // String in quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1)
  }
  
  // JSX expression {value}
  if (val.startsWith("{") && val.endsWith("}")) {
    const inner = val.slice(1, -1).trim()
    
    // Array like ["top", "bottom"]
    if (inner.startsWith("[") && inner.endsWith("]")) {
      const arrayContent = inner.slice(1, -1)
      // Parse array items
      const items: string[] = []
      const matches = arrayContent.match(/"([^"]+)"/g)
      if (matches) {
        for (const m of matches) {
          items.push(m.slice(1, -1))
        }
      }
      return items
    }
    
    // Object like { width: 40, height: 20 }
    if (inner.startsWith("{") && inner.endsWith("}")) {
      return parseStyleObject(inner)
    }
    
    // Boolean
    if (inner === "true") return true
    if (inner === "false") return false
    
    // Number
    const num = parseFloat(inner)
    if (!isNaN(num)) return num
    
    // RGBA.fromHex("color") - extract color
    const rgbaMatch = inner.match(/RGBA\.fromHex\(["']([^"']+)["']\)/)
    if (rgbaMatch) return rgbaMatch[1]
    
    return inner
  }
  
  return val
}

// Parse style={{ ... }} object
function parseStyleObject(str: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  // Remove outer braces
  let inner = str.trim()
  if (inner.startsWith("{")) inner = inner.slice(1)
  if (inner.endsWith("}")) inner = inner.slice(0, -1)
  inner = inner.trim()
  if (inner.startsWith("{")) inner = inner.slice(1)
  if (inner.endsWith("}")) inner = inner.slice(0, -1)
  
  // Split by comma, but respect nested structures
  const parts: string[] = []
  let current = ""
  let depth = 0
  
  for (const char of inner) {
    if (char === "{") depth++
    else if (char === "}") depth--
    else if (char === "," && depth === 0) {
      parts.push(current.trim())
      current = ""
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  
  for (const part of parts) {
    const colonIdx = part.indexOf(":")
    if (colonIdx === -1) continue
    const key = part.slice(0, colonIdx).trim()
    let val = part.slice(colonIdx + 1).trim()
    
    // Remove quotes from string values
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      result[key] = val.slice(1, -1)
    } else {
      const num = parseFloat(val)
      result[key] = isNaN(num) ? val : num
    }
  }
  
  return result
}

// Parse props from tag string
function parseProps(propsStr: string): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  
  // Match prop patterns: name, name="value", name={value}, name={{ obj }}
  // Using a state machine approach for robustness
  let i = 0
  while (i < propsStr.length) {
    // Skip whitespace
    while (i < propsStr.length && /\s/.test(propsStr[i])) i++
    if (i >= propsStr.length) break
    
    // Read prop name
    let name = ""
    while (i < propsStr.length && /[a-zA-Z0-9_-]/.test(propsStr[i])) {
      name += propsStr[i]
      i++
    }
    if (!name) { i++; continue }
    
    // Skip whitespace
    while (i < propsStr.length && /\s/.test(propsStr[i])) i++
    
    // Check for = sign
    if (propsStr[i] !== "=") {
      // Boolean prop (no value)
      props[name] = true
      continue
    }
    i++ // Skip =
    
    // Skip whitespace
    while (i < propsStr.length && /\s/.test(propsStr[i])) i++
    
    // Read value
    let value = ""
    if (propsStr[i] === '"' || propsStr[i] === "'") {
      // Quoted string
      const quote = propsStr[i]
      i++
      while (i < propsStr.length && propsStr[i] !== quote) {
        value += propsStr[i]
        i++
      }
      i++ // Skip closing quote
      props[name] = value
    } else if (propsStr[i] === "{") {
      // JSX expression
      let depth = 0
      while (i < propsStr.length) {
        if (propsStr[i] === "{") depth++
        else if (propsStr[i] === "}") depth--
        value += propsStr[i]
        i++
        if (depth === 0) break
      }
      props[name] = parsePropValue(value)
    }
  }
  
  return props
}

// Map of element types
const ELEMENT_TYPES: Set<string> = new Set([
  "box", "text", "scrollbox", "input", "textarea", 
  "select", "slider", "ascii-font", "tab-select"
])

// Inline formatting tags that should be treated as text content, not elements
const INLINE_FORMATTING_TAGS: Set<string> = new Set([
  "strong", "em", "u", "span", "br"
])

// Tokenize JSX string
function tokenize(jsx: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < jsx.length) {
    // Skip whitespace between tags
    if (/\s/.test(jsx[i]) && tokens.length > 0 && tokens[tokens.length - 1].type !== "text") {
      i++
      continue
    }
    
    // Opening tag
    if (jsx[i] === "<") {
      // Closing tag
      if (jsx[i + 1] === "/") {
        i += 2
        let name = ""
        while (i < jsx.length && jsx[i] !== ">") {
          name += jsx[i]
          i++
        }
        i++ // Skip >
        tokens.push({ type: "tagClose", name: name.trim() })
        continue
      }
      
      // Opening or self-closing tag
      i++ // Skip <
      let tagContent = ""
      let depth = 0
      while (i < jsx.length) {
        if (jsx[i] === "{") depth++
        else if (jsx[i] === "}") depth--
        else if (jsx[i] === ">" && depth === 0) break
        tagContent += jsx[i]
        i++
      }
      
      const selfClosing = tagContent.endsWith("/")
      if (selfClosing) tagContent = tagContent.slice(0, -1)
      
      i++ // Skip >
      
      // Extract tag name and props
      const firstSpace = tagContent.search(/\s/)
      const name = firstSpace === -1 ? tagContent.trim() : tagContent.slice(0, firstSpace).trim()
      const propsStr = firstSpace === -1 ? "" : tagContent.slice(firstSpace)
      
      const props = parseProps(propsStr)
      
      tokens.push({ 
        type: selfClosing ? "tagSelfClose" : "tagOpen", 
        name, 
        props 
      })
      continue
    }
    
    // Text content (between tags)
    let text = ""
    while (i < jsx.length && jsx[i] !== "<") {
      text += jsx[i]
      i++
    }
    text = text.trim()
    if (text) {
      tokens.push({ type: "text", content: text })
    }
  }
  
  tokens.push({ type: "eof" })
  return tokens
}

// Apply style object to node
function applyStyle(node: Partial<ElementNode>, style: Record<string, unknown>): void {
  // Sizing
  if (style.width !== undefined) node.width = parseSizeValue(style.width)
  if (style.height !== undefined) node.height = parseSizeValue(style.height)
  if (style.minWidth !== undefined) node.minWidth = style.minWidth as number
  if (style.maxWidth !== undefined) node.maxWidth = style.maxWidth as number
  if (style.minHeight !== undefined) node.minHeight = style.minHeight as number
  if (style.maxHeight !== undefined) node.maxHeight = style.maxHeight as number
  if (style.aspectRatio !== undefined) node.aspectRatio = style.aspectRatio as number
  
  // Flex item
  if (style.flexGrow !== undefined) node.flexGrow = style.flexGrow as number
  if (style.flexShrink !== undefined) node.flexShrink = style.flexShrink as number
  if (style.flexBasis !== undefined) node.flexBasis = parseSizeValue(style.flexBasis) as number | "auto"
  if (style.alignSelf !== undefined) (node as any).alignSelf = style.alignSelf
  
  // Margin
  if (style.margin !== undefined) node.margin = style.margin as number
  if (style.marginTop !== undefined) node.marginTop = style.marginTop as number
  if (style.marginRight !== undefined) node.marginRight = style.marginRight as number
  if (style.marginBottom !== undefined) node.marginBottom = style.marginBottom as number
  if (style.marginLeft !== undefined) node.marginLeft = style.marginLeft as number
  
  // Container-only (box/scrollbox)
  if (style.flexDirection !== undefined) (node as any).flexDirection = style.flexDirection
  if (style.flexWrap !== undefined) (node as any).flexWrap = style.flexWrap
  if (style.justifyContent !== undefined) (node as any).justifyContent = style.justifyContent
  if (style.alignItems !== undefined) (node as any).alignItems = style.alignItems
  if (style.alignContent !== undefined) (node as any).alignContent = style.alignContent
  if (style.gap !== undefined) (node as any).gap = style.gap
  if (style.rowGap !== undefined) (node as any).rowGap = style.rowGap
  if (style.columnGap !== undefined) (node as any).columnGap = style.columnGap
  
  // Padding
  if (style.padding !== undefined) (node as any).padding = style.padding
  if (style.paddingTop !== undefined) (node as any).paddingTop = style.paddingTop
  if (style.paddingRight !== undefined) (node as any).paddingRight = style.paddingRight
  if (style.paddingBottom !== undefined) (node as any).paddingBottom = style.paddingBottom
  if (style.paddingLeft !== undefined) (node as any).paddingLeft = style.paddingLeft
  
  // Position
  if (style.position !== undefined) (node as any).position = style.position
  if (style.top !== undefined) (node as any).top = style.top
  if (style.right !== undefined) (node as any).right = style.right
  if (style.bottom !== undefined) (node as any).bottom = style.bottom
  if (style.left !== undefined) (node as any).left = style.left
  if (style.zIndex !== undefined) (node as any).zIndex = style.zIndex
  
  // Overflow
  if (style.overflow !== undefined) (node as any).overflow = style.overflow
}

// Create node from tag and props
function createNode(tagName: string, props: Record<string, unknown>): ElementNode {
  const type = tagName as ElementType
  
  log("PARSE_CREATE_NODE", { tagName, propsName: props.name, propsKeys: Object.keys(props) })
  
  const node: Partial<ElementNode> = {
    id: genId(),
    type,
    name: props.name as string | undefined,
    children: [],
  }
  
  // Apply style props first
  if (props.style && typeof props.style === "object") {
    applyStyle(node, props.style as Record<string, unknown>)
  }
  
  // Common container props (box/scrollbox)
  if (type === "box" || type === "scrollbox") {
    if (props.border !== undefined) {
      if (Array.isArray(props.border)) {
        (node as any).border = true;
        (node as any).borderSides = props.border as BorderSide[]
      } else {
        (node as any).border = Boolean(props.border)
      }
    }
    if (props.borderStyle !== undefined) (node as any).borderStyle = props.borderStyle
    if (props.borderColor !== undefined) (node as any).borderColor = props.borderColor
    if (props.focusedBorderColor !== undefined) (node as any).focusedBorderColor = props.focusedBorderColor
    if (props.shouldFill !== undefined) (node as any).shouldFill = props.shouldFill
    if (props.title !== undefined) (node as any).title = props.title
    if (props.titleAlignment !== undefined) (node as any).titleAlignment = props.titleAlignment
    if (props.backgroundColor !== undefined) (node as any).backgroundColor = props.backgroundColor
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // Scrollbox-specific
  if (type === "scrollbox") {
    if (props.stickyScroll !== undefined) (node as any).stickyScroll = props.stickyScroll
    if (props.stickyStart !== undefined) (node as any).stickyStart = props.stickyStart
    if (props.scrollX !== undefined) (node as any).scrollX = props.scrollX
    if (props.scrollY !== undefined) (node as any).scrollY = props.scrollY
    if (props.viewportCulling !== undefined) (node as any).viewportCulling = props.viewportCulling
  }
  
  // Text element
  if (type === "text") {
    if (props.fg !== undefined) (node as any).fg = props.fg
    if (props.bg !== undefined) (node as any).bg = props.bg
    if (props.wrapMode !== undefined) (node as any).wrapMode = props.wrapMode
    if (props.selectable !== undefined) (node as any).selectable = props.selectable
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // Input element
  if (type === "input") {
    if (props.placeholder !== undefined) (node as any).placeholder = props.placeholder
    if (props.placeholderColor !== undefined) (node as any).placeholderColor = props.placeholderColor
    if (props.maxLength !== undefined) (node as any).maxLength = props.maxLength
    if (props.textColor !== undefined) (node as any).textColor = props.textColor
    if (props.focusedTextColor !== undefined) (node as any).focusedTextColor = props.focusedTextColor
    if (props.backgroundColor !== undefined) (node as any).backgroundColor = props.backgroundColor
    if (props.focusedBackgroundColor !== undefined) (node as any).focusedBackgroundColor = props.focusedBackgroundColor
    if (props.cursorColor !== undefined) (node as any).cursorColor = props.cursorColor
    if (props.cursorStyle !== undefined) (node as any).cursorStyle = props.cursorStyle
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // Textarea element
  if (type === "textarea") {
    if (props.placeholder !== undefined) (node as any).placeholder = props.placeholder
    if (props.placeholderColor !== undefined) (node as any).placeholderColor = props.placeholderColor
    if (props.initialValue !== undefined) (node as any).initialValue = props.initialValue
    if (props.textColor !== undefined) (node as any).textColor = props.textColor
    if (props.focusedTextColor !== undefined) (node as any).focusedTextColor = props.focusedTextColor
    if (props.backgroundColor !== undefined) (node as any).backgroundColor = props.backgroundColor
    if (props.focusedBackgroundColor !== undefined) (node as any).focusedBackgroundColor = props.focusedBackgroundColor
    if (props.cursorColor !== undefined) (node as any).cursorColor = props.cursorColor
    if (props.cursorStyle !== undefined) (node as any).cursorStyle = props.cursorStyle
    if (props.blinking !== undefined) (node as any).blinking = props.blinking
    if (props.showCursor !== undefined) (node as any).showCursor = props.showCursor
    if (props.scrollMargin !== undefined) (node as any).scrollMargin = props.scrollMargin
    if (props.tabIndicatorColor !== undefined) (node as any).tabIndicatorColor = props.tabIndicatorColor
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // Select element
  if (type === "select") {
    if (props.options !== undefined) {
      // Options come as array of objects { name, value } - extract names
      const opts = props.options as Array<{ name: string }> | string[]
      (node as any).options = opts.map(o => typeof o === "string" ? o : o.name)
    }
    if (props.showScrollIndicator !== undefined) (node as any).showScrollIndicator = props.showScrollIndicator
    if (props.showDescription !== undefined) (node as any).showDescription = props.showDescription
    if (props.wrapSelection !== undefined) (node as any).wrapSelection = props.wrapSelection
    if (props.itemSpacing !== undefined) (node as any).itemSpacing = props.itemSpacing
    if (props.fastScrollStep !== undefined) (node as any).fastScrollStep = props.fastScrollStep
    if (props.backgroundColor !== undefined) (node as any).backgroundColor = props.backgroundColor
    if (props.textColor !== undefined) (node as any).textColor = props.textColor
    if (props.selectedBackgroundColor !== undefined) (node as any).selectedBackgroundColor = props.selectedBackgroundColor
    if (props.selectedTextColor !== undefined) (node as any).selectedTextColor = props.selectedTextColor
    if (props.descriptionColor !== undefined) (node as any).descriptionColor = props.descriptionColor
    if (props.selectedDescriptionColor !== undefined) (node as any).selectedDescriptionColor = props.selectedDescriptionColor
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // Slider element
  if (type === "slider") {
    if (props.orientation !== undefined) (node as any).orientation = props.orientation
    if (props.value !== undefined) (node as any).value = props.value
    if (props.min !== undefined) (node as any).min = props.min
    if (props.max !== undefined) (node as any).max = props.max
    if (props.viewPortSize !== undefined) (node as any).viewPortSize = props.viewPortSize
    if (props.backgroundColor !== undefined) (node as any).backgroundColor = props.backgroundColor
    if (props.foregroundColor !== undefined) (node as any).foregroundColor = props.foregroundColor
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // ASCII-font element
  if (type === "ascii-font") {
    if (props.text !== undefined) (node as any).text = props.text
    if (props.font !== undefined) (node as any).font = props.font
    if (props.color !== undefined) (node as any).color = props.color
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  // Tab-select element
  if (type === "tab-select") {
    if (props.options !== undefined) {
      const opts = props.options as Array<{ name: string }> | string[]
      (node as any).options = opts.map(o => typeof o === "string" ? o : o.name)
    }
    if (props.tabWidth !== undefined) (node as any).tabWidth = props.tabWidth
    if (props.showUnderline !== undefined) (node as any).showUnderline = props.showUnderline
    if (props.wrapSelection !== undefined) (node as any).wrapSelection = props.wrapSelection
    if (props.backgroundColor !== undefined) (node as any).backgroundColor = props.backgroundColor
    if (props.textColor !== undefined) (node as any).textColor = props.textColor
    if (props.selectedBackgroundColor !== undefined) (node as any).selectedBackgroundColor = props.selectedBackgroundColor
    if (props.selectedTextColor !== undefined) (node as any).selectedTextColor = props.selectedTextColor
    if (props.visible !== undefined) node.visible = props.visible as boolean
  }
  
  return node as ElementNode
}

// Parse text content for formatting tags
function parseTextContent(text: string): { content: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; dim?: boolean } {
  const result: { content: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; dim?: boolean } = { content: text }
  
  // Check for formatting wrappers
  let content = text
  
  // Strikethrough: <span strikethrough>...</span>
  const strikeMatch = content.match(/<span\s+strikethrough>(.*?)<\/span>/s)
  if (strikeMatch) {
    result.strikethrough = true
    content = strikeMatch[1]
  }
  
  // Dim: <span dim>...</span>
  const dimMatch = content.match(/<span\s+dim>(.*?)<\/span>/s)
  if (dimMatch) {
    result.dim = true
    content = dimMatch[1]
  }
  
  // Underline: <u>...</u>
  const uMatch = content.match(/<u>(.*?)<\/u>/s)
  if (uMatch) {
    result.underline = true
    content = uMatch[1]
  }
  
  // Bold+Italic: <strong><em>...</em></strong>
  const boldItalicMatch = content.match(/<strong><em>(.*?)<\/em><\/strong>/s)
  if (boldItalicMatch) {
    result.bold = true
    result.italic = true
    content = boldItalicMatch[1]
  } else {
    // Bold: <strong>...</strong>
    const boldMatch = content.match(/<strong>(.*?)<\/strong>/s)
    if (boldMatch) {
      result.bold = true
      content = boldMatch[1]
    }
    
    // Italic: <em>...</em>
    const italicMatch = content.match(/<em>(.*?)<\/em>/s)
    if (italicMatch) {
      result.italic = true
      content = italicMatch[1]
    }
  }
  
  result.content = content
  return result
}

// Recursive parser using token stream
function parseTokens(tokens: Token[], index: number): { node: ElementNode | null; nextIndex: number; error?: string } {
  if (index >= tokens.length) {
    return { node: null, nextIndex: index, error: "Unexpected end of input" }
  }
  
  const token = tokens[index]
  
  if (token.type === "eof") {
    return { node: null, nextIndex: index }
  }
  
  if (token.type === "tagSelfClose") {
    if (!token.name || !ELEMENT_TYPES.has(token.name)) {
      // Skip inline formatting tags silently
      if (token.name && INLINE_FORMATTING_TAGS.has(token.name)) {
        return { node: null, nextIndex: index + 1 }
      }
      return { node: null, nextIndex: index + 1, error: `Unknown element type: ${token.name}` }
    }
    const node = createNode(token.name, token.props || {})
    return { node, nextIndex: index + 1 }
  }
  
  if (token.type === "tagOpen") {
    // Skip inline formatting tags - consume until matching close tag
    if (token.name && INLINE_FORMATTING_TAGS.has(token.name)) {
      let i = index + 1
      let depth = 1
      while (i < tokens.length && depth > 0) {
        const t = tokens[i]
        if (t.type === "tagOpen" && t.name === token.name) depth++
        if (t.type === "tagClose" && t.name === token.name) depth--
        i++
      }
      return { node: null, nextIndex: i }
    }
    
    if (!token.name || !ELEMENT_TYPES.has(token.name)) {
      return { node: null, nextIndex: index + 1, error: `Unknown element type: ${token.name}` }
    }
    
    const node = createNode(token.name, token.props || {})
    let i = index + 1
    
    // Parse children
    while (i < tokens.length) {
      const child = tokens[i]
      
      if (child.type === "tagClose" && child.name === token.name) {
        return { node, nextIndex: i + 1 }
      }
      
      if (child.type === "text" && node.type === "text") {
        // Text content for text element
        const parsed = parseTextContent(child.content || "")
        ;(node as any).content = parsed.content
        if (parsed.bold) (node as any).bold = true
        if (parsed.italic) (node as any).italic = true
        if (parsed.underline) (node as any).underline = true
        if (parsed.strikethrough) (node as any).strikethrough = true
        if (parsed.dim) (node as any).dim = true
        i++
        continue
      }
      
      if (child.type === "tagOpen" || child.type === "tagSelfClose") {
        const result = parseTokens(tokens, i)
        if (result.error) return result
        if (result.node) {
          node.children.push(result.node)
        }
        i = result.nextIndex
        continue
      }
      
      i++
    }
    
    return { node: null, nextIndex: i, error: `Unclosed tag: ${token.name}` }
  }
  
  return { node: null, nextIndex: index + 1 }
}

// Main parse function
export function parseCode(jsx: string): ParseResult {
  try {
    const trimmed = jsx.trim()
    if (!trimmed) {
      return { success: false, error: "Empty input" }
    }
    
    const tokens = tokenize(trimmed)
    const result = parseTokens(tokens, 0)
    
    if (result.error) {
      return { success: false, error: result.error }
    }
    
    if (!result.node) {
      return { success: false, error: "No valid element found" }
    }
    
    return { success: true, node: result.node }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Parse error" }
  }
}

// Parse multiple elements (for pasting multiple siblings)
export function parseCodeMultiple(jsx: string): ParseResult & { nodes?: ElementNode[] } {
  try {
    const trimmed = jsx.trim()
    if (!trimmed) {
      return { success: false, error: "Empty input" }
    }
    
    const tokens = tokenize(trimmed)
    const nodes: ElementNode[] = []
    let i = 0
    
    while (i < tokens.length && tokens[i].type !== "eof") {
      const result = parseTokens(tokens, i)
      if (result.error) {
        return { success: false, error: result.error }
      }
      if (result.node) {
        nodes.push(result.node)
      }
      i = result.nextIndex
    }
    
    if (nodes.length === 0) {
      return { success: false, error: "No valid elements found" }
    }
    
    return { success: true, nodes, node: nodes[0] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Parse error" }
  }
}
