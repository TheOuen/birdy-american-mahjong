// Blanks variant (DRAFT GUIDE §Variants).
//
// - Uses a non-standard 160-tile set: 108 suits + 16 winds + 12 dragons + 8 flowers
//   + 10 jokers + 6 blanks.
// - The wall is 40 stacks × 2 high per player (narrative; the engine just shuffles
//   and deals like any other game).
// - Blanks are "wilds that only resurrect dead tiles":
//     • Exchangeable for any DEAD discard (not the most recent, never a joker).
//     • Never allowed in an exposure.
//     • You cannot declare mahjong ON a blank (the 14th tile can't BE a blank).
//     • If you drew a blank as your 14th for mahjong, you may exchange it on your
//       turn as a special case (handled at declaration time).
//     • Exchanged discreetly between turns — NOT on your own turn except the
//       mahjong exception above.
//     • Once discarded, blanks are dead — cannot be claimed.
//     • Cannot be passed in Charleston (like jokers). Blanks-variant games skip
//       Charleston entirely in this implementation, so the Charleston validator
//       never sees a blank.
//
// Validation that blanks may not appear in exposures / may not be claimed lives in
// `claims.ts` and `jokerSwap.ts` (owned by P2 agent) — see TODO comments below.

import { createBlanksVariantTileSet } from '../../tiles/constants'
import type { Tile, TileId } from '../../tiles/constants'
import type { DemoGameState } from '../engine'
import type { GameState, GameStatus, PlayerState, Seat } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const BOT_NAMES = ['Margaret', 'Ruth', 'Florence']

export function createBlanksGame(dealerIndex = 0): DemoGameState {
  // 160 tiles — 6 blanks + 10 jokers in addition to the standard 144 non-joker tiles.
  const tiles = shuffle(createBlanksVariantTileSet())
  const wall = [...tiles]

  const turnOrder = ['player', 'bot-1', 'bot-2', 'bot-3']
  const dealerId = turnOrder[dealerIndex]

  // Same deal shape as standard: dealer 14, others 13.
  const hands: Tile[][] = [[], [], [], []]
  for (let seat = 0; seat < 4; seat++) {
    const count = seat === dealerIndex ? 14 : 13
    for (let i = 0; i < count; i++) {
      hands[seat].push(wall.pop()!)
    }
  }

  const players: PlayerState[] = [
    {
      id: 'player',
      userId: 'player',
      displayName: 'You',
      seat: 0 as Seat,
      hand: hands[0],
      exposed: [],
      isBot: false,
      isDead: false,
      score: 0,
      connected: true,
    },
    ...BOT_NAMES.map((name, i) => ({
      id: `bot-${i + 1}`,
      userId: `bot-${i + 1}`,
      displayName: name,
      seat: (i + 1) as Seat,
      hand: hands[i + 1],
      exposed: [],
      isBot: true,
      isDead: false,
      score: 0,
      connected: true,
    })),
  ]

  const gameState: GameState = {
    id: 'demo',
    code: 'DEMO',
    status: 'playing' as GameStatus,
    type: 'private',
    hostId: 'player',
    currentTurn: dealerId,
    turnOrder,
    dealerIndex,
    players,
    discardPile: [],
    // TODO(P5): the DRAFT GUIDE does not explicitly ban Charleston in this variant,
    // but blanks cannot be passed (like jokers). For simplicity we skip Charleston
    // here — revisit if real users request it. Charleston validator (charleston.ts)
    // is owned by the P3 agent; when they touch it, add a `kind === 'blank'` check
    // alongside the existing `kind === 'joker'` guard.
    charlestonStep: 'done',
    round: 1,
    winnerId: null,
    winningMethod: null,
    winningHandId: null,
    turnTimerSec: 0,
    tilesRemaining: wall.length,
    mode: 'blanks',
  }

  return { gameState, wall }
}

export type ExchangeBlankResult =
  | { success: true; state: DemoGameState }
  | { success: false; error: string }

/**
 * Exchange a blank tile in a player's hand for a DEAD discard.
 *
 * Dead discard = any discard in the pile that is NOT the most recent one and NOT a joker.
 * (Jokers in the discard pile are always dead per NMJL, but you can't swap a blank for
 * a joker — "never a dead joker.")
 *
 * Note: this helper performs the core mechanical swap only. The calling layer is
 * responsible for timing (between turns vs. on-turn mahjong exception) and for any
 * `isMahjongDeclaration` flag — both are surfaced by passing `allowOnOwnTurn`.
 *
 * Per DRAFT GUIDE, "the newly retrieved tile is then played to the slope of the rack" —
 * i.e. the retrieved tile visibly joins the hand. For digital simplicity we place it
 * into the player's hand array (not an exposure), and we remove the blank entirely from
 * play (it is not added to the discard pile — blanks in hand are the only instance;
 * once exchanged, the blank is retired per the rulebook's "discreet exchange" intent).
 */
export function exchangeBlank(
  state: DemoGameState,
  playerId: string,
  blankId: TileId,
  targetDiscardIndex: number,
  options: { allowOnOwnTurn?: boolean } = {},
): ExchangeBlankResult {
  const { allowOnOwnTurn = false } = options

  if (state.gameState.mode !== 'blanks') {
    return { success: false, error: 'Blank exchange is only available in the blanks variant.' }
  }

  const player = state.gameState.players.find((p) => p.id === playerId)
  if (!player) return { success: false, error: 'Player not found.' }
  if (player.isDead) return { success: false, error: 'Dead players cannot exchange blanks.' }

  // Rule: exchange happens discreetly BETWEEN turns, except on your own turn
  // when the blank is your 14th tile for mahjong (caller passes allowOnOwnTurn=true).
  if (!allowOnOwnTurn && state.gameState.currentTurn === playerId) {
    return {
      success: false,
      error: 'Blanks may only be exchanged between turns (except as the 14th tile for mahjong).',
    }
  }

  const blankIdx = player.hand.findIndex((t) => t.id === blankId)
  if (blankIdx === -1) {
    return { success: false, error: 'That blank is not in your hand.' }
  }
  if (player.hand[blankIdx].type.kind !== 'blank') {
    return { success: false, error: 'Selected tile is not a blank.' }
  }

  const discardPile = state.gameState.discardPile
  if (targetDiscardIndex < 0 || targetDiscardIndex >= discardPile.length) {
    return { success: false, error: 'Discard index out of range.' }
  }

  // Dead = not the most recent discard.
  if (targetDiscardIndex === discardPile.length - 1) {
    return { success: false, error: 'You may only exchange for a DEAD discard (not the most recent).' }
  }

  const targetEntry = discardPile[targetDiscardIndex]
  if (targetEntry.tile.type.kind === 'joker') {
    return { success: false, error: 'You may not exchange a blank for a dead joker.' }
  }

  // Already-claimed entries do not represent a dead pile tile anymore — skip them.
  if (targetEntry.claimed) {
    return { success: false, error: 'That discard was already claimed and is no longer in the pile.' }
  }

  // Build the new state: remove blank from hand, add retrieved tile in its place,
  // remove the retrieved tile from the discard pile.
  const retrievedTile: Tile = targetEntry.tile

  const newHand = [...player.hand]
  newHand.splice(blankIdx, 1)
  newHand.push(retrievedTile)

  const newDiscardPile = [...discardPile]
  newDiscardPile.splice(targetDiscardIndex, 1)

  const newPlayers = state.gameState.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p,
  )

  return {
    success: true,
    state: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players: newPlayers,
        discardPile: newDiscardPile,
      },
    },
  }
}

// TODO(P2): when claims.ts / jokerSwap.ts are updated by the claims agent, ensure:
//   1. Blanks are rejected from any exposure (`executeClaim` must filter `kind === 'blank'`).
//   2. A hand containing blanks cannot declare mahjong (the 14th tile can't be a blank);
//      `declare_mahjong` validation should reject blanks on the winning-tile position.
//   3. Discarded blanks cannot be claimed — `getValidClaims` should return [] for any
//      discard whose tile kind is 'blank'.
