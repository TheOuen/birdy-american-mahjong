// Scoring for American Mahjong (per NMJL/RULES.md)
// Self-draw: all 3 opponents pay 2x hand value
// Discard win: ONLY the discarder pays, at 2x hand value (others pay nothing)
// Wall game: no points exchanged

import type { GameState, PlayerState, WinningMethod } from './types'

export type ScoreResult = {
  winnerId: string
  winningMethod: WinningMethod
  handValue: number
  payments: Map<string, number> // playerId → points gained/lost (negative = paying)
}

export function calculateScore(
  gameState: GameState,
  winnerId: string,
  winningMethod: WinningMethod,
  handValue: number,
  discarderId?: string
): ScoreResult {
  const payments = new Map<string, number>()

  if (winningMethod === 'self_draw') {
    // Self-draw: all 3 opponents pay 2x
    const payment = handValue * 2
    let winnerTotal = 0

    for (const p of gameState.players) {
      if (p.id === winnerId) continue
      payments.set(p.id, -payment)
      winnerTotal += payment
    }
    payments.set(winnerId, winnerTotal)
  } else if (winningMethod === 'discard' && discarderId) {
    // Discard win: ONLY the discarder pays at 2x (per RULES.md §5)
    const discardPayment = handValue * 2
    payments.set(discarderId, -discardPayment)
    payments.set(winnerId, discardPayment)

    // Other players pay nothing
    for (const p of gameState.players) {
      if (p.id === winnerId || p.id === discarderId) continue
      payments.set(p.id, 0)
    }
  }

  return { winnerId, winningMethod, handValue, payments }
}

// Apply score results to player states
export function applyScores(
  players: PlayerState[],
  scoreResult: ScoreResult
): PlayerState[] {
  return players.map((p) => {
    const payment = scoreResult.payments.get(p.id) ?? 0
    return {
      ...p,
      score: p.score + payment,
    }
  })
}
