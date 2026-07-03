import Link from 'next/link'
import { AmlMark } from './AmlMark'

type AmlLogoProps = { inverse?: boolean }

export function AmlLogo({ inverse }: AmlLogoProps) {
  return (
    <Link
      href="/"
      aria-label="American Mahjong London — home"
      className={`group flex items-center gap-2.5 transition-opacity hover:opacity-80 active:opacity-60 ${
        inverse ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'
      }`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <AmlMark inverse={inverse} className="h-9 w-auto shrink-0 transition-transform group-hover:-rotate-3" />
      <span className="flex flex-col leading-none">
        <span className="text-lg sm:text-xl font-bold tracking-wide uppercase">
          American Mahjong
        </span>
        <span className="mt-1 text-sm sm:text-base font-medium tracking-[0.35em] uppercase text-[var(--accent-warm)]">
          London
        </span>
      </span>
    </Link>
  )
}
