'use client'

import type { Tile, TileId } from '@/lib/tiles/constants'
import { TileRenderer } from '@/components/tiles/TileRenderer'
import { sortHand } from '@/lib/tiles/sorting'

type PlayerHandProps = {
  tiles: Tile[]
  selectedTileId: TileId | null
  onTileClick: (tileId: TileId) => void
  canDiscard: boolean
}

export function PlayerHand({ tiles, selectedTileId, onTileClick, canDiscard }: PlayerHandProps) {
  const sorted = sortHand(tiles)

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
        {sorted.map((tile) => (
          <TileRenderer
            key={tile.id}
            tile={tile}
            selected={selectedTileId === tile.id}
            onClick={canDiscard ? () => onTileClick(tile.id) : undefined}
            size="md"
          />
        ))}
      </div>
      <p className="text-[var(--text-muted)] text-xs sm:text-sm">
        {tiles.length} tiles
        {canDiscard && ' — tap to discard'}
      </p>
    </div>
  )
}
