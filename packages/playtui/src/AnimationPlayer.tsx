/**
 * AnimationPlayer - Standalone animation player for OpenTUI
 * 
 * Usage:
 *   1. Paste your animation data (exported from PlayTUI) into ANIMATION_DATA below
 *   2. Run: bun run AnimationPlayer.tsx
 * 
 * Or import the component into your own app:
 *   import { AnimationPlayer, type AnimationData } from "./AnimationPlayer"
 *   <AnimationPlayer data={myAnimationData} />
 * 
 * Note: You may see "Cannot add child: Nodes with measure functions cannot have children"
 * errors on exit - this is a known OpenTUI reconciler issue during cleanup and doesn't
 * affect animation playback.
 */

import React, { useState, useEffect } from "react"
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react"
import { createCliRenderer, RGBA } from "@opentui/core"

// ============================================================================
// Types
// ============================================================================

type ElementType = "box" | "text" | "ascii-font" | "scrollbox"
type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse"
type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
type JustifyContent = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
type Overflow = "visible" | "hidden" | "scroll"
type SizeValue = number | "auto" | `${number}%`

interface ElementNode {
  id: string
  type: ElementType
  name?: string
  children: ElementNode[]
  // Layout
  x?: number
  y?: number
  width?: SizeValue
  height?: SizeValue
  flexDirection?: FlexDirection
  alignItems?: AlignItems
  justifyContent?: JustifyContent
  flexGrow?: number
  flexShrink?: number
  gap?: number
  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  margin?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  overflow?: Overflow
  // Appearance
  visible?: boolean
  backgroundColor?: string
  border?: boolean
  borderStyle?: "single" | "double" | "rounded" | "heavy"
  borderColor?: string
  borderSides?: ("top" | "right" | "bottom" | "left")[]
  // Text
  text?: string
  content?: string
  fg?: string
  // Ascii-font
  font?: "tiny" | "block" | "slick" | "shade"
  color?: string
}

export interface AnimationData {
  frames: ElementNode[]
  fps: number
  name: string
}

// ============================================================================
// Renderer - renders ElementNode tree to OpenTUI components
// ============================================================================

function renderNode(node: ElementNode): React.ReactNode {
  if (node.visible === false) return null

  const style: Record<string, unknown> = {}
  
  // Dimensions
  if (node.width !== undefined) style.width = node.width
  if (node.height !== undefined) style.height = node.height
  
  // Position (use left/top like the main app)
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

  // Render children recursively
  const children = node.children
    .map((child) => renderNode(child))
    .filter(Boolean)

  // Render based on type
  switch (node.type) {
    case "ascii-font":
      // ascii-font has a measure function, can't have children
      // Render it directly without wrapper, using style for positioning
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

// ============================================================================
// AnimationPlayer Component
// ============================================================================

export interface AnimationPlayerProps {
  data: AnimationData
  fpsOverride?: number
}

export function AnimationPlayer({ data, fpsOverride }: AnimationPlayerProps) {
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

  // Skip the root wrapper, render only its children (the actual animation content)
  return (
    <box key={frameIndex}>
      {frame.children.map(child => renderNode(child))}
    </box>
  )
}

// ============================================================================
// Animation Data - Paste your exported animation here!
// ============================================================================

const ANIMATION_DATA: AnimationData = {
  "frames": [
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "column",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "P",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": -4
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "overflow": "hidden"
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "column",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "P",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": -4
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "overflow": "hidden"
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-4",
              "type": "box",
              "name": "Box",
              "width": 2,
              "height": 2,
              "backgroundColor": "#7bc0d4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 0
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": -2
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "y": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 5,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 6
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 6
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "y": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 11
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "y": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11,
              "visible": false
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 14
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "y": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11,
              "visible": false
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 15
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "y": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11,
              "visible": false
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 16
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "y": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11,
              "visible": false
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 17
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11,
              "visible": false
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 17
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 11,
              "visible": false
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 15
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 4,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 9,
              "visible": true
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 2
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 1,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 5,
              "visible": true
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 1
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "x": 0
        }
      ]
    },
    {
      "id": "root",
      "type": "box",
      "name": "Root",
      "width": "auto",
      "height": "auto",
      "backgroundColor": "#1a1a2e",
      "flexDirection": "column",
      "padding": 2,
      "gap": 1,
      "children": [
        {
          "id": "el-1",
          "type": "box",
          "name": "Box",
          "width": 20,
          "height": 2,
          "backgroundColor": "#1c222c",
          "flexDirection": "row",
          "border": false,
          "borderStyle": "single",
          "borderColor": "#2a3545",
          "children": [
            {
              "id": "el-3",
              "type": "box",
              "name": "Box",
              "width": 2,
              "height": 2,
              "backgroundColor": "#6bb0c4",
              "flexDirection": "column",
              "border": false,
              "borderStyle": "single",
              "borderColor": "#2a3545",
              "children": [],
              "x": 0,
              "visible": true
            },
            {
              "id": "el-2",
              "type": "ascii-font",
              "name": "AsciiFont",
              "text": "o",
              "font": "tiny",
              "color": "#4da8da",
              "children": [],
              "x": 0,
              "visible": false
            }
          ],
          "alignItems": "flex-start",
          "flexGrow": 0,
          "x": 0
        }
      ]
    }
  ],
  "fps": 10,
  "name": "Animation"
}

// ============================================================================
// Standalone App (run with: bun run src/AnimationPlayer.tsx)
// ============================================================================

function App() {
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "q" || (key.ctrl && key.name === "c")) {
      process.exit(0)
    }
  })

  return (
    <box style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <AnimationPlayer data={ANIMATION_DATA} />
    </box>
  )
}

// Only run standalone if this is the main module
const isMainModule = import.meta.main ?? (typeof require !== "undefined" && require.main === module)

if (isMainModule) {
  createCliRenderer().then((renderer) => {
    createRoot(renderer).render(<App />)
  })
}
