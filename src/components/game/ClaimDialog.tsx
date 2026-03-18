'use client'

import type { Tile } from '@/lib/tiles/constants'
import type { ClaimType } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'

type ClaimDialogProps = {
  discardedTile: Tile
  validClaims: ClaimType[]
  onClaim: (claimType: ClaimType) => void
  onPass: () => void
}

const CLAIM_LABELS: Record<ClaimType, string> = {
  pung: 'Pung (3)',
  kong: 'Kong (4)',
  quint: 'Quint (5)',
  sextet: 'Sextet (6)',
  mahjong: 'Mahjong!',
}

export function ClaimDialog({ discardedTile, validClaims, onClaim, onPass }: ClaimDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
      <div
        className="w-full max-w-lg rounded-t-[var(--radius-xl)] p-8 flex flex-col items-center gap-5"
        style={{
          background: 'var(--bg-elevated)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        <h3
          className="text-xl text-[var(--brand)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Claim this tile?
        </h3>

        <div
          className="p-4 rounded-[var(--radius-md)]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <TileRenderer tile={discardedTile} size="lg" />
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          {validClaims.map((claim) => (
            <button
              key={claim}
              onClick={() => onClaim(claim)}
              className="btn-primary px-6 py-4"
            >
              {CLAIM_LABELS[claim]}
            </button>
          ))}
          <button
            onClick={onPass}
            className="btn-secondary px-6 py-4"
          >
            Pass
          </button>
        </div>
      </div>
    </div>
  )
}
