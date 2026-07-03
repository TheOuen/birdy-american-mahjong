'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { cartTotalPence, formatGbp } from '@/lib/shop/cart'
import { TileMotif } from '@/components/ui/TileMotif'

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
      <div className="card rounded-[var(--radius-tile)] flex flex-col items-center gap-6 py-16 px-6 text-center">
        <div className="flex gap-2 opacity-70" aria-hidden="true">
          <TileMotif variant="dot" className="h-12 w-auto -rotate-6" />
          <TileMotif variant="bam" className="h-12 w-auto rotate-6" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="display-md text-[var(--text-primary)]">Your cart is empty</p>
          <p className="text-lg text-[var(--text-secondary)]">
            Lessons, the official NMJL card, and scorecards are waiting.
          </p>
        </div>
        <Link href="/shop" className="btn-primary">
          Browse the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {cart.items.map((item) => (
          <li key={item.slug} className="py-5 flex flex-wrap items-center gap-4">
            {item.type === 'lesson' ? (
              <div className="w-20 h-20 rounded-md bg-[var(--accent-blush)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                <TileMotif variant="dot" className="h-11 w-auto" />
              </div>
            ) : (
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="flex-1 min-w-40">
              <p className="text-lg font-semibold text-[var(--text-primary)]">{item.name}</p>
              <p className="text-base text-[var(--text-secondary)]">{formatGbp(item.price_pence)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <QuantityButton
                label={`Decrease quantity of ${item.name}`}
                onClick={() => dispatch({ type: 'setQuantity', slug: item.slug, quantity: item.quantity - 1 })}
              >
                &minus;
              </QuantityButton>
              <span className="w-8 text-center text-lg font-semibold text-[var(--text-primary)]">
                {item.quantity}
              </span>
              <QuantityButton
                label={`Increase quantity of ${item.name}`}
                onClick={() => dispatch({ type: 'setQuantity', slug: item.slug, quantity: item.quantity + 1 })}
              >
                +
              </QuantityButton>
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

      <div className="flex items-center justify-between border-t-2 border-[var(--brand)] pt-5">
        <p className="display-md text-[var(--text-primary)]">Total</p>
        <p className="text-2xl font-bold text-[var(--accent-warm)]">{formatGbp(cartTotalPence(cart))}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-[var(--error-light)] text-[var(--error)] px-4 py-3 text-lg">
          {error}
        </p>
      )}

      <button onClick={handleCheckout} disabled={submitting} className="btn-berry text-xl h-14 w-full">
        {submitting ? 'Taking you to secure checkout…' : 'Checkout securely'}
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
      className="w-12 h-12 rounded-md border-[1.5px] border-[var(--border-strong)] text-xl font-bold text-[var(--text-primary)]
        hover:bg-[var(--bg-card)] active:bg-[var(--border)] active:scale-[0.95] transition-all duration-150"
    >
      {children}
    </button>
  )
}
