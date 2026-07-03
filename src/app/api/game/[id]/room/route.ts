import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  fetchRoomInfo,
  ROOMS_OFFLINE_ERROR,
  supabaseConfigured,
} from '@/lib/rooms/server'

// Polling fallback for the lobby: returns the lobby-safe view of a room
// (never hands or the wall). Realtime is the fast path; this is truth.
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
  }

  const { id } = await context.params

  try {
    const service = createServiceClient()
    const room = await fetchRoomInfo(service, id)
    if (!room) {
      return NextResponse.json(
        { error: 'No room found — it may have been closed.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ room })
  } catch (e) {
    console.error('room lookup failed', e)
    return NextResponse.json({ error: ROOMS_OFFLINE_ERROR }, { status: 503 })
  }
}
