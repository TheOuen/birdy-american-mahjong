'use client'

import { useState } from 'react'
import { useCart } from './CartProvider'
import type { Product } from '@/lib/shop/types'

type AddToCartButtonProps = { product: Product }

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { dispatch } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    dispatch({
      type: 'add',
      item: {
        slug: product.slug,
        name: product.name,
        price_pence: product.price_pence,
        image: product.image,
        type: product.type,
      },
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      className="px-6 h-12 rounded-md text-lg font-semibold tracking-wide
        bg-[var(--brand)] text-[var(--text-inverse)]
        hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.97]
        transition-all duration-150"
    >
      {added ? 'Added ✓' : 'Add to Cart'}
    </button>
  )
}
