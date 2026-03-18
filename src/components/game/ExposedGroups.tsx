'use client'

import type { ExposedGroup } from '@/lib/game-engine/types'
import { TileRenderer } from '@/components/tiles/TileRenderer'

type ExposedGroupsProps = {
  groups: ExposedGroup[]
}

const CLAIM_LABELS: Record<string, string> = {
  pung: 'Pung',
  kong: 'Kong',
  quint: 'Quint',
  sextet: 'Sextet',
  mahjong: 'Mahjong',
}

export function ExposedGroups({ groups }: ExposedGroupsProps) {
  if (groups.length === 0) return null

  return (
    <div className="flex gap-3 flex-wrap">
      {groups.map((group, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex gap-0.5 px-2 py-1 rounded-sm bg-[var(--bg)] border border-[var(--border-strong)]">
            {group.tiles.map((tile) => (
              <TileRenderer key={tile.id} tile={tile} size="sm" />
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {CLAIM_LABELS[group.claimType] ?? group.claimType}
          </span>
        </div>
      ))}
    </div>
  )
}
