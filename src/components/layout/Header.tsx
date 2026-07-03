'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AmlLogo } from './AmlLogo'
import { useCart } from '@/components/shop/CartProvider'
import { cartCount } from '@/lib/shop/cart'

const NAV_ITEMS = [
  { href: '/private-lessons', label: 'Lessons' },
  { href: '/shop', label: 'Shop' },
  { href: '/how-to-play', label: 'How to play' },
  { href: '/about', label: 'About' },
  { href: '/discover', label: 'Discover' },
  { href: '/london-local', label: 'London local' },
  { href: '/get-in-touch', label: 'Contact' },
] as const

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cart } = useCart()
  const count = cartCount(cart)

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-3 focus:bg-[var(--brand)] focus:text-[var(--text-inverse)] focus:rounded-md"
      >
        Skip to content
      </a>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4">
        <AmlLogo />

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>{item.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/lobby"
            className="hidden sm:inline-flex px-5 h-12 items-center rounded-md text-base font-semibold
              bg-[var(--accent-warm)] text-[var(--text-inverse)]
              hover:bg-[var(--accent-warm-dark)] active:scale-[0.97]
              transition-all duration-150 whitespace-nowrap"
          >
            Play Birdy free
          </Link>
          <CartLink count={count} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="xl:hidden w-12 h-12 flex items-center justify-center rounded-md
              text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
              transition-all duration-150"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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

      {/* Mobile / tablet menu */}
      {menuOpen && (
        <nav
          className="xl:hidden border-t border-[var(--border)] bg-[var(--bg)] px-4 py-4 flex flex-col gap-1"
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
          <Link
            href="/lobby"
            onClick={() => setMenuOpen(false)}
            className="mt-2 px-5 h-14 inline-flex items-center justify-center rounded-md text-lg font-semibold
              bg-[var(--accent-warm)] text-[var(--text-inverse)] hover:bg-[var(--accent-warm-dark)]
              active:scale-[0.98] transition-all duration-150"
          >
            Play Birdy free
          </Link>
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
        text-[var(--text-primary)] hover:bg-[var(--bg-card)]
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
        hover:bg-[var(--bg-card)] active:bg-[var(--border)] whitespace-nowrap"
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
