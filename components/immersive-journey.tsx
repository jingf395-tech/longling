'use client'

import { useCallback, useRef } from 'react'
import { range, useSmoothScrollProgress } from '@/hooks/use-smooth-scroll-progress'
import { GateLayers, renderGate } from './scenes/gate-scene'
import { RelicOverlay, RelicPlates, renderRelic } from './scenes/relic-scene'
import { SacredTreeCanvas, SacredTreeLayers, SacredTreeOverlay, renderSacredTree, type SacredTreeHandle } from './scenes/sacred-tree-scene'

/** Fixed chapter boundaries keep the first two chapters' original pacing. */
const GATE_SPAN = 0.25
const RELIC_END = 0.55

/**
 * One sticky stage and one continuous scroll timeline carry the visitor from
 * the city gate, through the stump close-up, and into the sacred-tree vision.
 */
export function ImmersiveJourney() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sacredTreeRef = useRef<SacredTreeHandle>(null)

  const render = useCallback((progress: number) => {
    const stage = stageRef.current
    if (!stage) return
    const gate = range(progress, 0, GATE_SPAN)
    const relic = range(progress, GATE_SPAN, RELIC_END)
    const tree = range(progress, RELIC_END, 1)
    renderGate(stage, gate)
    renderRelic(stage, { entry: gate, p: relic })
    renderSacredTree(stage, tree)
    sacredTreeRef.current?.render(tree)

    const bar = stage.querySelector<HTMLElement>('[data-layer="progress"]')
    if (bar) bar.style.transform = `scaleY(${progress})`
  }, [])

  useSmoothScrollProgress(sectionRef, render)

  return (
    <section ref={sectionRef} aria-label="LONGLIN — 穿过古城门，见证祭祀神树苏醒" className="relative h-[1400vh]">
      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-ink">
        <RelicPlates />
        <SacredTreeLayers />
        <GateLayers />
        <RelicOverlay />
        <SacredTreeCanvas ref={sacredTreeRef} />
        <SacredTreeOverlay />

        <div className="grain pointer-events-none absolute inset-0 z-40" aria-hidden="true" />

        <div className="absolute right-6 top-1/2 z-30 hidden h-32 w-px -translate-y-1/2 bg-bone/15 md:right-12 md:block" aria-hidden="true">
          <div className="h-full w-full origin-top scale-y-0 bg-bone/80" data-layer="progress" />
        </div>
      </div>
    </section>
  )
}
