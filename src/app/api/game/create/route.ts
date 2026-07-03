import { NextResponse } from 'next/server'
import { createAuthedServerClient, createServiceClient } from '@/lib/supabase/server'
import { generateRoomCode } from '@/lib/rooms/codes'
import {
  fetchRoomInfo,
  ROOMS_OFFLINE_ERROR,
  supabaseConfigured,
} from '@/lib/rooms/server'

const MIN_TURN_TIMER_SEC = 30
const MAX_TURN_TIMER_SEC = 120
const DEFAULT_TURN_TIMER_SEC = 30
const CODE_ATTEMPTS = 3
const UNIQUE_VIOLATION = '23505'

function clampTurnTimer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_TURN_TIMER_SEC
  }
  return Math.min(MAX_TURN_TIMER_SEC, Math.max(MIN_TURN_TIMER_SEC, Math.round(value)))
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // An empty body is fine — every field is optional.
  }
  const turnTimerSec = clampTurnTimer(
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).turnTimerSec
      : undefined
  )

  try {
    const authed = await createAuthedServerClient()
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to host a private room.' },
        { status: 401 }
      )
    }

    // Writes go through the service client: game_players inserts are
    // reserved for the server by RLS. Nothing secret is returned.
    const service = createServiceClient()

    let gameId: string | null = null
    for (let attempt = 0; attempt < CODE_ATTEMPTS && !gameId; attempt++) {
      const code = generateRoomCode()
      const { data, error } = await service
        .from('games')
        .insert({
          code,
          type: 'private',
          status: 'waiting',
          host_id: user.id,
          turn_timer_sec: turnTimerSec,
        })
        .select('id')
        .single()
      if (data) {
        gameId = (data as { id: string }).id
      } else if (error && error.code !== UNIQUE_VIOLATION) {
        console.error('create room: games insert failed', error.message)
        return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
      }
      // On a code collision, loop and try a fresh code.
    }
    if (!gameId) {
      return NextResponse.json(
        { error: 'Could not find a free room code — please try again.' },
        { status: 503 }
      )
    }

    const { error: seatError } = await service.from('game_players').insert({
      game_id: gameId,
      user_id: user.id,
      seat: 0,
    })
    if (seatError) {
      console.error('create room: host seat insert failed', seatError.message)
      return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
    }

    const room = await fetchRoomInfo(service, gameId)
    if (!room) {
      return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
    }
    return NextResponse.json({ room })
  } catch (e) {
    console.error('create room failed', e)
    return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
  }
}
