export type HandCategory =
  | '2025'
  | '2026'
  | '2468'
  | 'any-like-numbers'
  | 'quints'
  | 'consecutive-run'
  | '13579'
  | 'winds-dragons'
  | '369'
  | 'singles-and-pairs'

// Structured parse of a hand's "suitsRule" text. The raw string is always
// preserved so teaching-UI and admin tools can show the exact card wording.
//
// Meanings:
//   suitCount        — number of distinct suits (Bam/Crak/Dot) the hand uses.
//                      String forms ('1 or 2', '2 or 3', '1 or 3', 'any')
//                      mirror the card's language directly.
//   matchingDragon   — dragons in the hand must match the suit they're paired
//                      with via colourGroups: Bam↔Green, Crak↔Red, Dot↔White.
//   oppositeDragon   — a single dragon group must NOT match the colour of the
//                      suit group(s) it's paired with.
//   oppositeDragons  — multiple dragon groups, each opposite of its paired
//                      suit (plural form used by the physical card).
//   consecutive      — the variable-number slots must form a consecutive run.
//   like             — every variable-number slot must share a single value.
//   parity           — every variable-number slot must be all-even or all-odd.
//   windsOnly        — only these winds may appear in the hand's wind groups.
//   pairsSameSuit    — the hand's pair groups must share a single suit.
//   raw              — verbatim text from the card, for display.
export type SuitsConstraint = {
  suitCount?: 1 | 2 | 3 | '1 or 2' | '2 or 3' | '1 or 3' | 'any'
  matchingDragon?: boolean
  oppositeDragon?: boolean
  oppositeDragons?: boolean
  consecutive?: boolean
  like?: boolean
  parity?: 'even' | 'odd'
  windsOnly?: Array<'north' | 'east' | 'south' | 'west'>
  pairsSameSuit?: boolean
  raw: string
}

// The NMJL card prints its groups in blue / red / green. All tokens in the
// same colour must resolve to the same suit; the count of distinct colours
// used enforces the "Any N Suits" clause.
// tokenIndices refers to the *parsed-group* indices produced by `parsePattern`
// (flower groups are skipped when resolving colour, but still counted in the
// index). See comments in matcher.ts for details.
export type ColourGroup = {
  colour: 'blue' | 'red' | 'green'
  tokenIndices: number[]
}

export type NmjlHand = {
  id: string
  category: HandCategory
  pattern: string
  suitsRule: string
  concealed: boolean
  points: number
  // Structured constraints extracted from suitsRule. Present on all first-party
  // card data; optional only to keep shape-compat with any external fixtures.
  constraints?: SuitsConstraint
  // Colour groupings from the physical card. See ColourGroup docs.
  colourGroups?: ColourGroup[]
}

export const CATEGORY_LABELS: Record<HandCategory, string> = {
  '2025': '2025',
  '2026': '2026',
  '2468': '2468',
  'any-like-numbers': 'Any Like Numbers',
  'quints': 'Quints',
  'consecutive-run': 'Consecutive Run',
  '13579': '13579',
  'winds-dragons': 'Winds & Dragons',
  '369': '369',
  'singles-and-pairs': 'Singles & Pairs',
}
