import { useEffect, useLayoutEffect, useState } from "react"
import { flushSync } from "react-dom"

import { Icon } from "@/components/m3e/icon"
import { cn } from "@/lib/utils"
import { Popover } from "./Popover"

type Mode = "system" | "light" | "dark"
const MODES: { mode: Mode; label: string; icon: string }[] = [
  { mode: "system", label: "System", icon: "brightness_auto" },
  { mode: "light", label: "Light", icon: "light_mode" },
  { mode: "dark", label: "Dark", icon: "dark_mode" },
]
/** localStorage key; index.html reads it too, to set the theme before first paint */
const MODE_KEY = "color-mode"

function useSystemDark() {
  const query = "(prefers-color-scheme: dark)"
  const [dark, setDark] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const list = matchMedia(query)
    const on = () => setDark(list.matches)
    list.addEventListener("change", on)
    return () => list.removeEventListener("change", on)
  }, [])
  return dark
}

function useColorMode() {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem(MODE_KEY)
    return MODES.some((m) => m.mode === saved) ? (saved as Mode) : "system"
  })
  const systemDark = useSystemDark()
  const dark = mode === "dark" || (mode === "system" && systemDark)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", dark)
    root.classList.toggle("light", !dark)
  }, [dark])

  /** switch modes; the new theme grows as a circle out of `origin` */
  const select = (next: Mode, origin: Element) => {
    localStorage.setItem(MODE_KEY, next)
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!document.startViewTransition || reduced) return setMode(next)

    const { left, top, width, height } = origin.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    // flushSync applies the theme class (a layout effect) inside the transition's update callback
    const transition = document.startViewTransition(() => flushSync(() => setMode(next)))
    transition.ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: "cubic-bezier(.2,0,0,1)", pseudoElement: "::view-transition-new(root)" }
      )
    )
  }
  return { mode, select }
}

/** The top bar's theme dropdown: System, Light or Dark. */
export function ThemeMenu({ triggerClassName }: { triggerClassName: string }) {
  const { mode, select } = useColorMode()
  const current = MODES.find((m) => m.mode === mode)!

  return (
    <Popover
      role="menu"
      label="Theme"
      triggerLabel={`Theme: ${current.label}`}
      triggerClassName={triggerClassName}
      trigger={<Icon name={current.icon} size={16} />}
      className="w-40"
      onOpen={(menu) => menu.querySelector<HTMLElement>("[aria-checked=true]")?.focus()}
    >
      <div
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
          e.preventDefault()
          const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=menuitemradio]")]
          const at = items.indexOf(document.activeElement as HTMLElement)
          items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus()
        }}
      >
        <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-(--muted) uppercase">Theme</p>
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            role="menuitemradio"
            aria-checked={m.mode === mode}
            onClick={(e) => {
              const trigger = document.querySelector(`[popovertarget="${e.currentTarget.closest("[popover]")!.id}"]`)!
              e.currentTarget.closest<HTMLElement>("[popover]")!.hidePopover()
              select(m.mode, trigger)
            }}
            className={cn(
              "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left hover:bg-(--hover) focus-visible:bg-(--hover)",
              m.mode === mode && "font-semibold text-(--accent-ink)"
            )}
          >
            <Icon name={m.icon} size={16} />
            <span className="flex-1">{m.label}</span>
            {m.mode === mode && <Icon name="check" size={16} />}
          </button>
        ))}
      </div>
    </Popover>
  )
}
