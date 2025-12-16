import { Bind } from "./shortcuts"

export type ViewMode = "editor" | "play" | "library" | "docs"

export interface ViewLayoutState {
  mode: ViewMode
  showCodePanel: boolean
  showTimeline: boolean
}

export type ViewAction =
  | Bind.VIEW_EDITOR
  | Bind.VIEW_PLAY
  | Bind.TOGGLE_CODE
  | Bind.VIEW_LIBRARY
  | Bind.VIEW_DOCS

export function reduceViewState(
  state: ViewLayoutState,
  action: ViewAction,
): ViewLayoutState {
  if (action === Bind.VIEW_EDITOR) {
    return {
      ...state,
      mode: "editor",
    }
  }

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

  if (action === Bind.VIEW_LIBRARY) {
    return {
      ...state,
      mode: "library",
    }
  }

  if (action === Bind.VIEW_DOCS) {
    return {
      ...state,
      mode: "docs",
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

  return state
}
