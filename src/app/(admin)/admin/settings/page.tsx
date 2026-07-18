import Link from 'next/link'

export const metadata = { title: 'Settings - Admin' }
export const dynamic = 'force-dynamic'

/** Show enough of a key to recognise it, never enough to use it. */
function maskKey(key: string | undefined): string | null {
  if (!key) return null
  const last4 = key.slice(-4)
  return `••••••••${last4}`
}

function stripeMode(secretKey: string | undefined): 'live' | 'test' | null {
  if (!secretKey) return null
  return secretKey.startsWith('sk_live') ? 'live' : 'test'
}

function StatusPill({ ok, okLabel, pendingLabel }: { ok: boolean; okLabel: string; pendingLabel: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: ok ? 'var(--success-light)' : 'var(--warning-light)',
        color: ok ? 'var(--success)' : 'var(--warning)',
      }}
    >
      {ok ? okLabel : pendingLabel}
    </span>
  )
}

function KeyRow({ name, value, hint }: { name: string; value: string | null; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 flex-wrap">
      <div>
        <div className="font-mono text-sm text-[var(--text-primary)]">{name}</div>
        <div className="text-sm text-[var(--text-muted)]">{hint}</div>
      </div>
      {value ? (
        <span className="font-mono text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-sm px-3 py-1.5">
          {value}
        </span>
      ) : (
        <StatusPill ok={false} okLabel="set" pendingLabel="not set" />
      )}
    </div>
  )
}

export default function AdminSettingsPage() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET
  const resendKey = process.env.RESEND_API_KEY
  const notifyEmail = process.env.ORDER_NOTIFY_EMAIL
  const mode = stripeMode(stripeSecret)
  const stripeReady = Boolean(stripeSecret && stripeWebhook)

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          The site&apos;s connections to the outside world, and who can manage it.
        </p>
      </div>

      {/* Payments / Stripe */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Card payments - Stripe
          </h2>
          <div className="flex items-center gap-2">
            {mode && (
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: mode === 'live' ? 'var(--success-light)' : 'var(--accent-lavender)',
                  color: mode === 'live' ? 'var(--success)' : 'var(--accent-gold)',
                }}
              >
                {mode === 'live' ? 'Live mode' : 'Test mode'}
              </span>
            )}
            <StatusPill ok={stripeReady} okLabel="connected" pendingLabel="needs keys" />
          </div>
        </div>
        <p className="text-base text-[var(--text-muted)]">
          Stripe takes the card payment for lessons and the shop, then tells this site to
          record the order. Two keys make that work; both live in the server&apos;s
          environment settings - never in the database and never in the browser.
        </p>

        <div className="divide-y divide-[var(--border)]">
          <KeyRow
            name="STRIPE_SECRET_KEY"
            value={maskKey(stripeSecret)}
            hint="Lets the site create checkout sessions. From the Stripe dashboard: Developers → API keys."
          />
          <KeyRow
            name="STRIPE_WEBHOOK_SECRET"
            value={maskKey(stripeWebhook)}
            hint="Proves order confirmations really come from Stripe. From: Developers → Webhooks."
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-1">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base px-6"
          >
            Open Stripe dashboard
          </a>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-base px-6"
          >
            Edit keys on Vercel
          </a>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          To change a key: Vercel → the <em>american-mahjong</em> project → Settings →
          Environment Variables, then redeploy. The pills above go green on the next visit.
          Payouts, refunds and disputes are all handled inside the Stripe dashboard itself.
        </p>
      </section>

      {/* Email */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Email sending - Resend
          </h2>
          <StatusPill ok={Boolean(resendKey)} okLabel="connected" pendingLabel="needs key" />
        </div>
        <p className="text-base text-[var(--text-muted)]">
          Sends contact-form notifications, order confirmations and lesson-time emails.
        </p>
        <div className="divide-y divide-[var(--border)]">
          <KeyRow name="RESEND_API_KEY" value={maskKey(resendKey)} hint="From resend.com → API keys." />
          <KeyRow
            name="ORDER_NOTIFY_EMAIL"
            value={notifyEmail ?? null}
            hint="Where new-order and new-message notifications are sent."
          />
        </div>
      </section>

      {/* Admin access */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Who can manage the site
        </h2>
        <p className="text-base text-[var(--text-muted)]">
          Admin access - adding a colleague, or removing access - has its own page.
        </p>
        <div>
          <Link href="/admin/team" className="btn-secondary text-base px-6">
            Manage admins
          </Link>
        </div>
      </section>

      {/* Game defaults - not yet wired up */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Game defaults
          </h2>
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}
          >
            Coming soon
          </span>
        </div>
        <p className="text-base text-[var(--text-muted)]">
          Turn-timer length and bot behaviour will be adjustable here once online play
          launches. For now the game uses sensible defaults: a 60-second turn timer, and
          bots filling empty seats at medium difficulty.
        </p>
      </section>
    </div>
  )
}
