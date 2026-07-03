type TileMotifVariant = 'dot' | 'bam' | 'crak' | 'wind' | 'flower' | 'bird'

type TileMotifProps = {
  variant: TileMotifVariant
  className?: string
  /** Optional coloured side edge, echoing the layered sides of real tiles. */
  edge?: 'berry' | 'jade' | 'indigo' | 'periwinkle'
}

const EDGE_COLORS = {
  berry: 'var(--accent-warm)',
  jade: 'var(--accent-jade)',
  indigo: 'var(--accent-gold)',
  periwinkle: 'var(--accent-periwinkle)',
} as const

// The brand imagery system: a family of hand-drawn mahjong tiles in the AML
// palette. Used as eyebrow chips, lesson-card art, and decorative garnish —
// one cohesive alternative to stock photos and clip-art.
export function TileMotif({ variant, className, edge }: TileMotifProps) {
  const edgeColor = edge ? EDGE_COLORS[edge] : undefined
  return (
    <svg viewBox="0 0 40 54" className={className} role="img" aria-hidden="true" fill="none">
      {edgeColor && (
        <rect x="1.25" y="7" width="37.5" height="45.5" rx="8" fill={edgeColor} />
      )}
      <rect
        x="1.25"
        y="1.25"
        width="37.5"
        height="46.5"
        rx="8"
        fill="var(--bg-elevated)"
        stroke="var(--brand)"
        strokeWidth="1.8"
      />
      {variant === 'dot' && (
        <>
          <circle cx="20" cy="24.5" r="10" stroke="var(--accent-warm)" strokeWidth="2.6" />
          <circle cx="20" cy="24.5" r="3.6" fill="var(--accent-warm)" />
        </>
      )}
      {variant === 'bam' && (
        <>
          <rect x="11" y="13" width="4.6" height="23" rx="2.3" fill="var(--accent-jade)" />
          <rect x="17.7" y="9" width="4.6" height="31" rx="2.3" fill="var(--accent-jade)" />
          <rect x="24.4" y="13" width="4.6" height="23" rx="2.3" fill="var(--accent-jade)" />
          <line x1="11" y1="24.5" x2="29" y2="24.5" stroke="var(--bg-elevated)" strokeWidth="2" />
        </>
      )}
      {variant === 'crak' && (
        <>
          <rect x="10" y="13" width="20" height="23" rx="3" stroke="var(--accent-warm)" strokeWidth="2.4" />
          <line x1="14" y1="24.5" x2="26" y2="24.5" stroke="var(--accent-warm)" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="20" y1="13" x2="20" y2="9" stroke="var(--accent-warm)" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {variant === 'wind' && (
        <>
          <path
            d="M20 10 L26.5 30 L20 25.5 L13.5 30 Z"
            fill="var(--accent-gold)"
          />
          <line x1="12" y1="36" x2="28" y2="36" stroke="var(--accent-gold)" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {variant === 'flower' && (
        <>
          <circle cx="20" cy="17.5" r="4.4" fill="var(--accent-periwinkle)" />
          <circle cx="13.3" cy="22.4" r="4.4" fill="var(--accent-periwinkle)" />
          <circle cx="26.7" cy="22.4" r="4.4" fill="var(--accent-periwinkle)" />
          <circle cx="15.9" cy="30.2" r="4.4" fill="var(--accent-periwinkle)" />
          <circle cx="24.1" cy="30.2" r="4.4" fill="var(--accent-periwinkle)" />
          <circle cx="20" cy="24.5" r="3.8" fill="var(--accent-warm)" />
        </>
      )}
      {variant === 'bird' && (
        <>
          {/* The 1 Bam bird — Birdy's namesake */}
          <path d="M12 24 L5 18.5 L8.5 27 Z" fill="var(--accent-jade)" />
          <circle cx="19" cy="26" r="8.2" fill="var(--accent-jade)" />
          <circle cx="27" cy="18.5" r="4.8" fill="var(--accent-jade)" />
          <path d="M31.4 16.8 L36 18.6 L31.4 20.4 Z" fill="var(--accent-warm)" />
          <circle cx="28.2" cy="17.6" r="1.1" fill="var(--bg-elevated)" />
          <line x1="16.5" y1="34" x2="16.5" y2="39" stroke="var(--accent-jade)" strokeWidth="2" strokeLinecap="round" />
          <line x1="21.5" y1="34" x2="21.5" y2="39" stroke="var(--accent-jade)" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
