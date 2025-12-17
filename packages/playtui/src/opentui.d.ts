import type { SliderRenderable, SliderOptions, ColorInput } from '@opentui/core'
import type React from 'react'

// Slider props for JSX usage
export interface SliderProps {
  orientation?: 'vertical' | 'horizontal'
  value?: number
  min?: number
  max?: number
  viewPortSize?: number
  backgroundColor?: ColorInput
  foregroundColor?: ColorInput
  onChange?: (value: number) => void
  style?: Partial<{
    width: number | string
    height: number | string
    flexGrow: number
    flexShrink: number
  }>
  ref?: React.Ref<SliderRenderable>
}

// Augment OpenTUI's component catalogue
declare module '@opentui/react' {
  interface OpenTUIComponents {
    slider: typeof SliderRenderable
  }
}

// Augment JSX IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      slider: SliderProps
    }
  }
}
