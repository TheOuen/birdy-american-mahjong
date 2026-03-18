'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80 active:opacity-60">
          <Image src="/logo.png" alt="Birdy American Mahjong" width={150} height={38} priority className="sm:w-[170px]" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink href="/how-to-play">How to Play</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/login" variant="subtle">Sign In</NavLink>
          <Link
            href="/lobby"
            className="ml-2 px-5 h-10 inline-flex items-center rounded-md text-sm font-semibold tracking-wide
              bg-[var(--brand)] text-[var(--text-inverse)]
              hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.97]
              transition-all duration-150"
          >
            Play Now
          </Link>
        </nav>

        {/* Mobile: Play + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/lobby"
            className="px-4 h-9 inline-flex items-center rounded-md text-sm font-semibold
              bg-[var(--brand)] text-[var(--text-inverse)]
              active:bg-[var(--brand-dark)] active:scale-[0.97]
              transition-all duration-150"
          >
            Play
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-md
              text-[var(--text-secondary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
              transition-all duration-150"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 flex flex-col gap-1">
          <MobileNavLink href="/how-to-play" onClick={() => setMenuOpen(false)}>How to Play</MobileNavLink>
          <MobileNavLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileNavLink>
          <MobileNavLink href="/login" onClick={() => setMenuOpen(false)}>Sign In</MobileNavLink>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children, variant }: { href: string; children: React.ReactNode; variant?: 'subtle' }) {
  return (
    <Link
      href={href}
      className={`px-3 h-10 inline-flex items-center rounded-md text-sm font-medium transition-all duration-150
        active:scale-[0.97]
        ${variant === 'subtle'
          ? 'text-[var(--accent-gold-dark)] hover:text-[var(--accent-gold)] hover:bg-[var(--accent-gold-subtle)] active:bg-[var(--accent-gold-subtle)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]'
        }`}
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
      className="px-4 py-3 rounded-md text-base font-medium text-[var(--text-secondary)]
        hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--border)]
        transition-all duration-150 min-h-[var(--touch-min)] flex items-center"
    >
      {children}
    </Link>
  )
}
