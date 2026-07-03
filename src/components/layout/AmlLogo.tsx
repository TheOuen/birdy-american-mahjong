import Link from 'next/link'

type AmlLogoProps = { inverse?: boolean }

export function AmlLogo({ inverse }: AmlLogoProps) {
  return (
    <Link
      href="/"
      className={`flex flex-col leading-tight transition-opacity hover:opacity-80 active:opacity-60 ${
        inverse ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'
      }`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <span className="text-lg sm:text-xl font-bold tracking-wide uppercase">
        American Mahjong
      </span>
      <span className="text-sm sm:text-base font-medium tracking-[0.35em] uppercase text-[var(--accent-warm)]">
        London
      </span>
    </Link>
  )
}
