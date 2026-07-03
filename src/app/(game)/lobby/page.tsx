'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GameModeSelector } from '@/components/game/GameModeSelector'
import { JoinRoomForm } from '@/components/game/JoinRoomForm'
import type { RoomInfo } from '@/lib/rooms/types'
import type { BotDifficulty, GameMode } from '@/lib/game-engine/types'

const TIMER_CHOICES = [
  { value: 0, label: 'Relaxed', hint: 'No timer' },
  { value: 60, label: '60s', hint: 'Standard' },
  { value: 30, label: '30s', hint: 'Snappy' },
] as const

const BOT_CHOICES = [
  { value: 'easy' as BotDifficulty, label: 'Friendly', hint: 'Casual bots' },
  { value: 'clever' as BotDifficulty, label: 'Clever', hint: 'They build hands' },
] as const

export default function LobbyPage() {
  const router = useRouter()

  // Table setup - play vs bots
  const [gameMode, setGameMode] = useState<GameMode>('standard')
  const [timer, setTimer] = useState<number>(60)
  const [bots, setBots] = useState<BotDifficulty>('easy')
  const [players, setPlayers] = useState<2 | 3>(2)

  // Private room
  const [creating, setCreating] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)

  function startBotGame() {
    const params = new URLSearchParams({
      mode: gameMode,
      timer: String(timer),
      bots,
    })
    if (gameMode === 'short') params.set('players', String(players))
    router.push(`/play/demo?${params.toString()}`)
  }

  async function createRoom() {
    setCreating(true)
    setRoomError(null)
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnTimerSec: timer > 0 ? timer : 60 }),
      })
      const data = (await res.json()) as { room?: RoomInfo; error?: string }
      if (!res.ok || !data.room) {
        setRoomError(data.error ?? 'Could not create a room - please try again.')
        setCreating(false)
        return
      }
      router.push(`/play/${data.room.id}`)
    } catch {
      setRoomError('Could not reach the game server - bot games are always available.')
      setCreating(false)
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--accent-lavender)]">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col items-center gap-4 text-center">
            <h1 className="display-xl text-[var(--accent-gold)]">The Game Lobby</h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-lg">
              Set up your table and play Birdy - free, any time, with friendly
              bots or friends.
            </p>
          </div>
        </section>
        <div className="gingham-strip" aria-hidden="true" />

        {/* Table setup - play vs bots */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14 flex flex-col gap-8">
          <div className="tile-frame tile-edge-berry">
            <div className="tile-face bg-[var(--bg-elevated)] p-6 sm:p-8 flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <h2 className="display-lg text-[var(--text-primary)]">Play the bots</h2>
                <p className="text-lg text-[var(--text-secondary)]">
                  Margaret, Ruth and Florence are always ready for a game. Pick
                  your rules and go.
                </p>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="text-base font-semibold uppercase tracking-[0.14em] text-[var(--accent-warm)] mb-2">
                  Variant
                </legend>
                <GameModeSelector current={gameMode} onSelect={setGameMode} />
              </fieldset>

              {gameMode === 'short' && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-base font-semibold uppercase tracking-[0.14em] text-[var(--accent-warm)] mb-2">
                    Players at the table
                  </legend>
                  <div className="flex gap-3">
                    {([2, 3] as const).map((n) => (
                      <OptionPill
                        key={n}
                        selected={players === n}
                        onClick={() => setPlayers(n)}
                        label={`${n} players`}
                        hint={n === 2 ? 'You + 1 bot' : 'You + 2 bots'}
                      />
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-base font-semibold uppercase tracking-[0.14em] text-[var(--accent-warm)] mb-2">
                    Turn timer
                  </legend>
                  <div className="flex gap-3 flex-wrap">
                    {TIMER_CHOICES.map((c) => (
                      <OptionPill
                        key={c.value}
                        selected={timer === c.value}
                        onClick={() => setTimer(c.value)}
                        label={c.label}
                        hint={c.hint}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="text-base font-semibold uppercase tracking-[0.14em] text-[var(--accent-warm)] mb-2">
                    Bot skill
                  </legend>
                  <div className="flex gap-3 flex-wrap">
                    {BOT_CHOICES.map((c) => (
                      <OptionPill
                        key={c.value}
                        selected={bots === c.value}
                        onClick={() => setBots(c.value)}
                        label={c.label}
                        hint={c.hint}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>

              <button onClick={startBotGame} className="btn-berry text-xl h-14 self-start px-10">
                Start the game
              </button>
            </div>
          </div>

          {/* Private room */}
          <div className="tile-frame tile-edge-indigo">
            <div className="tile-face bg-[var(--bg-elevated)] p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="display-lg text-[var(--text-primary)]">Private room</h2>
                <p className="text-lg text-[var(--text-secondary)]">
                  Host a table and share the code, or join a friend&apos;s room.
                  Up to 4 players. You&apos;ll need to be signed in.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Host a table</h3>
                  <button
                    onClick={createRoom}
                    disabled={creating}
                    className="btn-primary text-lg self-start px-8"
                  >
                    {creating ? 'Setting up your room…' : 'Create a room'}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Join with a code</h3>
                  <JoinRoomForm onJoined={(room) => router.push(`/play/${room.id}`)} />
                </div>
              </div>

              {roomError && (
                <p role="alert" className="rounded-[var(--radius-lg)] bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-base">
                  {roomError}{' '}
                  {roomError.toLowerCase().includes('sign in') && (
                    <a href="/login" className="underline font-semibold">Sign in</a>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* On the horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ComingSoonCard
              title="Public matchmaking"
              copy="Join the queue and get matched with players around the world."
            />
            <ComingSoonCard
              title="Tournaments"
              copy="Organised events with rankings - once the community grows."
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function OptionPill({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      className="flex flex-col items-start rounded-[var(--radius-lg)] border-2 px-5 py-2.5 min-h-[var(--touch-min)] transition-colors active:scale-[0.98]"
      style={{
        background: selected ? 'var(--accent-lavender)' : 'var(--bg-elevated)',
        borderColor: selected ? 'var(--accent-gold)' : 'var(--border-strong)',
      }}
    >
      <span className="text-base font-bold text-[var(--text-primary)]">{label}</span>
      <span className="text-sm text-[var(--text-muted)]">{hint}</span>
    </button>
  )
}

function ComingSoonCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] p-6 flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
        Coming soon
      </p>
      <h3 className="text-lg font-bold text-[var(--text-secondary)]">{title}</h3>
      <p className="text-base text-[var(--text-muted)]">{copy}</p>
    </div>
  )
}
