import { ContactForm } from '@/components/ui/ContactForm'
import { NewsletterForm } from '@/components/ui/NewsletterForm'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'

export const metadata = { title: 'Get in touch' }

export default function GetInTouchPage() {
  return (
    <Section tone="paper" size="compact">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        <div className="flex flex-col gap-6">
          <Eyebrow tile="flower">Get in touch</Eyebrow>
          <h1 className="display-hero text-[var(--text-primary)]">
            Say <em className="display-italic">hello.</em>
          </h1>
          <p className="lede">
            Questions about lessons, orders, or the game? Send a message and
            Andrew will get back to you.
          </p>
          <div className="flex flex-col gap-1 text-xl">
            <a
              href="mailto:hello@americanmahjonglondon.com"
              className="link-arrow break-all"
            >
              hello@americanmahjonglondon.com
            </a>
            <a href="tel:+447386398249" className="link-arrow">
              +44 738 639 8249
            </a>
          </div>
          <div className="mt-2 rounded-[var(--radius-tile)] bg-[var(--accent-blush)] p-6 sm:p-8 flex flex-col gap-3">
            <h2 className="display-lg text-[var(--text-primary)]">Join the newsletter</h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Events, new products, and mahjong news - no spam.
            </p>
            <NewsletterForm />
          </div>
        </div>
        <div className="card rounded-[var(--radius-tile)] p-6 sm:p-8 h-fit">
          <ContactForm />
        </div>
      </div>
    </Section>
  )
}
