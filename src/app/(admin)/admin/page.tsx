function StatIcon({ name }: { name: 'players' | 'active' | 'today' | 'total' }) {
  const iconProps = {
    width: 28,
    height: 28,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'players':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <circle cx="9" cy="7" r="4" />
          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
          <circle cx="19" cy="7" r="3" />
          <path d="M22 21v-1.5a3 3 0 0 0-2.25-2.9" />
        </svg>
      )
    case 'active':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    case 'today':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
        </svg>
      )
    case 'total':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
  }
}

type StatCard = {
  label: string
  value: string
  icon: 'players' | 'active' | 'today' | 'total'
  accent: string
}

const STATS: StatCard[] = [
  { label: 'Total Players', value: '1,247', icon: 'players', accent: 'var(--brand)' },
  { label: 'Active Games', value: '18', icon: 'active', accent: 'var(--accent-warm)' },
  { label: 'Games Today', value: '42', icon: 'today', accent: 'var(--accent-gold)' },
  { label: 'Total Games Played', value: '8,391', icon: 'total', accent: 'var(--brand-light)' },
]

type RecentGame = {
  id: string
  players: string
  status: 'In Progress' | 'Completed' | 'Waiting'
  created: string
}

const RECENT_GAMES: RecentGame[] = [
  { id: 'GM-4821', players: 'Alice, Bob, Carol, Dave', status: 'In Progress', created: '2 min ago' },
  { id: 'GM-4820', players: 'Eve, Frank, Grace, Heidi', status: 'Completed', created: '18 min ago' },
  { id: 'GM-4819', players: 'Irene, Jack, Karen, Leo', status: 'Completed', created: '45 min ago' },
  { id: 'GM-4818', players: 'Mia, Nate, Olivia, Pat', status: 'In Progress', created: '1 hr ago' },
  { id: 'GM-4817', players: 'Quinn, Rosa, Sam, Tina', status: 'Waiting', created: '1 hr ago' },
  { id: 'GM-4816', players: 'Uma, Vic, Wendy, Xander', status: 'Completed', created: '2 hr ago' },
]

function statusColor(status: RecentGame['status']): string {
  switch (status) {
    case 'In Progress':
      return 'var(--brand)'
    case 'Completed':
      return 'var(--text-muted)'
    case 'Waiting':
      return 'var(--accent-gold)'
  }
}

function statusBg(status: RecentGame['status']): string {
  switch (status) {
    case 'In Progress':
      return 'var(--success-light)'
    case 'Completed':
      return 'var(--bg-card)'
    case 'Waiting':
      return 'var(--warning-light)'
  }
}

export default function AdminDashboardPage() {
  return (
    <div>
      <h1
        className="font-semibold mb-8"
        style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
      >
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 p-5 rounded-md"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-md shrink-0"
              style={{
                backgroundColor: stat.accent,
                color: 'var(--text-inverse)',
              }}
            >
              <StatIcon name={stat.icon} />
            </div>
            <div>
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {stat.label}
              </div>
              <div
                className="font-bold"
                style={{
                  fontSize: 'var(--text-xl)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Games */}
      <div
        className="rounded-md overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            className="font-semibold"
            style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
          >
            Recent Games
          </h2>
        </div>

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
                  Game ID
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Players
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Status
                </th>
                <th
                  className="text-left px-6 py-3 font-medium"
                  style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {RECENT_GAMES.map((game, i) => (
                <tr
                  key={game.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td
                    className="px-6 py-4 font-medium"
                    style={{ color: 'var(--brand)' }}
                  >
                    {game.id}
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {game.players}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-block px-3 py-1 rounded-sm text-sm font-medium"
                      style={{
                        color: statusColor(game.status),
                        backgroundColor: statusBg(game.status),
                      }}
                    >
                      {game.status}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {game.created}
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
