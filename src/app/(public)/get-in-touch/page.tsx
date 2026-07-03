import { ContactForm } from '@/components/ui/ContactForm'
import { NewsletterForm } from '@/components/ui/NewsletterForm'

export const metadata = { title: 'Get in Touch — American Mahjong | London' }

export default function GetInTouchPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Get in Touch
        </h1>
        <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
          Questions about lessons, orders, or the game? Send a message and Andrew will get
          back to you.
        </p>
        <div className="flex flex-col gap-2 text-xl">
          <a href="mailto:hello@americanmahjonglondon.com" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            hello@americanmahjonglondon.com
          </a>
          <a href="tel:+447386398249" className="text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            +44 738 639 8249
          </a>
        </div>
        <div className="mt-4 rounded-md bg-[var(--accent-blush)] p-6 flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Join the newsletter
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">Events, new products, and mahjong news — no spam.</p>
          <NewsletterForm />
        </div>
      </div>
      <ContactForm />
    </div>
  )
}
