import { useState, useRef, useEffect, useCallback } from "react"
import { TextAttributes } from "@opentui/core"
import type { TextareaRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { COLORS } from "../../theme"
import { log } from "../../lib/logger"
import type { ElementNode } from "../../lib/types"
import { parseCodeMultiple } from "../../lib/parseCode"
import { copyToClipboard } from "../../lib/clipboard"
import { Bind, isKeybind } from "../../lib/shortcuts"

interface CodePanelProps {
  code: string
  tree: ElementNode
  updateTree: (tree: ElementNode) => void
  onClose: () => void
  onFocusChange?: (focused: boolean) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function CodePanel({ code, tree, updateTree, onClose, onFocusChange, isExpanded, onToggleExpand }: CodePanelProps) {
  const [isFocused, setIsFocused] = useState(true) // Start focused since panel is open
  const textareaRef = useRef<TextareaRenderable>(null)
  const codeRef = useRef(code)
  const initializedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Notify parent of focus changes
  useEffect(() => {
    onFocusChange?.(isFocused)
  }, [isFocused, onFocusChange])

  // Handle ESC to blur the code editor
  useKeyboard((key) => {
    if (isFocused && isKeybind(key, Bind.BLUR_INPUT)) {
      setIsFocused(false)
    }
  })

  // Handle live code editing - parse code and update tree
  const handleCodeChange = useCallback((newCode: string) => {
    // Empty code = clear all children
    if (!newCode.trim()) {
      updateTree({ ...tree, children: [] })
      setError(null)
      return
    }

    // Parse the code - can be one or multiple elements
    const result = parseCodeMultiple(newCode)
    if (!result.success) {
      setError(result.error || "Parse error")
      return
    }

    // Set parsed nodes as children of root
    const newChildren = result.nodes || (result.node ? [result.node] : [])
    updateTree({ ...tree, children: newChildren })
    setError(null)
  }, [tree, updateTree])

  useEffect(() => {
    if (initializedRef.current) return
    const tryInit = () => {
      if (textareaRef.current) {
        ;(textareaRef.current as any).setText(codeRef.current, { history: false })
        initializedRef.current = true
        setTimeout(() => {
          ;(textareaRef.current as any)?.setText(codeRef.current, { history: false })
          textareaRef.current?.requestRender()
        }, 0)
      } else {
        requestAnimationFrame(tryInit)
      }
    }
    tryInit()
  }, [])

  useEffect(() => {
    codeRef.current = code
  }, [code])

  useEffect(() => {
    if (!initializedRef.current || !textareaRef.current) return
    const currentText = textareaRef.current.plainText
    if (code !== currentText) {
      ;(textareaRef.current as any).setText(code, { history: false })
    }
  }, [code])

  const handleContentChange = useCallback(() => {
    const newCode = textareaRef.current?.plainText
    if (newCode !== undefined && newCode !== codeRef.current) {
      codeRef.current = newCode
      handleCodeChange(newCode)
    }
  }, [handleCodeChange])

  const copyCode = useCallback(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const result = await copyToClipboard(code, { filename: `code-${timestamp}.tsx` })
    
    if (result.success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    }
  }, [code])

  // Handle blur when clicking outside
  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  return (
    <box id="code-panel" flexDirection="column" flexGrow={1} backgroundColor={COLORS.bg}
      onMouseDown={(e) => {
        e.stopPropagation() // Prevent parent from blurring us
        setIsFocused(true)
      }}
    >
      {/* Header row */}
      <box 
        id="code-header" 
        flexDirection="row" 
        alignItems="center"
        height={1}
        backgroundColor={COLORS.bgAlt}
      >
        {/* Left: Label */}
        <box paddingLeft={1} paddingRight={1}>
          <text fg={COLORS.accent} attributes={TextAttributes.BOLD} selectable={false}>Code</text>
        </box>
        
        {/* Expand/Collapse button */}
        {onToggleExpand && (
          <box 
            id="code-expand-btn" 
            onMouseDown={onToggleExpand} 
            paddingRight={1}
          >
            <text fg={isExpanded ? COLORS.accent : COLORS.muted} selectable={false}>⛶</text>
          </box>
        )}
        
        {/* Error indicator */}
        {error && (
          <box paddingRight={2}>
            <text fg={COLORS.danger} selectable={false}>Error: {error.slice(0, 30)}</text>
          </box>
        )}
        
        {/* Spacer */}
        <box flexGrow={1} />
        
        {/* Copy button */}
        <box 
          id="code-copy-btn" 
          onMouseDown={() => copyCode()} 
          backgroundColor={copied ? COLORS.success : COLORS.bg} 
          paddingLeft={1} 
          paddingRight={1}
          marginRight={1}
        >
          <text fg={copied ? COLORS.bg : COLORS.accent} selectable={false}>{copied ? "Copied" : "Copy"}</text>
        </box>
        
        {/* Close button */}
        <box id="code-close-btn" onMouseDown={onClose} backgroundColor={COLORS.bg} paddingLeft={1} paddingRight={1}>
          <text fg={COLORS.accent} selectable={false}>Close</text>
        </box>
      </box>
      
      {/* Border separator */}
      <box height={1} border={["top"]} borderColor={COLORS.border} borderStyle="single" />
      
      {/* Code editor area */}
      <box id="code-body" flexDirection="row" flexGrow={1} backgroundColor={COLORS.bg}>
        <textarea
          ref={textareaRef}
          placeholder="Paste or edit JSX code here..."
          focused={isFocused}
          textColor={COLORS.text}
          backgroundColor="transparent"
          focusedBackgroundColor="transparent"
          cursorColor={COLORS.accent}
          style={{ flexGrow: 1, width: "100%" }}
          onContentChange={handleContentChange}
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsFocused(true)
            
            // Click-to-position cursor
            if (textareaRef.current && textareaRef.current.editBuffer) {
              const relX = e.x - textareaRef.current.x
              const relY = e.y - textareaRef.current.y
              textareaRef.current.editBuffer.setCursor(relY, relX)
              textareaRef.current.requestRender()
            }
          }}
        />
      </box>
    </box>
  )
}
