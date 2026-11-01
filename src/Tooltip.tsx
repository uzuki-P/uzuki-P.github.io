import { useEffect, useLayoutEffect, useRef, useState } from "react"

const DELAY_MS = 450

/**
 * One tooltip for a whole toolbar. Any element inside the returned ref with `data-tip` shows its
 * text under it after a short hover, or right away on keyboard focus. Moving between items while
 * a tooltip is up switches it without the delay. The text is visual only; controls keep their own
 * accessible names.
 */
export function useTooltips<T extends HTMLElement>() {
  const root = useRef<T>(null)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    let timer = 0
    let current: HTMLElement | null = null
    let shown = false

    const show = (target: HTMLElement) => {
      const r = target.getBoundingClientRect()
      shown = true
      setTip({ text: target.dataset.tip ?? "", x: r.left + r.width / 2, y: r.bottom + 6 })
    }
    const hide = () => {
      clearTimeout(timer)
      current = null
      shown = false
      setTip(null)
    }
    const point = (target: HTMLElement | null, instant: boolean) => {
      if (target === current) return
      clearTimeout(timer)
      current = target
      if (!target) return hide()
      if (instant || shown) show(target)
      else timer = window.setTimeout(() => show(target), DELAY_MS)
    }

    const over = (e: PointerEvent) =>
      e.pointerType === "mouse" && point((e.target as HTMLElement).closest<HTMLElement>("[data-tip]"), false)
    const focus = (e: FocusEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-tip]")
      if (target?.matches(":focus-visible")) point(target, true)
    }
    const key = (e: KeyboardEvent) => e.key === "Escape" && hide()

    el.addEventListener("pointerover", over)
    el.addEventListener("pointerleave", hide)
    el.addEventListener("pointerdown", hide)
    el.addEventListener("focusin", focus)
    el.addEventListener("focusout", hide)
    addEventListener("keydown", key)
    addEventListener("scroll", hide, true)
    return () => {
      clearTimeout(timer)
      el.removeEventListener("pointerover", over)
      el.removeEventListener("pointerleave", hide)
      el.removeEventListener("pointerdown", hide)
      el.removeEventListener("focusin", focus)
      el.removeEventListener("focusout", hide)
      removeEventListener("keydown", key)
      removeEventListener("scroll", hide, true)
    }
  }, [])

  return { ref: root, tooltip: tip && <Bubble {...tip} /> }
}

function Bubble({ text, x, y }: { text: string; x: number; y: number }) {
  const bubble = useRef<HTMLDivElement>(null)
  const [left, setLeft] = useState(x)
  // centered under the target, but kept 8px inside the viewport
  useLayoutEffect(() => {
    const w = bubble.current!.offsetWidth
    setLeft(Math.min(Math.max(x - w / 2, 8), innerWidth - w - 8))
  }, [x, text])
  return (
    <div
      ref={bubble}
      aria-hidden
      className="tooltip pointer-events-none fixed z-[70] max-w-64 rounded-md bg-(--tip) px-2 py-1 text-[12px] leading-snug text-(--tip-ink) shadow-[0_4px_14px_rgba(0,0,0,.25)]"
      style={{ left, top: y }}
    >
      {text}
    </div>
  )
}
