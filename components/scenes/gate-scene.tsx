import Image from 'next/image'
import { easeInCubic, easeInOutCubic, range } from '@/hooks/use-smooth-scroll-progress'
import { GateOverlay } from './gate-overlay'

const GATE_SRC = '/images/gate-photo.jpg'
/** Center of the arch opening inside the gate photo, as % of the image. */
const ARCH = { x: 42.6, y: 64.5 }
/** Native aspect ratio of the gate photo; the stage keeps it so ARCH stays exact. */
const ASPECT = 774 / 512

const layer = (stage: HTMLElement, name: string) => stage.querySelector<HTMLElement>(`[data-layer="${name}"]`)

/**
 * Scene I — the camera approaches the gate and passes through the arch.
 * `p` runs 0 → 1 across the gate portion of the journey.
 */
export function renderGate(stage: HTMLElement, p: number) {
  const approach = easeInCubic(range(p, 0, 0.88))
  const zoom = 1 + approach * 7.5

  const gate = layer(stage, 'gate')
  if (gate) {
    // The opening dissolves into the chamber beyond: first fading in place, then widening past the stone.
    const dissolve = range(p, 0.32, 0.56)
    const reveal = easeInOutCubic(range(p, 0.4, 0.86))
    const rx = 7.5 + reveal * 55
    const mask = `radial-gradient(ellipse ${rx}% ${rx * 2.05}% at ${ARCH.x}% ${ARCH.y}%, rgba(0,0,0,${1 - dissolve}) 50%, #000 100%)`
    gate.style.transform = `scale(${zoom})`
    gate.style.opacity = String(1 - range(p, 0.8, 0.94))
    gate.style.maskImage = mask
    gate.style.webkitMaskImage = mask
    gate.style.filter = `blur(${range(p, 0.55, 0.9) * 6}px)`
  }

  const foreground = layer(stage, 'foreground')
  if (foreground) {
    foreground.style.transform = `scale(${1 + easeInCubic(range(p, 0, 0.6)) * 9})`
    foreground.style.filter = `blur(${2 + range(p, 0, 0.4) * 14}px)`
    foreground.style.opacity = String(0.85 * (1 - range(p, 0.25, 0.55)))
  }

  const glow = layer(stage, 'glow')
  if (glow) {
    const rise = range(p, 0.35, 0.78)
    const fall = range(p, 0.82, 1)
    glow.style.opacity = String(Math.sin(rise * Math.PI * 0.5) * 0.6 * (1 - fall))
    glow.style.transform = `scale(${0.6 + rise * 2.2})`
  }

  const fog = layer(stage, 'fog')
  if (fog) fog.style.opacity = String(0.35 + Math.sin(range(p, 0.15, 0.95) * Math.PI) * 0.55)

  const vignette = layer(stage, 'vignette')
  if (vignette) vignette.style.opacity = String(1 - range(p, 0.85, 1) * 0.35)

  const fadeOut = range(p, 0, 0.22)
  const top = layer(stage, 'ui-top')
  const title = layer(stage, 'ui-title')
  const bottom = layer(stage, 'ui-bottom')
  if (top) top.style.opacity = String(1 - fadeOut)
  if (bottom) {
    bottom.style.opacity = String(1 - range(p, 0, 0.12))
    bottom.style.transform = `translateY(${range(p, 0, 0.2) * 40}px)`
  }
  if (title) {
    title.style.opacity = String(1 - fadeOut)
    title.style.transform = `translateY(${-fadeOut * 60}px) scale(${1 + fadeOut * 0.12})`
    title.style.letterSpacing = `${0.08 + fadeOut * 0.25}em`
    title.style.filter = `blur(${fadeOut * 8}px)`
  }
}

export function GateLayers() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(232,228,218,0.5),transparent_55%)] mix-blend-screen will-change-transform" data-layer="glow" aria-hidden="true" />

      {/* Gate artwork kept at native aspect so the arch anchor is pixel-exact at every viewport */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2" style={{ width: `max(100vw, calc(100svh * ${ASPECT}))`, aspectRatio: `${ASPECT}` }}>
        <div className="animate-breathe absolute inset-0">
          <div className="absolute inset-0 will-change-transform" style={{ transformOrigin: `${ARCH.x}% ${ARCH.y}%` }} data-layer="gate">
            <Image
              src={GATE_SRC}
              alt="LONGLIN 古城遗址中饱经风霜的石砌城门，拱门被茂密的植被吞没，一条残破的石径穿门而过"
              fill
              sizes="(min-aspect-ratio: 16/9) 100vw, 180vh"
              className="object-cover"
              priority
            />
          </div>

          {/* Near-camera vegetation: same plate, edges only, rushing past faster for depth */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transformOrigin: `${ARCH.x}% ${ARCH.y}%`,
              maskImage: `radial-gradient(ellipse 55% 65% at ${ARCH.x}% ${ARCH.y}%, transparent 55%, #000 90%)`,
              WebkitMaskImage: `radial-gradient(ellipse 55% 65% at ${ARCH.x}% ${ARCH.y}%, transparent 55%, #000 90%)`,
            }}
            data-layer="foreground"
          >
            <Image src={GATE_SRC} alt="" fill sizes="100vw" className="object-cover brightness-[0.55] saturate-[0.8]" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20" data-layer="fog" aria-hidden="true">
        <div className="fog fog-a" />
        <div className="fog fog-b" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(8,11,10,0.85)_100%)]" data-layer="vignette" aria-hidden="true" />

      <GateOverlay />
    </>
  )
}
