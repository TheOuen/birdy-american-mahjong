'use client'

import { useMemo, useState } from 'react'
import { getActiveCard, type CardYear } from '@/lib/nmjl/registry'
import { CATEGORY_LABELS } from '@/lib/nmjl/types'
import { parsePattern } from '@/lib/nmjl/matcher'
import type { HandCategory, NmjlHand } from '@/lib/nmjl/types'

type NmjlCardViewerProps = {
  isOpen: boolean
  onClose: () => void
  // Pin to a specific card year. Defaults to 2026 (registry default). Callers
  // that need the 2025 view for practice/teaching pass `year={2025}`.
  year?: CardYear
}

// Card categories in the printed order. '2025' only appears on the 2025 card,
// '2026' only on the 2026 card — the viewer filters to whichever the year has.
const CATEGORY_ORDER: HandCategory[] = [
  '2025', '2026', '2468', 'any-like-numbers', 'quints', 'consecutive-run',
  '13579', 'winds-dragons', '369', 'singles-and-pairs',
]

// Map colour-group labels → CSS colour tokens. The NMJL card uses blue/red/
// green as suit-matching markers, not actual tile colours.
const COLOUR_CSS: Record<'blue' | 'red' | 'green', string> = {
  blue: 'var(--tile-colour-blue, #2563eb)',
  red: 'var(--tile-colour-red, #dc2626)',
  green: 'var(--tile-colour-green, #059669)',
}

// Render the pattern with per-token colouring pulled from hand.colourGroups.
// Tokens outside any colour group (flowers, NEWS wind-blocks) render neutral.
function ColouredPattern({ hand }: { hand: NmjlHand }) {
  const tokenColours = useMemo(() => {
    const map = new Map<number, 'blue' | 'red' | 'green'>()
    for (const g of hand.colourGroups ?? []) {
      for (const idx of g.tokenIndices) map.set(idx, g.colour)
    }
    return map
  }, [hand])

  // Split the raw pattern into the same tokens parsePattern uses so we can
  // align colour groups by index. Decorative chars (+, =) stay inline.
  const tokens = useMemo(() => {
    // Re-tokenise to mirror parsePattern's split: strip decorative, split on space.
    const cleaned = hand.pattern.replace(/[+=]/g, ' ').replace(/\s+/g, ' ').trim()
    return cleaned.split(' ')
  }, [hand.pattern])

  // Build a quick lookup for parsed tokenIndex→ actual source token position,
  // since parsePattern can emit multiple ParsedGroups per source token.
  const tokenIdxToSourcePos = useMemo(() => {
    const parsed = parsePattern(hand.pattern)
    // parsed groups carry their source tokenIndex; first occurrence wins
    const out = new Map<number, number>()
    for (const g of parsed) {
      if (g.tokenIndex === undefined) continue
      if (!out.has(g.tokenIndex)) out.set(g.tokenIndex, g.tokenIndex)
    }
    return out
  }, [hand.pattern])

  return (
    <p className="text-lg font-mono font-bold tracking-wide">
      {tokens.map((tok, srcIdx) => {
        // tokenIndex in ColourGroup lines up with source token position (both
        // count every top-level whitespace-separated block, including flowers).
        const colour = tokenColours.get(srcIdx)
        const cssColour = colour ? COLOUR_CSS[colour] : 'var(--text-primary)'
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        void tokenIdxToSourcePos
        return (
          <span key={srcIdx} style={{ color: cssColour }} className="mr-2">
            {tok}
          </span>
        )
      })}
    </p>
  )
}

export function NmjlCardViewer({ isOpen, onClose, year }: NmjlCardViewerProps) {
  const hands = useMemo(() => getActiveCard(year), [year])

  // Categories the loaded card actually has (drops the unused 2025/2026 tab).
  const availableCategories = useMemo(() => {
    const set = new Set(hands.map((h) => h.category))
    return CATEGORY_ORDER.filter((c) => set.has(c))
  }, [hands])

  const [activeCategory, setActiveCategory] = useState<HandCategory>(
    () => availableCategories[0] ?? '2468'
  )

  if (!isOpen) return null

  const shown = hands.filter((h) => h.category === activeCategory)
  const titleYear = year ?? 2026

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-[var(--bg-elevated)] rounded-md border border-[var(--border)] shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--brand)]">NMJL {titleYear} Card</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors min-h-[var(--touch-min)] flex items-center"
          >
            Close
          </button>
        </div>

        {/* Colour legend — explains what the blue/red/green text means */}
        <div className="px-6 py-2 border-b border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Colour marks suit-matching groups:</span>
          <span><span style={{ color: COLOUR_CSS.blue }} className="font-bold">blue</span> = suit A</span>
          <span><span style={{ color: COLOUR_CSS.red }} className="font-bold">red</span> = suit B</span>
          <span><span style={{ color: COLOUR_CSS.green }} className="font-bold">green</span> = suit C</span>
          <span className="italic">(the actual Bam/Crak/Dot assignment is up to you)</span>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-2 rounded-sm text-sm font-medium transition-colors
                ${activeCategory === cat
                  ? 'bg-[var(--brand)] text-[var(--text-inverse)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--border)]'
                }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Hands list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            {shown.map((hand) => (
              <div
                key={hand.id}
                className="p-4 rounded-md border border-[var(--border)] bg-[var(--bg-card)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <ColouredPattern hand={hand} />
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      {hand.suitsRule || 'No suit restriction'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 rounded-sm text-sm font-bold bg-[var(--accent-gold)] text-[var(--text-inverse)]">
                      {hand.points} pts
                    </span>
                    <span className={`text-xs font-medium ${hand.concealed ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>
                      {hand.concealed ? 'Concealed' : 'Exposable'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
