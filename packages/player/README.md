# @playtui/player

Standalone player for TUI animations created with [PlayTUI](https://github.com/spoons-and-mirrors/playtui).

## Installation

```bash
# Global install
npm install -g @playtui/player

# Or use directly with npx/bunx
npx @playtui/player animation.json
bunx @playtui/player animation.json
```

## CLI Usage

```bash
# Play an animation
playtui-player my-animation.json

# Override FPS
playtui-player my-animation.json --fps 30

# Show help
playtui-player --help
```

### Controls

- `q` / `Esc` / `Ctrl+C` - Exit

## Library Usage

You can also use the player as a React component in your own OpenTUI applications:

```tsx
import { AnimationPlayer, type AnimationData } from "@playtui/player"

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
