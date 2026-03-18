// Game engine types — shared between client and server

import type { Tile, TileId, TileType } from '../tiles/constants'

export type GameStatus = 'waiting' | 'charleston' | 'playing' | 'finished' | 'abandoned'
export type GameType = 'private' | 'public'
export type WinningMethod = 'self_draw' | 'discard'
export type Seat = 0 | 1 | 2 | 3

export type CharlestonStep =
  | 'first_right'
  | 'first_across'
  | 'first_left'
  | 'second_left'
  | 'second_across'
  | 'second_right'
  | 'courtesy'
  | 'done'

export type ClaimType = 'pung' | 'kong' | 'quint' | 'sextet' | 'mahjong'

export type ExposedGroup = {
  tiles: Tile[]
  claimType: ClaimType
  claimedFrom?: string // player id who discarded
  representsTileType?: TileType // what tile type this group represents (for joker swap validation)
}

export type PlayerState = {
  id: string
  userId: string
  displayName: string
  seat: Seat
  hand: Tile[]           // only visible to owning player
  exposed: ExposedGroup[]
  isBot: boolean
  isDead: boolean
  score: number
  connected: boolean
}

export type DiscardEntry = {
  tile: Tile
  discardedBy: string    // player id
  claimed: boolean
}

export type GameState = {
  id: string
  code: string
  status: GameStatus
  type: GameType
  hostId: string
  currentTurn: string    // player id whose turn it is
  turnOrder: string[]    // player ids in seat order
  dealerIndex: number
  players: PlayerState[]
  discardPile: DiscardEntry[]
  charlestonStep: CharlestonStep
  round: number
  winnerId: string | null
  winningMethod: WinningMethod | null
  winningHandId: string | null
  turnTimerSec: number
  tilesRemaining: number // clients see count, never actual tiles
}

// Actions a player can take
export type GameAction =
  | { type: 'draw' }
  | { type: 'discard'; tileId: TileId }
  | { type: 'claim'; claimType: ClaimType; tileIds: TileId[] }
  | { type: 'declare_mahjong'; handTileIds: TileId[] }
  | { type: 'charleston_pass'; tileIds: [TileId, TileId, TileId] }
  | { type: 'charleston_agree_second'; agree: boolean }
  | { type: 'courtesy_pass'; tileIds: TileId[] }
  | { type: 'joker_swap'; jokerTileId: TileId; replacementTileId: TileId; targetPlayerId: string; groupIndex: number }
  | { type: 'pass_claim' } // explicitly pass on claiming a discard

// Result of processing an action
export type ActionResult =
  | { success: true; newState: GameState }
  | { success: false; error: string }
