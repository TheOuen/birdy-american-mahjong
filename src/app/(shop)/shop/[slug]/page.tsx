import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/shop/products'
import { formatGbp } from '@/lib/shop/cart'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { TileFrame } from '@/components/ui/TileFrame'
import { TileMotif } from '@/components/ui/TileMotif'

export const revalidate = 300

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <Link href="/shop" className="link-arrow text-base">
        <span aria-hidden="true">&larr;</span> Back to shop
      </Link>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start">
        <TileFrame
          edge={product.type === 'lesson' ? 'berry' : 'indigo'}
          className="max-w-lg w-full mx-auto md:mx-0"
        >
          {product.type === 'lesson' ? (
            <div className="relative aspect-square bg-[var(--accent-blush)] flex flex-col items-center justify-center gap-6">
              <div className="flex gap-3">
                <TileMotif variant="dot" className="h-24 w-auto -rotate-3" />
                <TileMotif variant="bam" className="h-24 w-auto" />
                <TileMotif variant="crak" className="h-24 w-auto rotate-3" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-warm)]">
                Lesson with Andrew
              </span>
            </div>
          ) : (
            <div className="relative aspect-square bg-[var(--bg-card)]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </TileFrame>

        <div className="flex flex-col gap-5">
          <p className="eyebrow">
            {product.type === 'lesson' ? 'Private lesson' : 'Equipment'}
          </p>
          <h1 className="display-xl text-[var(--text-primary)]">{product.name}</h1>
          <p className="text-3xl font-bold text-[var(--accent-warm)]">
            {formatGbp(product.price_pence)}
          </p>
          <p className="text-lg leading-relaxed text-[var(--text-secondary)]">
            {product.description}
          </p>
          {product.type === 'lesson' && (
            <p className="rounded-[var(--radius-lg)] bg-[var(--accent-jade-subtle)] px-5 py-4 text-base text-[var(--accent-jade-dark)]">
              After booking, Andrew emails you to arrange a time that suits you.
            </p>
          )}
          <div className="mt-2">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
