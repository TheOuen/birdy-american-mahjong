'use client'

import { useState } from 'react'
import { NMJL_2025_HANDS } from '@/lib/nmjl/hands'
import { CATEGORY_LABELS } from '@/lib/nmjl/types'
import type { HandCategory } from '@/lib/nmjl/types'

type NmjlCardViewerProps = {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES: HandCategory[] = [
  '2025', '2468', 'any-like-numbers', 'quints', 'consecutive-run',
  '13579', 'winds-dragons', '369', 'singles-and-pairs',
]

// Color-code pattern characters
function colorPattern(pattern: string) {
  return pattern.split('').map((char, i) => {
    let color = 'inherit'
    if (char === 'F') color = 'var(--tile-flower)'
    else if (char === 'D') color = 'var(--tile-dragon-red)'
    else if (char === 'N' || char === 'E' || char === 'W' || char === 'S') color = 'var(--tile-wind)'
    else if (char === 'J') color = 'var(--tile-joker)'
    else if (/[0-9]/.test(char)) color = 'var(--brand)'

    return (
      <span key={i} style={{ color }} className="font-mono">
        {char}
      </span>
    )
  })
}

export function NmjlCardViewer({ isOpen, onClose }: NmjlCardViewerProps) {
  const [activeCategory, setActiveCategory] = useState<HandCategory>('2025')

  if (!isOpen) return null

  const hands = NMJL_2025_HANDS.filter((h) => h.category === activeCategory)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-[var(--bg-elevated)] rounded-md border border-[var(--border)] shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--brand)]">NMJL 2025 Card</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors min-h-[var(--touch-min)] flex items-center"
          >
            Close
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
          {CATEGORIES.map((cat) => (
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
            {hands.map((hand) => (
              <div
                key={hand.id}
                className="p-4 rounded-md border border-[var(--border)] bg-[var(--bg-card)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-mono font-bold tracking-wide">
                      {colorPattern(hand.pattern)}
                    </p>
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
