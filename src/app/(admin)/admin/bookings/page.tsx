import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { formatGbp } from '@/lib/shop/cart'
import { lessonItems, orderHasLesson } from '@/lib/shop/orders'
import { dateToLondonInput, formatLondon, gcalDates } from '@/lib/shop/bookings'
import type { OrderItem } from '@/lib/shop/checkout'
import { setOrderStatus, scheduleBooking } from '../actions'

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
  scheduled_at: string | null
  admin_note: string | null
}

const STATUS_ORDER: Record<BookingRow['status'], number> = { new: 0, scheduled: 1, fulfilled: 2 }

const STATUS_BADGE: Record<BookingRow['status'], { label: string; className: string }> = {
  new: { label: 'Needs scheduling', className: 'bg-[var(--warning-light)] text-[var(--warning)]' },
  scheduled: { label: 'Scheduled', className: 'bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)]' },
  fulfilled: { label: 'Taught', className: 'bg-[var(--success-light)] text-[var(--success)]' },
}

function lessonSummary(items: OrderItem[]): string {
  return lessonItems(items)
    .map((i) => `${i.slug.replace(/-/g, ' ')} × ${i.quantity}`)
    .join(', ')
}

function gcalLink(b: BookingRow): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Mahjong lesson - ${b.customer_name ?? b.customer_email}`,
    details: `${lessonSummary(b.items)}\nPaid ${formatGbp(b.total_pence)}\nCustomer: ${b.customer_email}\nOrder: ${b.id}`,
    add: b.customer_email,
    ...(b.scheduled_at ? { dates: gcalDates(b.scheduled_at) } : {}),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default async function AdminBookingsPage() {
  const { rows, offline } = await adminQuery<BookingRow>((sb) =>
    sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
  )
  // A booking is any order containing a lesson. Unscheduled ones float to
  // the top; taught lessons sink to the bottom.
  const bookings = rows
    .filter((o) => orderHasLesson(o.items))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

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

      {bookings.map((b) => (
        <section
          key={b.id}
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {b.customer_name ?? b.customer_email}
                <span className={`ml-3 px-2 py-1 rounded-sm text-sm font-semibold ${STATUS_BADGE[b.status].className}`}>
                  {STATUS_BADGE[b.status].label}
                </span>
              </p>
              <p className="text-base text-[var(--text-secondary)]">
                {lessonSummary(b.items)} · {formatGbp(b.total_pence)} ·{' '}
                <a href={`mailto:${b.customer_email}`} className="underline">
                  {b.customer_email}
                </a>
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Booked {new Date(b.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={gcalLink(b)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--accent-lavender)] text-[var(--accent-gold-dark)] hover:bg-[var(--accent-periwinkle)] transition-colors"
              >
                Add to Google Calendar
              </a>
              {b.status === 'scheduled' && (
                <form action={setOrderStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="fulfilled" />
                  <button className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] transition-colors">
                    Mark taught
                  </button>
                </form>
              )}
            </div>
          </div>

          {b.scheduled_at && (
            <p className="text-base font-semibold text-[var(--accent-warm)]">
              Scheduled for {formatLondon(b.scheduled_at)}
              {b.admin_note && (
                <span className="block text-sm font-normal text-[var(--text-secondary)]">{b.admin_note}</span>
              )}
            </p>
          )}

          {b.status !== 'fulfilled' && (
            <form
              action={scheduleBooking}
              className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-end border-t border-[var(--border)] pt-4"
            >
              <input type="hidden" name="id" value={b.id} />
              <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
                Date &amp; time (London)
                <input
                  name="scheduled_at"
                  type="datetime-local"
                  required
                  defaultValue={b.scheduled_at ? dateToLondonInput(b.scheduled_at) : ''}
                  className="input-elegant"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text-secondary)]">
                Note for the customer <span className="font-normal">(optional - location, what to bring)</span>
                <input name="note" defaultValue={b.admin_note ?? ''} className="input-elegant" />
              </label>
              <button className="btn-primary text-base px-6">
                {b.scheduled_at ? 'Reschedule & email' : 'Schedule & email customer'}
              </button>
            </form>
          )}
        </section>
      ))}
    </div>
  )
}
