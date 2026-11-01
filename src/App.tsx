import { useEffect, useState } from "react"

import { Button } from "@/components/m3e/button"
import { Card } from "@/components/m3e/card"
import { FilterChip } from "@/components/m3e/chip"
import { useColorMode } from "@/components/m3e/color-mode-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/m3e/dropdown-menu"
import { Icon } from "@/components/m3e/icon"
import { Shape, type ShapeName } from "@/components/m3e/shape"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/m3e/tooltip"
import { cn } from "@/lib/utils"
import {
  featured,
  PLATFORM_LABEL,
  projects,
  type Media,
  type Platform,
  type Project,
  type Tone,
} from "./data"

const TONE: Record<Tone, string> = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
}

/** external links open in a new tab */
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const

const GITHUB = "https://github.com/uzuki-P"
const EMAIL = "rahmatfajar15@gmail.com"
const LINKEDIN = "https://www.linkedin.com/in/rahmat-fajar-a9a586b3"

function prefersReducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Shapes start as circles and settle into their own shape, one after another. */
function useSettled(index: number) {
  const [settled, setSettled] = useState(prefersReducedMotion)
  useEffect(() => {
    if (settled) return
    const timer = setTimeout(() => setSettled(true), 250 + index * 110)
    return () => clearTimeout(timer)
  }, [index, settled])
  return settled
}

export function App() {
  return (
    <div className="min-h-dvh bg-surface text-on-surface">
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to work
      </a>
      <TopBar />
      <main className="mx-auto w-[min(1200px,calc(100%-2rem))]">
        <Hero />
        <Featured />
        <Projects />
        <Contact />
      </main>
      <footer className="mx-auto flex w-[min(1200px,calc(100%-2rem))] flex-wrap justify-between gap-2 border-t border-outline-variant py-6 font-mono text-label-medium text-on-surface-variant">
        <span>© 2026 Rahmat Fajar</span>
        <span>Built with React and shadcn-m3e</span>
      </footer>
    </div>
  )
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-[min(1200px,calc(100%-2rem))] items-center gap-2">
        <a
          href="#top"
          className="mr-auto flex items-center gap-3 rounded-full focus-ring outline-none"
        >
          <Shape name="7-sided-cookie" className="grid size-9 place-items-center bg-primary text-on-primary">
            <span className="text-title-small font-bold">RF</span>
          </Shape>
          <span className="text-title-medium-emphasized">uzuki-P</span>
        </a>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Sections">
          {[
            ["Work", "#work"],
            ["Projects", "#projects"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <Button key={href} variant="text" size="sm" nativeButton={false} render={<a href={href} />}>
              {label}
            </Button>
          ))}
        </nav>
        <ThemeMenu />
      </div>
    </header>
  )
}

const MODE_ICON = { system: "brightness_auto", light: "light_mode", dark: "dark_mode" } as const

function ThemeMenu() {
  const { mode, setMode } = useColorMode()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="tonal" size="icon" aria-label={`Theme: ${mode}`}>
            <Icon name={MODE_ICON[mode]} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioItem value="system" closeOnClick>
            <Icon name="brightness_auto" /> System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light" closeOnClick>
            <Icon name="light_mode" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>
            <Icon name="dark_mode" /> Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Hero() {
  const shelf = [
    { id: featured.id, name: featured.name, shape: featured.shape, icon: featured.icon, tone: "primary" as Tone },
    ...projects,
  ]
  return (
    <section id="top" className="grid items-center gap-12 pt-14 pb-24 lg:grid-cols-[1.15fr_1fr] lg:pt-24 lg:pb-32">
      <div>
        <p className="mb-5 font-mono text-label-large text-primary">Rahmat Fajar · Medan, Indonesia</p>
        <h1 className="mb-8 max-w-2xl text-display-medium-emphasized text-balance text-on-surface sm:text-display-large-emphasized">
          Web and mobile apps, plus the small tools I use every day
        </h1>
        <p className="mb-10 max-w-xl text-body-large text-on-surface-variant sm:text-title-large sm:font-normal">
          I’m a lead frontend engineer with 8+ years of shipping products. At work I lead the frontend of{" "}
          <a href={featured.url} {...EXTERNAL} className="font-medium text-primary underline underline-offset-4">
            OneCore CRM
          </a>
          . After hours I build in Kotlin, Compose and TypeScript.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="md" nativeButton={false} render={<a href={GITHUB} {...EXTERNAL} />}>
            <Icon name="code" /> GitHub
          </Button>
          <Button size="md" variant="outlined" nativeButton={false} render={<a href={`mailto:${EMAIL}`} />}>
            <Icon name="mail" /> Email me
          </Button>
        </div>
      </div>

      <nav aria-label="Jump to a project" className="mx-auto grid w-full max-w-md grid-cols-3 gap-4 sm:gap-5">
        {shelf.map((item, index) => (
          <ShelfTile key={item.id} index={index} {...item} />
        ))}
      </nav>
    </section>
  )
}

function ShelfTile({
  id,
  name,
  shape,
  icon,
  tone,
  index,
}: {
  id: string
  name: string
  shape: ShapeName
  icon: string
  tone: Tone
  index: number
}) {
  const settled = useSettled(index)
  const [active, setActive] = useState(false)
  const current: ShapeName = !settled || active ? "circle" : shape
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={`#${id === featured.id ? "work" : `p-${id}`}`}
            aria-label={name}
            className="group block rounded-full focus-ring outline-none"
            onPointerEnter={() => setActive(true)}
            onPointerLeave={() => setActive(false)}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
          />
        }
      >
        <Shape
          name={current}
          className={cn(
            "grid size-full place-items-center transition-[clip-path,scale] motion-reduce:transition-none",
            active && "scale-105",
            TONE[tone]
          )}
        >
          <Icon name={icon} className="size-[38%]" />
        </Shape>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  )
}

function Featured() {
  return (
    <section id="work" className="mb-32 scroll-mt-20">
      <SectionLabel>At work</SectionLabel>
      <div className="grid gap-10 overflow-hidden rounded-3xl bg-surface-container p-6 sm:p-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:p-14">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <Shape name={featured.shape} className="grid size-14 place-items-center bg-primary text-on-primary">
              <Icon name={featured.icon} size={28} />
            </Shape>
            <div>
              <h2 className="text-headline-large-emphasized">{featured.name}</h2>
              <p className="text-label-large text-on-surface-variant">Lead Frontend Developer · since Jan 2026</p>
            </div>
          </div>
          <p className="mb-8 text-body-large text-on-surface-variant">
            A CRM that brings together leads, customers, PBX calling, an auto-dialer, WhatsApp and omnichannel inboxes,
            ads reporting and billing. I lead the frontend architecture: 23 domain modules, 118 lazy-loaded routes, an
            in-browser SIP/WebRTC softphone, English and Indonesian translations, and Playwright suites built on
            schema-checked mocks.
          </p>
          <dl className="mb-10 grid gap-3">
            {featured.facts.map((fact) => (
              <div key={fact.value} className="rounded-lg bg-surface-container-high px-5 py-4">
                <dt className="font-mono text-title-medium text-primary">{fact.value}</dt>
                <dd className="text-body-medium text-on-surface-variant">{fact.label}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="md" nativeButton={false} render={<a href={featured.url} {...EXTERNAL} />}>
              Visit onecorecrm.com <Icon name="arrow_outward" />
            </Button>
            <span className="text-label-medium text-on-surface-variant">Private code · screenshots use made-up data</span>
          </div>
        </div>
        <div className="relative aspect-[16/12]">
          <BrowserFrame className="absolute top-0 right-0 w-[86%] rotate-2" src={featured.shots[1]} />
          <BrowserFrame className="absolute bottom-0 left-0 w-[86%] -rotate-1" src={featured.shots[0]} />
        </div>
      </div>
    </section>
  )
}

function BrowserFrame({ src, className }: { src: { src: string; alt: string }; className?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-lg bg-surface-container-lowest shadow-elevation-3", className)}>
      <div className="flex h-6 items-center gap-1.5 bg-surface-container-highest px-3" aria-hidden>
        <span className="size-2.5 rounded-full bg-error" />
        <span className="size-2.5 rounded-full bg-tertiary" />
        <span className="size-2.5 rounded-full bg-primary" />
      </div>
      <img src={src.src} alt={src.alt} width={1440} height={900} className="block h-auto w-full" />
    </figure>
  )
}

type Filter = "all" | Platform

function Projects() {
  const [filter, setFilter] = useState<Filter>("all")
  const shown = filter === "all" ? projects : projects.filter((p) => p.platforms.includes(filter))
  const filters: Filter[] = ["all", "android", "desktop", "web"]
  return (
    <section id="projects" className="mb-32 scroll-mt-20">
      <SectionLabel>Side projects</SectionLabel>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h2 className="max-w-2xl text-display-small-emphasized">Open source tools I built for myself</h2>
        <div role="group" aria-label="Filter by platform" className="flex flex-wrap gap-2">
          {filters.map((value) => (
            <FilterChip
              key={value}
              pressed={filter === value}
              onPressedChange={() => setFilter(value)}
            >
              {value === "all" ? "All" : PLATFORM_LABEL[value]}
            </FilterChip>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {shown.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const [hover, setHover] = useState(false)
  return (
    <Card
      id={`p-${project.id}`}
      className="scroll-mt-24 gap-0 rounded-2xl py-0"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <ProjectMedia media={project.media} tone={project.tone} />
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
        <div className="flex items-center gap-4">
          <Shape
            name={hover ? "circle" : project.shape}
            className={cn("grid size-12 place-items-center motion-reduce:transition-none", TONE[project.tone])}
          >
            <Icon name={project.icon} size={24} />
          </Shape>
          <div className="min-w-0">
            <h3 className="text-headline-small-emphasized">{project.name}</h3>
            <p className="text-label-large text-on-surface-variant">
              {project.platforms.map((p) => PLATFORM_LABEL[p]).join(" · ")}
            </p>
          </div>
        </div>
        <p className="text-title-medium">{project.blurb}</p>
        <p className="text-body-medium text-on-surface-variant">{project.description}</p>
        <ul className="flex flex-wrap gap-2" aria-label="Built with">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-sm bg-surface-container-high px-2.5 py-1 font-mono text-label-medium text-on-surface-variant">
              {tag}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-2">
          <Button variant="tonal" nativeButton={false} render={<a href={project.repo} {...EXTERNAL} />}>
            <Icon name="code" /> {project.repo.replace("https://github.com/", "")}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ProjectMedia({ media, tone }: { media: Media; tone: Tone }) {
  if (media.kind === "pair") {
    return (
      <div className={cn("flex h-80 justify-center gap-4 overflow-hidden px-6 pt-8 sm:h-96", TONE[tone])}>
        {media.shots.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={cn(
              "w-[42%] rounded-t-[28px] object-cover object-top shadow-elevation-3 ring-6 ring-on-surface/90",
              i === 1 && "mt-10"
            )}
          />
        ))}
      </div>
    )
  }
  if (media.kind === "window") {
    return (
      <div className={cn("overflow-hidden px-6 pt-6 sm:px-8 sm:pt-8", TONE[tone])}>
        <img
          src={media.shot.src}
          alt={media.shot.alt}
          className="aspect-[16/10] w-full rounded-t-lg object-cover object-top-left shadow-elevation-3"
        />
      </div>
    )
  }
  if (media.kind === "desktop") {
    return (
      <div className="stage relative h-80 overflow-hidden sm:h-96">
        <img
          src={media.app.src}
          alt={media.app.alt}
          className="absolute top-[12%] left-[7%] h-auto w-[36%] drop-shadow-xl"
        />
        <img
          src={media.notification.src}
          alt={media.notification.alt}
          className="absolute top-4 right-4 h-auto w-[50%] drop-shadow-xl"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-7 bg-black/45 backdrop-blur-sm" />
      </div>
    )
  }
  return (
    <div
      className={cn(
        "stage flex h-80 items-center justify-center gap-4 overflow-hidden p-6 sm:h-96",
        media.layout === "stack" && "flex-col justify-start pt-8"
      )}
    >
      {media.shots.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          className={cn(
            "h-auto drop-shadow-xl",
            media.layout === "row" && (i === 0 ? "w-[56%]" : "w-[34%] rounded-xl"),
            media.layout === "stack" && (i === 0 ? "w-[92%]" : "w-[58%]")
          )}
        />
      ))}
    </div>
  )
}

function Contact() {
  return (
    <section id="contact" className="mb-24 scroll-mt-20">
      <div className="relative grid gap-10 overflow-hidden rounded-3xl bg-primary-container p-8 text-on-primary-container sm:p-14 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="mb-4 text-display-medium-emphasized">Let’s work together</h2>
          <p className="mb-8 max-w-lg text-title-medium font-normal">
            I’m open to frontend, Kotlin and developer tooling work, remote or in Medan.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="md" nativeButton={false} render={<a href={`mailto:${EMAIL}`} />}>
              <Icon name="mail" /> {EMAIL}
            </Button>
            <Button size="md" variant="tonal" nativeButton={false} render={<a href={GITHUB} {...EXTERNAL} />}>
              <Icon name="code" /> GitHub
            </Button>
            <Button size="md" variant="tonal" nativeButton={false} render={<a href={LINKEDIN} {...EXTERNAL} />}>
              <Icon name="work" /> LinkedIn
            </Button>
          </div>
        </div>
        <Shape
          name="very-sunny"
          aria-hidden
          className="contact-spin hidden size-56 place-items-center bg-primary text-on-primary md:grid"
        >
          <Icon name="waving_hand" size={72} />
        </Shape>
      </div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 flex items-center gap-3 font-mono text-label-large text-on-surface-variant after:h-px after:flex-1 after:bg-outline-variant">
      {children}
    </p>
  )
}
