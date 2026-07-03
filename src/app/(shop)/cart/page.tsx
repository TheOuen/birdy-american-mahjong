import { CartContents } from '@/components/shop/CartContents'

export const metadata = { title: 'Cart — American Mahjong | London' }

export default function CartPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Your Cart
      </h1>
      <CartContents />
    </div>
  )
}
