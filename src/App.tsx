import { createContext, use, useEffect, useLayoutEffect, useRef, useState } from "react"

import { Icon } from "@/components/m3e/icon"
import { cn } from "@/lib/utils"
import { featured, PLATFORM_LABEL, projects, shotsOf, type Shot } from "./data"
import { LyricsPill } from "./Lyrics"
import { ThemeMenu } from "./Theme"
import { useTooltips } from "./Tooltip"
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
/** Below this width (phones, small tablets) the page is a home screen instead of a desktop. */
const DESKTOP = "(min-width: 1024px)"

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
function useWidth(el: HTMLElement | null) {
  const [width, setWidth] = useState(96)
  useLayoutEffect(() => {
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.offsetWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])
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
      <figure className="pointer-events-none grid max-h-full w-full justify-items-center gap-3">
        <ShotImage
          key={shot.src}
          shot={shot}
          maxHeight="(100dvh - 8rem)"
          className="pointer-events-auto rounded-lg shadow-[0_30px_80px_rgba(0,0,0,.6)]"
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

/**
 * A screenshot in a box of its exact shape, with a shimmering skeleton until it loads, so nothing
 * collapses or jumps while it downloads. The box fits like object-contain: no wider than its
 * container or the image's own width, and no taller than `maxHeight`.
 */
function ShotImage({
  shot,
  maxHeight,
  lazy,
  className,
  children,
}: {
  shot: Shot
  maxHeight: string
  lazy?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const img = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  // an image already in the cache can finish before React attaches onLoad
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setLoaded(true)
  }, [])
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        aspectRatio: `${shot.width} / ${shot.height}`,
        width: `min(100%, ${shot.width}px, calc(${maxHeight} * ${shot.width / shot.height}))`,
      }}
    >
      {!loaded && (
        <div aria-hidden className="skeleton absolute inset-0 grid place-items-center text-white/25">
          <Icon name="image" size={32} />
        </div>
      )}
      <img
        ref={img}
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        loading={lazy ? "lazy" : undefined}
        onLoad={() => setLoaded(true)}
        className={cn("absolute inset-0 size-full object-contain transition-opacity duration-300", !loaded && "opacity-0")}
      />
      {children}
    </div>
  )
}

/* ---------- desktop ---------- */

export function App() {
  const wide = useMedia(DESKTOP)
  const desk = useRef<HTMLDivElement>(null)
  const [icons, setIcons] = useState<HTMLElement | null>(null)
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
      onecore: { x: Math.max(0, Math.min(w - WINDOW_WIDTH.app, left + WINDOW_WIDTH.about + 40)), y: 64 },
    })
  }, [iconsWidth, wide])

  const clamp = (id: AppId, p: Pos): Pos => {
    const el = desk.current
    if (!el) return p
    const w = Math.min(id === "about" ? WINDOW_WIDTH.about : WINDOW_WIDTH.app, el.clientWidth)
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
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-window="${id}"]`)?.focus({ preventScroll: true }))
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
      <div className="desktop relative flex min-h-dvh flex-col pt-12 text-(--desk-ink) lg:pt-8">
        <a
          href="#desktop-icons"
          className="sr-only z-[60] rounded-lg bg-[#C2185B] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to projects
        </a>

        <TopBar
          wide={wide}
          stack={stack}
          hidden={hidden}
          focused={focused}
          lyricsShown={lyricsShown}
          onToggleLyrics={() => setLyricsShown((v) => !v)}
          onLaunch={launch}
          onTask={onTask}
        />

        {wide ? (
          <div className="relative min-h-[440px] flex-1">
            {lyricsShown && (
              <LyricsPill onHide={() => setLyricsShown(false)} className="fixed right-4 bottom-4 z-40 w-[480px]" />
            )}
            <nav
              id="desktop-icons"
              ref={setIcons}
              aria-label="Projects"
              className="desktop-icons absolute inset-y-4 left-3 grid grid-flow-col gap-1"
            >
              {APPS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => launch(app.id)}
                  className="group flex h-[5.5rem] w-24 flex-col items-center gap-1.5 rounded-xl p-1.5 text-[12px] leading-tight transition-colors hover:bg-(--hover) focus-visible:bg-(--hover)"
                >
                  <AppTile id={app.id} icon={app.icon} />
                  <span className="text-center font-medium [text-shadow:var(--label-shadow)]">{app.name}</span>
                </button>
              ))}
            </nav>

            <div
              ref={desk}
              style={{ "--icons": `${iconsWidth}px` } as React.CSSProperties}
              className="absolute inset-y-4 right-4 left-[calc(var(--icons)+1.75rem)]"
            >
              {/* DOM order stays fixed so focusing a window never re-mounts it; the stack only sets z-index */}
              {APPS.filter((a) => stack.includes(a.id)).map(({ id }) => (
                <Window
                  key={id}
                  id={id}
                  active={id === focused}
                  hidden={hidden.includes(id)}
                  z={stack.indexOf(id) + 1}
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
        ) : (
          <PhoneHome
            lyrics={lyricsShown && <LyricsPill onHide={() => setLyricsShown(false)} className="w-full" />}
          />
        )}
      </div>
      <Lightbox preview={preview} onChange={setPreview} />
    </PreviewContext>
  )
}

/** The rounded app icon, shared by the desktop icons and the phone home screen. */
function AppTile({ id, icon, className }: { id: AppId; icon: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#FBF8FA] text-[#C2185B] shadow-(--tile-shadow) transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none",
        className
      )}
    >
      {id === "about" ? <img src={AVATAR} alt="" className="size-full" /> : <Icon name={icon} size={26} />}
    </span>
  )
}

/* ---------- phone ---------- */

/**
 * Phones get a home screen instead of windows: the about card, the lyrics, then a grid of app
 * icons. An app opens as a full-screen sheet; the sheet's back button and the phone's own Back
 * gesture both close it.
 */
function PhoneHome({ lyrics }: { lyrics: React.ReactNode }) {
  const [sheet, setSheet] = useState<AppId | null>(null)
  const [closing, setClosing] = useState(false)

  // the sheet is a history entry, so the system Back gesture closes it instead of leaving the page
  useEffect(() => {
    const onPop = () => setClosing(true)
    addEventListener("popstate", onPop)
    return () => removeEventListener("popstate", onPop)
  }, [])
  useEffect(() => {
    if (!sheet) return
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [sheet])

  const open = (id: AppId) => {
    history.pushState({ sheet: id }, "")
    setClosing(false)
    setSheet(id)
  }
  const back = () => history.back()
  const closed = () => {
    setSheet(null)
    setClosing(false)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-10">
      <section aria-label="About me" className="overflow-hidden rounded-2xl bg-(--win) text-(--ink) shadow-[0_10px_30px_rgba(0,0,0,.18)] ring-1 ring-(--win-ring)">
        <About phone />
      </section>
      {lyrics}
      <section aria-labelledby="phone-apps">
        <h2 id="phone-apps" className="mb-3 px-1 text-[13px] font-semibold tracking-wide uppercase opacity-70">
          Projects
        </h2>
        <nav id="desktop-icons" aria-labelledby="phone-apps" className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-6">
          {APPS.filter((a) => a.id !== "about").map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => open(app.id)}
              className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 text-[12px] leading-tight active:bg-(--hover)"
            >
              <AppTile id={app.id} icon={app.icon} className="size-14 rounded-2xl" />
              <span className="line-clamp-2 text-center font-medium [text-shadow:var(--label-shadow)]">{app.name}</span>
            </button>
          ))}
        </nav>
      </section>
      {sheet && <AppSheet id={sheet} closing={closing} onBack={back} onClosed={closed} />}
    </div>
  )
}

function AppSheet({ id, closing, onBack, onClosed }: { id: AppId; closing: boolean; onBack: () => void; onClosed: () => void }) {
  const app = appOf(id)
  const backButton = useRef<HTMLButtonElement>(null)
  useEffect(() => backButton.current?.focus({ preventScroll: true }), [])
  useEffect(() => {
    if (closing && reducedMotion()) onClosed()
  }, [closing, onClosed])

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={app.name}
      onKeyDown={(e) => e.key === "Escape" && onBack()}
      onAnimationEnd={(e) => e.target === e.currentTarget && closing && onClosed()}
      className={cn(
        "fixed inset-x-0 top-12 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-2xl bg-(--win) text-(--ink) shadow-[0_-10px_40px_rgba(0,0,0,.3)]",
        closing ? "sheet-out" : "sheet-in"
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-(--win-ring) px-1.5">
        <button
          ref={backButton}
          type="button"
          onClick={onBack}
          aria-label="Back to home"
          className="grid size-11 place-items-center rounded-full hover:bg-(--hover)"
        >
          <Icon name="arrow_back" size={22} />
        </button>
        <Icon name={app.icon} size={18} className="text-(--accent-ink)" />
        <span className="truncate text-[15px] font-semibold">{app.name}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        <WindowBody id={id} />
      </div>
    </section>
  )
}

function Window({
  id,
  active,
  hidden,
  z,
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
      style={{ "--x": `${pos.x}px`, "--y": `${pos.y}px`, "--w": `${width}px`, zIndex: z } as React.CSSProperties}
      className={cn(
        leaving === "close" ? "window-close" : leaving === "minimize" ? "window-minimize" : "window-in",
        leaving && "pointer-events-none",
        "absolute top-(--y) left-(--x) flex max-h-[calc(100%-var(--y))] w-[min(var(--w),100%)] flex-col overflow-hidden rounded-xl bg-(--win) text-(--ink) outline-none",
        active
          ? "shadow-[0_28px_70px_rgba(0,0,0,.45)] ring-1 ring-[#E91E63]/60"
          : "shadow-[0_14px_36px_rgba(0,0,0,.3)] ring-1 ring-(--win-ring)"
      )}
    >
      <div
        className={cn(
          "flex h-10 shrink-0 cursor-grab touch-none items-center gap-2 pr-1.5 pl-3.5 text-[13px] select-none active:cursor-grabbing",
          active ? "bg-(--title)" : "bg-(--title-idle) text-(--muted)"
        )}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return
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
          className="grid size-7 place-items-center rounded-full hover:bg-(--hover)"
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
        <div className="flex flex-wrap gap-2">
          {p.site && <LinkButton href={p.site}>Open {new URL(p.site).host}</LinkButton>}
          <LinkButton href={p.repo} quiet={!!p.site}>
            {p.repo.replace("https://github.com/", "")}
          </LinkButton>
        </div>
      </div>
    </>
  )
}

function About({ phone }: { phone?: boolean }) {
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
        {phone ? "Every app below opens one of them." : "Every icon on this desktop opens one of them."} I’m open to
        frontend, Kotlin and developer tooling work, remote or in Medan.
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

/** An external link button; `quiet` is the secondary style, for a second link beside the main one. */
function LinkButton({ href, quiet, children }: { href: string; quiet?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...EXTERNAL}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[14px] font-medium",
        quiet ? "bg-(--chip) hover:bg-(--chip-hover)" : "bg-[#C2185B] text-white hover:bg-[#AD1457]"
      )}
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
          className="group flex min-w-0 flex-1 cursor-zoom-in justify-center rounded-md"
        >
          <ShotImage shot={{ ...s, alt: "" }} maxHeight="18rem" lazy className="rounded-md">
            <span
              aria-hidden
              className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Icon name="open_in_full" size={16} />
            </span>
          </ShotImage>
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
  wide,
  stack,
  hidden,
  focused,
  lyricsShown,
  onToggleLyrics,
  onLaunch,
  onTask,
}: {
  wide: boolean
  stack: AppId[]
  hidden: AppId[]
  focused: AppId | undefined
  lyricsShown: boolean
  onToggleLyrics: () => void
  onLaunch: (id: AppId) => void
  onTask: (id: AppId) => void
}) {
  const clock = useClock()
  const { ref, tooltip } = useTooltips<HTMLElement>()
  // touch-sized on phones, compact on the desktop
  const tray = "grid size-10 shrink-0 place-items-center rounded-lg hover:bg-(--hover) lg:size-7 lg:rounded-md"
  return (
    <header
      ref={ref}
      className="fixed inset-x-0 top-0 z-50 flex h-12 items-center gap-0.5 border-b border-(--panel-line) bg-(--panel) px-1.5 text-[12.5px] text-(--panel-ink) backdrop-blur-xl lg:h-8 lg:gap-1 lg:px-2"
    >
      {wide && (
        <>
          <button type="button" onClick={() => onLaunch("about")} aria-label="Open about me" data-tip="About me" className={tray}>
            <img src={AVATAR} alt="" className="size-5 rounded-full" />
          </button>
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Open windows" role="group">
            {APPS.filter((a) => stack.includes(a.id)).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onTask(a.id)}
                aria-pressed={a.id === focused}
                data-tip={a.id === focused ? `Minimize ${a.name}` : `Show ${a.name}`}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 hover:bg-(--hover)",
                  a.id === focused && "bg-(--hover) shadow-[inset_0_-1.5px_0_var(--accent-line)]",
                  hidden.includes(a.id) && "opacity-55"
                )}
              >
                <Icon name={a.icon} size={15} />
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mx-1 flex min-w-0 flex-1 justify-center lg:flex-none">
        <WavePill avatar={AVATAR} lyricsShown={lyricsShown} onToggleLyrics={onToggleLyrics} buttonClassName={tray} />
      </div>
      <ThemeMenu triggerClassName={tray} />
      {wide && (
        <>
          <a href={GITHUB} {...EXTERNAL} aria-label="GitHub" data-tip="GitHub: uzuki-P" className={tray}>
            <Icon name="code" size={16} />
          </a>
          <a href={`mailto:${EMAIL}`} aria-label="Email" data-tip={`Email ${EMAIL}`} className={tray}>
            <Icon name="mail" size={16} />
          </a>
        </>
      )}
      <WeatherMenu triggerClassName="flex h-10 shrink-0 items-center gap-1 rounded-lg px-2 hover:bg-(--hover) lg:h-7 lg:rounded-md" />
      <time
        className="hidden shrink-0 px-2 font-mono tabular-nums sm:block"
        data-tip={`${clock.date} · Medan, Western Indonesia Time`}
      >
        {clock.time} <span className="text-(--muted-panel)">WIB</span>
      </time>
      {tooltip}
    </header>
  )
}
