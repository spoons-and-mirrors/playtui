#!/usr/bin/env bun
/**
 * Flipbook - Terminal Animation Player
 * 
 * Usage:
 *   flipbook animation.json
 *   flipbook animation.json --fps 30
 *   flipbook --demo
 */

import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react"
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { AnimationPlayer } from "./player"
import type { AnimationData } from "./types"

function getPackageDir(): string {
  const currentFile = fileURLToPath(import.meta.url)
  return dirname(dirname(currentFile))
}

function parseArgs() {
  const args = process.argv.slice(2)
  let filePath: string | null = null
  let fps: number | undefined = undefined
  let help = false
  let demo = false

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
    } else if (arg === "--demo" || arg === "-d") {
      demo = true
    } else if (!arg.startsWith("-")) {
      filePath = arg
    }
  }

  return { filePath, fps, help, demo }
}

function showHelp() {
  console.log(`
flipbook - Terminal animation player for PlayTUI animations

Usage:
  flipbook <animation.json> [options]
  flipbook --demo

Options:
  --demo, -d           Play the bundled demo animation
  --fps, -f <number>   Override animation FPS
  --help, -h           Show this help message

Controls:
  q, Esc, Ctrl+C       Exit

Examples:
  flipbook my-animation.json
  flipbook loading.json --fps 30
  flipbook --demo
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
  const { filePath, fps, help, demo } = parseArgs()

  if (help) {
    showHelp()
    process.exit(0)
  }

  if (!filePath && !demo) {
    showHelp()
    process.exit(1)
  }

  const animationPath = demo 
    ? resolve(getPackageDir(), "demo.json")
    : filePath!
  
  const animationData = loadAnimation(animationPath)
  
  console.log(`Playing: ${animationData.name || filePath}`)
  console.log(`Frames: ${animationData.frames.length} @ ${fps ?? animationData.fps} FPS`)
  console.log("Press q or Esc to exit\n")

  // Small delay to let the user read the info
  await new Promise(r => setTimeout(r, 500))

  const renderer = await createCliRenderer()
  createRoot(renderer).render(<App data={animationData} fpsOverride={fps} />)
}

main()
