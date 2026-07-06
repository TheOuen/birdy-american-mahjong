import Image from 'next/image'
import Link from 'next/link'

type AmlLogoProps = {
  inverse?: boolean
  /** 'tile' shows the peacock 1-Bam from our commissioned set (footer); default is wordmark only. */
  icon?: 'none' | 'tile'
}

export function AmlLogo({ inverse, icon = 'none' }: AmlLogoProps) {
  return (
    <Link
      href="/"
      aria-label="American Mahjong London - home"
      className={`group flex items-center gap-3 transition-opacity hover:opacity-80 active:opacity-60 ${
        inverse ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'
      }`}
    >
      {icon === 'tile' && (
        <Image
          src="/tiles/stacks/bam-1.png"
          alt=""
          width={240}
          height={305}
          className="h-11 w-auto shrink-0 transition-transform group-hover:-rotate-3"
        />
      )}
      <span className="flex flex-col">
        {/* Wordmark stays in the body face - the groovy display is reserved
            for headings, matching the live site's plain header wordmark. */}
        <span
          className="text-lg sm:text-xl leading-none uppercase"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.04em' }}
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
