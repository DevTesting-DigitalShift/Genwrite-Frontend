import { Link } from "react-router-dom"
import type { CampaignBlogBreakdownRow } from "@/types/campaign"

const formatNumber = (value: number) => value.toLocaleString("en-US")
// Guards against a stale/older API response that predates this field (e.g. ctr) — a
// dash reads honestly as "no data" instead of "NaN%".
const formatCtr = (value: number) => (Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—")

export function CampaignBlogBreakdownTable({ rows }: { rows: CampaignBlogBreakdownRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-background shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Blog</th>
            <th className="px-4 py-3 text-right">Clicks</th>
            <th className="px-4 py-3 text-right">Impressions</th>
            <th className="px-4 py-3 text-right">Avg. position</th>
            <th className="px-4 py-3 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.blogId} className="border-b last:border-0">
              <td className="max-w-xs truncate px-4 py-3">
                <Link
                  to={`/blog-editor/${row.blogId}`}
                  className="hover:text-primary hover:underline"
                  title={row.title}
                >
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-right">{formatNumber(row.clicks)}</td>
              <td className="px-4 py-3 text-right">{formatNumber(row.impressions)}</td>
              <td className="px-4 py-3 text-right">{row.avgPosition || "—"}</td>
              <td className="px-4 py-3 text-right">{formatCtr(row.ctr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
