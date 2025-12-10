# @playtui/flipbook

Terminal animation player for TUI animations created with [PlayTUI](https://github.com/spoons-and-mirrors/playtui).

## Installation

```bash
# Global install
npm install -g @playtui/flipbook

# Or use directly with npx/bunx
npx @playtui/flipbook animation.json
bunx @playtui/flipbook animation.json
```

## CLI Usage

```bash
# Play an animation
flipbook my-animation.json

# Play the bundled demo
flipbook --demo

# Override FPS
flipbook my-animation.json --fps 30

# Show help
flipbook --help
```

### Controls

- `q` / `Esc` / `Ctrl+C` - Exit

## Library Usage

You can also use the player as a React component in your own OpenTUI applications:

```tsx
import { AnimationPlayer, type AnimationData } from "@playtui/flipbook"

const myAnimation: AnimationData = {
  name: "My Animation",
  fps: 10,
  frames: [
    // ... your animation frames
  ]
}

function App() {
  return <AnimationPlayer data={myAnimation} />
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `AnimationData` | The animation data object |
| `fpsOverride` | `number` | Override the animation's FPS |

## Animation Format

Animation files are JSON with the following structure:

```json
{
  "name": "Animation Name",
  "fps": 10,
  "frames": [
    {
      "id": "root",
      "type": "box",
      "children": [...]
    }
  ]
}
```

Export animations from PlayTUI using the "Export Animation" feature.

## Requirements

- Bun runtime (for CLI)
- Terminal with 256-color support

## License

MIT
