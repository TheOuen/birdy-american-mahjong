'use client'

import type { DiscardEntry } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'

type DiscardPileProps = {
  discards: DiscardEntry[]
}

export function DiscardPile({ discards }: DiscardPileProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h3
        className="text-sm font-semibold uppercase tracking-widest text-[#A09888]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Discards ({discards.length})
      </h3>
      <div
        className="flex flex-wrap justify-center gap-1 max-w-lg min-h-20 p-4 rounded-[var(--radius-lg)]"
        style={{
          background: 'rgba(250, 247, 242, 0.06)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {discards.length === 0 ? (
          <p className="text-[#706858] text-sm self-center italic">No discards yet</p>
        ) : (
          discards.map((entry, i) => (
            <TileRenderer key={`${entry.tile.id}-${i}`} tile={entry.tile} size="sm" />
          ))
        )}
      </div>
    </div>
  )
}
