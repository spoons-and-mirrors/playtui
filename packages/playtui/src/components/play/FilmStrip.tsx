import { useRef, useEffect, useState, useCallback } from "react"
import type { ScrollBoxRenderable } from "@opentui/core"
import { MouseButton } from "@opentui/core"
import { COLORS } from "../../theme"
import type { ElementNode } from "../../lib/types"
import type { AnimatedProperty } from "../../lib/keyframing"
import { bakeKeyframedFrames } from "../../lib/keyframing"
import { generateAnimationModule } from "../../lib/codegen"
import { parseAnimationModule } from "../../lib/parseCode"
import { copyToClipboard, readFromClipboard } from "../../lib/clipboard"
import { log } from "../../lib/logger"

const FRAME_GAP = 1

// Pad frame number with leading zeros based on total frames (minimum 2 digits)
function formatFrameNum(index: number, total: number): string {
  const num = index + 1
  const digits = total < 100 ? 2 : total < 1000 ? 3 : 4
  return String(num).padStart(digits, "0")
}

// Calculate frame width based on total frames (minimum 2 digits)
function getFrameWidth(total: number): number {
  const digits = total < 100 ? 2 : total < 1000 ? 3 : 4
  return digits + 2 // padding left + right
}

interface FilmStripProps {
  frames: ElementNode[]
  animatedProperties: AnimatedProperty[]
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
  animatedProperties,
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
    const bakedFrames = bakeKeyframedFrames(frames, animatedProperties)
    const tsxCode = generateAnimationModule(bakedFrames, fps, "Animation")
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const result = await copyToClipboard(tsxCode, { filename: `animation-${timestamp}.tsx` })
    
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
  }, [frames, animatedProperties, fps])

  const importFromClipboard = useCallback(async () => {
    const result = await readFromClipboard()
    
    if (!result.success) {
      log("IMPORT_ERROR", { error: result.error })
      setClipboardError(result.error || "Failed to read clipboard")
      setTimeout(() => setClipboardError(null), 3000)
      return
    }

    const text = result.text || ""
    
    // Try parsing as TSX animation module
    const parseResult = parseAnimationModule(text)
    if (parseResult.success && parseResult.frames) {
      onImport(parseResult.frames, parseResult.fps || 10)
      setImported(true)
      setClipboardError(null)
      setTimeout(() => setImported(false), 1000)
      return
    }
    
    log("IMPORT_PARSE_ERROR", { error: parseResult.error })
    setClipboardError(parseResult.error || "Invalid animation format")
    setTimeout(() => setClipboardError(null), 3000)
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
      width="100%"
      height={clipboardError ? 7 : 6}
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
        border={["top"]}
        borderStyle="single"
        borderColor={COLORS.border}
        backgroundColor={COLORS.bg}
      />

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
            height: 2,
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
            const label = formatFrameNum(index, frames.length)
            return (
              <box
                key={index}
                id={`frame-${index}`}
                flexDirection="column"
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
                  <text fg={isActive ? COLORS.bg : COLORS.muted}>
                    {isActive ? <strong>{label}</strong> : label}
                  </text>
                </box>
                {/* Border box */}
                <box
                  width={label.length}
                  height={1}
                  border={["bottom"]}
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
        border={["bottom"]}
        borderStyle="single"
        borderColor={COLORS.border}
        backgroundColor={COLORS.bg}
      />
    </box>
  )
}
