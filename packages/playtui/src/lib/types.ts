// Element and property types for the builder
// Single source of truth: OpenTUI types with UI-specific subsets

import type {
  FlexDirectionString,
  JustifyString,
  AlignString,
  OverflowString,
  PositionTypeString,
  WrapString,
  BorderStyle as OpenTUIBorderStyle,
  BorderSides,
} from "@opentui/core"

export type ElementType = "box" | "text" | "scrollbox" | "input" | "textarea" | "select" | "slider" | "ascii-font" | "tab-select"

// =============================================================================
// LAYOUT TYPES - Derived from OpenTUI (single source of truth)
// =============================================================================

// Full OpenTUI types (use these when you need all options)
export type {
  FlexDirectionString,
  JustifyString,
  AlignString,
  OverflowString,
  PositionTypeString,
  WrapString,
}

// UI subset types - Extract from OpenTUI types for type safety
// These are the values exposed in our property editor controls
export type FlexDirection = Extract<FlexDirectionString, "row" | "column">
export type FlexWrap = Extract<WrapString, "wrap" | "no-wrap">
export type JustifyContent = Extract<JustifyString, "flex-start" | "center" | "flex-end" | "space-between" | "space-around">
export type AlignItems = Extract<AlignString, "flex-start" | "center" | "flex-end" | "stretch">
export type AlignContent = Extract<AlignString, "flex-start" | "center" | "flex-end" | "stretch" | "space-between" | "space-around">
export type AlignSelf = Extract<AlignString, "auto" | "flex-start" | "center" | "flex-end" | "stretch">
export type Position = Extract<PositionTypeString, "relative" | "absolute">
export type Overflow = OverflowString

// =============================================================================
// BORDER TYPES - From OpenTUI
// =============================================================================

export type BorderStyle = OpenTUIBorderStyle
export type BorderSide = BorderSides
export type TitleAlignment = "left" | "center" | "right"  // Not exported by OpenTUI

// Text types
export type WrapMode = "word" | "none" | "char"

// Size value can be number, "auto", or percentage string
export type SizeValue = number | "auto" | `${number}%`

// =============================================================================
// BASE NODE - Common properties shared by ALL elements
// =============================================================================

export interface BaseNode {
  id: string
  name?: string
  children: ElementNode[]

  // === SIZING ===
  width?: SizeValue
  height?: SizeValue
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  aspectRatio?: number

  // === FLEX ITEM ===
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | "auto"
  alignSelf?: AlignSelf

  // === SPACING - MARGIN ===
  margin?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number

  // === VISIBILITY ===
  visible?: boolean

  // === POSITIONING ===
  position?: Position
  x?: number
  y?: number
  zIndex?: number
}

// =============================================================================
// CONTAINER MIXIN - Properties for elements that can have children (box, scrollbox)
// =============================================================================

export interface ContainerProps {
  // === FLEX CONTAINER ===
  flexDirection?: FlexDirection
  flexWrap?: FlexWrap
  justifyContent?: JustifyContent
  alignItems?: AlignItems
  alignContent?: AlignContent
  gap?: number
  rowGap?: number
  columnGap?: number

  // === SPACING - PADDING ===
  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number

  // === OVERFLOW ===
  overflow?: Overflow

  // === BACKGROUND ===
  backgroundColor?: string

  // === BORDER ===
  border?: boolean
  borderSides?: BorderSide[]
  borderStyle?: BorderStyle
  borderColor?: string
  focusedBorderColor?: string
  shouldFill?: boolean
  title?: string
  titleAlignment?: TitleAlignment
}

// =============================================================================
// ELEMENT-SPECIFIC NODE TYPES (Discriminated by `type` field)
// =============================================================================

export interface BoxNode extends BaseNode, ContainerProps {
  type: "box"
}

export interface ScrollboxNode extends BaseNode, ContainerProps {
  type: "scrollbox"
  stickyScroll?: boolean
  stickyStart?: "top" | "bottom" | "left" | "right"
  scrollX?: boolean
  scrollY?: boolean
  viewportCulling?: boolean
  showScrollArrows?: boolean
  scrollbarForeground?: string
  scrollbarBackground?: string
}

export interface TextNode extends BaseNode {
  type: "text"
  content?: string
  fg?: string
  bg?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  dim?: boolean
  strikethrough?: boolean
  selectable?: boolean
  wrapMode?: WrapMode
  
  // === SPACING - PADDING ===
  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
}

export interface InputNode extends BaseNode {
  type: "input"
  placeholder?: string
  placeholderColor?: string
  cursorColor?: string
  cursorStyle?: "block" | "line" | "underline"
  maxLength?: number
  backgroundColor?: string
  textColor?: string
  focusedTextColor?: string
  focusedBackgroundColor?: string
  focusedBorderColor?: string
}

export interface TextareaNode extends BaseNode {
  type: "textarea"
  placeholder?: string
  placeholderColor?: string
  cursorColor?: string
  cursorStyle?: "block" | "line" | "underline"
  blinking?: boolean
  tabIndicatorColor?: string
  scrollMargin?: number
  showCursor?: boolean
  initialValue?: string
  backgroundColor?: string
  textColor?: string
  focusedTextColor?: string
  focusedBackgroundColor?: string
}

export interface SelectNode extends BaseNode {
  type: "select"
  options?: string[]
  backgroundColor?: string
  selectedBackgroundColor?: string
  textColor?: string
  selectedTextColor?: string
  descriptionColor?: string
  selectedDescriptionColor?: string
  showScrollIndicator?: boolean
  showDescription?: boolean
  wrapSelection?: boolean
  itemSpacing?: number
  fastScrollStep?: number
}

export interface SliderNode extends BaseNode {
  type: "slider"
  orientation?: "horizontal" | "vertical"
  value?: number
  min?: number
  max?: number
  viewPortSize?: number
  backgroundColor?: string
  foregroundColor?: string
}

export interface AsciiFontNode extends BaseNode {
  type: "ascii-font"
  text?: string
  font?: "tiny" | "block" | "slick" | "shade" | "huge" | "grid" | "pallet"
  color?: string
}

export interface TabSelectNode extends BaseNode {
  type: "tab-select"
  options?: string[]
  tabWidth?: number
  showUnderline?: boolean
  wrapSelection?: boolean
  backgroundColor?: string
  selectedBackgroundColor?: string
  textColor?: string
  selectedTextColor?: string
}

// =============================================================================
// DISCRIMINATED UNION - The main ElementNode type
// =============================================================================

export type ElementNode =
  | BoxNode
  | ScrollboxNode
  | TextNode
  | InputNode
  | TextareaNode
  | SelectNode
  | SliderNode
  | AsciiFontNode
  | TabSelectNode

// =============================================================================
// TYPE GUARDS - For proper type narrowing
// =============================================================================

export function isBoxNode(node: ElementNode): node is BoxNode {
  return node.type === "box"
}

export function isScrollboxNode(node: ElementNode): node is ScrollboxNode {
  return node.type === "scrollbox"
}

export function isTextNode(node: ElementNode): node is TextNode {
  return node.type === "text"
}

export function isInputNode(node: ElementNode): node is InputNode {
  return node.type === "input"
}

export function isTextareaNode(node: ElementNode): node is TextareaNode {
  return node.type === "textarea"
}

export function isSelectNode(node: ElementNode): node is SelectNode {
  return node.type === "select"
}

export function isSliderNode(node: ElementNode): node is SliderNode {
  return node.type === "slider"
}

export function isAsciiFontNode(node: ElementNode): node is AsciiFontNode {
  return node.type === "ascii-font"
}

export function isTabSelectNode(node: ElementNode): node is TabSelectNode {
  return node.type === "tab-select"
}

// NOTE: isContainerNode has been moved to components/elements/index.ts
// where it derives from ELEMENT_REGISTRY.capabilities.supportsChildren
// This eliminates duplication between the type guard and the registry.

// =============================================================================
// PROPERTY DEFINITIONS - Now centralized in components/elements/index.ts
// Re-export for backwards compatibility
// =============================================================================

export type { PropertySection, SerializableProp as PropertyDef } from "../components/elements"

// Legacy PropertyType - kept for any remaining references
export type PropertyType = "number" | "string" | "select" | "color" | "toggle" | "size" | "borderSides"

import type { KeyframingState } from "./keyframing"

export type HistoryEntry = {
  frameIndex: number
  tree: ElementNode
  selectedId: string | null
  keyframing: KeyframingState
}
