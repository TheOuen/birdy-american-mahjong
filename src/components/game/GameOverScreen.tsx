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
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto py-8 px-6">
      {/* Result banner */}
      <div className={`w-full text-center py-6 px-8 rounded-md border-2 ${
        winner
          ? 'bg-[var(--success-light)] border-[var(--success)]'
          : 'bg-[var(--warning-light)] border-[var(--warning)]'
      }`}>
        {winner ? (
          <>
            <p className="text-3xl font-bold text-[var(--brand)]">
              {winner.id === 'player' ? 'You Win!' : `${winner.displayName} Wins!`}
            </p>
            {gameState.winningMethod && (
              <p className="text-lg text-[var(--text-muted)] mt-2">
                Won by {gameState.winningMethod === 'self_draw' ? 'self-draw' : 'discard claim'}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-[var(--accent-warm)]">Wall Game</p>
            <p className="text-lg text-[var(--text-muted)] mt-2">
              No tiles remain — no winner this round.
            </p>
          </>
        )}
      </div>

      {/* All hands revealed */}
      <div className="w-full flex flex-col gap-4">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">All Hands</h3>
        {gameState.players.map((p) => {
          const sorted = sortHand(p.hand)
          return (
            <div
              key={p.id}
              className={`p-4 rounded-md border ${
                p.id === gameState.winnerId
                  ? 'border-[var(--success)] bg-[var(--success-light)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-sm">
                  {p.displayName[0]}
                </div>
                <p className="font-medium text-[var(--text-primary)]">
                  {p.displayName}
                  {p.isDead && <span className="ml-2 text-sm text-[var(--error)]">Dead Hand</span>}
                  {p.id === gameState.winnerId && <span className="ml-2 text-sm text-[var(--success)]">Winner</span>}
                </p>
              </div>

              {/* Hand tiles */}
              <div className="flex flex-wrap gap-1 mb-2">
                {sorted.map((tile) => (
                  <TileRenderer key={tile.id} tile={tile} size="sm" />
                ))}
              </div>

              {/* Exposed groups */}
              <ExposedGroups groups={p.exposed} />
            </div>
          )
        })}
      </div>

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        className="px-8 py-4 bg-[var(--brand)] text-[var(--text-inverse)] rounded-md text-xl font-medium hover:bg-[var(--brand-light)] transition-colors min-h-[var(--touch-min)]"
      >
        Play Again
      </button>
    </div>
  )
}
