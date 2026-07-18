'use client'

import { useState } from 'react'
import { useCart } from './CartProvider'
import { isSoldOut, type Product } from '@/lib/shop/types'

type AddToCartButtonProps = { product: Product }

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { dispatch } = useCart()
  const [added, setAdded] = useState(false)
  const soldOut = isSoldOut(product)

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

  const label = product.type === 'lesson' ? 'Book this lesson' : 'Add to cart'

  if (soldOut) {
    return (
      <button disabled className="btn-berry text-xl px-8 h-14 opacity-50 cursor-not-allowed">
        Sold out
      </button>
    )
  }

  return (
    <button onClick={handleAdd} className="btn-berry text-xl px-8 h-14" aria-live="polite">
      {added ? 'Added to cart' : label}
    </button>
  )
}
