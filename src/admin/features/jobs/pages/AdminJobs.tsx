import { Briefcase, CheckCircle, Clock, FileText, Users, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import type { JobAnalyticsResponse } from "@admin/types/admin"
import { BarChart } from "@admin/shared/charts/BarChart"
import { PieChart } from "@admin/shared/charts/PieChart"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { StatCard } from "@admin/shared/components/StatCard"
import { getJobAnalytics } from "../api/jobsApi"

export default function AdminJobs() {
  const [data, setData] = useState<JobAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getJobAnalytics()
      setData(response)
    } catch (err) {
      console.error("Failed to fetch job analytics:", err)
      setError(err instanceof Error ? err.message : "Failed to load analytics data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) return <LoadingState />

  if (error || !data) {
    return (
      <div className="flex-1 p-4 sm:p-8">
        <ErrorAlert
          message={error || "No data available"}
          onAction={() => fetchData()}
          actionLabel="Retry"
        />
      </div>
    )
  }

  const statusData =
    data.jobsByStatus?.map((item) => ({ name: item.status || "Unknown", value: item.count })) || []
  const typeData =
    data.jobsByType?.map((item) => ({ name: item.type || "Default", value: item.count })) || []
  const userJobsData =
    data.jobsByUser
      ?.filter((item) => item.user)
      ?.slice(0, 10)
      ?.map((item) => ({ name: item.user?.split("@")[0] || "Unknown", value: item.jobCount })) || []

  const activeJobs = data.jobsByStatus?.find((s) => s.status === "active")?.count || 0
  const stoppedJobs = data.jobsByStatus?.find((s) => s.status === "stop")?.count || 0

  return (
    <main className="max-container mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Total Jobs"
          value={data.totalJobs}
          icon={<Briefcase className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Active Jobs"
          value={activeJobs}
          icon={<CheckCircle className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          label="Stopped Jobs"
          value={stoppedJobs}
          icon={<XCircle className="w-4 h-4" />}
          color="red"
        />
        <StatCard
          label="Blogs Created"
          value={data.totalBlogsCreatedByJobs || 0}
          icon={<FileText className="w-4 h-4" />}
          color="purple"
        />
        <StatCard
          label="Avg. Time (min)"
          value={data.avgCompletionTimeMinutes || "0.00"}
          icon={<Clock className="w-4 h-4" />}
          color="yellow"
        />
        <StatCard
          label="Failure Rate"
          value={`${data.failureRate || 0}%`}
          icon={<XCircle className="w-4 h-4" />}
          color={data.failureRate > 10 ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Job Status Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Active vs Stopped jobs</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <PieChart data={statusData} height={280} colors={["#10B981", "#EF4444", "#F59E0B"]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Job Types</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Distribution of job types
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <BarChart data={typeData} xKey="name" yKey="value" height={280} color="#3B82F6" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg sm:text-xl">Top Users by Job Count</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Users with the most scheduled jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="bg-linear-to-br from-indigo-50/50 to-purple-50/50 rounded-xl p-4 -mx-2">
            <BarChart data={userJobsData} xKey="name" yKey="value" height={300} color="#6366F1" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Performance Summary</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Key job metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Jobs Run</span>
              <span className="text-lg font-bold text-gray-900">{data.totalJobs}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Blogs Generated</span>
              <span className="text-lg font-bold text-gray-900">
                {data.totalBlogsCreatedByJobs || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Avg. Blogs per Job</span>
              <span className="text-lg font-bold text-gray-900">
                {data.totalJobs > 0
                  ? ((data.totalBlogsCreatedByJobs || 0) / data.totalJobs).toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-lg font-bold text-green-600">
                {(100 - (data.failureRate || 0)).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Date Range</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Analytics period</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(data.dateRange.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(data.dateRange.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-blue-100">
                <p className="text-sm text-gray-600 mb-1">Total Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.ceil(
                    (new Date(data.dateRange.endDate).getTime() -
                      new Date(data.dateRange.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
