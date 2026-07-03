import Link from 'next/link'
import { ClearCartOnMount } from '@/components/shop/ClearCartOnMount'

export const metadata = { title: 'Order Confirmed — American Mahjong | London' }

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24 flex flex-col items-center gap-6 text-center">
      <ClearCartOnMount />
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Thank you — order confirmed!
      </h1>
      <p className="text-xl leading-relaxed text-[var(--text-secondary)] max-w-xl">
        A receipt is on its way to your email. If your order includes a lesson, Andrew will
        email you shortly to arrange a time. Anything else, just{' '}
        <Link href="/get-in-touch" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-dark)]">get in touch</Link>.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/lobby" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Play Birdy While You Wait
        </Link>
        <Link href="/shop" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-subtle)] active:scale-[0.97] transition-all duration-150">
          Back to Shop
        </Link>
      </div>
    </div>
  )
}
