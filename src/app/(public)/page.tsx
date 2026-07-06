import Image from 'next/image'
import Link from 'next/link'
import { getProducts } from '@/lib/shop/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { TileFrame } from '@/components/ui/TileFrame'
import { NewsletterForm } from '@/components/ui/NewsletterForm'

export const revalidate = 300

export default async function HomePage() {
  const products = await getProducts()
  const lessons = products.filter((p) => p.type === 'lesson')

  return (
    <div className="flex flex-col">
      {/* Hero - split: groovy type left, the brand's arch right */}
      <section className="relative overflow-hidden bg-[var(--accent-lavender)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-12 md:gap-10 items-center">
          <div className="flex flex-col items-start text-left">
            <h1 className="display-hero text-[var(--accent-gold)] reveal reveal-1">
              Learn American Mahjong
            </h1>
            <p
              className="mt-3 text-[var(--accent-warm)] reveal reveal-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'var(--display-lg)',
                letterSpacing: '0.04em',
              }}
            >
              with Andrew
            </p>
            <p className="lede mt-6 reveal reveal-3">
              Private lessons across London - the tiles, the Charleston, and the
              official NMJL card, taught at your own table. Between lessons, keep
              playing with Birdy, our free online game.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 reveal reveal-4">
              <Link href="/private-lessons" className="btn-berry text-xl px-8 h-14">
                Book a lesson
              </Link>
              <Link href="/lobby" className="btn-primary text-xl px-8 h-14">
                Play Birdy free
              </Link>
            </div>
            <p className="mt-5 text-base text-[var(--text-muted)] reveal reveal-4">
              Beginner friendly &middot; Andrew brings everything to you &middot; Official 2026 NMJL card
            </p>
          </div>

          {/* The arch, with the brand's word-art and 3D tiles floating beside it */}
          <div className="relative w-full max-w-md mx-auto md:mx-0 reveal reveal-3">
            {/* Word-art stickers, left of the arch - all three suit names */}
            <Image
              src="/aml/tiles-1.png"
              alt=""
              width={182}
              height={119}
              className="sticker sticker-bob hidden lg:block -left-24 top-10 w-28 -rotate-6"
            />
            <Image
              src="/aml/tiles-4.png"
              alt=""
              width={159}
              height={124}
              className="sticker sticker-bob-late hidden lg:block -left-28 top-1/2 -mt-10 w-24 rotate-3"
            />
            <Image
              src="/aml/tiles-5.png"
              alt=""
              width={194}
              height={118}
              className="sticker sticker-bob hidden lg:block -left-20 bottom-16 w-24 -rotate-3"
            />
            {/* Tiles from our commissioned set, right of the arch */}
            <Image
              src="/tiles/stacks/bam-1.png"
              alt=""
              width={240}
              height={305}
              className="sticker sticker-bob hidden lg:block -right-14 top-16 w-20 rotate-12"
            />
            <Image
              src="/tiles/stacks/flower-3.png"
              alt=""
              width={240}
              height={305}
              className="sticker sticker-bob-late hidden lg:block -right-16 bottom-10 w-20 -rotate-6"
            />
            <div className="arch-ring">
              <div className="arch-ring-inner">
                <div className="arch relative aspect-[4/5]">
                  <Image
                    src="/aml/hero.jpeg"
                    alt="Andrew at his mahjong table in London, arranging tiles on a blue gingham mat"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 448px"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gingham-strip" aria-hidden="true" />

      {/* Three ways in */}
      <Section tone="paper">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DoorCard
            tile="crak"
            title="Learn at your table"
            copy="Andrew comes to you with tiles, racks and cards, and teaches at your pace. You keep a complete written guide."
            href="/private-lessons"
            linkLabel="See private lessons"
          />
          <DoorCard
            tile="bird"
            title="Play Birdy, free"
            copy="Our online game plays real NMJL rules - Charleston, jokers and all. Practise any evening, with friends or friendly bots."
            href="/lobby"
            linkLabel="Play online now"
          />
          <DoorCard
            tile="dot"
            title="Get the equipment"
            copy="The official 2026 NMJL card in large print, scorecard notepads, and free printable scorecards."
            href="/shop"
            linkLabel="Visit the shop"
          />
        </div>
      </Section>

      {/* Lessons */}
      <Section tone="periwinkle" id="lessons">
        <div className="flex flex-col gap-4 mb-10 max-w-2xl">
          <Eyebrow tile="crak">Private lessons</Eyebrow>
          <h2 className="display-xl text-[var(--text-primary)]">
            From first tile to first <em className="display-italic">mahjong!</em>
          </h2>
          <p className="lede">
            One to one or with friends - every session ends with you playing
            real hands. After booking, Andrew emails you to arrange a time that
            suits you.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {lessons.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      {/* Meet Andrew */}
      <Section tone="paper">
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-16 items-center">
          <TileFrame edge="jade" tilt="left" className="max-w-md mx-auto w-full md:mx-0">
            <div className="relative aspect-[4/5]">
              <Image
                src="/aml/andrew.jpeg"
                alt="Andrew, founder of American Mahjong London, in a London park"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </TileFrame>
          <div className="flex flex-col gap-5">
            <Eyebrow tile="flower">Meet your teacher</Eyebrow>
            <h2 className="display-xl text-[var(--text-primary)]">
              Taught by Andrew, hooked in the States, at home in London.
            </h2>
            <p className="lede">
              Andrew discovered American Mahjong while travelling across the
              United States and fell for it completely. He founded American
              Mahjong | London to share the game he loves - patiently, properly,
              and always over a good pot of tea.
            </p>
            <Link href="/about" className="link-arrow">
              More about Andrew and the game <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </Section>

      {/* Birdy band */}
      <Section tone="navy">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-end gap-3" aria-hidden="true">
            <Image
              src="/tiles/stacks/dragon-green.png"
              alt=""
              width={240}
              height={305}
              className="h-16 w-auto -rotate-6"
            />
            <Image
              src="/tiles/stacks/bam-1.png"
              alt=""
              width={240}
              height={305}
              className="h-20 w-auto"
            />
            <Image
              src="/tiles/stacks/dragon-red.png"
              alt=""
              width={240}
              height={305}
              className="h-16 w-auto rotate-6"
            />
          </div>
          <h2 className="display-xl max-w-2xl">
            Play tonight - free, with <em className="display-italic" style={{ color: 'var(--accent-periwinkle)' }}>Birdy</em>
          </h2>
          <p className="text-xl leading-relaxed text-[var(--accent-lavender)] max-w-xl" style={{ textWrap: 'pretty' }}>
            Birdy is our online American Mahjong game. Real NMJL rules, the
            Charleston, jokers and all - with friends or against friendly bots,
            any time.
          </p>
          <Link href="/lobby" className="btn-gold text-xl px-8 h-14">
            Play Birdy online
          </Link>
        </div>
      </Section>

      {/* New to the game */}
      <Section tone="paper" size="compact">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <Eyebrow tile="wind">New to mahjong?</Eyebrow>
            <h2 className="display-lg text-[var(--text-primary)]">
              152 tiles, one card, endless good evenings.
            </h2>
            <p className="lede">
              American Mahjong grew from the Shanghai game into its own - with
              jokers, the Charleston, and a card of winning hands published every
              April by the National Mah Jongg League, founded in 1937. Our
              visual guide covers everything you need to sit down and play.
            </p>
            <Link href="/how-to-play" className="link-arrow">
              Read how to play <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {/* Our commissioned tile set - one of each family */}
          <div className="flex flex-wrap justify-center gap-3" aria-hidden="true">
            <Image src="/tiles/stacks/dot-1.png" alt="" width={240} height={305} className="h-24 w-auto -rotate-3" />
            <Image src="/tiles/stacks/bam-5.png" alt="" width={240} height={305} className="h-24 w-auto rotate-2" />
            <Image src="/tiles/stacks/crak-3.png" alt="" width={240} height={305} className="h-24 w-auto -rotate-2" />
            <Image src="/tiles/stacks/wind-east.png" alt="" width={240} height={305} className="h-24 w-auto rotate-3" />
            <Image src="/tiles/stacks/flower-2.png" alt="" width={240} height={305} className="h-24 w-auto -rotate-1" />
          </div>
        </div>
      </Section>

      {/* Newsletter */}
      <Section tone="blush" size="compact">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 text-center items-center">
          <h2 className="display-lg text-[var(--text-primary)]">Stay at the table</h2>
          <p className="lede">
            Events, new products and mahjong news from London - a short email,
            now and then. No spam.
          </p>
          <div className="w-full max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </Section>
    </div>
  )
}

function DoorCard({
  tile,
  title,
  copy,
  href,
  linkLabel,
}: {
  tile: 'dot' | 'bam' | 'crak' | 'wind' | 'flower' | 'bird'
  title: string
  copy: string
  href: string
  linkLabel: string
}) {
  // Real tiles from our commissioned set, one per card family.
  const tileArt: Record<typeof tile, string> = {
    dot: 'dot-1',
    bam: 'bam-5',
    crak: 'crak-3',
    wind: 'wind-east',
    flower: 'flower-2',
    bird: 'bam-1',
  }
  return (
    <Link
      href={href}
      className="group card tile-lift p-7 flex flex-col gap-4 rounded-[var(--radius-tile)]"
    >
      <Image
        src={`/tiles/stacks/${tileArt[tile]}.png`}
        alt=""
        width={240}
        height={305}
        className="h-20 w-auto self-start transition-transform group-hover:-rotate-3"
      />
      <h2 className="display-md text-[var(--text-primary)]">{title}</h2>
      <p className="text-base leading-relaxed text-[var(--text-secondary)] flex-1">{copy}</p>
      <span className="link-arrow text-base">
        {linkLabel} <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  )
}
