// Project system types

import type { ElementNode, HistoryEntry } from "./types"

export interface Project {
  name: string
  version: 1 // Schema version for future migrations
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp

  // Current state
  tree: ElementNode
  selectedId: string | null
  collapsed: string[] // Collapsed node IDs in tree view

  // Full undo history (persisted, no limit)
  history: HistoryEntry[]
  future: HistoryEntry[] // Redo stack
}

export interface ProjectMeta {
  name: string
  fileName: string
  createdAt: string
  updatedAt: string
}

export function createDefaultTree(): ElementNode {
  return {
    id: "root",
    type: "box",
    name: "Root",
    width: "auto",
    height: "auto",
    backgroundColor: "#1a1a2e",
    flexDirection: "column",
    padding: 2,
    gap: 1,
    children: [],
  }
}

export function createNewProject(name: string): Project {
  const now = new Date().toISOString()
  return {
    name,
    version: 1,
    createdAt: now,
    updatedAt: now,
    tree: createDefaultTree(),
    selectedId: null,
    collapsed: [],
    history: [],
    future: [],
  }
}
