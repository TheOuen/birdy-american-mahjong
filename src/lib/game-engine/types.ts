// Game engine types — shared between client and server

import type { Tile, TileId, TileType } from '../tiles/constants'

export type GameStatus = 'waiting' | 'charleston' | 'playing' | 'finished' | 'abandoned'
export type GameType = 'private' | 'public'
export type WinningMethod = 'self_draw' | 'discard'
export type Seat = 0 | 1 | 2 | 3

// Optional ruleset variants — see docs/plans/2026-04-21-client-doc-improvements.md P5
// 'standard'  = NMJL 2026 default (4 players, full wall build, Charleston)
// 'messy'     = skip formal wall/deal, random grab from shuffled pile, skip Charleston
// 'short'     = 2- or 3-player variant, draw at random from centre, skip Charleston
// 'blanks'    = 10 jokers + 6 blanks (160-tile set); blanks swap for dead discards
export type GameMode = 'standard' | 'messy' | 'short' | 'blanks'

export type CharlestonStep =
  | 'first_right'
  | 'first_across'
  | 'first_left'
  | 'stop_vote'
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

// A deferred Mahjong-in-Error penalty: when a false Mahjong caller reveals
// their hand AND another player also reveals theirs, the caller must pay
// the intact player 2x the eventual winner's hand value. Because the eventual
// winner is unknown at the time of the false call, we stash the pair here and
// apply the penalty at win-time (or wall-game time).
export type PendingMahjongError = {
  callerId: string
  otherRevealedPlayerId: string
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
  // Claim Rule 8 — after claiming a discard and exposing a group, the claimer
  // may rearrange that group (e.g. swap a joker in/out) until they discard.
  // Set to true by executeClaim, cleared by discardTile.
  awaitingDiscardAfterClaim?: boolean
  // Set when a false Mahjong call triggered a reveal-penalty pairing.
  // Resolved at win-time or wall-game finalization.
  pendingMahjongError?: PendingMahjongError | null
  // Optional ruleset variant. Absent / undefined means 'standard' for back-compat
  // with any pre-existing game state. Default for newly created games: 'standard'.
  mode?: GameMode
}

// Actions a player can take
export type GameAction =
  | { type: 'draw' }
  | { type: 'discard'; tileId: TileId }
  | { type: 'claim'; claimType: ClaimType; tileIds: TileId[] }
  | { type: 'declare_mahjong'; handTileIds: TileId[] }
  | { type: 'charleston_pass'; tileIds: [TileId, TileId, TileId] }
  | { type: 'charleston_agree_second'; agree: boolean }
  | { type: 'charleston_stop_vote'; stop: boolean }
  | { type: 'charleston_blind_pass'; blindTileIds: TileId[]; fromHandTileIds: TileId[] }
  | { type: 'courtesy_pass'; tileIds: TileId[] }
  | { type: 'joker_swap'; jokerTileId: TileId; replacementTileId: TileId; targetPlayerId: string; groupIndex: number }
  | { type: 'pass_claim' } // explicitly pass on claiming a discard
  // False Mahjong call. `handRevealed` = caller showed their hand after the
  // (incorrect) declaration. `otherRevealedPlayerId` = some other player also
  // showed their hand reacting to the false call.
  | { type: 'declare_mahjong_error'; callerId: string; handRevealed: boolean; otherRevealedPlayerId?: string }
  // After claiming a discard and exposing a group, rearrange that group
  // (swap real tile↔joker from hand) before discarding. Claim Rule 8.
  | { type: 'rearrange_exposure'; groupIndex: number; newTileIds: TileId[] }
  // Blanks variant only — exchange a blank in your hand for a DEAD discard
  // (a discard that's not the most recent in the pile, and not a joker).
  // Allowed discreetly between turns; also valid on your own turn as the 14th tile
  // for mahjong (handled as a special case at declaration time).
  | BlankExchangeAction

// Blanks variant only — see src/lib/game-engine/variants/blanks.ts
export type BlankExchangeAction = {
  type: 'exchange_blank'
  playerId: string
  blankTileId: TileId
  targetDiscardIndex: number
}

// Result of processing an action
export type ActionResult =
  | { success: true; newState: GameState }
  | { success: false; error: string }
