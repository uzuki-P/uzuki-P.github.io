import { useSyncExternalStore } from "react"

/**
 * The intro "song": one shared clock that the lyrics pill and the wave player both follow, so the
 * wave's progress matches the lyrics and pausing one pauses the other.
 */

export type Chunk = [ja: string, romaji: string]
export type LyricLine = { chunks: Chunk[]; en: string }

/** Japanese, romaji, then the translation, as Lyrics Float shows them. Each chunk is one karaoke word. */
export const LYRICS: LyricLine[] = [
  {
    chunks: [["ウェブ", "webu"], ["と", "to"], ["モバイル", "mobairu"], ["の", "no"], ["アプリ、", "apuri,"]],
    en: "Web and mobile apps,",
  },
  {
    chunks: [["毎日", "mainichi"], ["使う", "tsukau"], ["小さな", "chiisana"], ["ツール", "tsūru"], ["も", "mo"]],
    en: "plus the small tools I use every day",
  },
  {
    chunks: [["仕事", "shigoto"], ["では", "de wa"], ["OneCore CRM", "OneCore CRM"], ["の", "no"], ["フロントエンド", "furontoendo"], ["リード", "rīdo"]],
    en: "At work, I lead the frontend of OneCore CRM",
  },
  {
    chunks: [["仕事", "shigoto"], ["の", "no"], ["あと", "ato"], ["は", "wa"], ["Kotlin、", "Kotlin,"], ["Compose、", "Compose,"], ["TypeScript", "TypeScript"]],
    en: "After hours, Kotlin, Compose and TypeScript",
  },
]

export const TRACK = { title: "自己紹介", artist: "Rahmat Fajar" }

const LEAD_IN = 900
const GAP = 1700
const wordMs = ([, romaji]: Chunk) => Math.max(280, romaji.length * 85)

export type Timed = { start: number; end: number }
export type TimedLine = LyricLine & Timed & { words: Timed[] }

export const TIMELINE: TimedLine[] = (() => {
  let t = LEAD_IN
  return LYRICS.map((line) => {
    const start = t
    const words = line.chunks.map((chunk) => {
      const word = { start: t, end: t + wordMs(chunk) }
      t = word.end
      return word
    })
    const timed = { ...line, start, end: t, words }
    t += GAP
    return timed
  })
})()

export const DURATION = TIMELINE.at(-1)!.end + GAP

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches

let position = reduced ? TIMELINE[0].end : 0
let playing = !reduced
let frame = 0
let last = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function tick(now: number) {
  // a long pause (background tab) resumes where it left off instead of jumping ahead
  position = (position + Math.min(now - last, 100)) % DURATION
  last = now
  emit()
  frame = requestAnimationFrame(tick)
}

function start() {
  if (frame || !playing || !listeners.size) return
  last = performance.now()
  frame = requestAnimationFrame(tick)
}

function stop() {
  cancelAnimationFrame(frame)
  frame = 0
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
    if (!listeners.size) stop()
  }
}

export function togglePlaying() {
  playing = !playing
  if (playing) start()
  else stop()
  emit()
}

export const usePosition = () => useSyncExternalStore(subscribe, () => position)
export const usePlaying = () => useSyncExternalStore(subscribe, () => playing)
