// NMJL Hand Pattern Matcher
// Parses pattern strings and checks if a player's tiles match any winning hand.
//
// Supports NMJL 2025 and 2026 cards. The default dataset is chosen via
// `getActiveCard()` from registry.ts; callers may pin to a specific year.
//
// This file implements:
//   * Pattern tokenisation — splits e.g. `222 000 2222 6666` into typed groups.
//     The token `0`/`00`/`000`/`0000` means White Dragon (Soap), NOT a
//     variable-number suit slot. See parsePattern().
//   * Structured suits-rule enforcement — parses the English "Any 3 Suits,
//     Like Kongs w Matching Dragons" text into a SuitsConstraint object and
//     enforces it during matching. See parseSuitsRule() / trySuitAssignment().
//   * Colour-group enforcement — all tokens sharing a colour on the physical
//     NMJL card must end up in a single suit; the hand's total distinct-suit
//     count must match the suitsRule.
//
// Public API:
//   parsePattern(pattern)        → ParsedGroup[]
//   parseSuitsRule(raw)          → SuitsConstraint
//   findMatchingHands(hand, exp) → MatchResult[]   { hand: NmjlHand; jokersUsed: number }
//   hasWinningHand(hand, exp)    → boolean
//   wouldCompleteHand(h, e, t)   → { hand, jokersUsed } | null

import type { Tile, Suit, DragonColor } from '../tiles/constants'
import type { ExposedGroup } from '../game-engine/types'
import type {
  NmjlHand,
  SuitsConstraint,
  ColourGroup,
} from './types'
import { getActiveCard } from './registry'
import type { CardYear } from './registry'

// A parsed group from a pattern
export type ParsedGroup = {
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
  // Index of this group in the original pattern (0-based), used to resolve
  // colourGroup token indices onto the pattern's tokens.
  tokenIndex?: number
}

// Parse a pattern string into groups.
//
// Key rule: `0`/`00`/`000`/`0000` is ALWAYS White Dragon (Soap). The 2025/2026
// cards use 0 as both a digit-in-the-year-label (e.g. "2026" — where 0 is a
// White Dragon single) and as a run of soaps (e.g. "000" — three White
// Dragons). We emit a dragon group with dragonColor='white' in both cases.
export function parsePattern(pattern: string): ParsedGroup[] {
  const groups: ParsedGroup[] = []
  // Remove decorative characters
  const cleaned = pattern.replace(/[+=]/g, ' ').replace(/\s+/g, ' ').trim()
  const tokens = cleaned.split(' ')

  let numberSlotCounter = 0
  const numberSlotMap = new Map<string, number>() // maps digit chars to slot IDs

  // Helper: register a digit for a variable-number slot (non-zero digits only).
  const slotFor = (digit: string): number => {
    if (!numberSlotMap.has(digit)) {
      numberSlotMap.set(digit, numberSlotCounter++)
    }
    return numberSlotMap.get(digit)!
  }

  // Emit a consecutive run of the same char from token starting at i.
  // Returns the end index.
  const emitRun = (
    token: string,
    i: number,
    emit: (ch: string, count: number) => void
  ): number => {
    const ch = token[i]
    let count = 0
    while (i < token.length && token[i] === ch) { count++; i++ }
    emit(ch, count)
    return i
  }

  for (let ti = 0; ti < tokens.length; ti++) {
    const token = tokens[ti]
    if (token === '') continue

    // All F's = flowers
    if (/^F+$/.test(token)) {
      groups.push({ count: token.length, kind: 'flower', tokenIndex: ti })
      continue
    }

    // All D's = dragons (colour resolved by matching/opposite constraint)
    if (/^D+$/.test(token)) {
      groups.push({ count: token.length, kind: 'dragon', dragonColor: 'any', tokenIndex: ti })
      continue
    }

    // NEWS = one of each wind (a wind single per direction)
    if (token === 'NEWS') {
      groups.push({ count: 1, kind: 'wind', windDirection: 'north', tokenIndex: ti })
      groups.push({ count: 1, kind: 'wind', windDirection: 'east', tokenIndex: ti })
      groups.push({ count: 1, kind: 'wind', windDirection: 'west', tokenIndex: ti })
      groups.push({ count: 1, kind: 'wind', windDirection: 'south', tokenIndex: ti })
      continue
    }

    // Pure wind tokens (NNNN, EE, NN SS, etc.)
    if (/^[NESW]+$/.test(token)) {
      const windMap: Record<string, 'north' | 'east' | 'south' | 'west'> = {
        N: 'north', E: 'east', S: 'south', W: 'west',
      }
      let i = 0
      while (i < token.length) {
        const ch = token[i]
        let count = 0
        while (i < token.length && token[i] === ch) { count++; i++ }
        groups.push({ count, kind: 'wind', windDirection: windMap[ch], tokenIndex: ti })
      }
      continue
    }

    // Pure digit tokens
    if (/^[0-9]+$/.test(token)) {
      const allSame = token.split('').every((c) => c === token[0])

      if (allSame) {
        const digit = token[0]
        if (digit === '0') {
          // 000 / 0000 etc. = run of White Dragons.
          groups.push({ count: token.length, kind: 'dragon', dragonColor: 'white', tokenIndex: ti })
        } else {
          groups.push({
            count: token.length,
            kind: 'suit',
            numberSlot: slotFor(digit),
            fixedNumber: parseInt(digit, 10),
            tokenIndex: ti,
          })
        }
      } else {
        // Mixed digits like "2025", "2026", "2468", "135". Each digit = 1 tile.
        for (const digit of token) {
          if (digit === '0') {
            // Single White Dragon (e.g. the 0 inside "2026").
            groups.push({ count: 1, kind: 'dragon', dragonColor: 'white', tokenIndex: ti })
          } else {
            groups.push({
              count: 1,
              kind: 'suit',
              numberSlot: slotFor(digit),
              fixedNumber: parseInt(digit, 10),
              tokenIndex: ti,
            })
          }
        }
      }
      continue
    }

    // Mixed alpha+digit token (e.g. "113579" as used in quints / 13579 hands)
    let i = 0
    while (i < token.length) {
      const ch = token[i]
      if (ch === 'F') {
        i = emitRun(token, i, (_ch, count) =>
          groups.push({ count, kind: 'flower', tokenIndex: ti })
        )
      } else if (ch === 'D') {
        i = emitRun(token, i, (_ch, count) =>
          groups.push({ count, kind: 'dragon', dragonColor: 'any', tokenIndex: ti })
        )
      } else if (/[NESW]/.test(ch)) {
        const windMap: Record<string, 'north' | 'east' | 'south' | 'west'> = {
          N: 'north', E: 'east', S: 'south', W: 'west',
        }
        i = emitRun(token, i, (ch2, count) =>
          groups.push({ count, kind: 'wind', windDirection: windMap[ch2], tokenIndex: ti })
        )
      } else if (/[0-9]/.test(ch)) {
        const digit = ch
        let count = 0
        while (i < token.length && token[i] === digit) { count++; i++ }
        if (digit === '0') {
          // White Dragon(s) inside a mixed alpha+digit token.
          groups.push({ count, kind: 'dragon', dragonColor: 'white', tokenIndex: ti })
        } else {
          groups.push({
            count,
            kind: 'suit',
            numberSlot: slotFor(digit),
            fixedNumber: parseInt(digit, 10),
            tokenIndex: ti,
          })
        }
      } else {
        i++ // skip unknown
      }
    }
  }

  return groups
}

// Parse the English "suitsRule" string into a structured constraint.
// This is best-effort pattern matching tuned to the 2025+2026 card wording.
export function parseSuitsRule(raw: string): SuitsConstraint {
  const s = raw.toLowerCase()
  const out: SuitsConstraint = { raw }

  // Suit count phrases ----------------------------------------------------
  if (/any 1 or 2 suits?/.test(s)) out.suitCount = '1 or 2'
  else if (/any 2 or 3 suits?/.test(s)) out.suitCount = '2 or 3'
  else if (/any 1 or 3 suits?/.test(s)) out.suitCount = '1 or 3'
  else if (/any 3 suits?/.test(s)) out.suitCount = 3
  else if (/any 2 suits?/.test(s)) out.suitCount = 2
  else if (/any 1 suit/.test(s)) out.suitCount = 1

  // Dragon correspondence -------------------------------------------------
  // "Opp." comes BEFORE "Matching" to avoid "matching dragon" matching "opp."
  // The plural "Dragons" is noted separately so hands like "111 333 5555 DD
  // DD (Any 3 Suits w Opp. Dragons)" can reject assignments where more than
  // one dragon group collides with its paired suit.
  if (/opp\.?\s*dragons/.test(s)) out.oppositeDragons = true
  else if (/opp\.?\s*dragon/.test(s)) out.oppositeDragon = true

  if (/matching\s*dragons/.test(s)) out.matchingDragon = true
  else if (/matching\s*dragon/.test(s)) out.matchingDragon = true

  // Consecutive / like / parity ------------------------------------------
  if (/consec\.?\s*nos?\.?/.test(s)) out.consecutive = true
  if (/any\s*(like\s*)?odd\s*nos?/.test(s) || /pairs?\s*any\s*like\s*odd/.test(s)) out.parity = 'odd'
  if (/any\s*(like\s*)?even\s*nos?/.test(s) || /pairs?\s*any\s*like\s*even/.test(s)) out.parity = 'even'
  if (/any\s*like\s*nos?/.test(s)) out.like = true

  // Winds-only pair constraint -------------------------------------------
  if (/east\s*and\s*west\s*only/.test(s)) out.windsOnly = ['east', 'west']
  else if (/west\s*and\s*east\s*only/.test(s)) out.windsOnly = ['east', 'west']
  else if (/north\s*and\s*south\s*only/.test(s)) out.windsOnly = ['north', 'south']
  else if (/south\s*and\s*north\s*only/.test(s)) out.windsOnly = ['north', 'south']

  // Pair / suit alignment -------------------------------------------------
  if (/pairs?\s*must\s*be\s*same\s*suit/.test(s)) out.pairsSameSuit = true

  return out
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

function getAllPlayerTiles(hand: Tile[], exposed: ExposedGroup[]): Tile[] {
  const all = [...hand]
  for (const group of exposed) {
    all.push(...group.tiles)
  }
  return all
}

const SUITS: Suit[] = ['bam', 'crak', 'dot']

// Map from suit → the dragon colour that "matches" it per NMJL convention.
// Bam ↔ Green, Crak ↔ Red, Dot ↔ White.
const SUIT_TO_DRAGON: Record<Suit, DragonColor> = {
  bam: 'green',
  crak: 'red',
  dot: 'white',
}

// Returns true iff `colourCount` is a legal total-distinct-suit count for the
// `suitCount` constraint.
function isSuitCountCompatible(
  colourCount: number,
  suitCount: SuitsConstraint['suitCount']
): boolean {
  if (suitCount === undefined || suitCount === 'any') return true
  if (typeof suitCount === 'number') return colourCount === suitCount
  switch (suitCount) {
    case '1 or 2': return colourCount === 1 || colourCount === 2
    case '2 or 3': return colourCount === 2 || colourCount === 3
    case '1 or 3': return colourCount === 1 || colourCount === 3
  }
  return true
}

// Result type — a matched hand + the number of jokers consumed.
// jokersUsed is load-bearing for the "Jokerless Mahjong" double bonus (Rule 7).
export type MatchResult = NmjlHand & { jokersUsed: number }

type TryMatchResult = { ok: true; jokersUsed: number } | { ok: false }

// tryMatch — the core constraint-satisfaction loop.
function tryMatch(
  nmjlHand: NmjlHand,
  groups: ParsedGroup[],
  counts: TileCount,
  jokerCount: number
): TryMatchResult {
  const totalNeeded = groups.reduce((sum, g) => sum + g.count, 0)
  if (totalNeeded !== 14) return { ok: false }

  const constraints: SuitsConstraint = nmjlHand.constraints ?? { raw: nmjlHand.suitsRule }

  // --- Winds-only gate: reject whole hand up-front -------------------------
  if (constraints.windsOnly) {
    for (const g of groups) {
      if (g.kind === 'wind' && g.windDirection && g.windDirection !== 'any' && !constraints.windsOnly.includes(g.windDirection)) {
        return { ok: false }
      }
    }
  }

  // --- Pre-enumerate number slots ------------------------------------------
  // A "slot" is a unique variable-number digit across the pattern. Fixed-
  // digit groups (e.g. "2222" meaning the literal number 2) are pinned.
  type SlotInfo = { fixedNumber?: number; groups: ParsedGroup[] }
  const numberSlots = new Map<number, SlotInfo>()
  for (const g of groups) {
    if (g.kind === 'suit' && g.numberSlot !== undefined) {
      const existing = numberSlots.get(g.numberSlot)
      if (!existing) {
        numberSlots.set(g.numberSlot, {
          fixedNumber: g.fixedNumber,
          groups: [g],
        })
      } else {
        existing.groups.push(g)
        if (g.fixedNumber !== undefined) existing.fixedNumber = g.fixedNumber
      }
    }
  }

  const slotIds = [...numberSlots.keys()]
  const slotValues = new Map<number, number>()
  for (const [id, info] of numberSlots) {
    if (info.fixedNumber !== undefined) slotValues.set(id, info.fixedNumber)
  }
  const variableSlots = slotIds.filter((id) => !slotValues.has(id))

  // --- Value-level constraints: like / parity / consecutive ---------------
  // These constrain the variable slots before we enumerate them.
  const variableSlotsValid = (): boolean => {
    const values = variableSlots.map((id) => slotValues.get(id)!)
    if (values.some((v) => v === undefined)) return true // still enumerating

    if (constraints.like && variableSlots.length >= 2) {
      if (!values.every((v) => v === values[0])) return false
    }
    if (constraints.parity) {
      const wanted = constraints.parity === 'even' ? 0 : 1
      if (!values.every((v) => v % 2 === wanted)) return false
    }
    if (constraints.consecutive && variableSlots.length >= 2) {
      const sorted = [...new Set(values)].sort((a, b) => a - b)
      // require N distinct values forming a run; length must equal distinct count
      if (sorted.length !== values.length && !constraints.like) {
        // Distinct consecutive values expected. If values aren't distinct,
        // rule fails unless "like" also specified (i.e. all-same).
        return false
      }
      for (let k = 1; k < sorted.length; k++) {
        if (sorted[k] !== sorted[k - 1] + 1) return false
      }
    }
    return true
  }

  // Try all value assignments for variable slots.
  function trySlotAssignment(idx: number): TryMatchResult {
    if (idx >= variableSlots.length) {
      if (!variableSlotsValid()) return { ok: false }
      return trySuitAssignment(nmjlHand, groups, slotValues, counts, jokerCount, constraints)
    }
    const slotId = variableSlots[idx]
    for (let num = 1; num <= 9; num++) {
      slotValues.set(slotId, num)
      // Early parity / consecutive short-circuit so we don't waste work.
      if (constraints.parity) {
        const wanted = constraints.parity === 'even' ? 0 : 1
        if (num % 2 !== wanted) continue
      }
      const r = trySlotAssignment(idx + 1)
      if (r.ok) return r
    }
    slotValues.delete(slotId)
    return { ok: false }
  }

  if (variableSlots.length === 0) {
    if (!variableSlotsValid()) return { ok: false }
    return trySuitAssignment(nmjlHand, groups, slotValues, counts, jokerCount, constraints)
  }
  return trySlotAssignment(0)
}

// Resolve dragon colour compatibility for a given group and assigned suit.
function dragonColourAllowed(
  actualColor: DragonColor,
  pairedSuit: Suit | null,
  constraints: SuitsConstraint
): boolean {
  if (!pairedSuit) return true // no pair → no constraint
  const match = SUIT_TO_DRAGON[pairedSuit]
  if (constraints.matchingDragon) return actualColor === match
  if (constraints.oppositeDragon || constraints.oppositeDragons) return actualColor !== match
  return true
}

// Core: try to assign a suit to each suit group, subject to colour-group
// constraints, suit-count constraints, dragon-matching, parity, jokers, etc.
function trySuitAssignment(
  nmjlHand: NmjlHand,
  groups: ParsedGroup[],
  slotValues: Map<number, number>,
  counts: TileCount,
  totalJokers: number,
  constraints: SuitsConstraint
): TryMatchResult {
  const suitGroups = groups.filter((g) => g.kind === 'suit')
  const dragonGroups = groups.filter((g) => g.kind === 'dragon')
  const flowerGroups = groups.filter((g) => g.kind === 'flower')
  const windGroups = groups.filter((g) => g.kind === 'wind')

  // --- Colour-group resolution --------------------------------------------
  // Build a map: token index → colour. Every suit group belongs to one
  // colour. Dragon groups tagged `any` may also be driven by a colour group
  // (for matching-dragon rules). If the hand has no colourGroups metadata,
  // we fall back to grouping by numberSlot.
  const tokenColour = new Map<number, string>()
  if (nmjlHand.colourGroups) {
    for (const cg of nmjlHand.colourGroups) {
      for (const idx of cg.tokenIndices) tokenColour.set(idx, cg.colour)
    }
  }

  // Build colour → list of suit groups, and colour → list of dragon groups.
  const colourToSuitGroups = new Map<string, ParsedGroup[]>()
  const colourToDragonGroups = new Map<string, ParsedGroup[]>()
  const uncolouredSuitGroups: ParsedGroup[] = []
  const uncolouredDragonGroups: ParsedGroup[] = []

  const colourOf = (g: ParsedGroup): string | undefined => {
    if (g.tokenIndex === undefined) return undefined
    return tokenColour.get(g.tokenIndex)
  }

  for (const g of suitGroups) {
    const c = colourOf(g)
    if (c) {
      if (!colourToSuitGroups.has(c)) colourToSuitGroups.set(c, [])
      colourToSuitGroups.get(c)!.push(g)
    } else {
      uncolouredSuitGroups.push(g)
    }
  }
  for (const g of dragonGroups) {
    const c = colourOf(g)
    if (c) {
      if (!colourToDragonGroups.has(c)) colourToDragonGroups.set(c, [])
      colourToDragonGroups.get(c)!.push(g)
    } else {
      uncolouredDragonGroups.push(g)
    }
  }

  // Colours that must receive a suit assignment (those with at least one suit
  // group). Dragon-only colours don't imply a suit themselves, but their
  // colour's suit (if any) dictates matching-dragon rules.
  const suitColours = [...colourToSuitGroups.keys()]

  // --- Joker & non-suit bookkeeping ---------------------------------------
  // Flowers never use jokers.
  for (const g of flowerGroups) {
    if (counts.flowers < g.count) {
      // Flower deficit can be covered by jokers only when group ≥ 3.
      if (g.count < 3) return { ok: false }
    }
  }

  // Wind groups with count < 3 must be real tiles; >=3 may use jokers.
  for (const g of windGroups) {
    const dir = g.windDirection
    if (!dir) continue
    const available = counts.winds.get(dir) ?? 0
    if (available >= g.count) continue
    if (g.count < 3) return { ok: false }
  }

  // --- Enumerate suit assignments per colour ------------------------------
  // Each colour gets one suit; the count of DISTINCT suits assigned must
  // satisfy constraints.suitCount.
  // If there are no colour groups at all, we fall back to per-group
  // enumeration (legacy behaviour, but now aware of dragon rules).
  type Assignment = {
    colourToSuit: Map<string, Suit>
    uncolouredSuitToSuit: Map<ParsedGroup, Suit>
  }

  const tryAssignment = (a: Assignment): TryMatchResult => {
    // 1. Enforce suitCount by distinct-suits count across all *colour* groups
    //    and uncoloured suit groups.
    const distinctSuits = new Set<Suit>()
    for (const suit of a.colourToSuit.values()) distinctSuits.add(suit)
    for (const suit of a.uncolouredSuitToSuit.values()) distinctSuits.add(suit)
    if (!isSuitCountCompatible(distinctSuits.size, constraints.suitCount)) {
      return { ok: false }
    }

    // 2. Tally required suit tiles and jokers used.
    let jokersUsed = 0
    const needSuit = new Map<string, number>() // "bam-3" → needed
    const groupSuit = new Map<ParsedGroup, Suit>()

    for (const [colour, groupsForColour] of colourToSuitGroups) {
      const suit = a.colourToSuit.get(colour)!
      for (const g of groupsForColour) {
        groupSuit.set(g, suit)
        const num = slotValues.get(g.numberSlot!)!
        const key = `${suit}-${num}`
        needSuit.set(key, (needSuit.get(key) ?? 0) + g.count)
      }
    }
    for (const g of uncolouredSuitGroups) {
      const suit = a.uncolouredSuitToSuit.get(g)!
      groupSuit.set(g, suit)
      const num = slotValues.get(g.numberSlot!)!
      const key = `${suit}-${num}`
      needSuit.set(key, (needSuit.get(key) ?? 0) + g.count)
    }

    // 3. For each required suit tile, accumulate deficit (→ jokers).
    //    Suit groups with count ≤ 2 must be filled with real tiles.
    for (const [key, needed] of needSuit) {
      const available = counts.suits.get(key) ?? 0
      if (available >= needed) continue
      const deficit = needed - available
      // Determine whether any contributing group has count < 3 — if so,
      // the pair/single portion must be real (jokers illegal). We over-
      // approximate by checking ALL groups for this key: if the *minimum*
      // group count for the key is <3, the exact count for that group must
      // be covered by real tiles.
      const contributingGroups = [...groupSuit.entries()]
        .filter(([g, s]) => {
          const n = slotValues.get(g.numberSlot!)!
          return `${s}-${n}` === key
        })
        .map(([g]) => g)
      const hasSmallGroup = contributingGroups.some((g) => g.count < 3)
      if (hasSmallGroup) {
        // All pairs/singles for this key need real tiles. Compute min real
        // needed = sum of small-group counts; if that exceeds available,
        // reject outright.
        const smallReal = contributingGroups
          .filter((g) => g.count < 3)
          .reduce((s, g) => s + g.count, 0)
        if (available < smallReal) return { ok: false }
        // Remaining deficit (from the large groups only) → jokers.
        const largeNeeded = contributingGroups
          .filter((g) => g.count >= 3)
          .reduce((s, g) => s + g.count, 0)
        const leftForLarge = available - smallReal
        const largeDeficit = Math.max(0, largeNeeded - leftForLarge)
        jokersUsed += largeDeficit
      } else {
        jokersUsed += deficit
      }
    }

    // 4. Dragon groups: resolve colour.
    //    If the dragon group is colour-tagged, use that colour's suit to
    //    determine match/opposite. If colour-tagged but the colour has no
    //    suit (rare edge case), treat as uncoloured.
    for (const g of dragonGroups) {
      const colour = colourOf(g)
      const pairedSuit: Suit | null = colour && a.colourToSuit.has(colour)
        ? a.colourToSuit.get(colour)!
        : null

      // Enumerate candidate dragon colours
      const candidates: DragonColor[] = g.dragonColor === 'any'
        ? ['red', 'green', 'white']
        : [g.dragonColor as DragonColor]

      let best: { color: DragonColor; deficit: number } | null = null
      for (const cand of candidates) {
        if (!dragonColourAllowed(cand, pairedSuit, constraints)) continue
        const avail = counts.dragons.get(cand) ?? 0
        if (g.count < 3 && avail < g.count) continue
        const deficit = Math.max(0, g.count - avail)
        if (best === null || deficit < best.deficit) best = { color: cand, deficit }
      }
      if (!best) return { ok: false }
      jokersUsed += best.deficit
    }

    // 5. Wind groups: add joker deficits for size ≥ 3 (we already rejected
    //    small-group deficits above).
    for (const g of windGroups) {
      if (!g.windDirection) continue
      const avail = counts.winds.get(g.windDirection) ?? 0
      if (avail >= g.count) continue
      jokersUsed += g.count - avail
    }

    // 6. Flowers: add joker deficits for size ≥ 3.
    for (const g of flowerGroups) {
      if (counts.flowers >= g.count) continue
      if (g.count >= 3) jokersUsed += g.count - counts.flowers
      // (size<3 deficit already rejected above)
    }

    // 7. Enforce pairsSameSuit — all pair-count groups must share one suit.
    if (constraints.pairsSameSuit) {
      const pairSuits = new Set<Suit>()
      for (const g of suitGroups) {
        if (g.count === 2) {
          const s = groupSuit.get(g)
          if (s) pairSuits.add(s)
        }
      }
      if (pairSuits.size > 1) return { ok: false }
    }

    if (jokersUsed > totalJokers) return { ok: false }
    return { ok: true, jokersUsed }
  }

  // Enumerate suit assignments: assign one suit to each colour and one to
  // each uncoloured suit group.
  const colourKeys = suitColours
  const uncolouredArr = uncolouredSuitGroups

  let bestResult: TryMatchResult = { ok: false }

  const assignColours = (
    colourIdx: number,
    colourMap: Map<string, Suit>,
    assignUncoloured: () => TryMatchResult
  ): TryMatchResult => {
    if (colourIdx >= colourKeys.length) return assignUncoloured()
    const colour = colourKeys[colourIdx]
    for (const suit of SUITS) {
      colourMap.set(colour, suit)
      const r = assignColours(colourIdx + 1, colourMap, assignUncoloured)
      if (r.ok) return r
    }
    colourMap.delete(colour)
    return { ok: false }
  }

  const colourMap = new Map<string, Suit>()
  const uncolouredMap = new Map<ParsedGroup, Suit>()

  const assignUncoloured = (idx: number): TryMatchResult => {
    if (idx >= uncolouredArr.length) {
      const r = tryAssignment({ colourToSuit: colourMap, uncolouredSuitToSuit: uncolouredMap })
      if (r.ok) {
        if (!bestResult.ok || r.jokersUsed < bestResult.jokersUsed) bestResult = r
      }
      return r
    }
    const g = uncolouredArr[idx]
    for (const suit of SUITS) {
      uncolouredMap.set(g, suit)
      const r = assignUncoloured(idx + 1)
      if (r.ok) return r
    }
    uncolouredMap.delete(g)
    return { ok: false }
  }

  const r = assignColours(0, colourMap, () => assignUncoloured(0))
  if (r.ok) return r
  return bestResult
}

// --- Public API --------------------------------------------------------------

// Check a hand against a single NmjlHand pattern. Exposed for unit tests and
// for components that want to check a specific pattern.
export function matchHand(
  nmjlHand: NmjlHand,
  hand: Tile[],
  exposed: ExposedGroup[]
): MatchResult | null {
  if (nmjlHand.concealed && exposed.length > 0) return null
  const allTiles = getAllPlayerTiles(hand, exposed)
  if (allTiles.length !== 14) return null
  const counts = countTiles(allTiles)
  const groups = parsePattern(nmjlHand.pattern)
  const r = tryMatch(nmjlHand, groups, counts, counts.jokers)
  if (!r.ok) return null
  return { ...nmjlHand, jokersUsed: r.jokersUsed }
}

// Find every NMJL hand that matches the player's tiles. Default card is the
// currently-active year (2026); pass `cardYear` to pin to a specific year.
export function findMatchingHands(
  hand: Tile[],
  exposed: ExposedGroup[],
  cardYear?: CardYear
): MatchResult[] {
  const allTiles = getAllPlayerTiles(hand, exposed)
  if (allTiles.length !== 14) return []

  const counts = countTiles(allTiles)
  const matches: MatchResult[] = []
  const card = getActiveCard(cardYear)

  for (const nmjlHand of card) {
    if (nmjlHand.concealed && exposed.length > 0) continue

    const groups = parsePattern(nmjlHand.pattern)
    const r = tryMatch(nmjlHand, groups, counts, counts.jokers)
    if (r.ok) {
      matches.push({ ...nmjlHand, jokersUsed: r.jokersUsed })
    }
  }

  return matches
}

// Quick yes/no: does the player have a winning hand on the active card?
export function hasWinningHand(
  hand: Tile[],
  exposed: ExposedGroup[],
  cardYear?: CardYear
): boolean {
  return findMatchingHands(hand, exposed, cardYear).length > 0
}

// Check if claiming a specific discard would complete a winning hand.
// Returns the matched hand + joker count, or null.
export function wouldCompleteHand(
  hand: Tile[],
  exposed: ExposedGroup[],
  newTile: Tile,
  cardYear?: CardYear
): MatchResult | null {
  const allTiles = [...hand, newTile]
  for (const group of exposed) allTiles.push(...group.tiles)
  if (allTiles.length !== 14) return null

  const counts = countTiles(allTiles)
  const card = getActiveCard(cardYear)

  for (const nmjlHand of card) {
    if (nmjlHand.concealed && exposed.length > 0) continue
    const groups = parsePattern(nmjlHand.pattern)
    const r = tryMatch(nmjlHand, groups, counts, counts.jokers)
    if (r.ok) return { ...nmjlHand, jokersUsed: r.jokersUsed }
  }
  return null
}

// Re-export types so downstream callers can import from matcher directly.
export type { NmjlHand, SuitsConstraint, ColourGroup }
