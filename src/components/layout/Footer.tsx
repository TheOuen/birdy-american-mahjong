import Link from 'next/link'
import { AmlLogo } from './AmlLogo'
import { TileMotif } from '@/components/ui/TileMotif'

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="gingham-strip" aria-hidden="true" />
      <div className="bg-[var(--bg-deep)] text-[var(--text-inverse)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col gap-5">
              <AmlLogo inverse />
              <p className="text-[var(--accent-lavender)] text-base leading-relaxed max-w-xs">
                Learn it once, love it forever! Lessons, equipment and free online
                play - American Mahjong in London, with Andrew.
              </p>
              <div className="flex gap-2" aria-hidden="true">
                <TileMotif variant="dot" className="h-9 w-auto" edge="berry" />
                <TileMotif variant="bam" className="h-9 w-auto" edge="jade" />
                <TileMotif variant="crak" className="h-9 w-auto" edge="indigo" />
                <TileMotif variant="flower" className="h-9 w-auto" edge="periwinkle" />
                <TileMotif variant="bird" className="h-9 w-auto" edge="jade" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-[var(--accent-periwinkle)] font-semibold text-sm uppercase tracking-[0.18em] mb-1">
                Explore
              </h4>
              <FooterLink href="/lobby">Play Birdy online</FooterLink>
              <FooterLink href="/private-lessons">Private lessons</FooterLink>
              <FooterLink href="/shop">Shop</FooterLink>
              <FooterLink href="/how-to-play">How to play</FooterLink>
              <FooterLink href="/discover">Discover</FooterLink>
              <FooterLink href="/london-local">London local</FooterLink>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-[var(--accent-periwinkle)] font-semibold text-sm uppercase tracking-[0.18em] mb-1">
                Get in touch
              </h4>
              <a
                href="mailto:hello@americanmahjonglondon.com"
                className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors py-1 text-base break-words"
              >
                hello@americanmahjonglondon.com
              </a>
              <a
                href="tel:+447386398249"
                className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors py-1"
              >
                +44 738 639 8249
              </a>
              <FooterLink href="/get-in-touch">Contact &amp; newsletter</FooterLink>
              <FooterLink href="/login">Sign in</FooterLink>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[var(--brand-light)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[var(--accent-lavender)] text-sm">
              &copy; {new Date().getFullYear()} American Mahjong | London. All rights reserved.
            </p>
            <p className="text-[var(--accent-lavender)] text-sm">
              Online play powered by Birdy &middot; Official NMJL card supported
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[var(--accent-lavender)] hover:text-[var(--text-inverse)] transition-colors py-1"
    >
      {children}
    </Link>
  )
}
