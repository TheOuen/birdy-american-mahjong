import { NMJL_2025_HANDS } from '@/lib/nmjl/hands'
import { CATEGORY_LABELS } from '@/lib/nmjl/types'
import type { HandCategory } from '@/lib/nmjl/types'

function groupByCategory() {
  const grouped = new Map<HandCategory, typeof NMJL_2025_HANDS>()
  for (const hand of NMJL_2025_HANDS) {
    const existing = grouped.get(hand.category) ?? []
    existing.push(hand)
    grouped.set(hand.category, existing)
  }
  return grouped
}

function ChevronIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export default function AdminNmjlCardPage() {
  const grouped = groupByCategory()

  return (
    <div>
      <h1
        className="font-semibold mb-2"
        style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
      >
        NMJL 2025 Card
      </h1>
      <p
        className="mb-8"
        style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}
      >
        All valid winning hands for the 2025 season, grouped by category.
      </p>

      <div className="flex flex-col gap-4">
        {Array.from(grouped.entries()).map(([category, hands]) => (
          <details
            key={category}
            className="group rounded-md overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
            open
          >
            <summary
              className="flex items-center justify-between cursor-pointer select-none px-6 py-4 list-none"
              style={{
                minHeight: 'var(--touch-min)',
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <h2
                  className="font-semibold"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
                >
                  {CATEGORY_LABELS[category]}
                </h2>
                <span
                  className="text-sm px-2 py-0.5 rounded-sm font-medium"
                  style={{
                    backgroundColor: 'var(--brand)',
                    color: 'var(--text-inverse)',
                    fontSize: '0.8125rem',
                  }}
                >
                  {hands.length} {hands.length === 1 ? 'hand' : 'hands'}
                </span>
              </div>
              <span
                className="transition-transform group-open:rotate-180"
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronIcon />
              </span>
            </summary>

            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {hands.map((hand) => (
                <div
                  key={hand.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* Pattern */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono font-semibold tracking-wide"
                      style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-primary)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {hand.pattern}
                    </div>
                    {hand.suitsRule && (
                      <div
                        className="mt-1 text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {hand.suitsRule}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {hand.concealed ? (
                      <span
                        className="inline-block px-3 py-1 rounded-sm text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--accent-warm)',
                          color: 'var(--text-inverse)',
                        }}
                      >
                        Concealed
                      </span>
                    ) : (
                      <span
                        className="inline-block px-3 py-1 rounded-sm text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--success-light)',
                          color: 'var(--success)',
                        }}
                      >
                        Exposable
                      </span>
                    )}
                    <span
                      className="inline-block px-3 py-1 rounded-sm text-sm font-bold"
                      style={{
                        backgroundColor: 'var(--accent-gold)',
                        color: 'var(--text-inverse)',
                      }}
                    >
                      {hand.points} pts
                    </span>
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-medium cursor-not-allowed opacity-50"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        minHeight: '36px',
                      }}
                    >
                      <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
