'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { isValidRoomCode, ROOM_CODE_LENGTH } from '@/lib/rooms/codes'
import type { RoomInfo } from '@/lib/rooms/types'

export type JoinRoomFormProps = {
  onJoined: (room: RoomInfo) => void
}

export function JoinRoomForm({ onJoined }: JoinRoomFormProps) {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidRoomCode(code)) {
      setError('Room codes are 6 letters and numbers — check yours and try again.')
      return
    }
    setJoining(true)
    setError(null)
    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const body = (await res.json()) as { room?: RoomInfo; error?: string }
      if (res.ok && body.room) {
        onJoined(body.room)
      } else {
        setError(body.error ?? 'Could not join that room — please try again.')
      }
    } catch {
      setError('Could not reach the game server — check your connection and try again.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-lg font-medium text-[var(--text-primary)]">
        Room code
        <input
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, ROOM_CODE_LENGTH)
            )
          }
          maxLength={ROOM_CODE_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          placeholder="ABC234"
          className="input-elegant text-center font-mono text-2xl tracking-[0.25em] uppercase"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-lg)] bg-[var(--error-light)] px-4 py-3 text-lg text-[var(--error)]"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={joining} className="btn-berry text-xl">
        {joining ? 'Joining…' : 'Join room'}
      </button>
    </form>
  )
}
