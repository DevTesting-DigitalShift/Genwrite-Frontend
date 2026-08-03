import { Briefcase, Building2, Calendar, ExternalLink, FileText, User } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import type { BrandAnalyticsResponse } from "@admin/types/admin"
import { BarChart } from "@admin/shared/charts/BarChart"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { StatCard } from "@admin/shared/components/StatCard"
import { getBrandAnalytics } from "../api/brandsApi"

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

export default function AdminBrands() {
  const [data, setData] = useState<BrandAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getBrandAnalytics()
      setData(response)
    } catch (err) {
      console.error("Failed to fetch brand analytics:", err)
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
      <div className="flex-1 p-8">
        <ErrorAlert
          message={error || "No data available"}
          onAction={() => fetchData()}
          actionLabel="Retry"
        />
      </div>
    )
  }

  const topBrandsData = data.topBrands
    .filter((item) => item.blogCount > 0)
    .slice(0, 10)
    .map((item) => ({ name: item.nameOfVoice || "Untitled Brand", value: item.blogCount }))

  const brandsByUserData = data.brandsByUser
    .slice(0, 10)
    .map((item) => ({ name: item.userName || item.userEmail || "Unknown", value: item.brandCount }))

  return (
    <main className="max-container mx-auto space-y-6">
      {data.dateRange && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <Calendar className="w-4 h-4" />
          <span>
            Analysis Period: {formatDate(data.dateRange.startDate)} -{" "}
            {formatDate(data.dateRange.endDate)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Brands"
          value={data.totalBrands}
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label="Brands w/ Blogs"
          value={data.brandsWithBlogs}
          icon={<FileText className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label="Engagement Rate"
          value={`${data.totalBrands > 0 ? Math.round((data.brandsWithBlogs / data.totalBrands) * 100) : 0}%`}
          icon={<Briefcase className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Brands by Content</CardTitle>
            <CardDescription>Brands producing the most blogs</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={topBrandsData}
              xKey="name"
              yKey="value"
              height={400}
              color="#10B981"
              rotateLabels
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Users by Brands</CardTitle>
            <CardDescription>Users managing the most brands</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={brandsByUserData}
              xKey="name"
              yKey="value"
              height={400}
              color="#8B5CF6"
              rotateLabels
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            All Brands ({data.topBrands.length})
          </CardTitle>
          <CardDescription>Complete list of brand voices with details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {data.topBrands.map((brand, index) => (
              <div
                key={brand._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {brand.nameOfVoice}
                        </h3>
                        {brand.postLink && (
                          <a
                            href={brand.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {brand.postLink}
                          </a>
                        )}
                        {brand.describeBrand && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                            {brand.describeBrand}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {formatDate(brand.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge
                      className={`text-sm border ${
                        brand.blogCount > 0
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {brand.blogCount} {brand.blogCount === 1 ? "blog" : "blogs"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Users by Brand Count
          </CardTitle>
          <CardDescription>Users and their brand management activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.brandsByUser.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.userName || user.userEmail || "Unknown User"}
                    </p>
                    {user.userName && user.userEmail && (
                      <p className="text-xs text-gray-500">{user.userEmail}</p>
                    )}
                  </div>
                </div>
                <Badge className="text-sm bg-gray-100 text-gray-700 border border-gray-200">
                  <Building2 className="w-3 h-3 mr-1" />
                  {user.brandCount} {user.brandCount === 1 ? "brand" : "brands"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
