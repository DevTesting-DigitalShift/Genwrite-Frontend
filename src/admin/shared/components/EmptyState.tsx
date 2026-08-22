import { Inbox } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@components/ui/button"

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
  height?: string | number
}

export function EmptyState({
  title = "No data available",
  description = "There is no data to display at this time.",
  icon,
  actionLabel,
  onAction,
  height = "300px",
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-lg border border-dashed border-gray-200"
      style={{ minHeight: height }}
    >
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        {icon || <Inbox className="w-8 h-8 text-gray-400" />}
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
