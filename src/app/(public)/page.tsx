import Image from 'next/image'
import Link from 'next/link'
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'

export const revalidate = 300

export default async function HomePage() {
  const products = await getProducts()
  const lessons = products.filter((p) => p.type === 'lesson')

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-[var(--accent-blush)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Learn American Mahjong
            </h1>
            <p className="text-2xl text-[var(--accent-warm)] font-semibold">with Andrew</p>
            <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
              Learn it once, love it forever! Private lessons in London, official NMJL equipment,
              and now — play online for free, any time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/lobby" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
                Play Birdy Online — Free
              </Link>
              <Link href="/private-lessons" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-subtle)] active:scale-[0.97] transition-all duration-150">
                Book a Lesson
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-md overflow-hidden">
            <Image src="/aml/hero.jpeg" alt="Andrew teaching American Mahjong in London" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-square rounded-md overflow-hidden order-last md:order-first">
          <Image src="/aml/how-it-works.png" alt="American Mahjong tiles laid out for a lesson" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            How It Works
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Book a session and Andrew brings everything to you — tiles, cards, and a complete
            guide to take home. Learn the tiles, the rules, and how to build winning hands at
            your own pace. Then keep playing between lessons with Birdy, our free online game.
          </p>
          <Link href="/how-to-play" className="text-xl font-semibold text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            New to the game? Read how to play &rarr;
          </Link>
        </div>
      </section>

      {/* Lessons */}
      <section className="bg-[var(--accent-lavender)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 flex flex-col gap-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Lessons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </section>

      {/* About mahjong */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            About Mahjong
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Mahjong is a tile game that began in Shanghai in the 1800s and grew into distinct
            regional styles. American Mahjong is its own game — played with 152 tiles, jokers,
            and a standardised card of winning hands updated every April by the National Mah
            Jongg League, founded in 1937.
          </p>
          <Link href="/about" className="text-xl font-semibold text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            More about the game and Andrew &rarr;
          </Link>
        </div>
        <div className="relative aspect-square rounded-md overflow-hidden">
          <Image src="/aml/tiles-1.png" alt="American Mahjong tiles" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      </section>
    </div>
  )
}
