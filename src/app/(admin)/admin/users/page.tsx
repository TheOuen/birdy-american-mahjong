import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'

export const metadata = { title: 'Players - Admin' }
export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  display_name: string | null
  games_played: number
  games_won: number
  rating: number
  created_at: string
}

export default async function AdminUsersPage() {
  const { rows: players, offline } = await adminQuery<ProfileRow>((sb) =>
    sb
      .from('profiles')
      .select('id, display_name, games_played, games_won, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Players
      </h1>

      {offline && <OfflineBanner thing="players" />}

      {!offline && players.length === 0 && (
        <p className="text-lg text-[var(--text-secondary)]">
          No players yet - accounts appear here as people sign up to play Birdy.
        </p>
      )}

      {players.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Games</th>
                <th className="px-4 py-3 font-semibold">Won</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">{p.display_name ?? 'Unnamed player'}</td>
                  <td className="px-4 py-3">{p.games_played}</td>
                  <td className="px-4 py-3">{p.games_won}</td>
                  <td className="px-4 py-3">{p.rating}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
