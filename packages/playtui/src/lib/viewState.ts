import { Bind } from "./shortcuts"

export type ViewMode = "editor" | "play" | "library" | "docs"

export interface ViewLayoutState {
  mode: ViewMode
  showCodePanel: boolean
  showTimeline: boolean
}

export interface ViewModeConfig {
  mode: ViewMode
  bind: Bind
  label: string
}

export const VIEW_MODES: ViewModeConfig[] = [
  {
    mode: "editor",
    bind: Bind.VIEW_EDITOR,
    label: "Edit",
  },
  {
    mode: "play",
    bind: Bind.VIEW_PLAY,
    label: "Play",
  },
  {
    mode: "library",
    bind: Bind.VIEW_LIBRARY,
    label: "Library",
  },
  {
    mode: "docs",
    bind: Bind.VIEW_DOCS,
    label: "Docs",
  },
]

const VIEW_MODE_BY_BIND: Partial<Record<Bind, ViewMode>> = {}

for (const cfg of VIEW_MODES) {
  VIEW_MODE_BY_BIND[cfg.bind] = cfg.mode
}

export type ViewAction =
  | (typeof VIEW_MODES)[number]["bind"]
  | Bind.TOGGLE_CODE

export function reduceViewState(
  state: ViewLayoutState,
  action: ViewAction,
): ViewLayoutState {
  if (action === Bind.VIEW_PLAY) {
    if (state.mode !== "play") {
      return {
        ...state,
        mode: "play",
        showTimeline: true,
      }
    }

    return {
      ...state,
      showTimeline: !state.showTimeline,
    }
  }

  if (action === Bind.TOGGLE_CODE) {
    if (state.mode === "editor" || state.mode === "play") {
      return {
        ...state,
        showCodePanel: !state.showCodePanel,
      }
    }

    return state
  }

  const nextMode = VIEW_MODE_BY_BIND[action]

  if (nextMode) {
    return {
      ...state,
      mode: nextMode,
    }
  }

  return state
}
