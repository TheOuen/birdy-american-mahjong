// NMJL Hand Pattern Matcher
// Parses pattern strings and checks if a player's tiles match any winning hand

import type { Tile, TileType, Suit } from '../tiles/constants'
import { tilesMatch } from '../tiles/constants'
import type { ExposedGroup } from '../game-engine/types'
import type { NmjlHand } from './types'
import { NMJL_2025_HANDS } from './hands'

// A parsed group from a pattern
type ParsedGroup = {
  count: number
  kind: 'flower' | 'suit' | 'wind' | 'dragon' | 'joker' | 'news'
  // For suit groups: the number slot (groups with same number must use same value)
  numberSlot?: number
  // For wind groups: specific direction or 'any'
  windDirection?: 'east' | 'south' | 'west' | 'north' | 'any'
  // For dragon groups: specific color or 'any'
  dragonColor?: 'red' | 'green' | 'white' | 'any'
  // Fixed number (e.g., in "2025" pattern, the digits are fixed)
  fixedNumber?: number
}

// Parse a pattern string into groups
export function parsePattern(pattern: string): ParsedGroup[] {
  const groups: ParsedGroup[] = []
  // Remove decorative characters
  const cleaned = pattern.replace(/[+=]/g, ' ').replace(/\s+/g, ' ').trim()
  const tokens = cleaned.split(' ')

  let numberSlotCounter = 0
  const numberSlotMap = new Map<string, number>() // maps digit chars to slot IDs

  for (const token of tokens) {
    if (token === '') continue

    // All F's = flowers
    if (/^F+$/.test(token)) {
      groups.push({ count: token.length, kind: 'flower' })
      continue
    }

    // All D's = dragons
    if (/^D+$/.test(token)) {
      groups.push({ count: token.length, kind: 'dragon', dragonColor: 'any' })
      continue
    }

    // NEWS = one of each wind
    if (token === 'NEWS') {
      groups.push({ count: 1, kind: 'wind', windDirection: 'north' })
      groups.push({ count: 1, kind: 'wind', windDirection: 'east' })
      groups.push({ count: 1, kind: 'wind', windDirection: 'west' })
      groups.push({ count: 1, kind: 'wind', windDirection: 'south' })
      continue
    }

    // Wind characters
    if (/^[NESW]+$/.test(token)) {
      const windMap: Record<string, 'north' | 'east' | 'south' | 'west'> = {
        N: 'north', E: 'east', S: 'south', W: 'west',
      }
      // Group consecutive same winds
      let i = 0
      while (i < token.length) {
        const ch = token[i]
        let count = 0
        while (i < token.length && token[i] === ch) { count++; i++ }
        groups.push({ count, kind: 'wind', windDirection: windMap[ch] })
      }
      continue
    }

    // Digit sequences = suit tile groups
    if (/^[0-9]+$/.test(token)) {
      // Check if all same digit (like "222", "5555")
      const allSame = token.split('').every((c) => c === token[0])

      if (allSame) {
        const digit = token[0]
        // Get or create number slot for this digit
        if (!numberSlotMap.has(digit)) {
          numberSlotMap.set(digit, numberSlotCounter++)
        }
        if (digit === '0') {
          // "0" means matching number — use a special slot
          groups.push({
            count: token.length,
            kind: 'suit',
            numberSlot: numberSlotMap.get(digit)!,
          })
        } else {
          groups.push({
            count: token.length,
            kind: 'suit',
            numberSlot: numberSlotMap.get(digit)!,
            fixedNumber: parseInt(digit),
          })
        }
      } else {
        // Mixed digits like "2025", "2468", "135" — each digit is a single suit tile
        for (const digit of token) {
          if (!numberSlotMap.has(digit)) {
            numberSlotMap.set(digit, numberSlotCounter++)
          }
          groups.push({
            count: 1,
            kind: 'suit',
            numberSlot: numberSlotMap.get(digit)!,
            fixedNumber: digit === '0' ? undefined : parseInt(digit),
          })
        }
      }
      continue
    }

    // Mixed token with digits and letters (like "112345" in consecutive run hands)
    // Parse character by character
    let i = 0
    while (i < token.length) {
      const ch = token[i]
      if (ch === 'F') {
        let count = 0
        while (i < token.length && token[i] === 'F') { count++; i++ }
        groups.push({ count, kind: 'flower' })
      } else if (ch === 'D') {
        let count = 0
        while (i < token.length && token[i] === 'D') { count++; i++ }
        groups.push({ count, kind: 'dragon', dragonColor: 'any' })
      } else if (/[NESW]/.test(ch)) {
        const windMap: Record<string, 'north' | 'east' | 'south' | 'west'> = {
          N: 'north', E: 'east', S: 'south', W: 'west',
        }
        let count = 0
        while (i < token.length && token[i] === ch) { count++; i++ }
        groups.push({ count, kind: 'wind', windDirection: windMap[ch] })
      } else if (/[0-9]/.test(ch)) {
        let count = 0
        const digit = ch
        while (i < token.length && token[i] === digit) { count++; i++ }
        if (!numberSlotMap.has(digit)) {
          numberSlotMap.set(digit, numberSlotCounter++)
        }
        groups.push({
          count,
          kind: 'suit',
          numberSlot: numberSlotMap.get(digit)!,
          fixedNumber: digit === '0' ? undefined : parseInt(digit),
        })
      } else {
        i++ // skip unknown
      }
    }
  }

  return groups
}

// Count tiles by type in a collection
type TileCount = {
  flowers: number
  jokers: number
  suits: Map<string, number> // "bam-3" → count
  winds: Map<string, number> // "east" → count
  dragons: Map<string, number> // "red" → count
}

function countTiles(tiles: Tile[]): TileCount {
  const result: TileCount = {
    flowers: 0,
    jokers: 0,
    suits: new Map(),
    winds: new Map(),
    dragons: new Map(),
  }

  for (const t of tiles) {
    switch (t.type.kind) {
      case 'flower':
        result.flowers++
        break
      case 'joker':
        result.jokers++
        break
      case 'suit': {
        const key = `${t.type.suit}-${t.type.number}`
        result.suits.set(key, (result.suits.get(key) ?? 0) + 1)
        break
      }
      case 'wind':
        result.winds.set(t.type.direction, (result.winds.get(t.type.direction) ?? 0) + 1)
        break
      case 'dragon':
        result.dragons.set(t.type.color, (result.dragons.get(t.type.color) ?? 0) + 1)
        break
    }
  }

  return result
}

// Get all tiles a player has (hand + exposed)
function getAllPlayerTiles(hand: Tile[], exposed: ExposedGroup[]): Tile[] {
  const all = [...hand]
  for (const group of exposed) {
    all.push(...group.tiles)
  }
  return all
}

const SUITS: Suit[] = ['bam', 'crak', 'dot']

// Try to match tiles against a parsed pattern
// This is a constraint satisfaction problem — we try all valid suit/number assignments
function tryMatch(
  groups: ParsedGroup[],
  counts: TileCount,
  jokerCount: number
): boolean {
  // Calculate total tiles needed
  const totalNeeded = groups.reduce((sum, g) => sum + g.count, 0)
  if (totalNeeded !== 14) return false // all NMJL hands are 14 tiles

  // Try to satisfy each group, tracking jokers used
  // We need to try different suit assignments for suit groups
  // This is exponential in theory but manageable for 14-tile hands

  // Collect unique number slots and their constraints
  const numberSlots = new Map<number, { fixedNumber?: number; groups: ParsedGroup[] }>()
  for (const g of groups) {
    if (g.kind === 'suit' && g.numberSlot !== undefined) {
      if (!numberSlots.has(g.numberSlot)) {
        numberSlots.set(g.numberSlot, { fixedNumber: g.fixedNumber, groups: [] })
      }
      numberSlots.get(g.numberSlot)!.groups.push(g)
      if (g.fixedNumber !== undefined) {
        numberSlots.get(g.numberSlot)!.fixedNumber = g.fixedNumber
      }
    }
  }

  // For variable number slots, try all possible values (1-9)
  const slotIds = [...numberSlots.keys()]
  const slotValues = new Map<number, number>()

  // Set fixed values
  for (const [id, info] of numberSlots) {
    if (info.fixedNumber !== undefined) {
      slotValues.set(id, info.fixedNumber)
    }
  }

  // Get variable slots
  const variableSlots = slotIds.filter((id) => !slotValues.has(id))

  // Try all possible values for variable slots
  function trySlotAssignment(idx: number): boolean {
    if (idx >= variableSlots.length) {
      // All slots assigned — try suit assignments
      return trySuitAssignment(groups, slotValues, counts, jokerCount)
    }

    const slotId = variableSlots[idx]
    for (let num = 1; num <= 9; num++) {
      // Check not already used by another slot with same fixed number
      slotValues.set(slotId, num)
      if (trySlotAssignment(idx + 1)) return true
    }
    slotValues.delete(slotId)
    return false
  }

  return trySlotAssignment(0)
}

function trySuitAssignment(
  groups: ParsedGroup[],
  slotValues: Map<number, number>,
  counts: TileCount,
  totalJokers: number
): boolean {
  // For each suit group, we need to assign a suit
  // Collect all suit groups and try assignments
  const suitGroups = groups.filter((g) => g.kind === 'suit')
  const otherGroups = groups.filter((g) => g.kind !== 'suit')

  // First check non-suit groups can be satisfied
  let jokersUsed = 0

  for (const g of otherGroups) {
    if (g.kind === 'flower') {
      const available = counts.flowers
      const needed = g.count
      if (available >= needed) continue
      const deficit = needed - available
      jokersUsed += deficit
    } else if (g.kind === 'wind') {
      const dir = g.windDirection!
      const available = counts.winds.get(dir) ?? 0
      const needed = g.count
      if (available >= needed) continue
      // Jokers only allowed in groups of 3+
      if (g.count < 3) {
        if (available < needed) return false
      } else {
        const deficit = needed - available
        jokersUsed += deficit
      }
    } else if (g.kind === 'dragon') {
      if (g.dragonColor === 'any') {
        let found = false
        for (const color of ['red', 'green', 'white']) {
          const available = counts.dragons.get(color) ?? 0
          if (g.count < 3) {
            if (available >= g.count) { found = true; break }
          } else {
            const deficit = Math.max(0, g.count - available)
            if (deficit <= (totalJokers - jokersUsed)) {
              jokersUsed += deficit // properly deduct jokers used for dragons
              found = true
              break
            }
          }
        }
        if (!found) return false
      } else {
        // Specific dragon color
        const available = counts.dragons.get(g.dragonColor!) ?? 0
        if (g.count < 3) {
          if (available < g.count) return false
        } else {
          const deficit = Math.max(0, g.count - available)
          jokersUsed += deficit
        }
      }
    }
  }

  if (jokersUsed > totalJokers) return false

  // Now try suit assignments for suit groups
  // Each suit group needs: a suit + a number (from slotValues)
  // Try all possible suit assignments
  const suitAssignments: Array<{ group: ParsedGroup; suit: Suit; number: number }> = []

  function trySuitGroup(idx: number, usedJokers: number): boolean {
    if (idx >= suitGroups.length) {
      return usedJokers <= totalJokers
    }

    const g = suitGroups[idx]
    const num = slotValues.get(g.numberSlot!)!
    if (!num || num < 1 || num > 9) return false

    for (const suit of SUITS) {
      const key = `${suit}-${num}`
      const available = counts.suits.get(key) ?? 0

      // For pairs (count === 2), jokers not allowed
      if (g.count <= 2) {
        if (available >= g.count) {
          suitAssignments.push({ group: g, suit, number: num })
          if (trySuitGroup(idx + 1, usedJokers)) return true
          suitAssignments.pop()
        }
      } else {
        // Groups of 3+: jokers allowed
        if (available + (totalJokers - usedJokers) >= g.count) {
          const deficit = Math.max(0, g.count - available)
          suitAssignments.push({ group: g, suit, number: num })
          if (trySuitGroup(idx + 1, usedJokers + deficit)) return true
          suitAssignments.pop()
        }
      }
    }

    return false
  }

  return trySuitGroup(0, jokersUsed)
}

// Check if a player's hand matches any NMJL pattern
export function findMatchingHands(
  hand: Tile[],
  exposed: ExposedGroup[]
): NmjlHand[] {
  const allTiles = getAllPlayerTiles(hand, exposed)
  if (allTiles.length !== 14) return []

  const counts = countTiles(allTiles)
  const matches: NmjlHand[] = []

  for (const nmjlHand of NMJL_2025_HANDS) {
    // If concealed, player must have no exposed groups
    if (nmjlHand.concealed && exposed.length > 0) continue

    const groups = parsePattern(nmjlHand.pattern)
    if (tryMatch(groups, counts, counts.jokers)) {
      matches.push(nmjlHand)
    }
  }

  return matches
}

// Quick check: does the player have a winning hand?
export function hasWinningHand(
  hand: Tile[],
  exposed: ExposedGroup[]
): boolean {
  return findMatchingHands(hand, exposed).length > 0
}

// Check if adding a specific tile would complete a winning hand
// hand = tiles in player's hand (NOT including exposed)
// The total must be exactly 14: hand + newTile + exposed tiles
export function wouldCompleteHand(
  hand: Tile[],
  exposed: ExposedGroup[],
  newTile: Tile
): NmjlHand | null {
  // Build the complete set of tiles (hand + new tile + exposed)
  const allTiles = [...hand, newTile]
  for (const group of exposed) {
    allTiles.push(...group.tiles)
  }
  if (allTiles.length !== 14) return null

  const counts = countTiles(allTiles)

  for (const nmjlHand of NMJL_2025_HANDS) {
    if (nmjlHand.concealed && exposed.length > 0) continue
    const groups = parsePattern(nmjlHand.pattern)
    if (tryMatch(groups, counts, counts.jokers)) {
      return nmjlHand
    }
  }
  return null
}
