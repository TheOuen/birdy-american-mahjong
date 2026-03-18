// Game engine — pure TypeScript, runs client-side for demo, server-side for multiplayer

import { createTileSet } from '../tiles/constants'
import type { Tile, TileId } from '../tiles/constants'
import type {
  GameState,
  GameStatus,
  PlayerState,
  Seat,
  DiscardEntry,
} from './types'

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type DemoGameState = {
  gameState: GameState
  wall: Tile[] // only tracked locally in demo mode
}

const BOT_NAMES = ['Margaret', 'Ruth', 'Florence']

export function createDemoGame(): DemoGameState {
  const tiles = shuffle(createTileSet())
  const wall = [...tiles]

  // Deal: East (seat 0, the player) gets 14, others get 13
  const hands: Tile[][] = [[], [], [], []]
  for (let seat = 0; seat < 4; seat++) {
    const count = seat === 0 ? 14 : 13
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
    currentTurn: 'player',
    turnOrder: ['player', 'bot-1', 'bot-2', 'bot-3'],
    dealerIndex: 0,
    players,
    discardPile: [],
    charlestonStep: 'done',
    round: 1,
    winnerId: null,
    winningMethod: null,
    winningHandId: null,
    turnTimerSec: 0,
    tilesRemaining: wall.length,
  }

  return { gameState, wall }
}

export function drawTile(state: DemoGameState): { tile: Tile; state: DemoGameState } | null {
  if (state.wall.length === 0) return null

  const wall = [...state.wall]
  const tile = wall.pop()!
  const player = state.gameState.players.find(
    (p) => p.id === state.gameState.currentTurn
  )!

  const updatedPlayers = state.gameState.players.map((p) =>
    p.id === player.id ? { ...p, hand: [...p.hand, tile] } : p
  )

  return {
    tile,
    state: {
      wall,
      gameState: {
        ...state.gameState,
        players: updatedPlayers,
        tilesRemaining: wall.length,
      },
    },
  }
}

export function discardTile(
  state: DemoGameState,
  playerId: string,
  tileId: TileId,
  noDiscardTileId?: TileId // tile that cannot be discarded this turn (joker swap rule)
): DemoGameState | null {
  const player = state.gameState.players.find((p) => p.id === playerId)
  if (!player) return null

  const tileIndex = player.hand.findIndex((t) => t.id === tileId)
  if (tileIndex === -1) return null

  // Jokers cannot be discarded per NMJL rules
  if (player.hand[tileIndex].type.kind === 'joker') return null

  // Cannot discard the tile used for a joker swap this turn
  if (noDiscardTileId && tileId === noDiscardTileId) return null

  const discardedTile = player.hand[tileIndex]
  const newHand = [...player.hand]
  newHand.splice(tileIndex, 1)

  const entry: DiscardEntry = {
    tile: discardedTile,
    discardedBy: playerId,
    claimed: false,
  }

  // Advance to next player (counter-clockwise = next index in array)
  const turnOrder = state.gameState.turnOrder
  const currentIndex = turnOrder.indexOf(playerId)
  const nextIndex = (currentIndex + 1) % turnOrder.length
  const nextPlayer = turnOrder[nextIndex]

  const updatedPlayers = state.gameState.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p
  )

  return {
    wall: state.wall,
    gameState: {
      ...state.gameState,
      players: updatedPlayers,
      discardPile: [...state.gameState.discardPile, entry],
      currentTurn: nextPlayer,
    },
  }
}

// Bot AI: draw a tile, then discard a random non-joker tile
export function botTurn(state: DemoGameState): DemoGameState | null {
  // Draw
  const drawResult = drawTile(state)
  if (!drawResult) {
    // Wall empty — game over
    return {
      ...state,
      gameState: { ...state.gameState, status: 'finished' as GameStatus },
    }
  }

  let current = drawResult.state
  const botId = current.gameState.currentTurn
  const bot = current.gameState.players.find((p) => p.id === botId)
  if (!bot || bot.hand.length === 0) return current

  // Simple strategy: discard a random tile, preferring non-jokers
  const nonJokers = bot.hand.filter((t) => t.type.kind !== 'joker')
  const candidates = nonJokers.length > 0 ? nonJokers : bot.hand
  const discard = candidates[Math.floor(Math.random() * candidates.length)]

  const result = discardTile(current, botId, discard.id)
  return result ?? current
}

// Check if the game is over (wall empty)
export function isGameOver(state: DemoGameState): boolean {
  return state.wall.length === 0 || state.gameState.status === 'finished'
}
