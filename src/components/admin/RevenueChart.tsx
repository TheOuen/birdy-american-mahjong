'use client'

import { useState } from 'react'

export type RevenueMonth = {
  /** e.g. "2026-07" */
  key: string
  /** Short axis label, e.g. "Jul" */
  label: string
  /** Full label for tooltips, e.g. "July 2026" */
  longLabel: string
  lessonsPence: number
  shopPence: number
}

type RevenueChartProps = {
  months: RevenueMonth[]
}

const LESSONS_COLOR = '#9E2057' // berry - matches --accent-warm
const SHOP_COLOR = '#354D9C' // indigo - matches --accent-gold

const W = 720
const H = 300
const PAD = { top: 16, right: 12, bottom: 34, left: 56 }

function pounds(pence: number): string {
  const whole = pence / 100
  return Number.isInteger(whole) ? `£${whole.toLocaleString('en-GB')}` : `£${whole.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
}

/** A friendly axis ceiling: 1/2/2.5/5 × power of ten, at or above the max. */
function niceCeiling(maxPence: number): number {
  if (maxPence <= 0) return 10000
  const pow = Math.pow(10, Math.floor(Math.log10(maxPence)))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= maxPence) return m * pow
  }
  return 10 * pow
}

export function RevenueChart({ months }: RevenueChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / months.length
  const barW = Math.min(40, slot * 0.62)

  const yMax = niceCeiling(Math.max(...months.map((m) => m.lessonsPence + m.shopPence)))
  const y = (pence: number) => PAD.top + plotH - (pence / yMax) * plotH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)

  const hoveredMonth = hovered !== null ? months[hovered] : null

  return (
    <div className="relative">
      {/* Legend - identity is never color-alone; both series named up front */}
      <div className="flex items-center gap-5 mb-2 text-sm text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: LESSONS_COLOR }} />
          Lessons
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: SHOP_COLOR }} />
          Shop
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Monthly revenue, split into lessons and shop"
        onMouseLeave={() => setHovered(null)}
      >
        {/* Gridlines + y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeWidth={t === 0 ? 1.5 : 1}
              strokeDasharray={t === 0 ? undefined : '2 4'}
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={12}
              fill="var(--text-muted)"
            >
              {pounds(t)}
            </text>
          </g>
        ))}

        {/* Columns */}
        {months.map((m, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const x = cx - barW / 2
          const total = m.lessonsPence + m.shopPence
          const lessonsTop = y(m.lessonsPence)
          const lessonsH = Math.max(0, PAD.top + plotH - lessonsTop)
          const shopTop = y(total)
          const shopH = Math.max(0, lessonsTop - shopTop - (m.lessonsPence > 0 && m.shopPence > 0 ? 2 : 0))
          const r = 4
          const dim = hovered !== null && hovered !== i

          // The value-end (top) segment gets rounded top corners.
          const topIsShop = m.shopPence > 0
          const topY = topIsShop ? shopTop : lessonsTop
          const topH = topIsShop ? shopH : lessonsH

          return (
            <g key={m.key} opacity={dim ? 0.45 : 1} style={{ transition: 'opacity 120ms' }}>
              {/* Bottom segment: lessons (square top when shop sits above it) */}
              {m.lessonsPence > 0 && (
                <path
                  d={
                    topIsShop
                      ? `M${x},${lessonsTop} h${barW} v${lessonsH} h${-barW} Z`
                      : `M${x},${lessonsTop + r} a${r},${r} 0 0 1 ${r},${-r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${Math.max(0, lessonsH - r)} h${-barW} Z`
                  }
                  fill={LESSONS_COLOR}
                />
              )}
              {/* Top segment: shop, rounded at the value end */}
              {m.shopPence > 0 && topH > 0 && (
                <path
                  d={`M${x},${topY + Math.min(r, topH)} a${r},${r} 0 0 1 ${r},${-r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${Math.max(0, topH - Math.min(r, topH))} h${-barW} Z`}
                  fill={SHOP_COLOR}
                />
              )}
              {/* Hit target: the full column slot, larger than the marks */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                tabIndex={0}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                aria-label={`${m.longLabel}: ${pounds(total)} total - ${pounds(m.lessonsPence)} lessons, ${pounds(m.shopPence)} shop`}
              />
              {/* x label */}
              <text
                x={cx}
                y={H - PAD.bottom + 20}
                textAnchor="middle"
                fontSize={12}
                fill="var(--text-muted)"
              >
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredMonth && hovered !== null && (
        <div
          className="absolute pointer-events-none rounded-md px-3 py-2 text-sm shadow-md"
          style={{
            left: `${((PAD.left + slot * hovered + slot / 2) / W) * 100}%`,
            top: 24,
            transform: hovered > months.length / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            backgroundColor: 'var(--bg-deep)',
            color: 'var(--text-inverse)',
            minWidth: '10rem',
          }}
        >
          <div className="font-semibold mb-1">{hoveredMonth.longLabel}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LESSONS_COLOR }} />
              Lessons
            </span>
            <span className="tabular-nums">{pounds(hoveredMonth.lessonsPence)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SHOP_COLOR }} />
              Shop
            </span>
            <span className="tabular-nums">{pounds(hoveredMonth.shopPence)}</span>
          </div>
          <div
            className="flex items-center justify-between gap-4 mt-1 pt-1 font-semibold"
            style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
          >
            <span>Total</span>
            <span className="tabular-nums">{pounds(hoveredMonth.lessonsPence + hoveredMonth.shopPence)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
