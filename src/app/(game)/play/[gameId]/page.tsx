import { redirect } from 'next/navigation'
import { GameBoard } from '@/components/game/GameBoard'
import { RoomWaiting } from '@/components/game/RoomWaiting'
import { createAuthedServerClient } from '@/lib/supabase/server'
import type { BotDifficulty, GameMode } from '@/lib/game-engine/types'

type RawParam = string | string[] | undefined

function first(raw: RawParam): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw
}

// Table options arrive as query params from the lobby's setup panel.
// Anything outside the allowed sets falls back to safe defaults.
function parseMode(raw: RawParam): GameMode | undefined {
  const value = first(raw)
  if (value === 'messy' || value === 'short' || value === 'blanks' || value === 'standard') {
    return value
  }
  return undefined
}

function parseTimer(raw: RawParam): number | undefined {
  const value = Number(first(raw))
  if (Number.isInteger(value) && (value === 0 || (value >= 15 && value <= 120))) {
    return value
  }
  return undefined
}

function parseBots(raw: RawParam): BotDifficulty | undefined {
  const value = first(raw)
  return value === 'easy' || value === 'clever' ? value : undefined
}

function parsePlayers(raw: RawParam): 2 | 3 | undefined {
  const value = Number(first(raw))
  return value === 2 || value === 3 ? (value as 2 | 3) : undefined
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { gameId } = await params
  const search = searchParams ? await searchParams : {}

  if (gameId === 'demo') {
    return (
      <GameBoard
        mode={parseMode(search.mode)}
        timerSec={parseTimer(search.timer)}
        botDifficulty={parseBots(search.bots)}
        playerCount={parsePlayers(search.players)}
      />
    )
  }

  // A real room: the waiting lobby needs to know who's looking at it.
  const supabase = await createAuthedServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <RoomWaiting roomId={gameId} currentUserId={user.id} />
}
