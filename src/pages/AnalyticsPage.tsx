import type { ReactNode } from "react"
import useAuthStore from "@store/useAuthStore"
import useWorkspaceStore from "@store/useWorkspaceStore"
import { getDefaultFilterStart } from "@utils/dateDefaults"
import { motion } from "framer-motion"
import {
  FileText,
  UploadCloud,
  Archive,
  BadgePercent,
  TrendingUp,
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

interface StatsCardProps {
  title?: string
  value?: number
  icon?: any
  iconBg?: any
  cardBg?: any
  progress?: any
  limit?: number
}

const StatsCard = ({ title, value, icon, iconBg, cardBg, progress, limit }: StatsCardProps) => {
  const percent = limit ? Math.min(((value ?? 0) / limit) * 100, 100) : 0
  const progressColor =
    (value ?? 0) >= (limit ?? 0)
      ? "bg-red-500"
      : (value ?? 0) / (limit || 1) > 0.8
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        group relative border border-gray-200 p-4 rounded-xl
        shadow-none hover:shadow-lg transition-all duration-300
        text-gray-900 ${cardBg}
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

interface ChartCardProps {
  title?: string
  children?: ReactNode
  className?: string
}

const ChartCard = ({ title, children, className = "" }: ChartCardProps) => (
  <div
    className={`rounded-xl p-6 shadow-none border transition-all duration-300
      bg-white border-gray-200 text-gray-900
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
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace)

  const {
    data: blogStatus,
    isLoading: statusLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blogStatus", activeWorkspace?.id],
    queryFn: () => {
      const endDate = dayjs().endOf("day").toISOString()
      const start = getDefaultFilterStart(user, { isSharedWorkspace: !!activeWorkspace })
      const params = { start: new Date(start).toISOString(), end: endDate }
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

  const chartOptions: any = {
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

  const barChartOptions: any = {
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

  const lineChartOptions: any = {
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
      title: "Blogs by Model",
      type: "Pie",
      data: {
        labels: Object.keys(blogsByModel).length ? Object.keys(blogsByModel) : ["No Data"],
        datasets: [
          {
            data: Object.keys(blogsByModel).length ? Object.values(blogsByModel) : [1],
            backgroundColor: [
              "#6366F1", // modern indigo
              "#EC4899", // vibrant rose
              "#14B8A6", // teal
              "#F59E0B", // amber
              "#8B5CF6", // violet
            ],
            hoverOffset: 24,
            borderColor: "#ffffff",
            borderWidth: 4,
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
            backgroundColor: [
              "#0EA5E9", // sky blue
              "#22C55E", // green
              "#F97316", // orange
              "#A855F7", // purple
              "#E11D48", // ruby
            ],
            hoverOffset: 24,
            borderColor: "#ffffff",
            borderWidth: 4,
            cutout: "70%",
          },
        ],
      },
    },
    {
      title: "Blogs By Status",
      type: "Bar",
      data: {
        labels: Object.keys(blogsByStatus).length ? Object.keys(blogsByStatus) : ["No Data"],
        datasets: [
          {
            label: "Nodes",
            data: Object.keys(blogsByStatus).length ? Object.values(blogsByStatus) : [0],
            backgroundColor: Object.keys(blogsByStatus).length
              ? Object.keys(blogsByStatus).map((status) => {
                  switch (status.toLowerCase()) {
                    case "pending":
                      return "#EAB308" // strong yellow
                    case "complete":
                      return "#16A34A" // deep green
                    case "failed":
                      return "#DC2626" // red
                    case "in-progress":
                      return "#2563EB" // blue
                    default:
                      return "#64748B" // slate
                  }
                })
              : ["#CBD5E1"],
            borderRadius: 12,
            maxBarThickness: 40,
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
            label: "Usage",
            data: Object.keys(templatesUsed).length ? Object.values(templatesUsed) : [0],
            borderColor: "#4F46E5",
            backgroundColor: "rgba(79, 70, 229, 0.18)",
            tension: 0.5,
            fill: true,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#4F46E5",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
    },
  ]

  const statsData: Array<{
    title: string
    value?: number
    icon?: any
    iconBg?: string
    cardBg?: string
    progress?: number
    limit?: number
  }> = [
    {
      title: "Total Blogs",
      value: totalBlogs,
      icon: <FileText className="w-5 h-5 text-pink-500" />,
      iconBg: "bg-pink-50",
      cardBg: "bg-white",
    },
    {
      title: "Posted Blogs",
      value: postedBlogs,
      icon: <UploadCloud className="w-5 h-5 text-emerald-500" />,
      iconBg: "bg-emerald-50",
      cardBg: "bg-white",
    },
    {
      title: "Archived Blogs",
      value: archivedBlogs,
      icon: <Archive className="w-5 h-5 text-amber-500" />,
      iconBg: "bg-amber-50",
      cardBg: "bg-white",
    },
    {
      title: "Branded Blogs",
      value: brandedBlogs,
      icon: <BadgePercent className="w-5 h-5 text-primary" />,
      iconBg: "bg-primary/10",
      cardBg: "bg-white",
    },
  ]

  const usageData = [
    {
      title: "Created Jobs",
      value: usage.createdJobs,
      limit: usageLimits.createdJobs,
      progress: usage.createdJobs,
      icon: <FilePlus className="w-5 h-5 text-primary" />,
      iconBg: "bg-primary/10",
      cardBg: "bg-white",
    },
    {
      title: "AI Images",
      value: usage.aiImages,
      limit: usageLimits.aiImages,
      progress: usage.aiImages,
      icon: <ImageIcon className="w-5 h-5 text-teal-600" />,
      iconBg: "bg-teal-50",
      cardBg: "bg-white",
    },
  ]

  const handleRetry = () => {
    refetch()
  }

  return (
    <div className="min-h-screen">
      <div className="md:p-6 p-3 md:mt-0 mt-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog Analytics</h1>
            <p className="text-base mt-1 text-gray-600">
              Track your blog performance and engagement metrics
            </p>
          </div>
        </motion.div>

        {statusLoading || !user ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-none">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
            <p className="text-xl font-bold text-gray-900 mb-2">Systems Interrupted</p>
            <p className="text-slate-500 mb-8">
              {error.message || "Failed to establish uplink with data nodes."}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200 p-4 px-8"
            >
              Restart Scan
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Blog Statistics</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {statsData.map((stat, _index) => (
                  <StatsCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    iconBg={stat.iconBg}
                    cardBg={stat.cardBg}
                    progress={stat.progress}
                    limit={stat.limit}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Usage & Limit</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {usageData.map((stat, _index) => (
                  <StatsCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    iconBg={stat.iconBg}
                    cardBg={stat.cardBg}
                    progress={stat.progress}
                    limit={stat.limit}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <StopCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Analytics Charts</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {charts.map((chart, _index) => (
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
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-count skeleton placeholder, no content
            key={index}
            className="p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm h-48 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {[...Array(2)].map((_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-count skeleton placeholder, no content
            key={index}
            className="p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm h-64 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {[...Array(4)].map((_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-count skeleton placeholder, no content
            key={index}
            className="rounded-[40px] p-10 border border-slate-100 bg-white h-[400px] animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
