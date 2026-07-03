'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AmlLogo } from './AmlLogo'
import { useCart } from '@/components/shop/CartProvider'
import { cartCount } from '@/lib/shop/cart'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/lobby', label: 'Play Online' },
  { href: '/private-lessons', label: 'Private Lessons' },
  { href: '/about', label: 'About' },
  { href: '/shop', label: 'Shop' },
  { href: '/discover', label: 'Discover' },
  { href: '/london-local', label: 'London Local' },
  { href: '/get-in-touch', label: 'Get in Touch' },
] as const

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart } = useCart()
  const count = cartCount(cart)

  return (
    <header
      className="sticky top-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <AmlLogo />

        <div className="flex items-center gap-2">
          <Link
            href="/lobby"
            className="hidden sm:inline-flex px-5 h-12 items-center rounded-md text-base font-semibold tracking-wide
              bg-[var(--brand)] text-[var(--text-inverse)]
              hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.97]
              transition-all duration-150"
          >
            Play Birdy Online — Free
          </Link>
          <CartLink count={count} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center rounded-md
              text-[var(--text-secondary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
              transition-all duration-150"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Desktop nav row */}
      <nav
        className="hidden lg:flex max-w-6xl mx-auto px-6 pb-2 items-center gap-1"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
        ))}
      </nav>

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <nav
          className="lg:hidden border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 flex flex-col gap-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <MobileNavLink key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </MobileNavLink>
          ))}
          <MobileNavLink href="/cart" onClick={() => setMenuOpen(false)}>
            Cart{count > 0 ? ` (${count})` : ''}
          </MobileNavLink>
        </nav>
      )}
    </header>
  )
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      className="relative w-12 h-12 flex items-center justify-center rounded-md
        text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]
        active:bg-[var(--border)] transition-all duration-150"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 7h12l-1.5 12a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L6 7Z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-5 h-5 px-1 rounded-full bg-[var(--accent-warm)] text-[var(--text-inverse)] text-xs font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 h-12 inline-flex items-center rounded-md text-base font-medium transition-all duration-150
        active:scale-[0.97] text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-card)] active:bg-[var(--border)]"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 rounded-md text-lg font-medium text-[var(--text-secondary)]
        hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
        transition-all duration-150 min-h-[var(--touch-min)] flex items-center"
    >
      {children}
    </Link>
  )
}
