import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card } from "@components/ui/card"

interface PieChartProps {
  data: Array<{ name: string; value: number }>
  colors?: string[]
  height?: number
  className?: string
}

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1"]

export function PieChart({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  className,
}: PieChartProps) {
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
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
