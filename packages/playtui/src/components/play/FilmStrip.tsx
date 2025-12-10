import { useRef, useEffect, useState, useCallback } from "react"
import type { ScrollBoxRenderable } from "@opentui/core"
import { MouseButton } from "@opentui/core"
import { COLORS } from "../../theme"
import type { ElementNode } from "../../lib/types"
import { generateAnimationData, type AnimationData } from "../../lib/codegen"
import { copyToClipboard, readFromClipboard } from "../../lib/clipboard"
import { log } from "../../lib/logger"

const FRAME_GAP = 1

// Pad frame number with leading zeros based on total frames
function formatFrameNum(index: number, total: number): string {
  const num = index + 1
  const digits = total < 10 ? 1 : total < 100 ? 2 : total < 1000 ? 3 : 4
  return String(num).padStart(digits, "0")
}

// Calculate frame width based on total frames
function getFrameWidth(total: number): number {
  const digits = total < 10 ? 1 : total < 100 ? 2 : total < 1000 ? 3 : 4
  return digits + 2 // padding left + right
}

interface FilmStripProps {
  frames: ElementNode[]
  currentIndex: number
  onSelectFrame: (index: number) => void
  onDuplicateFrame: () => void
  onDeleteFrame: (index: number) => void
  fps: number
  onFpsChange: (fps: number) => void
  isPlaying: boolean
  onTogglePlay: () => void
  onImport: (frames: ElementNode[], fps: number) => void
}

export function FilmStrip({
  frames,
  currentIndex,
  onSelectFrame,
  onDuplicateFrame,
  onDeleteFrame,
  fps,
  onFpsChange,
  isPlaying,
  onTogglePlay,
  onImport,
}: FilmStripProps) {
  const scrollRef = useRef<ScrollBoxRenderable>(null)
  const frameWidth = getFrameWidth(frames.length)
  const [copied, setCopied] = useState(false)
  const [imported, setImported] = useState(false)
  const [clipboardError, setClipboardError] = useState<string | null>(null)

  const copyAnimationCode = useCallback(async () => {
    const data = generateAnimationData(frames, fps, "Animation")
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const result = await copyToClipboard(data, { filename: `animation-${timestamp}.json` })
    
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
      log("EXPORT_ERROR", { error: result.error })
      setClipboardError(result.error || "Failed to export")
      setTimeout(() => setClipboardError(null), 3000)
    }
  }, [frames, fps])

  const importFromClipboard = useCallback(async () => {
    const result = await readFromClipboard()
    
    if (!result.success) {
      log("IMPORT_ERROR", { error: result.error })
      setClipboardError(result.error || "Failed to read clipboard")
      setTimeout(() => setClipboardError(null), 3000)
      return
    }

    try {
      const data = JSON.parse(result.text || "") as AnimationData
      if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
        onImport(data.frames, data.fps || 10)
        setImported(true)
        setClipboardError(null)
        setTimeout(() => setImported(false), 1000)
      }
    } catch {
      log("IMPORT_PARSE_ERROR", {})
      setClipboardError("Invalid animation data in clipboard")
      setTimeout(() => setClipboardError(null), 3000)
    }
  }, [onImport])

  // Auto-scroll to keep current frame centered
  useEffect(() => {
    const sb = scrollRef.current
    if (!sb) return
    const framePos = currentIndex * (frameWidth + FRAME_GAP)
    const viewportWidth = sb.width ?? 0
    const targetScroll = framePos - viewportWidth / 2 + frameWidth / 2
    sb.scrollTo(Math.max(0, targetScroll))
  }, [currentIndex, frameWidth])

  return (
    <box
      id="film-strip"
      height={clipboardError ? 6 : 5}
      flexDirection="column"
      backgroundColor={COLORS.bgAlt}
    >
      {/* Notification bar */}
      {clipboardError && (
        <box
          id="clipboard-notification-bar"
          height={1}
          backgroundColor={clipboardError.startsWith("Saved to:") ? COLORS.accent : COLORS.danger}
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
         paddingLeft={1}
         paddingRight={1}
       >
         {/* Play/Stop Button */}
         <box
           id="play-btn"
           backgroundColor={COLORS.card}
           paddingLeft={1}
           onMouseDown={onTogglePlay}
         >
           {isPlaying 
             ? <text fg={COLORS.danger}><strong>■ STOP</strong></text>
             : <text fg={COLORS.accent}>▶ PLAY</text>
           }
         </box>

         {/* FPS Control - cohesive unit */}
         <box id="fps-control" flexDirection="row" marginLeft={1}>
           <box border={["left"]} borderColor={COLORS.muted} paddingLeft={1} paddingRight={1}>
             <text fg={COLORS.muted}>FPS</text>
           </box>
           <box flexDirection="row" gap={1} paddingLeft={1}>
             <text fg={COLORS.accent} onMouseDown={() => onFpsChange(Math.max(1, fps - 1))}>◀</text>
             <text fg={COLORS.text}><strong>{fps}</strong></text>
             <text fg={COLORS.accent} onMouseDown={() => onFpsChange(fps + 1)}>▶</text>
           </box>
           <box paddingRight={1} />
         </box>

         {/* Frame Counter */}
         <box id="frame-counter" marginLeft={1}>
           <text fg={COLORS.muted}>
             <span fg={COLORS.accent}>{formatFrameNum(currentIndex, frames.length)}</span>/{formatFrameNum(frames.length - 1, frames.length)}
           </text>
         </box>

         {/* Spacer */}
         <box flexGrow={1} />

          {/* Export Button - Card style */}
          <box
            id="export-btn"
            marginLeft={1}
            marginRight={1}
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={copied ? COLORS.success : COLORS.accent}
            onMouseDown={copyAnimationCode}
          >
            <text fg={COLORS.bg}>
              {copied ? "✓ Export" : "⎘ Export"}
            </text>
          </box>

          {/* Import Button - Card style */}
          <box
            id="import-btn"
            marginRight={1}
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={imported ? COLORS.success : (clipboardError ? COLORS.danger : COLORS.muted)}
            onMouseDown={importFromClipboard}
          >
            <text fg={COLORS.bg}>
             {clipboardError ? "✗ Error" : (imported ? "✓ Import" : "⎗ Import")}
           </text>
         </box>
       </box>

      {/* Film Strip Frames */}
      <box
        id="film-strip-frames"
        flexGrow={1}
        overflow="hidden"
        paddingLeft={1}
        paddingRight={1}
        marginTop={1}
      >
        <scrollbox
          ref={scrollRef}
          scrollX
          scrollY={false}
          onMouseScroll={(e) => {
            const sb = scrollRef.current
            if (!sb) return
            const delta = e.button === MouseButton.WHEEL_UP ? -3 : 3
            sb.scrollBy(delta * frameWidth)
          }}
          style={{
            width: "100%",
            height: 3,
            scrollbarOptions: {
              showArrows: false,
              trackOptions: {
                foregroundColor: COLORS.accent,
                backgroundColor: COLORS.bgAlt,
              },
            },
            contentOptions: {
              flexDirection: "row",
              gap: 1,
              alignItems: "flex-start",
            }
          }}
        >
          {frames.map((_, index) => {
            const isActive = index === currentIndex
            return (
              <box
                key={index}
                id={`frame-${index}`}
                width={frameWidth}
                height={2}
                border={["bottom"]}
                borderStyle="heavy"
                borderColor={isActive ? COLORS.accent : COLORS.muted}
                backgroundColor={COLORS.bgAlt}
                alignItems="center"
                justifyContent="center"
                onMouseDown={() => onSelectFrame(index)}
              >
                <text fg={isActive ? COLORS.accent : COLORS.muted}>
                  {isActive ? <strong>{formatFrameNum(index, frames.length)}</strong> : formatFrameNum(index, frames.length)}
                </text>
              </box>
            )
          })}

          {/* Add Frame Button */}
          <box
            id="add-frame-btn"
            width={3}
            height={2}
            border={["bottom"]}
            borderStyle="heavy"
            borderColor={COLORS.muted}
            alignItems="center"
            justifyContent="center"
            onMouseDown={onDuplicateFrame}
          >
            <text fg={COLORS.success}>+</text>
          </box>
        </scrollbox>
      </box>
    </box>
  )
}
