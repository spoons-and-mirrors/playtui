// JSX Parser - Reverse of codegen.ts
// Parses JSX code string into RenderableNode tree

import type { RenderableNode, RenderableType, SizeValue, BorderSide } from "./types"
import { genId } from "./tree"
import { log } from "./logger"
import { RENDERABLE_REGISTRY, RENDERABLE_TYPES as REGISTRY_RENDERABLE_TYPES } from "../components/renderables"

// Build global style property map from registry to avoid manual mapping
// Maps style prop key (e.g. "top") to node prop key (e.g. "y") and type
const STYLE_PROP_MAP: Record<string, { key: string; type: string }> = {}

// Populate map once
Object.values(RENDERABLE_REGISTRY).forEach((entry) => {
  entry.properties.forEach((prop) => {
    if (prop.styleProp) {
      STYLE_PROP_MAP[prop.styleProp] = { key: prop.key, type: prop.type }
    }
  })
})

// Apply registry-defined properties from parsed JSX props to node
function applyRegistryProps(node: Partial<RenderableNode>, type: RenderableType, props: Record<string, unknown>): void {
  const entry = RENDERABLE_REGISTRY[type]
  if (!entry?.properties) return

  for (const propDef of entry.properties) {
    const value = props[propDef.key]
    if (value === undefined) continue

    // Special handling for options arrays (select/tab-select)
    if (propDef.type === "options") {
      const opts = value as Array<{ name: string }> | string[]
      ;(node as Record<string, unknown>)[propDef.key] = opts.map(o => typeof o === "string" ? o : o.name)
      continue
    }

    // All other props - direct assignment
    ;(node as Record<string, unknown>)[propDef.key] = value
  }
}

interface ParseResult {
  success: boolean
  node?: RenderableNode
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

// Map of renderable types
const RENDERABLE_TYPES = new Set(REGISTRY_RENDERABLE_TYPES)

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
function applyStyle(node: Partial<RenderableNode>, style: Record<string, unknown>): void {
  for (const [styleKey, styleValue] of Object.entries(style)) {
    if (styleValue === undefined) continue
    
    // Check registry map first
    const mapEntry = STYLE_PROP_MAP[styleKey]
    if (mapEntry) {
      const { key, type } = mapEntry
      
      // Handle special types
      if (type === "size") {
        (node as any)[key] = parseSizeValue(styleValue)
      } else if (type === "number") {
        const num = typeof styleValue === "number" ? styleValue : parseFloat(String(styleValue))
        if (!isNaN(num)) (node as any)[key] = num
      } else {
        // Direct assignment for other types (string, enum, etc)
        (node as any)[key] = styleValue
      }
      continue
    }

    // Fallback for known props not in registry styleProp (legacy/compatibility)
    if (styleKey === "top") { (node as any).y = styleValue; continue }
    if (styleKey === "left") { (node as any).x = styleValue; continue }
    
    // Direct map attempts (if key matches exactly)
    // This catches anything we missed or future standard props
    if (keyInNode(node, styleKey)) {
        (node as any)[styleKey] = styleValue
    }
  }
}

// Helper to check if key exists in node type (at runtime this is just 'any' check but safe enough for assignment)
function keyInNode(node: Partial<RenderableNode>, key: string): boolean {
  // We allow arbitrary assignment to node from style for flexibility, 
  // but strictly strictly defined registry props are preferred.
  return true 
}

// Create node from tag and props
function createNode(tagName: string, props: Record<string, unknown>): RenderableNode {
  const type = tagName as RenderableType
  
  log("PARSE_CREATE_NODE", { tagName, propsName: props.name, propsKeys: Object.keys(props) })
  
  const node: Partial<RenderableNode> = {
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
  
  // Apply registry-defined props for scrollbox (stickyScroll, scrollX, etc.)
  if (type === "scrollbox") {
    applyRegistryProps(node, type, props)
  }
  
  // Apply registry-defined props for all other renderable types
  if (type !== "box" && type !== "scrollbox") {
    applyRegistryProps(node, type, props)
  }
  
  return node as RenderableNode
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
function parseTokens(tokens: Token[], index: number): { node: RenderableNode | null; nextIndex: number; error?: string } {
  if (index >= tokens.length) {
    return { node: null, nextIndex: index, error: "Unexpected end of input" }
  }
  
  const token = tokens[index]
  
  if (token.type === "eof") {
    return { node: null, nextIndex: index }
  }
  
  if (token.type === "tagSelfClose") {
    if (!token.name || !RENDERABLE_TYPES.has(token.name as RenderableType)) {
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
    // Handle inline formatting tags inside text - extract content and formatting
    if (token.name && INLINE_FORMATTING_TAGS.has(token.name)) {
      // We need to collect the text content and return it with formatting info
      // This is handled by parseTextContent when we encounter text tokens
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
    
    if (!token.name || !RENDERABLE_TYPES.has(token.name as RenderableType)) {
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
      
      // Text content for text element (plain text without formatting)
      if (child.type === "text" && node.type === "text") {
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
      
      // Handle inline formatting tags inside text element - extract content and apply formatting
      if (child.type === "tagOpen" && child.name && INLINE_FORMATTING_TAGS.has(child.name) && node.type === "text") {
        const formatTag = child.name
        i++ // skip opening tag
        
        // Collect text content inside the formatting tag
        let textContent = ""
        while (i < tokens.length) {
          const inner = tokens[i]
          if (inner.type === "tagClose" && inner.name === formatTag) {
            i++ // skip closing tag
            break
          }
          if (inner.type === "text") {
            textContent += inner.content || ""
          }
          i++
        }
        
        // Apply formatting based on tag
        ;(node as any).content = textContent
        if (formatTag === "strong") (node as any).bold = true
        if (formatTag === "em") (node as any).italic = true
        if (formatTag === "u") (node as any).underline = true
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
export function parseCodeMultiple(jsx: string): ParseResult & { nodes?: RenderableNode[] } {
  try {
    const trimmed = jsx.trim()
    if (!trimmed) {
      return { success: false, error: "Empty input" }
    }
    
    const tokens = tokenize(trimmed)
    const nodes: RenderableNode[] = []
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

// Parse animation module TSX format
// Extracts frames array and metadata from: export const animation = { name, fps, frames: [...] }
export function parseAnimationModule(tsx: string): { success: boolean; frames?: RenderableNode[]; fps?: number; name?: string; error?: string } {
  try {
    // Extract name
    const nameMatch = tsx.match(/name:\s*"([^"]*)"/)
    const name = nameMatch?.[1] || "Animation"
    
    // Extract fps
    const fpsMatch = tsx.match(/fps:\s*(\d+)/)
    const fps = fpsMatch ? parseInt(fpsMatch[1], 10) : 10
    
    // Extract frames array content
    const framesMatch = tsx.match(/frames:\s*\[([\s\S]*)\]\s*\}/)
    if (!framesMatch) {
      return { success: false, error: "Could not find frames array" }
    }
    
    const framesContent = framesMatch[1]
    
    // Split frames by "// Frame N" comments
    const frameChunks = framesContent.split(/\/\/\s*Frame\s+\d+/).filter(chunk => chunk.trim())
    
    const frames: RenderableNode[] = []
    
    for (const chunk of frameChunks) {
      // Clean up the chunk - remove trailing comma
      let frameJsx = chunk.trim()
      if (frameJsx.endsWith(",")) {
        frameJsx = frameJsx.slice(0, -1).trim()
      }
      
      if (!frameJsx) continue
      
      // Parse the frame JSX
      const result = parseCode(frameJsx)
      if (result.success && result.node) {
        // Wrap in root node structure expected by PlayTUI
        const rootNode: RenderableNode = {
          id: "root",
          type: "box",
          name: "Root",
          width: "auto",
          height: "auto",
          backgroundColor: "#1a1a2e",
          flexDirection: "column",
          padding: 2,
          gap: 1,
          children: [result.node],
        } as RenderableNode
        frames.push(rootNode)
      } else {
        log("PARSE_ANIMATION_FRAME_ERROR", { error: result.error, chunk: frameJsx.slice(0, 100) })
      }
    }
    
    if (frames.length === 0) {
      return { success: false, error: "No valid frames found" }
    }
    
    return { success: true, frames, fps, name }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Parse error" }
  }
}
