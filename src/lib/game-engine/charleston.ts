// Charleston phase — pre-game tile exchange
// Three mandatory passes: Right → Across → Left

import type { Tile, TileId } from '../tiles/constants'
import type { DemoGameState } from './engine'

export type CharlestonDirection = 'right' | 'across' | 'left'

export type CharlestonState = {
  step: 1 | 2 | 3 // which of the 3 mandatory passes
  direction: CharlestonDirection
  playerSelection: TileId[] // player's selected tiles (0-3)
  complete: boolean
}

const STEP_DIRECTIONS: Record<1 | 2 | 3, CharlestonDirection> = {
  1: 'right',
  2: 'across',
  3: 'left',
}

export function createCharlestonState(): CharlestonState {
  return {
    step: 1,
    direction: 'right',
    playerSelection: [],
    complete: false,
  }
}

export function getDirectionLabel(direction: CharlestonDirection): string {
  return { right: 'Right', across: 'Across', left: 'Left' }[direction]
}

// Get the target player ID for passing in a given direction from a given seat
// Seats: 0=player, 1=bot-1 (right), 2=bot-2 (across), 3=bot-3 (left)
// Counter-clockwise seating, so:
//   right = seat+1, across = seat+2, left = seat+3 (all mod 4)
function getPassTarget(fromSeat: number, direction: CharlestonDirection): number {
  const offset = { right: 1, across: 2, left: 3 }[direction]
  return (fromSeat + offset) % 4
}

// Execute a charleston pass for all 4 players
// Player selects their 3 tiles; bots auto-select 3 random tiles
export function executeCharlestonPass(
  state: DemoGameState,
  charleston: CharlestonState,
  playerTileIds: TileId[]
): { gameState: DemoGameState; charleston: CharlestonState } | null {
  if (playerTileIds.length !== 3) return null

  const players = state.gameState.players.map((p) => ({ ...p, hand: [...p.hand] }))

  // Gather tiles to pass from each player
  const tilesToPass: Map<number, Tile[]> = new Map()
  const tilesToReceive: Map<number, Tile[]> = new Map()

  for (let seat = 0; seat < 4; seat++) {
    tilesToReceive.set(seat, [])
  }

  for (let seat = 0; seat < 4; seat++) {
    const player = players[seat]
    let selectedIds: TileId[]

    if (seat === 0) {
      // Human player
      selectedIds = playerTileIds
    } else {
      // Bot: pick 3 random non-joker tiles
      const nonJokers = player.hand.filter((t) => t.type.kind !== 'joker')
      const candidates = nonJokers.length >= 3 ? nonJokers : player.hand
      const shuffled = [...candidates].sort(() => Math.random() - 0.5)
      selectedIds = shuffled.slice(0, 3).map((t) => t.id)
    }

    const passingTiles = selectedIds
      .map((id) => player.hand.find((t) => t.id === id))
      .filter((t): t is Tile => t !== undefined)

    if (passingTiles.length !== 3) return null

    tilesToPass.set(seat, passingTiles)

    // Remove passed tiles from hand
    player.hand = player.hand.filter((t) => !selectedIds.includes(t.id))

    // Determine target
    const targetSeat = getPassTarget(seat, charleston.direction)
    tilesToReceive.get(targetSeat)!.push(...passingTiles)
  }

  // Add received tiles to each player's hand
  for (let seat = 0; seat < 4; seat++) {
    const received = tilesToReceive.get(seat)!
    players[seat].hand.push(...received)
  }

  // Advance to next step
  const nextStep = (charleston.step + 1) as 1 | 2 | 3 | 4
  const isComplete = nextStep > 3

  const newCharleston: CharlestonState = isComplete
    ? { ...charleston, complete: true }
    : {
        step: nextStep as 1 | 2 | 3,
        direction: STEP_DIRECTIONS[nextStep as 1 | 2 | 3],
        playerSelection: [],
        complete: false,
      }

  return {
    gameState: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players,
        charlestonStep: isComplete ? 'done' : state.gameState.charlestonStep,
      },
    },
    charleston: newCharleston,
  }
}
