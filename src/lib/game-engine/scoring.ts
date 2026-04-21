// Scoring for American Mahjong (per NMJL/RULES.md + DRAFT GUIDE)
//
// Base rules:
//   Self-draw win: all 3 opponents pay 2x the hand value.
//   Discard win:   ONLY the discarder pays, at 2x the hand value.
//   Wall game:     no points exchanged.
//
// DRAFT GUIDE additions:
//   Jokerless bonus (Joker Rule 7): winner used 0 jokers → payments double,
//     EXCEPT on Singles & Pairs category hands (no double there).
//   Mahjong-in-Error penalties: see applyMahjongInError().
//   Dead-hand continuation: dead players STILL pay winners (their entry in
//     the payments map carries the loss).

import type { GameState, PlayerState, WinningMethod, PendingMahjongError } from './types'

export type ScoreResult = {
  winnerId: string
  winningMethod: WinningMethod
  handValue: number
  payments: Map<string, number> // playerId → points gained/lost (negative = paying)
  jokerlessBonus: boolean
}

export type CalculateScoreOpts = {
  discarderId?: string
  // Number of jokers the winner used in the matched hand. If -1 or undefined,
  // the jokerless bonus is skipped (shape-compat for callers that haven't
  // threaded joker counts yet).
  jokersUsed?: number
  // Hand category from the NMJL card. Used to gate the jokerless bonus —
  // Singles & Pairs hands do NOT get the 2x multiplier.
  handCategory?: string
  // Optional pending Mahjong-in-Error penalty to reconcile at win-time.
  // If present, the caller pays 2x the winner's hand value to otherRevealedPlayerId.
  pendingMahjongError?: PendingMahjongError | null
}

export function calculateScore(
  gameState: GameState,
  winnerId: string,
  winningMethod: WinningMethod,
  handValue: number,
  // Backward-compat: older callers passed `discarderId` as the 5th positional
  // argument. New callers pass an options object. We accept either shape.
  optsOrDiscarderId: CalculateScoreOpts | string | undefined = {}
): ScoreResult {
  const opts: CalculateScoreOpts =
    typeof optsOrDiscarderId === 'string' || optsOrDiscarderId === undefined
      ? { discarderId: optsOrDiscarderId as string | undefined }
      : optsOrDiscarderId
  const { discarderId, jokersUsed, handCategory, pendingMahjongError } = opts

  // Jokerless bonus: winner used zero jokers and the hand is not S&P.
  // jokersUsed === -1 (or undefined) means "unknown" — skip the bonus.
  const jokerlessBonus =
    typeof jokersUsed === 'number' &&
    jokersUsed === 0 &&
    handCategory !== 'singles-and-pairs'

  const multiplier = jokerlessBonus ? 2 : 1
  const payments = new Map<string, number>()

  if (winningMethod === 'self_draw') {
    // Self-draw: all 3 opponents pay 2x base, doubled again if jokerless.
    const payment = handValue * 2 * multiplier
    let winnerTotal = 0

    for (const p of gameState.players) {
      if (p.id === winnerId) continue
      payments.set(p.id, -payment)
      winnerTotal += payment
    }
    payments.set(winnerId, winnerTotal)
  } else if (winningMethod === 'discard' && discarderId) {
    // Discard win: ONLY the discarder pays at 2x base, doubled if jokerless.
    // Other players (including dead ones) pay 0 for the base payout.
    const discardPayment = handValue * 2 * multiplier
    payments.set(discarderId, -discardPayment)
    payments.set(winnerId, discardPayment)

    // Other players pay nothing — explicitly zero them out so the payments map
    // lists every seat (important for dead-hand audit trails).
    for (const p of gameState.players) {
      if (p.id === winnerId || p.id === discarderId) continue
      payments.set(p.id, 0)
    }
  }

  // Apply any deferred Mahjong-in-Error penalty. The false-call caller pays
  // 2x the winner's hand value to the intact (otherRevealed) player only.
  // The winner is unaffected.
  if (pendingMahjongError) {
    const { callerId, otherRevealedPlayerId } = pendingMahjongError
    const penalty = handValue * 2
    payments.set(callerId, (payments.get(callerId) ?? 0) - penalty)
    payments.set(
      otherRevealedPlayerId,
      (payments.get(otherRevealedPlayerId) ?? 0) + penalty
    )
  }

  return { winnerId, winningMethod, handValue, payments, jokerlessBonus }
}

// Apply score results to player states.
// Dead players are included — they still owe losses when someone else wins.
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

// ---------------------------------------------------------------------------
// Mahjong-in-Error
// ---------------------------------------------------------------------------
//
// DRAFT GUIDE §"Mahjong in Error" outcomes:
//   1. Hand NOT shown (just a verbal mis-call): no penalty, play resumes.
//   2. Hand shown, nobody else reacted: caller's hand dies. They still owe
//      when someone else wins, per the standard dead-hand rule.
//   3. Hand shown AND another player reacted by showing theirs: caller pays
//      2x the eventual winner's hand value to the intact player only; other
//      players pay nothing. Resolved at win-time via pendingMahjongError.
export type MahjongInErrorOpts = {
  callerId: string
  handRevealed: boolean
  otherRevealedPlayerId?: string
}

export function applyMahjongInError(
  state: GameState,
  opts: MahjongInErrorOpts
): { newState: GameState; summary: string } {
  const { callerId, handRevealed, otherRevealedPlayerId } = opts

  // Case 1: no reveal → no-op. Game continues.
  if (!handRevealed) {
    return {
      newState: state,
      summary: 'False Mahjong call. No hand was shown; game continues.',
    }
  }

  // Case 2: caller revealed but no one else did → caller dies, game continues.
  if (handRevealed && !otherRevealedPlayerId) {
    const newPlayers = state.players.map((p) =>
      p.id === callerId ? { ...p, isDead: true } : p
    )
    return {
      newState: { ...state, players: newPlayers },
      summary:
        "False Mahjong call; caller's hand is dead. They still pay the eventual winner.",
    }
  }

  // Case 3: caller AND another player revealed. Caller pays the other
  // revealed player 2x the eventual winner's hand value. Defer until win.
  // Caller's own hand also dies (they exposed all their tiles).
  const newPlayers = state.players.map((p) =>
    p.id === callerId ? { ...p, isDead: true } : p
  )
  return {
    newState: {
      ...state,
      players: newPlayers,
      pendingMahjongError: { callerId, otherRevealedPlayerId: otherRevealedPlayerId! },
    },
    summary:
      'False Mahjong call with reveal; caller will pay 2x the winner’s hand value to the intact player at win-time.',
  }
}

// When the round ends in a wall game (no winner), settle any outstanding
// Mahjong-in-Error penalty. Use the caller's OWN attempted hand value
// (passed in) as the base, since there's no eventual winner.
export function settlePendingMahjongErrorOnWallGame(
  state: GameState,
  attemptedCallerHandValue: number
): { newPayments: Map<string, number>; newState: GameState } {
  const payments = new Map<string, number>()
  for (const p of state.players) payments.set(p.id, 0)

  if (!state.pendingMahjongError) {
    return { newPayments: payments, newState: state }
  }

  const { callerId, otherRevealedPlayerId } = state.pendingMahjongError
  const penalty = attemptedCallerHandValue * 2
  payments.set(callerId, (payments.get(callerId) ?? 0) - penalty)
  payments.set(
    otherRevealedPlayerId,
    (payments.get(otherRevealedPlayerId) ?? 0) + penalty
  )

  return {
    newPayments: payments,
    newState: { ...state, pendingMahjongError: null },
  }
}
