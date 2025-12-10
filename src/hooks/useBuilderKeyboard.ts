import { useKeyboard } from "@opentui/react"
import type { ElementType } from "../lib/types"
import type { ViewMode } from "../components/ui/AppHeader"

// Keyboard shortcut to element type mapping
const ADD_SHORTCUTS: Record<string, ElementType> = {
  b: "box",
  t: "text",
  s: "scrollbox",
  i: "input",
  x: "textarea",
  e: "select",
  l: "slider",
  f: "ascii-font",
  w: "tab-select",
}

interface UseBuilderKeyboardParams {
  // Modal/UI state
  modalMode: "new" | "load" | "delete" | null
  mode: ViewMode
  focusedField: string | null
  addMode: boolean

  // State setters
  setModalMode: (mode: "new" | "load" | "delete" | null) => void
  setMode: (mode: ViewMode) => void
  setFocusedField: (field: string | null) => void
  setAddMode: (mode: boolean) => void
  setSelectedId: (id: string | null) => void

  // Actions
  onDelete: () => void
  onDuplicate: () => void
  onCopy: () => void
  onPaste: () => void
  onUndo: () => void
  onRedo: () => void
  onMoveNode: (direction: "up" | "down") => void
  onNavigateTree: (direction: "up" | "down") => void
  onAddElement: (type: ElementType) => void

  // Animation actions
  onAnimNextFrame?: () => void
  onAnimPrevFrame?: () => void
  onAnimPlayToggle?: () => void
  onAnimDuplicateFrame?: () => void
  onAnimDeleteFrame?: () => void

  // Panel visibility
  onTogglePanels?: () => void
}

export function useBuilderKeyboard({
  modalMode,
  mode,
  focusedField,
  addMode,
  setModalMode,
  setMode,
  setFocusedField,
  setAddMode,
  setSelectedId,
  onDelete,
  onDuplicate,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onMoveNode,
  onNavigateTree,
  onAddElement,
  onAnimNextFrame,
  onAnimPrevFrame,
  onAnimPlayToggle,
  onAnimDuplicateFrame,
  onAnimDeleteFrame,
  onTogglePanels,
}: UseBuilderKeyboardParams) {
  useKeyboard((key) => {
    // Toggle panels - TAB key (always available, even in modal)
    if (key.name === "tab" && onTogglePanels) {
      onTogglePanels()
      return
    }

    // F-key mode switching (always available except in modal)
    if (!modalMode) {
      if (key.name === "f1") { setMode("editor"); return }
      if (key.name === "f2") { setMode("play"); return }
      if (key.name === "f3") { setMode("code"); return }
      if (key.name === "f4") { setMode("library"); return }
      if (key.name === "f5") { setMode("docs"); return }
    }

    // Close modal on escape
    if (modalMode) {
      if (key.name === "escape") setModalMode(null)
      return
    }

    // Non-editor modes (no editor shortcuts)
    if (mode === "docs" || mode === "library") {
      if (key.name === "escape") { setSelectedId(null); return }
      return
    }

    // Code mode - allow TAB for panel toggle, but no other editor shortcuts
    if (mode === "code") {
      return
    }

    // Play mode - frame shortcuts, then fall through to editor shortcuts
    if (mode === "play") {
      if (key.name === "space" && onAnimPlayToggle) { onAnimPlayToggle(); return }
      if (!focusedField && !addMode) {
        if (key.name === "e" && onAnimPrevFrame) { onAnimPrevFrame(); return }
        if (key.name === "r" && onAnimNextFrame) { onAnimNextFrame(); return }
        if (key.name === "f" && onAnimDuplicateFrame) { onAnimDuplicateFrame(); return }
        if (key.name === "x" && onAnimDeleteFrame) { onAnimDeleteFrame(); return }
      }
      // Fall through to editor shortcuts below
    }

    if (focusedField) {
      if (key.name === "escape" || key.name === "return") setFocusedField(null)
      return
    }

    // Add mode: A toggles out, other keys add components using ADD_SHORTCUTS mapping
    if (addMode) {
      if (key.name === "escape" || key.name === "a") { setAddMode(false); return }
      const elementType = ADD_SHORTCUTS[key.name as string]
      if (elementType) onAddElement(elementType)
      return
    }

    // Main shortcuts (editor mode only)
    if (key.name === "delete") onDelete()
    else if (key.name === "d") onDuplicate()
    else if (key.name === "a") setAddMode(true)
    else if (key.name === "c" && key.shift) onCopy()
    else if (key.name === "v" && !key.ctrl) onPaste()
    else if (key.name === "z" && !key.shift) onUndo()
    else if (key.name === "y" || (key.name === "z" && key.shift)) onRedo()
    else if (key.option && key.name === "up") onMoveNode("up")
    else if (key.option && key.name === "down") onMoveNode("down")
    else if (key.name === "up" || key.name === "k") onNavigateTree("up")
    else if (key.name === "down" || key.name === "j") onNavigateTree("down")
    else if (key.name === "escape") setSelectedId(null)
  })
}
