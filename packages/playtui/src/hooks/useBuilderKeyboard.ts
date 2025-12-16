import { useKeyboard } from "@opentui/react"
import type { ElementType } from "../lib/types"
import type { ViewMode, ViewAction } from "../lib/viewState"
import { VIEW_MODES } from "../lib/viewState"
import { Bind, isKeybind, ADD_MODE_BINDINGS } from "../lib/shortcuts"


interface UseBuilderKeyboardParams {
  // Modal/UI state
  modalMode: "new" | "load" | "delete" | "saveAs" | null
  mode: ViewMode
  focusedField: string | null
  addMode: boolean
  filmStripEditing?: boolean

  // State setters
  setModalMode: (mode: "new" | "load" | "delete" | "saveAs" | null) => void
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

  // View actions
  onViewAction?: (action: ViewAction) => void
}

export function useBuilderKeyboard({
  modalMode,
  mode,
  focusedField,
  addMode,
  filmStripEditing,
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
  onViewAction,
}: UseBuilderKeyboardParams) {
  useKeyboard((key) => {
    // Toggle panels - TAB key (always available, even in modal)
    if (isKeybind(key, Bind.TOGGLE_PANELS) && onTogglePanels) {
      onTogglePanels()
      return
    }

    // F-key mode switching (always available except in modal)
    if (!modalMode && onViewAction) {
      for (const cfg of VIEW_MODES) {
        if (isKeybind(key, cfg.bind)) {
          onViewAction(cfg.bind)
          return
        }
      }

      if (isKeybind(key, Bind.TOGGLE_CODE)) {
        onViewAction(Bind.TOGGLE_CODE)
        return
      }
    }

    // Close modal on escape
    if (modalMode) {
      if (isKeybind(key, Bind.MODAL_CLOSE)) setModalMode(null)
      return
    }

    // Non-editor modes (no editor shortcuts)
    if (mode === "docs" || mode === "library") {
      if (isKeybind(key, Bind.CANCEL_SELECTION)) { setSelectedId(null); return }
      return
    }

    // Play mode - frame shortcuts, then fall through to editor shortcuts
    if (mode === "play") {
      if (isKeybind(key, Bind.ANIM_PLAY_TOGGLE) && onAnimPlayToggle) { onAnimPlayToggle(); return }
      if (!focusedField && !addMode) {
        if (isKeybind(key, Bind.ANIM_PREV_FRAME) && onAnimPrevFrame) { onAnimPrevFrame(); return }
        if (isKeybind(key, Bind.ANIM_NEXT_FRAME) && onAnimNextFrame) { onAnimNextFrame(); return }
        if (isKeybind(key, Bind.ANIM_DUPLICATE_FRAME) && onAnimDuplicateFrame) { onAnimDuplicateFrame(); return }
        if (isKeybind(key, Bind.ANIM_DELETE_FRAME) && onAnimDeleteFrame) { onAnimDeleteFrame(); return }
      }
      // Fall through to editor shortcuts below
    }

    if (focusedField) {
      if (isKeybind(key, Bind.MODAL_CLOSE) || isKeybind(key, Bind.CONFIRM)) setFocusedField(null)
      return
    }

    // Add mode: A toggles out, other keys add components
    if (addMode) {
      if (isKeybind(key, Bind.MODAL_CLOSE) || isKeybind(key, Bind.EDITOR_ENTER_ADD_MODE)) { setAddMode(false); return }
      
      // Check all add shortcuts
      for (const binding of ADD_MODE_BINDINGS) {
        if (isKeybind(key, binding.bind)) {
          onAddElement(binding.type)
          return
        }
      }
      return
    }

    // Main shortcuts (editor mode only)
    if (isKeybind(key, Bind.EDITOR_DELETE) && !filmStripEditing) onDelete()
    else if (isKeybind(key, Bind.EDITOR_DUPLICATE)) onDuplicate()
    else if (isKeybind(key, Bind.EDITOR_ENTER_ADD_MODE)) setAddMode(true)
    else if (isKeybind(key, Bind.EDITOR_COPY)) onCopy()
    else if (isKeybind(key, Bind.EDITOR_PASTE)) onPaste()
    else if (isKeybind(key, Bind.EDITOR_UNDO)) onUndo()
    else if (isKeybind(key, Bind.EDITOR_REDO)) onRedo()
    else if (isKeybind(key, Bind.EDITOR_MOVE_UP)) onMoveNode("up")
    else if (isKeybind(key, Bind.EDITOR_MOVE_DOWN)) onMoveNode("down")
    else if (isKeybind(key, Bind.NAV_TREE_UP)) onNavigateTree("up")
    else if (isKeybind(key, Bind.NAV_TREE_DOWN)) onNavigateTree("down")
    else if (isKeybind(key, Bind.CANCEL_SELECTION)) setSelectedId(null)
  })
}
