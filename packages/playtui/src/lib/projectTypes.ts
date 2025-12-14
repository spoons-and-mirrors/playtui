// Project system types

import type { ElementNode, HistoryEntry } from "./types"
import type { KeyframingState } from "./keyframing"
import { createDefaultKeyframingState } from "./keyframing"

// Color swatch - reusable color variable
export interface ColorSwatch {
  id: string
  color: string // hex color value (#RRGGBB or #RRGGBBAA)
}

// Color palette - group of swatches
export interface ColorPalette {
  id: string
  name: string
  swatches: ColorSwatch[]
}

export interface Project {
  name: string
  version: 1 // Schema version for future migrations
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp

  // Current state
  tree: ElementNode
  selectedId: string | null
  collapsed: string[] // Collapsed node IDs in tree view
  
  // Color palettes - groups of reusable color swatches
  palettes: ColorPalette[]
  activePaletteIndex: number
  
  // Animation state
  animation: {
    fps: number
    frames: ElementNode[] // Array of root trees, one per frame
    currentFrameIndex: number
    keyframing: KeyframingState
  }

  // Undo history (persisted, capped at 10,000 entries)
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

// Default palettes
const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: "palette-1",
    name: "Ocean",
    swatches: [
      { id: "swatch-1-1", color: "#4a90a4" },
      { id: "swatch-1-2", color: "#5ba0b4" },
      { id: "swatch-1-3", color: "#6bb0c4" },
      { id: "swatch-1-4", color: "#7bc0d4" },
      { id: "swatch-1-5", color: "#8cd0e4" },
      { id: "swatch-1-6", color: "#9de0f4" },
      { id: "swatch-1-7", color: "#f6b7a8" },
      { id: "swatch-1-8", color: "#ffcc00" },
    ],
  },
  {
    id: "palette-2",
    name: "Forest",
    swatches: [
      { id: "swatch-2-1", color: "#2d5a27" },
      { id: "swatch-2-2", color: "#3d6a37" },
      { id: "swatch-2-3", color: "#4a7c43" },
      { id: "swatch-2-4", color: "#5a8c53" },
      { id: "swatch-2-5", color: "#6b9e64" },
      { id: "swatch-2-6", color: "#8bc085" },
      { id: "swatch-2-7", color: "#d4a373" },
      { id: "swatch-2-8", color: "#faedcd" },
    ],
  },
  {
    id: "palette-3",
    name: "Sunset",
    swatches: [
      { id: "swatch-3-1", color: "#ff6b6b" },
      { id: "swatch-3-2", color: "#ff8b6b" },
      { id: "swatch-3-3", color: "#ffa06b" },
      { id: "swatch-3-4", color: "#ffd56b" },
      { id: "swatch-3-5", color: "#c9b1ff" },
      { id: "swatch-3-6", color: "#a06bff" },
      { id: "swatch-3-7", color: "#8b7bff" },
      { id: "swatch-3-8", color: "#6b8bff" },
    ],
  },
]

export function createNewProject(name: string): Project {
  const now = new Date().toISOString()
  const defaultTree = createDefaultTree()
  return {
    name,
    version: 1,
    createdAt: now,
    updatedAt: now,
    tree: defaultTree,
    selectedId: null,
    collapsed: [],
    palettes: DEFAULT_PALETTES,
    activePaletteIndex: 0,
    animation: {
      fps: 12,
      frames: [defaultTree],
      currentFrameIndex: 0,
      keyframing: createDefaultKeyframingState(),
    },
    history: [],
    future: [],
  }
}
