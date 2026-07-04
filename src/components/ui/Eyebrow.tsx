import { TileMotif } from './TileMotif'

type EyebrowProps = {
  children: React.ReactNode
  tile?: 'dot' | 'bam' | 'crak' | 'wind' | 'flower' | 'bird'
  className?: string
}

// Section label: a small brand tile beside a tracked small-caps word.
// The tile variant loosely codes the topic - dot for the brand/lessons,
// bam for growth/community, bird for Birdy, flower for warmth.
export function Eyebrow({ children, tile = 'dot', className }: EyebrowProps) {
  return (
    <p className={`eyebrow ${className ?? ''}`}>
      <TileMotif variant={tile} className="h-7 w-auto shrink-0" />
      <span>{children}</span>
    </p>
  )
}
