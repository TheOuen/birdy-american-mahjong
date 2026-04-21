// Claim validation, resolution, and execution for discard claims
// (Pung, Kong, Quint, Sextet, Mahjong).

import type { Tile, TileId, TileType } from '../tiles/constants'
import { tilesMatch } from '../tiles/constants'
import type {
  PlayerState,
  ClaimType,
  ExposedGroup,
  GameState,
} from './types'
import type { DemoGameState } from './engine'
import { wouldCompleteHand } from '../nmjl/matcher'

// Count tiles in hand that match a target type
export function countMatching(
  hand: Tile[],
  target: TileType
): { exact: number; jokers: number; matchingIds: TileId[]; jokerIds: TileId[] } {
  let exact = 0
  let jokers = 0
  const matchingIds: TileId[] = []
  const jokerIds: TileId[] = []

  for (const t of hand) {
    if (t.type.kind === 'joker') {
      jokers++
      jokerIds.push(t.id)
    } else if (tilesMatch(t.type, target)) {
      exact++
      matchingIds.push(t.id)
    }
  }

  return { exact, jokers, matchingIds, jokerIds }
}

// Determine what claims a player can make on a discarded tile
export function getValidClaims(player: PlayerState, discardedTile: Tile): ClaimType[] {
  if (player.isDead) return []
  // Flowers are never claimable — they're auto-exposed on draw, not passed
  // through the discard pile. If one ends up here, surface no claim options.
  if (discardedTile.type.kind === 'flower') return []
  // Jokers likewise cannot be discarded/claimed.
  if (discardedTile.type.kind === 'joker') return []

  const { exact, jokers } = countMatching(player.hand, discardedTile.type)
  // Need N-1 from hand (discard provides 1)
  const claims: ClaimType[] = []

  // The discard itself counts as 1 real tile, so the "at least 1 real" requirement
  // for groups of 3+ is always satisfied by the discard. We only need enough
  // tiles from hand (exact matches + jokers) to fill the remaining slots.
  // Pung: 3 total → need 2 from hand (exact + jokers)
  if (exact + jokers >= 2) claims.push('pung')
  // Kong: 4 total → need 3 from hand
  if (exact + jokers >= 3) claims.push('kong')
  // Quint: 5 total → need 4 from hand
  if (exact + jokers >= 4) claims.push('quint')
  // Sextet: 6 total → need 5 from hand
  if (exact + jokers >= 5) claims.push('sextet')

  // Mahjong: check if this tile would complete a winning hand
  const matchingHand = wouldCompleteHand(player.hand, player.exposed, discardedTile)
  if (matchingHand) {
    // Add mahjong as an option — player can still choose pung/kong instead
    // (unless it's a concealed hand, where only mahjong is valid)
    if (matchingHand.concealed && player.exposed.length === 0) {
      claims.length = 0
    }
    claims.push('mahjong')
  }

  return claims
}

// Get the tile IDs to use for a claim (auto-select best tiles)
export function getClaimTileIds(
  hand: Tile[],
  discardedTile: Tile,
  claimType: ClaimType
): TileId[] | null {
  const sizeNeeded: Record<ClaimType, number> = {
    pung: 2,
    kong: 3,
    quint: 4,
    sextet: 5,
    mahjong: 0, // handled separately
  }

  const needed = sizeNeeded[claimType]
  if (needed === 0) return null

  const { matchingIds, jokerIds } = countMatching(hand, discardedTile.type)

  // Use real tiles first, then jokers
  const selected: TileId[] = []
  for (const id of matchingIds) {
    if (selected.length >= needed) break
    selected.push(id)
  }
  for (const id of jokerIds) {
    if (selected.length >= needed) break
    selected.push(id)
  }

  return selected.length >= needed ? selected : null
}

// Execute a claim: remove tiles from hand, create exposed group, mark discard claimed.
// Sets awaitingDiscardAfterClaim = true so rearrangeExposure is permitted until discard.
export function executeClaim(
  state: DemoGameState,
  claimerId: string,
  discardIndex: number,
  claimType: ClaimType,
  tileIdsFromHand: TileId[]
): DemoGameState | null {
  const claimer = state.gameState.players.find((p) => p.id === claimerId)
  if (!claimer) return null
  // Dead players cannot claim.
  if (claimer.isDead) return null

  const discard = state.gameState.discardPile[discardIndex]
  if (!discard || discard.claimed) return null

  // Build the exposed group
  const tilesFromHand = tileIdsFromHand
    .map((id) => claimer.hand.find((t) => t.id === id))
    .filter((t): t is Tile => t !== undefined)

  if (tilesFromHand.length !== tileIdsFromHand.length) return null

  const group: ExposedGroup = {
    tiles: [discard.tile, ...tilesFromHand],
    claimType,
    claimedFrom: discard.discardedBy,
    representsTileType: discard.tile.type, // track what this group represents for joker swaps
  }

  // Remove used tiles from claimer's hand
  const remainingHand = claimer.hand.filter(
    (t) => !tileIdsFromHand.includes(t.id)
  )

  // Update discard pile — mark as claimed
  const updatedDiscardPile = state.gameState.discardPile.map((entry, i) =>
    i === discardIndex ? { ...entry, claimed: true } : entry
  )

  // Update players
  const updatedPlayers = state.gameState.players.map((p) =>
    p.id === claimerId
      ? { ...p, hand: remainingHand, exposed: [...p.exposed, group] }
      : p
  )

  // Claimer becomes current turn (they need to discard)
  return {
    wall: state.wall,
    gameState: {
      ...state.gameState,
      players: updatedPlayers,
      discardPile: updatedDiscardPile,
      currentTurn: claimerId,
      awaitingDiscardAfterClaim: true,
    },
  }
}

// ---------------------------------------------------------------------------
// Rearrange exposure (Claim Rule 8)
// ---------------------------------------------------------------------------
//
// After claiming a discard and exposing a group, the claimer may rearrange
// that group (swap real tile↔joker from hand) until they discard. Examples:
//   — Swap a joker into the exposure and pull a real tile back to hand
//   — Swap a joker out, replacing with a real tile they just drew/held
// Constraints:
//   - Actor is the current turn holder (the claimer).
//   - awaitingDiscardAfterClaim is true (not yet discarded).
//   - newTileIds come from the union of (current group tiles, actor's hand).
//   - Result size matches the claimType (pung=3, kong=4, etc.).
//   - Result still represents the group's original tile type (no type swaps).
export function rearrangeExposure(
  state: DemoGameState,
  playerId: string,
  groupIndex: number,
  newTileIds: TileId[]
): DemoGameState | null {
  if (state.gameState.currentTurn !== playerId) return null
  if (!state.gameState.awaitingDiscardAfterClaim) return null

  const player = state.gameState.players.find((p) => p.id === playerId)
  if (!player) return null
  if (player.isDead) return null

  const group = player.exposed[groupIndex]
  if (!group) return null
  // Auto-exposed flowers are not rearrangeable.
  if (group.claimType === 'flower') return null

  const requiredSize: Record<ClaimType, number> = {
    pung: 3,
    kong: 4,
    quint: 5,
    sextet: 6,
    mahjong: 0,
  }
  const expectedSize = requiredSize[group.claimType]
  if (expectedSize === 0) return null
  if (newTileIds.length !== expectedSize) return null

  // Pool of tiles available to form the new arrangement: group + hand.
  const pool: Tile[] = [...group.tiles, ...player.hand]
  const poolById = new Map(pool.map((t) => [t.id, t] as const))

  // Every requested tile must be in the pool, and each used at most once.
  const newTiles: Tile[] = []
  const usedIds = new Set<TileId>()
  for (const id of newTileIds) {
    if (usedIds.has(id)) return null
    const t = poolById.get(id)
    if (!t) return null
    newTiles.push(t)
    usedIds.add(id)
  }

  // Validate the rearrangement still represents the same tile type.
  // We need at least one real (non-joker) tile that matches representsTileType,
  // or every tile matches (jokers count as wild for groups of 3+).
  const representsType = group.representsTileType
  if (!representsType) return null

  let realMatches = 0
  let jokers = 0
  for (const t of newTiles) {
    if (t.type.kind === 'joker') {
      jokers++
    } else if (tilesMatch(t.type, representsType)) {
      realMatches++
    } else {
      // Non-matching non-joker tile — invalid rearrangement.
      return null
    }
  }
  // Per NMJL rules, groups of 3+ must contain at least one real tile
  // (the original claimed discard guarantees this if retained, but jokers-only
  // arrangements are forbidden).
  if (realMatches === 0) return null
  // Sanity: all tiles must be accounted for.
  if (realMatches + jokers !== expectedSize) return null

  // Remaining tiles (pool minus newTiles) return to the hand.
  const leftover: Tile[] = pool.filter((t) => !usedIds.has(t.id))

  const newGroup: ExposedGroup = { ...group, tiles: newTiles }
  const newExposed = player.exposed.map((g, i) =>
    i === groupIndex ? newGroup : g
  )

  const updatedPlayers = state.gameState.players.map((p) =>
    p.id === playerId ? { ...p, hand: leftover, exposed: newExposed } : p
  )

  return {
    wall: state.wall,
    gameState: {
      ...state.gameState,
      players: updatedPlayers,
    },
  }
}

// ---------------------------------------------------------------------------
// Dead-hand check
// ---------------------------------------------------------------------------
//
// A player is dead if their tile count is invalid at a turn boundary. Valid
// counts:
//   13 — post-discard resting (non-dealer) and pre-draw dealer after first discard
//   14 — pre-discard resting (dealer before first discard; after-claim during turn)
//   15 — transient during one's own turn (drew, haven't yet discarded / joker-swapped)
// Anything else at the next turn boundary => dead.
export function checkDeadHand(player: PlayerState): boolean {
  const handTiles = player.hand.length
  const exposedTiles = player.exposed.reduce((sum, g) => sum + g.tiles.length, 0)
  const total = handTiles + exposedTiles

  // Allow 13, 14, 15; anything else is dead.
  if (total < 13 || total > 15) return true

  return false
}

// Evaluate bot claims — returns the best claim a bot can make, or null
export function evaluateBotClaim(
  bot: PlayerState,
  discardedTile: Tile
): ClaimType | null {
  const claims = getValidClaims(bot, discardedTile)
  if (claims.length === 0) return null

  // Bots always claim the highest available group
  // Priority: mahjong > sextet > quint > kong > pung
  const priority: ClaimType[] = ['mahjong', 'sextet', 'quint', 'kong', 'pung']
  for (const claim of priority) {
    if (claims.includes(claim)) return claim
  }
  return null
}

// ---------------------------------------------------------------------------
// Claim priority resolver (Claim Rules 4-7)
// ---------------------------------------------------------------------------
//
// Pending claims collected during the discard window are resolved here.
// Priority:
//   1. A Mahjong claim beats any exposure (pung/kong/quint/sextet) claim,
//      regardless of "who claimed first".
//   2. Among same-priority claims (all Mahjong OR all exposure), the winner is
//      the claimer closest to the LEFT of the discarder — i.e. the next seat
//      in turn order (counter-clockwise). Ties resolved by traversing
//      turnOrder starting from (discarderIndex + 1) % length.
//
// Returns null if `claims` is empty.
export type PendingClaim = {
  claimerId: string
  claimType: ClaimType
  tileIds: TileId[]
  declaredAt: number // timestamp; ordering tiebreaker below seat-priority
}

export function resolveClaims(
  state: GameState,
  discardIndex: number,
  claims: PendingClaim[]
): PendingClaim | null {
  if (claims.length === 0) return null

  const discard = state.discardPile[discardIndex]
  if (!discard) return null

  // Drop any claims from dead players defensively.
  const live = claims.filter((c) => {
    const p = state.players.find((pp) => pp.id === c.claimerId)
    return p !== undefined && !p.isDead
  })
  if (live.length === 0) return null

  // Step 1: Mahjong beats any exposure.
  const mahjongClaims = live.filter((c) => c.claimType === 'mahjong')
  const candidates = mahjongClaims.length > 0 ? mahjongClaims : live

  // Step 2: closest to LEFT of discarder (next in turn order) wins.
  const turnOrder = state.turnOrder
  const discarderIndex = turnOrder.indexOf(discard.discardedBy)
  if (discarderIndex === -1) return candidates[0] ?? null

  for (let step = 1; step <= turnOrder.length; step++) {
    const seatId = turnOrder[(discarderIndex + step) % turnOrder.length]
    const match = candidates.find((c) => c.claimerId === seatId)
    if (match) return match
  }

  return candidates[0] ?? null
}
