import { useState, useRef, useEffect, useCallback } from "react"
import type { TextareaRenderable } from "@opentui/core"
import { COLORS } from "../../theme"
import { log } from "../../lib/logger"
import type { ElementNode } from "../../lib/types"
import { parseCodeMultiple } from "../../lib/parseCode"
import { copyToClipboard } from "../../lib/clipboard"

interface CodePanelProps {
  code: string
  tree: ElementNode
  updateTree: (tree: ElementNode) => void
  onClose: () => void
}

export function CodePanel({ code, tree, updateTree, onClose }: CodePanelProps) {
  const textareaRef = useRef<TextareaRenderable>(null)
  const codeRef = useRef(code)
  const initializedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  log("CODE_PANEL_RENDER", { codeLength: code.length, codePreview: code.slice(0, 80), initialized: initializedRef.current })

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
    log("CODE_PANEL_INIT_EFFECT", { initialized: initializedRef.current, hasRef: !!textareaRef.current, codeRefLen: codeRef.current.length })
    if (initializedRef.current) return
    const tryInit = () => {
      log("CODE_PANEL_TRY_INIT", { hasRef: !!textareaRef.current, codeRefLen: codeRef.current.length, codeRefPreview: codeRef.current.slice(0, 80) })
      if (textareaRef.current) {
        textareaRef.current.setText(codeRef.current, { history: false })
        initializedRef.current = true
        setTimeout(() => {
          textareaRef.current?.setText(codeRef.current, { history: false })
          textareaRef.current?.requestRender()
        }, 0)
        log("CODE_PANEL_INIT_DONE", { setText: codeRef.current.slice(0, 80) })
      } else {
        requestAnimationFrame(tryInit)
      }
    }
    tryInit()
  }, [])

  useEffect(() => {
    log("CODE_PANEL_SYNC_REF", { oldLen: codeRef.current.length, newLen: code.length })
    codeRef.current = code
  }, [code])

  useEffect(() => {
    if (!initializedRef.current || !textareaRef.current) return
    const currentText = textareaRef.current.plainText
    if (code !== currentText) {
      textareaRef.current.setText(code, { history: false })
    }
  }, [code])

  const handleContentChange = useCallback(() => {
    const newCode = textareaRef.current?.plainText
    if (newCode !== undefined && newCode !== codeRef.current) {
      codeRef.current = newCode
      handleCodeChange(newCode)
    }
  }, [handleCodeChange])

  const [copied, setCopied] = useState(false)
  const [clipboardError, setClipboardError] = useState<string | null>(null)
  
  const copyCode = useCallback(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const result = await copyToClipboard(code, { filename: `code-${timestamp}.tsx` })
    
    if (result.success) {
      setCopied(true)
      if (result.filePath) {
        setClipboardError(`Saved to: ${result.filePath}`)
        setTimeout(() => setClipboardError(null), 5000)
      } else {
        setClipboardError(null)
      }
      setTimeout(() => setCopied(false), 1000)
    } else {
      log("CODE_COPY_ERROR", { error: result.error })
      setClipboardError(result.error || "Failed to export")
      setTimeout(() => setClipboardError(null), 3000)
    }
  }, [code])

  return (
    <box id="code-panel" style={{ flexGrow: 1, flexDirection: "column", backgroundColor: COLORS.bg }}>
      <box id="code-panel-header" style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <box style={{ flexDirection: "row", gap: 1 }}>
          {error && <text fg={COLORS.danger}>Error: {error}</text>}
          {clipboardError && (
            <text fg={clipboardError.startsWith("Saved to:") ? COLORS.accent : COLORS.danger}>
              {clipboardError}
            </text>
          )}
        </box>
        <box onMouseDown={() => copyCode()}>
          <text fg={copied ? COLORS.success : COLORS.accent}>
            {copied ? "✓ Exported" : "⎘ Copy"}
          </text>
        </box>
      </box>
      <textarea
        ref={textareaRef}
        placeholder="Paste or edit JSX code here..."
        focused
        textColor={COLORS.text}
        backgroundColor="transparent"
        focusedBackgroundColor="transparent"
        cursorColor={COLORS.accent}
        style={{ flexGrow: 1, width: "100%" }}
        onContentChange={handleContentChange}
      />
      {error && (
        <box style={{ marginTop: 1 }}>
          <text fg={COLORS.danger}>Parse error - fix to apply</text>
        </box>
      )}
    </box>
  )
}
