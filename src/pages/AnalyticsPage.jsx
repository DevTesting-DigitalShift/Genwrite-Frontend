import React, { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import {
  FileText,
  UploadCloud,
  Archive,
  BadgePercent,
  TrendingUp,
  MoreHorizontal,
  Image as ImageIcon,
  FilePlus,
  Gauge,
  StopCircle,
} from "lucide-react"
import { Select, message, Spin, Button, Progress } from "antd"
import { Chart as ChartJS, registerables } from "chart.js"
import { Pie, Doughnut, Bar, Line } from "react-chartjs-2"
import { useQuery } from "@tanstack/react-query"
import { getBlogStatus } from "@/api/analysisApi"
import { selectUser } from "@/store/slices/authSlice"
import dayjs from "dayjs"

ChartJS.register(...registerables)

const { Option } = Select

const StatsCard = ({ title, value, icon, iconBg, cardBg, ringColor, progress, limit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`
      group relative ${cardBg} p-4 rounded-xl border border-gray-200
      shadow-sm hover:shadow-md transition-all duration-300
      hover:ring-1 hover:ring-offset-2 ${ringColor}
      text-gray-900 border-gray-200
    `}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className={`p-2 rounded-md ${iconBg} shadow-md`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">
        {value}
        {limit ? ` / ${limit}` : ""}
      </p>
      {progress !== undefined && limit !== undefined && (
        <div className="mt-2">
          <Progress
            percent={Math.min((value / limit) * 100, 100)}
            size="small"
            status={value >= limit ? "exception" : value / limit > 0.8 ? "warning" : "normal"}
            showInfo={false}
            strokeColor={value >= limit ? "#ef4444" : value / limit > 0.8 ? "#f59e0b" : "#10b981"}
          />
          <p className="text-xs text-gray-500 mt-1">
            {Math.round((value / limit) * 100)}% of limit used
          </p>
        </div>
      )}
    </div>
  </motion.div>
)

const ChartCard = ({ title, children, className = "" }) => (
  <div
    className={`rounded-2xl p-6 shadow-sm border transition-all duration-300
      bg-white border-gray-100 text-gray-900
      hover:shadow-lg ${className}`}
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="h-80">{children}</div>
  </div>
)

const AnalyticsPage = () => {
  const user = useSelector(selectUser)
  // const [selectedRange, setSelectedRange] = useState("7days")

  const {
    data: blogStatus,
    isLoading: statusLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blogStatus"],
    queryFn: () => {
      const endDate = dayjs().endOf("day").toISOString()
      let params = {
        start: new Date(user?.createdAt || Date.now()).toISOString(),
        end: endDate,
      }

      // switch (selectedRange) {
      //   case "7days":
      //     params = {
      //       start: dayjs().subtract(6, "days").startOf("day").toISOString(),
      //       end: endDate,
      //     }
      //     break
      //   case "30days":
      //     params = {
      //       start: dayjs().subtract(29, "days").startOf("day").toISOString(),
      //       end: endDate,
      //     }
      //     break
      //   case "90days":
      //     params = {
      //       start: dayjs().subtract(89, "days").startOf("day").toISOString(),
      //       end: endDate,
      //     }
      //     break
      //   default:
      //     params = {}
      // }
      return getBlogStatus(params)
    },
  })

  const stats = blogStatus?.stats || {}
  const {
    totalBlogs = 0,
    postedBlogs = 0,
    archivedBlogs = 0,
    brandedBlogs = 0,
    blogsByModel = {},
    blogsByStatus = {},
    imageSources = {},
    templatesUsed = {},
  } = stats

  const usage = user?.usage || { createdJobs: 0, aiImages: 0 }
  const usageLimits = user?.usageLimits || { createdJobs: 10, aiImages: 50 }

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 12 }, padding: 20, color: "#6b7280" },
      },
      tooltip: {
        backgroundColor: "white",
        titleColor: "#1f2937",
        bodyColor: "#1f2937",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 12,
      },
    },
    scales: {
      x: { ticks: { font: { size: 12 }, color: "#6b7280" } },
      y: {
        ticks: { font: { size: 12 }, color: "#6b7280" },
        beginAtZero: true,
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: {
          font: { size: 12 },
          color: "#6b7280",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        ticks: { font: { size: 12 }, color: "#6b7280", stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  const lineChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { display: false } },
    scales: {
      x: {
        ticks: {
          font: { size: 12 },
          color: "#6b7280",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        ticks: { font: { size: 12 }, color: "#6b7280", stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  const charts = [
    {
      title: "Blogs by Model",
      type: "Pie",
      data: {
        labels: Object.keys(blogsByModel).length ? Object.keys(blogsByModel) : ["No Data"],
        datasets: [
          {
            data: Object.keys(blogsByModel).length ? Object.values(blogsByModel) : [1],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#6B7280"],
            hoverOffset: 20,
            borderColor: "#ffffff",
          },
        ],
      },
    },
    {
      title: "Image Sources",
      type: "Doughnut",
      data: {
        labels: Object.keys(imageSources).length ? Object.keys(imageSources) : ["No Data"],
        datasets: [
          {
            data: Object.keys(imageSources).length ? Object.values(imageSources) : [1],
            backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "#6B7280"],
            hoverOffset: 20,
            borderColor: "#ffffff",
          },
        ],
      },
    },
    {
      title: "Blogs by Status",
      type: "Bar",
      data: {
        labels: Object.keys(blogsByStatus).length ? Object.keys(blogsByStatus) : ["No Data"],
        datasets: [
          {
            label: "Blogs by Status",
            data: Object.keys(blogsByStatus).length ? Object.values(blogsByStatus) : [0],
            backgroundColor: Object.keys(blogsByStatus).length
              ? Object.keys(blogsByStatus).map(status => {
                  switch (status.toLowerCase()) {
                    case "pending":
                      return "#facc15" // Yellow
                    case "complete":
                      return "#22c55e" // Green
                    case "failed":
                      return "#ef4444" // Red
                    case "in-progress":
                      return "#a78bfa" // Purple
                    default:
                      return "#6b7280" // Gray
                  }
                })
              : ["#9ca3af"],
            borderColor: "#e5e7eb",
            borderWidth: 1,
          },
        ],
      },
    },
    {
      title: "Templates Used",
      type: "Line",
      data: {
        labels: Object.keys(templatesUsed).length ? Object.keys(templatesUsed) : ["No Data"],
        datasets: [
          {
            label: "Templates Used",
            data: Object.keys(templatesUsed).length ? Object.values(templatesUsed) : [0],
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
    },
  ]

  const statsData = [
    {
      title: "Total Blogs",
      value: totalBlogs,
      icon: <FileText className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-500",
      cardBg: "bg-blue-50",
      ringColor: "ring-blue-200",
    },
    {
      title: "Posted Blogs",
      value: postedBlogs,
      icon: <UploadCloud className="w-5 h-5 text-white" />,
      iconBg: "bg-green-500",
      cardBg: "bg-green-50",
      ringColor: "ring-green-200",
    },
    {
      title: "Archived Blogs",
      value: archivedBlogs,
      icon: <Archive className="w-5 h-5 text-white" />,
      iconBg: "bg-yellow-500",
      cardBg: "bg-yellow-50",
      ringColor: "ring-yellow-200",
    },
    {
      title: "Branded Blogs",
      value: brandedBlogs,
      icon: <BadgePercent className="w-5 h-5 text-white" />,
      iconBg: "bg-pink-500",
      cardBg: "bg-pink-50",
      ringColor: "ring-pink-200",
    },
  ]

  const usageData = [
    {
      title: "Created Jobs",
      value: usage.createdJobs,
      limit: usageLimits.createdJobs,
      progress: usage.createdJobs,
      icon: <FilePlus className="w-5 h-5 text-white" />,
      iconBg: "bg-purple-500",
      cardBg: "bg-purple-50",
      ringColor: "ring-purple-200",
    },
    {
      title: "AI Images",
      value: usage.aiImages,
      limit: usageLimits.aiImages,
      progress: usage.aiImages,
      icon: <ImageIcon className="w-5 h-5 text-white" />,
      iconBg: "bg-teal-500",
      cardBg: "bg-teal-50",
      ringColor: "ring-teal-200",
    },
  ]

  const handleRangeChange = value => {
    setSelectedRange(value)
  }

  const handleRetry = () => {
    refetch()
  }

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Blog Analytics
            </h1>
            <p className="text-base mt-1 text-gray-600">
              Track your blog performance and engagement metrics
            </p>
          </div>
          {/* <div className="flex items-center gap-4">
            <Select
              value={selectedRange}
              onChange={handleRangeChange}
              className="w-40"
              aria-label="Select time range"
            >
              <Option value="7days">Last 7 Days</Option>
              <Option value="30days">Last 30 Days</Option>
              <Option value="90days">Last 90 Days</Option>
            </Select>
          </div> */}
        </motion.div>

        {statusLoading || !user ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg text-red-500">
              Error: {error.message || "Failed to load analytics data"}
            </p>
            <Button
              onClick={handleRetry}
              className="mt-4 bg-blue-600 text-white"
              aria-label="Retry loading data"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Blog Statistics</h2>
              </div>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat, index) => (
                <StatsCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  iconBg={stat.iconBg}
                  cardBg={stat.cardBg}
                  ringColor={stat.ringColor}
                  progress={stat.progress}
                  limit={stat.limit}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Usage & Limit</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              {usageData.map((stat, index) => (
                <StatsCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  iconBg={stat.iconBg}
                  cardBg={stat.cardBg}
                  ringColor={stat.ringColor}
                  progress={stat.progress}
                  limit={stat.limit}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                  <StopCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Analytics Charts</h2>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart, index) => (
                <ChartCard key={chart.title} title={chart.title}>
                  {chart.type === "Pie" && <Pie data={chart.data} options={chartOptions} />}
                  {chart.type === "Doughnut" && (
                    <Doughnut data={chart.data} options={chartOptions} />
                  )}
                  {chart.type === "Bar" && <Bar data={chart.data} options={barChartOptions} />}
                  {chart.type === "Line" && <Line data={chart.data} options={lineChartOptions} />}
                </ChartCard>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AnalyticsPage

const SkeletonLoader = () => {
  return (
    <div className="p-2 md:p-4 lg:p-8 max-w-full">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div className="mb-4 sm:mb-0">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </motion.div>

      {/* Blog Statistics Section Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </motion.div>
        ))}
      </div>

      {/* Usage & Limit Section Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2">
              <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded mt-1 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts Section Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="rounded-2xl p-6 shadow-sm border bg-white border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-80 w-full bg-gray-200 rounded-lg animate-pulse" />
          </motion.div>
        ))}
      </div>

      {/* Last Updated Skeleton */}
      <div className="mt-12 text-center">
        <div className="h-4 w-48 mx-auto bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
