type AmlMarkProps = {
  className?: string
  /** Render on dark backgrounds: keyline shifts periwinkle-friendly. */
  inverse?: boolean
}

// The brand signature: a mahjong "dot" tile — cream face, navy keyline,
// berry bullseye, and the layered coloured side edge of a real tile.
// Scales cleanly from a 16px favicon to a hero-sized mark.
export function AmlMark({ className, inverse }: AmlMarkProps) {
  const border = inverse ? 'var(--accent-periwinkle)' : 'var(--brand)'
  return (
    <svg viewBox="0 0 28 38" className={className} role="img" aria-hidden="true" fill="none">
      {/* Side edge — the tile's layered stripe */}
      <rect x="1.25" y="5" width="25.5" height="31.75" rx="5.5" fill="var(--accent-warm)" />
      {/* Face */}
      <rect x="1.25" y="1.25" width="25.5" height="32.5" rx="5.5" fill="var(--bg-elevated)" stroke={border} strokeWidth="2" />
      <circle cx="14" cy="17.5" r="7.6" stroke="var(--accent-warm)" strokeWidth="2.4" />
      <circle cx="14" cy="17.5" r="2.9" fill="var(--accent-warm)" />
    </svg>
  )
}
