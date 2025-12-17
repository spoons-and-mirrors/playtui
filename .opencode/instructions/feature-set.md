# PLAYTUI FEATURE SET

This document is meant to evolve and reference all (or most) features of the app in natural language

## Components

### NavBar

Bottom navigation bar spanning the full width of the app. Contains mode-switching buttons on the left side:

- **F1**: Edit mode (simple switch, always goes to editor)
- **F2**: Play mode - if not in play mode, enters play mode with timeline visible; if already in play mode, toggles the timeline on/off. FilmStrip is always visible in play mode.
- **F3**: Toggle Code panel
- **F4**: Library view
- **F5**: Docs view

The right side displays the current project name with a save status indicator. Code panel highlight (F3) only shows when in Edit/Play modes (not in Library/Docs).

### Code Panel

Toggleable bottom panel (F3) for live JSX editing. Features:

- Displays a textarea where users can directly edit the component tree as JSX code
- Changes are parsed in real-time and applied to the visual editor
- Shows parse errors in the header
- Header contains: "Code" label, expand button (⛶), Copy button, Close button
- Expand button toggles between compact (12 rows) and expanded (half screen height)
- Panel appears below the Timeline panel when both are open
- Press ESC to unfocus the editor and restore keyboard shortcuts
- Click anywhere in the code editor to position cursor at that location
- When focused, global shortcuts are disabled to allow normal text editing

### Timeline Panel

Bottom panel for animation timeline/dopesheet. Features:

- Only available in Play mode (F2 switches to Play mode if in Editor mode)
- Toggleable on/off with F2 while in Play mode
- Shows keyframes across animation frames
- Curve Editor for editing bezier handles on keyframes
- Appears above the Code panel when both are visible
- Defaults to visible when entering Play mode

### Library Page

Project browser for loading saved projects. Displays a scrollable list of all saved projects with keyboard navigation (arrow keys). Selecting a project shows confirmation dialog. Replaces the current project state when a project is loaded.

### Docs Page

Two-column documentation viewer. Left sidebar contains a clickable Table of Contents generated from markdown headings. Right column displays the parsed docs.md content with syntax highlighting for code blocks and inline code. ToC entries highlight on hover and scroll the content to the corresponding section when clicked.

## Systems

### Shortcut Registry

All keyboard shortcuts are centralized in `packages/playtui/src/lib/shortcuts.ts`.

- `Bind` enum defines all action identifiers (e.g., `Bind.EDITOR_DELETE`, `Bind.ANIM_PLAY_TOGGLE`)
- `KEYBOARD_SHORTCUTS` record maps each `Bind` to its key definition(s), label, and category
- `isKeybind(event, bind)` checks if a key event matches a binding
- `getShortcutLabel(bind)` returns a formatted string for display (e.g., "Ctrl+Q")

When adding new shortcuts:

1. Add a new entry to the `Bind` enum
2. Add the corresponding definition in `KEYBOARD_SHORTCUTS`
3. Use `isKeybind(key, Bind.YOUR_NEW_BIND)` in the keyboard handler

Never hardcode `key.name === "..."` checks outside the registry.

### Project Storage

Projects persist as JSON files with auto-save (1.5s debounce). Storage locations are platform-specific:

- Linux: `~/.local/share/playtui/projects/`
- macOS: `~/Library/Application Support/playtui/projects/`
- Windows: `%APPDATA%\playtui\`

Each project stores its element tree, animation frames, color palettes, and undo history (capped at 10,000 entries).

### Keyframing System

Properties can be animated across frames using keyframes. Animatable properties include position (x, y, zIndex), spacing (margins, paddings), and layout (gap, flexGrow, flexShrink). Each keyframe has bezier handles (`handleIn`, `handleOut`) for custom interpolation curves. The Curve Editor in the timeline panel allows visual editing of these handles.

### Panel Visibility

`Tab` cycles through 4 panel states: both panels visible, both hidden (full canvas), tree-only, properties-only. State is tracked per mode (editor vs play).

### Canvas Centering

Double-clicking an element in the tree view centers it in the visible canvas area. The centering calculation accounts for all open bottom panels (Timeline, Code) to ensure the element appears in the true visual center of the remaining canvas space.

### Focus Management

The Code panel has its own focus state that blocks global keyboard shortcuts when active:

- Click inside the Code panel to focus it
- Press ESC to unfocus and restore global shortcuts
- The `focusedField` state in the main Builder component tracks which input has focus
- When `focusedField` is set to "code-panel", most global shortcuts are disabled
