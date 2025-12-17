# PlayTUI Documentation

A native TUI design and animation tool built on sst/opentui.

> WARNING: PLAYTUI is pre-alpha, riddled with bugs, and feature implementations evolveing on a whim. Very much vibe coded.

## Getting Started

PlayTUI is a visual editor for building terminal UIs. The interface consists of:

- **Canvas** (center): Live preview of your component tree
- **Tree Panel** (left): Hierarchical view of all renderables
- **Properties Panel** (right): Edit styles and properties of selected renderable
- **NavBar** (bottom): Switch modes and see project status

Press `Tab` to cycle panel visibility (both, none, tree-only, properties-only).

## Modes

Switch between modes using F-keys or clicking the NavBar buttons.

| Key | Mode    | Description                                               |
| --- | ------- | --------------------------------------------------------- |
| F1  | Edit    | Switch to editor mode                                     |
| F2  | Play    | Switch to play mode; press again to toggle timeline panel |
| F3  | Code    | Toggle code panel - live JSX editor                       |
| F4  | Library | Browse and load saved projects                            |
| F5  | Docs    | This documentation                                        |

## Editor Mode

The main editing mode for building your UI.

### Selecting Renderables

Click renderables on the canvas or in the tree panel. The selected renderable is highlighted and its properties appear in the right panel.

| Key    | Action                      |
| ------ | --------------------------- |
| ↑ / ↓  | Navigate tree selection     |
| Escape | Deselect current renderable |

### Adding Renderables

Press `A` to enter Add Mode, then press the renderable key:

| Key | Renderable      |
| --- | --------------- |
| B   | Box (container) |
| T   | Text            |
| S   | Scrollbox       |
| I   | Input           |
| X   | Textarea        |
| E   | Select dropdown |
| L   | Slider          |
| F   | ASCII Font      |
| W   | Tab Select      |

Press `A` or `Escape` to exit Add Mode without adding.

### Editing Renderables

| Key     | Action                         |
| ------- | ------------------------------ |
| Delete  | Delete selected renderable     |
| D       | Duplicate renderable           |
| Shift+C | Copy renderable                |
| V       | Paste renderable               |
| Alt+↑   | Move renderable up in parent   |
| Alt+↓   | Move renderable down in parent |

### History

| Key | Action |
| --- | ------ |
| Z   | Undo   |
| Y   | Redo   |

### Drag Positioning

Renderables with `position: absolute` or `position: relative` can be dragged directly on the canvas to reposition.

## Play Mode

Animation timeline for creating frame-by-frame or keyframed animations.

| Key   | Action                  |
| ----- | ----------------------- |
| Space | Play / Pause animation  |
| E     | Previous frame          |
| R     | Next frame              |
| F     | Duplicate current frame |
| X     | Delete current frame    |
| T     | Toggle timeline panel   |

### Timeline Panel

When the timeline is open (press `T`):

| Key | Action                    |
| --- | ------------------------- |
| J   | Jump to previous keyframe |
| K   | Jump to next keyframe     |

The timeline shows:

- **Dopesheet**: All animated properties grouped by node
- **Curve Editor**: Edit bezier handles for interpolation

### FilmStrip

- Double-click FPS or frame count to edit
- Mouse wheel scrolls through frames
- `+` button adds new frames

## Keyframing

Animate properties over time with keyframes. Keyframed values interpolate smoothly between frames.

### Animatable Properties

- **Position**: x, y, zIndex
- **Spacing**: all margins, all paddings
- **Layout**: gap, rowGap, columnGap, flexGrow, flexShrink

### Interpolation

Each keyframe has bezier handles for custom easing:

- `handleIn` / `handleOut` control curve tension and overshoot
- Edit curves directly in the Curve Editor

## Code Mode

Edit your component tree as JSX code. Changes are parsed in real-time and reflected in the visual editor.

- Syntax errors are shown inline
- Use the copy button to export code to clipboard
- Supports inline formatting: `<strong>`, `<em>`, `<u>`, `<span dim>`

## Library Mode

Browse saved projects in a two-column layout.

| Key   | Action                 |
| ----- | ---------------------- |
| ↑ / ↓ | Navigate within column |
| ← / → | Switch between columns |
| Enter | Load selected project  |

## Export & Import

Export animations as TSX modules for use with the flipbook player.

- Export button in FilmStrip header
- Generates self-contained TSX with baked frames
- Import parses animation modules back to editable frames

Export format:

```tsx
export const animation = {
  name: 'Animation',
  fps: 12,
  frames: [
    /* JSX renderables */
  ],
}
```

## Properties Panel

The right panel shows editable properties for the selected renderable:

- **Dimensions**: Width, height, min/max constraints
- **Layout**: Flex direction, alignment, gap
- **Spacing**: Padding and margin
- **Position**: Absolute positioning, z-index
- **Background**: Colors and fills
- **Border**: Border styles and colors

Click property values to edit. Use scroll wheel on number fields for quick adjustments.

## Color Palettes

Projects contain named color palettes (Ocean, Forest, Sunset by default):

- 8 swatches per palette
- Click swatches in Properties to apply colors
- Edit and switch palettes per project

## Storage

Projects auto-save as you work (1.5s debounce).

Storage locations:

- **Linux**: `~/.local/share/playtui/projects/`
- **macOS**: `~/Library/Application Support/playtui/projects/`
- **Windows**: `%APPDATA%\playtui\`

History is persisted per project (up to 10,000 entries).

## Tips

- Double-click tree items to rename renderables
- `Tab` cycles panel visibility for more canvas space
- `Ctrl+Q` to quit
