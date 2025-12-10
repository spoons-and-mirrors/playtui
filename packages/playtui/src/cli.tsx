#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react"
import { Builder } from "./index"
import { COLORS } from "./theme"

function App() {
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.name === "q" && key.ctrl) process.exit(0)
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
