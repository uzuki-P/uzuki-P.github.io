export type Platform = "android" | "desktop" | "web"

export type Media =
  | { kind: "pair"; shots: [Shot, Shot] }
  | { kind: "window"; shot: Shot }
  | { kind: "stage"; shots: Shot[]; layout: "row" | "stack" }
  | { kind: "desktop"; app: Shot; notification: Shot }

export type Shot = { src: string; alt: string; width: number; height: number }

export type Project = {
  id: string
  name: string
  blurb: string
  description: string
  platforms: Platform[]
  tags: string[]
  repo: string
  /** live site, when the project has one */
  site?: string
  icon: string
  media: Media
}

/** Pixel sizes of public/shots/*.webp, so placeholders take each image's exact shape before it loads. */
const SIZES: Record<string, [width: number, height: number]> = {
  "capital-crm-dashboard": [1440, 900],
  "capital-crm-leads": [1440, 900],
  gokapi: [1190, 790],
  "kalender-cuti-calendar": [1440, 900],
  "kalender-cuti-home": [1440, 900],
  "lyrics-float": [502, 199],
  "lyrics-float-settings": [380, 620],
  "plasma-wave-compact": [720, 60],
  "plasma-wave-full": [480, 656],
  "pray-time": [592, 800],
  "pray-time-notification": [608, 238],
  "spendr-home": [480, 1219],
  "spendr-reports": [480, 1219],
  "tabquest-home": [1440, 900],
  "viewport-find": [1280, 800],
  "vision-api": [1440, 900],
}

const shot = (file: string, alt: string): Shot => {
  const [width, height] = SIZES[file]
  return { src: `${import.meta.env.BASE_URL}shots/${file}.webp`, alt, width, height }
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  android: "Android",
  desktop: "Desktop",
  web: "Web",
}

export const featured = {
  id: "onecore",
  name: "OneCore CRM",
  icon: "support_agent",
  role: "Lead Frontend Developer · since Jan 2026",
  url: "https://onecorecrm.com",
  description:
    "A CRM that brings together leads, customers, PBX calling, an auto-dialer, WhatsApp and omnichannel inboxes, ads reporting and billing. I lead the frontend architecture: 23 domain modules, 118 lazy-loaded routes, an in-browser SIP/WebRTC softphone, English and Indonesian translations, and Playwright suites built on schema-checked mocks.",
  shots: [
    shot("capital-crm-dashboard", "OneCore CRM dashboard with lead conversion stats and top performers"),
    shot("capital-crm-leads", "OneCore CRM Lead Centre list with SLA status, filters and summary tiles"),
  ],
  facts: [
    { value: "12", label: "custom oxlint rules that fail the build when conventions drift" },
    { value: "2,568 → 24 ms", label: "for “next page” on the Leads list after an interaction-latency pass" },
    { value: "~7,800", label: "translation keys per language, with parity checked in CI" },
  ],
}

export const projects: Project[] = [
  {
    id: "tabquest",
    name: "TabQuest",
    blurb: "Split the office order, then make paying up a game",
    description:
      "Bill splitting for office group orders. Each receipt is divided among the people who ordered, and monthly spending and tip leaderboards, badges and a tip jar make settling up fun.",
    platforms: ["web"],
    tags: ["TanStack Start", "React", "Drizzle", "libSQL"],
    repo: "https://github.com/uzuki-P/tabquest",
    icon: "receipt_long",
    media: { kind: "window", shot: shot("tabquest-home", "TabQuest month view with unpaid splits and the player leaderboard") },
  },
  {
    id: "kalender-cuti",
    name: "Kalender Cuti",
    blurb: "Plan your days off around Indonesia’s holidays",
    description:
      "A holiday planner for Indonesia. Month and year calendars of national holidays and collective leave for 2026 and 2027, a holiday search, details for every date, and a long-weekend finder that shows which leave days join a holiday to a weekend. Each year is a prerendered static page.",
    platforms: ["web"],
    tags: ["React", "Vite", "M3 Expressive"],
    repo: "https://github.com/uzuki-P/kalender-cuti",
    site: "https://kalender-cuti.vercel.app/",
    icon: "calendar_month",
    media: {
      kind: "pair",
      shots: [
        shot("kalender-cuti-home", "Kalender Cuti home with the next holiday on a tear-off calendar sheet"),
        shot("kalender-cuti-calendar", "Kalender Cuti month view for November 2026 beside the date details"),
      ],
    },
  },
  {
    id: "spendr",
    name: "Spendr",
    blurb: "A spending tracker that reads your receipts",
    description:
      "Native Android expense tracker. Shows the month against a 3-month average, category reports, quick add and CSV backup, and scans receipts through Vision API.",
    platforms: ["android"],
    tags: ["Kotlin", "Jetpack Compose", "Material 3"],
    repo: "https://github.com/uzuki-P/spendr-kt",
    icon: "account_balance_wallet",
    media: {
      kind: "pair",
      shots: [
        shot("spendr-home", "Spendr home screen with the monthly spending chart and recent transactions"),
        shot("spendr-reports", "Spendr monthly report screen"),
      ],
    },
  },
  {
    id: "pray-time",
    name: "Pray Time",
    blurb: "Prayer times in the system tray",
    description:
      "Tray app for Linux and Windows with a live countdown to the next prayer and a daily checklist. Uses a hand-rolled StatusNotifierItem over D-Bus, and searches 169k cities offline in SQLite.",
    platforms: ["desktop"],
    tags: ["Compose Desktop", "D-Bus", "SQLite"],
    repo: "https://github.com/uzuki-P/pray-time",
    icon: "schedule",
    media: {
      kind: "desktop",
      app: shot("pray-time", "Pray Time popup with the next-prayer countdown and today’s checklist"),
      notification: shot("pray-time-notification", "Pray Time reminder for Asr with Mark as prayed and Snooze buttons"),
    },
  },
  {
    id: "gokapi",
    name: "Gokapi client",
    blurb: "Your self-hosted file drop, on phone and desktop",
    description:
      "Android and desktop client for a Gokapi file server. Browse, search and share files, upload from the share sheet in the background, install APK updates silently and get UnifiedPush notifications.",
    platforms: ["android", "desktop"],
    tags: ["Kotlin", "M3 Expressive", "WorkManager"],
    repo: "https://github.com/uzuki-P/gokapi-app",
    icon: "cloud_upload",
    media: { kind: "window", shot: shot("gokapi", "Gokapi desktop client listing recent files with filters and an upload button") },
  },
  {
    id: "lyrics-float",
    name: "Lyrics Float",
    blurb: "Synced lyrics floating over your Linux desktop",
    description:
      "An always-on-top pill with timed lyrics for any MPRIS player. Word-by-word karaoke, five lyrics providers, and romaji and translation lines.",
    platforms: ["desktop"],
    tags: ["Compose Desktop", "MPRIS", "Wayland"],
    repo: "https://github.com/uzuki-P/lyrics-float",
    icon: "lyrics",
    media: {
      kind: "stage",
      layout: "row",
      shots: [
        shot("lyrics-float", "Lyrics Float overlay with Japanese lyrics, romaji and translation"),
        shot("lyrics-float-settings", "Lyrics Float settings panel"),
      ],
    },
  },
  {
    id: "wave-player",
    name: "Wave Player",
    blurb: "A media pill for the Plasma 6 panel",
    description:
      "A panel widget with a CAVA visualizer behind the track title that doubles as the progress bar, and a Material 3 Expressive popup colored from the album art.",
    platforms: ["desktop"],
    tags: ["QML", "Plasma 6", "CAVA"],
    repo: "https://github.com/uzuki-P/plasma-wave-player",
    icon: "graphic_eq",
    media: {
      kind: "stage",
      layout: "stack",
      shots: [
        shot("plasma-wave-compact", "Wave Player panel pill with the visualizer behind the title"),
        shot("plasma-wave-full", "Wave Player popup with album art, wavy progress bar and controls"),
      ],
    },
  },
  {
    id: "vision-api",
    name: "Vision API",
    blurb: "Send an image and an instruction, get JSON back",
    description:
      "A small REST service that passes an image and an instruction to Claude Code, Codex or OpenCode. Queues jobs, needs a bearer token, keeps no images, and has a playground for comparing models.",
    platforms: ["web"],
    tags: ["Bun", "Effect", "Solid"],
    repo: "https://github.com/uzuki-P/vision-api",
    icon: "visibility",
    media: { kind: "window", shot: shot("vision-api", "Vision API playground with an uploaded image and the model’s JSON result") },
  },
  {
    id: "viewport-find",
    name: "Viewport Find",
    blurb: "Find in page that skips what you can already see",
    description:
      "A Chrome find bar with a mode where Next jumps past every match already on screen. Built on the CSS Highlight API, and leaves Ctrl+F to sites that use it.",
    platforms: ["web"],
    tags: ["Chrome extension", "CSS Highlights"],
    repo: "https://github.com/uzuki-P/viewport-find",
    icon: "find_in_page",
    media: { kind: "window", shot: shot("viewport-find", "Viewport Find bar highlighting matches for “state” on a page") },
  },
]

export function shotsOf(media: Media): Shot[] {
  if (media.kind === "window") return [media.shot]
  if (media.kind === "desktop") return [media.app, media.notification]
  return media.shots
}
