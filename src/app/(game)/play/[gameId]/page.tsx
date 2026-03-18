import { GameBoard } from '@/components/game/GameBoard'

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params

  if (gameId === 'demo') {
    return <GameBoard />
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
