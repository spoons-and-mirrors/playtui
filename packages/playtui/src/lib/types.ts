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
} from '@opentui/core'

export type RenderableType =
  | 'box'
  | 'text'
  | 'scrollbox'
  | 'input'
  | 'textarea'
  | 'select'
  | 'slider'
  | 'ascii-font'
  | 'tab-select'

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
export type FlexDirection = FlexDirectionString
export type FlexWrap = WrapString
export type JustifyContent = JustifyString
export type AlignItems = AlignString
export type AlignContent = AlignString
export type AlignSelf = AlignString
export type Position = Extract<PositionTypeString, 'relative' | 'absolute'>
export type Overflow = OverflowString

// =============================================================================
// BORDER TYPES - From OpenTUI
// =============================================================================

export type BorderStyle = OpenTUIBorderStyle
export type BorderSide = BorderSides
export type TitleAlignment = 'left' | 'center' | 'right' // Not exported by OpenTUI

// Text types
export type WrapMode = 'word' | 'none' | 'char'

// Size value can be number, "auto", or percentage string
export type SizeValue = number | 'auto' | `${number}%`

// =============================================================================
// BASE RENDERABLE - Common properties shared by ALL renderables
// =============================================================================

export interface BaseRenderable {
  id: string
  name?: string
  children: Renderable[]

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
  flexBasis?: number | 'auto'
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
// CONTAINER MIXIN - Properties for renderables that can have children (box, scrollbox)
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
  customBorderChars?: any // Using any for now to avoid import issues, will refine if possible
  shouldFill?: boolean
  title?: string
  titleAlignment?: TitleAlignment
}

// =============================================================================
// RENDERABLE-SPECIFIC NODE TYPES (Discriminated by `type` field)
// =============================================================================

export interface BoxRenderable extends BaseRenderable, ContainerProps {
  type: 'box'
}

export interface ScrollboxRenderable extends BaseRenderable, ContainerProps {
  type: 'scrollbox'
  stickyScroll?: boolean
  stickyStart?: 'top' | 'bottom' | 'left' | 'right'
  scrollX?: boolean
  scrollY?: boolean
  viewportCulling?: boolean
  showScrollArrows?: boolean
  scrollbarForeground?: string
  scrollbarBackground?: string
}

export interface TextRenderable extends BaseRenderable {
  type: 'text'
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

export interface InputRenderable extends BaseRenderable {
  type: 'input'
  placeholder?: string
  placeholderColor?: string
  cursorColor?: string
  cursorStyle?: 'block' | 'line' | 'underline'
  maxLength?: number
  backgroundColor?: string
  textColor?: string
  focusedTextColor?: string
  focusedBackgroundColor?: string
  focusedBorderColor?: string
}

export interface TextareaRenderable extends BaseRenderable {
  type: 'textarea'
  placeholder?: string
  placeholderColor?: string
  cursorColor?: string
  cursorStyle?: 'block' | 'line' | 'underline'
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

export interface SelectRenderable extends BaseRenderable {
  type: 'select'
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

export interface SliderRenderable extends BaseRenderable {
  type: 'slider'
  orientation?: 'horizontal' | 'vertical'
  value?: number
  min?: number
  max?: number
  viewPortSize?: number
  backgroundColor?: string
  foregroundColor?: string
}

export interface AsciiFontRenderable extends BaseRenderable {
  type: 'ascii-font'
  text?: string
  font?: 'tiny' | 'block' | 'slick' | 'shade' | 'huge' | 'grid' | 'pallet'
  color?: string
}

export interface TabSelectRenderable extends BaseRenderable {
  type: 'tab-select'
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
// DISCRIMINATED UNION - The main Renderable type
// =============================================================================

export type Renderable =
  | BoxRenderable
  | ScrollboxRenderable
  | TextRenderable
  | InputRenderable
  | TextareaRenderable
  | SelectRenderable
  | SliderRenderable
  | AsciiFontRenderable
  | TabSelectRenderable

// =============================================================================
// TYPE GUARDS - For proper type narrowing
// =============================================================================

export function isBoxRenderable(
  renderable: Renderable,
): renderable is BoxRenderable {
  return renderable.type === 'box'
}

export function isScrollboxRenderable(
  renderable: Renderable,
): renderable is ScrollboxRenderable {
  return renderable.type === 'scrollbox'
}

export function isTextRenderable(
  renderable: Renderable,
): renderable is TextRenderable {
  return renderable.type === 'text'
}

export function isInputRenderable(
  renderable: Renderable,
): renderable is InputRenderable {
  return renderable.type === 'input'
}

export function isTextareaRenderable(
  renderable: Renderable,
): renderable is TextareaRenderable {
  return renderable.type === 'textarea'
}

export function isSelectRenderable(
  renderable: Renderable,
): renderable is SelectRenderable {
  return renderable.type === 'select'
}

export function isSliderRenderable(
  renderable: Renderable,
): renderable is SliderRenderable {
  return renderable.type === 'slider'
}

export function isAsciiFontRenderable(
  renderable: Renderable,
): renderable is AsciiFontRenderable {
  return renderable.type === 'ascii-font'
}

export function isTabSelectRenderable(
  renderable: Renderable,
): renderable is TabSelectRenderable {
  return renderable.type === 'tab-select'
}

// NOTE: isContainerNode has been moved to components/renderables/index.ts
// where it derives from RENDERABLE_REGISTRY.capabilities.supportsChildren
// This eliminates duplication between the type guard and the registry.

// =============================================================================
// PROPERTY DEFINITIONS - Now centralized in components/renderables/index.ts
// Re-export for backwards compatibility
// =============================================================================

export type {
  PropertySection,
  SerializableProp as PropertyDef,
} from '../components/renderables'

// Legacy PropertyType - kept for any remaining references
export type PropertyType =
  | 'number'
  | 'string'
  | 'select'
  | 'color'
  | 'toggle'
  | 'size'
  | 'borderSides'

import type { KeyframingState } from './keyframing'

export type HistoryEntry = {
  frameIndex: number
  tree: Renderable
  selectedId: string | null
  keyframing: KeyframingState
}
