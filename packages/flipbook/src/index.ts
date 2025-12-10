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
 * import { AnimationPlayer, type AnimationData } from "@playtui/flipbook"
 * 
 * const myAnimation: AnimationData = { ... }
 * <AnimationPlayer data={myAnimation} />
 */

export { AnimationPlayer } from "./player"
export type { AnimationPlayerProps } from "./player"
export type { AnimationData, ElementNode, ElementType, SizeValue } from "./types"
