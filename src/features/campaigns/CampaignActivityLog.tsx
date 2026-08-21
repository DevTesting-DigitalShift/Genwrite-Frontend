import { AlertTriangle, CheckCircle2, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { campaignsQuery } from "@api/Campaign/Campaign.query"
import { PanelEmpty, PanelError, PanelLoading } from "./CampaignStates"
import { getFriendlyError } from "@utils/friendlyError"

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

const ACTION_LABEL: Record<string, string> = {
  rewrite: "Rewrote a section",
  repost: "Reposted to CMS",
}

interface CampaignActivityLogProps {
  campaignId: string
  /** blogId → title, so each entry names the blog it acted on. */
  blogTitles: Record<string, string>
}

/** Audit trail of automated rewrites and reposts — successes and failures alike. */
export function CampaignActivityLog({ campaignId, blogTitles }: CampaignActivityLogProps) {
  const { data: actions = [], isLoading, isError, error, refetch } = campaignsQuery.useActions(campaignId)

  if (isLoading) return <PanelLoading label="Loading activity…" />

  if (isError) {
    return (
      <PanelError
        title="Couldn't load the activity log"
        description={getFriendlyError(error, "campaign")}
        onRetry={() => refetch()}
      />
    )
  }

  if (actions.length === 0) {
    return (
      <PanelEmpty
        icon={History}
        title="No automated actions yet"
        description="Rewrites and reposts triggered by this campaign's automation will show up here."
      />
    )
  }

  return (
    <div className="space-y-2">
      {actions.map((entry) => {
        const failed = entry.status === "failed"
        const Icon = failed ? AlertTriangle : CheckCircle2

        return (
          <div key={entry._id} className="flex gap-3 rounded-xl bg-background p-4 shadow-sm">
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                failed ? "text-destructive" : "text-emerald-600"
              )}
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium">
                  {ACTION_LABEL[entry.action] ?? entry.action}
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {blogTitles[entry.blogId] ?? "Untitled blog"}
                {entry.creditsCost > 0 && ` · ${entry.creditsCost} credits`}
              </p>
              {failed && entry.error && (
                <p className="text-xs text-destructive">{entry.error}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
