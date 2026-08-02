import { useId } from "react"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@components/ui/card"

interface AreaChartProps {
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  color?: string
  height?: number
  className?: string
  yFormatter?: (value: number) => string
}

export function AreaChart({
  data,
  xKey,
  yKey,
  color = "#8884d8",
  height = 300,
  className,
  yFormatter,
}: AreaChartProps) {
  const uniqueId = useId()
  const gradientId = `area-gradient-${uniqueId}`

  if (!data?.length) {
    return (
      <Card
        className={`flex items-center justify-center p-6 ${className ?? ""}`}
        style={{ height }}
      >
        <p className="text-gray-500">No data available</p>
      </Card>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={yFormatter}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
