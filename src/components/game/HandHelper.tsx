'use client'

import { useMemo, useState } from 'react'
import type { Tile } from '@/lib/tiles/constants'
import type { ExposedGroup } from '@/lib/game-engine/types'
import type { NmjlHand } from '@/lib/nmjl/types'
import { CATEGORY_LABELS } from '@/lib/nmjl/types'
import { parsePattern } from '@/lib/nmjl/matcher'
import { getActiveCard } from '@/lib/nmjl/registry'

type HandHelperProps = {
  hand: Tile[]
  exposed: ExposedGroup[]
  // Included in props so the board can pass the joker count it already knows;
  // the helper itself doesn't need it yet, but the prop keeps the API stable if
  // a future heuristic wants to weight joker availability.
  jokersInHand: number
}

type Suggestion = {
  hand: NmjlHand
  needed: number // how many more tiles you still need
  have: number // how many tiles from the pattern you already have
  total: number // total tiles the pattern requires (usually 14)
}

// Rank the active card's hands by how close the player is to each one. "Close"
// is a deliberately naive best-match count: we take the player's current tiles
// (hand + exposed) and, for each pattern, count the maximum number of tokens
// the current tiles can supply across every plausible suit assignment. This is
// lightweight and correct enough to surface the top few targets — not a full
// matcher run.
//
// The real NMJL matcher enforces consecutive / parity / dragon-colour rules; we
// intentionally skip those here so "suggestions" remain permissive. A player
// wants to see "you're 3 tiles away from 13579-8" even if their current suit
// spread doesn't yet line up — worst case the ranking is a little off.
export function suggestClosestHands(
  hand: Tile[],
  exposed: ExposedGroup[],
  hands: NmjlHand[],
  topN = 3
): Suggestion[] {
  const allTiles: Tile[] = [...hand]
  for (const g of exposed) allTiles.push(...g.tiles)

  // Pre-compute how many of each tile "bucket" the player has.
  let flowers = 0
  let jokers = 0
  const suitCounts = new Map<string, number>() // `${suit}-${num}` → count
  const windCounts = new Map<string, number>()
  const dragonCounts = new Map<string, number>()

  for (const t of allTiles) {
    switch (t.type.kind) {
      case 'flower':
        flowers++
        break
      case 'joker':
        jokers++
        break
      case 'suit': {
        const key = `${t.type.suit}-${t.type.number}`
        suitCounts.set(key, (suitCounts.get(key) ?? 0) + 1)
        break
      }
      case 'wind':
        windCounts.set(t.type.direction, (windCounts.get(t.type.direction) ?? 0) + 1)
        break
      case 'dragon':
        dragonCounts.set(t.type.color, (dragonCounts.get(t.type.color) ?? 0) + 1)
        break
    }
  }

  const suitKinds: Array<'bam' | 'crak' | 'dot'> = ['bam', 'crak', 'dot']
  const dragonKinds: Array<'red' | 'green' | 'white'> = ['red', 'green', 'white']

  const scored: Suggestion[] = hands.map((h) => {
    const groups = parsePattern(h.pattern)
    const total = groups.reduce((sum, g) => sum + g.count, 0) || 14

    // Remaining buckets (mutable while we "consume" tiles across the pattern).
    let flowersLeft = flowers
    const suitLeft = new Map(suitCounts)
    const windLeft = new Map(windCounts)
    const dragonLeft = new Map(dragonCounts)

    // For variable number slots, try 1–9 and pick the value that yields the
    // most matches. We do this greedy-per-slot rather than exhaustively to
    // keep cost manageable for the full card. Good enough for ranking.
    const slotBestNumber = new Map<number, number>()

    // Group by numberSlot so we can evaluate together.
    const suitGroups = groups.filter((g) => g.kind === 'suit')
    const slotGroups = new Map<number, typeof suitGroups>()
    for (const g of suitGroups) {
      if (g.numberSlot === undefined) continue
      const existing = slotGroups.get(g.numberSlot) ?? []
      existing.push(g)
      slotGroups.set(g.numberSlot, existing)
    }

    // Pick the best number for each variable slot.
    for (const [slotId, gs] of slotGroups) {
      const fixed = gs.find((g) => g.fixedNumber !== undefined)?.fixedNumber
      if (fixed !== undefined) {
        slotBestNumber.set(slotId, fixed)
        continue
      }
      // Try 1–9 and pick the number with the highest total available count
      // across any single suit (summed over all groups sharing this slot).
      let bestNum = 1
      let bestScore = -1
      for (let num = 1; num <= 9; num++) {
        let score = 0
        for (const suit of suitKinds) {
          const available = suitCounts.get(`${suit}-${num}`) ?? 0
          if (available > score) score = available
        }
        if (score > bestScore) {
          bestScore = score
          bestNum = num
        }
      }
      slotBestNumber.set(slotId, bestNum)
    }

    // Now walk through every group in pattern order, consuming the best
    // tiles available. "Best suit" for each group is simply the one with
    // the most of that number left.
    let have = 0

    for (const g of groups) {
      if (g.kind === 'flower') {
        const take = Math.min(g.count, flowersLeft)
        flowersLeft -= take
        have += take
      } else if (g.kind === 'wind' && g.windDirection) {
        const available = windLeft.get(g.windDirection) ?? 0
        const take = Math.min(g.count, available)
        windLeft.set(g.windDirection, available - take)
        have += take
      } else if (g.kind === 'dragon') {
        // Try any dragon, even if the pattern specifies one — this helper is
        // intentionally forgiving so "close" hands surface.
        let best = 0
        let bestColor: 'red' | 'green' | 'white' | null = null
        for (const color of dragonKinds) {
          const available = dragonLeft.get(color) ?? 0
          if (available > best) {
            best = available
            bestColor = color
          }
        }
        if (bestColor) {
          const take = Math.min(g.count, best)
          dragonLeft.set(bestColor, (dragonLeft.get(bestColor) ?? 0) - take)
          have += take
        }
      } else if (g.kind === 'suit' && g.numberSlot !== undefined) {
        const num = slotBestNumber.get(g.numberSlot)
        if (!num) continue
        // Pick the suit with the most of this number remaining.
        let best = 0
        let bestSuit: 'bam' | 'crak' | 'dot' | null = null
        for (const suit of suitKinds) {
          const key = `${suit}-${num}`
          const available = suitLeft.get(key) ?? 0
          if (available > best) {
            best = available
            bestSuit = suit
          }
        }
        if (bestSuit) {
          const key = `${bestSuit}-${num}`
          const take = Math.min(g.count, best)
          suitLeft.set(key, (suitLeft.get(key) ?? 0) - take)
          have += take
        }
      }
    }

    // Jokers fill in for pung/kong/quint/sextet slots (count >= 3). We grant
    // them credit after the natural match so jokerless patterns score higher
    // than joker-padded ones, nudging the UI toward achievable targets.
    const jokerAllowedGroups = groups.filter((g) => g.count >= 3)
    let jokersLeft = jokers
    for (const g of jokerAllowedGroups) {
      // Rough: assume the group may still have a deficit up to (g.count - 1).
      // We only "fill" what's missing, capped by remaining jokers.
      const deficit = Math.max(0, g.count - Math.min(g.count, have))
      // Use a small optimistic credit so jokers help ranking without inflating
      // the count above `total`.
      const credit = Math.min(jokersLeft, Math.max(0, Math.floor(deficit / 2)))
      jokersLeft -= credit
      have += credit
      if (jokersLeft <= 0) break
    }

    have = Math.min(have, total)

    return {
      hand: h,
      have,
      needed: Math.max(0, total - have),
      total,
    }
  })

  scored.sort((a, b) => a.needed - b.needed)
  return scored.slice(0, topN)
}

// Collapsible on-board panel that shows the top three hands the player is
// closest to. Rendered only during main play — Charleston already has its own
// coaching flow, and during that phase suggestions tend to mislead (the hand
// will change three more times).
export function HandHelper({ hand, exposed, jokersInHand }: HandHelperProps) {
  const [open, setOpen] = useState(false)

  // Silence the unused-prop lint; reserved for future heuristics that weight
  // joker availability more aggressively.
  void jokersInHand

  const suggestions = useMemo(() => {
    const hands = getActiveCard()
    return suggestClosestHands(hand, exposed, hands, 3)
  }, [hand, exposed])

  return (
    <div
      className="rounded-md border border-[var(--border)]"
      style={{
        background: 'rgba(250, 247, 242, 0.95)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-sm sm:text-base font-semibold text-[var(--text-primary)] min-h-[var(--touch-min)]"
      >
        <span>Suggestions ({suggestions.length})</span>
        <span aria-hidden="true" className="text-[var(--text-muted)]">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {suggestions.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No suggestions yet — keep drawing.</p>
          )}
          {suggestions.map((s) => (
            <div
              key={s.hand.id}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-[var(--text-primary)] break-words">
                    {s.hand.pattern}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {CATEGORY_LABELS[s.hand.category]}
                    {s.hand.suitsRule ? ` — ${s.hand.suitsRule}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block px-2 py-0.5 rounded-sm text-xs font-bold bg-[var(--accent-gold)] text-[var(--text-inverse)]">
                    {s.needed} to go
                  </span>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{s.hand.points} pts</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
