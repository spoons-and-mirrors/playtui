# PLAYTUI

A visual component builder for OpenTUI terminal applications.

## Features

- **Visual Canvas**: Click to select elements, see live preview
- **Property Editor**: Edit colors, dimensions, layout properties
- **Element Tree**: Hierarchical view with collapse/expand
- **Code Export**: Generate JSX code for your component
- **Undo/Redo**: Full history support
- **Keyboard Shortcuts**: Fast editing workflow

## Installation

Install globally via npm:

```bash
npm i -g playtui
```

Or run directly with npx:

```bash
npx playtui
```

## Development

```bash
bun install
bun run start
# or
bun run dev  # with hot reload
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Del` / `Backspace` | Delete selected element |
| `D` | Duplicate selected element |
| `B` | Add box to selected element |
| `T` | Add text to selected element |
| `↑` / `↓` | Navigate tree |
| `C` | Show generated code |
| `Z` | Undo |
| `Y` / `Shift+Z` | Redo |
| `Esc` | Deselect / Close code panel |
| `Ctrl+Q` | Quit |

## License

MIT
