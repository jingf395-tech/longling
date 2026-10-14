import Image from 'next/image'
import { easeInOutCubic, easeOutCubic, range } from '@/hooks/use-smooth-scroll-progress'

/**
 * The ring center in the outdoor photograph, percentages of the source frame.
 * Both scroll layers are derived from the same tree image to preserve continuity.
 */
const RING_FOCUS = { x: 69.8, y: 48.3 }
const layer = (stage: HTMLElement, name: string) => stage.querySelector<HTMLElement>(`[data-layer="${name}"]`)

type RelicFrame = {
  /** Progress through the existing gate transition (0–1). */
  entry: number
  /** Progress within chapter II (0–1). */
  p: number
}

/**
 * Chapter II: an outdoor, living relic instead of the previous indoor chamber.
 * This scene stays image-based, just like the original gate: continuous scroll-driven
 * zoom with a photographic ring close-up. No fake 3D claims or broken model imports.
 *
 * In phase III, an actual GLB stump + tree can replace the two outdoor photo layers.
 */
export function renderRelic(stage: HTMLElement, { entry, p }: RelicFrame) {
  const arrival = easeOutCubic(range(entry, 0.35, 1))
  const explore = easeInOutCubic(range(p, 0, 0.74))
  const ringDetail = easeInOutCubic(range(p, 0.62, 0.88))

  const base = layer(stage, 'relic-base')
  if (base) {
    // Subtle settle as the arch leaves the frame, followed by a focused push
    // towards the exposed annual rings, not towards the trunk's dark bark.
    const scale = 1.18 - arrival * 0.18 + explore * 0.70
    base.style.transform = `scale(${scale}) translate3d(${explore * -1.5}%, ${explore * 0.5}%, 0)`
    base.style.filter = `blur(${(1 - range(entry, 0.37, 0.9)) * 3 + ringDetail * 2}px) brightness(${0.97 + arrival * 0.06})`
  }

  // A small independent foreground shift makes the outdoor reveal feel less
  // like one perfectly flat image; no abrupt sky/room cut or sci-fi light beam.
  const foliage = layer(stage, 'relic-foreground')
  if (foliage) {
    foliage.style.transform = `scale(${1.02 + explore * 0.13}) translate3d(${-explore * 1.4}%, ${explore * 1.3}%, 0)`
    foliage.style.opacity = String(0.35 * (1 - ringDetail))
  }

  const haze = layer(stage, 'relic-haze')
  if (haze) haze.style.opacity = String(0.32 + arrival * 0.12 - ringDetail * 0.36)

  const closeup = layer(stage, 'relic-macro')
  if (closeup) {
    closeup.style.opacity = String(ringDetail)
    closeup.style.transform = `scale(${1.035 + easeOutCubic(range(p, 0.62, 1)) * 0.15})`
    closeup.style.filter = `blur(${(1 - ringDetail) * 5}px)`
  }

  const gateFog = layer(stage, 'fog')
  if (gateFog && entry >= 0.999) gateFog.style.opacity = String(0.35 - range(p, 0, 0.32) * 0.25)
  const gateVignette = layer(stage, 'vignette')
  if (gateVignette && entry >= 0.999) gateVignette.style.opacity = String(0.65 - range(p, 0, 0.32) * 0.35)

  const introIn = easeOutCubic(range(p, 0.025, 0.2))
  const introOut = easeInOutCubic(range(p, 0.49, 0.65))

  const shade = layer(stage, 'relic-shade')
  if (shade) shade.style.opacity = String(range(entry, 0.83, 1) * (0.85 - ringDetail * 0.52))

  const header = layer(stage, 'relic-header')
  if (header) header.style.opacity = String(easeOutCubic(range(p, 0.02, 0.12)))

  const intro = layer(stage, 'relic-intro')
  if (intro) {
    intro.style.opacity = String(introIn * (1 - introOut))
    intro.style.transform = `translate3d(0, ${(1 - introIn) * 28 - introOut * 36}px, 0)`
    intro.style.filter = `blur(${(1 - introIn) * 5 + introOut * 5}px)`
  }

  const annotation = layer(stage, 'relic-ring-label')
  if (annotation) {
    const focus = easeOutCubic(range(p, 0.77, 0.95))
    annotation.style.opacity = String(focus)
    annotation.style.transform = `translate3d(0, ${(1 - focus) * 20}px, 0)`
  }

  const coda = layer(stage, 'relic-coda')
  if (coda) {
    const t = easeOutCubic(range(p, 0.85, 0.98))
    coda.style.opacity = String(t)
    coda.style.transform = `translate3d(0, ${(1 - t) * 16}px, 0)`
  }
}

/** The outdoors is visible *through* the existing gate, never in an indoor room. */
export function RelicPlates() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#101712]">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: `${RING_FOCUS.x}% ${RING_FOCUS.y}%` }}
        data-layer="relic-base"
      >
        <Image
          src="/images/relic-outdoor.jpg"
          alt="概念艺术场景：户外遗址林地中的古老木桩，斜俯视角展示完整的木材年轮、风化树皮、苔藓和根系"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </div>

      {/* An ultra-light near-ground plate with its own scroll response. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 will-change-transform"
        data-layer="relic-foreground"
        aria-hidden="true"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 67%, black 97%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 67%, black 97%)',
        }}
      >
        <Image src="/images/relic-outdoor.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
      </div>

      {/* Photographic atmosphere; not a theatrical indoor spotlight. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_68%_22%,rgba(255,235,178,0.13),transparent_48%)] mix-blend-screen"
        data-layer="relic-haze"
        aria-hidden="true"
      />

      {/* The close-up is a crop of the *same* outdoor photo, not unrelated bark art. */}
      <div
        className="absolute inset-0 opacity-0 will-change-transform"
        style={{ transformOrigin: `${RING_FOCUS.x}% ${RING_FOCUS.y}%` }}
        data-layer="relic-macro"
      >
        <Image
          src="/images/relic-rings.jpg"
          alt="同一株古木的近景，干裂的横截面与层层年轮清晰可见"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(6,12,9,0.40),transparent_68%)]" aria-hidden="true" />
      </div>
    </div>
  )
}

export function RelicOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30" data-layer="relic-overlay-root">
      <div
        className="absolute inset-0 opacity-0 bg-[linear-gradient(90deg,rgba(5,10,8,0.88)_0%,rgba(5,10,8,0.76)_29%,rgba(5,10,8,0.34)_51%,transparent_75%)] max-md:bg-[linear-gradient(0deg,rgba(5,10,8,0.85)_0%,rgba(5,10,8,0.3)_48%,transparent_85%)]"
        data-layer="relic-shade"
        aria-hidden="true"
      />

      <header className="absolute inset-x-0 top-0 flex items-start justify-between px-6 py-6 opacity-0 md:px-12 md:py-10" data-layer="relic-header">
        <p className="font-sans text-[10px] tracking-[0.32em] text-bone/85 md:text-[11px]">
          LONGLIN <span className="mx-2 text-bone/50">/</span> HERITAGE IMMERSIVE EXPERIENCE
        </p>
        <p className="hidden font-sans text-[10px] tracking-[0.35em] text-bone/75 md:block md:text-[11px]">
          02 <span className="mx-2">—</span> THE ROOTS OF MEMORY
        </p>
      </header>

      <div
        className="absolute bottom-24 left-6 right-6 flex max-w-[32rem] flex-col opacity-0 md:bottom-auto md:left-[7vw] md:right-auto md:top-1/2 md:-translate-y-1/2"
        data-layer="relic-intro"
      >
        <p className="flex items-center gap-4 font-sans text-[10px] tracking-[0.36em] text-[#e4d7b3] md:text-[11px]">
          <span className="block h-px w-9 bg-[#e4d7b3]/80" aria-hidden="true" />
          CHAPTER II / THE RELIC
        </p>
        <h2 className="mt-6 font-serif text-[clamp(3.7rem,7vw,7.4rem)] font-light leading-[0.84] tracking-[-0.045em] text-bone md:mt-9">
          The Memory<br />of Wood
        </h2>
        <p className="mt-5 font-serif text-2xl italic tracking-wide text-bone/85 md:mt-7 md:text-3xl">年轮之间</p>
        <span className="mt-7 block h-px w-16 bg-[#ccb991]/70 md:mt-10" aria-hidden="true" />
        <p className="mt-6 max-w-xs font-sans text-sm leading-[2] tracking-wide text-bone/80 md:mt-8 md:text-[15px]">
          时间在木纹中留下痕迹。<br />穿过石门，在遗址的林间，遇见一段沉睡的记忆。
        </p>
        <p className="mt-5 font-serif text-lg italic leading-relaxed text-bone/80 md:text-xl">
          Every ring holds a trace of time.
        </p>
      </div>

      <div className="absolute bottom-24 right-[6vw] opacity-0 md:bottom-[16vh]" data-layer="relic-ring-label">
        <div className="flex items-center gap-3 font-sans text-[10px] tracking-[0.35em] text-bone/90 md:text-[11px]">
          <span className="h-px w-12 bg-bone/75" aria-hidden="true" />
          ANNUAL RINGS <span className="font-serif text-lg italic normal-case tracking-normal">/ 岁月的纹理</span>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-gradient-to-t from-[#07100b]/90 via-[#07100b]/45 to-transparent px-6 pb-9 pt-24 opacity-0 md:flex-row md:items-end md:justify-between md:px-12 md:pb-11"
        data-layer="relic-coda"
      >
        <div className="flex items-center gap-5">
          <span className="font-sans text-[10px] tracking-[0.4em] text-bone/60">02 / 03</span>
          <span className="h-px w-10 bg-bone/40" aria-hidden="true" />
          <p className="font-serif text-xl italic text-bone md:text-2xl">A memory waiting to awaken.</p>
        </div>
        <p className="font-sans text-[10px] leading-relaxed tracking-[0.3em] text-bone/60 md:text-right">
          NEXT: THE SACRED TREE<br />继续滚动 · 神木将苏醒
        </p>
      </div>
    </div>
  )
}
