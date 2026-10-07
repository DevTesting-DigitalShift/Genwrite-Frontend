import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { get, useFormContext } from "react-hook-form"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  description?: string
  /**
   * Field paths that live inside this section. When any of them has an error the section
   * opens itself, so a failed submit never leaves the message behind a closed `<details>`.
   */
  fields?: string[]
  /** Open on first render — basic sections; power-user sections stay closed. */
  defaultOpen?: boolean
  /** Controlled mode, for forms that keep open/closed in their reducer. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children: ReactNode
}

/**
 * Collapsible block of a single-page form, built on the native `<details>` element so it
 * is keyboard- and screen-reader-accessible for free. The body stays mounted while closed,
 * which keeps its values registered with react-hook-form and its fields validated.
 * Must render inside a react-hook-form `FormProvider`.
 */
export function FormSection({
  title,
  description,
  fields = [],
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
}: FormSectionProps) {
  const {
    formState: { errors },
  } = useFormContext()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const errorCount = fields.filter((path) => get(errors, path)).length

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when the error count changes
  useEffect(() => {
    if (errorCount > 0 && !open) setOpen(true)
  }, [errorCount])

  return (
    <details
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open
        if (next !== open) setOpen(next)
      }}
      className={cn("group rounded-xl border border-border bg-card", className)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {errorCount > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              {errorCount} to fix
            </span>
          )}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-4">{children}</div>
    </details>
  )
}
