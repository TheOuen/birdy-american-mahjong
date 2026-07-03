import { createServiceClient } from '@/lib/supabase/server'
import { formatGbp } from '@/lib/shop/cart'

export const metadata = { title: 'Orders — Admin' }
export const dynamic = 'force-dynamic'

type OrderListItem = {
  id: string
  created_at: string
  customer_email: string
  customer_name: string | null
  items: { slug: string; quantity: number }[]
  total_pence: number
  status: 'new' | 'fulfilled'
  shipping_address: Record<string, string> | null
}

export default async function AdminOrdersPage() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(`Failed to load orders: ${error.message}`)
  const orders = (data ?? []) as OrderListItem[]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Orders
      </h1>
      {orders.length === 0 ? (
        <p className="text-lg text-[var(--text-secondary)]">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Ship to</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3">{o.customer_name ?? '—'}<br /><span className="text-[var(--text-muted)]">{o.customer_email}</span></td>
                  <td className="px-4 py-3">{o.items.map((i) => `${i.slug} × ${i.quantity}`).join(', ')}</td>
                  <td className="px-4 py-3 font-semibold">{formatGbp(o.total_pence)}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {o.shipping_address ? Object.values(o.shipping_address).filter(Boolean).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-sm text-sm font-semibold ${
                      o.status === 'new'
                        ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                        : 'bg-[var(--success-light)] text-[var(--success)]'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
