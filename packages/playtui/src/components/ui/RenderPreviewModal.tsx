import { RGBA } from '@opentui/core'
import { COLORS } from '../../theme'
import { useKeyboard } from '@opentui/react'
import { parseCodeMultiple } from '../../lib/parseCode'
import { Renderer } from '../Renderer'
import type { ReactNode } from 'react'

interface RenderPreviewModalProps {
  code: string
  onClose: () => void
  width: number
  height: number
}

export function RenderPreviewModal({
  code,
  onClose,
  width,
  height,
}: RenderPreviewModalProps) {
  useKeyboard((key) => {
    if (key.name === 'escape') onClose()
  })

  let renderedContent: ReactNode = null
  let error: string | null = null

  try {
    const cleanCode = code.trim()

    if (!cleanCode) {
      error = 'No code to render'
    } else {
      const result = parseCodeMultiple(cleanCode)
      if (!result.success) {
        error = result.error || 'Parse error'
      } else {
        const nodes = result.nodes || []
        if (nodes.length === 0) {
          error = 'No content to render'
        } else {
          const previewRoot = {
            type: 'box' as const,
            id: 'preview-root',
            name: 'Preview',
            children: nodes
              .filter(Boolean)
              .map((n) => ({ ...n, children: n.children || [] })),
          }
          const noop = () => {}
          renderedContent = (
            <Renderer
              node={previewRoot}
              selectedId={null}
              hoveredId={null}
              onSelect={noop}
              onHover={noop}
            />
          )
        }
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  const modalWidth = Math.min(Math.floor(width * 0.9), width - 10)
  const modalHeight = Math.min(Math.floor(height * 0.9), height - 6)

  return (
    <box
      id="render-preview-modal"
      position="absolute"
      left={0}
      top={0}
      style={{
        width,
        height,
        backgroundColor: RGBA.fromInts(0, 0, 0, 200),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
      }}
      onMouseDown={onClose}
    >
      <box
        id="render-preview-content"
        border
        borderStyle="rounded"
        borderColor={COLORS.accent}
        title="Live Render Preview"
        titleAlignment="center"
        style={{
          width: modalWidth,
          height: modalHeight,
          backgroundColor: COLORS.card,
          flexDirection: 'column',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {error ? (
          <box
            id="render-error"
            style={{
              padding: 2,
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <box
              style={{ flexDirection: 'column', gap: 1, alignItems: 'center' }}
            >
              <text fg={COLORS.danger}>Render Error:</text>
              <text fg={COLORS.text}>{error}</text>
              <text fg={COLORS.muted} style={{ marginTop: 1 }}>
                Press ESC to close
              </text>
            </box>
          </box>
        ) : (
          <box
            id="render-viewport"
            style={{
              padding: 1,
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderedContent}
          </box>
        )}

        <box
          id="render-footer"
          style={{
            height: 1,
            backgroundColor: COLORS.bgAlt,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <text fg={COLORS.muted} selectable={false}>
            Press ESC or click outside to close
          </text>
        </box>
      </box>
    </box>
  )
}
