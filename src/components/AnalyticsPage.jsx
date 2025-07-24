import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import {
  FileText,
  UploadCloud,
  Archive,
  BadgePercent,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react"
import { Select, message, Spin, Button } from "antd"
import { Chart as ChartJS, registerables } from "chart.js"
import { Pie, Doughnut, Bar, Line } from "react-chartjs-2"
import { fetchBlogStatus, fetchAllBlogs } from "@store/slices/blogSlice"

ChartJS.register(...registerables)

const { Option } = Select

const StatsCard = ({ title, value, icon, iconBg, cardBg, ringColor }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`
      group relative ${cardBg} p-4 rounded-xl border border-gray-200
      shadow-sm hover:shadow-md transition-all duration-300
      hover:ring-1 hover:ring-offset-2 ${ringColor}
      "text-gray-900 border-gray-200"}
    `}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className={`p-2 rounded-md ${iconBg} shadow-md`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
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
      <button
        className="p-2 rounded-lg transition-colors hover:bg-gray-50"
        aria-label="More options"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-400" />
      </button>
    </div>
    <div className="h-80">{children}</div>
  </div>
)

const AnalyticsPage = () => {
  const dispatch = useDispatch()
  const { blogStatus, loading: statusLoading, error } = useSelector((state) => state.blog)
  const [selectedRange, setSelectedRange] = useState("30days")

  useEffect(() => {
    dispatch(fetchBlogStatus())
    dispatch(fetchAllBlogs())
  }, [dispatch])

  const stats = blogStatus?.stats || {}
  const {
    totalBlogs,
    postedBlogs,
    archivedBlogs,
    brandedBlogs,
    blogsByModel,
    blogsByStatus,
    imageSources,
    templatesUsed,
  } = stats

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
        labels: Object.keys(blogsByModel || {}).length ? Object.keys(blogsByModel) : ["No Data"],
        datasets: [
          {
            data: Object.keys(blogsByModel || {}).length ? Object.values(blogsByModel) : [1],
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
        labels: Object.keys(imageSources || {}).length ? Object.keys(imageSources) : ["No Data"],
        datasets: [
          {
            data: Object.keys(imageSources || {}).length ? Object.values(imageSources) : [1],
            backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
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
        labels: Object.keys(blogsByStatus || {}).length ? Object.keys(blogsByStatus) : ["No Data"],
        datasets: [
          {
            label: "Blogs by Status",
            data: Object.keys(blogsByStatus || {}).length ? Object.values(blogsByStatus) : [0],
            backgroundColor: "#3B82F6",
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        ],
      },
    },
    {
      title: "Templates Used",
      type: "Line",
      data: {
        labels: Object.keys(templatesUsed || {}).length ? Object.keys(templatesUsed) : ["No Data"],
        datasets: [
          {
            label: "Templates Used",
            data: Object.keys(templatesUsed || {}).length ? Object.values(templatesUsed) : [0],
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
      value: totalBlogs || 0,
      icon: <FileText className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-500",
      cardBg: "bg-blue-50",
      ringColor: "ring-blue-200",
    },
    {
      title: "Posted Blogs",
      value: postedBlogs || 0,
      icon: <UploadCloud className="w-5 h-5 text-white" />,
      iconBg: "bg-green-500",
      cardBg: "bg-green-50",
      ringColor: "ring-green-200",
    },
    {
      title: "Archived Blogs",
      value: archivedBlogs || 0,
      icon: <Archive className="w-5 h-5 text-white" />,
      iconBg: "bg-yellow-500",
      cardBg: "bg-yellow-50",
      ringColor: "ring-yellow-200",
    },
    {
      title: "Branded Blogs",
      value: brandedBlogs || 0,
      icon: <BadgePercent className="w-5 h-5 text-white" />,
      iconBg: "bg-pink-500",
      cardBg: "bg-pink-50",
      ringColor: "ring-pink-200",
    },
  ]

  const handleRangeChange = (value) => {
    setSelectedRange(value)
    dispatch(fetchBlogStatus())
    dispatch(fetchAllBlogs())
    message.success(`Data refreshed for ${value}`)
  }

  const handleRetry = () => {
    dispatch(fetchBlogStatus())
    dispatch(fetchAllBlogs())
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50">
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
            <p className="text-sm mt-1 text-gray-600">
              Track your blog performance and engagement metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </motion.div>

        {statusLoading ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="text-lg mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg text-red-500">
              Error: {error || "Failed to load analytics data"}
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
            ></motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat) => (
                <StatsCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  iconBg={stat.iconBg}
                  cardBg={stat.cardBg}
                  ringColor={stat.ringColor}
                />
              ))}
            </div>

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
