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


import type { KeyframingState } from './keyframing'
import { createDefaultKeyframingState } from './keyframing'

export type HistoryEntry = {
  frameIndex: number
  tree: Renderable
  selectedId: string | null
  keyframing: KeyframingState
}

// =============================================================================
// PROJECT TYPES
// =============================================================================

// Color swatch - reusable color variable
export interface ColorSwatch {
  id: string
  color: string // hex color value (#RRGGBB or #RRGGBBAA)
}

// Color palette - group of swatches
export interface ColorPalette {
  id: string
  name: string
  swatches: ColorSwatch[]
}

export interface Project {
  name: string
  version: 1 // Schema version for future migrations
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp

  // Current state
  tree: Renderable
  selectedId: string | null
  collapsed: string[] // Collapsed renderable IDs in tree view

  // Color palettes - groups of reusable color swatches
  palettes: ColorPalette[]
  activePaletteIndex: number

  // Animation state
  animation: {
    fps: number
    frames: Renderable[] // Array of root trees, one per frame
    currentFrameIndex: number
    keyframing: KeyframingState
  }

  // Undo history (persisted, capped at 10,000 entries)
  history: HistoryEntry[]
  future: HistoryEntry[] // Redo stack
}

export interface ProjectMeta {
  name: string
  fileName: string
  createdAt: string
  updatedAt: string
}

export function createDefaultTree(): Renderable {
  return {
    id: 'root',
    type: 'box',
    name: 'Root',
    width: 'auto',
    height: 'auto',
    backgroundColor: '#1a1a2e',
    flexDirection: 'column',
    padding: 2,
    gap: 1,
    children: [],
  }
}

// Default palettes
const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: 'palette-1',
    name: 'Ocean',
    swatches: [
      { id: 'swatch-1-1', color: '#4a90a4' },
      { id: 'swatch-1-2', color: '#5ba0b4' },
      { id: 'swatch-1-3', color: '#6bb0c4' },
      { id: 'swatch-1-4', color: '#7bc0d4' },
      { id: 'swatch-1-5', color: '#8cd0e4' },
      { id: 'swatch-1-6', color: '#9de0f4' },
      { id: 'swatch-1-7', color: '#f6b7a8' },
      { id: 'swatch-1-8', color: '#ffcc00' },
    ],
  },
  {
    id: 'palette-2',
    name: 'Forest',
    swatches: [
      { id: 'swatch-2-1', color: '#2d5a27' },
      { id: 'swatch-2-2', color: '#3d6a37' },
      { id: 'swatch-2-3', color: '#4a7c43' },
      { id: 'swatch-2-4', color: '#5a8c53' },
      { id: 'swatch-2-5', color: '#6b9e64' },
      { id: 'swatch-2-6', color: '#8bc085' },
      { id: 'swatch-2-7', color: '#d4a373' },
      { id: 'swatch-2-8', color: '#faedcd' },
    ],
  },
  {
    id: 'palette-3',
    name: 'Sunset',
    swatches: [
      { id: 'swatch-3-1', color: '#ff6b6b' },
      { id: 'swatch-3-2', color: '#ff8b6b' },
      { id: 'swatch-3-3', color: '#ffa06b' },
      { id: 'swatch-3-4', color: '#ffd56b' },
      { id: 'swatch-3-5', color: '#c9b1ff' },
      { id: 'swatch-3-6', color: '#a06bff' },
      { id: 'swatch-3-7', color: '#8b7bff' },
      { id: 'swatch-3-8', color: '#6b8bff' },
    ],
  },
]

export function createNewProject(name: string): Project {
  const now = new Date().toISOString()
  const defaultTree = createDefaultTree()
  return {
    name,
    version: 1,
    createdAt: now,
    updatedAt: now,
    tree: defaultTree,
    selectedId: null,
    collapsed: [],
    palettes: DEFAULT_PALETTES,
    activePaletteIndex: 0,
    animation: {
      fps: 12,
      frames: [defaultTree],
      currentFrameIndex: 0,
      keyframing: createDefaultKeyframingState(),
    },
    history: [],
    future: [],
  }
}
