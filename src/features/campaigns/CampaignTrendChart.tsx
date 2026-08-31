import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { CampaignWeeklyTrendPoint } from "@/types/campaign"

type TrendDataKey = "clicks" | "impressions" | "avgPosition" | "ctr"

interface CampaignTrendChartProps {
  data: CampaignWeeklyTrendPoint[]
  dataKey: TrendDataKey
  label: string
  color?: string
}

const formatWeekTick = (value: unknown) =>
  new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })

// ctr is a 0-1 fraction (e.g. 0.027) — show it as a percentage everywhere else it's a plain count.
// Guards against a stale/older API response that predates a field (e.g. ctr) — shows a
// dash instead of "NaN%" rather than trusting every response to carry every field.
const formatValue = (dataKey: TrendDataKey) => (value: number) => {
  if (!Number.isFinite(value)) return "—"
  return dataKey === "ctr" ? `${(value * 100).toFixed(1)}%` : value.toLocaleString("en-US")
}

export function CampaignTrendChart({
  data,
  dataKey,
  label,
  color = "hsl(var(--primary))",
}: CampaignTrendChartProps) {
  const formatValueTick = formatValue(dataKey)

  return (
    <div className="rounded-xl bg-background p-4 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="weekStart"
              tickFormatter={formatWeekTick}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
              padding={{ left: 12, right: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
              width={56}
              tickMargin={8}
              allowDecimals={dataKey === "ctr" || dataKey === "avgPosition"}
              tickFormatter={formatValueTick}
            />
            <Tooltip
              labelFormatter={formatWeekTick}
              formatter={(value) => formatValueTick(Number(value))}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
