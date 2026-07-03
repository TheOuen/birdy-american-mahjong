import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'American Mahjong | London — Learn it once, love it forever'

// Brand palette (hardcoded: this runs in an isolated image runtime, no CSS vars).
const NAVY = '#171D3A'
const CREAM = '#F5F0E8'
const BERRY = '#9E2057'
const BLUSH = '#FCE8F0'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: NAVY,
          padding: '72px 80px',
          color: CREAM,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand mark: mahjong dot tile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 88,
              height: 112,
              borderRadius: 18,
              background: CREAM,
              border: `6px solid ${BLUSH}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: `7px solid ${BERRY}`,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: BERRY }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>
              American Mahjong
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 14, color: '#94ABF9', textTransform: 'uppercase' }}>
              London
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>
            Learn American Mahjong
          </div>
          <div style={{ fontSize: 40, color: '#F598FF', fontWeight: 600 }}>
            with Andrew · in London
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 32, color: BLUSH }}>
          Learn it once, love it forever — lessons, equipment &amp; free online play.
        </div>
      </div>
    ),
    { ...size }
  )
}
