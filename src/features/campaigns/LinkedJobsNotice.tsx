import { AlertTriangle } from "lucide-react"
import type { LinkedJob } from "@/types/campaign"

/**
 * Passive, non-blocking notice for a campaign's linked jobs that are currently not
 * contributing new blogs — posting was turned off, or the job was paused, since it
 * was linked. Nothing errors and nothing already-synced is removed (see
 * jobs/syncCampaignJobBlogs.js) — this is purely visibility into why.
 */
export function LinkedJobsNotice({ linkedJobs }: { linkedJobs: LinkedJob[] | undefined }) {
  const ineligible = (linkedJobs ?? []).filter((job) => !job.eligible)
  if (!ineligible.length) return null

  return (
    <div className="flex gap-2.5 rounded-xl bg-amber-50 p-3 text-amber-900">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="space-y-1 text-xs leading-relaxed">
        {ineligible.map((job) => (
          <p key={job._id}>
            <strong>{job.name}</strong> isn&apos;t posting right now, so its new blogs aren&apos;t
            being added to this campaign. Re-enable posting on that job to resume.
          </p>
        ))}
      </div>
    </div>
  )
}
