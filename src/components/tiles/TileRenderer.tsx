'use client'

import type { Tile, TileType } from '@/lib/tiles/constants'
import { getTileShortLabel } from '@/lib/tiles/constants'

type TileRendererProps = {
  tile: Tile
  onClick?: () => void
  faceDown?: boolean
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function getTileColor(type: TileType): string {
  switch (type.kind) {
    case 'suit':
      return `var(--tile-${type.suit})`
    case 'wind':
      return 'var(--tile-wind)'
    case 'dragon':
      return `var(--tile-dragon-${type.color})`
    case 'flower':
      return 'var(--tile-flower)'
    case 'joker':
      return 'var(--tile-joker)'
  }
}

function getTileSymbol(type: TileType): string {
  switch (type.kind) {
    case 'suit':
      if (type.suit === 'bam') return '🎋'
      if (type.suit === 'crak') return '万'
      return '●'
    case 'wind':
      return { east: '東', south: '南', west: '西', north: '北' }[type.direction]
    case 'dragon':
      return { red: '中', green: '發', white: '□' }[type.color]
    case 'flower':
      return '✿'
    case 'joker':
      return '★'
  }
}

const sizes = {
  sm: { w: 'w-10', h: 'h-14', text: 'text-xs', symbol: 'text-lg', gap: 'gap-0' },
  md: { w: 'w-12', h: 'h-[4.25rem]', text: 'text-sm', symbol: 'text-xl', gap: 'gap-0.5' },
  lg: { w: 'w-[3.5rem]', h: 'h-[4.75rem]', text: 'text-sm', symbol: 'text-2xl', gap: 'gap-0.5' },
}

export function TileRenderer({ tile, onClick, faceDown, selected, size = 'md' }: TileRendererProps) {
  const s = sizes[size]

  if (faceDown) {
    return (
      <div
        className={`${s.w} ${s.h} rounded-[var(--radius-sm)] border-2 border-[var(--brand-dark)] flex items-center justify-center`}
        style={{
          background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <span className={`${s.symbol} text-[var(--accent-gold)] drop-shadow-sm`}>🀄</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`${s.w} ${s.h} rounded-[var(--radius-sm)] border-2 flex flex-col items-center justify-center ${s.gap} transition-all duration-150
        ${selected
          ? 'border-[var(--accent-warm)] -translate-y-3 z-10'
          : 'border-[var(--tile-border)]'
        }
        ${onClick ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0' : 'cursor-default'}
        bg-[var(--tile-bg)]`}
      style={{
        boxShadow: selected
          ? '0 6px 16px rgba(196, 106, 60, 0.25), 0 2px 4px rgba(0,0,0,0.1)'
          : '0 2px 4px var(--tile-shadow), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
      aria-label={getTileShortLabel(tile.type)}
    >
      <span className={`${s.symbol} leading-none`} style={{ color: getTileColor(tile.type) }}>
        {getTileSymbol(tile.type)}
      </span>
      <span
        className={`${s.text} font-bold leading-none`}
        style={{ color: getTileColor(tile.type), fontFamily: 'var(--font-body)' }}
      >
        {getTileShortLabel(tile.type)}
      </span>
    </button>
  )
}
