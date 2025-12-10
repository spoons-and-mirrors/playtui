/**
 * Flipbook - Type Definitions
 */

export type ElementType = "box" | "text" | "ascii-font" | "scrollbox"
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse"
export type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
export type JustifyContent = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
export type Overflow = "visible" | "hidden" | "scroll"
export type SizeValue = number | "auto" | `${number}%`

export interface ElementNode {
  id: string
  type: ElementType
  name?: string
  children: ElementNode[]
  // Layout
  x?: number
  y?: number
  width?: SizeValue
  height?: SizeValue
  flexDirection?: FlexDirection
  alignItems?: AlignItems
  justifyContent?: JustifyContent
  flexGrow?: number
  flexShrink?: number
  gap?: number
  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  margin?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  overflow?: Overflow
  // Appearance
  visible?: boolean
  backgroundColor?: string
  border?: boolean
  borderStyle?: "single" | "double" | "rounded" | "heavy"
  borderColor?: string
  borderSides?: ("top" | "right" | "bottom" | "left")[]
  // Text
  text?: string
  content?: string
  fg?: string
  // Ascii-font
  font?: "tiny" | "block" | "slick" | "shade"
  color?: string
}

export interface AnimationData {
  frames: ElementNode[]
  fps: number
  name: string
}
