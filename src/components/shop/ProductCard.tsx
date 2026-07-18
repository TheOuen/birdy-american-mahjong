import Image from 'next/image'
import Link from 'next/link'
import { formatGbp } from '@/lib/shop/cart'
import { isSoldOut, type Product } from '@/lib/shop/types'

type ProductCardProps = { product: Product }

// Every card reads as a mahjong tile: cream face, navy keyline, coloured side
// edge. Photography is the brand's own gingham-mat shots - the same images the
// live site uses for its lesson cards.
const EDGES = ['tile-edge-berry', 'tile-edge-jade', 'tile-edge-indigo'] as const

function slugHash(slug: string): number {
  let sum = 0
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i)
  return sum
}

export function ProductCard({ product }: ProductCardProps) {
  const edge = EDGES[slugHash(product.slug) % EDGES.length]
  const soldOut = isSoldOut(product)

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`group tile-frame tile-lift ${edge} flex flex-col`}
    >
      <div className="tile-face flex-1 flex flex-col">
        <div className="relative aspect-[4/3] bg-[var(--bg-card)]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover${soldOut ? ' opacity-60' : ''}`}
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          {soldOut && (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--text-primary)]/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bg-elevated)]">
              Sold out
            </span>
          )}
          {product.type === 'lesson' && (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--bg-elevated)]/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
              Lesson with Andrew
            </span>
          )}
        </div>
        <div className="p-5 flex flex-col gap-2 bg-[var(--bg-elevated)]">
          <h3 className="display-md text-[var(--text-primary)]">{product.name}</h3>
          <p className="text-xl font-bold text-[var(--accent-warm)]">
            {formatGbp(product.price_pence)}
            {product.type === 'lesson' && (
              <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">per session</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  )
}
