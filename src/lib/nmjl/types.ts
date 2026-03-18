export type HandCategory =
  | '2025'
  | '2468'
  | 'any-like-numbers'
  | 'quints'
  | 'consecutive-run'
  | '13579'
  | 'winds-dragons'
  | '369'
  | 'singles-and-pairs'

export type NmjlHand = {
  id: string
  category: HandCategory
  pattern: string
  suitsRule: string
  concealed: boolean
  points: number
}

export const CATEGORY_LABELS: Record<HandCategory, string> = {
  '2025': '2025',
  '2468': '2468',
  'any-like-numbers': 'Any Like Numbers',
  'quints': 'Quints',
  'consecutive-run': 'Consecutive Run',
  '13579': '13579',
  'winds-dragons': 'Winds & Dragons',
  '369': '369',
  'singles-and-pairs': 'Singles & Pairs',
}
