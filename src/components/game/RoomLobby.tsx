'use client'

import { useEffect, useRef, useState } from 'react'
import type { RoomInfo, RoomPlayer } from '@/lib/rooms/types'

const SEAT_COUNT = 4
const MIN_PLAYERS_TO_START = 2
const COPIED_RESET_MS = 2000

export type RoomLobbyProps = {
  room: RoomInfo
  currentUserId: string
  onStart?: () => void
}

export function RoomLobby({ room, currentUserId, onStart }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }
  }, [])

  const isHost = room.hostId === currentUserId
  const canStart = room.players.length >= MIN_PLAYERS_TO_START

  const seats: (RoomPlayer | null)[] = Array.from(
    { length: SEAT_COUNT },
    (_, seat) => room.players.find((player) => player.seat === seat) ?? null
  )

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    } catch {
      // Clipboard unavailable (permissions, older browser) — the code is
      // displayed in large type, so it can still be shared by hand.
    }
  }

  return (
    <section
      aria-label="Private room lobby"
      className="tile-frame tile-edge-indigo w-full max-w-xl"
    >
      <div className="tile-face bg-[var(--bg-elevated)] p-6 sm:p-8 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold text-[var(--brand)]">
            Your private room
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Share this code with your friends so they can join you.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] bg-[var(--accent-lavender)] px-6 py-5">
          <p
            aria-label={`Room code ${room.code.split('').join(' ')}`}
            className="font-mono text-4xl font-bold tracking-[0.25em] text-[var(--brand)]"
          >
            {room.code}
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="btn-secondary min-w-40 bg-[var(--bg-elevated)]"
          >
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>

        <ul className="flex flex-col gap-3" aria-label="Players in this room">
          {seats.map((player, seat) =>
            player ? (
              <li
                key={seat}
                className="flex min-h-14 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-5 py-3"
              >
                <span className="text-lg font-semibold text-[var(--text-primary)]">
                  {player.displayName}
                  {player.userId === currentUserId ? ' (you)' : ''}
                </span>
                {player.isHost && (
                  <span className="rounded-full bg-[var(--accent-gold)] px-3 py-1 text-sm font-semibold text-[var(--text-inverse)]">
                    Host
                  </span>
                )}
              </li>
            ) : (
              <li
                key={seat}
                className="flex min-h-14 items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-5 py-3"
              >
                <span className="text-lg italic text-[var(--text-muted)]">
                  Waiting for a friend…
                </span>
              </li>
            )
          )}
        </ul>

        {isHost ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="btn-primary w-full text-xl"
            >
              Start game
            </button>
            {!canStart && (
              <p className="text-center text-lg text-[var(--text-muted)]">
                You need at least 2 players to start — empty seats are filled
                with friendly bots.
              </p>
            )}
          </div>
        ) : (
          <p
            role="status"
            className="text-center text-lg text-[var(--text-secondary)]"
          >
            Waiting for the host to start…
          </p>
        )}
      </div>
    </section>
  )
}
