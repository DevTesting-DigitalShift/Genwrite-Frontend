import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@components/ui/card"

interface BarChartProps {
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  color?: string
  height?: number
  className?: string
  yFormatter?: (value: number) => string
  rotateLabels?: boolean
}

export function BarChart({
  data,
  xKey,
  yKey,
  color = "#3B82F6",
  height = 300,
  className,
  yFormatter,
  rotateLabels = false,
}: BarChartProps) {
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
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: rotateLabels ? 60 : 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            angle={rotateLabels ? -45 : 0}
            textAnchor={rotateLabels ? "end" : "middle"}
            height={rotateLabels ? 80 : 30}
            dy={rotateLabels ? 0 : 10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={yFormatter}
          />
          <Tooltip
            cursor={{ fill: "#F3F4F6" }}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={50} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
