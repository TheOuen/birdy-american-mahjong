'use client'

import type { DiscardEntry } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'

type DiscardPileProps = {
  discards: DiscardEntry[]
  /** Display name of whoever threw the most recent tile. */
  lastDiscardBy?: string
}

// The middle of the table. Older discards fade into the felt; the latest
// throw sits proud with a highlight - the mahjong equivalent of chess.com's
// last-move square. That tile is the one you can claim.
export function DiscardPile({ discards, lastDiscardBy }: DiscardPileProps) {
  const latest = discards.length > 0 ? discards[discards.length - 1] : null
  const earlier = discards.slice(0, -1)

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {latest ? (
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="rounded-[12px] p-1.5 animate-in"
            style={{
              background: latest.claimed ? 'transparent' : 'rgba(148, 171, 249, 0.25)',
              boxShadow: latest.claimed ? 'none' : '0 0 0 3px var(--accent-periwinkle)',
            }}
          >
            <TileRenderer tile={latest.tile} size="md" />
          </div>
          {lastDiscardBy && (
            <p className="text-xs sm:text-sm font-medium" style={{ color: 'rgba(229, 233, 253, 0.85)' }}>
              {lastDiscardBy} discarded
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm italic py-4" style={{ color: 'rgba(229, 233, 253, 0.55)' }}>
          The table is set - the first discard opens play.
        </p>
      )}

      {earlier.length > 0 && (
        <div
          className="flex flex-wrap justify-center gap-1 max-w-md p-2.5 rounded-[var(--radius-lg)] opacity-80"
          style={{ background: 'rgba(0, 0, 0, 0.14)' }}
        >
          {earlier.map((entry, i) => (
            <TileRenderer key={`${entry.tile.id}-${i}`} tile={entry.tile} size="sm" />
          ))}
        </div>
      )}
    </div>
  )
}
