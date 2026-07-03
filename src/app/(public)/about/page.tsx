import Image from 'next/image'
import Link from 'next/link'

export const metadata = { title: 'About — American Mahjong | London' }

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-16">
      {/* Andrew */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] rounded-md overflow-hidden">
          <Image src="/aml/andrew.jpeg" alt="Andrew Robson, founder of American Mahjong London" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            About Andrew
          </h1>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Andrew Robson grew up in South Africa, where he studied PPE, before moving to
            London to study Law. He discovered American Mahjong while travelling across the
            United States — and fell for the game completely.
          </p>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            He founded American Mahjong | London with the hope of bringing that experience to
            others: making the game more accessible in London through lessons, equipment, and
            a growing community of players. Learn it once, love it forever!
          </p>
        </div>
      </section>

      {/* The game */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            About the Game
          </h2>
          <p className="text-xl leading-relaxed text-[var(--text-secondary)]">
            Mahjong began in Shanghai in the 1800s and spread into distinct regional styles —
            Hong Kong, Japanese riichi, and American among them. American Mahjong is played
            with 152 tiles including jokers, and a standardised card of winning hands published
            every April by the{' '}
            <a href="https://www.nationalmahjonggleague.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-dark)]">
              National Mah Jongg League
            </a>
            , founded in 1937.
          </p>
          <Link href="/how-to-play" className="text-xl font-semibold text-[var(--accent-gold)] hover:text-[var(--accent-gold-dark)] transition-colors">
            How to play &rarr;
          </Link>
        </div>
        <div className="relative aspect-square rounded-md overflow-hidden">
          <Image src="/aml/tiles-2.png" alt="Close-up of American Mahjong tiles" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      </section>

      {/* Play online */}
      <section className="rounded-md bg-[var(--accent-lavender)] p-8 sm:p-12 flex flex-col items-center gap-5 text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Play Online with Birdy
        </h2>
        <p className="text-xl leading-relaxed text-[var(--text-secondary)] max-w-2xl">
          Birdy is our free online American Mahjong game — real NMJL rules, the Charleston,
          jokers and all. Play with friends or against friendly bots, any time.
        </p>
        <Link href="/lobby" className="px-7 h-14 inline-flex items-center rounded-md text-xl font-bold bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-light)] active:scale-[0.97] transition-all duration-150">
          Play Birdy Online — Free
        </Link>
      </section>
    </div>
  )
}
