import { createContext, use, useEffect, useLayoutEffect, useRef, useState } from "react"

import { Icon } from "@/components/m3e/icon"
import { cn } from "@/lib/utils"
import { featured, PLATFORM_LABEL, projects, shotsOf, type Shot } from "./data"
import { LyricsPill } from "./Lyrics"
import { ThemeMenu } from "./Theme"
import { WeatherMenu } from "./Weather"
import { WavePill } from "./WavePill"

const GITHUB = "https://github.com/uzuki-P"
const EMAIL = "rahmatfajar15@gmail.com"
const LINKEDIN = "https://www.linkedin.com/in/rahmat-fajar-a9a586b3"
const AVATAR = `${import.meta.env.BASE_URL}favicon.svg`
/** external links open in a new tab */
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const

type Leave = "close" | "minimize"
type AppId = "about" | "onecore" | (typeof projects)[number]["id"]
type Pos = { x: number; y: number }

const APPS: { id: AppId; name: string; icon: string }[] = [
  { id: "about", name: "about-me.txt", icon: "person" },
  { id: featured.id, name: featured.name, icon: featured.icon },
  ...projects.map((p) => ({ id: p.id, name: p.name, icon: p.icon })),
]
const appOf = (id: AppId) => APPS.find((a) => a.id === id)!

const WINDOW_WIDTH = { about: 440, app: 600 }
const LG = "(min-width: 1024px)"

function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches
}

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const list = matchMedia(query)
    const on = () => setMatches(list.matches)
    list.addEventListener("change", on)
    return () => list.removeEventListener("change", on)
  }, [query])
  return matches
}

/** live width of an element, so the window area can stop where the icon columns start */
function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(96)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.offsetWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/* ---------- full-screen screenshot preview ---------- */

type Preview = { shots: Shot[]; index: number }
const PreviewContext = createContext<(p: Preview) => void>(() => {})

function Lightbox({ preview, onChange }: { preview: Preview | null; onChange: (p: Preview | null) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current
    if (preview && el && !el.open) el.showModal()
  }, [preview])
  if (!preview) return null

  const { shots, index } = preview
  const shot = shots[index]
  const many = shots.length > 1
  const step = (by: number) => onChange({ shots, index: (index + by + shots.length) % shots.length })

  return (
    <dialog
      ref={dialog}
      aria-label="Screenshot"
      onClose={() => onChange(null)}
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      onKeyDown={(e) => {
        if (many && e.key === "ArrowLeft") step(-1)
        if (many && e.key === "ArrowRight") step(1)
      }}
      className="lightbox fixed inset-0 m-0 grid h-dvh max-h-none w-dvw max-w-none place-items-center bg-[#0d070b]/92 p-4 text-white backdrop:bg-transparent sm:p-10"
    >
      <figure className="pointer-events-none grid max-h-full justify-items-center gap-3">
        <img
          key={shot.src}
          src={shot.src}
          alt={shot.alt}
          className="pointer-events-auto max-h-[calc(100dvh-8rem)] max-w-full rounded-lg object-contain shadow-[0_30px_80px_rgba(0,0,0,.6)]"
        />
        <figcaption className="pointer-events-auto max-w-2xl text-center text-[14px] text-white/75">
          {shot.alt}
          {many && <span className="ml-2 font-mono text-white/45">{index + 1}/{shots.length}</span>}
        </figcaption>
      </figure>
      <button
        type="button"
        onClick={() => dialog.current?.close()}
        aria-label="Close preview"
        autoFocus
        className="fixed top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
      >
        <Icon name="close" size={22} />
      </button>
      {many && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous screenshot"
            className="fixed top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Icon name="chevron_left" size={26} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next screenshot"
            className="fixed top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Icon name="chevron_right" size={26} />
          </button>
        </>
      )}
    </dialog>
  )
}

/* ---------- desktop ---------- */

export function App() {
  const wide = useMedia(LG)
  const desk = useRef<HTMLDivElement>(null)
  const icons = useRef<HTMLElement>(null)
  const iconsWidth = useWidth(icons)
  /** open windows, back to front */
  const [stack, setStack] = useState<AppId[]>(["onecore", "about"])
  const [hidden, setHidden] = useState<AppId[]>([])
  const [pos, setPos] = useState<Partial<Record<AppId, Pos>>>({})
  const [preview, setPreview] = useState<Preview | null>(null)
  const [lyricsShown, setLyricsShown] = useState(true)
  /** windows playing their close or minimize animation */
  const [leaving, setLeaving] = useState<Partial<Record<AppId, Leave>>>({})

  const focused = stack.filter((id) => !hidden.includes(id)).at(-1)

  // starting layout: about on the left, the work window beside it, until the visitor moves something
  const touched = useRef(false)
  useLayoutEffect(() => {
    if (touched.current) return
    const w = desk.current?.clientWidth ?? 1280
    const left = Math.max(0, Math.min(w * 0.02, 32))
    setPos({
      about: { x: left, y: 16 },
      onecore: { x: Math.max(left + 48, Math.min(w - WINDOW_WIDTH.app, left + WINDOW_WIDTH.about + 40)), y: 64 },
    })
  }, [iconsWidth, wide])

  const clamp = (id: AppId, p: Pos): Pos => {
    const el = desk.current
    if (!el) return p
    const w = id === "about" ? WINDOW_WIDTH.about : WINDOW_WIDTH.app
    return {
      x: Math.min(Math.max(p.x, 120 - w), el.clientWidth - 120),
      y: Math.min(Math.max(p.y, 0), el.clientHeight - 48),
    }
  }

  /** bring a window to the front without moving focus */
  const raise = (id: AppId) => {
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : h))
    setStack((s) => (s.at(-1) === id ? s : [...s.filter((x) => x !== id), id]))
  }
  const launch = (id: AppId) => {
    touched.current = true
    raise(id)
    setPos((p) => {
      if (p[id]) return p
      const n = Object.keys(p).length
      const w = desk.current?.clientWidth ?? 1280
      return { ...p, [id]: clamp(id, { x: w * 0.22 + (n % 6) * 36, y: 20 + (n % 6) * 30 }) }
    })
    requestAnimationFrame(() => {
      const win = document.querySelector<HTMLElement>(`[data-window="${id}"]`)
      win?.focus({ preventScroll: true })
      if (!matchMedia(LG).matches) win?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" })
    })
  }
  const finishLeave = (id: AppId, how: Leave) => {
    setLeaving(({ [id]: _, ...rest }) => rest)
    if (how === "close") setStack((s) => s.filter((x) => x !== id))
    else setHidden((h) => [...h, id])
  }
  const leave = (id: AppId, how: Leave) =>
    reducedMotion() ? finishLeave(id, how) : setLeaving((l) => ({ ...l, [id]: how }))
  const close = (id: AppId) => leave(id, "close")
  const minimize = (id: AppId) => leave(id, "minimize")
  const onTask = (id: AppId) => (id === focused && wide ? minimize(id) : launch(id))

  return (
    <PreviewContext value={setPreview}>
      <div className="desktop relative flex min-h-dvh flex-col pt-8 text-(--desk-ink)">
        <a
          href="#desktop-icons"
          className="sr-only z-[60] rounded-lg bg-[#C2185B] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to projects
        </a>

        <TopBar
          stack={stack}
          hidden={hidden}
          focused={focused}
          lyricsShown={lyricsShown}
          onToggleLyrics={() => setLyricsShown((v) => !v)}
          onLaunch={launch}
          onTask={onTask}
        />

        <div className="relative flex w-full flex-1 flex-col gap-6 px-4 pt-4 pb-4 lg:block lg:min-h-[440px]">
          {lyricsShown && (
            <LyricsPill
              onHide={() => setLyricsShown(false)}
              className="w-full shrink-0 lg:fixed lg:right-4 lg:bottom-4 lg:z-40 lg:w-[480px]"
            />
          )}
          <nav
            id="desktop-icons"
            ref={icons}
            aria-label="Projects"
            className="desktop-icons grid grid-cols-3 gap-1 sm:grid-cols-5 lg:absolute lg:inset-y-4 lg:left-3 lg:grid-flow-col lg:grid-cols-none"
          >
            {APPS.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => launch(app.id)}
                className="group flex h-[5.5rem] w-full flex-col items-center gap-1.5 rounded-xl p-1.5 text-[12px] leading-tight transition-colors hover:bg-(--hover) focus-visible:bg-(--hover) lg:w-24"
              >
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#FBF8FA] text-[#C2185B] shadow-(--tile-shadow) transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none">
                  {app.id === "about" ? <img src={AVATAR} alt="" className="size-full" /> : <Icon name={app.icon} size={26} />}
                </span>
                <span className="text-center font-medium [text-shadow:var(--label-shadow)]">{app.name}</span>
              </button>
            ))}
          </nav>

          <div
            ref={desk}
            style={{ "--icons": `${iconsWidth}px` } as React.CSSProperties}
            className="relative flex flex-col gap-4 lg:absolute lg:inset-y-4 lg:right-4 lg:left-[calc(var(--icons)+1.75rem)] lg:block"
          >
            {/* DOM order stays fixed so focusing a window never re-mounts it; the stack only sets z-index */}
            {APPS.filter((a) => stack.includes(a.id)).map(({ id }) => (
              <Window
                key={id}
                id={id}
                active={id === focused}
                hidden={hidden.includes(id)}
                z={stack.indexOf(id) + 1}
                order={stack.length - stack.indexOf(id)}
                pos={pos[id] ?? { x: 0, y: 0 }}
                onFocus={() => raise(id)}
                onMove={(p) => {
                  touched.current = true
                  setPos((s) => ({ ...s, [id]: clamp(id, p) }))
                }}
                leaving={leaving[id]}
                onLeft={() => finishLeave(id, leaving[id]!)}
                onMinimize={() => minimize(id)}
                onClose={() => close(id)}
              />
            ))}
          </div>
        </div>

      </div>
      <Lightbox preview={preview} onChange={setPreview} />
    </PreviewContext>
  )
}

function Window({
  id,
  active,
  hidden,
  z,
  order,
  pos,
  onFocus,
  onMove,
  leaving,
  onLeft,
  onMinimize,
  onClose,
}: {
  id: AppId
  active: boolean
  hidden: boolean
  z: number
  order: number
  pos: Pos
  onFocus: () => void
  onMove: (p: Pos) => void
  leaving: Leave | undefined
  onLeft: () => void
  onMinimize: () => void
  onClose: () => void
}) {
  const app = appOf(id)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const width = id === "about" ? WINDOW_WIDTH.about : WINDOW_WIDTH.app

  return (
    <section
      data-window={id}
      tabIndex={-1}
      aria-label={app.name}
      hidden={hidden}
      onPointerDown={onFocus}
      onFocus={onFocus}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      onAnimationEnd={(e) => e.target === e.currentTarget && leaving && onLeft()}
      style={{ "--x": `${pos.x}px`, "--y": `${pos.y}px`, "--w": `${width}px`, zIndex: z, order } as React.CSSProperties}
      className={cn(
        leaving === "close" ? "window-close" : leaving === "minimize" ? "window-minimize" : "window-in",
        leaving && "pointer-events-none",
        "flex scroll-mt-4 flex-col overflow-hidden rounded-xl bg-(--win) text-(--ink) outline-none",
        "lg:absolute lg:top-[var(--y)] lg:left-[var(--x)] lg:max-h-[calc(100%-var(--y))] lg:w-[var(--w)]",
        active
          ? "shadow-[0_28px_70px_rgba(0,0,0,.45)] ring-1 ring-[#E91E63]/60"
          : "shadow-[0_14px_36px_rgba(0,0,0,.3)] ring-1 ring-(--win-ring)"
      )}
    >
      <div
        className={cn(
          "flex h-10 shrink-0 touch-none items-center gap-2 pr-1.5 pl-3.5 text-[13px] select-none lg:cursor-grab lg:active:cursor-grabbing",
          active ? "bg-(--title)" : "bg-(--title-idle) text-(--muted)"
        )}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button") || !matchMedia(LG).matches) return
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => drag.current && onMove({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy })}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <Icon name={app.icon} size={16} className={active ? "text-(--accent-ink)" : undefined} />
        <span className="flex-1 truncate font-medium">{app.name}</span>
        <button
          type="button"
          onClick={onMinimize}
          aria-label={`Minimize ${app.name}`}
          className="hidden size-7 place-items-center rounded-full hover:bg-(--hover) lg:grid"
        >
          <Icon name="minimize" size={16} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${app.name}`}
          className="grid size-7 place-items-center rounded-full hover:bg-[#C2185B] hover:text-white"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="min-h-0 overflow-auto overscroll-contain">
        <WindowBody id={id} />
      </div>
    </section>
  )
}

function WindowBody({ id }: { id: AppId }) {
  if (id === "about") return <About />
  if (id === featured.id)
    return (
      <>
        <Shots shots={featured.shots} />
        <div className="p-6">
          <Meta>At work · {featured.role}</Meta>
          <h2 className="mb-3 text-2xl font-[750] tracking-[-0.015em]">{featured.name}</h2>
          <p className="mb-5 leading-relaxed text-(--ink-2)">{featured.description}</p>
          <dl className="mb-6 grid gap-2">
            {featured.facts.map((f) => (
              <div key={f.value} className="flex items-baseline gap-3 rounded-lg bg-(--chip) px-3.5 py-2.5">
                <dt className="shrink-0 font-mono font-semibold text-(--accent-ink)">{f.value}</dt>
                <dd className="text-[14px] text-(--ink-2)">{f.label}</dd>
              </div>
            ))}
          </dl>
          <LinkButton href={featured.url}>Visit onecorecrm.com</LinkButton>
          <p className="mt-3 text-[12px] text-(--muted)">Private code · screenshots use made-up data</p>
        </div>
      </>
    )

  const p = projects.find((x) => x.id === id)!
  return (
    <>
      <Shots shots={shotsOf(p.media)} />
      <div className="p-6">
        <Meta>{p.platforms.map((x) => PLATFORM_LABEL[x]).join(" · ")}</Meta>
        <h2 className="mb-1 text-2xl font-[750] tracking-[-0.015em]">{p.name}</h2>
        <p className="mb-3 font-medium">{p.blurb}</p>
        <p className="mb-4 leading-relaxed text-(--ink-2)">{p.description}</p>
        <ul className="mb-6 flex flex-wrap gap-1.5" aria-label="Built with">
          {p.tags.map((t) => (
            <li key={t} className="rounded-md bg-(--chip) px-2 py-0.5 font-mono text-[12px] text-(--chip-ink)">
              {t}
            </li>
          ))}
        </ul>
        <LinkButton href={p.repo}>{p.repo.replace("https://github.com/", "")}</LinkButton>
      </div>
    </>
  )
}

function About() {
  return (
    <div className="p-6">
      <div className="mb-5 flex items-center gap-4">
        <img src={AVATAR} alt="Illustrated portrait of Rahmat with round glasses" className="size-20 rounded-2xl" />
        <div>
          <h2 className="text-2xl font-[750] tracking-[-0.015em]">Rahmat Fajar</h2>
          <p className="font-mono text-[13px] text-(--muted)">uzuki-P · Medan, Indonesia</p>
        </div>
      </div>
      <p className="mb-3 leading-relaxed text-(--ink-2)">
        Lead frontend engineer with 8+ years of shipping products. At work I lead the frontend of OneCore CRM. After
        hours I build Android apps, Linux desktop tools and small web services, mostly in Kotlin, Compose and
        TypeScript.
      </p>
      <p className="mb-6 leading-relaxed text-(--ink-2)">
        Every icon on this desktop opens one of them. I’m open to frontend, Kotlin and developer tooling work, remote
        or in Medan.
      </p>
      <div className="flex flex-wrap gap-2 text-[14px] font-medium">
        <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 rounded-lg bg-[#C2185B] px-3.5 py-2 text-white hover:bg-[#AD1457]">
          <Icon name="mail" size={18} /> {EMAIL}
        </a>
        <a href={GITHUB} {...EXTERNAL} className="rounded-lg bg-(--chip) px-3.5 py-2 hover:bg-(--chip-hover)">
          GitHub
        </a>
        <a href={LINKEDIN} {...EXTERNAL} className="rounded-lg bg-(--chip) px-3.5 py-2 hover:bg-(--chip-hover)">
          LinkedIn
        </a>
      </div>
      <p className="mt-6 text-[12px] text-(--muted)">© 2026 Rahmat Fajar</p>
    </div>
  )
}

function Meta({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 font-mono text-[12px] text-(--muted)">{children}</p>
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...EXTERNAL}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C2185B] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[#AD1457]"
    >
      {children} <Icon name="arrow_outward" size={16} />
    </a>
  )
}

function Shots({ shots }: { shots: Shot[] }) {
  const preview = use(PreviewContext)
  return (
    <div className="flex items-center justify-center gap-3 bg-[#1A1016] p-4">
      {shots.map((s, index) => (
        <button
          key={s.src}
          type="button"
          onClick={() => preview({ shots, index })}
          aria-label={`View full size: ${s.alt}`}
          className="group relative min-w-0 cursor-zoom-in rounded-md"
        >
          <img src={s.src} alt="" loading="lazy" className="max-h-72 rounded-md object-contain" />
          <span
            aria-hidden
            className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Icon name="open_in_full" size={16} />
          </span>
        </button>
      ))}
    </div>
  )
}

function useClock() {
  const read = () => {
    const now = new Date()
    const opts = { timeZone: "Asia/Jakarta" } as const
    return {
      time: new Intl.DateTimeFormat("en-GB", { ...opts, hour: "2-digit", minute: "2-digit" }).format(now),
      date: new Intl.DateTimeFormat("en-GB", { ...opts, weekday: "long", day: "numeric", month: "long" }).format(now),
    }
  }
  const [clock, setClock] = useState(read)
  useEffect(() => {
    const timer = setInterval(() => setClock(read()), 10_000)
    return () => clearInterval(timer)
  }, [])
  return clock
}

function TopBar({
  stack,
  hidden,
  focused,
  lyricsShown,
  onToggleLyrics,
  onLaunch,
  onTask,
}: {
  stack: AppId[]
  hidden: AppId[]
  focused: AppId | undefined
  lyricsShown: boolean
  onToggleLyrics: () => void
  onLaunch: (id: AppId) => void
  onTask: (id: AppId) => void
}) {
  const clock = useClock()
  const tray = "grid size-7 shrink-0 place-items-center rounded-md hover:bg-(--hover)"
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-8 items-center gap-1 border-b border-(--panel-line) bg-(--panel) px-2 text-[12.5px] text-(--panel-ink) backdrop-blur-xl">
      <button type="button" onClick={() => onLaunch("about")} aria-label="Open about me" className={cn(tray, "hidden md:grid")}>
        <img src={AVATAR} alt="" className="size-5 rounded-full" />
      </button>
      <div className="hidden min-w-0 flex-1 gap-1 overflow-x-auto md:flex" aria-label="Open windows" role="group">
        {APPS.filter((a) => stack.includes(a.id)).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onTask(a.id)}
            aria-pressed={a.id === focused}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 hover:bg-(--hover)",
              a.id === focused && "bg-(--hover) shadow-[inset_0_-1.5px_0_var(--accent-line)]",
              hidden.includes(a.id) && "opacity-55"
            )}
          >
            <Icon name={a.icon} size={15} />
            <span className="hidden sm:inline">{a.name}</span>
          </button>
        ))}
      </div>
      <div className="mx-1 flex min-w-0 flex-1 justify-center md:flex-none">
        <WavePill avatar={AVATAR} lyricsShown={lyricsShown} onToggleLyrics={onToggleLyrics} />
      </div>
      <ThemeMenu triggerClassName={tray} />
      <a href={GITHUB} {...EXTERNAL} aria-label="GitHub" className={cn(tray, "hidden sm:grid")}>
        <Icon name="code" size={16} />
      </a>
      <a href={`mailto:${EMAIL}`} aria-label="Email" className={cn(tray, "hidden sm:grid")}>
        <Icon name="mail" size={16} />
      </a>
      <WeatherMenu triggerClassName="flex h-7 shrink-0 items-center gap-1 rounded-md px-2 hover:bg-(--hover)" />
      <time className="shrink-0 px-2 font-mono tabular-nums" title={`${clock.date}, Medan (WIB)`}>
        {clock.time} <span className="text-(--muted-panel)">WIB</span>
      </time>
    </header>
  )
}
