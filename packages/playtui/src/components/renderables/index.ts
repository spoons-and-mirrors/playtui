import { BoxRenderer, BOX_DEFAULTS } from './box'
import { TextRenderer, TEXT_DEFAULTS } from './text'
import { InputRenderer, INPUT_DEFAULTS } from './input'
import { TextareaRenderer, TEXTAREA_DEFAULTS } from './textarea'
import { SelectRenderer, SELECT_DEFAULTS } from './select'
import { ScrollboxRenderer, SCROLLBOX_DEFAULTS } from './scrollbox'
import { SliderRenderer, SLIDER_DEFAULTS } from './slider'
import { AsciiFontRenderer, ASCIIFONT_DEFAULTS } from './asciifont'
import { TabSelectRenderer, TABSELECT_DEFAULTS } from './tabselect'

import type {
  RenderableType,
  Renderable,
  BoxRenderable,
  ScrollboxRenderable,
  ColorPalette,
} from '../../lib/types'

// Renderer props shared by all renderable renderers
export interface RendererProps {
  node: Renderable
  onSelect: () => void
  onHover: (hovering: boolean) => void
  onDragStart?: (x: number, y: number) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd?: () => void
  children?: React.ReactNode
}

// Properties panel props shared by all renderable property panels
export interface RenderablePropertiesProps {
  node: Renderable
  onUpdate: (updates: Partial<Renderable>) => void
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  collapsed: boolean
  onToggle: () => void
  // Palette support (optional - not all renderables need it)
  palettes?: ColorPalette[]
  activePaletteIndex?: number
  onUpdateSwatch?: (id: string, color: string) => void
  onChangePalette?: (index: number) => void
  // Color picking support
  pickingForField?: string | null
  setPickingForField?: (f: string | null) => void
}

// Property schema - SINGLE SOURCE OF TRUTH for both UI and serialization
export type SerializablePropType =
  | 'string'
  | 'boolean'
  | 'number'
  | 'color'
  | 'options'
  | 'size'
  | 'select'
  | 'toggle'
  | 'borderSides'
  | 'object'
  | 'header'

export type PropertySection =
  | 'dimensions'
  | 'flexContainer'
  | 'flexItem'
  | 'padding'
  | 'margin'
  | 'position'
  | 'overflow'
  | 'visibility'
  | 'background'
  | 'border'
  | 'text'
  | 'input'
  | 'textarea'
  | 'select'
  | 'slider'
  | 'asciiFont'
  | 'tabSelect'
  | 'scrollbox'

export type PropertyLayout =
  | 'dimensions'
  | 'position'
  | 'spacing'
  | 'flex'
  | 'overflow'

export interface PropertySectionMeta {
  id: PropertySection
  label: string
  defaultExpanded: boolean
  ownerTypes?: RenderableType[]
  layout?: PropertyLayout
  keys?: Record<string, string>
  collapsible?: boolean
  hasTopSpacing?: boolean
}

export const PROPERTY_SECTIONS: PropertySectionMeta[] = [
  {
    id: 'dimensions',
    label: '◫ Dimensions',
    defaultExpanded: true,
    layout: 'dimensions',
    collapsible: false,
  },
  {
    id: 'position',
    label: '◎ Position',
    defaultExpanded: false,
    layout: 'position',
    collapsible: false,
  },
  {
    id: 'margin',
    label: '⊟ Margin',
    defaultExpanded: false,
    layout: 'spacing',
    keys: {
      top: 'marginTop',
      right: 'marginRight',
      bottom: 'marginBottom',
      left: 'marginLeft',
    },
    collapsible: false,
  },
  {
    id: 'padding',
    label: '⊞ Padding',
    defaultExpanded: false,
    layout: 'spacing',
    keys: {
      top: 'paddingTop',
      right: 'paddingRight',
      bottom: 'paddingBottom',
      left: 'paddingLeft',
    },
    collapsible: false,
  },
  {
    id: 'flexContainer',
    label: '⊞ Layout',
    defaultExpanded: true,
    layout: 'flex',
    hasTopSpacing: true,
  },
  {
    id: 'flexItem',
    label: '▧ Flex Item',
    defaultExpanded: false,
    hasTopSpacing: true,
  },
  {
    id: 'background',
    label: '▦ Fill',
    defaultExpanded: true,
    hasTopSpacing: true,
  },
  {
    id: 'border',
    label: '▢ Border',
    defaultExpanded: true,
    hasTopSpacing: true,
  },
  {
    id: 'overflow',
    label: '⋯ Overflow',
    defaultExpanded: false,
    layout: 'overflow',
  },
]


export interface SerializableProp {
  key: string
  type: SerializablePropType
  // UI fields (for property panel rendering)
  label?: string // Display label in property panel
  section?: PropertySection // Which section to group under
  options?: string[] // For select type
  min?: number // For number type
  max?: number // For number type
  group?: string // Properties with the same group ID in a section will render side-by-side
  customRenderer?: (props: RenderablePropertiesProps) => React.ReactNode
  // Conditional visibility for property panel
  visible?: (node: Renderable) => boolean
  // Serialization fields (for codegen/parseCode)
  default?: unknown // Skip serialization if value equals default
  escape?: boolean // Escape string for JSX (quotes, special chars)
  jsxBoolean?: boolean // Serialize as standalone prop when true, {false} when false
  jsxBooleanDefault?: boolean // The default value for jsxBoolean props (used to determine when to omit)
  styleProp?: string // If set, this prop belongs in the style object with this key (e.g. "width", "left")
  animatable?: boolean // Can this property be animated?
}

// =============================================================================
// SHARED PROPERTY DEFINITIONS - Reusable across renderable types
// =============================================================================

// Border properties - shared by box and scrollbox
const BORDER_PROPS: SerializableProp[] = [
  {
    key: 'border',
    label: 'Border',
    type: 'boolean',
    section: 'border',
    jsxBoolean: true,
  },
  {
    key: 'borderSides',
    label: 'Sides',
    type: 'borderSides',
    section: 'border',
    visible: (node) => (node as any).border === true,
  },
  {
    key: 'borderStyle',
    label: 'Style',
    type: 'select',
    options: ['single', 'rounded', 'double', 'heavy'],
    section: 'border',
    default: 'single',
    visible: (node) => (node as any).border === true,
  },
  {
    key: 'borderColor',
    label: 'Color',
    type: 'color',
    section: 'border',
    visible: (node) => (node as any).border === true,
  },
  {
    key: 'focusedBorderColor',
    label: 'Focus Clr',
    type: 'color',
    section: 'border',
    visible: (node) => (node as any).border === true,
  },
  {
    key: 'title',
    label: 'Title',
    type: 'string',
    section: 'border',
    escape: true,
    visible: (node) => (node as any).border === true,
  },
  {
    key: 'titleAlignment',
    label: 'Title Pos',
    type: 'select',
    options: ['left', 'center', 'right'],
    section: 'border',
    default: 'left',
    visible: (node) =>
      (node as any).border === true && Boolean((node as any).title),
  },
  {
    key: 'shouldFill',
    label: 'Fill BG',
    type: 'boolean',
    section: 'border',
    jsxBoolean: true,
    jsxBooleanDefault: true,
  },
  {
    key: 'customBorderChars',
    label: 'Custom Border',
    type: 'object',
    section: 'border',
    visible: (node) => (node as any).border === true,
  },
]

// Dimensions - common to most elements
const DIMENSION_PROPS: SerializableProp[] = [
  {
    key: 'width',
    label: 'Width',
    type: 'size',
    section: 'dimensions',
    styleProp: 'width',
    animatable: true,
  },
  {
    key: 'height',
    label: 'Height',
    type: 'size',
    section: 'dimensions',
    styleProp: 'height',
    animatable: true,
  },
]

// Extended dimensions - for containers and inputs
const EXTENDED_DIMENSION_PROPS: SerializableProp[] = [
  ...DIMENSION_PROPS,
  {
    key: 'minWidth',
    label: 'Min W',
    type: 'number',
    min: 0,
    max: 200,
    section: 'dimensions',
    styleProp: 'minWidth',
    animatable: true,
  },
  {
    key: 'maxWidth',
    label: 'Max W',
    type: 'number',
    min: 0,
    max: 200,
    section: 'dimensions',
    styleProp: 'maxWidth',
    animatable: true,
  },
  {
    key: 'minHeight',
    label: 'Min H',
    type: 'number',
    min: 0,
    max: 100,
    section: 'dimensions',
    styleProp: 'minHeight',
    animatable: true,
  },
  {
    key: 'maxHeight',
    label: 'Max H',
    type: 'number',
    min: 0,
    max: 100,
    section: 'dimensions',
    styleProp: 'maxHeight',
    animatable: true,
  },
  {
    key: 'aspectRatio',
    label: 'Ratio',
    type: 'number',
    min: 0,
    max: 10,
    section: 'dimensions',
    styleProp: 'aspectRatio',
    animatable: true,
  },
]

// Flex container props
const FLEX_CONTAINER_PROPS: SerializableProp[] = [
  {
    key: 'flexDirection',
    label: 'Direction',
    type: 'select',
    options: ['row', 'column', 'row-reverse', 'column-reverse'],
    section: 'flexContainer',
    styleProp: 'flexDirection',
  },
  {
    key: 'flexWrap',
    label: 'Wrap',
    type: 'select',
    options: ['nowrap', 'wrap', 'wrap-reverse'],
    section: 'flexContainer',
    styleProp: 'flexWrap',
  },
  {
    key: 'justifyContent',
    label: 'Justify',
    type: 'select',
    options: [
      'flex-start',
      'center',
      'flex-end',
      'space-between',
      'space-around',
      'space-evenly',
    ],
    section: 'flexContainer',
    styleProp: 'justifyContent',
  },
  {
    key: 'alignItems',
    label: 'Align',
    type: 'select',
    options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
    section: 'flexContainer',
    styleProp: 'alignItems',
  },
  {
    key: 'alignContent',
    label: 'Content',
    type: 'select',
    options: [
      'flex-start',
      'center',
      'flex-end',
      'stretch',
      'space-between',
      'space-around',
    ],
    section: 'flexContainer',
    styleProp: 'alignContent',
  },
  {
    key: 'gap',
    label: 'Gap',
    type: 'number',
    min: 0,
    max: 20,
    section: 'flexContainer',
    styleProp: 'gap',
    animatable: true,
  },
  {
    key: 'rowGap',
    label: 'Row Gap',
    type: 'number',
    min: 0,
    max: 20,
    section: 'flexContainer',
    styleProp: 'rowGap',
    animatable: true,
  },
  {
    key: 'columnGap',
    label: 'Col Gap',
    type: 'number',
    min: 0,
    max: 20,
    section: 'flexContainer',
    styleProp: 'columnGap',
    animatable: true,
  },
]

// Flex item props
const FLEX_ITEM_PROPS: SerializableProp[] = [
  {
    key: 'flexGrow',
    label: 'Grow',
    type: 'number',
    min: 0,
    max: 10,
    section: 'flexItem',
    styleProp: 'flexGrow',
    animatable: true,
  },
  {
    key: 'flexShrink',
    label: 'Shrink',
    type: 'number',
    min: 0,
    max: 10,
    section: 'flexItem',
    styleProp: 'flexShrink',
    animatable: true,
  },
  {
    key: 'flexBasis',
    label: 'Basis',
    type: 'size',
    section: 'flexItem',
    styleProp: 'flexBasis',
  },
  {
    key: 'alignSelf',
    label: 'Align Self',
    type: 'select',
    options: ['auto', 'flex-start', 'center', 'flex-end', 'stretch'],
    section: 'flexItem',
    styleProp: 'alignSelf',
  },
]

// Padding props
const PADDING_PROPS: SerializableProp[] = [
  {
    key: 'padding',
    label: 'All',
    type: 'number',
    min: 0,
    max: 20,
    section: 'padding',
    styleProp: 'padding',
  },
  {
    key: 'paddingTop',
    label: 'Top',
    type: 'number',
    min: 0,
    max: 20,
    section: 'padding',
    styleProp: 'paddingTop',
    animatable: true,
  },
  {
    key: 'paddingRight',
    label: 'Right',
    type: 'number',
    min: 0,
    max: 20,
    section: 'padding',
    styleProp: 'paddingRight',
    animatable: true,
  },
  {
    key: 'paddingBottom',
    label: 'Bottom',
    type: 'number',
    min: 0,
    max: 20,
    section: 'padding',
    styleProp: 'paddingBottom',
    animatable: true,
  },
  {
    key: 'paddingLeft',
    label: 'Left',
    type: 'number',
    min: 0,
    max: 20,
    section: 'padding',
    styleProp: 'paddingLeft',
    animatable: true,
  },
]

// Margin props
const MARGIN_PROPS: SerializableProp[] = [
  {
    key: 'margin',
    label: 'All',
    type: 'number',
    min: 0,
    max: 20,
    section: 'margin',
    styleProp: 'margin',
  },
  {
    key: 'marginTop',
    label: 'Top',
    type: 'number',
    min: 0,
    max: 20,
    section: 'margin',
    styleProp: 'marginTop',
    animatable: true,
  },
  {
    key: 'marginRight',
    label: 'Right',
    type: 'number',
    min: 0,
    max: 20,
    section: 'margin',
    styleProp: 'marginRight',
    animatable: true,
  },
  {
    key: 'marginBottom',
    label: 'Bottom',
    type: 'number',
    min: 0,
    max: 20,
    section: 'margin',
    styleProp: 'marginBottom',
    animatable: true,
  },
  {
    key: 'marginLeft',
    label: 'Left',
    type: 'number',
    min: 0,
    max: 20,
    section: 'margin',
    styleProp: 'marginLeft',
    animatable: true,
  },
]

// Position props - universal
const POSITION_PROPS: SerializableProp[] = [
  {
    key: 'position',
    label: 'Position',
    type: 'select',
    options: ['relative', 'absolute'],
    section: 'position',
    styleProp: 'position',
  },
  {
    key: 'x',
    label: 'X',
    type: 'number',
    min: -100,
    max: 200,
    section: 'position',
    styleProp: 'left',
    animatable: true,
  },
  {
    key: 'y',
    label: 'Y',
    type: 'number',
    min: -100,
    max: 200,
    section: 'position',
    styleProp: 'top',
    animatable: true,
  },
  {
    key: 'zIndex',
    label: 'Z',
    type: 'number',
    min: -100,
    max: 100,
    section: 'position',
    styleProp: 'zIndex',
    animatable: true,
  },
]

// Overflow prop
const OVERFLOW_PROPS: SerializableProp[] = [
  {
    key: 'overflow',
    label: 'Overflow',
    type: 'select',
    options: ['visible', 'hidden', 'scroll'],
    section: 'overflow',
    styleProp: 'overflow',
  },
]

// Background color prop
const BACKGROUND_PROPS: SerializableProp[] = [
  {
    key: 'backgroundColor',
    label: 'BG Color',
    type: 'color',
    section: 'background',
    styleProp: 'backgroundColor',
  },
  {
    key: 'focusedBackgroundColor',
    label: 'Foc BG',
    type: 'color',
    section: 'background',
  },
]

// Renderable capability metadata
export interface RenderableCapabilities {
  // Layout capabilities
  supportsChildren: boolean
  supportsBorder: boolean
  supportsPadding: boolean
  supportsMargin: boolean
  supportsPositioning: boolean
  supportsFlexContainer: boolean
  supportsFlexItem: boolean

  // Visual capabilities
  supportsBackgroundColor: boolean
  supportsTextStyling: boolean
}

// Registry entry type
export interface RenderableRegistryEntry {
  type: RenderableType
  label: string
  icon?: string
  addModeKey?: string // Single character key for adding this renderable in add mode (e.g., "b" for box)
  Renderer: (props: RendererProps) => React.ReactNode
  Properties: ((props: RenderablePropertiesProps) => React.ReactNode) | null
  defaults: Partial<Renderable>
  capabilities: RenderableCapabilities
  properties: SerializableProp[] // Renderable-specific props for codegen/parseCode
}

// Central registry - single source of truth for all renderable types
export const RENDERABLE_REGISTRY: Record<
  RenderableType,
  RenderableRegistryEntry
> = {
  box: {
    type: 'box',
    label: 'Box',
    icon: '▢',
    addModeKey: 'b',
    Renderer: BoxRenderer,
    Properties: null,
    defaults: BOX_DEFAULTS,
    capabilities: {
      supportsChildren: true,
      supportsBorder: true,
      supportsPadding: true,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: true,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...EXTENDED_DIMENSION_PROPS,
      ...FLEX_CONTAINER_PROPS,
      ...FLEX_ITEM_PROPS,
      ...PADDING_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      ...OVERFLOW_PROPS,
      ...BACKGROUND_PROPS,
      ...BORDER_PROPS,
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  text: {
    type: 'text',
    label: 'Text',
    icon: 'T',
    addModeKey: 't',
    Renderer: TextRenderer,
    Properties: null,
    defaults: TEXT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: true,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: false,
      supportsTextStyling: true,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...PADDING_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Text-specific props
      {
        key: 'content',
        label: 'Text',
        type: 'string',
        section: 'text',
        escape: true,
      },
      {
        key: 'fg',
        type: 'color',
        label: 'Color',
        section: 'text',
        styleProp: 'fg',
        group: 'colors',
      },
      {
        key: 'bg',
        type: 'color',
        label: 'BG',
        section: 'text',
        styleProp: 'bg',
        group: 'colors',
      },
      {
        key: 'styleHeader',
        type: 'header',
        label: 'Style',
        section: 'text',
      },
      {
        key: 'bold',
        label: 'B',
        type: 'boolean',
        section: 'text',
        jsxBoolean: true,
        group: 'style',
      },
      {
        key: 'italic',
        label: 'I',
        type: 'boolean',
        section: 'text',
        jsxBoolean: true,
        group: 'style',
      },
      {
        key: 'underline',
        label: 'U',
        type: 'boolean',
        section: 'text',
        jsxBoolean: true,
        group: 'style',
      },
      {
        key: 'dim',
        label: 'D',
        type: 'boolean',
        section: 'text',
        jsxBoolean: true,
        group: 'style',
      },
      {
        key: 'strikethrough',
        label: 'S',
        type: 'boolean',
        section: 'text',
        jsxBoolean: true,
        group: 'style',
      },
      {
        key: 'wrapMode',
        type: 'select',
        options: ['none', 'char', 'word'],
        label: 'Wrap',
        section: 'text',
        default: 'none',
      },
      {
        key: 'selectable',
        type: 'boolean',
        label: 'Selectable',
        section: 'text',
        jsxBoolean: true,
      },
      {
        key: 'visible',
        type: 'boolean',
        label: 'Visible',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  input: {
    type: 'input',
    label: 'Input',
    icon: '\u2328',
    addModeKey: 'i',
    Renderer: InputRenderer,
    Properties: null,
    defaults: INPUT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...EXTENDED_DIMENSION_PROPS.filter((p) => p.key !== 'aspectRatio'),
      ...FLEX_ITEM_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      ...BACKGROUND_PROPS,
      // Input-specific props
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'string',
        section: 'input',
        escape: true,
      },
      {
        key: 'maxLength',
        label: 'Max Len',
        type: 'number',
        section: 'input',
        min: 1,
        max: 1000,
      },
      { key: 'colorHeader', type: 'header', label: 'Colors', section: 'input' },
      {
        key: 'textColor',
        label: 'Text',
        type: 'color',
        section: 'input',
        group: 'text',
      },
      {
        key: 'focusedTextColor',
        label: 'Foc Txt',
        type: 'color',
        section: 'input',
        group: 'text',
      },
      {
        key: 'backgroundColor',
        label: 'BG',
        type: 'color',
        section: 'input',
        group: 'bg',
      },
      {
        key: 'focusedBackgroundColor',
        label: 'Foc BG',
        type: 'color',
        section: 'input',
        group: 'bg',
      },
      {
        key: 'placeholderColor',
        label: 'Plchld Clr',
        type: 'color',
        section: 'input',
      },
      {
        key: 'cursorHeader',
        type: 'header',
        label: 'Cursor',
        section: 'input',
      },
      {
        key: 'cursorStyle',
        label: 'Style',
        type: 'select',
        options: ['block', 'line', 'underline'],
        section: 'input',
        default: 'block',
        group: 'cursor',
      },
      {
        key: 'cursorColor',
        label: 'Color',
        type: 'color',
        section: 'input',
        group: 'cursor',
      },
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  textarea: {
    type: 'textarea',
    label: 'Textarea',
    icon: '≡',
    addModeKey: 'x',
    Renderer: TextareaRenderer,
    Properties: null,
    defaults: TEXTAREA_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Textarea-specific props
      {
        key: 'initialValue',
        label: 'Initial',
        type: 'string',
        section: 'textarea',
        escape: true,
      },
      {
        key: 'cursorHeader',
        type: 'header',
        label: 'Cursor',
        section: 'textarea',
      },
      {
        key: 'showCursor',
        label: 'Show',
        type: 'boolean',
        section: 'textarea',
        jsxBoolean: true,
        jsxBooleanDefault: true,
        group: 'cursor',
      },
      {
        key: 'blinking',
        label: 'Blink',
        type: 'boolean',
        section: 'textarea',
        jsxBoolean: true,
        jsxBooleanDefault: true,
        group: 'cursor',
      },
      {
        key: 'scrollMargin',
        label: 'Scroll Margin',
        type: 'number',
        section: 'textarea',
        min: 0,
        max: 10,
      },
      {
        key: 'tabIndicatorColor',
        label: 'Tab Clr',
        type: 'color',
        section: 'textarea',
      },
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  select: {
    type: 'select',
    label: 'Select',
    icon: '▼',
    addModeKey: 'e',
    Renderer: SelectRenderer,
    Properties: null,
    defaults: SELECT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Select-specific props
      { key: 'options', type: 'options', section: 'select' },
      {
        key: 'behaviorHeader',
        type: 'header',
        label: 'Behavior',
        section: 'select',
      },
      {
        key: 'showScrollIndicator',
        label: 'Scroll',
        type: 'boolean',
        section: 'select',
        jsxBoolean: true,
        group: 'behavior',
      },
      {
        key: 'wrapSelection',
        label: 'Wrap',
        type: 'boolean',
        section: 'select',
        jsxBoolean: true,
        group: 'behavior',
      },
      {
        key: 'showDescription',
        label: 'Show Desc',
        type: 'boolean',
        section: 'select',
        jsxBoolean: true,
      },
      {
        key: 'spacingHeader',
        type: 'header',
        label: 'Spacing',
        section: 'select',
      },
      {
        key: 'itemSpacing',
        label: 'Spacing',
        type: 'number',
        section: 'select',
        group: 'spacing',
      },
      {
        key: 'fastScrollStep',
        label: 'Fast Step',
        type: 'number',
        section: 'select',
        default: 5,
        group: 'spacing',
      },
      {
        key: 'colorHeader',
        type: 'header',
        label: 'Colors',
        section: 'select',
      },
      {
        key: 'backgroundColor',
        label: 'BG',
        type: 'color',
        section: 'select',
        group: 'bg',
      },
      {
        key: 'selectedBackgroundColor',
        label: 'Sel BG',
        type: 'color',
        section: 'select',
        group: 'bg',
      },
      {
        key: 'textColor',
        label: 'Text',
        type: 'color',
        section: 'select',
        group: 'text',
      },
      {
        key: 'selectedTextColor',
        label: 'Sel Text',
        type: 'color',
        section: 'select',
        group: 'text',
      },
      {
        key: 'descriptionColor',
        label: 'Desc',
        type: 'color',
        section: 'select',
        group: 'desc',
        visible: (node) => (node as any).showDescription === true,
      },
      {
        key: 'selectedDescriptionColor',
        label: 'Sel Desc',
        type: 'color',
        section: 'select',
        group: 'desc',
        visible: (node) => (node as any).showDescription === true,
      },
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  scrollbox: {
    type: 'scrollbox',
    label: 'Scrollbox',
    icon: '⇟',
    addModeKey: 's',
    Renderer: ScrollboxRenderer,
    Properties: null,
    defaults: SCROLLBOX_DEFAULTS,
    capabilities: {
      supportsChildren: true,
      supportsBorder: true,
      supportsPadding: true,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: true,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...EXTENDED_DIMENSION_PROPS,
      ...FLEX_CONTAINER_PROPS,
      ...FLEX_ITEM_PROPS,
      ...PADDING_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      ...OVERFLOW_PROPS,
      ...BACKGROUND_PROPS,
      ...BORDER_PROPS,
      // Scrollbox-specific props
      {
        key: 'behaviorHeader',
        type: 'header',
        label: 'Behavior',
        section: 'scrollbox',
      },
      {
        key: 'scrollX',
        label: 'X',
        type: 'boolean',
        section: 'scrollbox',
        jsxBoolean: true,
        group: 'behavior',
      },
      {
        key: 'scrollY',
        label: 'Y',
        type: 'boolean',
        section: 'scrollbox',
        jsxBoolean: true,
        jsxBooleanDefault: true,
        group: 'behavior',
      },
      {
        key: 'viewportCulling',
        label: 'Cull',
        type: 'boolean',
        section: 'scrollbox',
        jsxBoolean: true,
        group: 'behavior',
      },
      {
        key: 'stickyHeader',
        type: 'header',
        label: 'Sticky',
        section: 'scrollbox',
      },
      {
        key: 'stickyScroll',
        label: 'Sticky',
        type: 'boolean',
        section: 'scrollbox',
        jsxBoolean: true,
        group: 'sticky',
      },
      {
        key: 'stickyStart',
        label: 'To',
        type: 'select',
        options: ['bottom', 'top', 'left', 'right'],
        section: 'scrollbox',
        default: 'bottom',
        group: 'sticky',
        visible: (node) => (node as any).stickyScroll === true,
      },
      {
        key: 'scrollbarHeader',
        type: 'header',
        label: 'Scrollbar',
        section: 'scrollbox',
      },
      {
        key: 'showScrollArrows',
        label: 'Arrows',
        type: 'boolean',
        section: 'scrollbox',
        jsxBoolean: true,
      },
      {
        key: 'scrollbarForeground',
        label: 'FG',
        type: 'color',
        section: 'scrollbox',
        group: 'colors',
      },
      {
        key: 'scrollbarBackground',
        label: 'BG',
        type: 'color',
        section: 'scrollbox',
        group: 'colors',
      },
    ],
  },
  slider: {
    type: 'slider',
    label: 'Slider',
    icon: '▪',
    addModeKey: 'l',
    Renderer: SliderRenderer,
    Properties: null,
    defaults: SLIDER_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // Slider-specific props
      {
        key: 'orientation',
        label: 'Orient',
        type: 'select',
        options: ['horizontal', 'vertical'],
        section: 'slider',
      },
      { key: 'rangeHeader', type: 'header', label: 'Range', section: 'slider' },
      {
        key: 'min',
        label: 'Min',
        type: 'number',
        section: 'slider',
        group: 'range',
      },
      {
        key: 'max',
        label: 'Max',
        type: 'number',
        section: 'slider',
        group: 'range',
      },
      { key: 'value', type: 'number', section: 'slider' },
      {
        key: 'viewPortSize',
        label: 'Viewport',
        type: 'number',
        section: 'slider',
      },
      {
        key: 'colorHeader',
        type: 'header',
        label: 'Colors',
        section: 'slider',
      },
      {
        key: 'backgroundColor',
        label: 'BG',
        type: 'color',
        section: 'slider',
        group: 'colors',
      },
      {
        key: 'foregroundColor',
        label: 'Thumb',
        type: 'color',
        section: 'slider',
        group: 'colors',
      },
      {
        key: 'visible',
        type: 'boolean',
        label: 'Visible',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  'ascii-font': {
    type: 'ascii-font',
    label: 'ASCII Font',
    icon: 'Ⓐ',
    addModeKey: 'f',
    Renderer: AsciiFontRenderer,
    Properties: null,
    defaults: ASCIIFONT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: false,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // AsciiFont-specific props
      {
        key: 'text',
        label: 'Text',
        type: 'string',
        section: 'asciiFont',
        escape: true,
      },
      {
        key: 'font',
        label: 'Font',
        type: 'select',
        options: ['tiny', 'block', 'slick', 'shade'],
        section: 'asciiFont',
        default: 'block',
      },
      {
        key: 'color',
        label: 'Color',
        type: 'color',
        section: 'asciiFont',
      },
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
  'tab-select': {
    type: 'tab-select',
    label: 'Tab Select',
    icon: '⊟',
    addModeKey: 'w',
    Renderer: TabSelectRenderer,
    Properties: null,
    defaults: TABSELECT_DEFAULTS,
    capabilities: {
      supportsChildren: false,
      supportsBorder: false,
      supportsPadding: false,
      supportsMargin: true,
      supportsPositioning: true,
      supportsFlexContainer: false,
      supportsFlexItem: true,
      supportsBackgroundColor: true,
      supportsTextStyling: false,
    },
    properties: [
      ...DIMENSION_PROPS,
      ...MARGIN_PROPS,
      ...POSITION_PROPS,
      // TabSelect-specific props
      { key: 'options', type: 'options', section: 'tabSelect' },
      { key: 'tabWidth', label: 'Width', type: 'number', section: 'tabSelect' },
      {
        key: 'behaviorHeader',
        type: 'header',
        label: 'Behavior',
        section: 'tabSelect',
      },
      {
        key: 'showUnderline',
        label: 'Underline',
        type: 'boolean',
        section: 'tabSelect',
        jsxBoolean: true,
        jsxBooleanDefault: true,
        group: 'behavior',
      },
      {
        key: 'wrapSelection',
        label: 'Wrap',
        type: 'boolean',
        section: 'tabSelect',
        jsxBoolean: true,
        group: 'behavior',
      },
      {
        key: 'colorHeader',
        type: 'header',
        label: 'Colors',
        section: 'tabSelect',
      },
      {
        key: 'backgroundColor',
        label: 'BG',
        type: 'color',
        section: 'tabSelect',
        group: 'bg',
      },
      {
        key: 'selectedBackgroundColor',
        label: 'Sel BG',
        type: 'color',
        section: 'tabSelect',
        group: 'bg',
      },
      {
        key: 'textColor',
        label: 'Text',
        type: 'color',
        section: 'tabSelect',
        group: 'text',
      },
      {
        key: 'selectedTextColor',
        label: 'Sel Text',
        type: 'color',
        section: 'tabSelect',
        group: 'text',
      },
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        section: 'visibility',
        jsxBoolean: true,
        jsxBooleanDefault: true,
      },
    ],
  },
}

// All renderable types
export const RENDERABLE_TYPES = Object.keys(
  RENDERABLE_REGISTRY,
) as RenderableType[]

// =============================================================================
// TYPE GUARDS - Derived from registry (single source of truth)
// =============================================================================

/**
 * Check if a renderable supports children. Derived from RENDERABLE_REGISTRY.capabilities.
 * This replaces the hardcoded check that was previously in types.ts.
 */
export function isContainerRenderable(
  renderable: Renderable,
): renderable is BoxRenderable | ScrollboxRenderable {
  return (
    RENDERABLE_REGISTRY[renderable.type]?.capabilities.supportsChildren === true
  )
}

/**
 * Get all renderable types that have add-mode keybindings.
 * Returns array of [renderableType, key] tuples.
 * Derived from RENDERABLE_REGISTRY.addModeKey (single source of truth).
 */
export function getAddModeBindings(): Array<[RenderableType, string]> {
  return Object.entries(RENDERABLE_REGISTRY)
    .filter(([, entry]) => entry.addModeKey)
    .map(([, entry]) => [entry.type, entry.addModeKey!])
}

/**
 * Check if a property can be animated for a given renderable type.
 * Derived from RENDERABLE_REGISTRY property definitions (single source of truth).
 * Use this to validate keyframe operations and prevent animating non-animatable properties.
 */
export function isAnimatableProperty(
  type: RenderableType,
  propertyKey: string,
): boolean {
  const entry = RENDERABLE_REGISTRY[type]
  if (!entry) return false
  return entry.properties.some(
    (p) => p.key === propertyKey && p.animatable === true,
  )
}
