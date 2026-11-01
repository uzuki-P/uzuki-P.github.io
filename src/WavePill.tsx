import { Icon } from "@/components/m3e/icon"
import { cn } from "@/lib/utils"
import { DURATION, togglePlaying, TRACK, usePlaying, usePosition } from "./player"

const BARS = 44
/** fixed per-bar timing so the wave looks random but renders the same every time */
const BAR_MOTION = Array.from({ length: BARS }, (_, i) => ({
  duration: 520 + ((i * 197) % 480),
  delay: -((i * 331) % 900),
  low: 18 + ((i * 53) % 30),
}))

/**
 * Wave Player's panel pill: cover art, title and a play button over a visualizer that doubles as
 * the progress bar (the played part is darker). It plays the intro whose lyrics the pill shows.
 */
export function WavePill({ avatar, lyricsShown, onToggleLyrics }: { avatar: string; lyricsShown: boolean; onToggleLyrics: () => void }) {
  const playing = usePlaying()
  const position = usePosition()
  const progress = position / DURATION

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 md:flex-none">
      <div
        className={cn(
          "wave-pill relative flex h-6 min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-full bg-(--pill) px-0.5 ring-1 ring-(--panel-line) sm:w-[min(320px,30vw)] sm:flex-none",
          !playing && "is-paused"
        )}
      >
        <div aria-hidden className="absolute inset-y-0 right-7 left-7 flex items-end gap-px">
          {BAR_MOTION.map((bar, i) => (
            // the outer bar falls when paused; the inner one keeps the beat
            <span key={i} className="wave-fall flex h-full flex-1 items-end" style={{ transitionDelay: `${(i * 7) % 120}ms` }}>
              <span
                className="wave-bar w-full rounded-t-[1px]"
                style={
                  {
                    "--low": `${bar.low}%`,
                    animationDuration: `${bar.duration}ms`,
                    animationDelay: `${bar.delay}ms`,
                    background: (i + 0.5) / BARS < progress ? "var(--wave-played)" : "var(--wave-rest)",
                  } as React.CSSProperties
                }
              />
            </span>
          ))}
        </div>
        <img src={avatar} alt="" className="relative size-5 shrink-0 rounded-full" />
        <p className="wave-title relative min-w-0 flex-1 truncate text-[12px] leading-none font-semibold">
          <span lang="ja" className="jp">
            {TRACK.title}
          </span>
          <span className="font-normal text-(--muted-panel)"> · {TRACK.artist}</span>
        </p>
        <button
          type="button"
          onClick={togglePlaying}
          aria-label={playing ? "Pause intro" : "Play intro"}
          className="relative grid size-5 shrink-0 place-items-center rounded-full bg-[#C2185B] text-white hover:bg-[#AD1457]"
        >
          <Icon name={playing ? "pause" : "play_arrow"} size={14} fill />
        </button>
      </div>
      <button
        type="button"
        onClick={onToggleLyrics}
        aria-pressed={lyricsShown}
        aria-label="Show lyrics"
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md hover:bg-(--hover)",
          lyricsShown && "text-(--accent-ink)"
        )}
      >
        <Icon name="lyrics" size={16} />
      </button>
    </div>
  )
}
