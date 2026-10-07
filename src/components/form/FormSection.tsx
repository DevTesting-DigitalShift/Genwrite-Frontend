import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { get, useFormContext } from "react-hook-form"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  description?: string
  /** One or two characters shown in the leading badge — defaults to the title's initial. */
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
  className?: string
  children: ReactNode
}

/**
 * Collapsible block of a single-page form, built on Radix's accordion primitive (so it's
 * keyboard- and screen-reader-accessible, and animates open/closed via the project's existing
 * `animate-accordion-{down,up}` keyframes) rather than the browser's bare `<details>` marker.
 * The body stays mounted while closed, which keeps its values registered with react-hook-form
 * and its fields validated. Must render inside a react-hook-form `FormProvider`.
 */
export function FormSection({
  title,
  description,
  icon,
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
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={open ? "section" : ""}
      onValueChange={(value) => setOpen(value === "section")}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow data-[state=open]:shadow-sm data-[state=open]:border-primary/25",
        className
      )}
    >
      <AccordionPrimitive.Item value="section" className="border-none">
        <AccordionPrimitive.Header asChild>
          <h3>
            <AccordionPrimitive.Trigger className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:px-5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground transition-colors group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary">
                {icon ?? title.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{title}</span>
                {description && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                )}
              </span>
              {errorCount > 0 && (
                <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
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
          className="overflow-hidden data-[state=closed]:h-0 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="space-y-5 border-t border-border/70 px-4 py-4 sm:px-5">{children}</div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
