#!/usr/bin/env bun
/**
 * PlayTUI Animation Player CLI
 * 
 * Usage:
 *   npx playtui-player animation.json
 *   npx playtui-player animation.json --fps 30
 *   bunx playtui-player animation.json
 */

import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { AnimationPlayer } from "./player"
import type { AnimationData } from "./types"

function parseArgs() {
  const args = process.argv.slice(2)
  let filePath: string | null = null
  let fps: number | undefined = undefined
  let help = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--fps" || arg === "-f") {
      fps = parseInt(args[++i], 10)
      if (isNaN(fps)) {
        console.error("Error: --fps requires a number")
        process.exit(1)
      }
    } else if (arg === "--help" || arg === "-h") {
      help = true
    } else if (!arg.startsWith("-")) {
      filePath = arg
    }
  }

  return { filePath, fps, help }
}

function showHelp() {
  console.log(`
playtui-player - Play TUI animations in your terminal

Usage:
  playtui-player <animation.json> [options]

Options:
  --fps, -f <number>   Override animation FPS
  --help, -h           Show this help message

Controls:
  q, Esc, Ctrl+C       Exit

Examples:
  playtui-player my-animation.json
  playtui-player loading.json --fps 30
  npx playtui-player animation.json
`)
}

function loadAnimation(filePath: string): AnimationData {
  const resolvedPath = resolve(process.cwd(), filePath)
  
  if (!existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`)
    process.exit(1)
  }

  try {
    const content = readFileSync(resolvedPath, "utf-8")
    const data = JSON.parse(content) as AnimationData
    
    if (!data.frames || !Array.isArray(data.frames)) {
      console.error("Error: Invalid animation file - missing 'frames' array")
      process.exit(1)
    }
    if (typeof data.fps !== "number") {
      console.error("Error: Invalid animation file - missing 'fps' number")
      process.exit(1)
    }
    
    return data
  } catch (e) {
    console.error(`Error: Failed to parse animation file: ${(e as Error).message}`)
    process.exit(1)
  }
}

interface AppProps {
  data: AnimationData
  fpsOverride?: number
}

function App({ data, fpsOverride }: AppProps) {
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "q" || (key.ctrl && key.name === "c")) {
      process.exit(0)
    }
  })

  return (
    <box
      id="player-root"
      style={{ width, height, alignItems: "center", justifyContent: "center" }}
    >
      <AnimationPlayer data={data} fpsOverride={fpsOverride} />
    </box>
  )
}

async function main() {
  const { filePath, fps, help } = parseArgs()

  if (help || !filePath) {
    showHelp()
    process.exit(help ? 0 : 1)
  }

  const animationData = loadAnimation(filePath)
  
  console.log(`Playing: ${animationData.name || filePath}`)
  console.log(`Frames: ${animationData.frames.length} @ ${fps ?? animationData.fps} FPS`)
  console.log("Press q or Esc to exit\n")

  // Small delay to let the user read the info
  await new Promise(r => setTimeout(r, 500))

  const renderer = await createCliRenderer()
  createRoot(renderer).render(<App data={animationData} fpsOverride={fps} />)
}

main()
