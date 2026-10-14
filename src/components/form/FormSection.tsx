import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { get, useFormContext } from "react-hook-form"
import { AlertCircle, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { sectionDomId, useCreateFormContext } from "./createFormContext"

interface FormSectionProps {
  /** Stable key the summary rail's checklist uses to open and scroll to this section. */
  id?: string
  title: string
  description?: string
  /** Compact current-state copy shown as a chip in the header (else the form's, by `id`). */
  summary?: ReactNode
  /** Position in the form, shown in the leading badge until the section is complete. */
  step?: number
  /** Everything required here is filled in — the badge turns into a green check (else the form's, by `id`). */
  complete?: boolean
  /** Badge content when there's no `step` — defaults to the title's initial. */
  icon?: ReactNode
  /**
   * Field paths that live inside this section. When any of them has an error the section
   * opens itself, so a failed submit never leaves the message behind a closed section.
   */
  fields?: string[]
  /** Open on first render — basic sections; power-user sections stay closed. */
  defaultOpen?: boolean
  /** Controlled mode, for forms that keep open/closed in their reducer. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Drop the body's padding — for content that runs edge to edge, like `ConfigTabs`. */
  flush?: boolean
  className?: string
  children: ReactNode
}

/**
 * Collapsible block of a single-page form, built on Radix's accordion primitive (so it's
 * keyboard- and screen-reader-accessible, and animates open/closed via the project's existing
 * `animate-accordion-{down,up}` keyframes) rather than the browser's bare `<details>` marker.
 * The body stays mounted while closed, which keeps its values registered with react-hook-form
 * and its fields validated. Must render inside a react-hook-form `FormProvider`.
 *
 * The header badge carries the section's state at a glance: its step number while there's
 * work left, a green check once `complete`, a red alert while a field inside has an error.
 */
export function FormSection({
  id,
  title,
  description,
  summary: summaryProp,
  step,
  complete: completeProp,
  icon,
  fields = [],
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  flush,
  className,
  children,
}: FormSectionProps) {
  const {
    formState: { errors },
  } = useFormContext()
  const { openRequest, sections } = useCreateFormContext()
  const status = id ? sections[id] : undefined
  const summary = summaryProp ?? status?.summary
  const complete = completeProp ?? status?.complete
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const errorCount = fields.filter((path) => get(errors, path)).length
  const hasError = errorCount > 0

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when the error count changes
  useEffect(() => {
    if (errorCount > 0 && !open) setOpen(true)
  }, [errorCount])

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on a new request
  useEffect(() => {
    if (id && openRequest?.id === id && !open) setOpen(true)
  }, [openRequest])

  const badge = hasError ? (
    <AlertCircle className="size-4" aria-hidden />
  ) : complete ? (
    <Check className="size-4" strokeWidth={3} aria-hidden />
  ) : (
    (step ?? icon ?? title.charAt(0))
  )

  return (
    <AccordionPrimitive.Root
      id={id ? sectionDomId(id) : undefined}
      type="single"
      collapsible
      value={open ? "section" : ""}
      onValueChange={(value) => setOpen(value === "section")}
      className={cn(
        "group scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] duration-200",
        hasError
          ? "border-destructive/40 ring-1 ring-destructive/10"
          : "border-border data-[state=open]:border-primary/20 data-[state=open]:shadow-sm",
        className
      )}
    >
      <AccordionPrimitive.Item value="section" className="border-none">
        <AccordionPrimitive.Header asChild>
          <h3>
            <AccordionPrimitive.Trigger className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:px-5">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                  hasError
                    ? "bg-destructive/10 text-destructive"
                    : complete
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-primary/10 text-primary"
                )}
              >
                {badge}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-tight text-foreground">
                  {title}
                </span>
                {description && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </span>
              {summary && !hasError && (
                <span
                  className={cn(
                    "hidden max-w-52 truncate rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block",
                    complete
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {summary}
                </span>
              )}
              {hasError && (
                <span className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                  {errorCount} to fix
                </span>
              )}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
          </h3>
        </AccordionPrimitive.Header>
        <AccordionPrimitive.Content
          // Keep the body in the DOM even while closed — without `forceMount`, Radix's
          // Presence unmounts it once the close animation ends, which would drop its
          // fields' registration with react-hook-form instead of merely hiding them.
          forceMount
          className="overflow-hidden data-[state=closed]:h-0 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        >
          <div className={cn("border-t border-border", !flush && "space-y-5 px-4 py-5 sm:px-5")}>
            {children}
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
