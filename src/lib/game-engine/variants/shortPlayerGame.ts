// Short-player (2- or 3-player) variant (DRAFT GUIDE §Variants).
//
// - No formal wall build. All 152 tiles shuffled into a "centre pile".
// - Each seat grabs at random from the pile: dealer 14 tiles, others 13.
// - Charleston is skipped. Dealer opens play by discarding their 14th tile.
// - Turn order is still counter-clockwise, but only across the seats that are present.
//
// The engine's existing turn math uses `(i + 1) % turnOrder.length`, which already
// generalises — we just need turnOrder.length to be 2 or 3 here.

import { createTileSet } from '../../tiles/constants'
import type { Tile } from '../../tiles/constants'
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

function grabRandomly(pile: Tile[], count: number): Tile[] {
  const grabbed: Tile[] = []
  for (let i = 0; i < count && pile.length > 0; i++) {
    const idx = Math.floor(Math.random() * pile.length)
    grabbed.push(pile.splice(idx, 1)[0])
  }
  return grabbed
}

// Bot names — reuse a subset so 3-player still has a named opponent.
const BOT_NAMES_BY_COUNT: Record<2 | 3, string[]> = {
  2: ['Margaret'],
  3: ['Margaret', 'Ruth'],
}

export function createShortPlayerGame(
  playerCount: 2 | 3,
  dealerIndex = 0,
): DemoGameState {
  if (playerCount !== 2 && playerCount !== 3) {
    throw new Error(`short-player game requires 2 or 3 players, got ${playerCount}`)
  }
  if (dealerIndex < 0 || dealerIndex >= playerCount) {
    throw new Error(`dealerIndex ${dealerIndex} out of range for ${playerCount}-player game`)
  }

  const pile = shuffle(createTileSet())

  const turnOrder: string[] =
    playerCount === 2
      ? ['player', 'bot-1']
      : ['player', 'bot-1', 'bot-2']
  const dealerId = turnOrder[dealerIndex]

  const hands: Tile[][] = Array.from({ length: playerCount }, () => [])
  for (let seat = 0; seat < playerCount; seat++) {
    const count = seat === dealerIndex ? 14 : 13
    hands[seat] = grabRandomly(pile, count)
  }

  const wall = pile

  const botNames = BOT_NAMES_BY_COUNT[playerCount]
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
    ...botNames.map((name, i) => ({
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
    mode: 'short',
  }

  return { gameState, wall }
}
