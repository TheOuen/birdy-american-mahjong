import { describe, it, expect } from 'vitest'
import { extractMatch, chooseBotDiscard } from '../engine'
import type { NmjlHand } from '../../nmjl/types'
import type { PlayerState, Seat } from '../types'
import type { Tile } from '../../tiles/constants'

const hand: NmjlHand = {
  id: 'test-hand',
  category: '2026',
  pattern: 'FFFF 2026 222 222',
  suitsRule: 'any',
  concealed: false,
  points: 25,
}

describe('extractMatch', () => {
  it('reads jokersUsed from a flat MatchResult (current matcher shape)', () => {
    const result = extractMatch({ ...hand, jokersUsed: 2 })
    expect(result.jokersUsed).toBe(2)
    expect(result.hand.id).toBe('test-hand')
    expect(result.hand.points).toBe(25)
  })

  it('preserves a jokerless win (jokersUsed 0) so the 2x bonus can apply', () => {
    const result = extractMatch({ ...hand, jokersUsed: 0 })
    expect(result.jokersUsed).toBe(0)
  })

  it('reads the wrapped { hand, jokersUsed } shape', () => {
    const result = extractMatch({ hand, jokersUsed: 1 })
    expect(result.jokersUsed).toBe(1)
    expect(result.hand.id).toBe('test-hand')
  })

  it('falls back to -1 (unknown) for a bare NmjlHand', () => {
    const result = extractMatch(hand)
    expect(result.jokersUsed).toBe(-1)
    expect(result.hand.id).toBe('test-hand')
  })
})

function suit(id: string, s: 'bam' | 'crak' | 'dot', n: number): Tile {
  return { id, type: { kind: 'suit', suit: s, number: n } }
}

function botWith(handTiles: Tile[]): PlayerState {
  return {
    id: 'bot-1',
    userId: 'bot-1',
    displayName: 'Margaret',
    seat: 1 as Seat,
    hand: handTiles,
    exposed: [],
    isBot: true,
    isDead: false,
    score: 0,
    connected: true,
  }
}

describe('chooseBotDiscard', () => {
  it('never discards a joker or flower', () => {
    const bot = botWith([
      { id: 'joker-1', type: { kind: 'joker' } },
      { id: 'flower-1', type: { kind: 'flower', number: 1 } },
      suit('bam-5-0', 'bam', 5),
    ])
    for (let i = 0; i < 20; i++) {
      const pick = chooseBotDiscard(bot, 'easy')
      expect(pick?.id).toBe('bam-5-0')
    }
  })

  it('returns null when only jokers/flowers remain', () => {
    const bot = botWith([{ id: 'joker-1', type: { kind: 'joker' } }])
    expect(chooseBotDiscard(bot, 'clever')).toBeNull()
  })

  it('clever bots keep pairs and toss the isolated tile', () => {
    const bot = botWith([
      suit('bam-3-0', 'bam', 3),
      suit('bam-3-1', 'bam', 3), // pair - keep
      suit('crak-7-0', 'crak', 7),
      suit('crak-7-1', 'crak', 7), // pair - keep
      suit('dot-9-0', 'dot', 9), // isolated - toss
    ])
    for (let i = 0; i < 20; i++) {
      expect(chooseBotDiscard(bot, 'clever')?.id).toBe('dot-9-0')
    }
  })

  it('clever bots prefer keeping near-neighbours over lone far tiles', () => {
    const bot = botWith([
      suit('bam-4-0', 'bam', 4),
      suit('bam-5-0', 'bam', 5), // neighbours - modest value
      suit('dot-1-0', 'dot', 1), // isolated far tile - toss
    ])
    for (let i = 0; i < 20; i++) {
      expect(chooseBotDiscard(bot, 'clever')?.id).toBe('dot-1-0')
    }
  })
})
