type TileFrameProps = {
  children: React.ReactNode
  /** Colour of the tile's "side edge" - the layered stripe under the face. */
  edge?: 'berry' | 'jade' | 'indigo' | 'periwinkle'
  /** Slight tabletop tilt, like a tile just placed. */
  tilt?: 'left' | 'right'
  className?: string
}

const EDGE_CLASSES = {
  berry: 'tile-edge-berry',
  jade: 'tile-edge-jade',
  indigo: 'tile-edge-indigo',
  periwinkle: 'tile-edge-periwinkle',
} as const

const TILT_STYLES = {
  left: { transform: 'rotate(-1.5deg)' },
  right: { transform: 'rotate(1.5deg)' },
} as const

// The signature device: content framed as an oversized mahjong tile -
// cream face, navy keyline, and a coloured side edge below, echoing the
// layered acrylic tiles in Andrew's set.
export function TileFrame({ children, edge = 'berry', tilt, className }: TileFrameProps) {
  return (
    <div
      className={`tile-frame ${EDGE_CLASSES[edge]} ${className ?? ''}`}
      style={tilt ? TILT_STYLES[tilt] : undefined}
    >
      <div className="tile-face">{children}</div>
    </div>
  )
}
