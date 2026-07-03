// Shared types for private rooms — used by the API routes, the
// useGameRoom hook, and the lobby components.

export type RoomStatus =
  | 'waiting'
  | 'charleston'
  | 'playing'
  | 'finished'
  | 'abandoned'

export type RoomPlayer = {
  userId: string
  displayName: string
  seat: number
  isBot: boolean
  isHost: boolean
}

export type RoomInfo = {
  id: string
  code: string
  status: RoomStatus
  hostId: string
  turnTimerSec: number
  players: RoomPlayer[]
}

// POST /api/game/create
export type CreateRoomRequest = {
  turnTimerSec?: number
}

// POST /api/game/join
export type JoinRoomRequest = {
  code: string
}

// Success shape for create / join / GET /api/game/[id]/room
export type RoomResponse = {
  room: RoomInfo
}

// Error shape for every rooms endpoint
export type RoomErrorResponse = {
  error: string
}
