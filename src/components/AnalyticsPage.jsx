import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import {
  FileText,
  UploadCloud,
  Archive,
  BadgePercent,
  TrendingUp,
  Eye,
  MousePointer,
} from "lucide-react"
import { Select, message } from "antd"
import { Chart as ChartJS, registerables } from "chart.js"
import { Line, Bar, Pie, Chart } from "react-chartjs-2"
import { fetchBlogStatus, fetchAllBlogs } from "@store/slices/blogSlice" // Adjust path as needed
import { MoreHorizontal } from "lucide-react"

// Register Chart.js components
ChartJS.register(...registerables)

const { Option } = Select

// StatsCard Component
const StatsCard = ({ title, value, icon, iconBg, cardBg, ringColor }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`
      group relative ${cardBg} p-4 rounded-xl border border-gray-200
      shadow-sm hover:shadow-md transition-all duration-300
      hover:ring-1 hover:ring-offset-2 ${ringColor}
    `}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <div className={`p-2 rounded-md ${iconBg} shadow-md`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </motion.div>
)

// ChartCard Component
const ChartCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 ${className}`}
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
        <MoreHorizontal className="w-5 h-5 text-gray-400" />
      </button>
    </div>
    <div className="h-80">{children}</div>
  </div>
)

// Chart Data (Static, to be replaced with Redux data if available)
const trafficData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  datasets: [
    {
      label: "Visitors",
      data: [4000, 3000, 2000, 2780, 1890, 2390, 3490],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
      fill: true,
    },
    {
      label: "Page Views",
      data: [2400, 1398, 9800, 3908, 4800, 3800, 4300],
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      tension: 0.4,
      fill: true,
    },
  ],
}

const keywordData = {
  labels: ["React", "JavaScript", "CSS", "HTML", "Node.js", "TypeScript"],
  datasets: [
    {
      label: "Searches",
      data: [12000, 8500, 15000, 18000, 6500, 9200],
      backgroundColor: "rgba(16, 185, 129, 0.8)",
      borderColor: "#10b981",
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}

const impressionsData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  datasets: [
    {
      label: "Impressions",
      data: [24000, 32000, 28000, 35000, 42000, 38000],
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245, 158, 11, 0.3)",
      tension: 0.4,
      fill: true,
    },
    {
      label: "Clicks",
      data: [1200, 1800, 1400, 2100, 2500, 2200],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.3)",
      tension: 0.4,
      fill: true,
    },
  ],
}

const clicksData = {
  labels: ["Organic Search", "Direct Traffic", "Social Media", "Email", "Referrals"],
  datasets: [
    {
      data: [45, 25, 15, 10, 5],
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"],
      hoverOffset: 20,
    },
  ],
}

// Chart Options
const chartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { font: { size: 12 }, padding: 20 } },
    tooltip: {
      backgroundColor: "white",
      titleColor: "#1f2937",
      bodyColor: "#1f2937",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      cornerRadius: 12,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
  },
  scales: {
    x: { ticks: { font: { size: 12 }, color: "#6b7280" } },
    y: { ticks: { font: { size: 12 }, color: "#6b7280" }, beginAtZero: true },
  },
}

const AnalyticsPage = () => {
  const dispatch = useDispatch()
  const { blogStatus, loading: statusLoading, error } = useSelector((state) => state.blog)
  const [selectedRange, setSelectedRange] = useState("30days")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchBlogStatus())
    dispatch(fetchAllBlogs())
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [dispatch])

  // Stats data from Redux
  const stats = blogStatus?.stats || {}
  const { totalBlogs = 0, postedBlogs = 0, archivedBlogs = 0, brandedBlogs = 0 } = stats

  // Stats cards configuration
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

  // Handle time range change
  const handleRangeChange = (value) => {
    setSelectedRange(value)
    // Simulate API call for new data
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success(`Data refreshed for ${value}`)
    }, 1000)
  }

  // Chart components
  const TrafficChart = () => (
    <Chart
      type="line"
      data={trafficData}
      options={{
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          legend: { display: true },
        },
        scales: {
          ...chartOptions.scales,
          y: { ...chartOptions.scales.y, ticks: { stepSize: 1000 } },
        },
      }}
    />
  )

  const KeywordChart = () => (
    <Chart
      type="bar"
      data={keywordData}
      options={{
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          legend: { display: false },
        },
        scales: {
          ...chartOptions.scales,
          x: {
            ...chartOptions.scales.x,
            ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 },
          },
        },
      }}
    />
  )

  const ImpressionsChart = () => (
    <Chart
      type="line"
      data={impressionsData}
      options={{
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          legend: { display: true },
        },
        scales: {
          ...chartOptions.scales,
          y: { ...chartOptions.scales.y, ticks: { stepSize: 10000 } },
        },
      }}
    />
  )

  const ClicksChart = () => (
    <Chart
      type="pie"
      data={clicksData}
      options={{
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          legend: { position: "bottom", labels: { font: { size: 12 }, padding: 20 } },
        },
      }}
    />
  )

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="p-6">
        {/* Header */}
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
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Track your blog performance and engagement metrics
            </p>
          </div>
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
        </motion.div>

        {/* Loading State */}
        {loading || statusLoading ? (
          <div className="text-center py-12">
            <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Loading analytics data...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg text-red-500">Error: {error}</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Blog Statistics</h2>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat, index) => (
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Website Traffic">
                <TrafficChart />
              </ChartCard>
              <ChartCard title="Keyword Rankings">
                <KeywordChart />
              </ChartCard>
              <ChartCard title="Impressions Over Time">
                <ImpressionsChart />
              </ChartCard>
              <ChartCard title="Traffic Sources">
                <ClicksChart />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AnalyticsPage
