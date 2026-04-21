// Tile definitions for American Mahjong (152 tiles total)

export type Suit = 'bam' | 'crak' | 'dot'
export type WindDirection = 'east' | 'west' | 'north' | 'south'
export type DragonColor = 'red' | 'green' | 'white'

export type TileType =
  | { kind: 'suit'; suit: Suit; number: number }
  | { kind: 'wind'; direction: WindDirection }
  | { kind: 'dragon'; color: DragonColor }
  | { kind: 'flower'; number: number }
  | { kind: 'joker' }
  // Blanks variant only — wild tile that can be exchanged for any DEAD discard.
  // Never allowed in exposures, cannot mahjong on a blank, cannot be passed in Charleston.
  | { kind: 'blank' }

export type TileId = string // e.g. "bam-3-0", "wind-east-2", "joker-5"

export type Tile = {
  id: TileId
  type: TileType
}

// Suit tile labels
export const SUITS: Suit[] = ['bam', 'crak', 'dot']
export const SUIT_LABELS: Record<Suit, string> = {
  bam: 'Bamboo',
  crak: 'Character',
  dot: 'Circle',
}

// Wind tile labels
export const WINDS: WindDirection[] = ['east', 'south', 'west', 'north']
export const WIND_LABELS: Record<WindDirection, string> = {
  east: 'East',
  south: 'South',
  west: 'West',
  north: 'North',
}

// Dragon tile labels
export const DRAGONS: DragonColor[] = ['red', 'green', 'white']
export const DRAGON_LABELS: Record<DragonColor, string> = {
  red: 'Red Dragon',
  green: 'Green Dragon',
  white: 'White Dragon',
}

// Generate the full 152-tile set
export function createTileSet(): Tile[] {
  const tiles: Tile[] = []
  let index = 0

  // Suit tiles: 3 suits x 9 numbers x 4 copies = 108
  for (const suit of SUITS) {
    for (let num = 1; num <= 9; num++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `${suit}-${num}-${copy}`,
          type: { kind: 'suit', suit, number: num },
        })
        index++
      }
    }
  }

  // Wind tiles: 4 directions x 4 copies = 16
  for (const direction of WINDS) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `wind-${direction}-${copy}`,
        type: { kind: 'wind', direction },
      })
      index++
    }
  }

  // Dragon tiles: 3 colors x 4 copies = 12
  for (const color of DRAGONS) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `dragon-${color}-${copy}`,
        type: { kind: 'dragon', color },
      })
      index++
    }
  }

  // Flower tiles: 4 numbers x 2 copies = 8
  for (let num = 1; num <= 4; num++) {
    for (let copy = 0; copy < 2; copy++) {
      tiles.push({
        id: `flower-${num}-${copy}`,
        type: { kind: 'flower', number: num },
      })
      index++
    }
  }

  // Joker tiles: 8
  for (let copy = 0; copy < 8; copy++) {
    tiles.push({
      id: `joker-${copy}`,
      type: { kind: 'joker' },
    })
    index++
  }

  return tiles
}

// Utility: get display label for a tile
export function getTileLabel(type: TileType): string {
  switch (type.kind) {
    case 'suit':
      return `${type.number} ${SUIT_LABELS[type.suit]}`
    case 'wind':
      return WIND_LABELS[type.direction]
    case 'dragon':
      return DRAGON_LABELS[type.color]
    case 'flower':
      return `Flower ${type.number}`
    case 'joker':
      return 'Joker'
    case 'blank':
      return 'Blank'
  }
}

// Utility: get short label for a tile (used in game UI)
export function getTileShortLabel(type: TileType): string {
  switch (type.kind) {
    case 'suit':
      return `${type.number}${type.suit[0].toUpperCase()}`
    case 'wind':
      return type.direction[0].toUpperCase()
    case 'dragon':
      return type.color === 'white' ? 'W' : type.color[0].toUpperCase()
    case 'flower':
      return `F${type.number}`
    case 'joker':
      return 'J'
    case 'blank':
      return 'B'
  }
}

// Check if two tile types are the same (ignoring copy index)
export function tilesMatch(a: TileType, b: TileType): boolean {
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case 'suit':
      return a.suit === (b as typeof a).suit && a.number === (b as typeof a).number
    case 'wind':
      return a.direction === (b as typeof a).direction
    case 'dragon':
      return a.color === (b as typeof a).color
    case 'flower':
      return true // all flowers are interchangeable per NMJL rules
    case 'joker':
      return true
    case 'blank':
      // All blanks are interchangeable (blanks variant only)
      return true
  }
}

// Build the alternate 160-tile set for the Blanks variant:
// 108 suits + 16 winds + 12 dragons + 8 flowers + 10 jokers + 6 blanks = 160
export function createBlanksVariantTileSet(): Tile[] {
  const tiles: Tile[] = []

  // Suit tiles: 3 suits x 9 numbers x 4 copies = 108
  for (const suit of SUITS) {
    for (let num = 1; num <= 9; num++) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `${suit}-${num}-${copy}`,
          type: { kind: 'suit', suit, number: num },
        })
      }
    }
  }

  // Wind tiles: 4 directions x 4 copies = 16
  for (const direction of WINDS) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `wind-${direction}-${copy}`,
        type: { kind: 'wind', direction },
      })
    }
  }

  // Dragon tiles: 3 colors x 4 copies = 12
  for (const color of DRAGONS) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `dragon-${color}-${copy}`,
        type: { kind: 'dragon', color },
      })
    }
  }

  // Flower tiles: 4 numbers x 2 copies = 8
  for (let num = 1; num <= 4; num++) {
    for (let copy = 0; copy < 2; copy++) {
      tiles.push({
        id: `flower-${num}-${copy}`,
        type: { kind: 'flower', number: num },
      })
    }
  }

  // Joker tiles: 10 (vs 8 in standard)
  for (let copy = 0; copy < 10; copy++) {
    tiles.push({
      id: `joker-${copy}`,
      type: { kind: 'joker' },
    })
  }

  // Blank tiles: 6 (variant-exclusive)
  for (let copy = 0; copy < 6; copy++) {
    tiles.push({
      id: `blank-${copy}`,
      type: { kind: 'blank' },
    })
  }

  return tiles
}
