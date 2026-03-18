"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function LobbyPage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--bg-card)]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, var(--accent-gold) 0%, transparent 70%)' }} />

          <div className="relative max-w-4xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col items-center gap-5 sm:gap-6 text-center animate-in">
            <div className="gold-line w-24" />
            <h1
              className="text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
            >
              Game Lobby
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-md">
              Choose how you&apos;d like to play today.
            </p>
          </div>
        </section>

        {/* Game options */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            {/* Quick Match */}
            <button
              onClick={() => router.push("/play/demo")}
              className="card p-8 text-left hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
              style={{ borderColor: 'var(--brand)' }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-lg bg-[var(--brand)] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-2xl">🀄</span>
                </div>
                <h3
                  className="text-2xl text-[var(--brand)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Quick Match
                </h3>
                <p className="text-[var(--text-secondary)] text-lg">
                  Jump right in and play against three friendly bots. Perfect for practice or a quick game.
                </p>
                <span className="text-[var(--brand)] font-semibold text-lg group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                  Start Playing →
                </span>
              </div>
            </button>

            {/* Private Room */}
            <div className="card p-8 text-left opacity-60" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3
                  className="text-2xl text-[var(--text-muted)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Private Room
                </h3>
                <p className="text-[var(--text-muted)] text-lg">
                  Create a room and invite friends with a code. Up to 4 players.
                </p>
                <span className="text-[var(--text-muted)] font-semibold text-base uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Public Queue */}
            <div className="card p-8 text-left opacity-60" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3
                  className="text-2xl text-[var(--text-muted)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Public Matchmaking
                </h3>
                <p className="text-[var(--text-muted)] text-lg">
                  Join the queue and get matched with other players automatically.
                </p>
                <span className="text-[var(--text-muted)] font-semibold text-base uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Tournament */}
            <div className="card p-8 text-left opacity-60" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3
                  className="text-2xl text-[var(--text-muted)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Tournaments
                </h3>
                <p className="text-[var(--text-muted)] text-lg">
                  Compete in organized tournaments with rankings and prizes.
                </p>
                <span className="text-[var(--text-muted)] font-semibold text-base uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
