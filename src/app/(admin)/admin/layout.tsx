import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAuthedServerClient } from '@/lib/supabase/server'
import { AmlMark } from '@/components/layout/AmlMark'

function SidebarIcon({ name }: { name: 'dashboard' | 'users' | 'card' | 'orders' | 'settings' }) {
  const iconProps = {
    width: 22,
    height: 22,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'users':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <circle cx="9" cy="7" r="4" />
          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
        </svg>
      )
    case 'card':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h10" />
          <path d="M7 16h6" />
        </svg>
      )
    case 'orders':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
  }
}

type NavItem = {
  href: string
  label: string
  icon: 'dashboard' | 'users' | 'card' | 'orders' | 'settings'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/nmjl-card', label: 'NMJL Card', icon: 'card' },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
]

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-64 shrink-0"
        style={{
          backgroundColor: 'var(--brand-dark)',
          color: 'var(--text-inverse)',
        }}
      >
        {/* Logo + Title */}
        <div
          className="flex items-center gap-3 px-6 py-5"
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

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-base transition-colors"
              style={{
                minHeight: 'var(--touch-min)',
                color: 'var(--text-inverse)',
              }}
              // Active state is handled client-side via CSS :target or a wrapper.
              // For server component simplicity, all links share the same base style.
              // A client wrapper can add active styling later.
            >
              <SidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-6 py-4 text-xs"
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
        className="flex-1 overflow-y-auto"
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
