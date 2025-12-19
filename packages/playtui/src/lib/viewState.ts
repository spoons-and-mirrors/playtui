import { Bind } from './shortcuts'

export type ViewMode = 'editor' | 'play' | 'library' | 'docs'

export interface ViewLayoutState {
  mode: ViewMode
  showCodePanel: boolean
  codePanelHeight: number
  showTimeline: boolean
}

export interface ViewModeConfig {
  mode: ViewMode
  bind: Bind
  label: string
  kind: 'builder' | 'browser'
  supportsCodePanel: boolean
  hasFilmStrip: boolean
  hasTimeline: boolean
}

export const VIEW_MODES: ViewModeConfig[] = [
  {
    mode: 'editor',
    bind: Bind.VIEW_EDITOR,
    label: 'Edit',
    kind: 'builder',
    supportsCodePanel: true,
    hasFilmStrip: false,
    hasTimeline: false,
  },
  {
    mode: 'play',
    bind: Bind.VIEW_PLAY,
    label: 'Play',
    kind: 'builder',
    supportsCodePanel: true,
    hasFilmStrip: true,
    hasTimeline: true,
  },
  {
    mode: 'library',
    bind: Bind.VIEW_LIBRARY,
    label: 'Library',
    kind: 'browser',
    supportsCodePanel: false,
    hasFilmStrip: false,
    hasTimeline: false,
  },
  {
    mode: 'docs',
    bind: Bind.VIEW_DOCS,
    label: 'Docs',
    kind: 'browser',
    supportsCodePanel: false,
    hasFilmStrip: false,
    hasTimeline: false,
  },
]

const VIEW_MODE_BY_BIND: Partial<Record<Bind, ViewModeConfig>> = {}

for (const cfg of VIEW_MODES) {
  VIEW_MODE_BY_BIND[cfg.bind] = cfg
}

export const VIEW_MODE_BY_MODE: Record<ViewMode, ViewModeConfig> =
  VIEW_MODES.reduce(
    (acc, cfg) => {
      acc[cfg.mode] = cfg
      return acc
    },
    {} as Record<ViewMode, ViewModeConfig>,
  )

export type ViewAction = (typeof VIEW_MODES)[number]['bind'] | Bind.TOGGLE_CODE

export const NAV_ITEMS: { bind: Bind; label: string }[] = [
  { bind: Bind.VIEW_EDITOR, label: 'Edit' },
  { bind: Bind.VIEW_PLAY, label: 'Play' },
  { bind: Bind.TOGGLE_CODE, label: 'Code' },
  { bind: Bind.VIEW_LIBRARY, label: 'Library' },
  { bind: Bind.VIEW_DOCS, label: 'Docs' },
]

export function reduceViewState(
  state: ViewLayoutState,
  action: ViewAction,
): ViewLayoutState {
  const cfg = VIEW_MODE_BY_BIND[action]

  // Handle Mode switching or Play toggle
  if (cfg) {
    // If we're already in play mode and press F2, toggle timeline
    if (action === Bind.VIEW_PLAY && state.mode === 'play') {
      return {
        ...state,
        showTimeline: !state.showTimeline,
      }
    }

    // Otherwise, switch mode
    return {
      ...state,
      mode: cfg.mode,
      // Automatically show timeline when entering play mode
      showTimeline: cfg.mode === 'play' ? true : state.showTimeline,
    }
  }

  // Handle specialized toggles
  if (action === Bind.TOGGLE_CODE) {
    const modeCfg = VIEW_MODE_BY_MODE[state.mode]
    if (!modeCfg.supportsCodePanel) {
      return state
    }

    return {
      ...state,
      showCodePanel: !state.showCodePanel,
    }
  }

  return state
}
