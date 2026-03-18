'use client'

import { TileRenderer } from '@/components/tiles/TileRenderer'
import type { Tile } from '@/lib/tiles/constants'

// Helper to make demo tiles for visual examples
function makeTile(id: string, type: Tile['type']): Tile {
  return { id, type }
}

// Example tiles for demonstrations
const EXAMPLE_BAM_1 = makeTile('ex-bam-1', { kind: 'suit', suit: 'bam', number: 1 })
const EXAMPLE_BAM_3 = makeTile('ex-bam-3', { kind: 'suit', suit: 'bam', number: 3 })
const EXAMPLE_BAM_5 = makeTile('ex-bam-5', { kind: 'suit', suit: 'bam', number: 5 })
const EXAMPLE_BAM_7 = makeTile('ex-bam-7', { kind: 'suit', suit: 'bam', number: 7 })
const EXAMPLE_BAM_9 = makeTile('ex-bam-9', { kind: 'suit', suit: 'bam', number: 9 })
const EXAMPLE_CRAK_2 = makeTile('ex-crak-2', { kind: 'suit', suit: 'crak', number: 2 })
const EXAMPLE_CRAK_4 = makeTile('ex-crak-4', { kind: 'suit', suit: 'crak', number: 4 })
const EXAMPLE_CRAK_6 = makeTile('ex-crak-6', { kind: 'suit', suit: 'crak', number: 6 })
const EXAMPLE_DOT_3 = makeTile('ex-dot-3', { kind: 'suit', suit: 'dot', number: 3 })
const EXAMPLE_DOT_5 = makeTile('ex-dot-5', { kind: 'suit', suit: 'dot', number: 5 })
const EXAMPLE_DOT_7 = makeTile('ex-dot-7', { kind: 'suit', suit: 'dot', number: 7 })

const EXAMPLE_WIND_E = makeTile('ex-wind-e', { kind: 'wind', direction: 'east' })
const EXAMPLE_WIND_S = makeTile('ex-wind-s', { kind: 'wind', direction: 'south' })
const EXAMPLE_WIND_W = makeTile('ex-wind-w', { kind: 'wind', direction: 'west' })
const EXAMPLE_WIND_N = makeTile('ex-wind-n', { kind: 'wind', direction: 'north' })

const EXAMPLE_DRAGON_R = makeTile('ex-dragon-r', { kind: 'dragon', color: 'red' })
const EXAMPLE_DRAGON_G = makeTile('ex-dragon-g', { kind: 'dragon', color: 'green' })
const EXAMPLE_DRAGON_W = makeTile('ex-dragon-w', { kind: 'dragon', color: 'white' })

const EXAMPLE_FLOWER_1 = makeTile('ex-flower-1', { kind: 'flower', number: 1 })
const EXAMPLE_FLOWER_2 = makeTile('ex-flower-2', { kind: 'flower', number: 2 })
const EXAMPLE_FLOWER_3 = makeTile('ex-flower-3', { kind: 'flower', number: 3 })
const EXAMPLE_FLOWER_4 = makeTile('ex-flower-4', { kind: 'flower', number: 4 })

const EXAMPLE_JOKER = makeTile('ex-joker', { kind: 'joker' })
const EXAMPLE_JOKER_2 = makeTile('ex-joker-2', { kind: 'joker' })

// Pung example: three 5 Bam
const PUNG_TILES = [
  makeTile('pung-1', { kind: 'suit', suit: 'bam', number: 5 }),
  makeTile('pung-2', { kind: 'suit', suit: 'bam', number: 5 }),
  makeTile('pung-3', { kind: 'suit', suit: 'bam', number: 5 }),
]

// Kong example: four 3 Dot
const KONG_TILES = [
  makeTile('kong-1', { kind: 'suit', suit: 'dot', number: 3 }),
  makeTile('kong-2', { kind: 'suit', suit: 'dot', number: 3 }),
  makeTile('kong-3', { kind: 'suit', suit: 'dot', number: 3 }),
  makeTile('kong-4', { kind: 'suit', suit: 'dot', number: 3 }),
]

// Quint example: four 7 Crak + 1 Joker
const QUINT_TILES = [
  makeTile('quint-1', { kind: 'suit', suit: 'crak', number: 7 }),
  makeTile('quint-2', { kind: 'suit', suit: 'crak', number: 7 }),
  makeTile('quint-3', { kind: 'suit', suit: 'crak', number: 7 }),
  makeTile('quint-4', { kind: 'suit', suit: 'crak', number: 7 }),
  makeTile('quint-j', { kind: 'joker' }),
]

// Pair example
const PAIR_TILES = [
  makeTile('pair-1', { kind: 'wind', direction: 'north' }),
  makeTile('pair-2', { kind: 'wind', direction: 'north' }),
]

// Joker swap example
const SWAP_GROUP = [
  makeTile('swap-1', { kind: 'suit', suit: 'bam', number: 9 }),
  makeTile('swap-2', { kind: 'suit', suit: 'bam', number: 9 }),
  makeTile('swap-j', { kind: 'joker' }),
]
const SWAP_HAND_TILE = makeTile('swap-hand', { kind: 'suit', suit: 'bam', number: 9 })

function TileGroup({ tiles, label }: { tiles: Tile[]; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {tiles.map((t) => (
          <TileRenderer key={t.id} tile={t} size="md" />
        ))}
      </div>
      <span className="text-sm font-semibold text-[var(--text-secondary)]">{label}</span>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-[var(--brand)] mb-6" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
        {title}
      </h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  )
}

function Callout({ children, type = 'tip' }: { children: React.ReactNode; type?: 'tip' | 'important' | 'example' }) {
  const styles = {
    tip: { bg: 'var(--brand-subtle)', border: 'var(--brand)', icon: '💡', label: 'Tip' },
    important: { bg: 'var(--accent-warm-subtle)', border: 'var(--accent-warm)', icon: '⚠️', label: 'Important' },
    example: { bg: 'var(--accent-gold-subtle)', border: 'var(--accent-gold)', icon: '📋', label: 'Example' },
  }
  const s = styles[type]
  return (
    <div className="px-6 py-4 rounded-[var(--radius-md)]" style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
      <p className="font-semibold text-[var(--text-primary)] mb-1">{s.icon} {s.label}</p>
      <div className="text-[var(--text-secondary)]">{children}</div>
    </div>
  )
}

export default function HowToPlayPage() {
  const tocItems = [
    { id: 'what-is', label: '1. What is American Mahjong?' },
    { id: 'the-tiles', label: '2. The Tiles' },
    { id: 'setup', label: '3. Setting Up' },
    { id: 'charleston', label: '4. The Charleston' },
    { id: 'gameplay', label: '5. Drawing & Discarding' },
    { id: 'claiming', label: '6. Claiming Tiles' },
    { id: 'groups', label: '7. Groups: Pungs, Kongs & More' },
    { id: 'jokers', label: '8. Jokers' },
    { id: 'nmjl-card', label: '9. The NMJL Card' },
    { id: 'winning', label: '10. Winning' },
    { id: 'scoring', label: '11. Scoring' },
  ]

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="gold-line w-20 mx-auto mb-6" />
          <h1 className="text-[var(--brand)] mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            How to Play
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-xl mx-auto">
            A friendly, visual guide to American Mahjong. Everything you need to know to sit down and play.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Table of Contents */}
        <nav className="card p-6 mb-12">
          <h3 className="text-lg font-semibold text-[var(--brand)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            What&apos;s in this guide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-3 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--brand-subtle)] transition-all font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="flex flex-col gap-16">

          {/* 1. What is American Mahjong? */}
          <Section id="what-is" title="1. What is American Mahjong?">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              American Mahjong is a tile game for <strong>4 players</strong>. You use <strong>152 tiles</strong> — drawing and discarding to build a winning hand that matches one of the patterns on an official card published each year by the National Mah Jongg League (NMJL).
            </p>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Think of it like a more strategic version of rummy, but played with beautiful tiles instead of cards. It&apos;s social, satisfying, and each year brings fresh challenges with the new card.
            </p>
            <Callout type="tip">
              <p>Don&apos;t worry if it feels like a lot to learn at first — it all clicks after a few games. The best way to learn is to jump in and play!</p>
            </Callout>
          </Section>

          {/* 2. The Tiles */}
          <Section id="the-tiles" title="2. The Tiles">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              The game uses <strong>152 tiles</strong> in six types. Here&apos;s what each one looks like:
            </p>

            {/* Suit tiles */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Suit Tiles <span className="text-base font-normal text-[var(--text-muted)]">— 108 tiles (3 suits × 9 numbers × 4 copies)</span>
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                There are three suits. Each suit has tiles numbered 1 through 9, with four copies of each.
              </p>

              <div className="flex flex-col gap-6">
                {/* Bamboo */}
                <div>
                  <p className="font-semibold mb-2" style={{ color: 'var(--tile-bam)' }}>Bamboo (Bam)</p>
                  <div className="flex flex-wrap gap-1">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <TileRenderer key={`bam-${n}`} tile={makeTile(`demo-bam-${n}`, { kind: 'suit', suit: 'bam', number: n })} size="md" />
                    ))}
                  </div>
                </div>

                {/* Character */}
                <div>
                  <p className="font-semibold mb-2" style={{ color: 'var(--tile-crak)' }}>Character (Crak)</p>
                  <div className="flex flex-wrap gap-1">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <TileRenderer key={`crak-${n}`} tile={makeTile(`demo-crak-${n}`, { kind: 'suit', suit: 'crak', number: n })} size="md" />
                    ))}
                  </div>
                </div>

                {/* Dot */}
                <div>
                  <p className="font-semibold mb-2" style={{ color: 'var(--tile-dot)' }}>Circle (Dot)</p>
                  <div className="flex flex-wrap gap-1">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <TileRenderer key={`dot-${n}`} tile={makeTile(`demo-dot-${n}`, { kind: 'suit', suit: 'dot', number: n })} size="md" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Winds */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Wind Tiles <span className="text-base font-normal text-[var(--text-muted)]">— 16 tiles (4 directions × 4 copies)</span>
              </h3>
              <div className="flex flex-wrap gap-1">
                <TileRenderer tile={EXAMPLE_WIND_E} size="md" />
                <TileRenderer tile={EXAMPLE_WIND_S} size="md" />
                <TileRenderer tile={EXAMPLE_WIND_W} size="md" />
                <TileRenderer tile={EXAMPLE_WIND_N} size="md" />
              </div>
              <p className="text-[var(--text-secondary)] mt-3">East, South, West, and North. Four of each.</p>
            </div>

            {/* Dragons */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Dragon Tiles <span className="text-base font-normal text-[var(--text-muted)]">— 12 tiles (3 colors × 4 copies)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                <TileRenderer tile={EXAMPLE_DRAGON_R} size="md" />
                <TileRenderer tile={EXAMPLE_DRAGON_G} size="md" />
                <TileRenderer tile={EXAMPLE_DRAGON_W} size="md" />
              </div>
              <p className="text-[var(--text-secondary)] mt-3">Red Dragon (中), Green Dragon (發), and White Dragon. Four of each.</p>
            </div>

            {/* Flowers */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Flower Tiles <span className="text-base font-normal text-[var(--text-muted)]">— 8 tiles (4 designs × 2 copies)</span>
              </h3>
              <div className="flex flex-wrap gap-1">
                <TileRenderer tile={EXAMPLE_FLOWER_1} size="md" />
                <TileRenderer tile={EXAMPLE_FLOWER_2} size="md" />
                <TileRenderer tile={EXAMPLE_FLOWER_3} size="md" />
                <TileRenderer tile={EXAMPLE_FLOWER_4} size="md" />
              </div>
              <p className="text-[var(--text-secondary)] mt-3">Numbered 1-4, two copies each. On the NMJL card, &quot;F&quot; means Flower.</p>
            </div>

            {/* Jokers */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--tile-joker)' }}>
                Joker Tiles <span className="text-base font-normal text-[var(--text-muted)]">— 8 tiles</span>
              </h3>
              <div className="flex flex-wrap gap-1">
                <TileRenderer tile={EXAMPLE_JOKER} size="md" />
                <TileRenderer tile={EXAMPLE_JOKER_2} size="md" />
              </div>
              <p className="text-[var(--text-secondary)] mt-3">
                8 Jokers total. Jokers are <strong>wild</strong> — they can substitute for any tile in a group of 3 or more. They <strong>cannot</strong> be used in pairs.
              </p>
            </div>
          </Section>

          {/* 3. Setup */}
          <Section id="setup" title="3. Setting Up">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              All 152 tiles are shuffled and dealt out:
            </p>
            <div className="card p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-gold-subtle)] flex items-center justify-center text-xl font-bold text-[var(--accent-gold)]" style={{ fontFamily: 'var(--font-display)' }}>E</div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">East (Dealer)</p>
                    <p className="text-[var(--text-secondary)]">Receives <strong>14 tiles</strong> and goes first. Discards one tile to begin play.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center text-xl font-bold text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>S W N</div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Other Players</p>
                    <p className="text-[var(--text-secondary)]">Each receives <strong>13 tiles</strong>. Play proceeds counter-clockwise.</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              The remaining tiles form the <strong>wall</strong> — the draw pile. Players draw from the wall during their turns.
            </p>
          </Section>

          {/* 4. The Charleston */}
          <Section id="charleston" title="4. The Charleston">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Before the game begins, players exchange tiles in a ritual called the <strong>Charleston</strong>. This gives you a chance to improve your hand before play starts.
            </p>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Three Mandatory Passes</h3>
              <div className="flex flex-col gap-4">
                {[
                  { step: 1, dir: 'Right →', desc: 'Pass 3 tiles to the player on your right' },
                  { step: 2, dir: 'Across ↑', desc: 'Pass 3 tiles to the player across from you' },
                  { step: 3, dir: 'Left ←', desc: 'Pass 3 tiles to the player on your left' },
                ].map(({ step, dir, desc }) => (
                  <div key={step} className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-card)]">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{step}</div>
                    <div>
                      <p className="font-semibold text-[var(--brand)]">{dir}</p>
                      <p className="text-[var(--text-secondary)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Callout type="tip">
              <p>Pass tiles you don&apos;t need. Look at your hand, decide which NMJL pattern you&apos;re going for, and pass everything that doesn&apos;t fit.</p>
            </Callout>

            <Callout type="important">
              <p>You <strong>cannot pass back</strong> a tile you just received in the same direction. For example, if you received a tile from the right, you can&apos;t pass it back to the right.</p>
            </Callout>
          </Section>

          {/* 5. Gameplay */}
          <Section id="gameplay" title="5. Drawing & Discarding">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              After the Charleston, play begins. Each turn has two simple steps:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card p-6 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--brand)] text-[var(--text-inverse)] flex items-center justify-center text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>1</div>
                <h4 className="text-lg font-semibold text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>Draw</h4>
                <p className="text-[var(--text-secondary)]">Pick up one tile from the wall (or claim a discard — more on that below).</p>
                <div className="flex gap-1 mt-2">
                  <TileRenderer tile={makeTile('draw-demo', { kind: 'suit', suit: 'bam', number: 7 })} size="md" faceDown />
                  <span className="text-2xl text-[var(--brand)] self-center mx-2">→</span>
                  <TileRenderer tile={makeTile('draw-demo-2', { kind: 'suit', suit: 'bam', number: 7 })} size="md" />
                </div>
              </div>

              <div className="card p-6 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-warm)] text-[var(--text-inverse)] flex items-center justify-center text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>2</div>
                <h4 className="text-lg font-semibold text-[var(--accent-warm)]" style={{ fontFamily: 'var(--font-display)' }}>Discard</h4>
                <p className="text-[var(--text-secondary)]">Choose one tile from your hand and place it face-up in the discard pile.</p>
                <div className="flex gap-1 mt-2">
                  <TileRenderer tile={makeTile('discard-demo', { kind: 'suit', suit: 'crak', number: 4 })} size="md" selected />
                  <span className="text-2xl text-[var(--accent-warm)] self-center mx-2">→</span>
                  <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-card)] border border-[var(--border)]">
                    <TileRenderer tile={makeTile('discard-demo-2', { kind: 'suit', suit: 'crak', number: 4 })} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Play continues <strong>counter-clockwise</strong> around the table. The goal is to collect tiles that match a pattern on the NMJL card.
            </p>
          </Section>

          {/* 6. Claiming */}
          <Section id="claiming" title="6. Claiming Tiles">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              When someone discards a tile you need, you can <strong>claim</strong> it instead of drawing from the wall. You must announce your claim and show the completed group.
            </p>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Claim Priority</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--accent-warm-subtle)]">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="font-semibold text-[var(--accent-warm)]">Mahjong — Highest Priority</p>
                    <p className="text-sm text-[var(--text-secondary)]">If the tile completes your winning hand, you always get it, no matter whose turn it is.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--brand-subtle)]">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="font-semibold text-[var(--brand)]">Next in Turn — Second Priority</p>
                    <p className="text-sm text-[var(--text-secondary)]">The player whose turn comes next has priority for Pung/Kong claims.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--accent-gold-subtle)]">
                  <span className="text-xl">👥</span>
                  <div>
                    <p className="font-semibold text-[var(--accent-gold-dark)]">Others — Third Priority</p>
                    <p className="text-sm text-[var(--text-secondary)]">If the next player passes, anyone else may claim.</p>
                  </div>
                </div>
              </div>
            </div>

            <Callout type="important">
              <p>When you claim a discard, you must <strong>expose</strong> the completed group face-up on the table. Then you discard a tile to end your turn.</p>
            </Callout>
          </Section>

          {/* 7. Groups */}
          <Section id="groups" title="7. Groups: Pungs, Kongs & More">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Groups are sets of identical tiles. Here&apos;s what each type looks like:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Pair */}
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Pair</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">2 identical tiles. <strong>No jokers allowed in pairs.</strong></p>
                <TileGroup tiles={PAIR_TILES} label="2 × North Wind" />
              </div>

              {/* Pung */}
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Pung</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">3 identical tiles. Jokers allowed.</p>
                <TileGroup tiles={PUNG_TILES} label="3 × 5 Bamboo" />
              </div>

              {/* Kong */}
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Kong</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">4 identical tiles. Jokers allowed.</p>
                <TileGroup tiles={KONG_TILES} label="4 × 3 Circle" />
              </div>

              {/* Quint */}
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Quint</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">5 identical tiles — only possible with jokers.</p>
                <TileGroup tiles={QUINT_TILES} label="4 × 7 Crak + 1 Joker" />
              </div>
            </div>
          </Section>

          {/* 8. Jokers */}
          <Section id="jokers" title="8. Jokers">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Jokers are the wild tiles of American Mahjong. They&apos;re powerful but come with rules:
            </p>

            <div className="card p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-[var(--success)]">Can be used in groups of 3 or more</p>
                    <p className="text-[var(--text-secondary)]">Pungs, Kongs, Quints, and Sextets can include Jokers.</p>
                    <div className="flex gap-1 mt-2">
                      <TileRenderer tile={makeTile('j-ok-1', { kind: 'suit', suit: 'dot', number: 5 })} size="sm" />
                      <TileRenderer tile={makeTile('j-ok-2', { kind: 'suit', suit: 'dot', number: 5 })} size="sm" />
                      <TileRenderer tile={makeTile('j-ok-j', { kind: 'joker' })} size="sm" />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold text-[var(--error)]">Cannot be used in pairs or singles</p>
                    <p className="text-[var(--text-secondary)]">A pair must be two real matching tiles — no Jokers allowed.</p>
                    <div className="flex gap-1 mt-2 opacity-50">
                      <TileRenderer tile={makeTile('j-bad-1', { kind: 'wind', direction: 'east' })} size="sm" />
                      <TileRenderer tile={makeTile('j-bad-j', { kind: 'joker' })} size="sm" />
                      <span className="text-[var(--error)] text-xl self-center ml-1">✗</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Joker Swap */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>Joker Swap</h3>
              <p className="text-[var(--text-secondary)] mb-4">
                On your turn, if an exposed group on the table contains a Joker, and you hold the tile it represents, you can <strong>swap</strong> your tile for the Joker. The Joker goes into your hand.
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">EXPOSED GROUP</p>
                    <div className="flex gap-1 p-2 rounded-[var(--radius-sm)] bg-[var(--bg-card)] border border-[var(--border)]">
                      {SWAP_GROUP.map(t => <TileRenderer key={t.id} tile={t} size="sm" />)}
                    </div>
                  </div>
                  <span className="text-2xl text-[var(--accent-gold)]">+</span>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">YOUR TILE</p>
                    <TileRenderer tile={SWAP_HAND_TILE} size="sm" />
                  </div>
                  <span className="text-2xl text-[var(--brand)]">→</span>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">YOU GET</p>
                    <TileRenderer tile={makeTile('swap-result-j', { kind: 'joker' })} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* 9. NMJL Card */}
          <Section id="nmjl-card" title="9. The NMJL Card">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              The <strong>National Mah Jongg League (NMJL)</strong> publishes a new card each year listing every valid winning hand. Your goal is to build your hand to match <strong>exactly one</strong> of these patterns.
            </p>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Reading the Card</h3>
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-card)] font-mono text-xl tracking-wide">
                  <span style={{ color: 'var(--tile-flower)' }}>FF</span>{' '}
                  <span style={{ color: 'var(--brand)' }}>222</span>{' '}
                  <span style={{ color: 'var(--brand)' }}>000</span>{' '}
                  <span style={{ color: 'var(--brand)' }}>222</span>{' '}
                  <span style={{ color: 'var(--brand)' }}>555</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg" style={{ color: 'var(--tile-flower)' }}>F</span>
                    <span className="text-[var(--text-secondary)]">= Flower tile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg" style={{ color: 'var(--tile-dragon-red)' }}>D</span>
                    <span className="text-[var(--text-secondary)]">= Dragon tile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg" style={{ color: 'var(--brand)' }}>1-9</span>
                    <span className="text-[var(--text-secondary)]">= Suit tiles (any suit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg" style={{ color: 'var(--tile-wind)' }}>N E W S</span>
                    <span className="text-[var(--text-secondary)]">= Wind tiles</span>
                  </div>
                </div>
              </div>
            </div>

            <Callout type="example">
              <p>The pattern <strong>FF 222 000 222 555</strong> means: 2 Flowers, a Pung of 2s, a Kong of a matching number, another Pung of 2s, and a Quint of 5s — in any 3 suits.</p>
            </Callout>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-[var(--radius-sm)] text-sm font-bold text-[var(--text-inverse)]" style={{ background: 'var(--success)' }}>Exposable</span>
                <span className="text-[var(--text-secondary)]">You can claim discards and show groups on the table.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-[var(--radius-sm)] text-sm font-bold text-[var(--text-inverse)]" style={{ background: 'var(--error)' }}>Concealed</span>
                <span className="text-[var(--text-secondary)]">You must draw all tiles from the wall — no claiming allowed.</span>
              </div>
            </div>

            <Callout type="tip">
              <p>During a game, tap the <strong>&quot;NMJL Card&quot;</strong> button in the game header to view all winning hands at any time.</p>
            </Callout>
          </Section>

          {/* 10. Winning */}
          <Section id="winning" title="10. Winning">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              You win by completing a hand that <strong>exactly matches</strong> one of the patterns on the NMJL card. When you have a winning hand:
            </p>
            <div className="card p-6">
              <div className="flex flex-col gap-4">
                {[
                  { step: '1', text: 'Call "Mahjong!" to announce your win' },
                  { step: '2', text: 'Reveal your entire hand face-up on the table' },
                  { step: '3', text: 'All players verify the hand against the NMJL card' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)] text-[var(--text-inverse)] flex items-center justify-center font-bold" style={{ fontFamily: 'var(--font-display)' }}>{step}</div>
                    <p className="text-lg text-[var(--text-secondary)]">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <Callout type="important">
              <p>If no one wins and all tiles are drawn from the wall, the round is a <strong>Wall Game</strong> (draw). No points change hands and the same dealer deals again.</p>
            </Callout>
          </Section>

          {/* 11. Scoring */}
          <Section id="scoring" title="11. Scoring">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Each winning hand has a point value printed on the NMJL card (typically 25-60 points). How you win affects who pays:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center mx-auto mb-3 text-2xl">🎯</div>
                <h4 className="text-lg font-semibold text-[var(--brand)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Self-Draw Win</h4>
                <p className="text-[var(--text-secondary)]">You draw your winning tile from the wall yourself.</p>
                <div className="mt-3 p-3 rounded-[var(--radius-sm)] bg-[var(--bg-card)]">
                  <p className="font-semibold text-[var(--brand)]">All 3 opponents pay the hand value</p>
                </div>
              </div>

              <div className="card p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-warm-subtle)] flex items-center justify-center mx-auto mb-3 text-2xl">🃏</div>
                <h4 className="text-lg font-semibold text-[var(--accent-warm)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Discard Win</h4>
                <p className="text-[var(--text-secondary)]">Someone else discards the tile you need to win.</p>
                <div className="mt-3 p-3 rounded-[var(--radius-sm)] bg-[var(--bg-card)]">
                  <p className="font-semibold text-[var(--accent-warm)]">Only the discarder pays — at double value</p>
                </div>
              </div>
            </div>

            <Callout type="example">
              <p>If the winning hand is worth 30 points: a self-draw win earns 30 × 3 = 90 points total. A discard win earns 30 × 2 = 60 points, all from one player.</p>
            </Callout>
          </Section>

          {/* CTA */}
          <div className="text-center py-8">
            <div className="gold-line w-24 mx-auto mb-8" />
            <h2 className="text-[var(--brand)] mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
              Ready to try?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-6">
              Jump into a demo game against bots — the best way to learn is by playing!
            </p>
            <a href="/lobby" className="btn-primary text-xl px-10 py-4">
              Start Playing
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
