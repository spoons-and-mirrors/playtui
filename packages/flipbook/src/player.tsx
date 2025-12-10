/**
 * Flipbook - Animation Player React Component
 */

import React, { useState, useEffect } from "react"
import type { ElementNode, FlipbookFrames } from "./types"

function renderNode(node: ElementNode): React.ReactNode {
  if (node.visible === false) return null

  const style: Record<string, unknown> = {}
  
  // Dimensions
  if (node.width !== undefined) style.width = node.width
  if (node.height !== undefined) style.height = node.height
  
  // Position
  if (node.x !== undefined) style.left = node.x
  if (node.y !== undefined) style.top = node.y
  
  // Flex
  if (node.flexDirection) style.flexDirection = node.flexDirection
  if (node.alignItems) style.alignItems = node.alignItems
  if (node.justifyContent) style.justifyContent = node.justifyContent
  if (node.flexGrow !== undefined) style.flexGrow = node.flexGrow
  if (node.flexShrink !== undefined) style.flexShrink = node.flexShrink
  if (node.gap !== undefined) style.gap = node.gap
  
  // Padding
  if (node.padding !== undefined) style.padding = node.padding
  if (node.paddingTop !== undefined) style.paddingTop = node.paddingTop
  if (node.paddingRight !== undefined) style.paddingRight = node.paddingRight
  if (node.paddingBottom !== undefined) style.paddingBottom = node.paddingBottom
  if (node.paddingLeft !== undefined) style.paddingLeft = node.paddingLeft
  
  // Margin
  if (node.margin !== undefined) style.margin = node.margin
  if (node.marginTop !== undefined) style.marginTop = node.marginTop
  if (node.marginRight !== undefined) style.marginRight = node.marginRight
  if (node.marginBottom !== undefined) style.marginBottom = node.marginBottom
  if (node.marginLeft !== undefined) style.marginLeft = node.marginLeft
  
  // Overflow
  if (node.overflow) style.overflow = node.overflow

  const children = node.children
    .map((child) => renderNode(child))
    .filter(Boolean)

  switch (node.type) {
    case "ascii-font":
      if (!node.text) return null
      return (
        <ascii-font
          key={node.id}
          text={node.text}
          font={node.font || "tiny"}
          color={node.color || "#ffffff"}
          style={style}
        />
      )

    case "text":
      return (
        <box key={node.id} style={style}>
          <text fg={node.fg}>{node.content || node.text || ""}</text>
        </box>
      )

    case "box":
    case "scrollbox":
    default:
      return (
        <box
          key={node.id}
          backgroundColor={node.backgroundColor}
          border={node.border ? (node.borderSides?.length ? node.borderSides : true) : undefined}
          borderStyle={node.border ? node.borderStyle : undefined}
          borderColor={node.border ? node.borderColor : undefined}
          style={style}
        >
          {children}
        </box>
      )
  }
}

export interface FlipbookProps {
  data: FlipbookFrames
  fpsOverride?: number
}

export function Flipbook({ data, fpsOverride }: FlipbookProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const fps = fpsOverride ?? data.fps

  useEffect(() => {
    if (data.frames.length <= 1) return
    const id = setInterval(() => {
      setFrameIndex(f => (f + 1) % data.frames.length)
    }, 1000 / fps)
    return () => clearInterval(id)
  }, [data.frames.length, fps])

  const frame = data.frames[frameIndex]
  if (!frame) return null

  return (
    <box key={frameIndex}>
      {frame.children.map(child => renderNode(child))}
    </box>
  )
}
