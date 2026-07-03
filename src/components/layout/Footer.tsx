import Link from 'next/link'
import { AmlLogo } from './AmlLogo'

export function Footer() {
  return (
    <footer className="bg-[var(--bg-deep)] text-[var(--text-inverse)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          <div className="flex flex-col gap-4">
            <AmlLogo inverse />
            <p className="text-[var(--accent-lavender)] text-base leading-relaxed">
              Learn it once, love it forever! Lessons, equipment and free online play —
              American Mahjong in London, with Andrew.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--accent-periwinkle)] font-semibold text-sm uppercase tracking-widest mb-1">
              Explore
            </h4>
            <FooterLink href="/lobby">Play Birdy Online</FooterLink>
            <FooterLink href="/private-lessons">Private Lessons</FooterLink>
            <FooterLink href="/shop">Shop</FooterLink>
            <FooterLink href="/how-to-play">How to Play</FooterLink>
            <FooterLink href="/discover">Discover</FooterLink>
            <FooterLink href="/london-local">London Local</FooterLink>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--accent-periwinkle)] font-semibold text-sm uppercase tracking-widest mb-1">
              Get in Touch
            </h4>
            <a href="mailto:hello@americanmahjonglondon.com" className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors">
              hello@americanmahjonglondon.com
            </a>
            <a href="tel:+447386398249" className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors">
              +44 738 639 8249
            </a>
            <FooterLink href="/get-in-touch">Contact &amp; Newsletter</FooterLink>
            <FooterLink href="/login">Sign In</FooterLink>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--brand-light)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[var(--accent-lavender)] text-sm">
            &copy; {new Date().getFullYear()} American Mahjong | London. All rights reserved.
          </p>
          <p className="text-[var(--accent-lavender)] text-sm">
            Online play powered by Birdy &middot; Official NMJL Card Supported
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors">
      {children}
    </Link>
  )
}
