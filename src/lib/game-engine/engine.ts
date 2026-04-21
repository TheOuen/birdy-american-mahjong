// Game engine — pure TypeScript, runs client-side for demo, server-side for multiplayer

import { createTileSet } from '../tiles/constants'
import type { Tile, TileId } from '../tiles/constants'
import { hasWinningHand, findMatchingHands } from '../nmjl/matcher'
import type { NmjlHand } from '../nmjl/types'
import { calculateScore, applyScores, applyMahjongInError } from './scoring'
import type { MahjongInErrorOpts } from './scoring'
import {
  resolveClaims,
  evaluateBotClaim,
  getClaimTileIds,
} from './claims'
import type { PendingClaim } from './claims'
import type {
  GameMode,
  GameState,
  GameStatus,
  PlayerState,
  Seat,
  DiscardEntry,
} from './types'
import { createMessyGame } from './variants/messyMahjong'
import { createShortPlayerGame } from './variants/shortPlayerGame'
import { createBlanksGame } from './variants/blanks'

// The matcher is being refactored in parallel (Agent 1) to return joker
// usage alongside the matching NmjlHand. For now findMatchingHands may return
// either shape; this helper normalises both.
type MatcherResult = NmjlHand | { hand: NmjlHand; jokersUsed: number }

function extractMatch(m: MatcherResult): { hand: NmjlHand; jokersUsed: number } {
  if ('hand' in m && 'jokersUsed' in m) {
    return { hand: m.hand, jokersUsed: m.jokersUsed }
  }
  // TODO: pending matcher refactor — joker count unknown, skip jokerless bonus.
  return { hand: m as NmjlHand, jokersUsed: -1 }
}

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

export function createDemoGame(dealerIndex = 0): DemoGameState {
  const tiles = shuffle(createTileSet())
  const wall = [...tiles]

  const turnOrder = ['player', 'bot-1', 'bot-2', 'bot-3']
  const dealerId = turnOrder[dealerIndex]

  // Deal: dealer gets 14 tiles (East), others get 13
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
    charlestonStep: 'done',
    round: 1,
    winnerId: null,
    winningMethod: null,
    winningHandId: null,
    turnTimerSec: 0,
    tilesRemaining: wall.length,
    mode: 'standard',
  }

  return { gameState, wall }
}

/**
 * Variant-aware demo game factory. Dispatches on GameMode to the appropriate
 * creator (standard / messy / short / blanks). Kept intentionally thin so the
 * existing standard flow in `createDemoGame` is unchanged for 'standard' mode.
 *
 * For 'short' mode the caller may pass a playerCount via options — defaults to 2.
 */
export function createGameForMode(
  mode: GameMode,
  options: { dealerIndex?: number; playerCount?: 2 | 3 } = {},
): DemoGameState {
  const dealerIndex = options.dealerIndex ?? 0
  switch (mode) {
    case 'standard':
      return createDemoGame(dealerIndex)
    case 'messy':
      return createMessyGame(dealerIndex)
    case 'short':
      return createShortPlayerGame(options.playerCount ?? 2, dealerIndex)
    case 'blanks':
      return createBlanksGame(dealerIndex)
  }
}

/**
 * Rotate dealer for the next round.
 * - If wasWallGame is true, the same dealer stays.
 * - Otherwise, dealer rotates counter-clockwise (next index).
 * Increments round and sets currentTurn to the new dealer.
 */
export function rotateDealerForNextRound(
  state: DemoGameState,
  wasWallGame: boolean
): DemoGameState {
  const prevDealerIndex = state.gameState.dealerIndex
  // Use turnOrder.length rather than a hardcoded 4 so short-player variants
  // (2 or 3 seats) rotate correctly.
  const seatCount = state.gameState.turnOrder.length || 4
  const newDealerIndex = wasWallGame
    ? prevDealerIndex
    : (prevDealerIndex + 1) % seatCount
  const newDealerId = state.gameState.turnOrder[newDealerIndex]

  return {
    ...state,
    gameState: {
      ...state.gameState,
      dealerIndex: newDealerIndex,
      currentTurn: newDealerId,
      round: state.gameState.round + 1,
    },
  }
}

export function drawTile(state: DemoGameState): { tile: Tile; state: DemoGameState } | null {
  if (state.wall.length === 0) return null

  const player = state.gameState.players.find(
    (p) => p.id === state.gameState.currentTurn
  )!
  if (player.isDead) return null

  // NMJL flower rule: flowers are never held in hand and never discarded —
  // when drawn, set aside face-up next to the player and draw again. We model
  // this by auto-pushing each flower into `exposed` and continuing to pop the
  // wall until we get a non-flower (or the wall empties).
  const wall = [...state.wall]
  const accumulatedFlowers: Tile[] = []
  let drawn: Tile | null = null

  while (wall.length > 0) {
    const tile = wall.pop()!
    if (tile.type.kind === 'flower') {
      accumulatedFlowers.push(tile)
      continue
    }
    drawn = tile
    break
  }

  if (drawn === null && accumulatedFlowers.length === 0) return null

  const updatedPlayers = state.gameState.players.map((p) => {
    if (p.id !== player.id) return p
    const flowerGroups = accumulatedFlowers.map((f) => ({
      tiles: [f],
      claimType: 'flower' as const,
    }))
    return {
      ...p,
      hand: drawn ? [...p.hand, drawn] : p.hand,
      exposed: [...p.exposed, ...flowerGroups],
    }
  })

  // If the wall emptied while only flowers were available, return the last
  // flower as the "drawn" tile so callers still get a tile reference — but
  // prefer the real non-flower draw when one exists.
  const reportedTile = drawn ?? accumulatedFlowers[accumulatedFlowers.length - 1]

  return {
    tile: reportedTile,
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

  // Dead players cannot discard (they don't take turns).
  if (player.isDead) return null

  const tileIndex = player.hand.findIndex((t) => t.id === tileId)
  if (tileIndex === -1) return null

  // Jokers cannot be discarded per NMJL rules
  if (player.hand[tileIndex].type.kind === 'joker') return null

  // Flowers never reach a player's hand (auto-exposed on draw), so a flower
  // id here means state was corrupted. Refuse the discard defensively.
  if (player.hand[tileIndex].type.kind === 'flower') return null

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

  // Advance to next LIVE player (counter-clockwise). Skip dead seats so play
  // doesn't stall on them.
  const turnOrder = state.gameState.turnOrder
  const currentIndex = turnOrder.indexOf(playerId)
  let nextPlayer = turnOrder[(currentIndex + 1) % turnOrder.length]
  for (let step = 1; step <= turnOrder.length; step++) {
    const candidateId = turnOrder[(currentIndex + step) % turnOrder.length]
    const candidate = state.gameState.players.find((p) => p.id === candidateId)
    if (candidate && !candidate.isDead) {
      nextPlayer = candidateId
      break
    }
  }

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
      // Clear claim-rearrange window — you only get to rearrange until discard.
      awaitingDiscardAfterClaim: false,
    },
  }
}

// Bot AI: draw a tile, check for Mahjong, then discard a random non-joker tile
export function botTurn(state: DemoGameState): DemoGameState | null {
  // Skip dead bots — advance turn to next live player.
  const currentBot = state.gameState.players.find(
    (p) => p.id === state.gameState.currentTurn
  )
  if (currentBot?.isDead) {
    const turnOrder = state.gameState.turnOrder
    const currentIndex = turnOrder.indexOf(currentBot.id)
    let nextId = turnOrder[(currentIndex + 1) % turnOrder.length]
    for (let step = 1; step <= turnOrder.length; step++) {
      const candidateId = turnOrder[(currentIndex + step) % turnOrder.length]
      const candidate = state.gameState.players.find((p) => p.id === candidateId)
      if (candidate && !candidate.isDead) {
        nextId = candidateId
        break
      }
    }
    return {
      ...state,
      gameState: { ...state.gameState, currentTurn: nextId },
    }
  }

  // Draw
  const drawResult = drawTile(state)
  if (!drawResult) {
    // Wall empty — game over
    return {
      ...state,
      gameState: { ...state.gameState, status: 'finished' as GameStatus },
    }
  }

  const current = drawResult.state
  const botId = current.gameState.currentTurn
  const bot = current.gameState.players.find((p) => p.id === botId)
  if (!bot || bot.hand.length === 0) return current

  // Check if bot has a winning hand (self-draw Mahjong)
  if (hasWinningHand(bot.hand, bot.exposed)) {
    const matches = findMatchingHands(bot.hand, bot.exposed) as MatcherResult[]
    if (matches.length > 0) {
      const { hand: winningHand, jokersUsed } = extractMatch(matches[0])
      const scoreResult = calculateScore(
        current.gameState,
        botId,
        'self_draw',
        winningHand.points,
        {
          jokersUsed,
          handCategory: winningHand.category,
          pendingMahjongError: current.gameState.pendingMahjongError ?? null,
        }
      )
      const updatedPlayers = applyScores(current.gameState.players, scoreResult)
      return {
        wall: current.wall,
        gameState: {
          ...current.gameState,
          status: 'finished' as GameStatus,
          winnerId: botId,
          winningMethod: 'self_draw',
          winningHandId: winningHand.id,
          players: updatedPlayers,
          pendingMahjongError: null,
        },
      }
    }
  }

  // Simple strategy: discard a random tile. Jokers and flowers never leave
  // the hand via discard (flowers should already be auto-exposed on draw,
  // but filter defensively in case of any legacy state).
  const discardable = bot.hand.filter(
    (t) => t.type.kind !== 'joker' && t.type.kind !== 'flower'
  )
  if (discardable.length === 0) return current
  const discard = discardable[Math.floor(Math.random() * discardable.length)]

  const result = discardTile(current, botId, discard.id)
  return result ?? current
}

// Check if the game is over (wall empty)
export function isGameOver(state: DemoGameState): boolean {
  return state.wall.length === 0 || state.gameState.status === 'finished'
}

// ---------------------------------------------------------------------------
// Mahjong-in-Error engine hook
// ---------------------------------------------------------------------------
//
// Wrapper over applyMahjongInError that threads a DemoGameState through the
// GameState-level scorer. Use this from the UI / bot flow when a player
// (incorrectly) declares Mahjong.
export function handleMahjongInError(
  state: DemoGameState,
  opts: MahjongInErrorOpts
): { state: DemoGameState; summary: string } {
  const { newState, summary } = applyMahjongInError(state.gameState, opts)
  return {
    state: { ...state, gameState: newState },
    summary,
  }
}

// ---------------------------------------------------------------------------
// Claim-window resolution
// ---------------------------------------------------------------------------
//
// For the current demo-mode single-human flow: after a discard, collect
// pending claims (from the human UI + each live bot's evaluateBotClaim),
// then run them through resolveClaims to pick the winner per Claim Rules 4-7.
// The losing claimants are dropped — their claim windows close automatically.
export function collectAndResolveClaims(
  state: DemoGameState,
  discardIndex: number,
  humanClaim: PendingClaim | null
): PendingClaim | null {
  const discard = state.gameState.discardPile[discardIndex]
  if (!discard) return null

  const claims: PendingClaim[] = []
  if (humanClaim) claims.push(humanClaim)

  // Poll each live bot for its preferred claim.
  for (const p of state.gameState.players) {
    if (p.isDead) continue
    if (!p.isBot) continue
    if (p.id === discard.discardedBy) continue // can't claim own discard
    const claimType = evaluateBotClaim(p, discard.tile)
    if (!claimType) continue
    if (claimType === 'mahjong') {
      claims.push({
        claimerId: p.id,
        claimType,
        tileIds: [],
        declaredAt: Date.now(),
      })
    } else {
      const tileIds = getClaimTileIds(p.hand, discard.tile, claimType)
      if (!tileIds) continue
      claims.push({
        claimerId: p.id,
        claimType,
        tileIds,
        declaredAt: Date.now(),
      })
    }
  }

  return resolveClaims(state.gameState, discardIndex, claims)
}
