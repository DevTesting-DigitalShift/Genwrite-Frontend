import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Card } from "@components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: number; label: string; positive?: boolean }
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "indigo"
  loading?: boolean
}

const colorMap = {
  blue: "text-blue-600 bg-blue-50",
  green: "text-green-600 bg-green-50",
  yellow: "text-yellow-600 bg-yellow-50",
  red: "text-red-600 bg-red-50",
  purple: "text-purple-600 bg-purple-50",
  indigo: "text-indigo-600 bg-indigo-50",
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = "blue",
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>

          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend.positive !== false ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.positive !== false ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">{trend.value}%</span>
              <span className="text-gray-500 ml-1">{trend.label}</span>
            </div>
          )}
        </div>

        {icon && <div className={`p-1 rounded-lg ${colorMap[color]}`}>{icon}</div>}
      </div>
    </Card>
  )
}
