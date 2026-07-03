import Link from 'next/link'
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'

export const metadata = { title: 'Private Lessons — American Mahjong | London' }
export const revalidate = 300

export default async function PrivateLessonsPage() {
  const lessons = (await getProducts()).filter((p) => p.type === 'lesson')

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Private Lessons
        </h1>
        <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
          Learn American Mahjong with Andrew — one to one or with friends, at your pace.
          Every session includes a complete guide to take home and return to anytime.
          After booking, Andrew will email you to arrange a time that suits you.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>

      <section className="rounded-md bg-[var(--accent-blush)] p-6 sm:p-8 flex flex-col gap-3 max-w-3xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Practice between lessons — free
        </h2>
        <p className="text-lg text-[var(--text-secondary)]">
          Keep what you learn fresh by playing Birdy, our free online American Mahjong game.
        </p>
        <Link href="/lobby" className="self-start px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Play Birdy Online
        </Link>
      </section>
    </div>
  )
}
