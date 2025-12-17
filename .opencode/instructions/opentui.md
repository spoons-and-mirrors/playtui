# OpenTUI Complete Reference

Terminal UI framework by SST. React/SolidJS/Vue reconcilers over Zig rendering engine. Powers opencode and terminal.shop.

## Architecture

```
@opentui/core    # Zig rendering engine, all primitives, imperative API
@opentui/react   # React 18 reconciler (recommended for new projects)
@opentui/solid   # SolidJS reconciler (used by opencode)
@opentui/vue     # Vue 3 reconciler
```

**Rendering**: 60 FPS target, diff-based updates, Yoga CSS Flexbox layout engine, rope data structure for text.

## Setup

```bash
bun install @opentui/react @opentui/core react
```

**tsconfig.json** (critical for JSX types):

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react"
  }
}
```

**Entry point**:

```tsx
import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard, useTerminalDimensions } from '@opentui/react'

function App() {
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.name === 'escape' || key.name === 'q') process.exit(0)
  })

  return (
    <box style={{ width, height, backgroundColor: '#1a1a2e' }}>
      {/* app content */}
    </box>
  )
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
```

---

## Layout System (Yoga Flexbox)

All renderables support these style properties:

```tsx
<box style={{
  // FLEX CONTAINER
  flexDirection: "row" | "column" | "row-reverse" | "column-reverse",
  flexWrap: "wrap" | "nowrap" | "wrap-reverse",
  justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly",
  alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline",
  alignContent: "flex-start" | "center" | "flex-end" | "stretch" | "space-between" | "space-around",
  gap: 2,                         // shorthand for row+column gap
  rowGap: 1,
  columnGap: 2,

  // FLEX ITEM
  flexGrow: 1,                    // NOT `flex` - shorthand unsupported
  flexShrink: 0,
  flexBasis: "auto" | 100 | "50%",
  alignSelf: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline",

  // SIZING
  width: 40,                      // number | "auto" | "50%"
  height: 10,
  minWidth: 20, maxWidth: 100,
  minHeight: 5, maxHeight: 50,
  aspectRatio: 16/9,

  // SPACING
  padding: 1,
  paddingTop: 2, paddingRight: 1, paddingBottom: 2, paddingLeft: 1,
  paddingHorizontal: 2, paddingVertical: 1,   // shorthand
  margin: 1,
  marginTop: 2, marginRight: 1, marginBottom: 2, marginLeft: 1,
  marginHorizontal: 2, marginVertical: 1,     // shorthand

  // POSITIONING
  position: "relative" | "absolute",
  top: 0, right: 0, bottom: 0, left: 0,
  zIndex: 10,

  // OVERFLOW
  overflow: "visible" | "hidden" | "scroll",
}}>
```

**Responsive pattern**:

```tsx
const { width, height } = useTerminalDimensions()
const panelWidth = Math.min(width - 4, 80)
const showSidebar = width > 120
```

---

## Components

### box

Container with borders, backgrounds, titles. The fundamental building block.

```tsx
<box
  id="panel-main"
  border // enables border (all sides)
  border={['top', 'bottom']} // partial borders: top|right|bottom|left
  borderStyle="rounded" // single | double | rounded | heavy | none
  borderColor="#444"
  focusedBorderColor="#7aa2f7" // border color when focused
  backgroundColor="#1a1a2e"
  title="Panel Title"
  titleAlignment="center" // left | center | right
  visible={true} // false hides but keeps layout space
  flexDirection="column"
  padding={2}
  gap={1}
>
  {children}
</box>
```

**Absolute overlay pattern**:

```tsx
<box
  position="absolute"
  width={dimensions.width}
  height={dimensions.height}
  left={0}
  top={0}
  backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
  alignItems="center"
  justifyContent="center"
>
  <box border title="Dialog" style={{ width: 60, padding: 2 }}>
    {/* dialog content */}
  </box>
</box>
```

**Custom border characters**:

```tsx
// All customizable: horizontal, vertical, topLeft, topRight, bottomLeft, bottomRight, cross, left, right, top, bottom
const EmptyBorder = {
  horizontal: " ", vertical: " ", topLeft: " ", topRight: " ",
  bottomLeft: " ", bottomRight: " ", cross: " ",
  left: " ", right: " ", top: " ", bottom: " ",
}

<box
  border={["left"]}
  customBorderChars={{ ...EmptyBorder, vertical: "╹" }}
  borderColor={theme.accent}
  paddingLeft={2}
>
```

### text

Styled text with inline formatting and wrapping.

```tsx
// Simple
<text fg="#00FF00" bg="#000">Green on black</text>

// Word wrapping
<text wrapMode="word" fg={theme.text}>Long text that wraps...</text>
// wrapMode: "none" | "char" | "word"

// Rich inline formatting
<text>
  <strong>bold</strong> <em>italic</em> <u>underline</u>
  <span fg="red" bold italic underline dim>styled span</span>
  <br />
</text>

// Template literals (core import)
import { t, bold, italic, underline, dim, strikethrough, fg, bg, red, green, blue, yellow, cyan, magenta } from "@opentui/core"
<text content={t`${bold("Status:")} ${fg("#FF0000")(underline("Error"))}`} />
<text content={t`${red("Error:")} ${dim("Connection failed")}`} />

// TextAttributes enum (bitwise OR for combining)
import { TextAttributes } from "@opentui/core"
<text attributes={TextAttributes.BOLD | TextAttributes.UNDERLINE | TextAttributes.DIM}>Combined</text>
// Available: BOLD, DIM, ITALIC, UNDERLINE, BLINK, REVERSE, STRIKETHROUGH
```

### input

Single-line text input. Requires `focused={true}` to receive keystrokes.

```tsx
const [value, setValue] = useState("")

<input
  value={value}
  placeholder="Type here..."
  focused={isFocused}
  width={40}
  backgroundColor="#1a1a2e"
  focusedBackgroundColor="#2a2a4e"
  textColor="#fff"
  onInput={setValue}              // fires on each keystroke (new value)
  onChange={(newVal, oldVal) => {}}  // fires with both values
  onSubmit={handleSubmit}         // fires on Enter
/>
```

### textarea

Multi-line editor with rich API via ref. Supports cursor management, selection, undo/redo.

```tsx
import type { TextareaRenderable } from "@opentui/core"

const textareaRef = useRef<TextareaRenderable>(null)

// Ref API
textareaRef.current?.setText("new content", { history: false })
textareaRef.current?.clear()
textareaRef.current?.plainText           // get content as string
textareaRef.current?.focus()
textareaRef.current?.blur()
textareaRef.current?.undo()
textareaRef.current?.redo()

// Cursor management
textareaRef.current?.editBuffer.setCursor(row, col)
textareaRef.current?.editBuffer.setCursorByOffset(byteOffset)
textareaRef.current?.editBuffer.gotoLineHome()
textareaRef.current?.editBuffer.gotoLineEnd()
textareaRef.current?.editBuffer.gotoBufferHome()
textareaRef.current?.editBuffer.gotoBufferEnd()

// Extmarks (virtual text overlays - for inline chips like [Image 1])
const markId = textareaRef.current?.extmarks.create({
  start: 0,
  end: 10,
  styleId: myStyleId,
  typeId: myTypeId,
  virtual: true,                  // cursor jumps over when true
})

<textarea
  ref={textareaRef}
  placeholder="Multi-line input..."
  minHeight={1}
  maxHeight={6}                    // auto-expand up to 6 lines
  focused
  textColor={theme.text}
  focusedTextColor={theme.text}
  backgroundColor={theme.background}
  focusedBackgroundColor={theme.backgroundElement}
  cursorColor="#7aa2f7"
  cursorStyle="block"              // block | line | underline
  blinking={true}
  tabIndicatorColor="#444"
  onSubmit={(text) => {}}
  onContentChange={(text) => {}}   // fires on any text change
  onCursorChange={(row, col) => {}}
  onKeyDown={(key) => {}}
  onKeyPress={(key) => {}}
/>

// Custom keybindings (override defaults)
import type { KeyBinding } from "@opentui/core"
const customBindings: KeyBinding[] = [
  { name: "s", ctrl: true, action: "submit" },
  { name: "k", ctrl: true, action: "delete-line" },
]
textareaRef.current.keyBindings = customBindings
```

**All textarea actions** (for custom keybindings):

```
Cursor:     move-left, move-right, move-up, move-down
            line-home, line-end, buffer-home, buffer-end
            word-forward, word-backward
Selection:  select-left, select-right, select-up, select-down
            select-line-home, select-line-end
            select-word-forward, select-word-backward
Deletion:   backspace, delete, delete-line
            delete-to-line-end, delete-to-line-start
            delete-word-forward, delete-word-backward
Other:      newline, undo, redo, submit
```

### scrollbox

Scrollable container with programmatic control.

```tsx
import type { ScrollBoxRenderable } from "@opentui/core"

const scrollRef = useRef<ScrollBoxRenderable>(null)

// Programmatic scrolling
scrollRef.current?.scrollTo(0)                              // scroll to top
scrollRef.current?.scrollTo(scrollRef.current.scrollHeight) // to bottom
scrollRef.current?.scrollBy(-scrollRef.current.height / 2)  // half page up

<scrollbox
  ref={scrollRef}
  focused
  stickyScroll={true}              // auto-scroll to bottom on content add
  stickyStart="bottom"             // bottom | top | left | right
  scrollX={true}
  scrollY={true}
  viewportCulling={true}           // performance: only render visible items
  scrollbarOptions={{
    showArrows: true,
    trackOptions: { foregroundColor: "#7aa2f7", backgroundColor: "#414868" },
  }}
  style={{
    rootOptions: { backgroundColor: "#24283b" },
    wrapperOptions: { backgroundColor: "#1f2335" },
    viewportOptions: { backgroundColor: "#1a1b26" },
    contentOptions: { backgroundColor: "#16161e", flexDirection: "column", gap: 1 },
  }}
>
  {items.map((item, i) => <box key={i}>{item}</box>)}
</scrollbox>
```

### select

Vertical list selection. Navigation: up/k, down/j, enter to select.

```tsx
;<select
  options={[
    { name: 'Option 1', description: 'Description text', value: 'opt1' },
    { name: 'Option 2', value: 'opt2', disabled: true },
    { name: 'Option 3', value: 'opt3', category: 'Group A' },
  ]}
  focused
  current={selectedValue} // marks option as active (check icon)
  selectedIndex={0} // currently highlighted index
  backgroundColor="#1a1a2e"
  textColor="#fff"
  selectedBackgroundColor="#3b4261" // highlighted item bg
  selectedTextColor="#7aa2f7" // highlighted item text
  descriptionColor="#888"
  selectedDescriptionColor="#aaa"
  showScrollIndicator={true}
  showDescription={true}
  wrapSelection={true} // wrap around at list ends
  itemSpacing={0} // gap between items
  fastScrollStep={5} // items to skip with fast scroll
  onChange={(index, option) => console.log(option.value)}
  onSelect={(index, option) => {}} // fires on enter
/>

// For fuzzy filtering:
import fuzzysort from 'fuzzysort'
const filtered = fuzzysort.go(query, options, { keys: ['name', 'category'] })
```

### tab-select

Horizontal tabs. Navigation: left/[, right/].

```tsx
<tab-select
  options={[{ name: 'Tab 1', description: 'First tab' }, { name: 'Tab 2' }]}
  tabWidth={20}
  focused
  backgroundColor="#1a1a2e"
  textColor="#888"
  selectedBackgroundColor="transparent"
  selectedTextColor="#7aa2f7"
  onChange={(index) => setActiveTab(index)}
  onSelect={(index) => {}}
/>
```

### code

Syntax-highlighted code with Tree-sitter.

```tsx
import { SyntaxStyle, RGBA } from "@opentui/core"

const syntaxStyle = SyntaxStyle.fromStyles({
  // Core tokens
  default:   { fg: RGBA.fromHex("#ffffff") },
  keyword:   { fg: RGBA.fromHex("#ff6b6b"), bold: true },
  string:    { fg: RGBA.fromHex("#51cf66") },
  comment:   { fg: RGBA.fromHex("#868e96"), italic: true, dim: true },
  number:    { fg: RGBA.fromHex("#ffd43b") },
  function:  { fg: RGBA.fromHex("#61afef") },
  variable:  { fg: RGBA.fromHex("#e5c07b") },
  type:      { fg: RGBA.fromHex("#c678dd") },
  operator:  { fg: RGBA.fromHex("#56b6c2") },
  property:  { fg: RGBA.fromHex("#98c379") },
  "punctuation.bracket": { fg: RGBA.fromHex("#abb2bf") },
  embedded:  { fg: RGBA.fromHex("#e06c75") },
  // Markup tokens (markdown)
  "markup.heading": { fg: RGBA.fromHex("#e06c75"), bold: true },
  "markup.strong":  { bold: true },
  "markup.italic":  { italic: true },
  "markup.raw":     { fg: RGBA.fromHex("#98c379") },
  "markup.quote":   { fg: RGBA.fromHex("#868e96"), italic: true },
  "markup.list":    { fg: RGBA.fromHex("#61afef") },
  "markup.link":    { fg: RGBA.fromHex("#61afef"), underline: true },
})

<code
  content={sourceCode}
  filetype="typescript"            // language for highlighting
  syntaxStyle={syntaxStyle}
  drawUnstyledText={false}
  streaming={true}                 // for incremental/streaming content
  wrapMode="word"                  // word | char | none
  conceal={true}                   // hide markup chars (for markdown preview)
/>
```

### line-number

Wrapper adding line numbers with indicators.

```tsx
import type { LineNumberRenderable } from "@opentui/core"

const lineNumberRef = useRef<LineNumberRenderable>(null)

// Add indicators via ref
lineNumberRef.current?.setLineColor(1, "#1a4d1a")  // highlight line 1 bg
lineNumberRef.current?.setLineSign(1, { after: " +", afterColor: "#22c55e" })
lineNumberRef.current?.setLineSign(4, { before: "!", beforeColor: "#f59e0b" })

<line-number
  ref={lineNumberRef}
  fg="#6b7280"
  bg="#161b22"
  minWidth={3}
  paddingRight={1}
  showLineNumbers={true}
>
  <code content={sourceCode} filetype="typescript" syntaxStyle={syntaxStyle} />
</line-number>
```

### diff

Unified or split diff viewer.

```tsx
<diff
  diff={patchString}               // unified diff patch
  view="unified"                   // unified | split
  filetype="typescript"
  wrapMode="word"
  showLineNumbers={true}
  addedBg="#1a4d1a"
  removedBg="#4d1a1a"
  addedSignColor="#22c55e"
  removedSignColor="#ef4444"
/>

// Or with before/after content (generates diff internally)
<diff
  oldContent={originalCode}
  newContent={modifiedCode}
  view="split"
/>
```

### slider

Value control with mouse/keyboard.

```tsx
<slider
  orientation="horizontal" // horizontal | vertical
  value={50}
  min={0}
  max={100}
  viewPortSize={20} // visible portion size
  onChange={(value) => setValue(value)}
  backgroundColor="#252527"
  foregroundColor="#9a9ea3"
  style={{ width: 40, height: 1 }}
/>
```

### ascii-font

Large ASCII art text.

```tsx
<ascii-font
  content="HELLO"
  font="block" // tiny | block | slick | shade
  color={RGBA.fromHex('#FFD700')}
  selectable={false}
/>
```

### framebuffer

Low-level canvas for custom drawing. Use when you need pixel-level control.

```tsx
import type { FrameBufferRenderable } from "@opentui/core"

const fbRef = useRef<FrameBufferRenderable>(null)

<framebuffer
  ref={fbRef}
  width={80}
  height={24}
  renderAfter={(buffer, deltaTime) => {
    // Direct drawing API
    buffer.fillRect(0, 0, 10, 5, RGBA.fromHex("#ff0000"))
    buffer.drawRect(0, 0, 10, 5, RGBA.fromHex("#ffffff"))
    buffer.drawText("Hello", 2, 2, RGBA.fromHex("#ffffff"))
  }}
/>
```

---

## Hooks

### useKeyboard

```tsx
useKeyboard((key) => {
  // Properties
  key.name // "escape", "return", "tab", "a", "1", "f1", "up", "down", etc.
  key.sequence // raw escape sequence string
  key.ctrl // boolean
  key.shift // boolean
  key.meta // boolean (Cmd on macOS)
  key.option // boolean (Alt)
  key.repeated // boolean - true if key held down
  key.eventType // "press" | "release"

  // Methods
  key.preventDefault() // stop event propagation

  // Common patterns
  if (key.name === 'escape') process.exit(0)
  if (key.ctrl && key.name === 'c') process.exit(0)
  if (key.name === 'tab') cycleFocus()
  if (key.name === 'return' && !key.shift) submit()
  if (key.name === 'r' && !key.repeated) refresh() // ignore held
})

// Include release events
useKeyboard(handler, { release: true })
```

### useTerminalDimensions

```tsx
const { width, height } = useTerminalDimensions()
// Updates automatically on resize
```

### useOnResize

```tsx
useOnResize((width, height) => {
  console.log(`Resized to ${width}x${height}`)
})
```

### useRenderer

```tsx
const renderer = useRenderer()
renderer.console.show() // show debug overlay
renderer.console.hide()
renderer.console.toggle()
renderer.toggleDebugOverlay()
renderer.currentFocusedRenderable // get focused element
```

### useTimeline

Animation engine integration.

```tsx
const timeline = useTimeline({ duration: 2000, loop: false })

useEffect(() => {
  timeline.add(
    { width: 0 },
    {
      width: 50,
      duration: 2000,
      ease: 'linear', // linear | easeIn | easeOut | easeInOut
      onUpdate: (anim) => setWidth(anim.targets[0].width),
      onComplete: () => console.log('done'),
    },
  )
}, [])
```

---

## Colors

```tsx
// Hex strings (most common)
fg="#FF0000"
backgroundColor="#1a1a2e"
borderColor="transparent"

// RGBA class (for alpha/programmatic colors)
import { RGBA } from "@opentui/core"
RGBA.fromHex("#FF0000")
RGBA.fromInts(255, 0, 0, 255)        // 0-255 per channel
RGBA.fromValues(1.0, 0.0, 0.0, 1.0)  // 0.0-1.0 normalized

// Semi-transparent overlay
backgroundColor={RGBA.fromInts(0, 0, 0, 150)}

// Named color helpers (for template literals)
import { red, green, blue, yellow, cyan, magenta, white, black, gray } from "@opentui/core"
```

---

## Theme System

```tsx
interface ThemeColors {
  // Primary
  primary, secondary, accent

  // Status
  error, warning, success, info

  // Text
  text, textMuted, selectedListItemText

  // Backgrounds
  background, backgroundPanel, backgroundElement, backgroundMenu

  // Borders
  border, borderActive, borderSubtle

  // Diff
  diffAdded, diffRemoved, diffContext, diffHunkHeader,
  diffHighlightAdded, diffHighlightRemoved,
  diffAddedBg, diffRemovedBg, diffContextBg,
  diffLineNumber, diffAddedLineNumberBg, diffRemovedLineNumberBg

  // Markdown
  markdownText, markdownHeading, markdownLink, markdownLinkText,
  markdownCode, markdownBlockQuote, markdownEmph, markdownStrong,
  markdownHorizontalRule, markdownListItem, markdownListEnumeration,
  markdownImage, markdownImageText, markdownCodeBlock

  // Syntax
  syntaxComment, syntaxKeyword, syntaxFunction, syntaxVariable,
  syntaxString, syntaxNumber, syntaxType, syntaxOperator, syntaxPunctuation
}

// Usage
const { theme, syntax, subtleSyntax, mode, setMode, set, ready } = useTheme()

<text fg={theme.text}>Normal</text>
<text fg={theme.error}>Error</text>
<box borderColor={theme.borderActive}>Focused</box>
<code syntaxStyle={syntax()} filetype="typescript" content={code} />
```

---

## Focus Management

Focus is **manual**. Only one element should have `focused={true}` at a time.

```tsx
const [focused, setFocused] = useState<"input1" | "input2">("input1")

useKeyboard((key) => {
  if (key.name === "tab") {
    const fields = ["input1", "input2", "input3"]
    const idx = fields.indexOf(focused)
    const next = key.shift
      ? (idx - 1 + fields.length) % fields.length
      : (idx + 1) % fields.length
    setFocused(fields[next])
  }
})

<input focused={focused === "input1"} />
<input focused={focused === "input2"} />
```

---

## Mouse Events

All renderables support mouse handlers. Events bubble up.

```tsx
import { MouseButton } from "@opentui/core"

<box
  onMouseDown={(e) => {
    if (e.button === MouseButton.LEFT) { /* left click */ }
    if (e.button === MouseButton.RIGHT) { /* right click */ }
    e.x; e.y  // coordinates
  }}
  onMouseUp={(e) => {}}
  onMouseMove={(e) => {}}
  onMouseDrag={(e) => {}}
  onMouseDragEnd={(e) => {}}
  onMouseDrop={(e) => {}}
  onMouseOver={(e) => {}}           // entered element
  onMouseOut={(e) => {}}            // left element
  onMouseScroll={(e) => {
    if (e.button === MouseButton.WHEEL_UP) {}
    if (e.button === MouseButton.WHEEL_DOWN) {}
  }}
  onMouse={(e) => {}}               // catch-all
  onPaste={(e) => console.log(e.text)}
  onKeyDown={(key) => {}}           // keyboard when focused
  onSizeChange={() => {}}
>
```

---

## Render Hooks

Custom drawing before/after children.

```tsx
<box
  renderBefore={(buffer, deltaTime) => {
    buffer.drawText('prefix', x, y, color)
  }}
  renderAfter={(buffer, deltaTime) => {
    buffer.drawText('suffix', x, y, color)
    buffer.fillRect(x, y, width, height, color)
    buffer.drawRect(x, y, width, height, color)
  }}
/>
```

---

## Extending Components

```tsx
import { BoxRenderable, OptimizedBuffer, RGBA, type BoxOptions, type RenderContext } from "@opentui/core"
import { extend } from "@opentui/react"

class CustomButton extends BoxRenderable {
  public label: string = "Button"

  constructor(ctx: RenderContext, options: BoxOptions & { label: string }) {
    super(ctx, options)
    this.height = 3
    this.width = 24
  }

  protected renderSelf(buffer: OptimizedBuffer): void {
    super.renderSelf(buffer)
    const centerX = this.x + Math.floor(this.width / 2 - this.label.length / 2)
    const centerY = this.y + Math.floor(this.height / 2)
    buffer.drawText(this.label, centerX, centerY, RGBA.fromInts(255, 255, 255, 255))
  }
}

declare module "@opentui/react" {
  interface OpenTUIComponents {
    customButton: typeof CustomButton
  }
}

extend({ customButton: CustomButton })

// Usage
<customButton label="Click me" />
```

---

## Common Patterns

**Dialog overlay**:

```tsx
function Dialog({ children, onDismiss }) {
  const { width, height } = useTerminalDimensions()

  useKeyboard((key) => {
    if (key.name === 'escape') onDismiss()
  })

  return (
    <box
      position="absolute"
      width={width}
      height={height}
      left={0}
      top={0}
      backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
      alignItems="center"
      justifyContent="center"
      onMouseUp={onDismiss}
    >
      <box
        border
        borderStyle="rounded"
        backgroundColor="#1a1a2e"
        style={{ width: Math.min(60, width - 4), padding: 2 }}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {children}
      </box>
    </box>
  )
}
```

**Loading spinner** (using useTimeline):

```tsx
const frames = ["", "", "", "", "", "", "", ""]
const [frame, setFrame] = useState(0)
const timeline = useTimeline({ loop: true })

useEffect(() => {
  timeline.add({ frame: 0 }, {
    frame: frames.length - 1,
    duration: 800,
    onUpdate: (a) => setFrame(Math.floor(a.targets[0].frame))
  })
}, [])

<text fg="#7aa2f7">{frames[frame]} Loading...</text>
```

---

## Debugging

```tsx
const renderer = useRenderer()
renderer.console.show() // overlay console
console.log('Visible in overlay')
```

**Env vars**:

- `SHOW_CONSOLE=true` - show console at startup
- `OTUI_NO_NATIVE_RENDER=true` - disable terminal output
- `OTUI_USE_CONSOLE=false` - disable console capture

---

## Testing

```tsx
import { createMockMouse, MouseButtons } from '@opentui/core/testing'

const mockMouse = createMockMouse(renderer)
await mockMouse.click(x, y)
await mockMouse.click(x, y, MouseButtons.RIGHT)
await mockMouse.click(x, y, MouseButtons.LEFT, { modifiers: { ctrl: true } })
await mockMouse.doubleClick(x, y)
await mockMouse.drag(startX, startY, endX, endY)
await mockMouse.scroll(x, y, 'up' | 'down')
```

---

## Gotchas

1. **`flex` shorthand unsupported** - use `flexGrow`, `flexShrink`, `flexBasis`
2. **Focus is manual** - track which element has `focused={true}`
3. **Input requires focus** - `<input focused />` or no keystrokes received
4. **jsxImportSource required** - without it, TS treats elements as HTML
5. **Scrollbox needs height** - explicit or from parent flex layout
6. **Events bubble** - use `e.stopPropagation()` in dialogs
7. **Percentages are strings** - `width="50%"` not `width={50%}`
8. **wrapMode for text** - default is no wrap, use `wrapMode="word"`
9. **Border array for partial** - `border={["left"]}` not `borderLeft`
10. **SolidJS naming** - `ascii-font` (React) vs `ascii_font` (SolidJS)

---

## Runtime

```bash
bun run src/index.tsx    # run directly
bun test                 # tests
bun install              # deps
```

Bun auto-loads `.env`. TS runs without build. Native code changes need `bun run build` (requires Zig).
