import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80 active:opacity-60">
          <Image src="/logo.png" alt="Birdy American Mahjong" width={170} height={42} priority />
        </Link>

        <nav className="flex items-center gap-1">
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
      </div>
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
