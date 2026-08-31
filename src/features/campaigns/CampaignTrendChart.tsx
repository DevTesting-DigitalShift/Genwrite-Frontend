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

interface CampaignTrendChartProps {
  data: CampaignWeeklyTrendPoint[]
  dataKey: "clicks" | "impressions" | "avgPosition"
  label: string
  color?: string
}

const formatWeekTick = (value: unknown) =>
  new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })

export function CampaignTrendChart({
  data,
  dataKey,
  label,
  color = "hsl(var(--primary))",
}: CampaignTrendChartProps) {
  return (
    <div className="rounded-xl bg-background p-4 shadow-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="weekStart"
              tickFormatter={formatWeekTick}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              width={32}
              className="fill-muted-foreground"
            />
            <Tooltip
              labelFormatter={formatWeekTick}
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
