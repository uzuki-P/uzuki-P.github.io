import { useLayoutEffect, useRef, useState } from "react"

import { Icon } from "@/components/m3e/icon"
import { cn } from "@/lib/utils"
import { TIMELINE, usePosition, type TimedLine } from "./player"

/*
 * Motion from Lyrics Float (src/main/kotlin/dev/lyricsfloat/ui/LyricsViewport.kt):
 * - the stack scrolls the active line to the middle over 700 ms on a decelerating curve, each line
 *   below the focus starting 32 ms later, so a line change ripples down the stack
 * - the active line grows from 0.74x on a slightly underdamped spring
 * - other lines dim by distance (0.3, 0.2, 0.15) and blur from two lines away
 * - a soft-edged gradient wipes each word as it is sung; the word pops up and stays slightly raised
 */

const VIEW_HEIGHT = 196
const LINE_HEIGHT = 82
const INACTIVE_SCALE = 0.74
const STAGGER_MS = 32

const DIM = [1, 0.3, 0.2, 0.15]
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

export function LyricsPill({ onHide, className }: { onHide: () => void; className?: string }) {
  const position = usePosition()
  const active = Math.max(0, TIMELINE.findLastIndex((line) => line.start <= position))

  const heights = TIMELINE.map((_, i) => LINE_HEIGHT * (i === active ? 1 : INACTIVE_SCALE))
  const tops = heights.map((_, i) => heights.slice(0, i).reduce((a, b) => a + b, 0))
  const offset = VIEW_HEIGHT / 2 - (tops[active] + LINE_HEIGHT / 2)

  return (
    <aside
      aria-label="Lyrics"
      className={cn(
        "group relative overflow-hidden rounded-[22px] bg-[#170d14]/90 text-white shadow-[0_18px_50px_rgba(0,0,0,.45)] ring-1 ring-white/10 backdrop-blur-xl",
        className
      )}
      style={{ height: VIEW_HEIGHT }}
    >
      <div
        aria-hidden
        className="lyrics-stack absolute inset-0 [mask-image:linear-gradient(transparent,#000_20%,#000_80%,transparent)]"
      >
        {TIMELINE.map((line, i) => {
          const distance = Math.abs(i - active)
          return (
            <div
              key={i}
              className="absolute inset-x-0 top-0 px-5"
              style={{
                transform: `translateY(${tops[i] + offset}px)`,
                transition: `transform 700ms cubic-bezier(.2,0,0,1) ${Math.max(0, i - active) * STAGGER_MS}ms`,
              }}
            >
              <div
                className="origin-top text-center"
                style={{
                  scale: i === active ? 1 : INACTIVE_SCALE,
                  opacity: DIM[distance] ?? 0.08,
                  filter: distance >= 2 ? `blur(${0.4 + (distance - 2) * 0.5}px)` : "none",
                  transition: "scale 560ms cubic-bezier(.34,1.45,.64,1), opacity 350ms, filter 400ms",
                }}
              >
                <Line line={line} active={i === active} position={position} />
              </div>
            </div>
          )
        })}
      </div>
      <p className="sr-only">
        {TIMELINE.map((l) => l.en).join(" ")}
      </p>
      <button
        type="button"
        onClick={onHide}
        aria-label="Hide lyrics"
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/10 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/20 focus-visible:opacity-100"
      >
        <Icon name="close" size={16} />
      </button>
    </aside>
  )
}

function Line({ line, active, position }: { line: TimedLine; active: boolean; position: number }) {
  return (
    <div className="lyrics-line flex h-[82px] flex-col justify-center whitespace-nowrap">
      <FitRow lang="ja" className="jp text-[22px] leading-tight font-bold tracking-[0.06em]">
        {active
          ? line.chunks.map(([ja], k) => <Word key={k} text={ja} timing={line.words[k]} position={position} />)
          : line.chunks.map(([ja]) => ja).join("")}
      </FitRow>
      <FitRow className={cn("mt-0.5 text-[15px] leading-snug font-medium", !active && "text-white/75")}>
        {active
          ? line.chunks.map(([, romaji], k) => (
              <span key={k}>
                {k > 0 && " "}
                <Word text={romaji} timing={line.words[k]} position={position} romaji />
              </span>
            ))
          : line.chunks.map(([, romaji]) => romaji).join(" ")}
      </FitRow>
      <FitRow className={cn("text-[12.5px] leading-snug", active ? "text-[#F48FB1]/75" : "text-white/65")}>{line.en}</FitRow>
    </div>
  )
}

/** A single-line row that shrinks to fit the pill instead of being cut off at its edges. */
function FitRow({ className, lang, children }: { className?: string; lang?: string; children: React.ReactNode }) {
  const row = useRef<HTMLParagraphElement>(null)
  const [fit, setFit] = useState(1)
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    // scrollWidth is the unscaled text width, so transforms on this row or its parents don't skew it.
    // A 2px margin absorbs rounding.
    const measure = () => setFit(Math.min(1, (el.clientWidth - 2) / el.scrollWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // web fonts and the system Japanese font can arrive after the first measure and widen the text
    document.fonts.ready.then(measure)
    document.fonts.addEventListener("loadingdone", measure)
    return () => {
      observer.disconnect()
      document.fonts.removeEventListener("loadingdone", measure)
    }
  }, [])
  // Overflowing centered text spills off the right edge only, so shrink it from the left edge
  // to land exactly inside the row.
  return (
    <p ref={row} lang={lang} className={className} style={{ scale: fit, transformOrigin: fit < 1 ? "left center" : undefined }}>
      {children}
    </p>
  )
}

/** One karaoke word: a soft gradient edge wipes it left to right, then it pops and stays raised. */
function Word({
  text,
  timing,
  position,
  romaji,
}: {
  text: string
  timing: { start: number; end: number }
  position: number
  /** the romaji row wipes in step with its Japanese word, from a softer unsung color */
  romaji?: boolean
}) {
  const since = (position - timing.start) / 1000
  const progress = clamp01((position - timing.start) / (timing.end - timing.start))
  const pop = since < 0 ? 0 : since < 0.12 ? since / 0.12 : since < 0.7 ? 1 - (since - 0.12) / 0.58 : 0
  const rise = since <= 0 ? 0 : easeOutCubic(clamp01(since / 0.35))
  return (
    <span
      className={cn("karaoke-word inline-block", romaji && "karaoke-romaji")}
      style={
        {
          "--p": progress,
          transform: `translateY(${-0.07 * rise}em) scale(${1 + 0.05 * pop})`,
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  )
}
