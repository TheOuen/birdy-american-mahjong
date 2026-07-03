import Image from 'next/image'
import Link from 'next/link'
import { formatGbp } from '@/lib/shop/cart'
import type { Product } from '@/lib/shop/types'
import { TileMotif } from '@/components/ui/TileMotif'

type ProductCardProps = { product: Product }

// Lessons are a service, not a boxed product — they get a branded tile
// composition instead of a stock photo. Physical items keep their real
// product photography. Every card reads as a mahjong tile: cream face,
// navy keyline, coloured side edge.
const LESSON_ART = [
  ['dot', 'bam', 'crak'],
  ['flower', 'dot', 'wind'],
  ['bam', 'flower', 'dot'],
] as const

const EDGES = ['tile-edge-berry', 'tile-edge-jade', 'tile-edge-indigo'] as const

function slugHash(slug: string): number {
  let sum = 0
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i)
  return sum
}

export function ProductCard({ product }: ProductCardProps) {
  const hash = slugHash(product.slug)
  const edge = EDGES[hash % EDGES.length]
  const art = LESSON_ART[hash % LESSON_ART.length]

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`group tile-frame tile-lift ${edge} flex flex-col`}
    >
      <div className="tile-face flex-1 flex flex-col">
        {product.type === 'lesson' ? (
          <div className="relative aspect-[4/3] flex flex-col items-center justify-center gap-4 bg-[var(--accent-blush)]">
            <div className="flex gap-2">
              {art.map((variant, i) => (
                <TileMotif
                  key={variant}
                  variant={variant}
                  className={`h-16 w-auto transition-transform duration-200 ${
                    i === 1 ? 'group-hover:-translate-y-1' : ''
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-warm)]">
              Lesson with Andrew
            </span>
          </div>
        ) : (
          <div className="relative aspect-[4/3] bg-[var(--bg-card)]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          </div>
        )}
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
