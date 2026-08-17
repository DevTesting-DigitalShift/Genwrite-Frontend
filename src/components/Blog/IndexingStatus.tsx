import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  Send,
  Link2Off,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useIndexingStatusQuery, useRequestIndexingMutation } from "@api/queries/gscQueries"

interface PostingIndexing {
  lastInspectedAt?: string | null
  coverageState?: string | null
  lastRequestedAt?: string | null
  requestCount?: number
}

interface IndexingStatusProps {
  /** Blog this posting belongs to — sent when requesting indexing so the backend can track it */
  blogId?: string
  /** The live URL of the published post */
  pageUrl?: string
  /** Indexing counters already stored on the posting, shown without an extra API call */
  indexing?: PostingIndexing
  /** Whether the account has a Search Console connection to query */
  hasGscAccess: boolean
  /** Watchers of a shared workspace can read status but must not spend the owner's quota */
  canRequest?: boolean
}

/** "3 days ago" style label — avoids pulling in a dayjs plugin for two strings. */
const formatRelative = (value?: string | null): string | null => {
  if (!value) return null
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return null

  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? "a month ago" : `${months} months ago`
}

/**
 * Maps Search Console's inspection verdict to how we present it. `coverageState`
 * carries Google's own wording, which is more useful to the user than anything
 * we could paraphrase, so it becomes the label whenever it is present.
 */
const resolveStatus = (result?: { verdict?: string; coverageState?: string }) => {
  const label = result?.coverageState

  switch (result?.verdict) {
    case "PASS":
      return {
        icon: CheckCircle2,
        label: label || "Indexed",
        tone: "text-emerald-600",
        dot: "bg-emerald-500",
        isIndexed: true,
      }
    case "PARTIAL":
      return {
        icon: AlertTriangle,
        label: label || "Indexed with issues",
        tone: "text-amber-600",
        dot: "bg-amber-500",
        isIndexed: true,
      }
    case "FAIL":
      return {
        icon: XCircle,
        label: label || "Not indexed",
        tone: "text-red-600",
        dot: "bg-red-500",
        isIndexed: false,
      }
    default:
      return {
        icon: HelpCircle,
        label: label || "Status unknown",
        tone: "text-gray-500",
        dot: "bg-gray-400",
        isIndexed: false,
      }
  }
}

/**
 * Live Search Console index status for a single published URL, with a
 * best-effort "ask Google to crawl this" action.
 */
const IndexingStatus: React.FC<IndexingStatusProps> = ({
  blogId,
  pageUrl,
  indexing,
  hasGscAccess,
  canRequest = true,
}) => {
  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useIndexingStatusQuery(pageUrl, { enabled: hasGscAccess })

  const requestIndexingMutation = useRequestIndexingMutation()

  if (!pageUrl) return null

  // No connection — offer the fix rather than an error the user can't act on.
  if (!hasGscAccess) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-2 mt-2 border-t border-gray-100">
        <Link2Off className="w-3 h-3 shrink-0" />
        <span>Index status needs</span>
        <Link to="/search-console" className="text-blue-600 hover:underline font-medium">
          Search Console
        </Link>
      </div>
    )
  }

  const status = resolveStatus(result)
  const StatusIcon = status.icon
  const lastCrawled = formatRelative(result?.lastCrawlTime)
  const lastRequested = formatRelative(indexing?.lastRequestedAt)
  const requestCount = indexing?.requestCount || 0
  const isRequesting = requestIndexingMutation.isPending

  return (
    <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          Checking index status...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400 truncate" title={(error as Error)?.message}>
            Status unavailable
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-[11px] text-blue-600 hover:underline font-medium shrink-0"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 min-w-0 ${status.tone}`}>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold truncate" title={status.label}>
              {status.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="tooltip tooltip-left shrink-0 text-gray-300 hover:text-gray-600 transition-colors disabled:opacity-50"
            data-tip="Re-check status"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {lastCrawled && (
        <p className="text-[10px] text-gray-400">Last crawled by Google {lastCrawled}</p>
      )}

      {canRequest && (
        <>
          <button
            type="button"
            onClick={() => requestIndexingMutation.mutate({ blogId, pageUrl })}
            disabled={isRequesting}
            className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              status.isIndexed
                ? "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800"
                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                {status.isIndexed ? "Request re-crawl" : "Request indexing"}
              </>
            )}
          </button>

          {/* Set expectations honestly — Google gives no guarantee or timeline. */}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {requestCount > 0
              ? `Requested ${requestCount}${requestCount === 1 ? " time" : " times"}${
                  lastRequested ? `, last ${lastRequested}` : ""
                }. Google decides when to crawl.`
              : "Asks Google to crawl this page sooner. Not a guarantee."}
          </p>
        </>
      )}
    </div>
  )
}

export default IndexingStatus
