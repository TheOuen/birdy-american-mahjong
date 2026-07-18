import Link from 'next/link'
import { adminQuery } from '@/lib/admin/data'
import { OfflineBanner } from '@/components/admin/OfflineBanner'
import { orderHasLesson } from '@/lib/shop/orders'
import type { OrderItem } from '@/lib/shop/checkout'

export const metadata = { title: 'Dashboard - Admin' }
export const dynamic = 'force-dynamic'

type CountRow = { id: string }
type OrderLite = { id: string; status: string; items: OrderItem[] }
type MessageLite = { id: string; status: string }
type PostLite = { id: string; published: boolean }

export default async function AdminDashboardPage() {
  const [orders, messages, posts, players, subscribers] = await Promise.all([
    adminQuery<OrderLite>((sb) => sb.from('orders').select('id, status, items').limit(500)),
    adminQuery<MessageLite>((sb) => sb.from('contact_messages').select('id, status').limit(500)),
    adminQuery<PostLite>((sb) => sb.from('posts').select('id, published').limit(500)),
    adminQuery<CountRow>((sb) => sb.from('profiles').select('id').limit(1000)),
    adminQuery<CountRow>((sb) => sb.from('newsletter_subscribers').select('id').limit(2000)),
  ])

  const offline = orders.offline && messages.offline && posts.offline && players.offline

  // Bookings and shop orders are disjoint: an order counts as a booking if it
  // contains a lesson, otherwise as a shop order (same split as the overview).
  const newBookings = orders.rows.filter((o) => o.status === 'new' && orderHasLesson(o.items)).length
  const newOrders = orders.rows.filter((o) => o.status === 'new').length - newBookings
  const newMessages = messages.rows.filter((m) => m.status === 'new').length
  const livePosts = posts.rows.filter((p) => p.published).length

  const stats = [
    { label: 'Bookings to schedule', value: newBookings, href: '/admin/bookings', accent: 'var(--accent-warm)' },
    { label: 'New shop orders', value: newOrders, href: '/admin/orders', accent: 'var(--accent-gold)' },
    { label: 'Unread messages', value: newMessages, href: '/admin/messages', accent: 'var(--brand)' },
    { label: 'Newsletter subscribers', value: subscribers.rows.length, href: '/admin/newsletter', accent: 'var(--accent-periwinkle)' },
    { label: 'Players signed up', value: players.rows.length, href: '/admin/users', accent: 'var(--accent-jade)' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard
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

      {offline && <OfflineBanner thing="the overview" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-1 hover:border-[var(--border-strong)] transition-colors"
            style={{ borderTop: `4px solid ${s.accent}` }}
          >
            <span className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              {s.value}
            </span>
            <span className="text-base text-[var(--text-secondary)]">{s.label}</span>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/posts" className="btn-secondary text-base px-6">Write a blog post</Link>
          <Link href="/admin/products" className="btn-secondary text-base px-6">Edit the catalogue</Link>
          <Link href="/admin/bookings" className="btn-secondary text-base px-6">Schedule lessons</Link>
          <a href="/shop" target="_blank" className="btn-secondary text-base px-6">View the shop</a>
          <span className="inline-flex items-center text-sm text-[var(--text-muted)]">
            Live posts: {livePosts}
          </span>
        </div>
      </section>
    </div>
  )
}
