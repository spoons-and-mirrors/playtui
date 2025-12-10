/**
 * Cross-platform clipboard utility
 * Handles clipboard operations with graceful fallbacks
 */

import { log } from "./logger"
import { homedir } from "os"
import { join } from "path"
import { mkdir } from "fs/promises"

interface ClipboardTool {
  copy: string[]
  paste: string[]
}

interface ClipboardResult {
  success: boolean
  error?: string
  filePath?: string  // If fallback to file, path to the file
}

interface ClipboardReadResult extends ClipboardResult {
  text?: string
}

/**
 * Detect available clipboard tool for the current platform
 */
function detectClipboardTool(): ClipboardTool | null {
  const tools = [
    // Linux
    { copy: ["xclip", "-selection", "clipboard"], paste: ["xclip", "-selection", "clipboard", "-o"] },
    { copy: ["xsel", "--clipboard", "--input"], paste: ["xsel", "--clipboard", "--output"] },
    { copy: ["wl-copy"], paste: ["wl-paste"] }, // Wayland
    // macOS
    { copy: ["pbcopy"], paste: ["pbpaste"] },
    // Windows/WSL
    { copy: ["clip.exe"], paste: ["powershell.exe", "-command", "Get-Clipboard"] },
  ]

  for (const tool of tools) {
    try {
      // Test if the copy command exists
      const testProc = Bun.spawnSync(["which", tool.copy[0]], {
        stdout: "ignore",
        stderr: "ignore",
      })
      if (testProc.exitCode === 0) {
        log("CLIPBOARD_TOOL_DETECTED", { tool: tool.copy[0] })
        return tool
      }
    } catch {
      // Tool not available, continue
    }
  }

  log("CLIPBOARD_NO_TOOL", {})
  return null
}

// Cache the detected tool
let cachedTool: ClipboardTool | null | undefined = undefined

function getClipboardTool(): ClipboardTool | null {
  if (cachedTool === undefined) {
    cachedTool = detectClipboardTool()
  }
  return cachedTool
}

/**
 * Copy text to clipboard with file fallback
 */
export async function copyToClipboard(text: string, options?: { filename?: string }): Promise<ClipboardResult> {
  const tool = getClipboardTool()

  // Try native clipboard first
  if (tool) {
    try {
      const proc = Bun.spawn(tool.copy, { stdin: "pipe" })
      proc.stdin.write(text)
      proc.stdin.end()
      await proc.exited

      if (proc.exitCode === 0) {
        log("CLIPBOARD_COPY_SUCCESS", { length: text.length })
        return { success: true }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log("CLIPBOARD_COPY_ERROR", { error: message })
      // Fall through to file fallback
    }
  }

  // Fallback: save to file
  return await saveToFile(text, options?.filename)
}

/**
 * Save content to a file as fallback
 */
async function saveToFile(text: string, filename?: string): Promise<ClipboardResult> {
  try {
    const exportDir = join(homedir(), ".playtui", "exports")
    await mkdir(exportDir, { recursive: true })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const basename = filename || `export-${timestamp}`
    const filePath = join(exportDir, basename)
    
    await Bun.write(filePath, text)
    
    log("CLIPBOARD_FILE_FALLBACK", { path: filePath, length: text.length })
    return {
      success: true,
      filePath,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log("CLIPBOARD_FILE_FALLBACK_ERROR", { error: message })
    return {
      success: false,
      error: `Failed to save to file: ${message}`,
    }
  }
}

/**
 * Read text from clipboard with file fallback support
 */
export async function readFromClipboard(): Promise<ClipboardReadResult> {
  const tool = getClipboardTool()

  if (!tool) {
    return {
      success: false,
      error: "No clipboard tool found. Paste content manually or use file import.",
    }
  }

  try {
    const proc = Bun.spawn(tool.paste, {
      stdout: "pipe",
      stderr: "pipe",
    })
    await proc.exited

    if (proc.exitCode !== 0) {
      return {
        success: false,
        error: `Clipboard tool exited with code ${proc.exitCode}`,
      }
    }

    const text = await new Response(proc.stdout).text()
    log("CLIPBOARD_READ_SUCCESS", { length: text.length })
    return { success: true, text }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log("CLIPBOARD_READ_ERROR", { error: message })
    return {
      success: false,
      error: `Failed to read: ${message}`,
    }
  }
}

/**
 * Get the most recent export file path
 */
export async function getLastExportPath(): Promise<string | null> {
  try {
    const exportDir = join(homedir(), ".playtui", "exports")
    const files = await Array.fromAsync(
      new Bun.Glob("*").scan({ cwd: exportDir })
    )
    
    if (files.length === 0) return null
    
    // Sort by name (timestamp-based) and get most recent
    files.sort().reverse()
    return join(exportDir, files[0])
  } catch {
    return null
  }
}

/**
 * Get user-friendly installation instructions
 */
export function getClipboardInstallInstructions(): string {
  const platform = process.platform
  
  if (platform === "linux") {
    return "Install clipboard tool: sudo apt install xclip  OR  sudo pacman -S xclip  OR  sudo dnf install xclip"
  } else if (platform === "darwin") {
    return "pbcopy/pbpaste should be pre-installed on macOS"
  } else if (platform === "win32") {
    return "clip.exe should be available on Windows"
  }
  
  return "Install a clipboard utility for your system"
}
