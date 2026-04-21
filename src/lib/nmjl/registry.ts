// NMJL card registry — exposes both the 2025 and 2026 datasets and defaults
// the active card to 2026 (the card that's live on physical tables today).
//
// Callers that need to pin to a specific year (e.g. tests, or a "practice
// with 2025" toggle) pass the year explicitly:
//
//   findMatchingHands(hand, exposed, 2025)
//
// Everywhere else, the matcher uses getActiveCard() which falls back to
// DEFAULT_CARD_YEAR.

import type { NmjlHand } from './types'
import { NMJL_2025_HANDS } from './hands-2025'
import { NMJL_2026_HANDS } from './hands-2026'

export const AVAILABLE_CARDS = {
  2025: NMJL_2025_HANDS,
  2026: NMJL_2026_HANDS,
} as const

export type CardYear = keyof typeof AVAILABLE_CARDS

export const DEFAULT_CARD_YEAR: CardYear = 2026

export function getActiveCard(year: CardYear = DEFAULT_CARD_YEAR): NmjlHand[] {
  return AVAILABLE_CARDS[year]
}
