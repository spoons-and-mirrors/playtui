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

export function reduceViewState(
  state: ViewLayoutState,
  action: ViewAction,
): ViewLayoutState {
  if (action === Bind.VIEW_PLAY) {
    const playCfg = VIEW_MODE_BY_BIND[Bind.VIEW_PLAY]
    if (!playCfg) {
      return state
    }

    if (state.mode !== 'play') {
      return {
        ...state,
        mode: 'play',
        showTimeline: playCfg.hasTimeline,
      }
    }

    if (!playCfg.hasTimeline) {
      return state
    }

    return {
      ...state,
      showTimeline: !state.showTimeline,
    }
  }

  if (action === Bind.TOGGLE_CODE) {
    const cfg = VIEW_MODE_BY_MODE[state.mode]
    if (!cfg.supportsCodePanel) {
      return state
    }

    return {
      ...state,
      showCodePanel: !state.showCodePanel,
    }
  }

  const nextCfg = VIEW_MODE_BY_BIND[action]

  if (nextCfg) {
    return {
      ...state,
      mode: nextCfg.mode,
    }
  }

  return state
}
