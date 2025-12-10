import { useRef, useEffect, useState, useCallback } from "react"
import type { ScrollBoxRenderable } from "@opentui/core"
import { MouseButton } from "@opentui/core"
import { COLORS } from "../../theme"
import type { ElementNode } from "../../lib/types"
import { generateAnimationData } from "../../lib/codegen"

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
}: FilmStripProps) {
  const scrollRef = useRef<ScrollBoxRenderable>(null)
  const frameWidth = getFrameWidth(frames.length)
  const [copied, setCopied] = useState(false)

  const copyAnimationCode = useCallback(() => {
    const data = generateAnimationData(frames, fps, "Animation")
    const proc = Bun.spawn(["xclip", "-selection", "clipboard"], { stdin: "pipe" })
    proc.stdin.write(data)
    proc.stdin.end()
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }, [frames, fps])

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
      height={5}
      flexDirection="column"
      backgroundColor={COLORS.bgAlt}
    >
      {/* Top Bar: Play | FPS | Frame Counter */}
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

        {/* Spacer */}
        <box flexGrow={1} />

        {/* Frame Counter */}
        <box id="frame-counter">
          <text fg={COLORS.muted}>
            <span fg={COLORS.accent}>{formatFrameNum(currentIndex, frames.length)}</span>/{formatFrameNum(frames.length - 1, frames.length)}
          </text>
        </box>

        {/* Export Button */}
        <box id="export-btn" marginLeft={2} onMouseDown={copyAnimationCode}>
          <text fg={copied ? COLORS.success : COLORS.accent}>{copied ? "✓ Copied" : "⎘ Export"}</text>
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
