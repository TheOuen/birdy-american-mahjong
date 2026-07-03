'use client'

import type { GameMode } from '@/lib/game-engine/types'

export type GameModeSelectorProps = {
  /** Called with the chosen mode when the user picks one. */
  onSelect: (mode: GameMode) => void
  /** Current selection (highlighted; caller still receives every click). */
  current?: GameMode
}

type ModeOption = {
  mode: GameMode
  label: string
  blurb: string
}

// Descriptions pulled from DRAFT GUIDE §Variants - kept to one sentence each
// so the elderly-audience readability stays high.
const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'standard',
    label: 'Standard Game',
    blurb: 'Full wall build, Charleston, and four players - the classic NMJL experience.',
  },
  {
    mode: 'messy',
    label: 'Messy Mahjong',
    blurb: 'Skip the wall - each player grabs 13 tiles (dealer takes 14) from a shuffled pile.',
  },
  {
    mode: 'short',
    label: '2-3 Player Game',
    blurb: 'For travel or fewer hands: draw from the centre pile, no Charleston.',
  },
  {
    mode: 'blanks',
    label: 'Blanks Variant',
    blurb: 'Adds 6 blanks and 10 jokers; blanks can be swapped for a dead discard on the pile.',
  },
]

// Embeddable variant picker - the lobby's table-setup panel composes this
// alongside timer and bot-difficulty options.
export function GameModeSelector({ onSelect, current }: GameModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full" role="radiogroup" aria-label="Game variant">
      {MODE_OPTIONS.map((opt) => {
        const isCurrent = current === opt.mode
        return (
          <button
            key={opt.mode}
            onClick={() => onSelect(opt.mode)}
            className="text-left w-full min-h-[var(--touch-min)] p-4 rounded-[var(--radius-lg)] border-2 transition-colors active:scale-[0.99]"
            style={{
              background: isCurrent ? 'var(--accent-lavender)' : 'var(--bg-elevated)',
              borderColor: isCurrent ? 'var(--accent-gold)' : 'var(--border-strong)',
            }}
            role="radio"
            aria-checked={isCurrent}
          >
            <div className="text-lg font-bold mb-0.5 text-[var(--text-primary)]">
              {opt.label}
            </div>
            <div className="text-base text-[var(--text-secondary)]">{opt.blurb}</div>
          </button>
        )
      })}
    </div>
  )
}
