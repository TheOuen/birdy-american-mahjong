// Helper used by hands-2025.ts and hands-2026.ts to build NmjlHand entries
// from concise row definitions. Keeping this in its own file keeps the data
// files readable as "table rows" — the alternative (inlining everything)
// produces ~200 lines of `{ id: ..., category: ..., pattern: ..., ... }`.
//
// The builder:
//   * fills in structured `constraints` via parseSuitsRule(raw)
//   * builds colourGroups from an explicit `colours` map (token-index → label),
//     defaulting to per-pattern-token grouping when the row doesn't specify.
//   * is the single choke-point where we stamp TODO notes so later passes
//     can find them by grepping for `colourGroupsGuessed: true`.

import type { HandCategory, NmjlHand, ColourGroup } from './types'
import { parseSuitsRule, parsePattern } from './matcher'

export type HandRow = {
  id: string
  category: HandCategory
  pattern: string
  suitsRule: string
  concealed: boolean
  points: number
  // Optional explicit colour assignment: map of pattern-token-index → colour
  // label ('blue' | 'red' | 'green'). If omitted, the builder falls back to
  // a heuristic that groups suit tokens by fixed digit / numberSlot and
  // colour-matches dragon tokens to the nearest adjacent suit token.
  colours?: Record<number, 'blue' | 'red' | 'green'>
  // Mark when the colour-group assignment is a guess and needs later review
  // against the physical NMJL card scan.
  colourGroupsGuessed?: boolean
}

// Auto-derive colour groups from the pattern. This is a best-effort
// heuristic — see HandRow.colours for manual overrides.
function autoColours(pattern: string): Record<number, 'blue' | 'red' | 'green'> {
  const groups = parsePattern(pattern)
  const labels: Array<'blue' | 'red' | 'green'> = ['blue', 'red', 'green']

  // Map numberSlot → colour
  const slotColour = new Map<number, 'blue' | 'red' | 'green'>()
  // Map tokenIndex → colour
  const out: Record<number, 'blue' | 'red' | 'green'> = {}
  let nextColour = 0

  // Pass 1: each suit token picks up the colour of its numberSlot; first-seen
  // slots get successive colours blue → red → green.
  for (const g of groups) {
    if (g.kind !== 'suit' || g.tokenIndex === undefined || g.numberSlot === undefined) continue
    if (!slotColour.has(g.numberSlot)) {
      slotColour.set(g.numberSlot, labels[Math.min(nextColour, labels.length - 1)])
      nextColour++
    }
    const colour = slotColour.get(g.numberSlot)!
    if (out[g.tokenIndex] === undefined) out[g.tokenIndex] = colour
  }

  // Pass 2: dragon tokens adopt the colour of the nearest adjacent suit
  // token (previous if present, otherwise next). Dragons without a suit
  // neighbour stay uncoloured (default 'blue' so they at least participate).
  const tokenKinds = new Map<number, string>()
  for (const g of groups) {
    if (g.tokenIndex === undefined) continue
    if (!tokenKinds.has(g.tokenIndex) || g.kind !== 'flower') {
      tokenKinds.set(g.tokenIndex, g.kind)
    }
  }
  const tokenIdxs = [...tokenKinds.keys()].sort((a, b) => a - b)

  for (const idx of tokenIdxs) {
    if (tokenKinds.get(idx) !== 'dragon') continue
    if (out[idx] !== undefined) continue
    // Walk backward for a suit token
    let pick: 'blue' | 'red' | 'green' | undefined
    for (let j = idx - 1; j >= 0; j--) {
      if (out[j] !== undefined) { pick = out[j]; break }
    }
    if (pick === undefined) {
      for (let j = idx + 1; j <= Math.max(...tokenIdxs); j++) {
        if (out[j] !== undefined) { pick = out[j]; break }
      }
    }
    out[idx] = pick ?? 'blue'
  }

  return out
}

function buildColourGroups(
  colourMap: Record<number, 'blue' | 'red' | 'green'>
): ColourGroup[] {
  const grouped = new Map<'blue' | 'red' | 'green', number[]>()
  for (const [idxStr, colour] of Object.entries(colourMap)) {
    const idx = parseInt(idxStr, 10)
    if (!grouped.has(colour)) grouped.set(colour, [])
    grouped.get(colour)!.push(idx)
  }
  const out: ColourGroup[] = []
  for (const [colour, tokenIndices] of grouped) {
    out.push({ colour, tokenIndices: tokenIndices.sort((a, b) => a - b) })
  }
  return out
}

export function buildHand(row: HandRow): NmjlHand {
  const constraints = parseSuitsRule(row.suitsRule)
  const colours = row.colours ?? autoColours(row.pattern)
  const colourGroups = buildColourGroups(colours)
  return {
    id: row.id,
    category: row.category,
    pattern: row.pattern,
    suitsRule: row.suitsRule,
    concealed: row.concealed,
    points: row.points,
    constraints,
    colourGroups,
  }
}
