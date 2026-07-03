import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { TileFrame } from '@/components/ui/TileFrame'
import { TileMotif } from '@/components/ui/TileMotif'

export const metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Andrew */}
      <Section tone="paper">
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-16 items-center">
          <TileFrame edge="jade" tilt="left" className="max-w-md mx-auto w-full md:mx-0 animate-in">
            <div className="relative aspect-[4/5]">
              <Image
                src="/aml/andrew.jpeg"
                alt="Andrew Robson, founder of American Mahjong London"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
            </div>
          </TileFrame>
          <div className="flex flex-col gap-5">
            <Eyebrow tile="flower">About Andrew</Eyebrow>
            <h1 className="display-hero text-[var(--text-primary)]">
              A game found abroad, <em className="display-italic">shared at home.</em>
            </h1>
            <p className="lede">
              Andrew Robson grew up in South Africa, where he studied PPE, before
              moving to London to study Law. He discovered American Mahjong while
              travelling across the United States — and fell for the game
              completely.
            </p>
            <p className="lede">
              He founded American Mahjong | London to bring that experience to
              others: making the game more accessible in London through lessons,
              equipment, and a growing community of players. Learn it once, love
              it forever!
            </p>
          </div>
        </div>
      </Section>

      <div className="gingham-strip" aria-hidden="true" />

      {/* The game */}
      <Section tone="cream">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-5">
            <Eyebrow tile="wind">About the game</Eyebrow>
            <h2 className="display-xl text-[var(--text-primary)]">
              From 1800s Shanghai to your kitchen table.
            </h2>
            <p className="lede">
              Mahjong began in Shanghai in the 1800s and spread into distinct
              regional styles — Hong Kong, Japanese riichi, and American among
              them. American Mahjong is played with 152 tiles including jokers,
              and a standardised card of winning hands published every April by
              the{' '}
              <a
                href="https://www.nationalmahjonggleague.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-gold)] underline underline-offset-2 hover:text-[var(--accent-gold-dark)]"
              >
                National Mah Jongg League
              </a>
              , founded in 1937.
            </p>
            <Link href="/how-to-play" className="link-arrow">
              How to play <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <TileFrame edge="indigo" tilt="right" className="max-w-md mx-auto w-full">
            <div className="relative aspect-square">
              <Image
                src="/aml/lesson-1-hour.png"
                alt="American Mahjong tiles laid out in suits on a blue gingham mat"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </TileFrame>
        </div>
      </Section>

      {/* Play online */}
      <Section tone="navy">
        <div className="flex flex-col items-center gap-6 text-center">
          <TileMotif variant="bird" edge="jade" className="h-14 w-auto" />
          <h2 className="display-xl max-w-2xl">Play online with Birdy</h2>
          <p className="text-xl leading-relaxed text-[var(--accent-lavender)] max-w-xl" style={{ textWrap: 'pretty' }}>
            Birdy is our free online American Mahjong game — real NMJL rules,
            the Charleston, jokers and all. Play with friends or against
            friendly bots, any time.
          </p>
          <Link href="/lobby" className="btn-gold text-xl px-8 h-14">
            Play Birdy free
          </Link>
        </div>
      </Section>
    </div>
  )
}
