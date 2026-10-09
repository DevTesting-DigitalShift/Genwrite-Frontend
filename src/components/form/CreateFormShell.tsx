import type { FormEventHandler, ReactNode } from "react"
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react"
import { Button } from "@components/ui/button"
import { cn } from "@/lib/utils"

export interface CostLine {
  label: string
  credits: number
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
  /** Short qualifier next to the cost, e.g. "(-50% off)" or "3 blogs". */
  costNote?: ReactNode
  /** Itemized charges behind `estimatedCost` (writing, each enabled feature, images). Desktop only. */
  costLines?: CostLine[]
  /** What's currently selected in the Template section, e.g. "Classic" or "3 templates". */
  selectionSummary?: string
  children: ReactNode
}

/**
 * Page chrome for every single-page create form.
 *
 * At phone width it's one scrolling column with a sticky bottom action bar — the layout the
 * old step modals used, minus the steps. From `lg` up there's room for more: the sections run
 * down a constrained reading column on the left, and the cost/submit controls move into a
 * summary card that sticks to the top of the right rail, visible the whole time rather than
 * pinned under the fold.
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
  costNote,
  costLines,
  selectionSummary,
  children,
}: CreateFormShellProps) {
  const summary = (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        Ready to generate
      </div>

      {selectionSummary && (
        <p className="truncate text-sm text-muted-foreground">
          Template: <span className="font-medium text-foreground">{selectionSummary}</span>
        </p>
      )}

      {estimatedCost !== undefined && (
        <div className="space-y-2 rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Estimated cost</p>

          {costLines && costLines.length > 0 && (
            <dl className="space-y-1 border-b border-border/70 pb-2 text-xs">
              {costLines.map((line) => (
                <div key={line.label} className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="tabular-nums">{line.credits}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary tabular-nums">{estimatedCost}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </p>
          {costNote && <p className="text-xs text-muted-foreground">{costNote}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {isSubmitting ? (submittingLabel ?? "Working...") : submitLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
    >
      <header className="mb-6 flex items-start gap-3">
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
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
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

        <aside className="hidden lg:sticky lg:top-10 lg:block">{summary}</aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            {estimatedCost !== undefined && (
              <>
                <span className="font-semibold text-muted-foreground">Estimated cost:</span>
                <span className="font-bold text-primary">{estimatedCost} credits</span>
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
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {isSubmitting && <LoaderCircle className="animate-spin" />}
              {isSubmitting ? (submittingLabel ?? "Working...") : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
