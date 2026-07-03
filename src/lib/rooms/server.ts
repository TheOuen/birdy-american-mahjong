// Server-side helpers for the private-rooms API routes.
// Reads only lobby-safe columns — never hands or the wall.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { RoomInfo, RoomPlayer, RoomStatus } from './types'

// Friendly copy for every "Supabase is missing or unreachable" case.
export const ROOMS_OFFLINE_ERROR =
  'Online rooms need the game server — bot games are always available.'

// Same guard pattern as src/lib/shop/products.ts: degrade gracefully
// instead of throwing when the project is not connected yet.
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

type GameRow = {
  id: string
  code: string | null
  status: string | null
  host_id: string | null
  turn_timer_sec: number | null
}

type PlayerRow = {
  user_id: string | null
  seat: number | null
  is_bot: boolean | null
}

type ProfileRow = {
  id: string
  display_name: string | null
}

// Builds the lobby view of a game: room metadata plus seated players with
// display names joined from profiles (falling back to 'Player N').
export async function fetchRoomInfo(
  supabase: SupabaseClient,
  gameId: string
): Promise<RoomInfo | null> {
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .select('id, code, status, host_id, turn_timer_sec')
    .eq('id', gameId)
    .maybeSingle()
  if (gameError || !gameData) return null
  const game = gameData as GameRow

  const { data: playerData, error: playersError } = await supabase
    .from('game_players')
    .select('user_id, seat, is_bot')
    .eq('game_id', gameId)
    .order('seat', { ascending: true })
  if (playersError) return null
  const playerRows = (playerData ?? []) as PlayerRow[]

  const userIds = playerRows
    .map((row) => row.user_id)
    .filter((id): id is string => Boolean(id))

  const displayNames = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const profile of (profileData ?? []) as ProfileRow[]) {
      if (profile.display_name) displayNames.set(profile.id, profile.display_name)
    }
  }

  const players: RoomPlayer[] = playerRows.map((row) => {
    const seat = row.seat ?? 0
    const isBot = Boolean(row.is_bot)
    const fromProfile = row.user_id ? displayNames.get(row.user_id) : undefined
    return {
      userId: row.user_id ?? '',
      displayName: isBot ? 'Birdy Bot' : fromProfile ?? `Player ${seat + 1}`,
      seat,
      isBot,
      isHost: Boolean(row.user_id && row.user_id === game.host_id),
    }
  })

  return {
    id: game.id,
    code: game.code ?? '',
    status: (game.status ?? 'waiting') as RoomStatus,
    hostId: game.host_id ?? '',
    turnTimerSec: game.turn_timer_sec ?? 30,
    players,
  }
}
