// Element and property types for the builder

export type ElementType = "box" | "text" | "scrollbox" | "input" | "textarea" | "select" | "slider" | "ascii-font" | "tab-select"

// Layout types
export type FlexDirection = "row" | "column"
export type FlexWrap = "wrap" | "nowrap"
export type JustifyContent = "flex-start" | "center" | "flex-end" | "space-between" | "space-around"
export type AlignItems = "flex-start" | "center" | "flex-end" | "stretch"
export type AlignSelf = "auto" | "flex-start" | "center" | "flex-end" | "stretch"

// Positioning types
export type Position = "relative" | "absolute"
export type Overflow = "visible" | "hidden" | "scroll"

// Border types
export type BorderStyle = "single" | "rounded" | "double" | "heavy"
export type TitleAlignment = "left" | "center" | "right"
export type BorderSide = "top" | "right" | "bottom" | "left"

// Text types
export type WrapMode = "word" | "none" | "char"

// Size value can be number, "auto", or percentage string
export type SizeValue = number | "auto" | `${number}%`

export interface ElementNode {
  id: string
  type: ElementType
  name?: string

  // === SIZING ===
  width?: SizeValue
  height?: SizeValue
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number

  // === FLEX CONTAINER ===
  flexDirection?: FlexDirection
  flexWrap?: "wrap" | "nowrap"
  justifyContent?: JustifyContent
  alignItems?: AlignItems
  gap?: number
  rowGap?: number
  columnGap?: number

  // === FLEX ITEM ===
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | "auto"
  alignSelf?: AlignSelf

  // === SPACING - PADDING ===
  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number

  // === SPACING - MARGIN ===
  margin?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number

  // === POSITIONING ===
  position?: Position
  top?: number
  right?: number
  bottom?: number
  left?: number
  zIndex?: number

  // === OVERFLOW ===
  overflow?: Overflow

  // === VISIBILITY ===
  visible?: boolean

  // === BACKGROUND ===
  backgroundColor?: string

  // === BORDER ===
  border?: boolean
  borderSides?: BorderSide[]
  borderStyle?: BorderStyle
  borderColor?: string
  focusedBorderColor?: string
  title?: string
  titleAlignment?: TitleAlignment

  // === TEXT PROPERTIES ===
  content?: string
  fg?: string
  bg?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  wrapMode?: WrapMode

  // === INPUT PROPERTIES ===
  placeholder?: string

  // === TEXTAREA PROPERTIES ===
  minLines?: number
  maxLines?: number

  // === SELECT PROPERTIES ===
  options?: string[]

  // === SLIDER PROPERTIES ===
  orientation?: "horizontal" | "vertical"
  value?: number
  min?: number
  max?: number
  viewPortSize?: number
  foregroundColor?: string

  // === ASCII-FONT PROPERTIES ===
  text?: string
  font?: "tiny" | "block" | "slick" | "shade"
  color?: string

  // === TAB-SELECT PROPERTIES ===
  tabWidth?: number

  // === SCROLLBOX PROPERTIES ===
  stickyScroll?: boolean
  scrollX?: boolean
  scrollY?: boolean
  viewportCulling?: boolean

  // === INPUT/TEXTAREA COLORS ===
  textColor?: string
  focusedTextColor?: string
  focusedBackgroundColor?: string

  children: ElementNode[]
}

export type PropertyType = "number" | "string" | "select" | "color" | "toggle" | "size" | "borderSides"

export interface PropertyDef {
  key: keyof ElementNode
  label: string
  type: PropertyType
  options?: string[]
  appliesTo?: ElementType[]
  min?: number
  max?: number
  section?: PropertySection
}

export type PropertySection =
  | "sizing"
  | "flexContainer"
  | "flexItem"
  | "padding"
  | "margin"
  | "position"
  | "overflow"
  | "visibility"
  | "background"
  | "border"
  | "text"
  | "input"
  | "textarea"
  | "select"
  | "slider"
  | "asciiFont"
  | "tabSelect"
  | "scrollbox"

export type HistoryEntry = { tree: ElementNode; selectedId: string | null }
