// Messy Mahjong variant (DRAFT GUIDE §Variants).
//
// - Skip the formal wall build and ritual deal.
// - Dealer grabs 14 tiles at random from the shuffled pile; everyone else grabs 13.
// - Charleston is skipped — gameplay resumes normally with the dealer's first discard.
//
// Intended for travel sets, rushed games, or when nobody has the patience to build a wall.

import { createTileSet } from '../../tiles/constants'
import type { Tile } from '../../tiles/constants'
import type { DemoGameState } from '../engine'
import type { GameState, GameStatus, PlayerState, Seat } from '../types'

// Fisher-Yates shuffle (local copy — avoids importing from engine.ts internals).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pull `count` tiles from random indices in the pile. Mutates `pile` in place
// (splice-style) so the remaining pile represents tiles nobody took yet.
function grabRandomly(pile: Tile[], count: number): Tile[] {
  const grabbed: Tile[] = []
  for (let i = 0; i < count && pile.length > 0; i++) {
    const idx = Math.floor(Math.random() * pile.length)
    grabbed.push(pile.splice(idx, 1)[0])
  }
  return grabbed
}

const BOT_NAMES = ['Margaret', 'Ruth', 'Florence']

export function createMessyGame(dealerIndex = 0): DemoGameState {
  // Same 152-tile standard set — only the deal procedure changes.
  const pile = shuffle(createTileSet())

  const turnOrder = ['player', 'bot-1', 'bot-2', 'bot-3']
  const dealerId = turnOrder[dealerIndex]

  // Deal by "random grab" — splice from random indices rather than pop from the end.
  const hands: Tile[][] = [[], [], [], []]
  for (let seat = 0; seat < 4; seat++) {
    const count = seat === dealerIndex ? 14 : 13
    hands[seat] = grabRandomly(pile, count)
  }

  const wall = pile // whatever is left becomes the wall for subsequent draws

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
    charlestonStep: 'done',
    round: 1,
    winnerId: null,
    winningMethod: null,
    winningHandId: null,
    turnTimerSec: 0,
    tilesRemaining: wall.length,
    mode: 'messy',
  }

  return { gameState, wall }
}
