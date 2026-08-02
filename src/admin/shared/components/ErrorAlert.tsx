import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { Button } from "@components/ui/button"

interface ErrorAlertProps {
  title?: string
  message: string
  onDismiss?: () => void
  actionLabel?: string
  onAction?: () => void
}

export function ErrorAlert({
  title = "Error",
  message,
  onDismiss,
  actionLabel,
  onAction,
}: ErrorAlertProps) {
  return (
    <Alert className="mb-6 relative border-red-500">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-1 flex flex-col gap-3">
        <p>{message}</p>

        {actionLabel && onAction && (
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              onClick={onAction}
              className="bg-red-300 text-red-600 border border-red-600 hover:bg-red-500/10"
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </AlertDescription>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 text-destructive/60 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  )
}
