import {
  Activity,
  Briefcase,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs"
import type {
  AdminDetailedStatsResponse,
  AdminStatsResponse,
  BlogAnalyticsResponse,
  JobAnalyticsResponse,
  RevenueAnalyticsResponse,
} from "@admin/types/admin"
import { BarChart } from "@admin/shared/charts/BarChart"
import { LineChart } from "@admin/shared/charts/LineChart"
import { PieChart } from "@admin/shared/charts/PieChart"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { StatCard } from "@admin/shared/components/StatCard"
import { getBlogAnalytics } from "../../blogs/api/blogsApi"
import { getJobAnalytics } from "../../jobs/api/jobsApi"
import { getRevenueAnalytics } from "../../revenue/api/revenueApi"
import { getAdminDetailedStats, getAdminStats } from "../api/dashboardApi"

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [detailedStats, setDetailedStats] = useState<AdminDetailedStatsResponse | null>(null)
  const [revenueStats, setRevenueStats] = useState<RevenueAnalyticsResponse | null>(null)
  const [blogData, setBlogData] = useState<BlogAnalyticsResponse | null>(null)
  const [jobData, setJobData] = useState<JobAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "monthly">("monthly")
  const [revenueView, setRevenueView] = useState<"monthly" | "by-plan">("monthly")
  const [templateView, setTemplateView] = useState<"chart" | "list">("chart")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [statsData, detailedData, revenueData, blogs, jobs] = await Promise.all([
          getAdminStats(),
          getAdminDetailedStats(),
          getRevenueAnalytics(),
          getBlogAnalytics(),
          getJobAnalytics(),
        ])

        setStats(statsData)
        setDetailedStats(detailedData)
        setRevenueStats(revenueData)
        setBlogData(blogs)
        setJobData(jobs)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const revenueTrendData =
    revenueStats?.revenueByMonth.map((item) => ({ name: item.month, value: item.revenue })) || []
  const modelData =
    blogData?.modelBreakdown.map((item) => ({ name: item.model, value: item.count })) || []
  const templateData =
    blogData?.templateBreakdown
      .slice(0, 8)
      .map((item) => ({ name: item.template, value: item.count })) || []
  const jobStatusData =
    jobData?.jobsByStatus.map((item) => ({ name: item.status, value: item.count })) || []
  const revenueByPlanData =
    revenueStats?.revenueByPlan.map((item) => ({ name: item.plan, value: item.revenue })) || []

  return (
    <main className="max-container mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
      {error && (
        <ErrorAlert message={error} onAction={() => window.location.reload()} actionLabel="Retry" />
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, no reordering
            <StatCardSkeleton key={i} />
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Total Users"
              value={stats.users?.totalUsers?.toLocaleString() || 0}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              color="blue"
              trend={{ value: 12, label: "growth", positive: true }}
            />
            <StatCard
              label="Total Blogs"
              value={stats.blogs?.totalBlogs?.toLocaleString() || 0}
              icon={<FileText className="w-5 h-5 text-purple-600" />}
              color="purple"
              trend={{ value: 5, label: "this week", positive: true }}
            />
            <StatCard
              label="Revenue"
              value={`$${(stats.transactions?.totalRevenue || 0).toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              color="green"
              trend={{
                value: revenueStats?.revenueGrowth || 0,
                label: "growth",
                positive: (revenueStats?.revenueGrowth || 0) >= 0,
              }}
            />
            <StatCard
              label="MRR"
              value={`$${(revenueStats?.mrr || 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              color="green"
              trend={{ value: 15, label: "vs last mo", positive: true }}
            />
            <StatCard
              label="LTV (Est.)"
              value={
                detailedStats?.financial?.ltv && detailedStats.financial.ltv !== "N/A"
                  ? `$${Number(detailedStats.financial.ltv).toLocaleString()}`
                  : detailedStats?.financial?.arpu
                    ? `$${(detailedStats.financial.arpu * 12).toLocaleString()} (est)`
                    : "$0.00"
              }
              icon={<CreditCard className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
            <StatCard
              label="ARR"
              value={`$${(revenueStats?.arr || 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
              color="yellow"
            />
            <StatCard
              label="Churn Rate"
              value={`${detailedStats?.financial?.churn?.churnRate || 0}%`}
              icon={<Activity className="w-5 h-5 text-red-600" />}
              color="red"
            />
            <StatCard
              label="ARPU"
              value={`$${(detailedStats?.financial?.arpu || 0).toFixed(2)}`}
              icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
              color="indigo"
            />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                Revenue Breakdown
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {revenueView === "monthly"
                  ? "Monthly revenue with growth indicators"
                  : "Revenue distribution by subscription plan"}
              </CardDescription>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setRevenueView("monthly")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  revenueView === "monthly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                By Month
              </button>
              <button
                type="button"
                onClick={() => setRevenueView("by-plan")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  revenueView === "by-plan"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                By Plan
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-linear-to-br from-green-50/50 to-emerald-50/50 rounded-xl p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <LoadingState />
                </div>
              ) : revenueView === "monthly" ? (
                <LineChart
                  data={revenueTrendData}
                  xKey="name"
                  yKey="value"
                  height={300}
                  color="#10B981"
                  yFormatter={(val) => `$${(val / 100).toFixed(2)}`}
                />
              ) : (
                <BarChart
                  data={revenueByPlanData}
                  xKey="name"
                  yKey="value"
                  height={300}
                  color="#10B981"
                  yFormatter={(val) => `$${(val / 100).toFixed(2)}`}
                />
              )}
            </div>

            <div className="space-y-3 max-h-full overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <LoadingState />
                </div>
              ) : revenueView === "monthly" ? (
                revenueStats?.revenueByMonth?.length ? (
                  revenueStats.revenueByMonth.map((monthData, index) => {
                    const monthDate = new Date(`${monthData.month}-01`)
                    const formattedMonth = monthDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })

                    let growth: string | null = null
                    if (index > 0) {
                      const prevRevenue = revenueStats.revenueByMonth[index - 1].revenue
                      growth =
                        prevRevenue > 0
                          ? (((monthData.revenue - prevRevenue) / prevRevenue) * 100).toFixed(2)
                          : null
                    }

                    return (
                      <div
                        key={monthData.month}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formattedMonth}</p>
                          {growth !== null && (
                            <p
                              className={`text-xs mt-1 font-medium ${Number.parseFloat(growth) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {Number.parseFloat(growth) >= 0 ? "↑" : "↓"}{" "}
                              {Math.abs(Number.parseFloat(growth))}% from prev
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${monthData.revenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No monthly revenue data available
                  </p>
                )
              ) : revenueStats?.revenueByPlan?.length ? (
                revenueStats.revenueByPlan.map((plan) => (
                  <div
                    key={plan.plan}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{plan.plan}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {plan.count} subscription{plan.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${(plan.revenue / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ${(plan.revenue / plan.count / 100).toFixed(2)} avg
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No plan data available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-5 h-5" />
                User Growth Analytics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Track user registration and growth trends over time
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-linear-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-200/50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {stats?.users?.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">Registered Users</p>
              </div>

              <div className="bg-linear-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-200/50 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {stats?.users?.activeUsers?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">Active This Month</p>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-200/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    Pro
                  </span>
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  {stats?.users?.totalPro?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">Pro Subscribers</p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-linear-to-br from-indigo-50/50 to-purple-50/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <LoadingState />
                </div>
              ) : (
                <div className="space-y-6">
                  <PieChart
                    data={[
                      { name: "Pro Users", value: stats?.users?.totalPro || 0 },
                      { name: "Basic Users", value: stats?.users?.totalBasic || 0 },
                      {
                        name: "Free Users",
                        value:
                          (stats?.users?.totalUsers || 0) -
                          (stats?.users?.totalPro || 0) -
                          (stats?.users?.totalBasic || 0),
                      },
                    ]}
                    height={240}
                  />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Pro</p>
                      <p className="text-xl font-bold text-purple-600">
                        {stats?.users?.totalPro || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Basic</p>
                      <p className="text-xl font-bold text-blue-600">
                        {stats?.users?.totalBasic || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Free</p>
                      <p className="text-xl font-bold text-gray-600">
                        {(stats?.users?.totalUsers || 0) -
                          (stats?.users?.totalPro || 0) -
                          (stats?.users?.totalBasic || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="max-w-[200px] md:max-w-full">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-5 h-5 md:block hidden" />
                Template Usage Analytics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Most popular blog templates and their usage statistics
              </CardDescription>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTemplateView("chart")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  templateView === "chart"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Chart
              </button>
              <button
                type="button"
                onClick={() => setTemplateView("list")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  templateView === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-linear-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-[280px] sm:h-[320px]">
                <LoadingState />
              </div>
            ) : templateView === "chart" ? (
              <BarChart data={templateData} xKey="name" yKey="value" height={320} color="#A855F7" />
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
                {blogData?.templateBreakdown?.slice(0, 10).map((template, index) => (
                  <div
                    key={template.template}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{template.template}</p>
                        <p className="text-xs text-gray-500">
                          {((template.count / (blogData?.total || 1)) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">{template.count}</p>
                      <p className="text-xs text-gray-500">uses</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Template Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-600">Total Templates Used</span>
                  <span className="font-bold">{blogData?.templateBreakdown?.length || 0}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-sm text-gray-600">Most Popular</span>
                  <span className="font-semibold text-purple-600">
                    {blogData?.templateBreakdown?.[0]?.template || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-3">
                  <span className="text-sm text-gray-600">Top Template Usage</span>
                  <span className="font-bold">{blogData?.templateBreakdown?.[0]?.count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Blogs</span>
                  <span className="font-bold">{blogData?.total || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">Top 3 Templates</h3>
              <div className="space-y-3">
                {blogData?.templateBreakdown?.slice(0, 3).map((template, index) => (
                  <div
                    key={template.template}
                    className="flex items-center gap-3 p-3 bg-white/80 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                      <span className="font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{template.template}</p>
                      <p className="text-xs text-gray-500">{template.count} uses</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Operational Efficiency
            </CardTitle>
            <CardDescription>System performance and job metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Avg. Completion Time
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {jobData?.avgCompletionTimeMinutes || 0} min
                </p>
                <div className="h-1 w-full bg-gray-200 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: "65%" }} />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Job Failure Rate
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">{jobData?.failureRate || 0}%</p>
                <div className="h-1 w-full bg-gray-200 mt-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${jobData?.failureRate || 0}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Active Brands
                </p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {stats?.brands?.totalBrands?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Jobs Successfully Run
                </p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats?.jobs?.totalJobs?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Financial Health
            </CardTitle>
            <CardDescription>Revenue and credit ecosystem metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider">
                  Credit Burn Rate
                </p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {detailedStats?.financial?.creditHealth?.burnRate || 0}%
                </p>
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                  Consumed vs Purchased
                </p>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium uppercase tracking-wider">
                  Repeat Customers
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {revenueStats?.repeatCustomers || 0}
                </p>
                <p className="text-[10px] text-blue-600 mt-1 font-medium">
                  Multi-transaction users
                </p>
              </div>
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-700 font-medium uppercase tracking-wider">
                  Churned This Period
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {detailedStats?.financial?.churn?.cancelledInPeriod || 0}
                </p>
                <p className="text-[10px] text-purple-600 mt-1 font-medium">
                  Subscription cancellations
                </p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">
                  Paid User ARPU
                </p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  ${(detailedStats?.financial?.arpu || 0).toFixed(2)}
                </p>
                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                  Avg Revenue Per Paid User
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            System Analytics
          </CardTitle>
          <CardDescription>Comprehensive analytics across all modules</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Analytics Dashboard
              </div>
              <TabsList className="bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 h-auto w-full sm:w-auto grid grid-cols-4 sm:flex">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border-gray-200 border border-transparent transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="content"
                  className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border-gray-200 border border-transparent transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">Content</span>
                </TabsTrigger>
                <TabsTrigger
                  value="jobs"
                  className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border-gray-200 border border-transparent transition-all"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">Jobs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="revenue"
                  className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border-gray-200 border border-transparent transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">Revenue</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Branded Blogs</h4>
                  <p className="text-3xl font-bold text-gray-900">{blogData?.brandedBlogs || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {blogData?.total
                      ? `${((blogData.brandedBlogs / blogData.total) * 100).toFixed(1)}% of total`
                      : "0%"}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Job Failure Rate</h4>
                  <p className="text-3xl font-bold text-gray-900">{jobData?.failureRate || 0}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Avg: {jobData?.avgCompletionTimeMinutes || 0} min
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Repeat Customers</h4>
                  <p className="text-3xl font-bold text-gray-900">
                    {revenueStats?.repeatCustomers || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ARR: ${revenueStats?.arr.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">AI Model Distribution</h3>
                    <p className="text-sm text-gray-500">Usage breakdown by AI model</p>
                  </div>
                  <PieChart data={modelData} height={300} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Job Status</h3>
                    <p className="text-sm text-gray-500">Distribution of job statuses</p>
                  </div>
                  <PieChart data={jobStatusData} height={300} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top Templates</h3>
                    <p className="text-sm text-gray-500">Most used blog templates</p>
                  </div>
                  <BarChart
                    data={templateData}
                    xKey="name"
                    yKey="value"
                    height={400}
                    color="#8B5CF6"
                    rotateLabels
                  />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
                    <p className="text-sm text-gray-500">Most popular blog categories</p>
                  </div>
                  <BarChart
                    data={
                      blogData?.categoryBreakdown
                        .slice(0, 8)
                        .map((item) => ({ name: item.category, value: item.count })) || []
                    }
                    xKey="name"
                    yKey="value"
                    height={400}
                    color="#10B981"
                    rotateLabels
                  />
                </div>
              </div>

              {blogData?.postedBlogs !== undefined && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Posted Blogs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Posted to Platforms</p>
                      <p className="text-4xl font-bold text-gray-900">{blogData.postedBlogs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Platform Distribution</p>
                      <div className="space-y-3">
                        {blogData.platformBreakdown?.map((platform) => (
                          <div
                            key={platform.platform}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-gray-700 capitalize font-medium">
                              {platform.platform}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {platform.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Jobs by Type</h3>
                    <p className="text-sm text-gray-500">Distribution by job type</p>
                  </div>
                  <BarChart
                    data={
                      jobData?.jobsByType.map((item) => ({
                        name: item.type || "Unknown",
                        value: item.count,
                      })) || []
                    }
                    xKey="name"
                    yKey="value"
                    height={300}
                    color="#F59E0B"
                  />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top Job Creators</h3>
                    <p className="text-sm text-gray-500">Users with most jobs</p>
                  </div>
                  <BarChart
                    data={
                      jobData?.jobsByUser
                        .slice(0, 8)
                        .map((item) => ({ name: item.user || "Unknown", value: item.jobCount })) ||
                      []
                    }
                    xKey="name"
                    yKey="value"
                    height={300}
                    color="#6366F1"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{jobData?.totalJobs || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Blogs Created by Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {jobData?.totalBlogsCreatedByJobs || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Avg Completion Time</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {jobData?.avgCompletionTimeMinutes || 0}m
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-linear-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-1">Total Transactions</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {revenueStats?.transactions?.total || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-200/50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">Successful</p>
                      <p className="text-2xl font-bold text-green-900">
                        {revenueStats?.transactions?.successful || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-green-200/50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-900">
                        {revenueStats?.transactions?.failed || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-red-200/50 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-yellow-600 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {revenueStats?.transactions?.pending || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-200/50 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="by-plan" className="space-y-4">
                <TabsList className="bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
                  <TabsTrigger
                    value="by-plan"
                    className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-sm font-medium"
                  >
                    Revenue by Plan
                  </TabsTrigger>
                  <TabsTrigger
                    value="by-month"
                    className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-sm font-medium"
                  >
                    Revenue by Month
                  </TabsTrigger>
                  <TabsTrigger
                    value="arr"
                    className="px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-sm font-medium"
                  >
                    ARR
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="by-plan" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue by Plan</h3>
                        <p className="text-sm text-gray-500">
                          Revenue breakdown by subscription plan
                        </p>
                      </div>
                      <BarChart
                        data={revenueByPlanData}
                        xKey="name"
                        yKey="value"
                        height={300}
                        color="#10B981"
                        yFormatter={(val) => `$${(val / 100).toFixed(2)}`}
                      />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h3>
                      <div className="space-y-4">
                        {revenueStats?.revenueByPlan?.length ? (
                          revenueStats.revenueByPlan.map((plan) => (
                            <div
                              key={plan.plan}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900 capitalize">
                                  {plan.plan}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {plan.count} subscription{plan.count !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  ${plan.revenue.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-8">
                            No plan data available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="by-month" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Monthly Revenue Trend
                        </h3>
                        <p className="text-sm text-gray-500">Revenue performance over time</p>
                      </div>
                      <LineChart
                        data={revenueTrendData}
                        xKey="name"
                        yKey="value"
                        height={300}
                        color="#10B981"
                        yFormatter={(val) => `$${(val / 100).toFixed(2)}`}
                      />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Monthly Breakdown
                      </h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {revenueStats?.revenueByMonth?.length ? (
                          revenueStats.revenueByMonth.map((monthData, index) => {
                            const monthDate = new Date(`${monthData.month}-01`)
                            const formattedMonth = monthDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                            })

                            let growth: string | null = null
                            if (index > 0) {
                              const prevRevenue = revenueStats.revenueByMonth[index - 1].revenue
                              growth =
                                prevRevenue > 0
                                  ? (
                                      ((monthData.revenue - prevRevenue) / prevRevenue) *
                                      100
                                    ).toFixed(2)
                                  : null
                            }

                            return (
                              <div
                                key={monthData.month}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formattedMonth}
                                  </p>
                                  {growth !== null && (
                                    <p
                                      className={`text-xs mt-1 ${Number.parseFloat(growth) >= 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {Number.parseFloat(growth) >= 0 ? "↑" : "↓"}{" "}
                                      {Math.abs(Number.parseFloat(growth))}% from prev
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    ${monthData.revenue.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-8">
                            No monthly revenue data available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="arr" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Metrics</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <span className="text-sm text-gray-600">MRR</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${revenueStats?.mrr.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <span className="text-sm text-gray-600">ARR</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${revenueStats?.arr.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Revenue Growth</span>
                          <span
                            className={`text-lg font-bold ${(revenueStats?.revenueGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {revenueStats?.revenueGrowth?.toFixed(2) || "0.00"}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Repeat Customers</span>
                          <span className="text-lg font-bold text-gray-900">
                            {revenueStats?.repeatCustomers || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Period</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-600 mb-2">Date Range</p>
                          <p className="text-sm text-gray-700">
                            {revenueStats?.dateRange?.startDate
                              ? new Date(revenueStats.dateRange.startDate).toLocaleDateString(
                                  "en-US",
                                  { year: "numeric", month: "short", day: "numeric" }
                                )
                              : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 my-1">to</p>
                          <p className="text-sm text-gray-700">
                            {revenueStats?.dateRange?.endDate
                              ? new Date(revenueStats.dateRange.endDate).toLocaleDateString(
                                  "en-US",
                                  { year: "numeric", month: "short", day: "numeric" }
                                )
                              : "N/A"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs font-medium text-green-600 mb-1">MRR</p>
                            <p className="text-xl font-bold text-green-900">
                              ${revenueStats?.mrr.toFixed(2) || "0.00"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Monthly</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-xs font-medium text-purple-600 mb-1">ARR</p>
                            <p className="text-xl font-bold text-purple-900">
                              ${revenueStats?.arr.toFixed(2) || "0.00"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Annually</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              Content Activity
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Key content metrics overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-linear-to-br from-sky-50/50 to-indigo-50/50 rounded-xl p-2 sm:p-4 -mx-2">
              <BarChart
                data={[
                  { name: "Total Blogs", value: stats?.blogs?.totalBlogs || 0 },
                  { name: "This Month", value: stats?.blogs?.generatedThisMonth || 0 },
                  { name: "Branded", value: blogData?.brandedBlogs || 0 },
                  { name: "Active Creators", value: detailedStats?.activeCreatorsCount || 0 },
                  { name: "Brands", value: stats?.brands?.totalBrands || 0 },
                ]}
                xKey="name"
                yKey="value"
                height={280}
                color="#87cefa"
                rotateLabels
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Platform Health</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Key system indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Active Creators</p>
                  <p className="text-xs sm:text-sm text-gray-500">Users creating content</p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">
                {detailedStats?.activeCreatorsCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg text-green-600">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Blog Generation</p>
                  <p className="text-xs sm:text-sm text-gray-500">Today&apos;s volume</p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">
                {stats?.blogs?.generatedToday || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg text-purple-600">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Successful Payments</p>
                  <p className="text-xs sm:text-sm text-gray-500">Total processed</p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">
                {stats?.transactions?.successfulTransactions || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Blog Creation Trends</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {trendPeriod === "daily" ? "Last 30 days" : "Last 12 months"}
                </CardDescription>
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTrendPeriod("daily")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    trendPeriod === "daily"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setTrendPeriod("monthly")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    trendPeriod === "monthly"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-linear-to-br from-pink-50/50 to-purple-50/50 rounded-xl p-2 sm:p-4 -mx-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-[280px]">
                  <LoadingState />
                </div>
              ) : (
                <BarChart
                  data={
                    trendPeriod === "daily"
                      ? blogData?.trends?.daily?.map((item) => ({
                          name: new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          }),
                          value: item.count,
                        })) || []
                      : blogData?.trends?.monthly?.map((item) => ({
                          name: new Date(`${item.month}-01`).toLocaleDateString("en-US", {
                            month: "short",
                            year: "2-digit",
                          }),
                          value: item.count,
                        })) || []
                  }
                  xKey="name"
                  yKey="value"
                  height={280}
                  color="#DFC5FE"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
