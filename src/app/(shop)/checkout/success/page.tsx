import Link from 'next/link'
import { ClearCartOnMount } from '@/components/shop/ClearCartOnMount'
import { TileMotif } from '@/components/ui/TileMotif'

export const metadata = { title: 'Order confirmed' }

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24 flex flex-col items-center gap-7 text-center">
      <ClearCartOnMount />
      <div className="flex gap-2" aria-hidden="true">
        <TileMotif variant="flower" edge="periwinkle" className="h-14 w-auto -rotate-6" />
        <TileMotif variant="dot" edge="berry" className="h-16 w-auto" />
        <TileMotif variant="bam" edge="jade" className="h-14 w-auto rotate-6" />
      </div>
      <h1 className="display-hero text-[var(--text-primary)]">
        Thank you — <em className="display-italic">order confirmed.</em>
      </h1>
      <p className="lede mx-auto">
        A receipt is on its way to your email. If your order includes a lesson,
        Andrew will email you shortly to arrange a time. Anything else, just{' '}
        <Link
          href="/get-in-touch"
          className="text-[var(--accent-gold)] underline underline-offset-2 hover:text-[var(--accent-gold-dark)]"
        >
          get in touch
        </Link>
        .
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/lobby" className="btn-primary text-xl px-8 h-14">
          Play Birdy while you wait
        </Link>
        <Link href="/shop" className="btn-secondary text-xl px-8 h-14">
          Back to shop
        </Link>
      </div>
    </div>
  )
}
