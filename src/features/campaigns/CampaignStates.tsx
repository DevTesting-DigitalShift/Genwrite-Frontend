import type { ComponentType, ReactNode } from "react"
import { AlertCircle, Loader2, RotateCw } from "lucide-react"
import { Button } from "@components/ui/button"

/** Spinner sized for a panel body rather than a whole page. */
export function PanelLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

/** "Nothing here yet" — a state the user reached by doing nothing wrong. */
export function PanelEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}

/** Something failed — always paired with a way to try again. */
export function PanelError({
  title = "Couldn't load this",
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
          <RotateCw className="size-3.5" /> Try again
        </Button>
      )}
    </div>
  )
}
