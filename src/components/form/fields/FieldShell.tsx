import type { ReactNode } from "react"
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

/**
 * Shared label/description/error chrome around a single form control — every RHF*
 * field in this folder renders through this so validation errors look identical
 * everywhere instead of each form re-implementing the same three lines of markup.
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
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            {labelNode}
            {description && !error && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="shrink-0">{children}</div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {labelNode}
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
