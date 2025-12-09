import { SyntaxStyle, RGBA } from "@opentui/core"

// TUI Builder Theme - Frosted Ice palette

export const COLORS = {
  // Backgrounds
  bg: "#151a22",
  bgAlt: "#1c222c",
  card: "#19222cff",
  cardHover: "#282f3c",
  input: "#151a22",

  // Borders
  border: "#2a3545",
  borderFocus: "#4a6a8a",

  // Text
  text: "#d8dce5",
  muted: "#4a5568",

  // Accents
  accent: "#4da8da",
  accentBright: "#5bc0de",

  // Semantic
  success: "#00d4aa",
  warning: "#f0b860",
  danger: "#ff6b7a",
  dangerMuted: "#d94f5c",

  // Syntax highlighting
  syntaxKeyword: "#c792ea",
  syntaxString: "#c3e88d",
  syntaxNumber: "#f78c6c",
  syntaxComment: "#546e7a",
  syntaxFunction: "#82aaff",
  syntaxVariable: "#e5c07b",
  syntaxType: "#ffcb6b",
  syntaxOperator: "#89ddff",
  syntaxProperty: "#80cbc4",
  syntaxPunctuation: "#89ddff",
  syntaxTag: "#f07178",
  syntaxAttribute: "#ffcb6b",
}

// Half-char border characters for thin panel borders
export const ThinBorderRight = {
  horizontal: " ", vertical: "▕", topLeft: " ", topRight: " ",
  bottomLeft: " ", bottomRight: " ", cross: " ",
  left: " ", right: " ", top: " ", bottom: " ",
  topT: " ", bottomT: " ", leftT: " ", rightT: " ",
}

export const ThinBorderLeft = {
  horizontal: " ", vertical: "▏", topLeft: " ", topRight: " ",
  bottomLeft: " ", bottomRight: " ", cross: " ",
  left: " ", right: " ", top: " ", bottom: " ",
  topT: " ", bottomT: " ", leftT: " ", rightT: " ",
}

// Semi-transparent accent color for panel borders (50% opacity)
export const BORDER_ACCENT = RGBA.fromInts(77, 168, 218, 128)

// Syntax style for JSX/TSX code highlighting
export const syntaxStyle = SyntaxStyle.fromStyles({
  default: { fg: RGBA.fromHex(COLORS.text) },
  keyword: { fg: RGBA.fromHex(COLORS.syntaxKeyword), bold: true },
  string: { fg: RGBA.fromHex(COLORS.syntaxString) },
  number: { fg: RGBA.fromHex(COLORS.syntaxNumber) },
  comment: { fg: RGBA.fromHex(COLORS.syntaxComment), italic: true, dim: true },
  function: { fg: RGBA.fromHex(COLORS.syntaxFunction) },
  variable: { fg: RGBA.fromHex(COLORS.syntaxVariable) },
  type: { fg: RGBA.fromHex(COLORS.syntaxType) },
  operator: { fg: RGBA.fromHex(COLORS.syntaxOperator) },
  property: { fg: RGBA.fromHex(COLORS.syntaxProperty) },
  "punctuation.bracket": { fg: RGBA.fromHex(COLORS.syntaxPunctuation) },
  "tag": { fg: RGBA.fromHex(COLORS.syntaxTag) },
  "tag.attribute": { fg: RGBA.fromHex(COLORS.syntaxAttribute) },
})
