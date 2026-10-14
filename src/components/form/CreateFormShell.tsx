import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEventHandler, ReactNode } from "react"
import { get, useFormState } from "react-hook-form"
import { AlertCircle, ArrowLeft, Check, LoaderCircle, Sparkles, Zap } from "lucide-react"
import { Button } from "@components/ui/button"
import { findFirstInvalidField, revealAndFocus } from "@/lib/forms/invalidSubmit"
import { cn } from "@/lib/utils"
import { CreateFormContext, sectionDomId } from "./createFormContext"
import type { SectionOpenRequest } from "./createFormContext"

export interface CostLine {
  label: string
  credits: number
}

/** One line of the preflight checklist: a requirement, and whether it's met yet. */
export interface ReadinessItem {
  /** `FormSection` id the item jumps to when clicked. */
  section: string
  /** `ConfigTabs` tab inside that section to switch to, when the item lives in one. */
  tab?: string
  label: string
  done: boolean
  /** Short right-hand value while things are fine, e.g. "Classic" or "3 focus". */
  detail?: string
  /** Field paths behind the item; an error on any of them turns it red with that message. */
  fields?: string[]
}

/** One row of the long "what you're about to generate" summary. */
export interface SummaryRow {
  label: string
  value: ReactNode
}

interface CreateFormShellProps {
  title: string
  description?: string
  onCancel: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel: string
  submittingLabel?: string
  isSubmitting?: boolean
  /** Credits the request will cost; omit for forms that are free. */
  estimatedCost?: number
  /** What it would cost without the cost cutter — shown struck through when higher. */
  originalCost?: number
  /** Short qualifier under the cost, e.g. "3 blogs". */
  costNote?: ReactNode
  /** Itemized charges behind `estimatedCost` (writing, each enabled feature, images). Desktop only. */
  costLines?: CostLine[]
  /** Required steps, in form order — drives the checklist, the progress bar and the badges. */
  readiness?: ReadinessItem[]
  /** Everything else that's been chosen, listed under the submit button. */
  summaryRows?: SummaryRow[]
  children: ReactNode
}

type ItemState = "done" | "error" | "todo"

/**
 * Page chrome for every single-page create form.
 *
 * At phone width it's one scrolling column with a sticky bottom action bar. From `lg` up the
 * sections run down a reading column on the left, and a summary rail sticks to the right:
 * a preflight checklist (what's done, what's missing, what's wrong — each line jumps to its
 * section), the cost with the cost-cutter saving spelled out, the submit button, and a full
 * summary of the choices so far.
 */
export function CreateFormShell({
  title,
  description,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel,
  isSubmitting,
  estimatedCost,
  originalCost,
  costNote,
  costLines,
  readiness = [],
  summaryRows = [],
  children,
}: CreateFormShellProps) {
  const { errors } = useFormState()
  const [openRequest, setOpenRequest] = useState<SectionOpenRequest | null>(null)
  const context = useMemo(() => ({ openRequest }), [openRequest])
  const railRef = useRef<HTMLElement>(null)
  const stickyTop = useStickyTop(railRef)

  const items = readiness.map((item) => {
    const error = (item.fields ?? [])
      .map((path) => get(errors, path)?.message as string | undefined)
      .find(Boolean)
    const state: ItemState = error ? "error" : item.done ? "done" : "todo"
    return { ...item, state, error }
  })
  const doneCount = items.filter((item) => item.state === "done").length
  const errorCount = items.filter((item) => item.state === "error").length
  const allReady = items.length > 0 && doneCount === items.length
  const saving =
    originalCost !== undefined && estimatedCost !== undefined ? originalCost - estimatedCost : 0

  /** Opens the item's section, scrolls to it, and focuses the broken field if there is one. */
  const jumpTo = (sectionId: string, tab?: string) => {
    setOpenRequest((prev) => ({ id: sectionId, tab, seq: (prev?.seq ?? 0) + 1 }))
    // Two frames: one for the open request to commit, one for the section body to un-hide.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const section = document.getElementById(sectionDomId(sectionId))
        if (!section) return
        const invalid = findFirstInvalidField(section)
        if (invalid) revealAndFocus(invalid.element)
        else section.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    )
  }

  const statusPill =
    items.length === 0 ? null : errorCount > 0 ? (
      <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
        {errorCount} to fix
      </span>
    ) : allReady ? (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
        All set
      </span>
    ) : (
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground tabular-nums">
        {doneCount}/{items.length} done
      </span>
    )

  const submitButton = (className?: string) => (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={cn("shadow-md shadow-primary/20", className)}
    >
      {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
      {isSubmitting ? (submittingLabel ?? "Working...") : submitLabel}
    </Button>
  )

  const rail = (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-1 bg-linear-to-r from-primary via-violet-500 to-amber-400" />
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <span className="text-base font-semibold">
              {errorCount > 0 ? "Almost there" : "Ready to generate"}
            </span>
          </div>
          {statusPill}
        </div>

        {items.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preflight checklist
              </p>
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {doneCount} of {items.length}
              </span>
            </div>
            <div
              className="mb-2.5 h-1 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label="Required steps done"
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={doneCount}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  errorCount > 0 ? "bg-destructive" : allReady ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${(doneCount / items.length) * 100}%` }}
              />
            </div>
            <ul className="-mx-1 space-y-0.5">
              {items.map((item) => (
                <li key={`${item.section}-${item.label}`}>
                  <button
                    type="button"
                    onClick={() => jumpTo(item.section, item.tab)}
                    className="group/item flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <ChecklistIcon state={item.state} />
                    <span className="sr-only">
                      {item.state === "done"
                        ? "Done: "
                        : item.state === "error"
                          ? "Needs fixing: "
                          : "To do: "}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[13px] leading-5",
                          item.state === "todo" ? "text-muted-foreground" : "text-foreground",
                          item.state === "error" && "font-medium"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.error && (
                        <span className="block text-xs leading-4 text-destructive">
                          {item.error}
                        </span>
                      )}
                    </span>
                    {!item.error && item.detail && (
                      <span className="mt-0.5 max-w-28 truncate text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {estimatedCost !== undefined && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated cost
            </p>

            {costLines && costLines.length > 0 && (
              <dl className="space-y-1 text-[13px]">
                {costLines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">{line.label}</dt>
                    <dd className="tabular-nums">{line.credits}</dd>
                  </div>
                ))}
                {saving > 0 && (
                  <div className="flex items-center justify-between gap-2 text-emerald-700">
                    <dt className="flex items-center gap-1">
                      <Zap className="size-3.5" aria-hidden />
                      Cost cutter
                    </dt>
                    <dd className="tabular-nums">-{saving}</dd>
                  </div>
                )}
              </dl>
            )}

            <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-border pt-2.5">
              <p className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold leading-none text-foreground tabular-nums">
                  {estimatedCost}
                </span>
                <span className="text-sm text-muted-foreground">credits</span>
                {saving > 0 && (
                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                    {originalCost}
                  </span>
                )}
              </p>
              {saving > 0 && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  -{Math.round((saving / (originalCost as number)) * 100)}% applied
                </span>
              )}
            </div>
            {costNote && <p className="mt-1 text-xs text-muted-foreground">{costNote}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {submitButton("h-11 w-full text-[15px]")}
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full text-muted-foreground"
          >
            Cancel
          </Button>
        </div>

        {summaryRows.length > 0 && (
          <dl className="space-y-2 border-t border-border pt-4 text-xs">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0 truncate text-right font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )

  return (
    <CreateFormContext.Provider value={context}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-busy={isSubmitting}
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <header className="mb-6 flex items-start gap-3 border-b border-border pb-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Go back"
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {/* The rail carries this on desktop; below `lg` it's the only progress cue up top. */}
          <div className="mt-1.5 shrink-0 lg:hidden">{statusPill}</div>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
          <div
            className={cn(
              "space-y-4",
              // The fixed bottom bar below needs room to sit clear of the last section on mobile;
              // the sticky side panel takes over that job at `lg`, so the padding only applies below it.
              "pb-36 sm:pb-28 lg:pb-0"
            )}
          >
            {children}
          </div>

          {/* No scroll box of its own — only the page scrolls (see `useStickyTop`). */}
          <aside ref={railRef} style={{ top: stickyTop }} className="hidden lg:sticky lg:block">
            {rail}
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-2 text-sm">
              {estimatedCost !== undefined && (
                <>
                  <span className="font-semibold text-muted-foreground">Estimated cost:</span>
                  <span className="font-bold text-primary">{estimatedCost} credits</span>
                  {saving > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      {originalCost}
                    </span>
                  )}
                  {costNote && <span className="text-xs text-muted-foreground">{costNote}</span>}
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              {submitButton("flex-1 sm:flex-none")}
            </div>
          </div>
        </div>
      </form>
    </CreateFormContext.Provider>
  )
}

function ChecklistIcon({ state }: { state: ItemState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
        state === "done" && "bg-emerald-500 text-white",
        state === "error" && "bg-destructive text-white",
        state === "todo" && "border-[1.5px] border-dashed border-muted-foreground/50"
      )}
    >
      {state === "done" && <Check className="size-2.5" strokeWidth={4} />}
      {state === "error" && <AlertCircle className="size-3" strokeWidth={3} />}
    </span>
  )
}

/** Clearance under the app's fixed top bar. */
const HEADER_OFFSET = 96
const BOTTOM_GAP = 16

/**
 * `top` for the sticky summary rail. While the rail fits the window it pins just under the
 * app header. When it's taller (a long summary on a short screen), `top` goes negative by the
 * overflow: the rail then scrolls with the page until its bottom edge is in view and pins
 * there — so everything in it is reachable with the page's own scroll, never a nested one.
 */
function useStickyTop(ref: { current: HTMLElement | null }) {
  const [top, setTop] = useState(HEADER_OFFSET)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const overflow = el.offsetHeight + HEADER_OFFSET + BOTTOM_GAP - window.innerHeight
      setTop(overflow > 0 ? HEADER_OFFSET - overflow : HEADER_OFFSET)
    }
    update()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update)
    observer?.observe(el)
    window.addEventListener("resize", update)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [ref])

  return top
}
