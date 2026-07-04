import { describe, it, expect } from 'vitest'
import { createDemoGame } from '../engine'
import {
  createCharlestonState,
  executeCharlestonPass,
  submitStopVote,
  executeCourtesyPass,
} from '../charleston'
import type { DemoGameState } from '../engine'
import type { CharlestonState } from '../charleston'

function firstThreePassable(state: DemoGameState): string[] {
  const player = state.gameState.players[0]
  return player.hand
    .filter((t) => t.type.kind !== 'joker')
    .slice(0, 3)
    .map((t) => t.id)
}

describe('charleston full flow', () => {
  it('runs right -> across -> left -> stop vote -> courtesy -> complete', () => {
    let game = createDemoGame()
    game.gameState.status = 'charleston'
    let charleston: CharlestonState = createCharlestonState()

    // First Charleston: three mandatory passes
    for (const label of ['right', 'across', 'left']) {
      expect(charleston.phase).toBe('pass')
      const result = executeCharlestonPass(game, charleston, firstThreePassable(game))
      expect(result, `pass ${label} should succeed`).not.toBeNull()
      game = result!.gameState
      charleston = result!.charleston
      // Hand sizes stay legal after every pass
      for (const p of game.gameState.players) {
        expect(p.hand.length === 13 || p.hand.length === 14).toBe(true)
      }
    }

    // After the third (left) pass: the stop vote
    expect(charleston.phase).toBe('stop_vote')

    // Player votes to stop -> courtesy phase
    const voted = submitStopVote(game, charleston, true)
    expect(voted).not.toBeNull()
    game = voted!.gameState
    charleston = voted!.charleston
    expect(charleston.phase).toBe('courtesy')

    // Courtesy: offer nothing -> charleston complete
    const done = executeCourtesyPass(game, charleston, 0, [])
    expect(done).not.toBeNull()
    expect(done!.charleston.complete).toBe(true)
  })

  it('allows passing tiles you just received (no give-back in R-A-L order)', () => {
    let game = createDemoGame()
    game.gameState.status = 'charleston'
    let charleston: CharlestonState = createCharlestonState()

    // Pass 1 (right)
    const r1 = executeCharlestonPass(game, charleston, firstThreePassable(game))
    expect(r1).not.toBeNull()
    game = r1!.gameState
    charleston = r1!.charleston

    // Pass 2 (across): deliberately pass the 3 tiles we JUST received.
    // They came from a right-pass; sending them across does NOT return them
    // to their giver, so this must be legal (was previously rejected).
    const received = [...charleston.receivedTileIds]
    expect(received.length).toBe(3)
    const hand = game.gameState.players[0].hand
    const receivedNonJokers = received.filter(
      (id) => hand.find((t) => t.id === id)?.type.kind !== 'joker'
    )
    const fill = firstThreePassable(game).filter((id) => !receivedNonJokers.includes(id))
    const selection = [...receivedNonJokers, ...fill].slice(0, 3)
    const r2 = executeCharlestonPass(game, charleston, selection)
    expect(r2, 'passing received tiles across must be legal').not.toBeNull()
  })

  it('continuing to the second charleston keeps passing', () => {
    let game = createDemoGame()
    game.gameState.status = 'charleston'
    let charleston: CharlestonState = createCharlestonState()

    for (let i = 0; i < 3; i++) {
      const result = executeCharlestonPass(game, charleston, firstThreePassable(game))
      expect(result).not.toBeNull()
      game = result!.gameState
      charleston = result!.charleston
    }
    expect(charleston.phase).toBe('stop_vote')

    // Vote to continue -> second charleston starts with a left pass
    const voted = submitStopVote(game, charleston, false)
    expect(voted).not.toBeNull()
    charleston = voted!.charleston
    game = voted!.gameState

    // Bots may still veto (they vote too) - accept either outcome, but if we
    // are passing again the direction must be 'left' per NMJL second-charleston order.
    if (charleston.phase === 'pass') {
      expect(charleston.round).toBe('second')
      expect(charleston.direction).toBe('left')
    } else {
      expect(charleston.phase).toBe('courtesy')
    }
  })
})
