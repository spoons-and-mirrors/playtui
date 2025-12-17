import { useState, useRef } from 'react'
import { TextAttributes } from '@opentui/core'
import type { ScrollBoxRenderable } from '@opentui/core'
import { COLORS } from '../../theme'
import type { AnimatedProperty } from '../../lib/keyframing'

interface DopesheetRowProps {
  property: AnimatedProperty
  frameCount: number
  currentFrame: number
  fps: number
  onSelect: () => void
  scrollRef?: React.RefObject<ScrollBoxRenderable | null>
}

export function DopesheetRow({
  property,
  frameCount,
  currentFrame,
  fps,
  onSelect,
  scrollRef,
}: DopesheetRowProps) {
  const [hovered, setHovered] = useState(false)
  const keyframes = property.keyframes
  const hasKeyframeAtCurrent = keyframes.some((k) => k.frame === currentFrame)

  return (
    <box
      height={1}
      flexDirection="row"
      onMouseDown={onSelect}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      {/* Label - fixed width, stays visible */}
      <box
        width={12}
        paddingRight={1}
        justifyContent="flex-end"
        backgroundColor={COLORS.bg}
        flexShrink={0}
      >
        <text
          fg={hovered ? COLORS.accent : COLORS.text}
          attributes={hovered ? undefined : TextAttributes.DIM}
        >
          {property.property}
        </text>
      </box>

      {/* Track - scrollable timeline */}
      <box flexGrow={1} flexShrink={1} overflow="hidden">
        <scrollbox
          ref={scrollRef}
          scrollX
          scrollY={false}
          height={1}
          scrollbarOptions={{
            showArrows: false,
            trackOptions: {
              foregroundColor: 'transparent',
              backgroundColor: 'transparent',
            },
          }}
          style={{
            rootOptions: {
              overflow: 'hidden',
            },
            contentOptions: {
              flexDirection: 'row',
              flexShrink: 0,
            },
          }}
          onMouseScroll={(e) => {
            const sb = scrollRef?.current
            if (!sb || !e.scroll) return
            const delta = e.scroll.direction === 'up' ? -1 : 1
            sb.scrollBy({ x: delta * 5, y: 0 })
          }}
        >
          <box flexDirection="row" backgroundColor={COLORS.bgAlt}>
            {Array.from({ length: frameCount }).map((_, i) => {
              const isKeyframe = keyframes.some((k) => k.frame === i)
              const isCurrent = i === currentFrame
              const isCycleMarker = i > 0 && i % fps === 0

              let char = '·'
              let fg = COLORS.muted

              if (isKeyframe) {
                char = '◆'
                fg = isCurrent ? COLORS.accent : COLORS.danger
              } else if (isCurrent) {
                char = '│'
                fg = COLORS.accent
              } else if (isCycleMarker) {
                char = '│'
                fg = COLORS.muted
              }

              return (
                <box key={i} width={1} justifyContent="center" flexShrink={0}>
                  <text fg={fg}>{char}</text>
                </box>
              )
            })}
          </box>
        </scrollbox>
      </box>
    </box>
  )
}
