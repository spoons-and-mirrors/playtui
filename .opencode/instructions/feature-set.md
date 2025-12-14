# PLAYTUI FEATURE SET

This document is meant to evolve and reference all (or most) features of the app in natural language

## Components

### NavBar
Bottom navigation bar spanning the full width of the app. Contains mode-switching buttons (Edit, Play, Code, Library, Docs) on the left side, and displays the current project name with a save status indicator on the right.

### Code Page
Live JSX code editor for the current project. Displays a full-screen textarea where users can directly edit the component tree as JSX code. Changes are parsed in real-time and applied to the visual editor. Shows parse errors inline when the code is invalid. Includes a copy button to save the code to clipboard.

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