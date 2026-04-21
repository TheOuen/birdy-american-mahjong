// Inline-assert tests for scoring + claims + Mahjong-in-Error + dead-hand
// continuation. Intended to be runnable via `npx tsx` or via a future Jest
// harness. Until a test runner is wired in, you can manually verify by:
//
//   npx tsx src/lib/game-engine/__tests__/scoring.test.ts
//
// Exit code 0 = all pass; non-zero = failure with details.

import {
  calculateScore,
  applyScores,
  applyMahjongInError,
  settlePendingMahjongErrorOnWallGame,
} from '../scoring'
import { resolveClaims } from '../claims'
import type { PendingClaim } from '../claims'
import type { GameState, PlayerState } from '../types'

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

let testsRun = 0
let testsFailed = 0

function assertEq<T>(actual: T, expected: T, label: string): void {
  testsRun++
  const ok =
    actual === expected ||
    (typeof actual === 'object' &&
      JSON.stringify(actual) === JSON.stringify(expected))
  if (!ok) {
    testsFailed++
    console.error(
      `FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
    )
  } else {
    console.log(`  pass: ${label}`)
  }
}

function assertTrue(cond: boolean, label: string): void {
  testsRun++
  if (!cond) {
    testsFailed++
    console.error(`FAIL: ${label}`)
  } else {
    console.log(`  pass: ${label}`)
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    userId: id,
    displayName: id,
    seat: 0,
    hand: [],
    exposed: [],
    isBot: false,
    isDead: false,
    score: 0,
    connected: true,
    ...overrides,
  }
}

function mkGame(overrides: Partial<GameState> = {}): GameState {
  const players = [
    mkPlayer('p1', { seat: 0 }),
    mkPlayer('p2', { seat: 1 }),
    mkPlayer('p3', { seat: 2 }),
    mkPlayer('p4', { seat: 3 }),
  ]
  return {
    id: 'test',
    code: 'TEST',
    status: 'playing',
    type: 'private',
    hostId: 'p1',
    currentTurn: 'p1',
    turnOrder: ['p1', 'p2', 'p3', 'p4'],
    dealerIndex: 0,
    players,
    discardPile: [],
    charlestonStep: 'done',
    round: 1,
    winnerId: null,
    winningMethod: null,
    winningHandId: null,
    turnTimerSec: 0,
    tilesRemaining: 100,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Scoring tests
// ---------------------------------------------------------------------------

console.log('\n--- Jokerless bonus (non-S&P) ---')
{
  // Jokerless self-draw on a non-S&P hand → 4x per opponent (2x self-draw × 2x jokerless).
  const g = mkGame()
  const r = calculateScore(g, 'p1', 'self_draw', 25, {
    jokersUsed: 0,
    handCategory: '2025',
  })
  assertEq(r.jokerlessBonus, true, 'jokerlessBonus flag true')
  assertEq(r.payments.get('p2'), -100, 'p2 pays 4x (100 on 25-pt hand)')
  assertEq(r.payments.get('p3'), -100, 'p3 pays 4x')
  assertEq(r.payments.get('p4'), -100, 'p4 pays 4x')
  assertEq(r.payments.get('p1'), 300, 'winner collects 300')
}

console.log('\n--- Jokerless Singles & Pairs (no bonus) ---')
{
  // S&P hand jokerless → no double. Self-draw pays 2x normally.
  const g = mkGame()
  const r = calculateScore(g, 'p1', 'self_draw', 50, {
    jokersUsed: 0,
    handCategory: 'singles-and-pairs',
  })
  assertEq(r.jokerlessBonus, false, 'S&P suppresses bonus')
  assertEq(r.payments.get('p2'), -100, 'p2 pays 2x (not 4x)')
  assertEq(r.payments.get('p1'), 300, 'winner collects 3×100')
}

console.log('\n--- Discard win with jokers — only discarder pays 2x ---')
{
  const g = mkGame()
  const r = calculateScore(g, 'p1', 'discard', 25, {
    discarderId: 'p3',
    jokersUsed: 2,
    handCategory: '2025',
  })
  assertEq(r.jokerlessBonus, false, 'bonus off when jokers used')
  assertEq(r.payments.get('p3'), -50, 'discarder pays 2x (50)')
  assertEq(r.payments.get('p1'), 50, 'winner collects 50')
  assertEq(r.payments.get('p2'), 0, 'p2 pays 0')
  assertEq(r.payments.get('p4'), 0, 'p4 pays 0')
}

console.log('\n--- Discard win jokerless — discarder pays 4x ---')
{
  const g = mkGame()
  const r = calculateScore(g, 'p1', 'discard', 25, {
    discarderId: 'p3',
    jokersUsed: 0,
    handCategory: '2025',
  })
  assertEq(r.jokerlessBonus, true, 'jokerless bonus on')
  assertEq(r.payments.get('p3'), -100, 'discarder pays 4x (100)')
  assertEq(r.payments.get('p2'), 0, 'p2 still pays 0')
}

console.log('\n--- jokersUsed unknown (-1) — bonus skipped ---')
{
  const g = mkGame()
  const r = calculateScore(g, 'p1', 'self_draw', 25, {
    jokersUsed: -1,
    handCategory: '2025',
  })
  assertEq(r.jokerlessBonus, false, 'unknown joker count skips bonus')
}

console.log('\n--- Dead player still in payments map ---')
{
  const g = mkGame({
    players: [
      mkPlayer('p1'),
      mkPlayer('p2', { isDead: true }),
      mkPlayer('p3'),
      mkPlayer('p4'),
    ],
  })
  const r = calculateScore(g, 'p1', 'self_draw', 25, { jokersUsed: 1 })
  assertEq(r.payments.get('p2'), -50, 'dead player owes -base (2×25=50)')
  assertTrue(r.payments.has('p2'), 'dead player present in map')

  // Discard win with dead non-participant — dead player's entry == 0 (they're
  // not the discarder in this case).
  const r2 = calculateScore(g, 'p1', 'discard', 25, {
    discarderId: 'p3',
    jokersUsed: 1,
  })
  assertEq(r2.payments.get('p2'), 0, 'dead non-discarder pays 0 on discard win')

  // applyScores must update the dead player's score too
  const applied = applyScores(g.players, r)
  const dead = applied.find((p) => p.id === 'p2')!
  assertEq(dead.score, -50, 'dead player score decremented by applyScores')
}

// ---------------------------------------------------------------------------
// Mahjong-in-Error tests
// ---------------------------------------------------------------------------

console.log('\n--- Mahjong in error: hand not shown = no-op ---')
{
  const g = mkGame()
  const { newState, summary } = applyMahjongInError(g, {
    callerId: 'p2',
    handRevealed: false,
  })
  const caller = newState.players.find((p) => p.id === 'p2')!
  assertEq(caller.isDead, false, 'caller not dead')
  assertEq(newState.pendingMahjongError ?? null, null, 'no pending penalty')
  assertTrue(summary.includes('No hand'), 'summary explains no-op')
}

console.log('\n--- Mahjong in error: hand shown, no other reveal — caller dies ---')
{
  const g = mkGame()
  const { newState } = applyMahjongInError(g, {
    callerId: 'p2',
    handRevealed: true,
  })
  const caller = newState.players.find((p) => p.id === 'p2')!
  assertEq(caller.isDead, true, 'caller dead after reveal')
  assertEq(newState.pendingMahjongError ?? null, null, 'no pending penalty')

  // Now another player wins — caller must still pay as part of standard rules.
  const winRes = calculateScore(newState, 'p1', 'self_draw', 25, { jokersUsed: 1 })
  assertEq(winRes.payments.get('p2'), -50, 'dead caller pays winner 2×25=50')
}

console.log('\n--- Mahjong in error: other reveal — caller pays 2x to intact player ---')
{
  const g = mkGame()
  const { newState } = applyMahjongInError(g, {
    callerId: 'p2',
    handRevealed: true,
    otherRevealedPlayerId: 'p3',
  })
  assertEq(newState.pendingMahjongError?.callerId, 'p2', 'caller queued')
  assertEq(
    newState.pendingMahjongError?.otherRevealedPlayerId,
    'p3',
    'intact player queued'
  )

  // At win time, p1 wins a 25-pt hand via self-draw with jokers.
  const winRes = calculateScore(newState, 'p1', 'self_draw', 25, {
    jokersUsed: 1,
    handCategory: '2025',
    pendingMahjongError: newState.pendingMahjongError,
  })
  // p2: -50 base (self-draw loser) + -50 error penalty = -100
  // p3: -50 base + 50 penalty = 0
  // p4: -50 base
  // p1: 150 base + 0 = 150
  assertEq(winRes.payments.get('p2'), -100, 'caller pays base + 2×handValue penalty')
  assertEq(winRes.payments.get('p3'), 0, 'intact player net 0 (-50 base + 50 penalty)')
  assertEq(winRes.payments.get('p4'), -50, 'unaffected loser still pays 2x')
  assertEq(winRes.payments.get('p1'), 150, 'winner still collects self-draw base')
}

console.log('\n--- Wall-game settles pending mahjong error ---')
{
  const g = mkGame({
    pendingMahjongError: { callerId: 'p2', otherRevealedPlayerId: 'p3' },
  })
  // Caller's attempted hand value was 40.
  const { newPayments, newState } = settlePendingMahjongErrorOnWallGame(g, 40)
  assertEq(newPayments.get('p2'), -80, 'caller pays 2×40=80 on wall game')
  assertEq(newPayments.get('p3'), 80, 'intact player collects 80')
  assertEq(newState.pendingMahjongError ?? null, null, 'pending penalty cleared')
}

// ---------------------------------------------------------------------------
// Claim priority resolver tests
// ---------------------------------------------------------------------------

console.log('\n--- Mahjong beats exposure even if exposure claimed first ---')
{
  const g = mkGame()
  g.discardPile.push({
    tile: { id: 'x', type: { kind: 'wind', direction: 'east' } },
    discardedBy: 'p1',
    claimed: false,
  })
  const claims: PendingClaim[] = [
    { claimerId: 'p2', claimType: 'pung', tileIds: ['a', 'b'], declaredAt: 1 },
    { claimerId: 'p4', claimType: 'mahjong', tileIds: [], declaredAt: 999 },
  ]
  const winner = resolveClaims(g, 0, claims)
  assertEq(winner?.claimerId, 'p4', 'mahjong wins regardless of timing')
}

console.log('\n--- Exposure tie resolved by closest-left of discarder ---')
{
  const g = mkGame()
  g.discardPile.push({
    tile: { id: 'x', type: { kind: 'wind', direction: 'east' } },
    discardedBy: 'p1',
    claimed: false,
  })
  // discarder=p1 (idx 0). Next seat = p2 (idx 1), then p3, then p4.
  // p3 and p4 both want pung → p3 wins (closer to left).
  const claims: PendingClaim[] = [
    { claimerId: 'p4', claimType: 'pung', tileIds: [], declaredAt: 1 },
    { claimerId: 'p3', claimType: 'pung', tileIds: [], declaredAt: 2 },
  ]
  const winner = resolveClaims(g, 0, claims)
  assertEq(winner?.claimerId, 'p3', 'p3 (closer-left of p1) wins over p4')
}

console.log('\n--- Mahjong tie resolved by closest-left of discarder ---')
{
  const g = mkGame()
  g.discardPile.push({
    tile: { id: 'x', type: { kind: 'wind', direction: 'east' } },
    discardedBy: 'p2',
    claimed: false,
  })
  // discarder=p2 (idx 1). Next seat = p3, then p4, then p1.
  const claims: PendingClaim[] = [
    { claimerId: 'p1', claimType: 'mahjong', tileIds: [], declaredAt: 1 },
    { claimerId: 'p4', claimType: 'mahjong', tileIds: [], declaredAt: 2 },
    { claimerId: 'p3', claimType: 'mahjong', tileIds: [], declaredAt: 3 },
  ]
  const winner = resolveClaims(g, 0, claims)
  assertEq(winner?.claimerId, 'p3', 'p3 (seat after p2) wins mahjong tie')
}

console.log('\n--- Dead claimers are dropped from resolution ---')
{
  const g = mkGame({
    players: [
      mkPlayer('p1'),
      mkPlayer('p2'),
      mkPlayer('p3', { isDead: true }),
      mkPlayer('p4'),
    ],
  })
  g.discardPile.push({
    tile: { id: 'x', type: { kind: 'wind', direction: 'east' } },
    discardedBy: 'p1',
    claimed: false,
  })
  const claims: PendingClaim[] = [
    { claimerId: 'p3', claimType: 'pung', tileIds: [], declaredAt: 1 },
    { claimerId: 'p4', claimType: 'pung', tileIds: [], declaredAt: 2 },
  ]
  const winner = resolveClaims(g, 0, claims)
  assertEq(winner?.claimerId, 'p4', 'dead claim dropped, p4 wins')
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${testsRun - testsFailed}/${testsRun} tests passed`)
if (testsFailed > 0) {
  console.error(`${testsFailed} test(s) failed`)
  if (typeof process !== 'undefined') process.exit(1)
} else if (typeof process !== 'undefined') {
  process.exit(0)
}
