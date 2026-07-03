import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'

export const metadata = { title: 'Discover' }

type Article = { title: string; source: string; blurb: string; href: string }

const FEATURES: Article[] = [
  {
    title: 'The Benefits of Mahjong',
    source: 'Martha Stewart',
    blurb: 'Why mahjong is having a moment — brain health, healthy aging, and connection.',
    href: 'https://www.marthastewart.com/benefits-of-mahjong-11871810',
  },
  {
    title: 'How to Play American Mahjong: The Complete Guide',
    source: 'Dear Asia London',
    blurb: 'A thorough written walkthrough of the American game, from tiles to winning hands.',
    href: 'https://mahjong.dearasia.co.uk/how-to-play-american-mahjong-complete-guide/',
  },
  {
    title: 'Order Out of Chaos',
    source: 'Smithsonian Magazine',
    blurb: 'The Asian game of mahjong, which creates order out of chaos, is trending in the West.',
    href: 'https://www.smithsonianmag.com/arts-culture/the-asian-game-of-mahjong-which-creates-order-out-of-chaos-is-trending-in-the-west-180986021/',
  },
]

const NEWS: Article[] = [
  {
    title: 'Young people all over the world are clicking with mahjong',
    source: 'The Economist',
    blurb: 'A new generation discovers the game.',
    href: 'https://www.economist.com/culture/2026/03/25/young-people-all-over-the-world-are-clicking-with-mahjong',
  },
  {
    title: 'Mahjong and the new card games',
    source: 'Boston Globe',
    blurb: 'Why tile and card nights are back.',
    href: 'https://www.bostonglobe.com/2026/03/23/lifestyle/mahjong-new-card-games/',
  },
  {
    title: 'Mahjong on the rise',
    source: 'Financial Times',
    blurb: 'The FT on the game’s resurgence.',
    href: 'https://www.ft.com/content/27dae2e7-b07c-4960-ae95-8588de374bee',
  },
  {
    title: 'Mah Jongg in DC',
    source: 'Washington Post',
    blurb: 'How the game is bringing people together.',
    href: 'https://www.washingtonpost.com/dc-md-va/2025/07/24/mah-jongg-dc/',
  },
  {
    title: 'Mahjong’s modern makeover',
    source: 'Vogue',
    blurb: 'The style world embraces the tiles.',
    href: 'https://www.vogue.com/article/mahjong-modern-makeover',
  },
  {
    title: 'Your mahjong game night hosting guide',
    source: 'Martha Stewart',
    blurb: 'Hosting a mahjong night, done properly.',
    href: 'https://www.marthastewart.com/mahjong-game-night-hosting-guide-11859541',
  },
]

export default function DiscoverPage() {
  return (
    <div className="flex flex-col">
      <Section tone="paper" size="compact">
        <div className="flex flex-col gap-5 max-w-2xl">
          <Eyebrow tile="bam">Discover</Eyebrow>
          <h1 className="display-hero text-[var(--text-primary)]">
            Everything <em className="display-italic">mahjong.</em>
          </h1>
          <p className="lede">
            Reading, watching, and rabbit holes — our favourite mahjong
            resources from around the web.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((a) => (
            <ArticleCard key={a.href} article={a} />
          ))}
        </div>
      </Section>

      <Section tone="cream" size="compact">
        <h2 className="display-xl text-[var(--text-primary)] mb-8">Mahj in the news</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {NEWS.map((a) => (
            <ArticleCard key={a.href} article={a} />
          ))}
        </div>
      </Section>
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.href}
      target="_blank"
      rel="noopener noreferrer"
      className="card tile-lift flex flex-col gap-2 rounded-[var(--radius-tile)] p-6"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
        {article.source}
      </p>
      <h3 className="display-md text-[var(--text-primary)]">{article.title}</h3>
      <p className="text-base leading-relaxed text-[var(--text-secondary)] flex-1">{article.blurb}</p>
      <span className="link-arrow text-base">
        Read the piece <span aria-hidden="true">&rarr;</span>
      </span>
    </a>
  )
}
