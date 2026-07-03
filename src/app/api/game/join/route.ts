import { NextResponse } from 'next/server'
import { createAuthedServerClient, createServiceClient } from '@/lib/supabase/server'
import { isValidRoomCode, normalizeRoomCode } from '@/lib/rooms/codes'
import {
  fetchRoomInfo,
  ROOMS_OFFLINE_ERROR,
  supabaseConfigured,
} from '@/lib/rooms/server'

const SEAT_COUNT = 4
const SEAT_ATTEMPTS = 2
const UNIQUE_VIOLATION = '23505'

type SeatRow = {
  user_id: string | null
  seat: number | null
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const rawCode =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).code
      : undefined
  if (typeof rawCode !== 'string' || !isValidRoomCode(rawCode)) {
    return NextResponse.json(
      { error: 'Room codes are 6 letters and numbers — check yours and try again.' },
      { status: 400 }
    )
  }
  const code = normalizeRoomCode(rawCode)

  try {
    const authed = await createAuthedServerClient()
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to join a private room.' },
        { status: 401 }
      )
    }

    const service = createServiceClient()

    const { data: gameData, error: gameError } = await service
      .from('games')
      .select('id, status')
      .eq('code', code)
      .maybeSingle()
    if (gameError) {
      console.error('join room: game lookup failed', gameError.message)
      return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
    }
    if (!gameData) {
      return NextResponse.json(
        { error: 'No room found with that code — check it and try again.' },
        { status: 404 }
      )
    }
    const game = gameData as { id: string; status: string | null }

    for (let attempt = 0; attempt < SEAT_ATTEMPTS; attempt++) {
      const { data: seatData, error: seatsError } = await service
        .from('game_players')
        .select('user_id, seat')
        .eq('game_id', game.id)
      if (seatsError) {
        console.error('join room: seats lookup failed', seatsError.message)
        return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
      }
      const seatRows = (seatData ?? []) as SeatRow[]

      // Idempotent: already seated (even if the game has started) —
      // return the room rather than erroring.
      if (seatRows.some((row) => row.user_id === user.id)) {
        const room = await fetchRoomInfo(service, game.id)
        if (!room) {
          return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
        }
        return NextResponse.json({ room })
      }

      if (game.status !== 'waiting') {
        return NextResponse.json(
          { error: 'That game has already started.' },
          { status: 409 }
        )
      }

      const takenSeats = new Set(seatRows.map((row) => row.seat))
      const freeSeat = Array.from({ length: SEAT_COUNT }, (_, i) => i).find(
        (seat) => !takenSeats.has(seat)
      )
      if (freeSeat === undefined) {
        return NextResponse.json(
          { error: 'That room is full — private games seat 4 players.' },
          { status: 409 }
        )
      }

      const { error: insertError } = await service.from('game_players').insert({
        game_id: game.id,
        user_id: user.id,
        seat: freeSeat,
      })
      if (!insertError) {
        const room = await fetchRoomInfo(service, game.id)
        if (!room) {
          return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
        }
        return NextResponse.json({ room })
      }
      if (insertError.code !== UNIQUE_VIOLATION) {
        console.error('join room: seat insert failed', insertError.message)
        return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
      }
      // Someone claimed that seat (or we double-clicked) at the same
      // moment — loop once more with fresh seat data.
    }

    return NextResponse.json(
      { error: 'That room just filled up — ask your host for a fresh code.' },
      { status: 409 }
    )
  } catch (e) {
    console.error('join room failed', e)
    return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
  }
}
