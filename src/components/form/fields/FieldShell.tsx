import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Label } from "@components/ui/label"
import { cn } from "@/lib/utils"

interface FieldShellProps {
  htmlFor?: string
  label?: string
  required?: boolean
  description?: string
  error?: string
  /** Put the label and the control on one row instead of stacking them. */
  inline?: boolean
  className?: string
  children: ReactNode
}

/** Id of the error line under the control `htmlFor`, for its `aria-describedby`. */
export const fieldErrorId = (htmlFor: string) => `${htmlFor}-error`

function FieldError({ htmlFor, error }: { htmlFor?: string; error: string }) {
  return (
    <p
      id={htmlFor ? fieldErrorId(htmlFor) : undefined}
      role="alert"
      className="flex items-start gap-1.5 text-xs font-medium text-destructive"
    >
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{error}</span>
    </p>
  )
}

/**
 * Shared label/description/error chrome around a single form control — every RHF*
 * field in this folder renders through this so validation errors look identical
 * everywhere instead of each form re-implementing the same three lines of markup.
 *
 * `data-field-shell` / `data-field-label` let the invalid-submit handler name the first
 * broken field ("Topic: Please enter a topic.") without a per-form path → label map.
 */
export function FieldShell({
  htmlFor,
  label,
  required,
  description,
  error,
  inline,
  className,
  children,
}: FieldShellProps) {
  const labelNode = label && (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
  )

  if (inline) {
    return (
      <div data-field-shell data-field-label={label} className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            {labelNode}
            {description && !error && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="shrink-0">{children}</div>
        </div>
        {error && <FieldError htmlFor={htmlFor} error={error} />}
      </div>
    )
  }

  return (
    <div data-field-shell data-field-label={label} className={cn("space-y-1.5", className)}>
      {labelNode}
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <FieldError htmlFor={htmlFor} error={error} />}
    </div>
  )
}
