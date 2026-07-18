import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { RevenueChart, type RevenueMonth } from '@/components/admin/RevenueChart'
import { orderHasLesson, isLessonItem } from '@/lib/shop/orders'
import type { OrderItem } from '@/lib/shop/checkout'

export const metadata = { title: 'Revenue - Admin' }
export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  created_at: string
  total_pence: number
  items: OrderItem[]
}
type ProductRow = { slug: string; price_pence: number; type: 'physical' | 'lesson' }

type Split = { lessons: number; shop: number }

/** Split one order's takings between the two income streams.
 * Where every line's price is known from the catalogue, the order total is
 * shared out in proportion (so a mixed basket lands in both streams even if
 * prices have since changed). Unknown lines fall back to classifying the
 * whole order by whether it contains a lesson. */
function splitOrder(order: OrderRow, priceBySlug: Map<string, ProductRow>): Split {
  let lessonsWeight = 0
  let shopWeight = 0
  let unknown = false
  for (const item of order.items ?? []) {
    const product = priceBySlug.get(item.slug)
    if (!product) {
      unknown = true
      break
    }
    const weight = product.price_pence * item.quantity
    if (isLessonItem(item) || product.type === 'lesson') lessonsWeight += weight
    else shopWeight += weight
  }
  if (unknown || lessonsWeight + shopWeight <= 0) {
    return orderHasLesson(order.items)
      ? { lessons: order.total_pence, shop: 0 }
      : { lessons: 0, shop: order.total_pence }
  }
  const lessons = Math.round((order.total_pence * lessonsWeight) / (lessonsWeight + shopWeight))
  return { lessons, shop: order.total_pence - lessons }
}

function pounds(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function AdminRevenuePage() {
  const [orders, products] = await Promise.all([
    adminQuery<OrderRow>((sb) =>
      sb.from('orders').select('id, created_at, total_pence, items').order('created_at', { ascending: true }).limit(2000)
    ),
    adminQuery<ProductRow>((sb) => sb.from('products').select('slug, price_pence, type')),
  ])

  const offline = orders.offline
  const priceBySlug = new Map(products.rows.map((p) => [p.slug, p]))

  // Last 12 calendar months, oldest first, every month present even when £0.
  const now = new Date()
  const months: RevenueMonth[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      key: monthKey(d),
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      longLabel: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      lessonsPence: 0,
      shopPence: 0,
    }
  })
  const byKey = new Map(months.map((m) => [m.key, m]))

  let allTimeLessons = 0
  let allTimeShop = 0
  for (const order of orders.rows) {
    const split = splitOrder(order, priceBySlug)
    allTimeLessons += split.lessons
    allTimeShop += split.shop
    const bucket = byKey.get(monthKey(new Date(order.created_at)))
    if (bucket) {
      bucket.lessonsPence += split.lessons
      bucket.shopPence += split.shop
    }
  }

  const thisMonth = months[months.length - 1]
  const lastMonth = months[months.length - 2]
  const allTime = allTimeLessons + allTimeShop

  const tiles = [
    { label: 'This month', value: thisMonth.lessonsPence + thisMonth.shopPence, accent: 'var(--brand)' },
    { label: 'Last month', value: lastMonth.lessonsPence + lastMonth.shopPence, accent: 'var(--accent-periwinkle)' },
    { label: 'All time', value: allTime, accent: 'var(--accent-jade)' },
    { label: 'Lessons, all time', value: allTimeLessons, accent: 'var(--accent-warm)' },
    { label: 'Shop, all time', value: allTimeShop, accent: 'var(--accent-gold)' },
  ]

  const monthsWithSales = months.filter((m) => m.lessonsPence + m.shopPence > 0)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Revenue
        </h1>
        <p className="text-[var(--text-secondary)] mt-1 max-w-2xl">
          Money taken through the website, split by income stream: lessons booked and
          paid online, and the shop. Figures are gross - before Stripe&apos;s card fee.
        </p>
      </div>

      {offline && <OfflineBanner thing="revenue" />}

      {/* Headline figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-1"
            style={{ borderTop: `4px solid ${t.accent}` }}
          >
            <span className="text-3xl font-bold text-[var(--text-primary)] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
              {pounds(t.value)}
            </span>
            <span className="text-base text-[var(--text-secondary)]">{t.label}</span>
          </div>
        ))}
      </div>

      {/* The chart */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          The last twelve months
        </h2>
        {!offline && orders.rows.length === 0 ? (
          <p className="text-base text-[var(--text-muted)] py-8">
            No sales yet - the chart draws itself as the first bookings and orders come in.
          </p>
        ) : (
          <RevenueChart months={months} />
        )}
      </section>

      {/* Month-by-month table - the accessible, exact-figures view */}
      {monthsWithSales.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Month by month
          </h2>
          <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] max-w-2xl">
            <table className="w-full text-left text-base min-w-[28rem]">
              <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold text-right">Lessons</th>
                  <th className="px-4 py-3 font-semibold text-right">Shop</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                {[...monthsWithSales].reverse().map((m) => (
                  <tr key={m.key}>
                    <td className="px-4 py-3">{m.longLabel}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{pounds(m.lessonsPence)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{pounds(m.shopPence)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {pounds(m.lessonsPence + m.shopPence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
