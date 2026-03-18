'use client'

import { useState } from 'react'
import type { Tile, TileId } from '@/lib/tiles/constants'
import { TileRenderer } from '@/components/tiles/TileRenderer'
import { sortHand } from '@/lib/tiles/sorting'
import { getDirectionLabel } from '@/lib/game-engine/charleston'
import type { CharlestonDirection } from '@/lib/game-engine/charleston'

type CharlestonPhaseProps = {
  hand: Tile[]
  step: 1 | 2 | 3
  direction: CharlestonDirection
  onPass: (tileIds: TileId[]) => void
}

const DIRECTION_ARROWS: Record<CharlestonDirection, string> = {
  right: '→',
  across: '↑',
  left: '←',
}

export function CharlestonPhase({ hand, step, direction, onPass }: CharlestonPhaseProps) {
  const [selectedIds, setSelectedIds] = useState<TileId[]>([])
  const sorted = sortHand(hand)

  function handleTileClick(tileId: TileId) {
    setSelectedIds((prev) => {
      if (prev.includes(tileId)) return prev.filter((id) => id !== tileId)
      if (prev.length >= 3) return prev
      return [...prev, tileId]
    })
  }

  function handleConfirm() {
    if (selectedIds.length !== 3) return
    onPass(selectedIds)
    setSelectedIds([])
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-table)' }}>
      {/* Header */}
      <div className="px-6 py-6 bg-[var(--bg-deep)] border-b border-[rgba(255,255,255,0.08)] text-center">
        <h2
          className="text-3xl text-[var(--accent-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          The Charleston
        </h2>
        <p className="text-lg text-[#A09888] mt-2">
          Pass {step} of 3
        </p>
        <div className="gold-line w-20 mx-auto mt-4" />
      </div>

      {/* Direction indicator */}
      <div className="flex flex-col items-center gap-6 py-10 px-6">
        <div
          className="flex items-center gap-6 px-10 py-8 rounded-[var(--radius-lg)]"
          style={{
            background: 'rgba(250, 247, 242, 0.95)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-5xl text-[var(--brand)]">{DIRECTION_ARROWS[direction]}</span>
          <div>
            <p
              className="text-2xl text-[var(--brand)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Pass {getDirectionLabel(direction)}
            </p>
            <p className="text-lg text-[var(--text-secondary)] mt-1">
              Select 3 tiles to pass to the player on your {direction}
            </p>
          </div>
        </div>

        {/* Selected tiles preview */}
        <div className="flex items-center gap-3">
          <span className="text-[#A09888] font-medium">Passing:</span>
          <div className="flex gap-1 min-h-20">
            {selectedIds.map((id) => {
              const tile = hand.find((t) => t.id === id)
              return tile ? (
                <TileRenderer
                  key={tile.id}
                  tile={tile}
                  size="md"
                  onClick={() => handleTileClick(tile.id)}
                />
              ) : null
            })}
            {Array.from({ length: 3 - selectedIds.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-12 h-[4.25rem] rounded-[var(--radius-sm)] border-2 border-dashed"
                style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}
              />
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={selectedIds.length !== 3}
          className={selectedIds.length === 3 ? 'btn-primary text-lg px-10 py-4' : 'btn-secondary text-lg px-10 py-4 opacity-50 cursor-not-allowed'}
        >
          {selectedIds.length === 3
            ? `Pass ${getDirectionLabel(direction)}`
            : `Select ${3 - selectedIds.length} more tile${3 - selectedIds.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Player hand */}
      <div className="flex-1" />
      <div
        className="px-6 py-5 border-t"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-center text-sm text-[var(--text-muted)] mb-3">
          Your hand — tap tiles to select for passing
        </p>
        <div className="flex flex-wrap justify-center gap-1">
          {sorted.map((tile) => (
            <TileRenderer
              key={tile.id}
              tile={tile}
              selected={selectedIds.includes(tile.id)}
              onClick={() => handleTileClick(tile.id)}
              size="lg"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
