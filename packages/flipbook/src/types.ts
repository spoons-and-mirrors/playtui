/**
 * Flipbook - Type Definitions
 * 
 * Animation modules export: { animation: { name, fps, frames } }
 */

import type { ReactNode } from "react"

export interface Animation {
  name: string
  fps: number
  frames: ReactNode[]
}
