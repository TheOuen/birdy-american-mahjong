'use client'

import type { PlayerState } from '@/lib/game-engine/types'
import { ExposedGroups } from './ExposedGroups'

type OpponentRowProps = {
  player: PlayerState
  isCurrentTurn: boolean
}

export function OpponentRow({ player, isCurrentTurn }: OpponentRowProps) {
  return (
    <div
      className={`flex flex-col gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-4 rounded-[var(--radius-lg)] transition-all min-w-[100px] sm:min-w-[180px]`}
      style={{
        background: isCurrentTurn ? 'rgba(184, 134, 11, 0.15)' : 'rgba(250, 247, 242, 0.08)',
        border: isCurrentTurn ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isCurrentTurn ? 'var(--shadow-gold)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-sm sm:text-lg"
          style={{
            background: isCurrentTurn ? 'var(--accent-gold)' : 'var(--brand)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {player.displayName[0]}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm sm:text-base text-[var(--text-inverse)]" style={{ fontFamily: 'var(--font-body)' }}>
            {player.displayName}
            {player.isDead && (
              <span className="ml-2 text-sm text-[var(--error)]">Dead Hand</span>
            )}
            {isCurrentTurn && !player.isDead && (
              <span className="ml-2 text-sm text-[var(--accent-gold)] animate-pulse">Playing...</span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-[#A09888]">
            {player.hand.length} tiles
            {player.exposed.length > 0 && ` · ${player.exposed.length} exposed`}
          </p>
        </div>
      </div>
      <ExposedGroups groups={player.exposed} />
    </div>
  )
}
