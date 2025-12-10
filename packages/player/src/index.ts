/**
 * PlayTUI Animation Player
 * 
 * A standalone player for TUI animations created with PlayTUI.
 * 
 * @example
 * // CLI usage
 * npx @playtui/player animation.json
 * 
 * @example
 * // Library usage
 * import { AnimationPlayer, type AnimationData } from "@playtui/player"
 * 
 * const myAnimation: AnimationData = { ... }
 * <AnimationPlayer data={myAnimation} />
 */

export { AnimationPlayer } from "./player"
export type { AnimationPlayerProps } from "./player"
export type { AnimationData, ElementNode, ElementType, SizeValue } from "./types"
