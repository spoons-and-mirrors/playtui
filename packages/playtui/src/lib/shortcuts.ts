import type { KeyEvent } from "@opentui/core"

export enum Bind {
  // Global
  GLOBAL_QUIT = "global.quit",
  
  // Navigation / View Modes
  VIEW_SWITCH_EDITOR_PLAY = "view.switch.editor_play",
  VIEW_CODE = "view.code",
  VIEW_LIBRARY = "view.library",
  VIEW_DOCS = "view.docs",
  TOGGLE_PANELS = "view.toggle_panels",
  TOGGLE_TIMELINE = "view.toggle_timeline",
  NAV_TREE_UP = "nav.tree.up",
  NAV_TREE_DOWN = "nav.tree.down",

  // UI / Modal
  MODAL_CLOSE = "modal.close",
  CANCEL_SELECTION = "ui.cancel_selection",
  CONFIRM = "ui.confirm",

  // Editor Operations
  EDITOR_DELETE = "editor.delete",
  EDITOR_DUPLICATE = "editor.duplicate",
  EDITOR_COPY = "editor.copy",
  EDITOR_PASTE = "editor.paste",
  EDITOR_UNDO = "editor.undo",
  EDITOR_REDO = "editor.redo",
  EDITOR_MOVE_UP = "editor.move_up",
  EDITOR_MOVE_DOWN = "editor.move_down",
  EDITOR_ENTER_ADD_MODE = "editor.enter_add_mode",
  
  // Add Mode Shortcuts (Context: Add Mode)
  ADD_BOX = "add.box",
  ADD_TEXT = "add.text",
  ADD_SCROLLBOX = "add.scrollbox",
  ADD_INPUT = "add.input",
  ADD_TEXTAREA = "add.textarea",
  ADD_SELECT = "add.select",
  ADD_SLIDER = "add.slider",
  ADD_ASCII_FONT = "add.ascii_font",
  ADD_TAB_SELECT = "add.tab_select",

  // Animation / Play
  ANIM_PLAY_TOGGLE = "anim.play_toggle",
  ANIM_PREV_FRAME = "anim.prev_frame",
  ANIM_NEXT_FRAME = "anim.next_frame",
  ANIM_DUPLICATE_FRAME = "anim.duplicate_frame",
  ANIM_DELETE_FRAME = "anim.delete_frame",
  
  // Timeline / Dopesheet
  TIMELINE_PREV_KEYFRAME = "timeline.prev_keyframe",
  TIMELINE_NEXT_KEYFRAME = "timeline.next_keyframe",
}

export interface ShortcutDef {
  id: Bind
  label: string
  // Array of key matches. Each match is an object checking specific properties.
  // Multiple entries in the array mean "OR" (aliases).
  keys: {
    name: string
    ctrl?: boolean
    shift?: boolean
    option?: boolean // alt
    meta?: boolean
  }[]
  description?: string
  category?: "Global" | "Editor" | "Animation" | "Timeline" | "View"
}

export const KEYBOARD_SHORTCUTS: Record<Bind, ShortcutDef> = {
  // --- Global ---
  [Bind.GLOBAL_QUIT]: {
    id: Bind.GLOBAL_QUIT,
    label: "Quit",
    keys: [{ name: "q", ctrl: true }],
    category: "Global"
  },

  // --- View ---
  [Bind.VIEW_SWITCH_EDITOR_PLAY]: {
    id: Bind.VIEW_SWITCH_EDITOR_PLAY,
    label: "Toggle Editor/Play",
    keys: [{ name: "f1" }],
    category: "View"
  },
  [Bind.VIEW_CODE]: {
    id: Bind.VIEW_CODE,
    label: "Code View",
    keys: [{ name: "f2" }],
    category: "View"
  },
  [Bind.VIEW_LIBRARY]: {
    id: Bind.VIEW_LIBRARY,
    label: "Library View",
    keys: [{ name: "f3" }],
    category: "View"
  },
  [Bind.VIEW_DOCS]: {
    id: Bind.VIEW_DOCS,
    label: "Docs View",
    keys: [{ name: "f4" }],
    category: "View"
  },
  [Bind.TOGGLE_PANELS]: {
    id: Bind.TOGGLE_PANELS,
    label: "Toggle Panels",
    keys: [{ name: "tab" }],
    category: "View"
  },
  [Bind.TOGGLE_TIMELINE]: {
    id: Bind.TOGGLE_TIMELINE,
    label: "Toggle Timeline",
    keys: [{ name: "t" }],
    category: "View"
  },

  // --- UI/Nav ---
  [Bind.MODAL_CLOSE]: {
    id: Bind.MODAL_CLOSE,
    label: "Close Modal",
    keys: [{ name: "escape" }],
    category: "Global"
  },
  [Bind.CANCEL_SELECTION]: {
    id: Bind.CANCEL_SELECTION,
    label: "Deselect",
    keys: [{ name: "escape" }],
    category: "Editor"
  },
  [Bind.CONFIRM]: {
    id: Bind.CONFIRM,
    label: "Confirm",
    keys: [{ name: "return" }],
    category: "Global"
  },
  [Bind.NAV_TREE_UP]: {
    id: Bind.NAV_TREE_UP,
    label: "Select Previous",
    keys: [{ name: "up" }, { name: "k" }],
    category: "Editor"
  },
  [Bind.NAV_TREE_DOWN]: {
    id: Bind.NAV_TREE_DOWN,
    label: "Select Next",
    keys: [{ name: "down" }, { name: "j" }],
    category: "Editor"
  },

  // --- Editor ---
  [Bind.EDITOR_DELETE]: {
    id: Bind.EDITOR_DELETE,
    label: "Delete",
    keys: [{ name: "delete" }, { name: "backspace" }], // Added backspace as common alias
    category: "Editor"
  },
  [Bind.EDITOR_DUPLICATE]: {
    id: Bind.EDITOR_DUPLICATE,
    label: "Duplicate",
    keys: [{ name: "d" }],
    category: "Editor"
  },
  [Bind.EDITOR_COPY]: {
    id: Bind.EDITOR_COPY,
    label: "Copy",
    keys: [{ name: "c", shift: true }], // Using Shift+C per existing code
    category: "Editor"
  },
  [Bind.EDITOR_PASTE]: {
    id: Bind.EDITOR_PASTE,
    label: "Paste",
    keys: [{ name: "v", ctrl: false }], // Explicitly !ctrl per existing code
    category: "Editor"
  },
  [Bind.EDITOR_UNDO]: {
    id: Bind.EDITOR_UNDO,
    label: "Undo",
    keys: [{ name: "z", shift: false }],
    category: "Editor"
  },
  [Bind.EDITOR_REDO]: {
    id: Bind.EDITOR_REDO,
    label: "Redo",
    keys: [{ name: "y" }, { name: "z", shift: true }],
    category: "Editor"
  },
  [Bind.EDITOR_MOVE_UP]: {
    id: Bind.EDITOR_MOVE_UP,
    label: "Move Up",
    keys: [{ name: "up", option: true }],
    category: "Editor"
  },
  [Bind.EDITOR_MOVE_DOWN]: {
    id: Bind.EDITOR_MOVE_DOWN,
    label: "Move Down",
    keys: [{ name: "down", option: true }],
    category: "Editor"
  },
  [Bind.EDITOR_ENTER_ADD_MODE]: {
    id: Bind.EDITOR_ENTER_ADD_MODE,
    label: "Add Element...",
    keys: [{ name: "a" }],
    category: "Editor"
  },

  // --- Add Mode ---
  [Bind.ADD_BOX]: { id: Bind.ADD_BOX, label: "Add Box", keys: [{ name: "b" }], category: "Editor" },
  [Bind.ADD_TEXT]: { id: Bind.ADD_TEXT, label: "Add Text", keys: [{ name: "t" }], category: "Editor" },
  [Bind.ADD_SCROLLBOX]: { id: Bind.ADD_SCROLLBOX, label: "Add Scrollbox", keys: [{ name: "s" }], category: "Editor" },
  [Bind.ADD_INPUT]: { id: Bind.ADD_INPUT, label: "Add Input", keys: [{ name: "i" }], category: "Editor" },
  [Bind.ADD_TEXTAREA]: { id: Bind.ADD_TEXTAREA, label: "Add Textarea", keys: [{ name: "x" }], category: "Editor" },
  [Bind.ADD_SELECT]: { id: Bind.ADD_SELECT, label: "Add Select", keys: [{ name: "e" }], category: "Editor" },
  [Bind.ADD_SLIDER]: { id: Bind.ADD_SLIDER, label: "Add Slider", keys: [{ name: "l" }], category: "Editor" },
  [Bind.ADD_ASCII_FONT]: { id: Bind.ADD_ASCII_FONT, label: "Add ASCII", keys: [{ name: "f" }], category: "Editor" },
  [Bind.ADD_TAB_SELECT]: { id: Bind.ADD_TAB_SELECT, label: "Add Tab Select", keys: [{ name: "w" }], category: "Editor" },

  // --- Animation ---
  [Bind.ANIM_PLAY_TOGGLE]: {
    id: Bind.ANIM_PLAY_TOGGLE,
    label: "Play/Pause",
    keys: [{ name: "space" }],
    category: "Animation"
  },
  [Bind.ANIM_PREV_FRAME]: {
    id: Bind.ANIM_PREV_FRAME,
    label: "Prev Frame",
    keys: [{ name: "e" }],
    category: "Animation"
  },
  [Bind.ANIM_NEXT_FRAME]: {
    id: Bind.ANIM_NEXT_FRAME,
    label: "Next Frame",
    keys: [{ name: "r" }],
    category: "Animation"
  },
  [Bind.ANIM_DUPLICATE_FRAME]: {
    id: Bind.ANIM_DUPLICATE_FRAME,
    label: "Dup Frame",
    keys: [{ name: "f" }],
    category: "Animation"
  },
  [Bind.ANIM_DELETE_FRAME]: {
    id: Bind.ANIM_DELETE_FRAME,
    label: "Del Frame",
    keys: [{ name: "x" }],
    category: "Animation"
  },
  
  // --- Timeline ---
  [Bind.TIMELINE_PREV_KEYFRAME]: {
    id: Bind.TIMELINE_PREV_KEYFRAME,
    label: "Prev Keyframe",
    keys: [{ name: "j" }],
    category: "Timeline"
  },
  [Bind.TIMELINE_NEXT_KEYFRAME]: {
    id: Bind.TIMELINE_NEXT_KEYFRAME,
    label: "Next Keyframe",
    keys: [{ name: "k" }],
    category: "Timeline"
  },
}

export function isKeybind(event: KeyEvent, bind: Bind): boolean {
  const def = KEYBOARD_SHORTCUTS[bind]
  if (!def) return false

  return def.keys.some(k => {
    // Check main key name
    if (k.name !== event.name) return false
    
    // Check modifiers if they are defined in the shortcut definition.
    // If defined in shortcut as true, must be true in event.
    // If defined in shortcut as false, must be false in event.
    // If undefined in shortcut, we generally ignore it (or strict match? usually strict match is better for shortcuts to avoid accidental triggers)
    
    // Strict matching strategy:
    // If shortcut says ctrl:true, event must have ctrl.
    // If shortcut says ctrl:false (or undefined), event must NOT have ctrl.
    
    if (!!k.ctrl !== !!event.ctrl) return false
    if (!!k.shift !== !!event.shift) return false
    if (!!k.option !== !!event.option) return false
    if (!!k.meta !== !!event.meta) return false
    
    return true
  })
}

// Helper to get formatted string for display (e.g. "Ctrl+Q")
export function getShortcutLabel(bind: Bind): string {
  const def = KEYBOARD_SHORTCUTS[bind]
  if (!def || def.keys.length === 0) return ""
  
  const k = def.keys[0]
  const parts = []
  if (k.ctrl) parts.push("Ctrl")
  if (k.option) parts.push("Alt")
  if (k.shift) parts.push("Shift")
  if (k.meta) parts.push("Cmd")
  parts.push(k.name.toUpperCase())
  
  return parts.join("+")
}
