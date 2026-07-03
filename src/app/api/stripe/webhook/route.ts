import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { orderRowFromSession, type SessionLike } from '@/lib/shop/orders'
import { sendEmail, NOTIFY_EMAIL } from '@/lib/email/send'
import { formatGbp } from '@/lib/shop/cart'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    console.error('Stripe env vars are not set')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const signature = request.headers.get('stripe-signature')
  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature ?? '', webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as unknown as SessionLike

  let row
  try {
    row = orderRowFromSession(session)
  } catch (e) {
    console.error('webhook: bad session payload', e)
    return NextResponse.json({ error: 'Bad session payload' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('orders').insert(row)
  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ received: true }) // retry of an already-recorded order
    }
    console.error('webhook: order insert failed', error)
    return NextResponse.json({ error: 'Order insert failed' }, { status: 500 }) // Stripe will retry
  }

  const itemLines = row.items.map((i) => `- ${i.slug} × ${i.quantity}`).join('\n')
  const shipping = row.shipping_address ? `\nShipping:\n${JSON.stringify(row.shipping_address, null, 2)}` : ''
  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `New order ${formatGbp(row.total_pence)} — ${row.customer_email}`,
      text: `New order from ${row.customer_name ?? row.customer_email} (${row.customer_email})\n\n${itemLines}\n\nTotal: ${formatGbp(row.total_pence)}${shipping}\n\nStripe session: ${row.stripe_session_id}`,
      replyTo: row.customer_email,
    })
    const hasLesson = row.items.some((i) => i.slug.includes('session'))
    if (hasLesson) {
      await sendEmail({
        to: row.customer_email,
        subject: 'Your American Mahjong lesson — next steps',
        text: `Thank you for booking a lesson with American Mahjong | London!\n\nAndrew will email you shortly to arrange a time that suits you.\n\nQuestions in the meantime? Just reply to this email.\n\nLearn it once, love it forever!`,
        replyTo: NOTIFY_EMAIL,
      })
    }
  } catch (e) {
    // Order is safely recorded; a failed notification email must not make Stripe retry.
    console.error('webhook: notification email failed', e)
  }

  return NextResponse.json({ received: true })
}
