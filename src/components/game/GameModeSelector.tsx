'use client'

import type { GameMode } from '@/lib/game-engine/types'

export type GameModeSelectorProps = {
  /** Called with the chosen mode when the user picks one. */
  onSelect: (mode: GameMode) => void
  /** Optional pre-selection (visual only; caller still receives the click). */
  current?: GameMode
}

type ModeOption = {
  mode: GameMode
  label: string
  blurb: string
}

// Descriptions pulled from DRAFT GUIDE §Variants — kept to one sentence each
// so the elderly-audience readability stays high.
const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'standard',
    label: 'Standard Game',
    blurb: 'Full wall build, Charleston, and four players — the classic NMJL experience.',
  },
  {
    mode: 'messy',
    label: 'Messy Mahjong',
    blurb: 'Skip the wall — each player grabs 13 tiles (dealer takes 14) from a shuffled pile.',
  },
  {
    mode: 'short',
    label: '2-Player Game',
    blurb: 'For travel or fewer hands: draw from the centre pile, no Charleston.',
  },
  {
    mode: 'blanks',
    label: 'Blanks Variant',
    blurb: 'Adds 6 blanks and 10 jokers; blanks can be swapped for a dead discard on the pile.',
  },
]

export function GameModeSelector({ onSelect, current }: GameModeSelectorProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-10"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center max-w-2xl">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: 'var(--brand)', fontFamily: 'var(--font-display)' }}
        >
          Choose a Game
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Pick the rules you&rsquo;d like to play. You can change later by starting a new game.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {MODE_OPTIONS.map((opt) => {
          const isCurrent = current === opt.mode
          return (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              className="text-left w-full min-h-[var(--touch-min)] p-5 rounded-md border-2 transition-colors active:scale-[0.99]"
              style={{
                background: isCurrent ? 'var(--brand-subtle)' : 'var(--bg-elevated)',
                borderColor: isCurrent ? 'var(--brand)' : 'var(--border-strong)',
                boxShadow: 'var(--shadow-sm)',
              }}
              aria-pressed={isCurrent}
            >
              <div
                className="text-xl font-semibold mb-1"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {opt.label}
              </div>
              <div className="text-base" style={{ color: 'var(--text-secondary)' }}>
                {opt.blurb}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
