export function GateOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between px-6 py-6 md:px-12 md:py-10">
      <header className="flex items-start justify-between" data-layer="ui-top">
        <p className="font-sans text-[10px] tracking-[0.42em] text-bone/80 md:text-[11px]">
          LONGLIN <span className="mx-2 text-bone/40">/</span> 文化遗产沉浸式体验
        </p>
        <p className="hidden font-sans text-[10px] tracking-[0.42em] text-bone/50 md:block md:text-[11px]">
          00 <span className="mx-2">—</span> 入口
        </p>
      </header>

      <div className="flex flex-col items-center text-center" data-layer="ui-title">
        <h1 className="font-serif text-[18vw] font-light leading-[0.85] tracking-[0.08em] text-bone md:text-[11vw] lg:text-[9.5rem]">
          LONGLIN
        </h1>
        <p className="mt-4 font-serif text-xl font-light tracking-[0.4em] text-bone/85 md:mt-6 md:text-3xl">
          古城遗址
        </p>
      </div>

      <footer className="flex flex-col items-center gap-10 md:flex-row md:items-end md:justify-between" data-layer="ui-bottom">
        <p className="max-w-xs text-center font-sans text-[13px] leading-loose tracking-wider text-bone/70 text-pretty md:text-left">
          一段穿越石墙、记忆与时光的旅程。
          <br />
          向下滚动，进入 LONGLIN 的隐秘层次。
        </p>

        <div className="flex flex-col items-center gap-4">
          <span className="font-sans text-[10px] tracking-[0.5em] text-bone/80 md:text-[11px]">滚动进入</span>
          <span className="relative block h-12 w-px overflow-hidden bg-bone/20" aria-hidden="true">
            <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-bone" />
          </span>
        </div>

        <p className="hidden max-w-xs text-right font-sans text-[10px] leading-relaxed tracking-[0.32em] text-bone/45 md:block">
          中国 · 广西
          <br />
          {'北纬 24°46′ — 东经 105°20′'}
        </p>
      </footer>
    </div>
  )
}
