'use client'

import type { Tile, TileId } from '@/lib/tiles/constants'
import type { PlayerState } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'

export type JokerSwapOption = {
  handTileId: TileId
  targetPlayerId: string
  groupIndex: number
  jokerTileId: TileId
}

type JokerSwapDialogProps = {
  swaps: JokerSwapOption[]
  players: PlayerState[]
  hand: Tile[]
  onSwap: (swap: JokerSwapOption) => void
  onClose: () => void
}

// Exchange a natural tile from your hand for a joker sitting in any exposed
// group that the tile completes (NMJL joker exchange rule). The engine finds
// the legal swaps; this dialog just lets the player pick one.
export function JokerSwapDialog({ swaps, players, hand, onSwap, onClose }: JokerSwapDialogProps) {
  // One row per (hand tile, target group) - the engine returns one option per
  // joker in the group, but swapping any of them is equivalent for the player.
  const seen = new Set<string>()
  const options = swaps.filter((s) => {
    const key = `${s.handTileId}:${s.targetPlayerId}:${s.groupIndex}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
      <div
        className="w-full max-w-lg rounded-t-[var(--radius-xl)] p-6 sm:p-8 flex flex-col gap-5 max-h-[80vh] overflow-y-auto"
        style={{
          background: 'var(--bg-elevated)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        <h3 className="text-xl text-center text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>
          Swap for a joker
        </h3>
        <p className="text-base text-center text-[var(--text-secondary)]">
          Give a matching tile from your hand, take the joker into yours.
        </p>

        <ul className="flex flex-col gap-3">
          {options.map((swap) => {
            const handTile = hand.find((t) => t.id === swap.handTileId)
            const target = players.find((p) => p.id === swap.targetPlayerId)
            if (!handTile || !target) return null
            const whose = target.id === 'player' ? 'your own' : `${target.displayName}'s`
            return (
              <li
                key={`${swap.handTileId}:${swap.targetPlayerId}:${swap.groupIndex}`}
                className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TileRenderer tile={handTile} size="md" />
                  <span className="text-base text-[var(--text-primary)]">
                    for the joker in {whose} exposed set
                  </span>
                </div>
                <button
                  onClick={() => onSwap(swap)}
                  className="btn-berry text-base px-5 shrink-0"
                >
                  Swap
                </button>
              </li>
            )
          })}
        </ul>

        <button onClick={onClose} className="btn-secondary text-base self-center px-8">
          Not now
        </button>
      </div>
    </div>
  )
}
