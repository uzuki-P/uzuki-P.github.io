import { useEffect, useId, useRef } from "react"

import { cn } from "@/lib/utils"

/**
 * A top bar dropdown on the native Popover API: the browser handles Esc, clicking outside and
 * the top layer. It opens under its trigger, right-aligned to it.
 */
export function Popover({
  trigger,
  triggerLabel,
  triggerClassName,
  role,
  label,
  className,
  onOpen,
  children,
}: {
  trigger: React.ReactNode
  triggerLabel: string
  triggerClassName?: string
  role?: "menu" | "dialog"
  label: string
  className?: string
  /** runs after the popover opens, e.g. to focus an item */
  onOpen?: (popover: HTMLElement) => void
  children: React.ReactNode
}) {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = popover.current!
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open") return
      const rect = button.current!.getBoundingClientRect()
      el.style.top = `${rect.bottom + 6}px`
      el.style.right = `${Math.max(8, innerWidth - rect.right)}px`
    }
    const opened = (e: Event) => (e as ToggleEvent).newState === "open" && onOpen?.(el)
    el.addEventListener("beforetoggle", place)
    el.addEventListener("toggle", opened)
    return () => {
      el.removeEventListener("beforetoggle", place)
      el.removeEventListener("toggle", opened)
    }
  }, [onOpen])

  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={id}
        aria-haspopup={role === "menu" ? "menu" : "dialog"}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <div
        ref={popover}
        id={id}
        popover="auto"
        role={role}
        aria-label={label}
        className={cn(
          "top-popover fixed inset-auto m-0 rounded-xl bg-(--win) p-1.5 text-[13px] text-(--ink) shadow-[0_16px_40px_rgba(0,0,0,.3)] ring-1 ring-(--win-ring)",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}
