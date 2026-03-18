type PlayerRow = {
  displayName: string
  email: string
  gamesPlayed: number
  gamesWon: number
  rating: number
  joined: string
}

const PLACEHOLDER_PLAYERS: PlayerRow[] = [
  { displayName: 'Alice Chen', email: 'alice@example.com', gamesPlayed: 142, gamesWon: 38, rating: 1520, joined: 'Jan 5, 2025' },
  { displayName: 'Barbara Johnson', email: 'barbara@example.com', gamesPlayed: 97, gamesWon: 22, rating: 1480, joined: 'Jan 12, 2025' },
  { displayName: 'Carol Davis', email: 'carol@example.com', gamesPlayed: 256, gamesWon: 71, rating: 1610, joined: 'Dec 28, 2024' },
  { displayName: 'Dorothy Lee', email: 'dorothy@example.com', gamesPlayed: 63, gamesWon: 14, rating: 1390, joined: 'Feb 3, 2025' },
  { displayName: 'Eleanor Smith', email: 'eleanor@example.com', gamesPlayed: 184, gamesWon: 52, rating: 1570, joined: 'Jan 1, 2025' },
  { displayName: 'Frances Wilson', email: 'frances@example.com', gamesPlayed: 31, gamesWon: 6, rating: 1340, joined: 'Mar 8, 2025' },
  { displayName: 'Grace Kim', email: 'grace@example.com', gamesPlayed: 119, gamesWon: 29, rating: 1500, joined: 'Jan 20, 2025' },
  { displayName: 'Helen Park', email: 'helen@example.com', gamesPlayed: 78, gamesWon: 19, rating: 1450, joined: 'Feb 14, 2025' },
]

export default function AdminUsersPage() {
  return (
    <div>
      <h1
        className="font-semibold mb-8"
        style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
      >
        Players
      </h1>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative" style={{ maxWidth: '400px' }}>
          <svg
            className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search players by name or email..."
            className="w-full rounded-md text-base outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '12px 16px 12px 48px',
              minHeight: 'var(--touch-min)',
              fontSize: 'var(--text-base)',
            }}
          />
        </div>
      </div>

      {/* Players Table */}
      <div
        className="rounded-md overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 'var(--text-base)' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Display Name
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Email
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Games Played
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Games Won
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Rating
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_PLAYERS.map((player, i) => (
                <tr
                  key={player.email}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0"
                        style={{
                          backgroundColor: 'var(--brand)',
                          color: 'var(--text-inverse)',
                        }}
                      >
                        {player.displayName.charAt(0)}
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {player.displayName}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {player.email}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {player.gamesPlayed}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {player.gamesWon}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="font-medium"
                      style={{ color: 'var(--brand)' }}
                    >
                      {player.rating}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {player.joined}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
