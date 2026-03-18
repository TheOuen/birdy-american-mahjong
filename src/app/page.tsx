import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero section */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg-card)] to-[var(--bg)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-20 flex flex-col items-center gap-8 text-center animate-in">
          <div className="gold-line w-32" />

          <h1
            className="text-[var(--text-primary)] max-w-2xl leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
          >
            The warm way to play
            <span className="text-[var(--brand)]"> American Mahjong</span> online
          </h1>

          <p className="text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
            Join the table with friends or practice against bots. Free forever, beautifully designed, and made for players of all levels.
          </p>

          <div className="flex gap-4 flex-wrap justify-center mt-4">
            <Link href="/lobby" className="btn-primary text-xl px-10 py-4">
              Play Now
            </Link>
            <Link href="/how-to-play" className="btn-secondary text-xl px-10 py-4">
              Learn the Rules
            </Link>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center">
              <span className="text-3xl">🀄</span>
            </div>
            <h3 className="text-xl text-[var(--brand)]" style={{ fontFamily: 'var(--font-display)' }}>
              Authentic Rules
            </h3>
            <p className="text-[var(--text-secondary)]">
              Full NMJL 2025 card support with Charleston, claiming, joker swaps, and proper scoring.
            </p>
          </div>

          <div className="card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-gold-subtle)] flex items-center justify-center">
              <span className="text-3xl">🤝</span>
            </div>
            <h3 className="text-xl text-[var(--accent-gold-dark)]" style={{ fontFamily: 'var(--font-display)' }}>
              Play Your Way
            </h3>
            <p className="text-[var(--text-secondary)]">
              Quick match against bots, create private rooms, or join the public queue to find new partners.
            </p>
          </div>

          <div className="card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-warm-subtle)] flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="text-xl text-[var(--accent-warm)]" style={{ fontFamily: 'var(--font-display)' }}>
              Designed for You
            </h3>
            <p className="text-[var(--text-secondary)]">
              Large text, clear buttons, and a warm design that makes it easy to focus on the game.
            </p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-[var(--bg-card)] border-y border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-6">
          <h2
            className="text-[var(--brand)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
          >
            Ready to join the table?
          </h2>
          <p className="text-xl text-[var(--text-secondary)]">
            No account needed to try — jump straight into a demo game.
          </p>
          <Link href="/lobby" className="btn-gold text-xl px-10 py-4">
            Start Playing
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
