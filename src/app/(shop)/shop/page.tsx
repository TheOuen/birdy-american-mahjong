import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'

export const metadata = { title: 'Shop' }
export const revalidate = 300

export default async function ShopPage() {
  const products = await getProducts()
  const lessons = products.filter((p) => p.type === 'lesson')
  const physical = products.filter((p) => p.type === 'physical')

  return (
    <div className="flex flex-col">
      <Section tone="paper" size="compact">
        <div className="flex flex-col gap-5 max-w-2xl">
          <Eyebrow tile="dot">The shop</Eyebrow>
          <h1 className="display-hero text-[var(--text-primary)]">
            Everything for the <em className="display-italic">table.</em>
          </h1>
          <p className="lede">
            The official NMJL card, scorecards, and lessons with Andrew —
            everything you need to play American Mahjong.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-14">
          <section className="flex flex-col gap-6">
            <h2 className="display-xl text-[var(--text-primary)]">Lessons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {lessons.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="display-xl text-[var(--text-primary)]">Equipment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {physical.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        </div>
      </Section>

      <Section tone="lavender" size="compact">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2 className="display-lg text-[var(--text-primary)]">
            Free printable scorecards
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Print at home and keep score the easy way — our gift to your game
            night.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <a href="/aml/downloads/scorecard-landscape.pdf" download className="btn-primary">
              Download landscape PDF
            </a>
            <a href="/aml/downloads/scorecard-portrait.pdf" download className="btn-secondary">
              Download portrait PDF
            </a>
          </div>
        </div>
      </Section>
    </div>
  )
}
