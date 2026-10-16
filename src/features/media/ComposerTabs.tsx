import { ImageIcon, Video } from "lucide-react"
import type { ComposerTab } from "./useMediaComposer"

const TABS: { id: ComposerTab; label: string; icon: typeof Video }[] = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
]

/** Image / Video switch. Arrow keys move between modes like a native tablist. */
export function ComposerTabs({
  value,
  onChange,
  fullWidth = false,
}: {
  value: ComposerTab
  onChange: (tab: ComposerTab) => void
  fullWidth?: boolean
}) {
  const move = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const next = TABS[(index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]
    onChange(next.id)
    // The newly selected tab is the only one in the tab order, so move focus to it.
    requestAnimationFrame(() => document.getElementById(`composer-tab-${next.id}`)?.focus())
  }

  return (
    <div
      role="tablist"
      aria-label="Media type"
      className={`${fullWidth ? "flex w-full" : "flex w-full sm:inline-flex sm:w-auto"} rounded-lg bg-slate-100 p-1`}
    >
      {TABS.map(({ id, label, icon: Icon }, i) => {
        const active = value === id
        return (
          <button
            key={id}
            id={`composer-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => move(e, i)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 text-sm sm:gap-2 sm:px-3.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 sm:flex-none ${
              active ? "bg-white text-[#4C5BD6] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon size={16} aria-hidden /> {label}
          </button>
        )
      })}
    </div>
  )
}
