import type { Product } from './types'

export class CheckoutError extends Error {}

export type CheckoutRequestItem = { slug: string; quantity: number }

export type LineItem = {
  price_data: {
    currency: 'gbp'
    unit_amount: number
    product_data: { name: string; images: string[] }
  }
  quantity: number
}

export function parseCheckoutRequest(body: unknown): CheckoutRequestItem[] | null {
  if (typeof body !== 'object' || body === null) return null
  const items = (body as Record<string, unknown>).items
  if (!Array.isArray(items)) return null
  const parsed: CheckoutRequestItem[] = []
  for (const raw of items) {
    if (typeof raw !== 'object' || raw === null) return null
    const { slug, quantity } = raw as Record<string, unknown>
    if (typeof slug !== 'string' || typeof quantity !== 'number') return null
    parsed.push({ slug, quantity })
  }
  return parsed
}

export function buildLineItems(
  items: CheckoutRequestItem[],
  products: Product[],
  siteUrl: string
): LineItem[] {
  if (items.length === 0) throw new CheckoutError('Your cart is empty.')
  return items.map((item) => {
    const product = products.find((p) => p.slug === item.slug)
    if (!product) throw new CheckoutError('An item in your cart is no longer available.')
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new CheckoutError('Invalid quantity.')
    }
    return {
      price_data: {
        currency: 'gbp' as const,
        unit_amount: product.price_pence,
        product_data: { name: product.name, images: [`${siteUrl}${product.image}`] },
      },
      quantity: item.quantity,
    }
  })
}

export function hasPhysicalItems(items: CheckoutRequestItem[], products: Product[]): boolean {
  return items.some((item) => products.find((p) => p.slug === item.slug)?.type === 'physical')
}
