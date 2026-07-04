'use client'

import type { PlayerState } from '@/lib/game-engine/types'
import { ExposedGroups } from './ExposedGroups'

type SeatPlaqueProps = {
  player: PlayerState
  isCurrentTurn: boolean
  isDealer: boolean
  /** Countdown seconds to show on this seat's clock (null hides the clock). */
  clockSec?: number | null
  /** 'facing' = the seat across/beside you; 'you' = the bottom seat. */
  variant?: 'facing' | 'you'
}

// A seat at the table, chess.com-style: avatar, name, dealer badge, a clock
// that lives on the active seat, and the player's exposed melds - everything
// an opponent's presence tells you in a real game.
export function SeatPlaque({ player, isCurrentTurn, isDealer, clockSec, variant = 'facing' }: SeatPlaqueProps) {
  const showClock = isCurrentTurn && typeof clockSec === 'number' && clockSec >= 0
  const urgent = showClock && clockSec <= 15

  return (
    <div className="flex flex-col items-stretch gap-1.5 w-fit max-w-full">
      <div
        className="flex items-center gap-2.5 sm:gap-3 rounded-[14px] px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300"
        style={{
          background: isCurrentTurn ? 'rgba(148, 171, 249, 0.22)' : 'rgba(255, 255, 255, 0.07)',
          border: isCurrentTurn
            ? '2px solid var(--accent-periwinkle)'
            : '2px solid rgba(255,255,255,0.10)',
          boxShadow: isCurrentTurn ? '0 0 0 4px rgba(148, 171, 249, 0.15)' : 'none',
        }}
      >
        {/* Avatar with dealer badge */}
        <div className="relative shrink-0">
          <div
            className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full font-bold text-base sm:text-lg"
            style={{
              background: variant === 'you' ? 'var(--accent-warm)' : 'var(--accent-gold)',
              color: 'var(--text-inverse)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {player.displayName[0]}
          </div>
          {isDealer && (
            <span
              className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
              style={{ background: 'var(--accent-warm)', color: 'var(--text-inverse)' }}
              title="Dealer (East)"
            >
              E
            </span>
          )}
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <p className="font-semibold text-sm sm:text-base leading-tight text-[var(--text-inverse)] truncate">
            {player.displayName}
          </p>
          <p className="text-xs sm:text-sm leading-tight" style={{ color: 'rgba(229, 233, 253, 0.75)' }}>
            {player.isDead ? (
              <span className="text-[#F0A5A5] font-semibold">Dead hand</span>
            ) : (
              <>
                {player.hand.length} tiles
                {isCurrentTurn && variant !== 'you' && <span className="ml-1.5 animate-pulse">thinking…</span>}
              </>
            )}
          </p>
        </div>

        {/* Clock - sits on the active seat, like a chess clock */}
        {showClock && (
          <div
            className={`ml-1 shrink-0 rounded-[8px] px-2.5 py-1 font-mono font-bold text-base sm:text-lg tabular-nums ${
              urgent ? 'animate-pulse' : ''
            }`}
            style={{
              background: urgent ? 'var(--accent-warm)' : 'rgba(255,255,255,0.92)',
              color: urgent ? 'var(--text-inverse)' : 'var(--text-primary)',
            }}
            aria-label={`${clockSec} seconds remaining`}
          >
            0:{String(clockSec).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Exposed melds live at the seat, face-up on the table */}
      {player.exposed.length > 0 && (
        <div className="pl-1">
          <ExposedGroups groups={player.exposed} />
        </div>
      )}
    </div>
  )
}
