// Project state management hook with auto-save

import { useState, useEffect, useCallback, useRef } from "react"
import type { Project, ProjectMeta } from "../lib/projectTypes"
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
          syncIdCounter(loaded.tree)  // Sync ID counter to avoid collisions
          setProject(loaded)
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
        syncIdCounter(loaded.tree)  // Sync ID counter to avoid collisions
        setProject(loaded)
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
      log("UPDATE_TREE_CALLED", { treeRootChildren: tree.children.length, pushHistory, selectedId })
      setProject((prev) => {
        if (!prev) return prev

        const updated: Project = { ...prev, tree }
        log("UPDATE_TREE_INSIDE_SET", { prevTreeChildren: prev.tree.children.length, newTreeChildren: tree.children.length })

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
          updated.history = [...prev.history, historyEntry]
          updated.future = [] // Clear redo stack on new action
        }

        return updated
      })
      scheduleSave()
    },
    [scheduleSave]
  )

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
  }
}
