// Scoring for American Mahjong
// Self-draw: all 3 opponents pay 2x hand value
// Discard win: discarder pays 2x, other two pay 1x
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
    // Discard win: discarder pays 2x, other two pay 1x
    let winnerTotal = 0

    for (const p of gameState.players) {
      if (p.id === winnerId) continue
      if (p.id === discarderId) {
        payments.set(p.id, -(handValue * 2))
        winnerTotal += handValue * 2
      } else {
        payments.set(p.id, -handValue)
        winnerTotal += handValue
      }
    }
    payments.set(winnerId, winnerTotal)
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
      ...(p.id === scoreResult.winnerId ? { gamesWon: 1 } : {}),
    }
  })
}
