import Link from 'next/link'
import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { formatGbp } from '@/lib/shop/cart'
import { orderHasLesson } from '@/lib/shop/orders'
import type { OrderItem } from '@/lib/shop/checkout'
import { setOrderStatus } from '../actions'

export const metadata = { title: 'Orders - Admin' }
export const dynamic = 'force-dynamic'

type OrderListItem = {
  id: string
  created_at: string
  customer_email: string
  customer_name: string | null
  items: OrderItem[]
  total_pence: number
  status: 'new' | 'scheduled' | 'fulfilled'
  shipping_address: Record<string, string> | null
}

export default async function AdminOrdersPage() {
  // Reads go through the signed-in user's client so RLS "admins read all
  // orders" is a second line of defense - a non-admin session simply gets
  // no rows, never PII.
  const { rows: orders, offline } = await adminQuery<OrderListItem>((sb) =>
    sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Orders
      </h1>

      {offline && <OfflineBanner thing="orders" />}

      {!offline && orders.length === 0 && (
        <p className="text-lg text-[var(--text-secondary)]">No orders yet.</p>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Ship to</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {orders.map((o) => {
                const isBooking = orderHasLesson(o.items)
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">{o.customer_name ?? '-'}<br /><span className="text-[var(--text-muted)]">{o.customer_email}</span></td>
                    <td className="px-4 py-3">{o.items.map((i) => `${i.slug} × ${i.quantity}`).join(', ')}</td>
                    <td className="px-4 py-3 font-semibold">{formatGbp(o.total_pence)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {o.shipping_address ? Object.values(o.shipping_address).filter(Boolean).join(', ') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-sm text-sm font-semibold ${
                        o.status === 'new'
                          ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                          : o.status === 'scheduled'
                            ? 'bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)]'
                            : 'bg-[var(--success-light)] text-[var(--success)]'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isBooking ? (
                        // Lesson orders move through their scheduling workflow
                        // in Bookings - keep one source of truth for that.
                        <Link
                          href="/admin/bookings"
                          className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)] hover:bg-[var(--accent-periwinkle)] transition-colors whitespace-nowrap"
                        >
                          Manage in Bookings
                        </Link>
                      ) : o.status === 'new' ? (
                        <form action={setOrderStatus}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="status" value="fulfilled" />
                          <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] transition-colors whitespace-nowrap">
                            Mark fulfilled
                          </button>
                        </form>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
