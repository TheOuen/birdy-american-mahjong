import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { TileMotif } from '@/components/ui/TileMotif'

export const metadata = { title: 'London local' }

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
    <div className="flex flex-col">
      <Section tone="paper" size="compact">
        <div className="flex flex-col gap-5 max-w-2xl">
          <Eyebrow tile="wind">London local</Eyebrow>
          <h1 className="display-hero text-[var(--text-primary)]">
            Mahjong is better <em className="display-italic">together.</em>
          </h1>
          <p className="lede">
            These London clubs and communities are well worth a visit -
            different styles, same joy.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLUBS.map((club) => (
            <a
              key={club.href}
              href={club.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card tile-lift flex flex-col gap-2 rounded-[var(--radius-tile)] p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
                {club.area}
              </p>
              <h2 className="display-md text-[var(--text-primary)]">{club.name}</h2>
              <p className="text-base leading-relaxed text-[var(--text-secondary)] flex-1">{club.blurb}</p>
              <span className="link-arrow text-base">
                Visit their site <span aria-hidden="true">&rarr;</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-14 flex items-center gap-4 rounded-[var(--radius-tile)] bg-[var(--accent-lavender)] p-6 sm:p-8">
          <TileMotif variant="flower" edge="periwinkle" className="h-12 w-auto shrink-0" />
          <p className="text-lg text-[var(--text-secondary)]">
            Run a mahjong night in London we should know about?{' '}
            <a
              href="mailto:hello@americanmahjonglondon.com"
              className="font-semibold text-[var(--accent-gold)] underline underline-offset-2 hover:text-[var(--accent-gold-dark)]"
            >
              Tell us about it
            </a>
            .
          </p>
        </div>
      </Section>
    </div>
  )
}
