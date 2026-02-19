import React, { useState, useEffect } from "react"
import useAuthStore from "@store/useAuthStore"
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
  AlertCircle,
} from "lucide-react"
import { Chart as ChartJS, registerables } from "chart.js"
import { Pie, Doughnut, Bar, Line } from "react-chartjs-2"
import { useQuery } from "@tanstack/react-query"
import { getBlogStatus } from "@/api/analysisApi"
import dayjs from "dayjs"

ChartJS.register(...registerables)

const StatsCard = ({ title, value, icon, iconBg, cardBg, ringColor, progress, limit }) => {
  const percent = limit ? Math.min((value / limit) * 100, 100) : 0
  const progressColor =
    value >= limit ? "bg-red-500" : value / limit > 0.8 ? "bg-amber-500" : "bg-emerald-500"

  return (
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
          <div className="mt-2 space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(percent)}% of limit used</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

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
  const { user } = useAuthStore()

  const {
    data: blogStatus,
    isLoading: statusLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blogStatus"],
    queryFn: () => {
      const endDate = dayjs().endOf("day").toISOString()
      let params = { start: new Date(user?.createdAt || Date.now()).toISOString(), end: endDate }
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
        labels: { font: { size: 12, weight: "bold" }, padding: 20, color: "#64748b" },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#0f172a",
        bodyColor: "#475569",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        cornerRadius: 16,
        padding: 12,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: "600" }, color: "#94a3b8" },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 11, weight: "600" }, color: "#94a3b8" },
        beginAtZero: true,
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: " bold" },
          color: "#94a3b8",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 11, weight: "600" }, color: "#94a3b8", stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  const lineChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: "bold" },
          color: "#94a3b8",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 11, weight: "600" }, color: "#94a3b8", stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  const charts = [
    {
      title: "Model Intelligence Distribution",
      type: "Pie",
      data: {
        labels: Object.keys(blogsByModel).length ? Object.keys(blogsByModel) : ["No Data"],
        datasets: [
          {
            data: Object.keys(blogsByModel).length ? Object.values(blogsByModel) : [1],
            backgroundColor: ["#0f172a", "#3b82f6", "#10b981", "#f59e0b"],
            hoverOffset: 24,
            borderColor: "#ffffff",
            borderWidth: 4,
          },
        ],
      },
    },
    {
      title: "Asset Origin Matrix",
      type: "Doughnut",
      data: {
        labels: Object.keys(imageSources).length ? Object.keys(imageSources) : ["No Data"],
        datasets: [
          {
            data: Object.keys(imageSources).length ? Object.values(imageSources) : [1],
            backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#94a3b8"],
            hoverOffset: 24,
            borderColor: "#ffffff",
            borderWidth: 4,
            cutout: "70%",
          },
        ],
      },
    },
    {
      title: "Pipeline Status Flow",
      type: "Bar",
      data: {
        labels: Object.keys(blogsByStatus).length ? Object.keys(blogsByStatus) : ["No Data"],
        datasets: [
          {
            label: "Nodes",
            data: Object.keys(blogsByStatus).length ? Object.values(blogsByStatus) : [0],
            backgroundColor: Object.keys(blogsByStatus).length
              ? Object.keys(blogsByStatus).map(status => {
                  switch (status.toLowerCase()) {
                    case "pending":
                      return "#facc15"
                    case "complete":
                      return "#10b981"
                    case "failed":
                      return "#ef4444"
                    case "in-progress":
                      return "#3b82f6"
                    default:
                      return "#64748b"
                  }
                })
              : ["#e2e8f0"],
            borderRadius: 12,
            maxBarThickness: 40,
          },
        ],
      },
    },
    {
      title: "Architectural Preference",
      type: "Line",
      data: {
        labels: Object.keys(templatesUsed).length ? Object.keys(templatesUsed) : ["No Data"],
        datasets: [
          {
            label: "Usage",
            data: Object.keys(templatesUsed).length ? Object.values(templatesUsed) : [0],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.5,
            fill: true,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#3b82f6",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
    },
  ]

  const statsData = [
    {
      title: "Neural Output",
      value: totalBlogs,
      icon: <FileText className="w-5 h-5 text-white" />,
      iconBg: "bg-slate-950",
      cardBg: "bg-white",
      ringColor: "ring-slate-100",
    },
    {
      title: "Live Deployments",
      value: postedBlogs,
      icon: <UploadCloud className="w-5 h-5 text-white" />,
      iconBg: "bg-emerald-600",
      cardBg: "bg-white",
      ringColor: "ring-emerald-100",
    },
    {
      title: "Archived Nodes",
      value: archivedBlogs,
      icon: <Archive className="w-5 h-5 text-white" />,
      iconBg: "bg-amber-500",
      cardBg: "bg-white",
      ringColor: "ring-amber-100",
    },
    {
      title: "Pattern Optimized",
      value: brandedBlogs,
      icon: <BadgePercent className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-600",
      cardBg: "bg-white",
      ringColor: "ring-blue-100",
    },
  ]

  const usageData = [
    {
      title: "Autonomous Pipelines",
      value: usage.createdJobs,
      limit: usageLimits.createdJobs,
      progress: usage.createdJobs,
      icon: <FilePlus className="w-5 h-5 text-white" />,
      iconBg: "bg-slate-900",
      cardBg: "bg-slate-50",
      ringColor: "ring-slate-200",
    },
    {
      title: "Synthetic Assets",
      value: usage.aiImages,
      limit: usageLimits.aiImages,
      progress: usage.aiImages,
      icon: <ImageIcon className="w-5 h-5 text-white" />,
      iconBg: "bg-blue-600",
      cardBg: "bg-blue-50/50",
      ringColor: "ring-blue-200",
    },
  ]

  const handleRetry = () => {
    refetch()
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <div className="p-8 sm:p-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-950 tracking-tight">
              Intelligence Analytics
            </h1>
            <p className="text-lg font-medium text-slate-500 max-w-xl leading-relaxed">
              Real-time monitoring of your autonomous content generation grid and performance
              metrics.
            </p>
          </div>
        </motion.div>

        {statusLoading || !user ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/20">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
            <p className="text-xl font-bold text-slate-900 mb-2">Systems Interrupted</p>
            <p className="text-slate-500 mb-8">
              {error.message || "Failed to establish uplink with data nodes."}
            </p>
            <button
              onClick={handleRetry}
              className="btn btn-lg bg-slate-950 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20 border-none px-8"
            >
              Restart Scan
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[18px] bg-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    System Statistics
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    High-Fidelity Metric Matrix
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Resource Quota
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Bandwidth & Consumption Pulse
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[18px] bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <StopCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Neural Intelligence Charts
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Abstracted Data Visualization
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyticsPage

const SkeletonLoader = () => {
  return (
    <div className="max-w-full space-y-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm h-48 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className="p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm h-64 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-[40px] p-10 border border-slate-100 bg-white h-[400px] animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
