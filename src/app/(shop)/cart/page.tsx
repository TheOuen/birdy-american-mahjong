import { CartContents } from '@/components/shop/CartContents'
import { Eyebrow } from '@/components/ui/Eyebrow'

export const metadata = { title: 'Cart' }

export default function CartPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Eyebrow tile="dot">Your order</Eyebrow>
        <h1 className="display-hero text-[var(--text-primary)]">Your cart</h1>
      </div>
      <CartContents />
    </div>
  )
}
