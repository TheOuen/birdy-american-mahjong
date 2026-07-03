import { describe, it, expect } from 'vitest'
import { cartReducer, cartCount, cartTotalPence, formatGbp, EMPTY_CART } from './cart'
import type { CartItem } from './types'

const card: Omit<CartItem, 'quantity'> = {
  slug: 'nmjl-card-2026', name: '2026 Official NMJL Card (Large Print)',
  price_pence: 1500, image: '/aml/nmjl-card-2026.png', type: 'physical',
}
const lesson: Omit<CartItem, 'quantity'> = {
  slug: 'private-session-1-hour', name: 'Private Session (1 Hour)',
  price_pence: 12500, image: '/aml/lesson-1-hour.png', type: 'lesson',
}

describe('cartReducer', () => {
  it('adds a new item with quantity 1', () => {
    const s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    expect(s.items).toEqual([{ ...card, quantity: 1 }])
  })

  it('adding an existing item increments quantity', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: card })
    expect(s.items).toEqual([{ ...card, quantity: 2 }])
  })

  it('removes an item by slug', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: lesson })
    s = cartReducer(s, { type: 'remove', slug: card.slug })
    expect(s.items.map((i) => i.slug)).toEqual([lesson.slug])
  })

  it('setQuantity updates quantity', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 5 })
    expect(s.items[0].quantity).toBe(5)
  })

  it('setQuantity to 0 removes the item', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 0 })
    expect(s.items).toEqual([])
  })

  it('setQuantity clamps to 99 and ignores negatives', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 500 })
    expect(s.items[0].quantity).toBe(99)
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: -3 })
    expect(s.items).toEqual([])
  })

  it('clear empties the cart', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'clear' })
    expect(s).toEqual(EMPTY_CART)
  })

  it('does not mutate previous state', () => {
    const s1 = cartReducer(EMPTY_CART, { type: 'add', item: card })
    cartReducer(s1, { type: 'add', item: card })
    expect(s1.items[0].quantity).toBe(1)
  })
})

describe('totals', () => {
  it('cartCount sums quantities', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: card })
    s = cartReducer(s, { type: 'add', item: lesson })
    expect(cartCount(s)).toBe(3)
  })

  it('cartTotalPence sums price * quantity', () => {
    let s = cartReducer(EMPTY_CART, { type: 'add', item: card })
    s = cartReducer(s, { type: 'setQuantity', slug: card.slug, quantity: 2 })
    s = cartReducer(s, { type: 'add', item: lesson })
    expect(cartTotalPence(s)).toBe(2 * 1500 + 12500)
  })
})

describe('formatGbp', () => {
  it('formats pence as pounds', () => {
    expect(formatGbp(1500)).toBe('£15.00')
    expect(formatGbp(12550)).toBe('£125.50')
    expect(formatGbp(0)).toBe('£0.00')
  })
})
