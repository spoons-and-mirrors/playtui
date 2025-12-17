/**
 * Flipbook - Terminal Animation Player
 *
 * A standalone player for TUI animations created with PlayTUI.
 *
 * @example
 * import { animation } from "./my-animation"
 * import { Flipbook } from "@playtui/flipbook"
 *
 * <Flipbook animation={animation} />
 *
 * @example
 * // With ref for imperative control
 * const ref = useRef<FlipbookRef>(null)
 * ref.current?.pause()
 * ref.current?.goToFrame(5)
 *
 * <Flipbook ref={ref} animation={animation} />
 */

export { Flipbook } from './player'
export type { FlipbookProps, FlipbookRef } from './player'
export type { Animation } from './types'
