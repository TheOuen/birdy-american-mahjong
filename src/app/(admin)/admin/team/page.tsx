import { createAuthedServerClient, createServiceClient } from '@/lib/supabase/server'
import { grantAdmin, revokeAdmin } from './actions'

export const metadata = { title: 'Admins - Admin' }
export const dynamic = 'force-dynamic'

type AccountRow = {
  id: string
  email: string
  role: string
  createdAt: string
  lastSignInAt: string | null
}

async function loadAccounts(): Promise<{ accounts: AccountRow[]; offline: boolean }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { accounts: [], offline: true }
  }
  try {
    const service = createServiceClient()
    const accounts: AccountRow[] = []
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
      if (error) throw error
      accounts.push(
        ...data.users.map((u) => ({
          id: u.id,
          email: u.email ?? '(no email)',
          role: (u.app_metadata as { role?: string } | undefined)?.role ?? 'player',
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
        }))
      )
      if (data.users.length < 200) break
    }
    return { accounts, offline: false }
  } catch (e) {
    console.error('loadAccounts failed', e)
    return { accounts: [], offline: true }
  }
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-GB') : '—'
}

export default async function AdminTeamPage() {
  const supabase = await createAuthedServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const myId = user?.id

  const { accounts, offline } = await loadAccounts()
  const admins = accounts.filter((a) => a.role === 'admin')
  const everyoneElse = accounts.filter((a) => a.role !== 'admin')

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Admins &amp; permissions
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 max-w-2xl">
          Who can open this admin panel. Admins can manage bookings, orders, the catalogue,
          posts and everything else in here. Everyone else can only play the game.
        </p>
      </div>

      {offline && (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--warning)] bg-[var(--warning-light)] px-5 py-4 text-base"
          style={{ color: 'var(--text-secondary)' }}
        >
          Account management needs the database connection (including the server-only service
          key). Add <code className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</code> to the
          server environment and this page comes to life.
        </div>
      )}

      {/* Invite / promote */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Add an admin
        </h2>
        <p className="text-base text-[var(--text-muted)]">
          Type an email address. If they already have an account it becomes an admin account;
          if not, one is created for them - they simply sign in with the usual email code.
        </p>
        <form action={grantAdmin} className="flex flex-wrap gap-3 items-stretch">
          <input
            type="email"
            name="email"
            required
            placeholder="name@example.com"
            className="input-elegant flex-1 min-w-[16rem]"
            aria-label="Email address to make an admin"
          />
          <button type="submit" className="btn-primary text-base px-6" disabled={offline}>
            Make admin
          </button>
        </form>
      </section>

      {/* Current admins */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Current admins ({admins.length})
        </h2>
        <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]">
          <table className="w-full text-left text-base min-w-[36rem]">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3 font-semibold">Last signed in</th>
                <th className="px-4 py-3 font-semibold text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-semibold">
                    {a.email}
                    {a.id === myId && <span className="text-[var(--text-muted)] font-normal"> (you)</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.lastSignInAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {a.id === myId ? (
                      <span className="text-sm text-[var(--text-muted)]">
                        You can&apos;t remove yourself
                      </span>
                    ) : (
                      <form action={revokeAdmin} className="inline">
                        <input type="hidden" name="user_id" value={a.id} />
                        <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--error-light)] text-[var(--error)] hover:opacity-80 transition-opacity">
                          Remove admin access
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!offline && admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-[var(--text-muted)]">
                    No admins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Everyone else */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Player accounts ({everyoneElse.length})
        </h2>
        <p className="text-base text-[var(--text-muted)]">
          Every other account on the site. Promote someone with the form above, or from here.
        </p>
        <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]">
          <table className="w-full text-left text-base min-w-[36rem]">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Last signed in</th>
                <th className="px-4 py-3 font-semibold text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {everyoneElse.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.lastSignInAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={grantAdmin} className="inline">
                      <input type="hidden" name="email" value={a.email} />
                      <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--accent-lavender)] transition-colors">
                        Make admin
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!offline && everyoneElse.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-[var(--text-muted)]">
                    No player accounts yet - they&apos;ll appear as people sign up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
