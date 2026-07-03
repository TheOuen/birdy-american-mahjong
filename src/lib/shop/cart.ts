import type { CartAction, CartItem, CartState } from './types'

export const EMPTY_CART: CartState = { items: [] }

const MAX_QUANTITY = 99

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.items.find((i) => i.slug === action.item.slug)
      if (existing) {
        return setQuantity(state, existing.slug, existing.quantity + 1)
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'remove':
      return { items: state.items.filter((i) => i.slug !== action.slug) }
    case 'setQuantity':
      return setQuantity(state, action.slug, action.quantity)
    case 'clear':
      return EMPTY_CART
  }
}

function setQuantity(state: CartState, slug: string, quantity: number): CartState {
  if (quantity <= 0) {
    return { items: state.items.filter((i) => i.slug !== slug) }
  }
  const clamped = Math.min(quantity, MAX_QUANTITY)
  return {
    items: state.items.map((i): CartItem => (i.slug === slug ? { ...i, quantity: clamped } : i)),
  }
}

export function cartCount(state: CartState): number {
  return state.items.reduce((n, i) => n + i.quantity, 0)
}

export function cartTotalPence(state: CartState): number {
  return state.items.reduce((n, i) => n + i.price_pence * i.quantity, 0)
}

export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}
