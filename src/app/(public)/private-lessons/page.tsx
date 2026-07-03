import Link from 'next/link'
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { TileMotif } from '@/components/ui/TileMotif'

export const metadata = { title: 'Private lessons' }
export const revalidate = 300

const INCLUDED = [
  'Andrew comes to you, anywhere in London — tiles, racks and cards included',
  'A complete written guide to keep and return to anytime',
  'Real hands from your first session — you learn by playing',
  'A time that suits you: after booking, Andrew emails to arrange it',
] as const

export default async function PrivateLessonsPage() {
  const lessons = (await getProducts()).filter((p) => p.type === 'lesson')

  return (
    <div className="flex flex-col">
      <Section tone="paper">
        <div className="flex flex-col gap-5 max-w-2xl">
          <Eyebrow tile="crak">Private lessons</Eyebrow>
          <h1 className="display-hero text-[var(--text-primary)]">
            Learn at your own table, <em className="display-italic">at your own pace.</em>
          </h1>
          <p className="lede">
            One to one or with friends — Andrew teaches American Mahjong the way
            it should be learned: hands on the tiles, from the very first
            session.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 max-w-3xl">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-3 text-lg text-[var(--text-secondary)]">
              <svg
                viewBox="0 0 20 20"
                className="h-6 w-6 shrink-0 mt-0.5"
                fill="none"
                stroke="var(--accent-jade)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="cream" size="compact">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {lessons.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      <Section tone="paper" size="compact">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center rounded-[var(--radius-tile)] bg-[var(--accent-blush)] p-8 sm:p-12">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <TileMotif variant="bird" edge="jade" className="h-10 w-auto" />
              <h2 className="display-lg text-[var(--text-primary)]">
                Practise between lessons — free
              </h2>
            </div>
            <p className="lede">
              Keep what you learn fresh by playing Birdy, our free online
              American Mahjong game. Same rules, same card, any evening.
            </p>
          </div>
          <Link href="/lobby" className="btn-primary text-xl px-8 h-14 justify-self-start md:justify-self-end">
            Play Birdy online
          </Link>
        </div>
      </Section>
    </div>
  )
}
