import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProducts } from '@/lib/shop/products'
import { buildLineItems, hasPhysicalItems, parseCheckoutRequest, CheckoutError } from '@/lib/shop/checkout'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const items = parseCheckoutRequest(body)
  if (!items) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const products = await getProducts()
    const lineItems = buildLineItems(items, products, siteUrl)
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success`,
      cancel_url: `${siteUrl}/cart`,
      metadata: { items: JSON.stringify(items) },
      ...(hasPhysicalItems(items, products)
        ? { shipping_address_collection: { allowed_countries: ['GB'] } }
        : {}),
    })
    if (!session.url) throw new Error('Stripe session has no URL')
    return NextResponse.json({ url: session.url })
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('checkout failed', e)
    return NextResponse.json({ error: 'Checkout failed - please try again.' }, { status: 500 })
  }
}
