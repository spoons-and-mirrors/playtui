/**
 * Flipbook - Terminal Animation Player
 * 
 * A standalone player for TUI animations created with PlayTUI.
 * 
 * @example
 * // CLI usage
 * npx @playtui/flipbook animation.json
 * flipbook --demo
 * 
 * @example
 * // Library usage
 * import { Flipbook, type FlipbookFrames } from "@playtui/flipbook"
 * 
 * const myAnimation: FlipbookFrames = { ... }
 * <Flipbook data={myAnimation} />
 */

export { Flipbook } from "./player"
export type { FlipbookProps } from "./player"
export type { FlipbookFrames, ElementNode, ElementType, SizeValue } from "./types"
