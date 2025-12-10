// Cross-platform persistent storage for projects

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { homedir, platform } from "node:os"
import type { Project, ProjectMeta } from "./projectTypes"

/**
 * Get the appropriate data directory for the current platform
 * - Linux: ~/.local/share/playtui/
 * - macOS: ~/Library/Application Support/playtui/
 * - Windows: %APPDATA%\playtui\
 */
export function getDataDir(): string {
  const home = homedir()
  const plat = platform()

  switch (plat) {
    case "win32":
      // Use APPDATA if available, fallback to home
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "playtui")
    case "darwin":
      return path.join(home, "Library", "Application Support", "playtui")
    default:
      // Linux and others: use XDG_DATA_HOME or fallback
      return path.join(process.env.XDG_DATA_HOME || path.join(home, ".local", "share"), "playtui")
  }
}

export function getProjectsDir(): string {
  return path.join(getDataDir(), "projects")
}

/**
 * Ensure data directories exist
 */
export async function ensureDataDir(): Promise<void> {
  const projectsDir = getProjectsDir()
  await fs.mkdir(projectsDir, { recursive: true })
}

/**
 * Convert project name to safe filename
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50) || "untitled"
}

/**
 * Get the file path for a project
 */
export function getProjectPath(fileName: string): string {
  return path.join(getProjectsDir(), `${fileName}.json`)
}

/**
 * List all projects (metadata only, without loading full history)
 */
export async function listProjects(): Promise<ProjectMeta[]> {
  await ensureDataDir()
  const projectsDir = getProjectsDir()

  try {
    const files = await fs.readdir(projectsDir)
    const jsonFiles = files.filter((f) => f.endsWith(".json"))

    const projects: ProjectMeta[] = []

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(projectsDir, file)
        const content = await fs.readFile(filePath, "utf-8")
        const project = JSON.parse(content) as Project

        projects.push({
          name: project.name,
          fileName: file.replace(".json", ""),
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })
      } catch {
        // Skip corrupted files
        console.error(`Failed to read project file: ${file}`)
      }
    }

    // Sort by updatedAt descending (most recent first)
    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch {
    return []
  }
}

/**
 * Open a project by filename
 */
export async function loadProject(fileName: string): Promise<Project | null> {
  try {
    const filePath = getProjectPath(fileName)
    const content = await fs.readFile(filePath, "utf-8")
    return JSON.parse(content) as Project
  } catch {
    return null
  }
}

/**
 * Save a project
 */
export async function saveProject(project: Project): Promise<{ success: boolean; fileName: string; error?: string }> {
  await ensureDataDir()

  const fileName = slugify(project.name)
  const filePath = getProjectPath(fileName)

  try {
    // Update timestamp
    project.updatedAt = new Date().toISOString()

    const content = JSON.stringify(project, null, 2)
    await fs.writeFile(filePath, content, "utf-8")

    return { success: true, fileName }
  } catch (err) {
    return {
      success: false,
      fileName,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

/**
 * Delete a project
 */
export async function deleteProject(fileName: string): Promise<boolean> {
  try {
    const filePath = getProjectPath(fileName)
    await fs.unlink(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a project exists
 */
export async function projectExists(fileName: string): Promise<boolean> {
  try {
    const filePath = getProjectPath(fileName)
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
