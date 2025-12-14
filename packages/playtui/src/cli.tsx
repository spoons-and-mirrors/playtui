#!/usr/bin/env bun
import { createCliRenderer, SliderRenderable } from "@opentui/core"
import { createRoot, useKeyboard, useTerminalDimensions, extend } from "@opentui/react"
import { Builder } from "./index"
import { COLORS } from "./theme"
import { Bind, isKeybind } from "./lib/shortcuts"

// Register slider component (not included in @opentui/react baseComponents as of 0.1.60)
extend({ slider: SliderRenderable })

function App() {
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (isKeybind(key, Bind.GLOBAL_QUIT)) process.exit(0)
  })

  return (
    <box
      id="app-root"
      style={{
        width,
        height,
        backgroundColor: COLORS.bg,
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <Builder width={width} height={height} />
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
