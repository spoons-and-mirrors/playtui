// Helper to use keyframing context if available
// This avoids prop drilling by assuming controls are inside a provider if we want cleaner code,
// OR we can pass props explicitly.
// Given the current architecture, controls are pure. Let's pass the props.

import { createContext, useContext } from 'react'
import type { AnimatedProperty } from '../../lib/keyframing'

export interface KeyframingContextValue {
  autoKeyEnabled: boolean
  currentFrame: number
  animatedProperties: AnimatedProperty[]
  hasKeyframe: (
    renderableId: string,
    property: string,
    frame: number,
  ) => boolean
  addKeyframe: (renderableId: string, property: string, value: number) => void
  removeKeyframe: (renderableId: string, property: string) => void
  selectedId: string | null
}

export const KeyframingContext = createContext<KeyframingContextValue | null>(
  null,
)

export function useKeyframing() {
  return useContext(KeyframingContext)
}
