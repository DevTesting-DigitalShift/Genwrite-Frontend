import type { ReactNode } from "react"
import { Label } from "@components/ui/label"
import { cn } from "@/lib/utils"

interface FieldShellProps {
  htmlFor?: string
  label?: string
  required?: boolean
  description?: string
  error?: string
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
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
