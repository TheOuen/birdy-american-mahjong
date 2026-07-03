'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { cartTotalPence, formatGbp } from '@/lib/shop/cart'

export function CartContents() {
  const { cart, dispatch } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items.map((i) => ({ slug: i.slug, quantity: i.quantity })) }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — please try again.')
      setSubmitting(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-xl text-[var(--text-secondary)]">Your cart is empty.</p>
        <Link href="/shop" className="px-6 h-12 inline-flex items-center rounded-md text-lg font-semibold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Browse the Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {cart.items.map((item) => (
          <li key={item.slug} className="py-5 flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-[var(--accent-blush)] shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-[var(--text-primary)]">{item.name}</p>
              <p className="text-base text-[var(--text-secondary)]">{formatGbp(item.price_pence)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <QuantityButton label={`Decrease quantity of ${item.name}`} onClick={() => dispatch({ type: 'setQuantity', slug: item.slug, quantity: item.quantity - 1 })}>−</QuantityButton>
              <span className="w-8 text-center text-lg font-semibold text-[var(--text-primary)]">{item.quantity}</span>
              <QuantityButton label={`Increase quantity of ${item.name}`} onClick={() => dispatch({ type: 'setQuantity', slug: item.slug, quantity: item.quantity + 1 })}>+</QuantityButton>
            </div>
            <button
              onClick={() => dispatch({ type: 'remove', slug: item.slug })}
              className="ml-2 px-3 h-12 rounded-md text-base font-medium text-[var(--error)] hover:bg-[var(--error-light)] active:scale-[0.97] transition-all duration-150"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-[var(--border-strong)] pt-5">
        <p className="text-xl font-bold text-[var(--text-primary)]">Total</p>
        <p className="text-2xl font-bold text-[var(--accent-warm)]">{formatGbp(cartTotalPence(cart))}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-lg">{error}</p>
      )}

      <button
        onClick={handleCheckout}
        disabled={submitting}
        className="h-14 rounded-md text-xl font-bold tracking-wide bg-[var(--brand)] text-[var(--text-inverse)]
          hover:bg-[var(--brand-light)] active:bg-[var(--brand-dark)] active:scale-[0.98]
          disabled:opacity-60 disabled:pointer-events-none transition-all duration-150"
      >
        {submitting ? 'Taking you to secure checkout…' : 'Checkout Securely'}
      </button>
      <p className="text-base text-[var(--text-muted)] text-center">
        Payments are processed securely by Stripe. Lessons: Andrew will email you to schedule.
      </p>
    </div>
  )
}

function QuantityButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-12 h-12 rounded-md border border-[var(--border-strong)] text-xl font-bold text-[var(--text-primary)]
        hover:bg-[var(--bg-card)] active:bg-[var(--border)] active:scale-[0.95] transition-all duration-150"
    >
      {children}
    </button>
  )
}
