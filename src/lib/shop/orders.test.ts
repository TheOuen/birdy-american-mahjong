import { describe, it, expect } from 'vitest'
import { orderRowFromSession } from './orders'

const base = {
  id: 'cs_test_123',
  amount_total: 4000,
  customer_details: { email: 'buyer@example.com', name: 'Buyer Person' },
  metadata: { items: JSON.stringify([{ slug: 'nmjl-card-2026', quantity: 2 }]), user_id: '' },
}

describe('orderRowFromSession', () => {
  it('maps a completed session to an order row', () => {
    const row = orderRowFromSession({
      ...base,
      collected_information: { shipping_details: { address: { line1: '1 Test St', country: 'GB' }, name: 'Buyer Person' } },
    })
    expect(row).toEqual({
      stripe_session_id: 'cs_test_123',
      customer_email: 'buyer@example.com',
      customer_name: 'Buyer Person',
      shipping_address: { line1: '1 Test St', country: 'GB' },
      items: [{ slug: 'nmjl-card-2026', quantity: 2 }],
      total_pence: 4000,
      user_id: null,
    })
  })

  it('handles missing shipping (lesson-only orders)', () => {
    const row = orderRowFromSession(base)
    expect(row.shipping_address).toBeNull()
  })

  it('records user_id when present in metadata', () => {
    const row = orderRowFromSession({ ...base, metadata: { ...base.metadata, user_id: 'uuid-1' } })
    expect(row.user_id).toBe('uuid-1')
  })

  it('throws when email is missing', () => {
    expect(() => orderRowFromSession({ ...base, customer_details: null })).toThrow()
  })

  it('throws when items metadata is missing', () => {
    expect(() => orderRowFromSession({ ...base, metadata: null })).toThrow()
  })
})
