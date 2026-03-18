// Charleston phase — pre-game tile exchange
// First Charleston (mandatory): Right → Across → Left
// Second Charleston (optional, all must agree): Left → Across → Right
// Courtesy pass (optional): 0-3 tiles across

import type { Tile, TileId } from '../tiles/constants'
import type { DemoGameState } from './engine'

export type CharlestonDirection = 'right' | 'across' | 'left'

export type CharlestonRound = 'first' | 'second'

export type CharlestonState = {
  round: CharlestonRound
  step: 1 | 2 | 3
  direction: CharlestonDirection
  playerSelection: TileId[]
  receivedTileIds: Set<TileId> // tiles received in current pass (can't pass back)
  complete: boolean
  awaitingSecondVote: boolean // waiting for players to agree to second charleston
}

const FIRST_DIRECTIONS: Record<1 | 2 | 3, CharlestonDirection> = {
  1: 'right',
  2: 'across',
  3: 'left',
}

const SECOND_DIRECTIONS: Record<1 | 2 | 3, CharlestonDirection> = {
  1: 'left',
  2: 'across',
  3: 'right',
}

export function createCharlestonState(): CharlestonState {
  return {
    round: 'first',
    step: 1,
    direction: 'right',
    playerSelection: [],
    receivedTileIds: new Set(),
    complete: false,
    awaitingSecondVote: false,
  }
}

export function getDirectionLabel(direction: CharlestonDirection): string {
  return { right: 'Right', across: 'Across', left: 'Left' }[direction]
}

// Validate tiles selected for passing
export function validateCharlestonSelection(
  hand: Tile[],
  selectedIds: TileId[],
  receivedTileIds: Set<TileId>
): { valid: boolean; error?: string } {
  if (selectedIds.length !== 3) {
    return { valid: false, error: 'Select exactly 3 tiles to pass.' }
  }

  // Check all tiles exist in hand
  for (const id of selectedIds) {
    const tile = hand.find((t) => t.id === id)
    if (!tile) return { valid: false, error: 'Selected tile not in hand.' }

    // Jokers cannot be passed in Charleston
    if (tile.type.kind === 'joker') {
      return { valid: false, error: 'Jokers cannot be passed in the Charleston.' }
    }
  }

  // Check pass-back restriction: can't pass back tiles received in same direction
  for (const id of selectedIds) {
    if (receivedTileIds.has(id)) {
      return { valid: false, error: 'You cannot pass back a tile you just received.' }
    }
  }

  return { valid: true }
}

function getPassTarget(fromSeat: number, direction: CharlestonDirection): number {
  const offset = { right: 1, across: 2, left: 3 }[direction]
  return (fromSeat + offset) % 4
}

export function executeCharlestonPass(
  state: DemoGameState,
  charleston: CharlestonState,
  playerTileIds: TileId[]
): { gameState: DemoGameState; charleston: CharlestonState } | null {
  // Validate human player's selection
  const humanPlayer = state.gameState.players[0]
  const validation = validateCharlestonSelection(
    humanPlayer.hand,
    playerTileIds,
    charleston.receivedTileIds
  )
  if (!validation.valid) return null

  const players = state.gameState.players.map((p) => ({ ...p, hand: [...p.hand] }))
  const tilesToReceive: Map<number, Tile[]> = new Map()

  for (let seat = 0; seat < 4; seat++) {
    tilesToReceive.set(seat, [])
  }

  for (let seat = 0; seat < 4; seat++) {
    const player = players[seat]
    let selectedIds: TileId[]

    if (seat === 0) {
      selectedIds = playerTileIds
    } else {
      // Bot: pick 3 random non-joker tiles, avoiding pass-backs
      const candidates = player.hand.filter((t) => t.type.kind !== 'joker')
      const shuffled = [...candidates].sort(() => Math.random() - 0.5)
      selectedIds = shuffled.slice(0, 3).map((t) => t.id)
      // Fallback if not enough non-jokers (shouldn't happen, but safe)
      if (selectedIds.length < 3) {
        const remaining = player.hand
          .filter((t) => !selectedIds.includes(t.id))
          .sort(() => Math.random() - 0.5)
        while (selectedIds.length < 3 && remaining.length > 0) {
          selectedIds.push(remaining.pop()!.id)
        }
      }
    }

    const passingTiles = selectedIds
      .map((id) => player.hand.find((t) => t.id === id))
      .filter((t): t is Tile => t !== undefined)

    if (passingTiles.length !== 3) return null

    // Remove passed tiles from hand
    player.hand = player.hand.filter((t) => !selectedIds.includes(t.id))

    // Route to target
    const targetSeat = getPassTarget(seat, charleston.direction)
    tilesToReceive.get(targetSeat)!.push(...passingTiles)
  }

  // Track what the human player receives (for pass-back restriction on next pass)
  const humanReceived = tilesToReceive.get(0)!
  const newReceivedIds = new Set(humanReceived.map((t) => t.id))

  // Add received tiles to each player's hand
  for (let seat = 0; seat < 4; seat++) {
    const received = tilesToReceive.get(seat)!
    players[seat].hand.push(...received)
  }

  // Determine next state
  const directions = charleston.round === 'first' ? FIRST_DIRECTIONS : SECOND_DIRECTIONS
  const nextStep = (charleston.step + 1) as 1 | 2 | 3 | 4
  const roundComplete = nextStep > 3

  let newCharleston: CharlestonState

  if (roundComplete && charleston.round === 'first') {
    // First charleston done — in demo mode, skip second charleston for simplicity
    // (In multiplayer, we'd vote here)
    newCharleston = { ...charleston, complete: true }
  } else if (roundComplete && charleston.round === 'second') {
    newCharleston = { ...charleston, complete: true }
  } else {
    newCharleston = {
      round: charleston.round,
      step: nextStep as 1 | 2 | 3,
      direction: directions[nextStep as 1 | 2 | 3],
      playerSelection: [],
      receivedTileIds: newReceivedIds,
      complete: false,
      awaitingSecondVote: false,
    }
  }

  const charlestonStepName = roundComplete
    ? 'done'
    : `${charleston.round}_${newCharleston.direction}` as const

  return {
    gameState: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players,
        charlestonStep: charlestonStepName as typeof state.gameState.charlestonStep,
      },
    },
    charleston: newCharleston,
  }
}
