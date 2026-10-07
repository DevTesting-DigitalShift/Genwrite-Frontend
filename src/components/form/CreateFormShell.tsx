import type { FormEventHandler, ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@components/ui/button"

interface CreateFormShellProps {
  title: string
  description?: string
  onCancel: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel: string
  isSubmitting?: boolean
  /** Credits the request will cost; omit for forms that are free. */
  estimatedCost?: number
  /** Short qualifier next to the cost, e.g. "(-50% off)" or "3 blogs". */
  costNote?: ReactNode
  children: ReactNode
}

/**
 * Page chrome for every single-page create form: a back button and title, one scrolling
 * column that works at phone width, and a sticky action bar that keeps the credit estimate
 * and the submit button in reach however long the form gets.
 */
export function CreateFormShell({
  title,
  description,
  onCancel,
  onSubmit,
  submitLabel,
  isSubmitting,
  estimatedCost,
  costNote,
  children,
}: CreateFormShellProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex w-full max-w-3xl flex-col">
      <header className="flex items-start gap-3 px-4 pb-4 pt-6 sm:px-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Go back"
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </header>

      <div className="space-y-4 px-4 pb-28 sm:px-0">{children}</div>

      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:rounded-t-xl sm:border sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
