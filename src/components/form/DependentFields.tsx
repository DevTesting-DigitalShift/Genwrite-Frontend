import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Fields that only apply while a parent switch is on (brand voice → which brand; automatic
 * posting → which platform; images → which source). They stay on screen, dimmed and `inert`
 * (unfocusable, unclickable — sliders and custom controls included) while the switch is off,
 * rather than appearing and disappearing — so the form doesn't jump, and the user can see
 * what turning the switch on unlocks. Turning it on fills sensible first values (the parent
 * switch's handler does that), so nothing is left blank.
 */
export function DependentFields({
  enabled,
  hint,
  className,
  children,
}: {
  enabled: boolean
  /** Shown while disabled, e.g. "Turn on brand voice to choose these." */
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {!enabled && hint && <p className="text-xs font-medium text-muted-foreground">{hint}</p>}
      <div
        inert={!enabled}
        aria-disabled={!enabled || undefined}
        className={cn(
          "space-y-4 transition-opacity duration-200",
          !enabled && "pointer-events-none select-none opacity-50"
        )}
      >
        {children}
      </div>
    </div>
  )
}
