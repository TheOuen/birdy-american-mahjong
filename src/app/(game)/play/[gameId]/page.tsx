import { GameBoard } from '@/components/game/GameBoard'
import type { GameMode } from '@/lib/game-engine/types'

// Accept an optional ?mode= query string for the demo flow (P5 variants).
// Values outside the allowed set are ignored and the game starts in 'standard'.
function parseMode(raw: string | string[] | undefined): GameMode | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'messy' || value === 'short' || value === 'blanks' || value === 'standard') {
    return value
  }
  return undefined
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams?: Promise<{ mode?: string | string[] }>
}) {
  const { gameId } = await params
  const resolvedSearch = searchParams ? await searchParams : undefined

  if (gameId === 'demo') {
    const mode = parseMode(resolvedSearch?.mode)
    return <GameBoard mode={mode} />
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold text-[var(--brand)]">
        Game: {gameId}
      </h1>
      <p className="text-lg text-[var(--text-muted)]">
        Multiplayer game loading — coming soon.
      </p>
      <a
        href="/lobby"
        className="px-8 py-4 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-md text-lg font-medium hover:bg-[var(--border)] transition-colors min-h-[var(--touch-min)]"
      >
        Back to Lobby
      </a>
    </main>
  )
}
