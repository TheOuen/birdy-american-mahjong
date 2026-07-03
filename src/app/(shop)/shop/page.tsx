import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'

export const metadata = { title: 'Shop — American Mahjong | London' }
export const revalidate = 300

export default async function ShopPage() {
  const products = await getProducts()
  const lessons = products.filter((p) => p.type === 'lesson')
  const physical = products.filter((p) => p.type === 'physical')

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Shop
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          Everything you need to play American Mahjong — the official NMJL card, scorecards, and
          lessons with Andrew.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Lessons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Equipment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {physical.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="rounded-md bg-[var(--accent-lavender)] p-6 sm:p-8 flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Free Downloadable Scorecards
        </h2>
        <p className="text-lg text-[var(--text-secondary)]">Print at home and keep score the easy way.</p>
        <div className="flex flex-wrap gap-4 mt-2">
          <a href="/aml/downloads/scorecard-landscape.pdf" download
            className="px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
            Landscape PDF
          </a>
          <a href="/aml/downloads/scorecard-portrait.pdf" download
            className="px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
            Portrait PDF
          </a>
        </div>
      </section>
    </div>
  )
}
