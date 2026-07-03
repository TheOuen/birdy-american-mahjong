export const metadata = { title: 'London Local — American Mahjong | London' }

type Club = { name: string; area: string; blurb: string; href: string }

const CLUBS: Club[] = [
  {
    name: 'Sik Wu',
    area: 'Kentish Town',
    blurb: 'Mahjong events and social play in a friendly setting.',
    href: 'https://sikfaan.com/mahjong-events/',
  },
  {
    name: 'Dear Asia London',
    area: 'Aldgate',
    blurb: 'A social mahjong club with classes, events, and a great community.',
    href: 'https://mahjong.dearasia.co.uk/london-mahjong-social-club/',
  },
  {
    name: '4 Winds Mahjong Club',
    area: 'Dalston & Camden',
    blurb: 'Regular meetups for mahjong players of all levels.',
    href: 'https://www.fourwindsmahjong.club/',
  },
]

export default function LondonLocalPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          London Local
        </h1>
        <p className="text-xl text-[var(--text-secondary)]">
          Mahjong is better together. These London clubs and communities are well worth a visit —
          different styles, same joy.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLUBS.map((club) => (
          <a
            key={club.href}
            href={club.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-6
              hover:border-[var(--border-strong)] active:scale-[0.99] transition-all duration-150"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent-warm)]">{club.area}</p>
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{club.name}</h2>
            <p className="text-lg text-[var(--text-secondary)]">{club.blurb}</p>
            <span className="text-lg font-semibold text-[var(--accent-gold)]">Visit &rarr;</span>
          </a>
        ))}
      </div>
    </div>
  )
}
