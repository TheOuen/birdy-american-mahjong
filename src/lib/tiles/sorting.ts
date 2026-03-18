// Hand sorting utility for American Mahjong
// Sort order: Flowers → Suits (bam, crak, dot by number) → Winds (E, S, W, N) → Dragons (R, G, W) → Jokers

import type { Tile, TileType, Suit, WindDirection, DragonColor } from '@/lib/tiles/constants'

const KIND_ORDER: Record<TileType['kind'], number> = {
  flower: 0,
  suit: 1,
  wind: 2,
  dragon: 3,
  joker: 4,
}

const SUIT_ORDER: Record<Suit, number> = {
  bam: 0,
  crak: 1,
  dot: 2,
}

const WIND_ORDER: Record<WindDirection, number> = {
  east: 0,
  south: 1,
  west: 2,
  north: 3,
}

const DRAGON_ORDER: Record<DragonColor, number> = {
  red: 0,
  green: 1,
  white: 2,
}

function getTileSortKey(type: TileType): number {
  const kindBase = KIND_ORDER[type.kind] * 1000

  switch (type.kind) {
    case 'flower':
      return kindBase + type.number
    case 'suit':
      return kindBase + SUIT_ORDER[type.suit] * 100 + type.number
    case 'wind':
      return kindBase + WIND_ORDER[type.direction]
    case 'dragon':
      return kindBase + DRAGON_ORDER[type.color]
    case 'joker':
      return kindBase
  }
}

/** Sort a hand of tiles in standard display order:
 *  Flowers (by number) → Suits grouped by suit (bam, crak, dot) then by number →
 *  Winds (east, south, west, north) → Dragons (red, green, white) → Jokers
 */
export function sortHand(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => getTileSortKey(a.type) - getTileSortKey(b.type))
}
