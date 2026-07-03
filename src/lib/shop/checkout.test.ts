import { describe, it, expect } from 'vitest'
import { buildLineItems, hasPhysicalItems, parseCheckoutRequest, CheckoutError } from './checkout'
import type { Product } from './types'

const products: Product[] = [
  { id: '1', slug: 'nmjl-card-2026', name: '2026 Official NMJL Card (Large Print)', description: '', price_pence: 1500, type: 'physical', image: '/aml/nmjl-card-2026.png', active: true },
  { id: '2', slug: 'private-session-1-hour', name: 'Private Session (1 Hour)', description: '', price_pence: 12500, type: 'lesson', image: '/aml/lesson-1-hour.png', active: true },
]
const SITE = 'https://example.com'

describe('buildLineItems', () => {
  it('builds Stripe line items with server-side prices', () => {
    const items = buildLineItems([{ slug: 'nmjl-card-2026', quantity: 2 }], products, SITE)
    expect(items).toEqual([
      {
        price_data: {
          currency: 'gbp',
          unit_amount: 1500,
          product_data: { name: '2026 Official NMJL Card (Large Print)', images: ['https://example.com/aml/nmjl-card-2026.png'] },
        },
        quantity: 2,
      },
    ])
  })

  it('throws on unknown slug', () => {
    expect(() => buildLineItems([{ slug: 'nope', quantity: 1 }], products, SITE)).toThrow(CheckoutError)
  })

  it('throws on empty cart', () => {
    expect(() => buildLineItems([], products, SITE)).toThrow(CheckoutError)
  })

  it('throws on bad quantities', () => {
    expect(() => buildLineItems([{ slug: 'nmjl-card-2026', quantity: 0 }], products, SITE)).toThrow(CheckoutError)
    expect(() => buildLineItems([{ slug: 'nmjl-card-2026', quantity: 1.5 }], products, SITE)).toThrow(CheckoutError)
    expect(() => buildLineItems([{ slug: 'nmjl-card-2026', quantity: 100 }], products, SITE)).toThrow(CheckoutError)
  })
})

describe('hasPhysicalItems', () => {
  it('true when any item is physical', () => {
    expect(hasPhysicalItems([{ slug: 'nmjl-card-2026', quantity: 1 }], products)).toBe(true)
  })
  it('false for lessons only', () => {
    expect(hasPhysicalItems([{ slug: 'private-session-1-hour', quantity: 1 }], products)).toBe(false)
  })
})

describe('parseCheckoutRequest', () => {
  it('parses a valid body', () => {
    expect(parseCheckoutRequest({ items: [{ slug: 'a', quantity: 2 }] })).toEqual([{ slug: 'a', quantity: 2 }])
  })
  it('rejects malformed bodies', () => {
    expect(parseCheckoutRequest(null)).toBeNull()
    expect(parseCheckoutRequest({})).toBeNull()
    expect(parseCheckoutRequest({ items: 'x' })).toBeNull()
    expect(parseCheckoutRequest({ items: [{ slug: 5, quantity: 1 }] })).toBeNull()
  })
})
