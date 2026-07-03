type AmlMarkProps = {
  className?: string
  /** Render on dark backgrounds: tile face becomes cream-on-navy friendly. */
  inverse?: boolean
}

// The brand signature: a mahjong "dot" tile — navy-bordered cream face with a
// berry bullseye. Scales cleanly from a 16px favicon to a hero-sized mark.
export function AmlMark({ className, inverse }: AmlMarkProps) {
  const face = inverse ? 'var(--bg-elevated)' : 'var(--bg-elevated)'
  const border = inverse ? 'var(--accent-periwinkle)' : 'var(--text-primary)'
  return (
    <svg viewBox="0 0 28 36" className={className} role="img" aria-hidden="true" fill="none">
      <rect x="1.25" y="1.25" width="25.5" height="33.5" rx="5" fill={face} stroke={border} strokeWidth="2" />
      <circle cx="14" cy="18" r="8" stroke="var(--accent-warm)" strokeWidth="2.4" />
      <circle cx="14" cy="18" r="3" fill="var(--accent-warm)" />
    </svg>
  )
}
