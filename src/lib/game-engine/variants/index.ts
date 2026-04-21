// Game-mode variant registry.
// See docs/plans/2026-04-21-client-doc-improvements.md §P5 and DRAFT GUIDE §Variants.

export type { GameMode } from '../types'

export { createMessyGame } from './messyMahjong'
export { createShortPlayerGame } from './shortPlayerGame'
export { createBlanksGame, exchangeBlank } from './blanks'
export type { ExchangeBlankResult } from './blanks'
