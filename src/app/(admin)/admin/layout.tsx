import { redirect } from 'next/navigation'
import { createAuthedServerClient } from '@/lib/supabase/server'
import { AmlMark } from '@/components/layout/AmlMark'
import { AdminNav, type AdminNavSection } from '@/components/admin/AdminNav'
import { adminQuery } from '@/lib/admin/data'
import { orderHasLesson } from '@/lib/shop/orders'
import type { OrderItem } from '@/lib/shop/checkout'

type OrderLite = { id: string; status: string; items: OrderItem[] }
type MessageLite = { id: string; status: string }

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Gate the entire admin panel: only signed-in users whose server-set
  // app_metadata.role is 'admin' may proceed. Fail closed - any auth error
  // or missing/insufficient role redirects to login.
  const supabase = await createAuthedServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = (user?.app_metadata as { role?: string } | undefined)?.role
  if (!user || role !== 'admin') redirect('/login')

  // Live counts for the sidebar badges - what needs attention right now.
  const [orders, messages] = await Promise.all([
    adminQuery<OrderLite>((sb) => sb.from('orders').select('id, status, items').limit(500)),
    adminQuery<MessageLite>((sb) => sb.from('contact_messages').select('id, status').limit(500)),
  ])
  const newBookings = orders.rows.filter((o) => o.status === 'new' && orderHasLesson(o.items)).length
  const newOrders = orders.rows.filter((o) => o.status === 'new').length - newBookings
  const newMessages = messages.rows.filter((m) => m.status === 'new').length

  const sections: AdminNavSection[] = [
    {
      title: 'Business',
      items: [
        { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { href: '/admin/overview', label: "Bird's-eye view", icon: 'overview' },
        { href: '/admin/revenue', label: 'Revenue', icon: 'revenue' },
      ],
    },
    {
      title: 'Day to day',
      items: [
        { href: '/admin/bookings', label: 'Bookings', icon: 'bookings', badge: newBookings },
        { href: '/admin/orders', label: 'Orders', icon: 'orders', badge: newOrders },
        { href: '/admin/messages', label: 'Inbox', icon: 'messages', badge: newMessages },
        { href: '/admin/products', label: 'Products', icon: 'products' },
        { href: '/admin/posts', label: 'Posts', icon: 'posts' },
        { href: '/admin/newsletter', label: 'Newsletter', icon: 'newsletter' },
      ],
    },
    {
      title: 'The game',
      items: [
        { href: '/admin/users', label: 'Players', icon: 'users' },
        { href: '/admin/nmjl-card', label: 'NMJL Card', icon: 'card' },
      ],
    },
    {
      title: 'The site',
      items: [
        { href: '/admin/team', label: 'Admins', icon: 'team' },
        { href: '/admin/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ]

  return (
    // Admin panel uses the serif heading face: every heading in this tree
    // references --font-display, so one scoped override retypes them all.
    <div
      className="flex min-h-screen"
      style={{ '--font-display': 'var(--font-heading)' } as React.CSSProperties}
    >
      {/* Sidebar - pinned to the viewport so the calendar shortcut and footer
          stay put however long the page content is; the nav itself scrolls. */}
      <aside
        className="flex flex-col w-64 shrink-0 sticky top-0 h-screen"
        style={{
          backgroundColor: 'var(--brand-dark)',
          color: 'var(--text-inverse)',
        }}
      >
        {/* Logo + Title */}
        <div
          className="flex items-center gap-3 px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
        >
          <AmlMark inverse className="h-10 w-auto shrink-0" />
          <div style={{ fontFamily: 'var(--font-display)' }}>
            <div className="font-bold text-sm leading-tight uppercase tracking-wide">
              American Mahjong
            </div>
            <div
              className="text-xs leading-tight uppercase tracking-[0.25em]"
              style={{ color: 'var(--accent-periwinkle)' }}
            >
              London · Admin
            </div>
          </div>
        </div>

        {/* Navigation (scrolls if taller than the screen) */}
        <AdminNav sections={sections} />

        {/* Google Calendar shortcut - always visible at the bottom */}
        <a
          href="https://calendar.google.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-3 mb-2 flex items-center gap-3 px-4 py-2.5 rounded-md text-[0.95rem] transition-colors shrink-0"
          style={{
            minHeight: '44px',
            color: 'var(--text-inverse)',
            background: 'rgba(148, 171, 249, 0.16)',
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M8 2v4M16 2v4M3 9h18" />
          </svg>
          <span>Google Calendar</span>
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-auto opacity-60"
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>

        {/* Footer */}
        <div
          className="px-6 py-3 text-xs shrink-0"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          American Mahjong | London
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 min-w-0 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg)',
          padding: 'var(--space-2xl)',
        }}
      >
        {children}
      </main>
    </div>
  )
}
