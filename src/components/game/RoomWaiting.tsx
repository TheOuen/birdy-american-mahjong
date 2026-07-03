'use client'

import Link from 'next/link'
import { useGameRoom } from '@/hooks/useGameRoom'
import { RoomLobby } from './RoomLobby'
import { useState } from 'react'

type RoomWaitingProps = {
  roomId: string
  currentUserId: string
}

// The waiting room for a private game: live player list via Supabase Realtime
// (with polling fallback), room code sharing, and the host's start control.
// Live dealing runs on the game server - until that ships, starting shows an
// honest notice instead of silently failing.
export function RoomWaiting({ roomId, currentUserId }: RoomWaitingProps) {
  const { room, loading, error } = useGameRoom(roomId)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-[var(--accent-lavender)] flex flex-col items-center justify-center gap-6 p-6">
      {loading && (
        <p className="text-xl text-[var(--text-secondary)]">Finding your room…</p>
      )}

      {!loading && (error || !room) && (
        <div className="tile-frame tile-edge-berry w-full max-w-md">
          <div className="tile-face bg-[var(--bg-elevated)] p-8 flex flex-col items-center gap-4 text-center">
            <h1 className="display-lg text-[var(--text-primary)]">Room not found</h1>
            <p className="text-lg text-[var(--text-secondary)]">
              {error ?? 'This room may have ended, or the game server is offline.'}
            </p>
            <Link href="/lobby" className="btn-primary text-lg px-8">
              Back to the lobby
            </Link>
          </div>
        </div>
      )}

      {!loading && room && (
        <>
          <RoomLobby
            room={room}
            currentUserId={currentUserId}
            onStart={() =>
              setNotice(
                'Live dealing is nearly ready - private tables currently gather here while the game server is finished. Play Birdy vs the bots in the meantime!'
              )
            }
          />
          {notice && (
            <p
              role="status"
              className="max-w-md rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border)] px-5 py-4 text-base text-[var(--text-secondary)] text-center"
            >
              {notice}
            </p>
          )}
          <Link href="/lobby" className="text-lg text-[var(--accent-gold)] underline underline-offset-2">
            Back to the lobby
          </Link>
        </>
      )}
    </main>
  )
}
