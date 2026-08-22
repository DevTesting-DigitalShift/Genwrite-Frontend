import { Award, Calendar, CalendarDays, FileText, Layers, Upload, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs"
import type { BlogAnalyticsResponse } from "@admin/types/admin"
import { BarChart } from "@admin/shared/charts/BarChart"
import { LineChart } from "@admin/shared/charts/LineChart"
import { PieChart } from "@admin/shared/charts/PieChart"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { StatCard } from "@admin/shared/components/StatCard"
import { getBlogAnalytics } from "../api/blogsApi"

export default function AdminBlogs() {
  const [data, setData] = useState<BlogAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getBlogAnalytics()
      setData(response)
    } catch (err) {
      console.error("Failed to fetch blog analytics:", err)
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

  const modelData = data.modelBreakdown.map((item) => ({ name: item.model, value: item.count }))
  const templateData = data.templateBreakdown.map((item) => ({
    name: item.template,
    value: item.count,
  }))
  const dailyTrendData = data.trends.daily.map((item) => ({
    date: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: item.count,
  }))
  const monthlyTrendData = data.trends.monthly.map((item) => ({
    name: item.month,
    value: item.count,
  }))

  return (
    <main className="max-container mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Total Blogs"
          value={data.total}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Posted Blogs"
          value={data.postedBlogs || 0}
          icon={<Upload className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Branded Blogs"
          value={data.brandedBlogs}
          icon={<Award className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Categories"
          value={data.categoryBreakdown?.length || 0}
          icon={<Layers className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Active Models"
          value={data.modelBreakdown.length}
          icon={<Zap className="w-5 h-5" />}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Creation Trends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Blog generation volume over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="daily">
            <div className="flex flex-row items-center justify-between mb-6 gap-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Trend Analysis
              </div>
              <TabsList className="bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 h-auto">
                <TabsTrigger
                  value="daily"
                  className="flex items-center gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border-gray-200 border border-transparent transition-all"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">Daily</span>
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="flex items-center gap-2 py-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border-gray-200 border border-transparent transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">Monthly</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="daily">
              <LineChart data={dailyTrendData} xKey="date" yKey="count" height={320} />
            </TabsContent>
            <TabsContent value="monthly">
              <BarChart
                data={monthlyTrendData}
                xKey="name"
                yKey="value"
                height={320}
                color="#3B82F6"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">AI Model Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Which models are users preferring?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={modelData} height={280} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Template Popularity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Top templates used for generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={templateData.slice(0, 10)}
              xKey="name"
              yKey="value"
              height={280}
              color="#8B5CF6"
              rotateLabels
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Top Categories</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Most popular blog categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={(data.categoryBreakdown || [])
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((item) => ({ name: item.category, value: item.count }))}
              xKey="name"
              yKey="value"
              height={280}
              color="#10B981"
              rotateLabels
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Platform Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Where blogs are being posted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={(data.platformBreakdown || []).map((item) => ({
                name: item.platform,
                value: item.count,
              }))}
              height={280}
              colors={["#3B82F6", "#F59E0B", "#EF4444"]}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
