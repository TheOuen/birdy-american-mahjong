import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { InfraMap } from '@/components/admin/InfraMap'
import { BusinessMap } from '@/components/admin/BusinessMap'
import { orderHasLesson } from '@/lib/shop/orders'
import type { OrderItem } from '@/lib/shop/checkout'

export const metadata = { title: "Bird's-eye view - Admin" }
export const dynamic = 'force-dynamic'

type ProductRow = {
  id: string
  name: string
  price_pence: number
  type: 'physical' | 'lesson'
  active: boolean
}
type CountRow = { id: string }

/** Stripe UK card fee: 1.5% + 20p, in pence. */
function cardFeePence(pricePence: number): number {
  return Math.round(pricePence * 0.015) + 20
}

function pounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
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

type OrderLite = { id: string; status: string; items: OrderItem[] }

function priceRange(items: ProductRow[], suffix: string): string {
  if (items.length === 0) return 'nothing listed yet'
  const prices = items.map((p) => p.price_pence)
  const lo = Math.min(...prices) / 100
  const hi = Math.max(...prices) / 100
  return lo === hi ? `£${lo} ${suffix}` : `£${lo} – £${hi} ${suffix}`
}

export default async function AdminOverviewPage() {
  const [products, players, orders, subscribers] = await Promise.all([
    adminQuery<ProductRow>((sb) => sb.from('products').select('id, name, price_pence, type, active').order('price_pence', { ascending: false })),
    adminQuery<CountRow>((sb) => sb.from('profiles').select('id').limit(1000)),
    adminQuery<OrderLite>((sb) => sb.from('orders').select('id, status, items').limit(500)),
    adminQuery<CountRow>((sb) => sb.from('newsletter_subscribers').select('id').limit(2000)),
  ])

  const offline = products.offline && players.offline
  const lessons = products.rows.filter((p) => p.type === 'lesson')
  const retail = products.rows.filter((p) => p.type === 'physical')

  const newBookings = orders.rows.filter((o) => o.status === 'new' && orderHasLesson(o.items)).length
  const newOrders = orders.rows.filter((o) => o.status === 'new').length - newBookings

  const systems = [
    {
      name: 'Database & accounts',
      detail: 'Supabase - players, bookings, orders, the game itself',
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && !products.offline,
      okLabel: 'live', pendingLabel: 'offline',
    },
    {
      name: 'Card payments',
      detail: 'Stripe - takes payment for lessons and the shop',
      ok: Boolean(process.env.STRIPE_SECRET_KEY),
      okLabel: 'live', pendingLabel: 'needs keys',
    },
    {
      name: 'Email sending',
      detail: 'Resend - contact form and order notifications',
      ok: Boolean(process.env.RESEND_API_KEY),
      okLabel: 'live', pendingLabel: 'needs key',
    },
  ]

  const monthlyCosts = [
    { name: 'Supabase (database)', now: '£0', launch: '≈ £20' },
    { name: 'Vercel (website hosting)', now: '£0', launch: '≈ £16' },
    { name: 'Resend (email)', now: '£0', launch: '£0' },
    { name: 'Domain name', now: '—', launch: '≈ £1' },
    { name: 'Stripe (per-sale fee only)', now: '£0', launch: '£0' },
  ]

  const sides = [
    {
      title: 'Lessons',
      kicker: 'The engine',
      accent: 'var(--accent-warm)',
      blurb: 'Taught in person, booked and paid on the website. Every booking lands in Bookings to be scheduled.',
      items: lessons,
    },
    {
      title: 'Retail',
      kicker: 'The add-on',
      accent: 'var(--accent-gold)',
      blurb: 'The kit every player needs anyway - every new student is a natural customer.',
      items: retail,
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Bird&apos;s-eye view
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 max-w-2xl">
          The three sides of the business, what each sale is worth, what it all costs to run,
          and whether the machinery underneath is switched on.
        </p>
      </div>

      {offline && <OfflineBanner thing="the overview" />}

      {/* The business, as a living map */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          How the business fits together
        </h2>
        <p className="text-[var(--text-muted)] text-base max-w-2xl">
          The three pillars and how people and money move between them. The thicker green
          lines are money; the figures are live from the database. Drag to pan, scroll to zoom.
        </p>
        <BusinessMap
          figures={{
            players: players.rows.length,
            subscribers: subscribers.rows.length,
            newBookings,
            newOrders,
            lessonPriceRange: priceRange(lessons, 'a session'),
            retailPriceRange: priceRange(retail, 'an item'),
          }}
        />
        <p className="text-[var(--text-muted)] text-base">
          The game earns nothing on purpose - it is the front door. Players practise between
          lessons, bring friends, and those friends become the next students and shoppers.
        </p>
      </section>

      {/* Money in */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Money in - what you keep from each sale
        </h2>
        <p className="text-[var(--text-muted)] text-base max-w-2xl">
          Prices are live from the catalogue. Stripe&apos;s UK card fee (1.5% + 20p) is the only
          selling fee; the rest reaches the bank account in about two working days.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {sides.map((side) => (
            <div key={side.title} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
              <div className="px-5 py-4" style={{ borderTop: `4px solid ${side.accent}` }}>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{side.kicker}</div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {side.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{side.blurb}</p>
              </div>
              <table className="w-full text-base">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] border-t border-b border-[var(--border)]">
                    <th className="px-5 py-2 font-semibold">Item</th>
                    <th className="px-3 py-2 font-semibold text-right">Price</th>
                    <th className="px-3 py-2 font-semibold text-right">Fee</th>
                    <th className="px-5 py-2 font-semibold text-right">You keep</th>
                  </tr>
                </thead>
                <tbody>
                  {side.items.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {p.name}
                        {!p.active && <span className="text-[var(--text-muted)]"> (hidden from shop)</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{pounds(p.price_pence)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--text-muted)]">{pounds(cardFeePence(p.price_pence))}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold" style={{ color: 'var(--success)' }}>
                        {pounds(p.price_pence - cardFeePence(p.price_pence))}
                      </td>
                    </tr>
                  ))}
                  {side.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-4 text-[var(--text-muted)]">
                        Nothing in the catalogue yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Retail figures are before the cost of the item itself and postage.
        </p>
      </section>

      {/* Money out */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Money out - running costs
        </h2>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-x-auto">
          <table className="w-full text-base min-w-[28rem]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold text-right">Now (building)</th>
                <th className="px-5 py-3 font-semibold text-right">At launch / month</th>
              </tr>
            </thead>
            <tbody>
              {monthlyCosts.map((c) => (
                <tr key={c.name} className="border-b border-[var(--border)]">
                  <td className="px-5 py-3 text-[var(--text-primary)]">{c.name}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{c.now}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{c.launch}</td>
                </tr>
              ))}
              <tr className="bg-[var(--bg-card)] font-bold">
                <td className="px-5 py-3 text-[var(--text-primary)]">Total</td>
                <td className="px-5 py-3 text-right tabular-nums">£0 / month</td>
                <td className="px-5 py-3 text-right tabular-nums">≈ £37 / month</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-[var(--radius-md)] px-5 py-4 text-base" style={{ backgroundColor: 'var(--success-light)', color: 'var(--text-secondary)' }}>
          <strong className="text-[var(--text-primary)]">Put simply:</strong> one 1-hour private
          lesson covers more than three months of running the whole operation. A beginner group
          of four covers the year.
        </div>
      </section>

      {/* Systems */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          The machinery
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {systems.map((s) => (
            <div key={s.name} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-[var(--text-primary)]">{s.name}</span>
                <StatusPill ok={s.ok} okLabel={s.okLabel} pendingLabel={s.pendingLabel} />
              </div>
              <p className="text-sm text-[var(--text-muted)]">{s.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Statuses are read live from this server&apos;s configuration - when a missing key is
          added, its card turns green on the next visit.
        </p>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mt-2" style={{ fontFamily: 'var(--font-display)' }}>
          The full wiring
        </h3>
        <p className="text-[var(--text-muted)] text-base max-w-2xl">
          The engineer&apos;s view: every service and connection. Green moving dashes are live;
          amber is waiting on a key; indigo is one step away.
        </p>
        <InfraMap
          statuses={{
            db: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && !products.offline,
            stripe: Boolean(process.env.STRIPE_SECRET_KEY),
            resend: Boolean(process.env.RESEND_API_KEY),
          }}
        />
      </section>
    </div>
  )
}
