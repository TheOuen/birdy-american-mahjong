'use client'

import { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { cartReducer, EMPTY_CART } from '@/lib/shop/cart'
import type { CartAction, CartState } from '@/lib/shop/types'

const STORAGE_KEY = 'aml-cart'

type CartContextValue = {
  cart: CartState
  dispatch: (action: CartAction) => void
}

const CartContext = createContext<CartContextValue | null>(null)

type CartProviderProps = { children: React.ReactNode }

export function CartProvider({ children }: CartProviderProps) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as CartState
        if (Array.isArray(saved.items)) {
          saved.items.forEach((item) => {
            const { quantity, ...rest } = item
            dispatch({ type: 'add', item: rest })
            dispatch({ type: 'setQuantity', slug: item.slug, quantity })
          })
        }
      }
    } catch {
      // corrupted storage - start with an empty cart
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    }
  }, [cart, hydrated])

  return <CartContext.Provider value={{ cart, dispatch }}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
