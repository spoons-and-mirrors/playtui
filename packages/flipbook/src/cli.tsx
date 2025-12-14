#!/usr/bin/env bun
/**
 * Flipbook - Terminal Animation Player
 * 
 * Usage:
 *   flipbook animation.tsx
 *   flipbook animation.tsx --fps 30
 *   flipbook --demo
 */

import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react"
import { existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { Flipbook } from "./player"
import type { Animation } from "./types"

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
  flipbook <animation.tsx> [options]
  flipbook --demo

Options:
  --demo, -d           Play the bundled demo animation
  --fps, -f <number>   Override animation FPS
  --help, -h           Show this help message

Controls:
  q, Esc, Ctrl+C       Exit

Examples:
  flipbook my-animation.tsx
  flipbook loading.tsx --fps 30
  flipbook --demo
`)
}

async function loadAnimation(filePath: string): Promise<Animation> {
  const resolvedPath = resolve(process.cwd(), filePath)
  
  if (!existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`)
    process.exit(1)
  }

  try {
    const module = await import(resolvedPath) as { animation: Animation }
    const anim = module.animation
    
    if (!anim || !anim.frames || !Array.isArray(anim.frames)) {
      console.error("Error: Invalid animation file - missing 'animation.frames' export")
      process.exit(1)
    }
    if (typeof anim.fps !== "number") {
      console.error("Error: Invalid animation file - missing 'animation.fps' export")
      process.exit(1)
    }
    
    return anim
  } catch (e) {
    console.error(`Error: Failed to load animation file: ${(e as Error).message}`)
    process.exit(1)
  }
}

interface AppProps {
  animation: Animation
  fpsOverride?: number
}

function App({ animation, fpsOverride }: AppProps) {
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
      <Flipbook animation={animation} fpsOverride={fpsOverride} />
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
    ? resolve(getPackageDir(), "demo.tsx")
    : filePath!
  
  const animation = await loadAnimation(animationPath)
  
  console.log(`Playing: ${animation.name || filePath}`)
  console.log(`Frames: ${animation.frames.length} @ ${fps ?? animation.fps} FPS`)
  console.log("Press q or Esc to exit\n")

  const renderer = await createCliRenderer()
  createRoot(renderer).render(<App animation={animation} fpsOverride={fps} />)
}

main()
