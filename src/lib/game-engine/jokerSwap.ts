// Joker swap: on your turn, swap a joker from any exposed group with the tile it represents

import type { Tile, TileId } from '../tiles/constants'
import { tilesMatch } from '../tiles/constants'
import type { ExposedGroup, PlayerState } from './types'
import type { DemoGameState } from './engine'

// Check if a tile in hand can replace a joker in a specific exposed group
export function canSwapJokerInGroup(
  tileFromHand: Tile,
  group: ExposedGroup
): boolean {
  // Can't swap jokers with jokers
  if (tileFromHand.type.kind === 'joker') return false

  // Group must contain at least one joker
  const hasJoker = group.tiles.some((t) => t.type.kind === 'joker')
  if (!hasJoker) return false

  // Use representsTileType if available (tracks what the group represents)
  if (group.representsTileType) {
    return tilesMatch(tileFromHand.type, group.representsTileType)
  }

  // Fallback: check against non-joker tiles in the group
  const nonJokerTile = group.tiles.find((t) => t.type.kind !== 'joker')
  if (!nonJokerTile) {
    // All jokers with no representsTileType — can't determine what to swap
    return false
  }

  return tilesMatch(tileFromHand.type, nonJokerTile.type)
}

// Find all possible joker swaps for a player
export function findJokerSwaps(
  player: PlayerState,
  allPlayers: PlayerState[]
): Array<{
  handTileId: TileId
  targetPlayerId: string
  groupIndex: number
  jokerTileId: TileId
}> {
  const swaps: Array<{
    handTileId: TileId
    targetPlayerId: string
    groupIndex: number
    jokerTileId: TileId
  }> = []

  for (const handTile of player.hand) {
    if (handTile.type.kind === 'joker') continue

    for (const target of allPlayers) {
      for (let gi = 0; gi < target.exposed.length; gi++) {
        const group = target.exposed[gi]
        if (!canSwapJokerInGroup(handTile, group)) continue

        const joker = group.tiles.find((t) => t.type.kind === 'joker')
        if (!joker) continue

        swaps.push({
          handTileId: handTile.id,
          targetPlayerId: target.id,
          groupIndex: gi,
          jokerTileId: joker.id,
        })
      }
    }
  }

  return swaps
}

// Execute a joker swap — returns new state + the tile ID that cannot be discarded this turn
export function executeJokerSwap(
  state: DemoGameState,
  playerId: string,
  handTileId: TileId,
  targetPlayerId: string,
  groupIndex: number,
  jokerTileId: TileId
): { state: DemoGameState; noDiscardTileId: TileId } | null {
  const player = state.gameState.players.find((p) => p.id === playerId)
  if (!player) return null

  // Must be player's turn
  if (state.gameState.currentTurn !== playerId) return null

  const handTile = player.hand.find((t) => t.id === handTileId)
  if (!handTile) return null

  const target = state.gameState.players.find((p) => p.id === targetPlayerId)
  if (!target) return null

  const group = target.exposed[groupIndex]
  if (!group) return null

  if (!canSwapJokerInGroup(handTile, group)) return null

  const jokerTile = group.tiles.find((t) => t.id === jokerTileId)
  if (!jokerTile || jokerTile.type.kind !== 'joker') return null

  // Replace joker in group with handTile
  const newGroupTiles = group.tiles.map((t) =>
    t.id === jokerTileId ? handTile : t
  )

  // Remove handTile from player's hand, add joker
  const newHand = player.hand.filter((t) => t.id !== handTileId)
  newHand.push(jokerTile)

  // Update players
  const updatedPlayers = state.gameState.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, hand: newHand }
    }
    if (p.id === targetPlayerId) {
      const newExposed = p.exposed.map((g, i) =>
        i === groupIndex ? { ...g, tiles: newGroupTiles } : g
      )
      return { ...p, exposed: newExposed }
    }
    return p
  })

  return {
    state: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players: updatedPlayers,
      },
    },
    // The tile used for the swap cannot be discarded this turn
    noDiscardTileId: handTileId,
  }
}
