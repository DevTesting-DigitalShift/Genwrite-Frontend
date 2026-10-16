import { Loader2, TriangleAlert } from "lucide-react"

/**
 * Shown in place of the model/price controls while the backend's catalogue isn't in hand yet,
 * or couldn't be fetched and there's no cached copy. Prices exist only on the backend, so there
 * is nothing to show until then — and nothing is guessed.
 */
export function PricingNotice({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  if (!failed) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading models and prices…
      </p>
    )
  }
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
    >
      <TriangleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
      <span className="min-w-0 flex-1">
        Prices couldn't be loaded, so models aren't available right now.
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50"
      >
        Try again
      </button>
    </div>
  )
}
