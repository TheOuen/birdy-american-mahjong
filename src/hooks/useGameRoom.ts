'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/browser'
import type { RoomInfo } from '@/lib/rooms/types'

const POLL_INTERVAL_MS = 5000

export type UseGameRoomResult = {
  room: RoomInfo | null
  loading: boolean
  error: string | null
}

// Live view of a room: subscribes to Realtime changes on `games` and
// `game_players` for this id and refetches the lobby-safe room snapshot
// from the API on every event, with a 5s poll as a fallback so the lobby
// stays fresh even if the websocket drops.
export function useGameRoom(roomId: string | null): UseGameRoomResult {
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(roomId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      setError(null)
      return
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setRoom(null)
      setLoading(false)
      setError('Online rooms need the game server — bot games are always available.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const refetch = async () => {
      try {
        const res = await fetch(`/api/game/${roomId}/room`, { cache: 'no-store' })
        const body = (await res.json()) as { room?: RoomInfo; error?: string }
        if (cancelled) return
        if (res.ok && body.room) {
          setRoom(body.room)
          setError(null)
        } else {
          setError(body.error ?? 'Could not load the room — please try again.')
        }
      } catch {
        if (!cancelled) {
          setError('Could not reach the game server — check your connection.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void refetch()

    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${roomId}` },
        () => {
          void refetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${roomId}`,
        },
        () => {
          void refetch()
        }
      )
      .subscribe()

    const pollId = setInterval(() => {
      void refetch()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(pollId)
      void supabase.removeChannel(channel)
    }
  }, [roomId])

  return { room, loading, error }
}
