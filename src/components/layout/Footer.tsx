import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[var(--bg-deep)] text-[var(--text-inverse)]">
      {/* Gold separator */}
      <div className="gold-line" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Image
              src="/logo.png"
              alt="Birdy American Mahjong"
              width={180}
              height={45}
              className="brightness-200 opacity-90"
            />
            <p className="text-[#A09888] text-base leading-relaxed">
              Play American Mahjong online with friends. Free forever — no ads, no subscriptions.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--accent-gold)] font-semibold text-sm uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-body)' }}>
              Navigation
            </h4>
            <Link href="/lobby" className="text-[#A09888] hover:text-[var(--text-inverse)] transition-colors">
              Play Now
            </Link>
            <Link href="/how-to-play" className="text-[#A09888] hover:text-[var(--text-inverse)] transition-colors">
              How to Play
            </Link>
            <Link href="/about" className="text-[#A09888] hover:text-[var(--text-inverse)] transition-colors">
              About
            </Link>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--accent-gold)] font-semibold text-sm uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-body)' }}>
              Account
            </h4>
            <Link href="/login" className="text-[#A09888] hover:text-[var(--text-inverse)] transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="text-[#A09888] hover:text-[var(--text-inverse)] transition-colors">
              Create Account
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#3D3930] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#706858] text-sm">
            &copy; {new Date().getFullYear()} Birdy American Mahjong. All rights reserved.
          </p>
          <p className="text-[#706858] text-sm">
            Official NMJL 2025 Card Supported
          </p>
        </div>
      </div>
    </footer>
  )
}
