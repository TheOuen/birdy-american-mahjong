import type { Product } from './types'

export class CheckoutError extends Error {}

export type CheckoutRequestItem = { slug: string; quantity: number }

/** An order line as stored on the order row: the client's slug/quantity
 * enriched server-side with the product type, so bookings are classified
 * by the catalogue - never by guessing from the slug. */
export type OrderItem = CheckoutRequestItem & { type?: Product['type'] }

export function withProductTypes(items: CheckoutRequestItem[], products: Product[]): OrderItem[] {
  return items.map((item) => ({
    ...item,
    type: products.find((p) => p.slug === item.slug)?.type,
  }))
}

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
    if (product.stock !== null && item.quantity > product.stock) {
      throw new CheckoutError(
        product.stock === 0
          ? `Sorry, ${product.name} is sold out.`
          : `Sorry, only ${product.stock} of ${product.name} ${product.stock === 1 ? 'is' : 'are'} left - please reduce the quantity in your cart.`
      )
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
