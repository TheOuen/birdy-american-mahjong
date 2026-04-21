// Charleston phase — pre-game tile exchange
// First Charleston (mandatory): Right → Across → Left
// Stop vote after first Left: any player saying "stop" ends Charleston (courtesy still offered)
// Second Charleston (optional): Left → Across → Right
// Blind pass: on first-left OR second-right only, forward 1-3 just-received tiles unseen
// Courtesy pass (optional, once): 0-3 tiles exchanged with the player across

import type { Tile, TileId } from '../tiles/constants'
import type { DemoGameState } from './engine'

export type CharlestonDirection = 'right' | 'across' | 'left'

export type CharlestonRound = 'first' | 'second'

// Phase of the Charleston state machine
// pass = one of the three directional passes is active
// stop_vote = first Charleston complete, awaiting stop/continue vote
// courtesy = Charleston finished, optional courtesy exchange with player across
// done = all finished, transition to playing
export type CharlestonPhase = 'pass' | 'stop_vote' | 'courtesy' | 'done'

export type CharlestonState = {
  round: CharlestonRound
  step: 1 | 2 | 3
  direction: CharlestonDirection
  phase: CharlestonPhase
  playerSelection: TileId[]
  receivedTileIds: Set<TileId>       // tiles received in the LAST pass (can't pass back)
  lastReceivedTileIds: Set<TileId>   // alias kept for clarity in blind-pass validation
  complete: boolean
  // --- legacy flag kept for backward compat with existing UI wiring ---
  awaitingSecondVote: boolean
  // Stop-vote bookkeeping (phase === 'stop_vote')
  stopVotes: Array<boolean | null>   // index = seat. null = no vote yet, true = stop, false = continue
  // Courtesy-vote bookkeeping (phase === 'courtesy')
  courtesyOffers: Array<number | null> // index = seat. count of tiles each player willing to exchange (0-3) or null
  courtesySelection: TileId[]          // human's tile selection during courtesy phase
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
    phase: 'pass',
    playerSelection: [],
    receivedTileIds: new Set(),
    lastReceivedTileIds: new Set(),
    complete: false,
    awaitingSecondVote: false,
    stopVotes: [null, null, null, null],
    courtesyOffers: [null, null, null, null],
    courtesySelection: [],
  }
}

export function getDirectionLabel(direction: CharlestonDirection): string {
  return { right: 'Right', across: 'Across', left: 'Left' }[direction]
}

// Is the current step one on which blind passes are allowed?
// Per DRAFT GUIDE: only the last pass of each Charleston (first_left OR second_right)
export function isBlindPassEligible(charleston: CharlestonState): boolean {
  if (charleston.phase !== 'pass') return false
  if (charleston.round === 'first' && charleston.direction === 'left') return true
  if (charleston.round === 'second' && charleston.direction === 'right') return true
  return false
}

// Validate tiles selected for passing (standard 3-tile pass)
export function validateCharlestonSelection(
  hand: Tile[],
  selectedIds: TileId[],
  receivedTileIds: Set<TileId>
): { valid: boolean; error?: string } {
  if (selectedIds.length !== 3) {
    return { valid: false, error: 'Select exactly 3 tiles to pass.' }
  }

  for (const id of selectedIds) {
    const tile = hand.find((t) => t.id === id)
    if (!tile) return { valid: false, error: 'Selected tile not in hand.' }

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

// Validate a blind pass — some tiles forwarded unseen from the just-received bundle,
// the rest selected from the player's own hand. Total must be exactly 3.
export function validateBlindPass(
  hand: Tile[],
  blindTileIds: TileId[],
  fromHandTileIds: TileId[],
  lastReceivedTileIds: Set<TileId>,
  charleston: CharlestonState
): { valid: boolean; error?: string } {
  if (!isBlindPassEligible(charleston)) {
    return { valid: false, error: 'Blind passing is only allowed on the last pass of each Charleston.' }
  }

  if (blindTileIds.length < 1 || blindTileIds.length > 3) {
    return { valid: false, error: 'Blind-pass 1, 2, or 3 tiles.' }
  }

  if (blindTileIds.length + fromHandTileIds.length !== 3) {
    return { valid: false, error: 'You must pass a total of 3 tiles.' }
  }

  // Every blind tile must have just been received
  for (const id of blindTileIds) {
    if (!lastReceivedTileIds.has(id)) {
      return { valid: false, error: 'A blind-pass tile must come from the ones you just received.' }
    }
  }

  // The blind tile must also still be in hand (it was just added there)
  for (const id of blindTileIds) {
    if (!hand.find((t) => t.id === id)) {
      return { valid: false, error: 'Blind-pass tile not found in hand.' }
    }
  }

  // From-hand tiles: must be in hand, must NOT be jokers, must NOT overlap blind list
  const blindSet = new Set(blindTileIds)
  for (const id of fromHandTileIds) {
    if (blindSet.has(id)) {
      return { valid: false, error: 'Cannot select the same tile twice.' }
    }
    const tile = hand.find((t) => t.id === id)
    if (!tile) return { valid: false, error: 'Selected tile not in hand.' }
    if (tile.type.kind === 'joker') {
      return { valid: false, error: 'Jokers cannot be passed in the Charleston.' }
    }
  }

  return { valid: true }
}

function getPassTarget(fromSeat: number, direction: CharlestonDirection): number {
  const offset = { right: 1, across: 2, left: 3 }[direction]
  return (fromSeat + offset) % 4
}

// Pick 3 tiles for a bot during a standard pass
function pickBotTiles(player: { hand: Tile[] }, receivedTileIds: Set<TileId>): TileId[] {
  const candidates = player.hand.filter(
    (t) => t.type.kind !== 'joker' && !receivedTileIds.has(t.id)
  )
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, 3).map((t) => t.id)
  // Fallback if somehow we can't fill 3 without pass-back (extreme edge cases)
  if (picked.length < 3) {
    const remaining = player.hand
      .filter((t) => !picked.includes(t.id) && t.type.kind !== 'joker')
      .sort(() => Math.random() - 0.5)
    while (picked.length < 3 && remaining.length > 0) {
      picked.push(remaining.pop()!.id)
    }
  }
  return picked
}

type PassResult = { gameState: DemoGameState; charleston: CharlestonState }

// Advance the charleston state machine after a pass completes.
// Returns the next CharlestonState and the new charlestonStep label for GameState.
function advanceAfterPass(
  charleston: CharlestonState,
  humanReceivedIds: Set<TileId>
): { charleston: CharlestonState; charlestonStepName: string } {
  const directions = charleston.round === 'first' ? FIRST_DIRECTIONS : SECOND_DIRECTIONS
  const nextStep = (charleston.step + 1) as 1 | 2 | 3 | 4
  const roundComplete = nextStep > 3

  if (roundComplete && charleston.round === 'first') {
    // End of first Charleston → stop vote
    return {
      charleston: {
        ...charleston,
        phase: 'stop_vote',
        playerSelection: [],
        receivedTileIds: humanReceivedIds,
        lastReceivedTileIds: humanReceivedIds,
        awaitingSecondVote: true,
        stopVotes: [null, null, null, null],
      },
      charlestonStepName: 'stop_vote',
    }
  }

  if (roundComplete && charleston.round === 'second') {
    // End of second Charleston → courtesy phase (fresh offers)
    return {
      charleston: {
        ...charleston,
        phase: 'courtesy',
        playerSelection: [],
        receivedTileIds: humanReceivedIds,
        lastReceivedTileIds: humanReceivedIds,
        awaitingSecondVote: false,
        courtesyOffers: [null, null, null, null],
        courtesySelection: [],
      },
      charlestonStepName: 'courtesy',
    }
  }

  // Still passing within the same round
  const nextDirection = directions[nextStep as 1 | 2 | 3]
  return {
    charleston: {
      round: charleston.round,
      step: nextStep as 1 | 2 | 3,
      direction: nextDirection,
      phase: 'pass',
      playerSelection: [],
      receivedTileIds: humanReceivedIds,
      lastReceivedTileIds: humanReceivedIds,
      complete: false,
      awaitingSecondVote: false,
      stopVotes: [null, null, null, null],
      courtesyOffers: [null, null, null, null],
      courtesySelection: [],
    },
    charlestonStepName: `${charleston.round}_${nextDirection}`,
  }
}

export function executeCharlestonPass(
  state: DemoGameState,
  charleston: CharlestonState,
  playerTileIds: TileId[]
): PassResult | null {
  if (charleston.phase !== 'pass') return null

  const humanPlayer = state.gameState.players[0]
  const validation = validateCharlestonSelection(
    humanPlayer.hand,
    playerTileIds,
    charleston.receivedTileIds
  )
  if (!validation.valid) return null

  const players = state.gameState.players.map((p) => ({ ...p, hand: [...p.hand] }))
  const tilesToReceive: Map<number, Tile[]> = new Map()
  for (let seat = 0; seat < 4; seat++) tilesToReceive.set(seat, [])

  for (let seat = 0; seat < 4; seat++) {
    const player = players[seat]
    let selectedIds: TileId[]

    if (seat === 0) {
      selectedIds = playerTileIds
    } else {
      selectedIds = pickBotTiles(player, charleston.receivedTileIds)
    }

    const passingTiles = selectedIds
      .map((id) => player.hand.find((t) => t.id === id))
      .filter((t): t is Tile => t !== undefined)

    if (passingTiles.length !== 3) return null

    player.hand = player.hand.filter((t) => !selectedIds.includes(t.id))

    const targetSeat = getPassTarget(seat, charleston.direction)
    tilesToReceive.get(targetSeat)!.push(...passingTiles)
  }

  const humanReceived = tilesToReceive.get(0)!
  const humanReceivedIds = new Set(humanReceived.map((t) => t.id))

  for (let seat = 0; seat < 4; seat++) {
    const received = tilesToReceive.get(seat)!
    players[seat].hand.push(...received)
  }

  const advance = advanceAfterPass(charleston, humanReceivedIds)

  return {
    gameState: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players,
        charlestonStep: advance.charlestonStepName as typeof state.gameState.charlestonStep,
      },
    },
    charleston: advance.charleston,
  }
}

// Blind pass — forward 1/2/3 tiles unseen from the just-received bundle,
// pad with from-hand tiles (no jokers) to reach 3 total. Other players pass normally.
export function executeCharlestonBlindPass(
  state: DemoGameState,
  charleston: CharlestonState,
  blindTileIds: TileId[],
  fromHandTileIds: TileId[]
): PassResult | null {
  if (!isBlindPassEligible(charleston)) return null

  const humanPlayer = state.gameState.players[0]
  const validation = validateBlindPass(
    humanPlayer.hand,
    blindTileIds,
    fromHandTileIds,
    charleston.lastReceivedTileIds,
    charleston
  )
  if (!validation.valid) return null

  const players = state.gameState.players.map((p) => ({ ...p, hand: [...p.hand] }))
  const tilesToReceive: Map<number, Tile[]> = new Map()
  for (let seat = 0; seat < 4; seat++) tilesToReceive.set(seat, [])

  for (let seat = 0; seat < 4; seat++) {
    const player = players[seat]
    let selectedIds: TileId[]

    if (seat === 0) {
      selectedIds = [...blindTileIds, ...fromHandTileIds]
    } else {
      selectedIds = pickBotTiles(player, charleston.receivedTileIds)
    }

    const passingTiles = selectedIds
      .map((id) => player.hand.find((t) => t.id === id))
      .filter((t): t is Tile => t !== undefined)

    if (passingTiles.length !== 3) return null

    player.hand = player.hand.filter((t) => !selectedIds.includes(t.id))

    const targetSeat = getPassTarget(seat, charleston.direction)
    tilesToReceive.get(targetSeat)!.push(...passingTiles)
  }

  const humanReceived = tilesToReceive.get(0)!
  const humanReceivedIds = new Set(humanReceived.map((t) => t.id))

  for (let seat = 0; seat < 4; seat++) {
    const received = tilesToReceive.get(seat)!
    players[seat].hand.push(...received)
  }

  const advance = advanceAfterPass(charleston, humanReceivedIds)

  return {
    gameState: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players,
        charlestonStep: advance.charlestonStepName as typeof state.gameState.charlestonStep,
      },
    },
    charleston: advance.charleston,
  }
}

// Submit the human's stop-vote, bots vote randomly (~30% stop, 70% continue).
// If any single vote is "stop" → skip to courtesy phase.
// If everyone continues → start second Charleston.
export function submitStopVote(
  state: DemoGameState,
  charleston: CharlestonState,
  humanStop: boolean
): { gameState: DemoGameState; charleston: CharlestonState } | null {
  if (charleston.phase !== 'stop_vote') return null

  const votes: Array<boolean | null> = [humanStop, null, null, null]
  for (let seat = 1; seat < 4; seat++) {
    votes[seat] = Math.random() < 0.3 // 30% chance bot votes stop
  }

  const anyStop = votes.some((v) => v === true)

  if (anyStop) {
    return {
      gameState: {
        wall: state.wall,
        gameState: {
          ...state.gameState,
          charlestonStep: 'courtesy',
        },
      },
      charleston: {
        ...charleston,
        phase: 'courtesy',
        awaitingSecondVote: false,
        stopVotes: votes,
        courtesyOffers: [null, null, null, null],
        courtesySelection: [],
        playerSelection: [],
      },
    }
  }

  // All continue → second Charleston starts at Left
  return {
    gameState: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        charlestonStep: 'second_left',
      },
    },
    charleston: createSecondCharlestonState(),
  }
}

// Execute the courtesy pass between the human (seat 0) and the player across (seat 2).
// humanCount is 0-3. Bot picks its own 0-3 count randomly.
// Actual swap size = min(humanCount, botCount). If > 0, human selects that many tiles (no jokers).
// Exactly one courtesy pass per game, after which charleston is done.
export function executeCourtesyPass(
  state: DemoGameState,
  charleston: CharlestonState,
  humanCount: number,
  humanTileIds: TileId[]
): { gameState: DemoGameState; charleston: CharlestonState } | null {
  if (charleston.phase !== 'courtesy') return null
  if (humanCount < 0 || humanCount > 3) return null
  if (humanTileIds.length !== humanCount) return null

  const players = state.gameState.players.map((p) => ({ ...p, hand: [...p.hand] }))
  const human = players[0]
  const partner = players[2]

  // Bot (partner) randomly agrees to 0-3 — skewed toward agreement with however many human offered
  const botCount = Math.floor(Math.random() * 4) // 0..3
  const actualCount = Math.min(humanCount, botCount)

  // Validate human's selection (no jokers)
  for (const id of humanTileIds) {
    const tile = human.hand.find((t) => t.id === id)
    if (!tile) return null
    if (tile.type.kind === 'joker') return null
  }

  if (actualCount > 0) {
    // Human sends exactly actualCount tiles from their selection
    const humanSending = humanTileIds.slice(0, actualCount)

    // Bot picks actualCount non-joker tiles to send back
    const botCandidates = partner.hand.filter((t) => t.type.kind !== 'joker')
    const shuffled = [...botCandidates].sort(() => Math.random() - 0.5)
    const botSendingIds = shuffled.slice(0, actualCount).map((t) => t.id)
    if (botSendingIds.length < actualCount) {
      // Not enough non-jokers — abandon courtesy gracefully
      return {
        gameState: {
          wall: state.wall,
          gameState: {
            ...state.gameState,
            charlestonStep: 'done',
            status: state.gameState.status,
          },
        },
        charleston: { ...charleston, phase: 'done', complete: true },
      }
    }

    const humanTiles = humanSending
      .map((id) => human.hand.find((t) => t.id === id))
      .filter((t): t is Tile => t !== undefined)
    const botTiles = botSendingIds
      .map((id) => partner.hand.find((t) => t.id === id))
      .filter((t): t is Tile => t !== undefined)

    if (humanTiles.length !== actualCount || botTiles.length !== actualCount) return null

    human.hand = human.hand.filter((t) => !humanSending.includes(t.id))
    partner.hand = partner.hand.filter((t) => !botSendingIds.includes(t.id))

    human.hand.push(...botTiles)
    partner.hand.push(...humanTiles)
  }

  return {
    gameState: {
      wall: state.wall,
      gameState: {
        ...state.gameState,
        players,
        charlestonStep: 'done',
      },
    },
    charleston: {
      ...charleston,
      phase: 'done',
      complete: true,
      courtesyOffers: [humanCount, null, botCount, null],
      courtesySelection: [],
    },
  }
}

// Create a fresh CharlestonState for the second (optional) round
export function createSecondCharlestonState(): CharlestonState {
  return {
    round: 'second',
    step: 1,
    direction: 'left',
    phase: 'pass',
    playerSelection: [],
    receivedTileIds: new Set(),
    lastReceivedTileIds: new Set(),
    complete: false,
    awaitingSecondVote: false,
    stopVotes: [null, null, null, null],
    courtesyOffers: [null, null, null, null],
    courtesySelection: [],
  }
}
