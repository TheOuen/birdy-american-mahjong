import Link from 'next/link'
import { AmlMark } from './AmlMark'

type AmlLogoProps = { inverse?: boolean }

export function AmlLogo({ inverse }: AmlLogoProps) {
  return (
    <Link
      href="/"
      aria-label="American Mahjong London — home"
      className={`group flex items-center gap-3 transition-opacity hover:opacity-80 active:opacity-60 ${
        inverse ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'
      }`}
    >
      <AmlMark inverse={inverse} className="h-10 w-auto shrink-0 transition-transform group-hover:-rotate-3" />
      <span className="flex flex-col">
        <span
          className="text-xl sm:text-2xl leading-none"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          American Mahjong
        </span>
        <span className="mt-1 text-xs sm:text-sm font-semibold leading-none tracking-[0.42em] uppercase text-[var(--accent-warm)]">
          London
        </span>
      </span>
    </Link>
  )
}
