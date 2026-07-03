import type { CheckoutRequestItem } from './checkout'

export type SessionLike = {
  id: string
  amount_total: number | null
  customer_details: { email: string | null; name: string | null } | null
  collected_information?: { shipping_details?: { address?: object; name?: string } | null } | null
  metadata: Record<string, string> | null
}

export type OrderRow = {
  stripe_session_id: string
  customer_email: string
  customer_name: string | null
  shipping_address: object | null
  items: CheckoutRequestItem[]
  total_pence: number
  user_id: string | null
}

export function orderRowFromSession(session: SessionLike): OrderRow {
  const email = session.customer_details?.email
  if (!email) throw new Error(`Session ${session.id} has no customer email`)
  const rawItems = session.metadata?.items
  if (!rawItems) throw new Error(`Session ${session.id} has no items metadata`)
  return {
    stripe_session_id: session.id,
    customer_email: email,
    customer_name: session.customer_details?.name ?? null,
    shipping_address: session.collected_information?.shipping_details?.address ?? null,
    items: JSON.parse(rawItems) as CheckoutRequestItem[],
    total_pence: session.amount_total ?? 0,
    user_id: session.metadata?.user_id || null,
  }
}
