// Claim validation and execution for discard claims (Pung, Kong, Quint, Sextet)

import type { Tile, TileId, TileType } from '../tiles/constants'
import { tilesMatch } from '../tiles/constants'
import type { PlayerState, ClaimType, ExposedGroup, DiscardEntry } from './types'
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

  const { exact, jokers } = countMatching(player.hand, discardedTile.type)
  // Need N-1 from hand (discard provides 1)
  const claims: ClaimType[] = []

  // Pung: 3 total → need 2 from hand
  if (exact + jokers >= 2 && exact >= 1) claims.push('pung')
  // Kong: 4 total → need 3 from hand
  if (exact + jokers >= 3 && exact >= 1) claims.push('kong')
  // Quint: 5 total → need 4 from hand
  if (exact + jokers >= 4 && exact >= 1) claims.push('quint')
  // Sextet: 6 total → need 5 from hand
  if (exact + jokers >= 5 && exact >= 1) claims.push('sextet')

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

// Execute a claim: remove tiles from hand, create exposed group, mark discard claimed
export function executeClaim(
  state: DemoGameState,
  claimerId: string,
  discardIndex: number,
  claimType: ClaimType,
  tileIdsFromHand: TileId[]
): DemoGameState | null {
  const claimer = state.gameState.players.find((p) => p.id === claimerId)
  if (!claimer) return null

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
    },
  }
}

// Check if a player's hand is dead (wrong tile count or invalid exposed groups)
export function checkDeadHand(player: PlayerState): boolean {
  const handTiles = player.hand.length
  const exposedTiles = player.exposed.reduce((sum, g) => sum + g.tiles.length, 0)
  const total = handTiles + exposedTiles

  // A valid hand always has exactly 14 tiles total (hand + exposed)
  // Exception: during a turn when player has drawn but not discarded, they have 15
  // We check for clearly invalid states
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
