import Image from 'next/image'
import Link from 'next/link'
import { formatGbp } from '@/lib/shop/cart'
import type { Product } from '@/lib/shop/types'

type ProductCardProps = { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="flex flex-col rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]
        overflow-hidden hover:border-[var(--border-strong)] active:scale-[0.99] transition-all duration-150"
    >
      <div className="relative aspect-square bg-[var(--accent-blush)]">
        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
      </div>
      <div className="p-5 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          {product.name}
        </h3>
        <p className="text-xl font-bold text-[var(--accent-warm)]">{formatGbp(product.price_pence)}</p>
      </div>
    </Link>
  )
}
