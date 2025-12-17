import { useRef, useEffect, useState, useCallback } from 'react'
import type { ScrollBoxRenderable } from '@opentui/core'
import { MouseButton } from '@opentui/core'
import { COLORS } from '../../theme'
import type { Renderable } from '../../lib/types'
import type { AnimatedProperty } from '../../lib/keyframing'
import {
  FILMSTRIP_BASE_HEIGHT,
  FILMSTRIP_ERROR_EXTRA_HEIGHT,
} from '../../lib/constants'
import { bakeKeyframedFrames } from '../../lib/keyframing'
import { generateAnimationModule } from '../../lib/codegen'
import { parseAnimationModule } from '../../lib/parseCode'
import { copyToClipboard, readFromClipboard } from '../../lib/clipboard'
import { log } from '../../lib/logger'
import { Bind, isKeybind } from '../../lib/shortcuts'

const FRAME_GAP = 1
const DOUBLE_CLICK_MS = 300

// Pad frame number with leading zeros based on total frames (minimum 2 digits)
function formatFrameNum(index: number, total: number): string {
  const num = index + 1
  const digits = total < 100 ? 2 : total < 1000 ? 3 : 4
  return String(num).padStart(digits, '0')
}

// Calculate frame width based on total frames (minimum 2 digits)
function getFrameWidth(total: number): number {
  const digits = total < 100 ? 2 : total < 1000 ? 3 : 4
  return digits + 2 // padding left + right
}

interface FilmStripProps {
  frames: Renderable[]
  animatedProperties: AnimatedProperty[]
  currentIndex: number
  onSelectFrame: (index: number) => void
  onDuplicateFrame: () => void
  onDeleteFrame: (index: number) => void
  fps: number
  onFpsChange: (fps: number) => void
  onFrameCountChange: (count: number) => void
  isPlaying: boolean
  onTogglePlay: () => void
  onImport: (frames: Renderable[], fps: number) => void
  onEditingChange?: (editing: boolean) => void
}

export function FilmStrip({
  frames,
  animatedProperties,
  currentIndex,
  onSelectFrame,
  onDuplicateFrame,
  onDeleteFrame,
  fps,
  onFpsChange,
  onFrameCountChange,
  isPlaying,
  onTogglePlay,
  onImport,
  onEditingChange,
}: FilmStripProps) {
  const scrollRef = useRef<ScrollBoxRenderable>(null)
  const frameWidth = getFrameWidth(frames.length)
  const [copied, setCopied] = useState(false)
  const [imported, setImported] = useState(false)
  const [clipboardError, setClipboardError] = useState<string | null>(null)

  // Editable field state: "fps" | "frameCount" | null
  const [editingField, setEditingField] = useState<'fps' | 'frameCount' | null>(
    null,
  )
  const [editValue, setEditValue] = useState('')

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(editingField !== null)
  }, [editingField, onEditingChange])

  // Double-click detection
  const lastClickRef = useRef<{ field: string; time: number } | null>(null)

  const copyAnimationCode = useCallback(async () => {
    const bakedFrames = bakeKeyframedFrames(frames, animatedProperties)
    const tsxCode = generateAnimationModule(bakedFrames, fps, 'Animation')
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5)
    const result = await copyToClipboard(tsxCode, {
      filename: `animation-${timestamp}.tsx`,
    })

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
      log('EXPORT_ERROR', { error: result.error })
      setClipboardError(result.error || 'Failed to export')
      setTimeout(() => setClipboardError(null), 3000)
    }
  }, [frames, animatedProperties, fps])

  const importFromClipboard = useCallback(async () => {
    const result = await readFromClipboard()

    if (!result.success) {
      log('IMPORT_ERROR', { error: result.error })
      setClipboardError(result.error || 'Failed to read clipboard')
      setTimeout(() => setClipboardError(null), 3000)
      return
    }

    const text = result.text || ''

    // Try parsing as TSX animation module
    const parseResult = parseAnimationModule(text)
    if (parseResult.success && parseResult.frames) {
      onImport(parseResult.frames, parseResult.fps || 10)
      setImported(true)
      setClipboardError(null)
      setTimeout(() => setImported(false), 1000)
      return
    }

    log('IMPORT_PARSE_ERROR', { error: parseResult.error })
    setClipboardError(parseResult.error || 'Invalid animation format')
    setTimeout(() => setClipboardError(null), 3000)
  }, [onImport])

  // Handle starting edit mode for FPS or frame count
  const startEditing = useCallback(
    (field: 'fps' | 'frameCount') => {
      setEditingField(field)
      setEditValue(field === 'fps' ? String(fps) : String(frames.length))
    },
    [fps, frames.length],
  )

  // Handle submitting the edited value
  const submitEdit = useCallback(() => {
    if (!editingField) return
    const num = parseInt(editValue, 10)
    if (isNaN(num) || num < 1) {
      setEditingField(null)
      return
    }
    if (editingField === 'fps') {
      onFpsChange(num)
    } else {
      onFrameCountChange(num)
    }
    setEditingField(null)
  }, [editingField, editValue, onFpsChange, onFrameCountChange])

  // Handle canceling edit
  const cancelEdit = useCallback(() => {
    setEditingField(null)
  }, [])

  // Handle click with double-click detection
  const handleFieldClick = useCallback(
    (field: 'fps' | 'frameCount') => {
      const now = Date.now()
      const last = lastClickRef.current
      if (last && last.field === field && now - last.time < DOUBLE_CLICK_MS) {
        // Double click detected
        startEditing(field)
        lastClickRef.current = null
      } else {
        lastClickRef.current = { field, time: now }
      }
    },
    [startEditing],
  )

  // Auto-scroll with pagination - only scroll when playhead goes out of view
  // When it does, jump a full "page" so playhead appears on the left side
  useEffect(() => {
    const sb = scrollRef.current
    if (!sb) return
    const framePos = currentIndex * (frameWidth + FRAME_GAP)
    const viewportWidth = sb.width ?? 0
    const scrollLeft = sb.scrollLeft ?? 0

    // Calculate which "page" the current frame should be on
    // Each page shows viewportWidth worth of frames
    const playheadLeft = framePos
    const playheadRight = framePos + frameWidth

    // If playhead is left of viewport, page backward
    if (playheadLeft < scrollLeft) {
      // Scroll so playhead is at the right edge of the viewport
      const targetScroll = Math.max(0, playheadRight - viewportWidth)
      sb.scrollTo({ x: targetScroll, y: 0 })
      // If playhead is right of viewport, page forward
    } else if (playheadRight > scrollLeft + viewportWidth) {
      // Scroll so playhead is at the left edge of the viewport
      sb.scrollTo({ x: playheadLeft, y: 0 })
    }
    // Otherwise, do not scroll - let playhead move within the viewport
  }, [currentIndex, frameWidth])

  return (
    <box
      id="film-strip"
      width="100%"
      height={
        clipboardError
          ? FILMSTRIP_BASE_HEIGHT + FILMSTRIP_ERROR_EXTRA_HEIGHT
          : FILMSTRIP_BASE_HEIGHT
      }
      flexDirection="column"
      backgroundColor={COLORS.bgAlt}
      paddingBottom={0}
      // paddingLeft={1}
      // paddingRight={1}
    >
      {/* Top border separator */}
      <box
        id="film-strip-border"
        width="100%"
        height={1}
        border={['top']}
        borderStyle="single"
        borderColor={COLORS.border}
        backgroundColor={COLORS.bg}
      />

      {/* Notification bar */}
      {clipboardError && (
        <box
          id="clipboard-notification-bar"
          height={1}
          backgroundColor={
            clipboardError.startsWith('Saved to:')
              ? COLORS.accent
              : COLORS.danger
          }
          paddingLeft={1}
        >
          <text fg={COLORS.bg}>{clipboardError}</text>
        </box>
      )}

      {/* Top Bar: Play | FPS | Frame Counter | Export/Import */}
      <box
        id="film-strip-header"
        height={1}
        flexDirection="row"
        alignItems="center"
      >
        {/* Play/Stop Button */}
        <box
          id="play-btn"
          backgroundColor={COLORS.card}
          paddingLeft={1}
          onMouseDown={onTogglePlay}
        >
          {isPlaying ? (
            <text fg={COLORS.danger}>
              <strong>■ STOP</strong>
            </text>
          ) : (
            <text fg={COLORS.accent}>▶ PLAY</text>
          )}
        </box>

        {/* FPS Control - cohesive unit */}
        <box id="fps-control" flexDirection="row" marginLeft={1}>
          <box
            border={['left']}
            borderColor={COLORS.muted}
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg={COLORS.muted}>FPS</text>
          </box>
          <box flexDirection="row" gap={1} paddingLeft={1}>
            <text
              fg={COLORS.accent}
              onMouseDown={() => onFpsChange(Math.max(1, fps - 1))}
            >
              ◀
            </text>
            {editingField === 'fps' ? (
              <input
                value={editValue}
                focused
                width={4}
                backgroundColor={COLORS.bg}
                textColor={COLORS.text}
                onInput={setEditValue}
                onSubmit={submitEdit}
                onKeyDown={(key) => {
                  if (isKeybind(key, Bind.MODAL_CLOSE)) cancelEdit()
                }}
              />
            ) : (
              <text
                fg={COLORS.text}
                onMouseDown={() => handleFieldClick('fps')}
              >
                <strong>{fps}</strong>
              </text>
            )}
            <text fg={COLORS.accent} onMouseDown={() => onFpsChange(fps + 1)}>
              ▶
            </text>
          </box>
          <box paddingRight={1} />
        </box>

        {/* Frame Counter */}
        <box id="frame-counter" marginLeft={1} flexDirection="row">
          <text fg={COLORS.muted}>
            <span fg={COLORS.accent}>
              {formatFrameNum(currentIndex, frames.length)}
            </span>
            /
          </text>
          {editingField === 'frameCount' ? (
            <input
              value={editValue}
              focused
              width={4}
              backgroundColor={COLORS.bg}
              textColor={COLORS.text}
              onInput={setEditValue}
              onSubmit={submitEdit}
              onKeyDown={(key) => {
                if (isKeybind(key, Bind.MODAL_CLOSE)) cancelEdit()
              }}
            />
          ) : (
            <text
              fg={COLORS.muted}
              onMouseDown={() => handleFieldClick('frameCount')}
            >
              {formatFrameNum(frames.length - 1, frames.length)}
            </text>
          )}
        </box>

        {/* Spacer */}
        <box flexGrow={1} />

        {/* Export Button */}
        <box
          id="export-btn"
          marginRight={1}
          paddingLeft={1}
          paddingRight={1}
          backgroundColor={copied ? COLORS.success : COLORS.bg}
          border={['left']}
          borderStyle="heavy"
          borderColor={COLORS.accent}
          onMouseDown={copyAnimationCode}
        >
          <text fg={copied ? COLORS.bg : COLORS.accent}>Export</text>
        </box>

        {/* Import Button */}
        <box
          id="import-btn"
          paddingLeft={1}
          paddingRight={1}
          backgroundColor={imported ? COLORS.success : COLORS.bg}
          border={['left']}
          borderStyle="heavy"
          borderColor={COLORS.accent}
          onMouseDown={importFromClipboard}
        >
          <text fg={imported ? COLORS.bg : COLORS.accent}>
            {clipboardError ? 'Error' : 'Import'}
          </text>
        </box>
      </box>

      {/* Film Strip Frames */}
      <box
        id="film-strip-frames"
        flexGrow={1}
        overflow="hidden"
        paddingRight={1}
        marginTop={1}
        onMouseScroll={(e) => {
          const sb = scrollRef.current
          if (!sb || !e.scroll) return
          const delta = e.scroll.direction === 'up' ? -1 : 1
          sb.scrollBy({ x: delta * frameWidth * 5, y: 0 })
        }}
      >
        <scrollbox
          ref={scrollRef}
          scrollX
          scrollY={false}
          scrollbarOptions={{
            showArrows: false,
            trackOptions: {
              foregroundColor: COLORS.accent,
              backgroundColor: COLORS.bgAlt,
            },
          }}
          style={{
            width: '100%',
            height: 2,
            contentOptions: {
              flexDirection: 'row',
              gap: 1,
              alignItems: 'flex-start',
              flexShrink: 0,
            },
          }}
        >
          {frames.map((_, index) => {
            const isActive = index === currentIndex
            const label = formatFrameNum(index, frames.length)
            return (
              <box
                key={index}
                id={`frame-${index}`}
                flexDirection="column"
                flexShrink={0}
                onMouseDown={() => onSelectFrame(index)}
              >
                {/* Number card */}
                <box
                  width={frameWidth}
                  height={1}
                  backgroundColor={isActive ? COLORS.accent : COLORS.bg}
                  alignItems="center"
                  justifyContent="center"
                >
                  <text
                    fg={isActive ? COLORS.bg : COLORS.muted}
                    selectable={false}
                  >
                    {isActive ? <strong>{label}</strong> : label}
                  </text>
                </box>
                {/* Border box */}
                <box
                  width={label.length}
                  height={1}
                  border={['bottom']}
                  borderStyle="heavy"
                  borderColor={isActive ? COLORS.accent : COLORS.border}
                  backgroundColor={COLORS.bgAlt}
                  alignSelf="center"
                />
              </box>
            )
          })}

          {/* Add Frame Button */}
          <box
            id="add-frame-btn"
            width={3}
            height={1}
            flexShrink={0}
            backgroundColor={COLORS.bg}
            alignItems="center"
            justifyContent="center"
            onMouseDown={onDuplicateFrame}
          >
            <text fg={COLORS.accent}>+</text>
          </box>
        </scrollbox>
      </box>

      {/* Bottom border separator */}
      <box
        id="film-strip-border-bottom"
        width="100%"
        height={1}
        border={['bottom']}
        borderStyle="single"
        borderColor={COLORS.border}
        backgroundColor={COLORS.bg}
      />
    </box>
  )
}
