type SectionProps = {
  children: React.ReactNode
  id?: string
  /** Background treatment - keeps the page rhythm deliberate, not decorative. */
  tone?: 'paper' | 'cream' | 'blush' | 'lavender' | 'periwinkle' | 'jade' | 'navy'
  /** Tighter vertical rhythm for secondary strips. */
  size?: 'regular' | 'compact'
  className?: string
}

const TONE_CLASSES = {
  paper: '',
  cream: 'bg-[var(--bg-card)]',
  blush: 'bg-[var(--accent-blush)]',
  lavender: 'bg-[var(--accent-lavender)]',
  periwinkle: 'bg-[var(--accent-periwinkle)]',
  jade: 'bg-[var(--accent-jade-subtle)]',
  navy: 'bg-[var(--bg-deep)] text-[var(--text-inverse)]',
} as const

// Shared section wrapper - one spacing rhythm and container width for every
// marketing surface, so pages inherit the system instead of improvising.
export function Section({ children, id, tone = 'paper', size = 'regular', className }: SectionProps) {
  const padding = size === 'compact' ? 'py-12 sm:py-16' : 'py-16 sm:py-24'
  return (
    <section id={id} className={`${TONE_CLASSES[tone]} ${className ?? ''}`}>
      <div className={`max-w-6xl mx-auto px-5 sm:px-8 ${padding}`}>{children}</div>
    </section>
  )
}
