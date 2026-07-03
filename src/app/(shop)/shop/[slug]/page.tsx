import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/shop/products'
import { formatGbp } from '@/lib/shop/cart'
import { AddToCartButton } from '@/components/shop/AddToCartButton'

export const revalidate = 300

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
      <Link href="/shop" className="text-lg text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
        &larr; Back to Shop
      </Link>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="relative aspect-square rounded-md overflow-hidden bg-[var(--accent-blush)]">
          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {product.name}
          </h1>
          <p className="text-3xl font-bold text-[var(--accent-warm)]">{formatGbp(product.price_pence)}</p>
          <p className="text-lg leading-relaxed text-[var(--text-secondary)]">{product.description}</p>
          {product.type === 'lesson' && (
            <p className="text-base text-[var(--text-muted)]">
              After purchase, Andrew will contact you by email to arrange a time that suits you.
            </p>
          )}
          <div className="mt-2"><AddToCartButton product={product} /></div>
        </div>
      </div>
    </div>
  )
}
