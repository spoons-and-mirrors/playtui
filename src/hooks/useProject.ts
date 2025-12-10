// Project state management hook with auto-save

import { useState, useEffect, useCallback, useRef } from "react"
import type { Project, ProjectMeta, ColorPalette } from "../lib/projectTypes"
import { createNewProject } from "../lib/projectTypes"
import type { ElementNode, HistoryEntry } from "../lib/types"
import { syncIdCounter } from "../lib/tree"
import { log } from "../lib/logger"
import * as storage from "../lib/storage"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

export interface UseProjectReturn {
  // Current project state
  project: Project | null
  isLoading: boolean
  saveStatus: SaveStatus
  error: string | null

  // Project list
  projects: ProjectMeta[]
  refreshProjects: () => Promise<void>

  // Project operations
  createProject: (name: string) => Promise<boolean>
  loadProject: (fileName: string) => Promise<boolean>
  deleteProject: (fileName: string) => Promise<boolean>

  // State updates (triggers auto-save)
  updateTree: (tree: ElementNode, pushHistory?: boolean, selectedId?: string | null) => void
  setSelectedId: (id: string | null) => void
  setCollapsed: (collapsed: string[]) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Animation
  setCurrentFrame: (index: number) => void
  duplicateFrame: () => void
  deleteFrame: (index: number) => void
  setFps: (fps: number) => void
  
  // Palettes
  palettes: ColorPalette[]
  activePaletteIndex: number
  updateSwatch: (id: string, color: string) => void
  setActivePalette: (index: number) => void
}

const AUTO_SAVE_DELAY = 1500 // ms

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const projectRef = useRef<Project | null>(null)

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    projectRef.current = project
  }, [project])

  // Debounced save function
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus("saving")

    saveTimeoutRef.current = setTimeout(async () => {
      const currentProject = projectRef.current
      if (!currentProject) return

      const result = await storage.saveProject(currentProject)
      if (result.success) {
        setSaveStatus("saved")
        // Reset to idle after a moment
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
        setError(result.error || "Failed to save")
      }
    }, AUTO_SAVE_DELAY)
  }, [])

  // Save immediately (for undo/redo)
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    const currentProject = projectRef.current
    if (!currentProject) return

    setSaveStatus("saving")
    const result = await storage.saveProject(currentProject)
    if (result.success) {
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } else {
      setSaveStatus("error")
      setError(result.error || "Failed to save")
    }
  }, [])

  // Load project list
  const refreshProjects = useCallback(async () => {
    const list = await storage.listProjects()
    setProjects(list)
  }, [])

  // Initialize: load projects and open most recent or create default
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await storage.ensureDataDir()
      const list = await storage.listProjects()
      setProjects(list)

      if (list.length > 0) {
        // Load most recent project
        const loaded = await storage.loadProject(list[0].fileName)
        if (loaded) {
          const migrated = ensureProjectData(loaded)
          syncIdCounter(migrated.tree)
          setProject(migrated)
        } else {
          // Corrupted, create new
          const newProj = createNewProject("Untitled")
          setProject(newProj)
          await storage.saveProject(newProj)
        }
      } else {
        // No projects, create default
        const newProj = createNewProject("Untitled")
        setProject(newProj)
        await storage.saveProject(newProj)
        await refreshProjects()
      }

      setIsLoading(false)
    }

    init()
  }, [refreshProjects])

  // Create new project
  const createProject = useCallback(
    async (name: string): Promise<boolean> => {
      const fileName = storage.slugify(name)

      // Check if exists
      if (await storage.projectExists(fileName)) {
        setError(`Project "${name}" already exists`)
        return false
      }

      const newProj = createNewProject(name)
      const result = await storage.saveProject(newProj)

      if (result.success) {
        setProject(newProj)
        await refreshProjects()
        setError(null)
        return true
      } else {
        setError(result.error || "Failed to create project")
        return false
      }
    },
    [refreshProjects]
  )

  // Load existing project
  const loadProjectFn = useCallback(
    async (fileName: string): Promise<boolean> => {
      const loaded = await storage.loadProject(fileName)
      if (loaded) {
        const migrated = ensureProjectData(loaded)
        syncIdCounter(migrated.tree)
        setProject(migrated)
        setError(null)
        return true
      } else {
        setError("Failed to load project")
        return false
      }
    },
    []
  )

  // Delete project
  const deleteProjectFn = useCallback(
    async (fileName: string): Promise<boolean> => {
      // Don't allow deleting current project
      if (project && storage.slugify(project.name) === fileName) {
        setError("Cannot delete the currently open project")
        return false
      }

      const success = await storage.deleteProject(fileName)
      if (success) {
        await refreshProjects()
        setError(null)
        return true
      } else {
        setError("Failed to delete project")
        return false
      }
    },
    [project, refreshProjects]
  )

  // Update tree with optional history push and optional selectedId (atomic update)
  const updateTree = useCallback(
    (tree: ElementNode, pushHistory = true, selectedId?: string | null) => {
      // log("UPDATE_TREE_CALLED", { treeRootChildren: tree.children.length, pushHistory, selectedId })
      setProject((prev) => {
        if (!prev) return prev

        // Sync current tree to the frames array
        const newFrames = [...prev.animation.frames]
        // Ensure we have frames (migration safety)
        if (newFrames.length === 0) newFrames.push(tree)
        
        // Update the current frame with the new tree state
        // If index is out of bounds, default to 0 or push
        const safeIndex = Math.min(Math.max(0, prev.animation.currentFrameIndex), newFrames.length - 1)
        newFrames[safeIndex] = tree

        const updated: Project = { 
          ...prev, 
          tree,
          animation: {
            ...prev.animation,
            frames: newFrames,
            currentFrameIndex: safeIndex
          }
        }
        
        // log("UPDATE_TREE_INSIDE_SET", { prevTreeChildren: prev.tree.children.length, newTreeChildren: tree.children.length })

        // If selectedId is explicitly provided (including null), update it atomically
        if (selectedId !== undefined) {
          updated.selectedId = selectedId
        }

        if (pushHistory) {
          // Push current state to history
          const historyEntry: HistoryEntry = {
            tree: prev.tree,
            selectedId: prev.selectedId,
          }
          const newHistory = [...prev.history, historyEntry]
          // Cap history at 10,000 entries
          if (newHistory.length > 10000) {
            newHistory.splice(0, newHistory.length - 10000)
          }
          updated.history = newHistory
          updated.future = [] // Clear redo stack on new action
        }

        return updated
      })
      scheduleSave()
    },
    [scheduleSave]
  )

  // Animation: Set current frame
  const setCurrentFrame = useCallback((index: number) => {
    setProject((prev) => {
      if (!prev) return prev
      if (index < 0 || index >= prev.animation.frames.length) return prev
      
      const newTree = prev.animation.frames[index]
      
      return {
        ...prev,
        tree: newTree,
        animation: {
          ...prev.animation,
          currentFrameIndex: index
        },
        selectedId: null // Clear selection on frame change
      }
    })
    // scheduleSave() // No need to save on simple navigation? Maybe yes to persist "open on this frame"
  }, [])

  // Animation: Duplicate current frame
  const duplicateFrame = useCallback(() => {
    setProject((prev) => {
      if (!prev) return prev
      
      const currentTree = prev.tree
      const currentIndex = prev.animation.currentFrameIndex
      
      const newFrames = [...prev.animation.frames]
      // Deep clone to avoid ref issues
      const treeClone = JSON.parse(JSON.stringify(currentTree))
      
      // Insert after current
      newFrames.splice(currentIndex + 1, 0, treeClone)
      
      return {
        ...prev,
        tree: treeClone,
        animation: {
          ...prev.animation,
          frames: newFrames,
          currentFrameIndex: currentIndex + 1
        }
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Animation: Delete frame
  const deleteFrame = useCallback((index: number) => {
    setProject((prev) => {
      if (!prev || prev.animation.frames.length <= 1) return prev // Can't delete last frame
      
      const newFrames = prev.animation.frames.filter((_, i) => i !== index)
      // If we deleted the current frame, move to previous (or 0)
      let newIndex = prev.animation.currentFrameIndex
      if (index <= prev.animation.currentFrameIndex) {
        newIndex = Math.max(0, prev.animation.currentFrameIndex - 1)
      }
      
      return {
        ...prev,
        tree: newFrames[newIndex],
        animation: {
          ...prev.animation,
          frames: newFrames,
          currentFrameIndex: newIndex
        }
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Animation: Set FPS
  const setFps = useCallback((fps: number) => {
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        animation: {
          ...prev.animation,
          fps
        }
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Ensure project has required data on load (handles older project files)
  const ensureProjectData = (proj: Project): Project => {
    // Migration: convert old swatches to palettes
    const legacyProject = proj as Project & { swatches?: Array<{ id: string; color: string }> }
    if (legacyProject.swatches && !proj.palettes) {
      return {
        ...proj,
        palettes: [{
          id: "palette-migrated",
          name: "Migrated",
          swatches: legacyProject.swatches
        }],
        activePaletteIndex: 0,
        animation: proj.animation ?? {
          fps: 12,
          frames: [proj.tree],
          currentFrameIndex: 0
        },
      }
    }
    // Animation data migration (for older projects before animation feature)
    if (!proj.animation) {
      return {
        ...proj,
        animation: {
          fps: 12,
          frames: [proj.tree],
          currentFrameIndex: 0
        },
      }
    }
    return proj
  }

  // Update selected ID
  const setSelectedId = useCallback(
    (id: string | null) => {
      setProject((prev) => {
        if (!prev) return prev
        return { ...prev, selectedId: id }
      })
      scheduleSave()
    },
    [scheduleSave]
  )

  // Update collapsed nodes
  const setCollapsed = useCallback(
    (collapsed: string[]) => {
      setProject((prev) => {
        if (!prev) return prev
        return { ...prev, collapsed }
      })
      scheduleSave()
    },
    [scheduleSave]
  )

  // Undo
  const undo = useCallback(() => {
    setProject((prev) => {
      if (!prev || prev.history.length === 0) return prev

      const history = [...prev.history]
      const last = history.pop()!

      // Push current state to future
      const futureEntry: HistoryEntry = {
        tree: prev.tree,
        selectedId: prev.selectedId,
      }

      return {
        ...prev,
        tree: last.tree,
        selectedId: last.selectedId,
        history,
        future: [...prev.future, futureEntry],
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Redo
  const redo = useCallback(() => {
    setProject((prev) => {
      if (!prev || prev.future.length === 0) return prev

      const future = [...prev.future]
      const next = future.pop()!

      // Push current state to history
      const historyEntry: HistoryEntry = {
        tree: prev.tree,
        selectedId: prev.selectedId,
      }

      return {
        ...prev,
        tree: next.tree,
        selectedId: next.selectedId,
        history: [...prev.history, historyEntry],
        future,
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Update a swatch color in the active palette
  const updateSwatch = useCallback((id: string, color: string) => {
    setProject((prev) => {
      if (!prev) return prev
      const palettes = prev.palettes.map((palette, idx) => {
        if (idx !== prev.activePaletteIndex) return palette
        return {
          ...palette,
          swatches: palette.swatches.map(s => 
            s.id === id ? { ...s, color } : s
          )
        }
      })
      return { ...prev, palettes }
    })
    scheduleSave()
  }, [scheduleSave])

  // Change the active palette
  const setActivePalette = useCallback((index: number) => {
    setProject((prev) => {
      if (!prev) return prev
      return { ...prev, activePaletteIndex: index }
    })
    scheduleSave()
  }, [scheduleSave])

  // Get palettes and active index with fallback
  const palettes = project?.palettes ?? []
  const activePaletteIndex = project?.activePaletteIndex ?? 0

  return {
    project,
    isLoading,
    saveStatus,
    error,
    projects,
    refreshProjects,
    createProject,
    loadProject: loadProjectFn,
    deleteProject: deleteProjectFn,
    updateTree,
    setSelectedId,
    setCollapsed,
    undo,
    redo,
    canUndo: (project?.history.length ?? 0) > 0,
    canRedo: (project?.future.length ?? 0) > 0,
    // Animation methods
    setCurrentFrame,
    duplicateFrame,
    deleteFrame,
    setFps,
    // Palette methods
    palettes,
    activePaletteIndex,
    updateSwatch,
    setActivePalette,
  }
}
