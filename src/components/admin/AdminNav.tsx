'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type AdminNavIcon =
  | 'dashboard'
  | 'overview'
  | 'revenue'
  | 'users'
  | 'card'
  | 'orders'
  | 'settings'
  | 'bookings'
  | 'products'
  | 'posts'
  | 'messages'
  | 'newsletter'
  | 'team'

function NavIcon({ name }: { name: AdminNavIcon }) {
  const iconProps = {
    width: 20,
    height: 20,
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
    case 'overview':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 5c-5 0-8.5 4.5-9.5 7 1 2.5 4.5 7 9.5 7s8.5-4.5 9.5-7c-1-2.5-4.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'revenue':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M3 3v18h18" />
          <path d="M7 15v3M12 10v8M17 6v12" />
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
    case 'bookings':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 9h18" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      )
    case 'products':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M6 6h15l-1.5 9h-12L6 6Z" />
          <path d="M6 6L5 3H2" />
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="17" cy="20" r="1.5" />
        </svg>
      )
    case 'posts':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      )
    case 'messages':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m2 7 10 6L22 7" />
        </svg>
      )
    case 'newsletter':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4Z" />
        </svg>
      )
    case 'team':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3Z" />
          <path d="M9 12l2 2 4-4" />
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

export type AdminNavItem = {
  href: string
  label: string
  icon: AdminNavIcon
  /** Count shown as a pill after the label; hidden when 0. */
  badge?: number
}

export type AdminNavSection = {
  title: string
  items: AdminNavItem[]
}

type AdminNavProps = {
  sections: AdminNavSection[]
}

export function AdminNav({ sections }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-4 px-3 py-4 flex-1 min-h-0 overflow-y-auto">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-0.5">
          <div
            className="px-4 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {section.title}
          </div>
          {section.items.map((item) => {
            const active =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[0.95rem] transition-colors"
                style={{
                  minHeight: '44px',
                  color: active ? '#FFFCF5' : 'rgba(255,252,245,0.78)',
                  background: active ? 'rgba(148, 171, 249, 0.22)' : 'transparent',
                  boxShadow: active ? 'inset 3px 0 0 var(--accent-periwinkle)' : 'none',
                }}
              >
                <NavIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
                    style={{ backgroundColor: 'var(--accent-warm)', color: 'var(--text-inverse)' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
