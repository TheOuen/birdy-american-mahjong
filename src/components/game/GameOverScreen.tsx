'use client'

import type { GameState } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'
import { ExposedGroups } from './ExposedGroups'
import { sortHand } from '@/lib/tiles/sorting'

type GameOverScreenProps = {
  gameState: GameState
  onPlayAgain: () => void
}

export function GameOverScreen({ gameState, onPlayAgain }: GameOverScreenProps) {
  const winner = gameState.winnerId
    ? gameState.players.find((p) => p.id === gameState.winnerId)
    : null

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Result banner */}
      <div
        className={`w-full text-center py-5 sm:py-6 px-6 sm:px-8 rounded-[var(--radius-lg)] border-2 ${
          winner
            ? 'bg-[var(--success-light)] border-[var(--success)]'
            : 'bg-[var(--warning-light)] border-[var(--warning)]'
        }`}
      >
        {winner ? (
          <>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>
              {winner.id === 'player' ? 'You Win!' : `${winner.displayName} Wins!`}
            </p>
            {gameState.winningMethod && (
              <p className="text-base sm:text-lg text-[var(--text-muted)] mt-2">
                Won by {gameState.winningMethod === 'self_draw' ? 'self-draw (all pay 2×)' : 'discard claim (discarder pays 2×)'}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-warm)]" style={{ fontFamily: 'var(--font-display)' }}>
              Wall Game
            </p>
            <p className="text-base sm:text-lg text-[var(--text-muted)] mt-2">
              No tiles remain — no winner this round. No points exchanged.
            </p>
          </>
        )}
      </div>

      {/* Scores */}
      {gameState.players.some((p) => p.score !== 0) && (
        <div className="w-full card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Scores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col items-center p-3 rounded-[var(--radius-md)] ${
                  p.id === gameState.winnerId ? 'bg-[var(--success-light)]' : 'bg-[var(--bg-card)]'
                }`}
              >
                <p className="font-semibold text-sm text-[var(--text-primary)]">{p.displayName}</p>
                <p className={`text-xl font-bold ${p.score >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  {p.score >= 0 ? '+' : ''}{p.score}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All hands revealed */}
      <div className="w-full flex flex-col gap-3 sm:gap-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          All Hands
        </h3>
        {gameState.players.map((p) => {
          const sorted = sortHand(p.hand)
          return (
            <div
              key={p.id}
              className={`p-3 sm:p-4 rounded-[var(--radius-md)] border ${
                p.id === gameState.winnerId
                  ? 'border-[var(--success)] bg-[var(--success-light)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[var(--text-inverse)]"
                  style={{ background: p.id === gameState.winnerId ? 'var(--accent-gold)' : 'var(--brand)' }}
                >
                  {p.displayName[0]}
                </div>
                <p className="font-medium text-[var(--text-primary)]">
                  {p.displayName}
                  {p.isDead && <span className="ml-2 text-sm text-[var(--error)]">Dead Hand</span>}
                  {p.id === gameState.winnerId && <span className="ml-2 text-sm text-[var(--success)]">Winner</span>}
                </p>
              </div>

              <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-2">
                {sorted.map((tile) => (
                  <TileRenderer key={tile.id} tile={tile} size="sm" />
                ))}
              </div>

              <ExposedGroups groups={p.exposed} />
            </div>
          )
        })}
      </div>

      <button
        onClick={onPlayAgain}
        className="btn-primary text-lg sm:text-xl px-8 sm:px-10 py-3 sm:py-4"
      >
        Play Again
      </button>
    </div>
  )
}
