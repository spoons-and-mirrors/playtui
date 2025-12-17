// Project state management hook with auto-save

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Project, ProjectMeta, ColorPalette } from '../lib/projectTypes'
import { createNewProject } from '../lib/projectTypes'
import type { Renderable, HistoryEntry } from '../lib/types'
import {
  createDefaultKeyframingState,
  shiftKeyframesOnDelete,
  shiftKeyframesOnInsert,
  upsertKeyframe as upsertDomainKeyframe,
  removeKeyframe as removeDomainKeyframe,
  setKeyframeHandle as setDomainKeyframeHandle,
} from '../lib/keyframing'
import { syncIdCounter } from '../lib/tree'
import { log } from '../lib/logger'
import * as storage from '../lib/storage'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
  duplicateProject: (newName: string) => Promise<boolean>

  // State updates (triggers auto-save)
  updateTree: (
    tree: Renderable,
    pushHistory?: boolean,
    selectedId?: string | null,
  ) => void
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
  setFrameCount: (count: number) => void
  importAnimation: (frames: Renderable[], fps: number) => void

  // Keyframing
  toggleAutoKey: () => void
  addKeyframe: (renderableId: string, property: string, value: number) => void
  removeKeyframe: (renderableId: string, property: string) => void
  setKeyframeHandle: (
    renderableId: string,
    property: string,
    frame: number,
    handleX: number,
    handleY: number,
  ) => void
  setTimelineView: (
    view:
      | { type: 'dopesheet' }
      | { type: 'curve'; renderableId: string; property: string },
  ) => void

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const projectRef = useRef<Project | null>(null)
  // Track the state before a batch of non-history changes started
  const batchStartStateRef = useRef<HistoryEntry | null>(null)

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    projectRef.current = project
  }, [project])

  // Debounced save function
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus('saving')

    saveTimeoutRef.current = setTimeout(async () => {
      const currentProject = projectRef.current
      if (!currentProject) return

      const result = await storage.saveProject(currentProject)
      if (result.success) {
        setSaveStatus('saved')
        // Reset to idle after a moment
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setError(result.error || 'Failed to save')
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

    setSaveStatus('saving')
    const result = await storage.saveProject(currentProject)
    if (result.success) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('error')
      setError(result.error || 'Failed to save')
    }
  }, [])

  // Open project list
  const refreshProjects = useCallback(async () => {
    const list = await storage.listProjects()
    setProjects(list)
  }, [])

  // Ensure project has required data on load (handles older project files)
  const ensureProjectData = (proj: Project): Project => {
    // Migration: convert old swatches to palettes
    const legacyProject = proj as Project & {
      swatches?: Array<{ id: string; color: string }>
    }
    if (legacyProject.swatches && !proj.palettes) {
      return {
        ...proj,
        palettes: [
          {
            id: 'palette-migrated',
            name: 'Migrated',
            swatches: legacyProject.swatches,
          },
        ],
        activePaletteIndex: 0,
        animation: proj.animation ?? {
          fps: 12,
          frames: [proj.tree],
          currentFrameIndex: 0,
          keyframing: createDefaultKeyframingState(),
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
          currentFrameIndex: 0,
          keyframing: createDefaultKeyframingState(),
        },
      }
    }
    // Keyframing migration (for projects before keyframing feature)
    if (!proj.animation.keyframing) {
      return {
        ...proj,
        animation: {
          ...proj.animation,
          keyframing: createDefaultKeyframingState(),
        },
      }
    }
    return proj
  }

  // Initialize: load projects and open most recent or create default
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await storage.ensureDataDir()
      const list = await storage.listProjects()
      setProjects(list)

      if (list.length > 0) {
        // Open most recent project
        const loaded = await storage.loadProject(list[0].fileName)
        if (loaded) {
          const migrated = ensureProjectData(loaded)
          syncIdCounter(migrated.tree)
          setProject(migrated)
        } else {
          // Corrupted, create new
          const newProj = createNewProject('Untitled')
          setProject(newProj)
          await storage.saveProject(newProj)
        }
      } else {
        // No projects, create default
        const newProj = createNewProject('Untitled')
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
        setError(result.error || 'Failed to create project')
        return false
      }
    },
    [refreshProjects],
  )

  // Open existing project
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
        setError('Failed to load project')
        return false
      }
    },
    [],
  )

  // Delete project
  const deleteProjectFn = useCallback(
    async (fileName: string): Promise<boolean> => {
      // Don't allow deleting current project
      if (project && storage.slugify(project.name) === fileName) {
        setError('Cannot delete the currently open project')
        return false
      }

      const success = await storage.deleteProject(fileName)
      if (success) {
        await refreshProjects()
        setError(null)
        return true
      } else {
        setError('Failed to delete project')
        return false
      }
    },
    [project, refreshProjects],
  )

  // Duplicate current project with a new name (Save As)
  const duplicateProject = useCallback(
    async (newName: string): Promise<boolean> => {
      if (!project) {
        setError('No project to duplicate')
        return false
      }

      const fileName = storage.slugify(newName)

      // Check if exists
      if (await storage.projectExists(fileName)) {
        setError(`Project "${newName}" already exists`)
        return false
      }

      // Create a copy with the new name and fresh timestamps
      const now = new Date().toISOString()
      const duplicatedProject: Project = {
        ...project,
        name: newName,
        createdAt: now,
        updatedAt: now,
        // Clear history for the new copy to save space
        history: [],
        future: [],
      }

      const result = await storage.saveProject(duplicatedProject)

      if (result.success) {
        setProject(duplicatedProject)
        await refreshProjects()
        setError(null)
        return true
      } else {
        setError(result.error || 'Failed to save project copy')
        return false
      }
    },
    [project, refreshProjects],
  )

  // Update tree with optional history push and optional selectedId (atomic update)
  const updateTree = useCallback(
    (tree: Renderable, pushHistory = true, selectedId?: string | null) => {
      setProject((prev) => {
        if (!prev) return prev

        // Track batch start state for drag operations
        // When pushHistory=false, we're in a drag/batch operation
        // Capture the state at the START of the batch, not during
        if (!pushHistory && !batchStartStateRef.current) {
          // First non-history update in a batch - capture current state
          batchStartStateRef.current = {
            frameIndex: prev.animation.currentFrameIndex,
            tree: prev.tree,
            selectedId: prev.selectedId,
            keyframing: prev.animation.keyframing,
          }
        }

        // Sync current tree to the frames array
        const newFrames = [...prev.animation.frames]
        // Ensure we have frames (migration safety)
        if (newFrames.length === 0) newFrames.push(tree)

        // Update the current frame with the new tree state
        // If index is out of bounds, default to 0 or push
        const safeIndex = Math.min(
          Math.max(0, prev.animation.currentFrameIndex),
          newFrames.length - 1,
        )
        newFrames[safeIndex] = tree

        const updated: Project = {
          ...prev,
          tree,
          animation: {
            ...prev.animation,
            frames: newFrames,
            currentFrameIndex: safeIndex,
          },
        }

        // If selectedId is explicitly provided (including null), update it atomically
        if (selectedId !== undefined) {
          updated.selectedId = selectedId
        }

        if (pushHistory) {
          // Use batch start state if available (for drag operations)
          // Otherwise use the previous state (for single-click operations)
          const historyEntry: HistoryEntry = batchStartStateRef.current ?? {
            frameIndex: prev.animation.currentFrameIndex,
            tree: prev.tree,
            selectedId: prev.selectedId,
            keyframing: prev.animation.keyframing,
          }

          // Clear batch state
          batchStartStateRef.current = null

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
    [scheduleSave],
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
          currentFrameIndex: index,
        },
        // Preserve selectedId across frame changes
      }
    })
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

      // Shift keyframes
      const shiftedKeyframing = {
        ...prev.animation.keyframing,
        animatedProperties: shiftKeyframesOnInsert(
          prev.animation.keyframing.animatedProperties,
          currentIndex + 1,
        ),
      }

      return {
        ...prev,
        tree: treeClone,
        animation: {
          ...prev.animation,
          frames: newFrames,
          currentFrameIndex: currentIndex + 1,
          keyframing: shiftedKeyframing,
        },
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Animation: Delete frame
  const deleteFrame = useCallback(
    (index: number) => {
      setProject((prev) => {
        if (!prev || prev.animation.frames.length <= 1) return prev // Can't delete last frame

        const newFrames = prev.animation.frames.filter((_, i) => i !== index)
        // If we deleted the current frame, move to previous (or 0)
        let newIndex = prev.animation.currentFrameIndex
        if (index <= prev.animation.currentFrameIndex) {
          newIndex = Math.max(0, prev.animation.currentFrameIndex - 1)
        }

        // Shift keyframes
        const shiftedKeyframing = {
          ...prev.animation.keyframing,
          animatedProperties: shiftKeyframesOnDelete(
            prev.animation.keyframing.animatedProperties,
            index,
          ),
        }

        return {
          ...prev,
          tree: newFrames[newIndex],
          animation: {
            ...prev.animation,
            frames: newFrames,
            currentFrameIndex: newIndex,
            keyframing: shiftedKeyframing,
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Animation: Set FPS
  const setFps = useCallback(
    (fps: number) => {
      setProject((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          animation: {
            ...prev.animation,
            fps,
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Animation: Set frame count (add or remove frames to reach target count)
  const setFrameCount = useCallback(
    (targetCount: number) => {
      if (targetCount < 1) return
      setProject((prev) => {
        if (!prev) return prev

        const currentCount = prev.animation.frames.length
        if (targetCount === currentCount) return prev

        let newFrames = [...prev.animation.frames]
        let newKeyframing = { ...prev.animation.keyframing }

        if (targetCount > currentCount) {
          // Add frames by duplicating the last frame
          const lastFrame = prev.animation.frames[currentCount - 1]
          for (let i = currentCount; i < targetCount; i++) {
            const treeClone = JSON.parse(JSON.stringify(lastFrame))
            newFrames.push(treeClone)
            // Shift keyframes for each insertion
            newKeyframing = {
              ...newKeyframing,
              animatedProperties: shiftKeyframesOnInsert(
                newKeyframing.animatedProperties,
                i,
              ),
            }
          }
        } else {
          // Remove frames from the end
          for (let i = currentCount - 1; i >= targetCount; i--) {
            newKeyframing = {
              ...newKeyframing,
              animatedProperties: shiftKeyframesOnDelete(
                newKeyframing.animatedProperties,
                i,
              ),
            }
          }
          newFrames = newFrames.slice(0, targetCount)
        }

        // Clamp current frame index if needed
        const newIndex = Math.min(
          prev.animation.currentFrameIndex,
          targetCount - 1,
        )

        return {
          ...prev,
          tree: newFrames[newIndex],
          animation: {
            ...prev.animation,
            frames: newFrames,
            currentFrameIndex: newIndex,
            keyframing: newKeyframing,
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Animation: Import animation data (frames + fps)
  const importAnimation = useCallback(
    (frames: Renderable[], fps: number) => {
      setProject((prev) => {
        if (!prev) return prev
        if (frames.length === 0) return prev

        return {
          ...prev,
          tree: frames[0],
          animation: {
            fps,
            frames,
            currentFrameIndex: 0,
            keyframing: createDefaultKeyframingState(),
          },
          // Clear history when importing
          history: [],
          future: [],
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Keyframing: Toggle auto-key mode
  const toggleAutoKey = useCallback(() => {
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        animation: {
          ...prev.animation,
          keyframing: {
            ...prev.animation.keyframing,
            autoKeyEnabled: !prev.animation.keyframing.autoKeyEnabled,
          },
        },
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Keyframing: Add or update keyframe at current frame
  const addKeyframe = useCallback(
    (renderableId: string, property: string, value: number) => {
      setProject((prev) => {
        if (!prev) return prev
        const frame = prev.animation.currentFrameIndex
        const nextAnimated = upsertDomainKeyframe(
          prev.animation.keyframing.animatedProperties,
          renderableId,
          property,
          frame,
          value,
        )
        return {
          ...prev,
          animation: {
            ...prev.animation,
            keyframing: {
              ...prev.animation.keyframing,
              animatedProperties: nextAnimated,
            },
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Keyframing: Remove keyframe at current frame
  const removeKeyframe = useCallback(
    (renderableId: string, property: string) => {
      setProject((prev) => {
        if (!prev) return prev
        const frame = prev.animation.currentFrameIndex
        const nextAnimated = removeDomainKeyframe(
          prev.animation.keyframing.animatedProperties,
          renderableId,
          property,
          frame,
        )
        return {
          ...prev,
          animation: {
            ...prev.animation,
            keyframing: {
              ...prev.animation.keyframing,
              animatedProperties: nextAnimated,
            },
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Keyframing: Set bezier handle for a keyframe
  const setKeyframeHandle = useCallback(
    (
      renderableId: string,
      property: string,
      frame: number,
      handleX: number,
      handleY: number,
    ) => {
      setProject((prev) => {
        if (!prev) return prev
        const nextAnimated = setDomainKeyframeHandle(
          prev.animation.keyframing.animatedProperties,
          renderableId,
          property,
          frame,
          handleX,
          handleY,
        )
        return {
          ...prev,
          animation: {
            ...prev.animation,
            keyframing: {
              ...prev.animation.keyframing,
              animatedProperties: nextAnimated,
            },
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Keyframing: Set active timeline view (dopesheet or curve)
  const setTimelineView = useCallback(
    (
      view:
        | { type: 'dopesheet' }
        | { type: 'curve'; renderableId: string; property: string },
    ) => {
      setProject((prev) => {
        if (!prev) return prev
        const prevKeyframing = prev.animation.keyframing
        return {
          ...prev,
          animation: {
            ...prev.animation,
            keyframing: {
              ...prevKeyframing,
              timeline: {
                ...prevKeyframing.timeline,
                view,
              },
            },
          },
        }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Update selected ID (UI state only, no save needed)

  const setSelectedId = useCallback((id: string | null) => {
    setProject((prev) => {
      if (!prev) return prev
      return { ...prev, selectedId: id }
    })
  }, [])

  // Update collapsed nodes
  const setCollapsed = useCallback(
    (collapsed: string[]) => {
      setProject((prev) => {
        if (!prev) return prev
        return { ...prev, collapsed }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Undo
  const undo = useCallback(() => {
    setProject((prev) => {
      if (!prev || prev.history.length === 0) return prev

      const history = [...prev.history]
      const last = history.pop()!

      // Push current state to future
      const futureEntry: HistoryEntry = {
        frameIndex: prev.animation.currentFrameIndex,
        tree: prev.tree,
        selectedId: prev.selectedId,
        keyframing: prev.animation.keyframing,
      }

      // Restore frames with the old tree at the old frame index
      const restoredFrames = [...prev.animation.frames]
      restoredFrames[last.frameIndex] = last.tree

      return {
        ...prev,
        tree: last.tree,
        selectedId: last.selectedId,
        animation: {
          ...prev.animation,
          frames: restoredFrames,
          currentFrameIndex: last.frameIndex,
          keyframing: last.keyframing,
        },
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
        frameIndex: prev.animation.currentFrameIndex,
        tree: prev.tree,
        selectedId: prev.selectedId,
        keyframing: prev.animation.keyframing,
      }

      // Restore frames with the next tree at the next frame index
      const restoredFrames = [...prev.animation.frames]
      restoredFrames[next.frameIndex] = next.tree

      return {
        ...prev,
        tree: next.tree,
        selectedId: next.selectedId,
        animation: {
          ...prev.animation,
          frames: restoredFrames,
          currentFrameIndex: next.frameIndex,
          keyframing: next.keyframing,
        },
        history: [...prev.history, historyEntry],
        future,
      }
    })
    scheduleSave()
  }, [scheduleSave])

  // Update a swatch color in the active palette
  const updateSwatch = useCallback(
    (id: string, color: string) => {
      setProject((prev) => {
        if (!prev) return prev
        const palettes = prev.palettes.map((palette, idx) => {
          if (idx !== prev.activePaletteIndex) return palette
          return {
            ...palette,
            swatches: palette.swatches.map((s) =>
              s.id === id ? { ...s, color } : s,
            ),
          }
        })
        return { ...prev, palettes }
      })
      scheduleSave()
    },
    [scheduleSave],
  )

  // Change the active palette (UI state only, no save needed)
  const setActivePalette = useCallback((index: number) => {
    setProject((prev) => {
      if (!prev) return prev
      return { ...prev, activePaletteIndex: index }
    })
  }, [])

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
    duplicateProject,
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
    setFrameCount,
    importAnimation,
    // Keyframing methods
    toggleAutoKey,
    addKeyframe,
    removeKeyframe,
    setKeyframeHandle,
    setTimelineView,
    // Palette methods
    palettes,
    activePaletteIndex,
    updateSwatch,
    setActivePalette,
  }
}
