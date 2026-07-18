import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { formatGbp } from '@/lib/shop/cart'
import { lessonItems, orderHasLesson } from '@/lib/shop/orders'
import type { OrderItem } from '@/lib/shop/checkout'
import { setOrderStatus } from '../actions'

export const metadata = { title: 'Bookings - Admin' }
export const dynamic = 'force-dynamic'

type BookingRow = {
  id: string
  created_at: string
  customer_email: string
  customer_name: string | null
  items: OrderItem[]
  total_pence: number
  status: 'new' | 'scheduled' | 'fulfilled'
}

const NEXT_STATUS: Record<BookingRow['status'], { to: string; label: string } | null> = {
  new: { to: 'scheduled', label: 'Mark scheduled' },
  scheduled: { to: 'fulfilled', label: 'Mark taught' },
  fulfilled: null,
}

function gcalLink(b: BookingRow): string {
  const lessons = lessonItems(b.items)
  const what = lessons.map((i) => `${i.slug.replace(/-/g, ' ')} x${i.quantity}`).join(', ')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Mahjong lesson - ${b.customer_name ?? b.customer_email}`,
    details: `${what}\nPaid ${formatGbp(b.total_pence)}\nCustomer: ${b.customer_email}\nOrder: ${b.id}`,
    add: b.customer_email,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default async function AdminBookingsPage() {
  const { rows, offline } = await adminQuery<BookingRow>((sb) =>
    sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
  )
  // A booking is any order containing a lesson.
  const bookings = rows.filter((o) => orderHasLesson(o.items))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Lesson bookings
        </h1>
        <a
          href="https://calendar.google.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-base px-6"
        >
          Open Google Calendar
        </a>
      </div>

      {offline && <OfflineBanner thing="bookings" />}

      {!offline && bookings.length === 0 && (
        <p className="text-lg text-[var(--text-secondary)]">
          No lesson bookings yet. When someone buys a lesson, it appears here to schedule.
        </p>
      )}

      {bookings.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Booked</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Lesson</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(b.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    {b.customer_name ?? '-'}
                    <br />
                    <span className="text-[var(--text-muted)]">{b.customer_email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {lessonItems(b.items)
                      .map((i) => `${i.slug.replace(/-/g, ' ')} × ${i.quantity}`)
                      .join(', ')}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatGbp(b.total_pence)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-sm text-sm font-semibold ${
                        b.status === 'new'
                          ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                          : b.status === 'scheduled'
                            ? 'bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)]'
                            : 'bg-[var(--success-light)] text-[var(--success)]'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={gcalLink(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)] hover:bg-[var(--accent-periwinkle)] transition-colors"
                      >
                        Add to Google Calendar
                      </a>
                      {NEXT_STATUS[b.status] && (
                        <form action={setOrderStatus}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="status" value={NEXT_STATUS[b.status]!.to} />
                          <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] transition-colors">
                            {NEXT_STATUS[b.status]!.label}
                          </button>
                        </form>
                      )}
                    </div>
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
