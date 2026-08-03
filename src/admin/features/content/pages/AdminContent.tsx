import { Calendar, FileText, TrendingUp } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@components/ui/badge"
import { Progress } from "@components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs"
import type { BlogAnalyticsResponse } from "@admin/types/admin"
import { BarChart } from "@admin/shared/charts/BarChart"
import { LineChart } from "@admin/shared/charts/LineChart"
import { PieChart } from "@admin/shared/charts/PieChart"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { getBlogAnalytics } from "../../blogs/api/blogsApi"

type DateRange = "30d" | "90d" | "all"

export default function AdminContent() {
  const [blogData, setBlogData] = useState<BlogAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>("30d")

  const fetchBlogAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const endDate = new Date()
      const startDate = new Date()
      if (dateRange === "30d") {
        startDate.setDate(startDate.getDate() - 30)
      } else if (dateRange === "90d") {
        startDate.setDate(startDate.getDate() - 90)
      } else {
        startDate.setFullYear(2025, 7, 1)
      }

      const data = await getBlogAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      setBlogData(data)
    } catch (err) {
      console.error("Failed to fetch blog analytics:", err)
      setError(err instanceof Error ? err.message : "Failed to load blog analytics")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchBlogAnalytics()
  }, [fetchBlogAnalytics])

  if (isLoading) return <LoadingState />

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <ErrorAlert message={error} onAction={fetchBlogAnalytics} />
      </div>
    )
  }

  const modelData =
    blogData?.modelBreakdown.map((item) => ({ name: item.model, value: item.count })) || []
  const templateData =
    blogData?.templateBreakdown.map((item) => ({ name: item.template, value: item.count })) || []
  const categoryData =
    blogData?.categoryBreakdown
      .slice(0, 10)
      .map((item) => ({ name: item.category, value: item.count })) || []
  const dailyTrendData =
    blogData?.trends.daily.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: item.count,
    })) || []
  const monthlyTrendData =
    blogData?.trends.monthly.map((item) => ({ month: item.month, count: item.count })) || []

  return (
    <main className="max-container mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Content Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Comprehensive blog content insights and statistics
          </p>
        </div>
        <Select
          value={dateRange}
          onValueChange={(value: string) => setDateRange(value as DateRange)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Total Blogs</span>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {blogData?.total.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Branded</span>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {blogData?.brandedBlogs.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {blogData?.total
              ? `${((blogData.brandedBlogs / blogData.total) * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">AI Models</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {blogData?.modelBreakdown.length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Templates</span>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {blogData?.templateBreakdown.length}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-10 sm:h-12 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-500 w-full sm:w-auto">
            <TabsTrigger
              value="overview"
              className="inline-flex items-center justify-center rounded-lg px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="inline-flex items-center justify-center rounded-lg px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="inline-flex items-center justify-center rounded-lg px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
            >
              <Badge className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span>Categories</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  AI Model Distribution
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">Usage breakdown by AI model</p>
              </div>
              <PieChart data={modelData} height={280} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Templates</h3>
                <p className="text-xs sm:text-sm text-gray-500">Most used blog templates</p>
              </div>
              <BarChart
                data={templateData.slice(0, 8)}
                xKey="name"
                yKey="value"
                height={300}
                color="#8B5CF6"
                rotateLabels
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 sm:space-y-6">
          <Tabs defaultValue="daily" className="space-y-4">
            <div className="flex justify-end">
              <TabsList className="inline-flex h-10 items-center rounded-lg bg-gray-100 p-1">
                <TabsTrigger
                  value="daily"
                  className="px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  Daily
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  Monthly
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="daily">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Daily Blog Creation
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">Blogs created per day</p>
                </div>
                <LineChart data={dailyTrendData} xKey="date" yKey="count" height={280} />
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Monthly Blog Creation
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">Blogs created per month</p>
                </div>
                <BarChart
                  data={monthlyTrendData}
                  xKey="month"
                  yKey="count"
                  height={280}
                  color="#3B82F6"
                />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Categories</h3>
              <p className="text-xs sm:text-sm text-gray-500">Most popular blog categories</p>
            </div>
            <BarChart
              data={categoryData}
              xKey="name"
              yKey="value"
              height={420}
              color="#10B981"
              rotateLabels
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Categories</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {blogData?.categoryBreakdown.map((category) => (
                <div
                  key={category.category}
                  className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm sm:text-base text-gray-900 font-medium">
                    {category.category}
                  </span>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Badge className="text-xs bg-gray-100 text-gray-700 border border-gray-200">
                      {category.count} blogs
                    </Badge>
                    <div className="w-24 sm:w-32">
                      <Progress
                        value={(category.count / (blogData?.total || 1)) * 100}
                        className="h-2"
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {((category.count / (blogData?.total || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {blogData?.postedBlogs !== undefined && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Posted Blogs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Posted to Platforms</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600">{blogData.postedBlogs}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-medium">
                Platform Distribution
              </p>
              <div className="space-y-2 sm:space-y-3">
                {blogData.platformBreakdown?.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-700 capitalize font-medium">
                      {platform.platform}
                    </span>
                    <Badge className="text-xs sm:text-sm bg-gray-100 text-gray-700 border border-gray-200">
                      {platform.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
