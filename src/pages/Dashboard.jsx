import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import useJobStore from "@store/useJobStore"
import useAnalysisStore from "@store/useAnalysisStore"
import GoThrough from "../components/dashboardModals/GoThrough"
import LoadingScreen from "@components/UI/LoadingScreen"
import { ACTIVE_MODELS } from "@/data/dashModels"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import DashboardTour from "@components/DashboardTour"
import { getBlogStatus } from "@/api/analysisApi"
import { getAllBlogs } from "@/api/blogApi"
import { tools } from "@/data/toolsData"
import ToolCard from "../components/dashboard/ToolCard"
import {
  FileText,
  UploadCloud,
  Archive,
  BadgePercent,
  TrendingUp,
  Sparkles,
  PenTool,
  ChevronRight,
  Clock,
  Coins,
} from "lucide-react"
import { motion } from "framer-motion"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

// lazy imports
const QuickBlogModal = lazy(() => import("@components/multipleStepModal/QuickBlogModal"))
const AdvancedBlogModal = lazy(() => import("@components/multipleStepModal/AdvancedBlogModal"))
const BulkBlogModal = lazy(() => import("@components/multipleStepModal/BulkBlogModal"))
const KeywordResearchModel = lazy(
  () => import("../components/dashboardModals/KeywordResearchModel")
)
const PerformanceMonitoringModal = lazy(
  () => import("../components/dashboardModals/PerformanceMonitoringModal")
)
const CompetitiveAnalysisModal = lazy(
  () => import("../components/dashboardModals/CompetitiveAnalysisModal")
)

const Dashboard = () => {
  const [activeModel, setActiveModel] = useState("")
  const [loading, setLoading] = useState(true)
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  const navigate = useNavigate()
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { openJobModal } = useJobStore()
  const { clearSelectedKeywords } = useAnalysisStore()
  const { handlePopup } = useConfirmPopup()
  const queryClient = useQueryClient()
  const [runTour, setRunTour] = useState(false)

  // Fetch blog status for analytics cards
  const { data: blogStatus } = useQuery({
    queryKey: ["blogStatus"],
    queryFn: () => {
      const endDate = dayjs().endOf("day").toISOString()
      const params = { start: new Date(user?.createdAt || Date.now()).toISOString(), end: endDate }
      return getBlogStatus(params)
    },
    enabled: !!user,
  })

  // Fetch Recent Successful Blogs
  const { data: recentBlogsData } = useQuery({
    queryKey: ["recentBlogs"],
    queryFn: () => getAllBlogs({ limit: 20, sort: "createdAt:desc" }), // Fetch more to ensure we find successful ones
    enabled: !!user,
  })

  // Fix: Handle API response structure { data: [...] }
  const blogsArray = Array.isArray(recentBlogsData)
    ? recentBlogsData
    : recentBlogsData?.data || recentBlogsData?.blogs || []

  const recentBlogs = blogsArray.filter(b => b.status === "complete" && !b.isArchived).slice(0, 4)

  const stats = blogStatus?.stats || {}
  const { totalBlogs = 0, postedBlogs = 0, archivedBlogs = 0, brandedBlogs = 0 } = stats

  const hasAnalyticsData =
    totalBlogs > 0 || postedBlogs > 0 || archivedBlogs > 0 || brandedBlogs > 0

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  useEffect(() => {
    const initUser = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      try {
        await loadAuthenticatedUser()
        setLoading(false)
      } catch (error) {
        console.error("User init failed:", error)
        setLoading(false)
      }
    }
    initUser()
  }, [navigate])

  useEffect(() => {
    if (!user || !user._id) return
    const isMobile = window.innerWidth < 768
    const hasSeenTour = localStorage.getItem(`hasSeenDashboardTour_${user._id}`) === "true"
    const hasCompletedOnboarding =
      localStorage.getItem(`hasCompletedOnboarding_${user._id}`) === "true"
    const justCompletedOnboarding = sessionStorage.getItem("justCompletedOnboarding") === "true"

    if (
      !user.lastLogin &&
      hasCompletedOnboarding &&
      !hasSeenTour &&
      justCompletedOnboarding &&
      !isMobile
    ) {
      sessionStorage.removeItem("justCompletedOnboarding")
      setTimeout(() => setRunTour(true), 1000)
    }
  }, [user])

  const handleCloseModal = () => {
    setShowWhatsNew(false)
    sessionStorage.setItem("hasSeenGoThrough", "true")
  }

  const handleCloseActiveModal = () => {
    if ([ACTIVE_MODELS.Advanced_Blog].includes(activeModel)) {
      clearSelectedKeywords()
    }
    setActiveModel("")
  }

  const openSecondStepJobModal = () => {
    setActiveModel("")
    navigate("/jobs")
    openJobModal()
  }

  const renderModel = () => {
    switch (activeModel) {
      case ACTIVE_MODELS.Quick_Blog:
        return <QuickBlogModal type="quick" closeFnc={handleCloseActiveModal} />
      case ACTIVE_MODELS.YouTube_Blog:
        return <QuickBlogModal type="yt" closeFnc={handleCloseActiveModal} />
      case ACTIVE_MODELS.Advanced_Blog:
        return <AdvancedBlogModal closeFnc={handleCloseActiveModal} queryClient={queryClient} />
      case ACTIVE_MODELS.Bulk_Blog:
        return <BulkBlogModal closeFnc={handleCloseActiveModal} />
      case ACTIVE_MODELS.Keyword_Research:
        return (
          <KeywordResearchModel
            closeFnc={handleCloseActiveModal}
            openSecondStepModal={() => setActiveModel(ACTIVE_MODELS.Advanced_Blog)}
            openJobModal={openSecondStepJobModal}
            visible={activeModel == ACTIVE_MODELS.Keyword_Research}
          />
        )
      case ACTIVE_MODELS.Performance_Monitoring:
        return (
          <PerformanceMonitoringModal
            allBlogs={[]}
            closeFnc={handleCloseActiveModal}
            visible={activeModel == ACTIVE_MODELS.Performance_Monitoring}
          />
        )
      case ACTIVE_MODELS.Competitor_Analysis:
        return (
          <CompetitiveAnalysisModal
            closeFnc={handleCloseActiveModal}
            open={activeModel == ACTIVE_MODELS.Competitor_Analysis}
          />
        )
      default:
        return <></>
    }
  }

  // --- Tool Categorization ---

  // 1. Blog Creation Studio (Priority Tools)
  const creationTools = tools.filter(t =>
    ["quick-blog", "advanced-blog", "bulk-blog", "youtube-blog"].includes(t.id)
  )

  // 2. Content Suite (Rest of Content)
  const contentTools = tools.filter(
    t =>
      ["blog", "youtube", "text", "image", "social"].includes(t.category) &&
      !creationTools.find(ct => ct.id === t.id)
  )

  // 3. Growth & SEO (Research, Analysis, Ranking)
  const growthTools = tools.filter(
    t => !creationTools.find(ct => ct.id === t.id) && !contentTools.find(ct => ct.id === t.id)
  )

  const sections = [
    {
      title: "Content Suite",
      description: "Tools for refining and expanding your content",
      data: contentTools,
      id: "content-suite",
    },
    {
      title: "Growth & SEO",
      description: "Analyze, rank, and grow your audience",
      data: growthTools,
      id: "growth-seo",
    },
  ]

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>Home | GenWrite</title>
      </Helmet>

      {showWhatsNew && <GoThrough onClose={handleCloseModal} />}
      <DashboardTour
        run={runTour}
        onComplete={() => {
          setRunTour(false)
          if (user?._id) localStorage.setItem(`hasSeenDashboardTour_${user._id}`, "true")
        }}
        onOpenQuickBlog={() => setActiveModel(ACTIVE_MODELS.Quick_Blog)}
      />

      {activeModel && renderModel()}

      <motion.div
        className="min-h-screen p-4 md:p-8 space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header / Hero Section */}
        <motion.div variants={itemVariants} className="mt-4">
          <h1 className="text-3xl font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {getGreeting()},{" "}
            <span className="text-transparent">{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="text-gray-600 mt-2 text-base font-medium">Your creative command center</p>
        </motion.div>

        {/* Analytics Cards */}
        {hasAnalyticsData && (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {/* Analytics Shortcut */}
            <motion.div
              variants={itemVariants}
              onClick={() => navigate("/analytics")}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer"
            >
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-[0.08] transition-opacity" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-bold">Analytics</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Insights & Trends</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                VIEW REPORTS &rarr;
              </div>
            </motion.div>

            {/* Total Blogs */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-[0.06] transition-opacity" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Blogs</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{totalBlogs}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Posted */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-linear-to-br from-green-400 to-emerald-600 opacity-0 group-hover:opacity-[0.06] transition-opacity" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Posted</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">
                    {postedBlogs}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 text-green-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Archived */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-linear-to-br from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-[0.06] transition-opacity" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Archived</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-1">
                    {archivedBlogs}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
                  <Archive className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Branded */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-linear-to-br from-pink-500 to-purple-600 opacity-0 group-hover:opacity-[0.06] transition-opacity" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Branded</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-1">
                    {brandedBlogs}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                  <BadgePercent className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* --- Blog Creation Studio (Priority Section) --- */}
        <motion.div variants={itemVariants} className="relative">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Blog Creation Studio
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creationTools.map(tool => (
              <motion.div
                key={tool.id}
                className="group relative bg-white border border-gray-100 hover:border-gray-200 rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-h-[180px]"
                onClick={() => setActiveModel(tool.modelKey)}
              >
                {tool.credit && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-100 group-hover:bg-yellow-50 group-hover:text-yellow-700 group-hover:border-yellow-100 transition-colors shadow-sm">
                    <Coins className="w-3 h-3" />
                    {tool.credit}
                  </div>
                )}

                <div className="relative ">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${tool.bgColor || "bg-gray-50"} ${tool.color || "text-gray-600"} shadow-sm`}
                  >
                    {tool.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight pr-12">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {tool.description}
                  </p>
                </div>

                <div className="relative z-10 mt-3 flex items-center text-xs font-semibold text-gray-600 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Create Now <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- Other Tool Sections --- */}
        <div className="space-y-12 pb-10">
          {sections.map(_section => {
            const section = _section // alias
            return (
              section.data.length > 0 && (
                <motion.div key={section.id} variants={itemVariants}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="text-gray-500 mt-1">{section.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {section.data.map(tool => (
                      <ToolCard
                        key={tool.id}
                        item={tool}
                        onClick={() => tool.type === "modal" && setActiveModel(tool.modelKey)}
                      />
                    ))}
                  </div>
                </motion.div>
              )
            )
          })}
        </div>

        {/* --- Recent Successful Blogs (Footer) --- */}
        {recentBlogs.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Recent Creations
              </h2>
              <button
                onClick={() => navigate("/all-blogs")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>

            <div className="gap-6">
              {recentBlogs.slice(0, 4).map(blog => (
                <motion.div
                  key={blog._id}
                  onClick={() => navigate(`/blog/${blog._id}`)}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg cursor-pointer transition-all overflow-hidden flex flex-col h-full mb-8"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${blog.aiModel?.includes("gpt") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          {blog.aiModel || "AI"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {dayjs(blog.createdAt).fromNow(true)} ago
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3 leading-snug">
                      {blog.title || "Untitled Blog"}
                    </h4>

                    {blog.shortContent && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                        {blog.shortContent}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-end pt-4">
                      <span className="text-xs text-gray-400 font-medium group-hover:translate-x-1 transition-transform">
                        Read &rarr;
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Feedback Button */}
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScIdA2aVtugx-zMGON8LJKD4IRWtLZqiiurw-jU6wRYfOv7EA/viewform?usp=sharing&ouid=117159793210831255816"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-[-30px] bottom-36 z-50 bg-blue-600 text-white px-4 py-2 rounded-t-lg rotate-90 flex items-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-md origin-bottom-right"
        >
          Feedback
        </a>
      </motion.div>
    </Suspense>
  )
}

export default Dashboard
