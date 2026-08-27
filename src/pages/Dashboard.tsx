import { asApiError } from "@/types/api"
import { useState, useEffect, lazy, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import useWorkspaceStore from "@store/useWorkspaceStore"
import useJobStore from "@store/useJobStore"
import useAnalysisStore from "@store/useAnalysisStore"
import useBlogStore from "@store/useBlogStore"
import { toast } from "sonner"
import GoThrough from "../components/dashboardModals/GoThrough"
import LoadingScreen from "@components/ui/LoadingScreen"
import { ACTIVE_MODELS } from "@/data/dashModels"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import DashboardTour from "@components/DashboardTour"
import { getBlogStatus } from "@/api/analysisApi"
import { getDefaultFilterStart } from "@utils/dateDefaults"
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard"
import { getActiveToken } from "@utils/sessionStore"
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
  ChevronRight,
  Coins,
  Lock,
  ArrowRight,
  Search,
  Loader2,
} from "lucide-react"
import { type Variants, motion } from "framer-motion"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

// lazy imports
const QuickBlogModal = lazy(() => import("@components/multipleStepModal/QuickBlogModal"))
const AdvancedBlogModal = lazy(() => import("@components/multipleStepModal/AdvancedBlogModal"))
const BulkBlogModal = lazy(() => import("@components/multipleStepModal/BulkBlogModal"))

const Dashboard = () => {
  const [activeModel, setActiveModel] = useState("")
  const [_loading, setLoading] = useState<any>(true)
  const [showWhatsNew, setShowWhatsNew] = useState<any>(false)

  const navigate = useNavigate()
  const { user, loadAuthenticatedUser } = useAuthStore()
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace)
  const { openJobModal } = useJobStore()
  const { clearSelectedKeywords } = useAnalysisStore()
  const { isReadOnlyWorkspace, guardWrite, readOnlyMessage } = useReadOnlyGuard()
  const queryClient = useQueryClient()
  const [runTour, setRunTour] = useState<any>(false)

  const [topic, setTopic] = useState("")
  const [isGenerating, setIsGenerating] = useState<any>(false)
  const { createTopicBlog } = useBlogStore()

  const handleTopicSubmit = async (e: any) => {
    e.preventDefault()
    if (isReadOnlyWorkspace) {
      toast.error(readOnlyMessage)
      return
    }
    if (!topic.trim()) {
      toast.error("Please enter a blog topic.")
      return
    }
    if (topic.trim().length < 3) {
      toast.error("Topic must be at least 3 characters.")
      return
    }
    if (topic.trim().length > 300) {
      toast.error("Topic cannot exceed 300 characters.")
      return
    }

    setIsGenerating(true)
    try {
      await createTopicBlog({ topic: topic.trim(), navigate, queryClient })
      setTopic("")
    } catch (rawError) {
      const error = asApiError(rawError)
      console.error("Failed to generate blog:", error)
      toast.error(error.message || "An error occurred while generating the blog.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Fetch blog status for analytics cards
  const { data: blogStatus } = useQuery({
    queryKey: ["blogStatus", activeWorkspace?.id],
    queryFn: () => {
      const endDate = dayjs().endOf("day").toISOString()
      const start = getDefaultFilterStart(user, { isSharedWorkspace: !!activeWorkspace })
      const params = { start: new Date(start).toISOString(), end: endDate }
      return getBlogStatus(params)
    },
    enabled: !!user,
  })

  // Fetch Recent Successful Blogs
  const { data: recentBlogsData } = useQuery({
    queryKey: ["recentBlogs", activeWorkspace?.id],
    queryFn: () => getAllBlogs({ limit: 20, sort: "createdAt:desc" }), // Fetch more to ensure we find successful ones
    enabled: !!user,
  })

  // Fix: Handle API response structure { data: [...] }
  const blogsArray = Array.isArray(recentBlogsData)
    ? recentBlogsData
    : recentBlogsData?.data || recentBlogsData?.blogs || []

  const recentBlogs = blogsArray.filter((b: any) => b.status === "complete" && !b.isArchived).slice(0, 4)

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
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  useEffect(() => {
    const initUser = async () => {
      const token = getActiveToken()
      if (!token) {
        navigate("/login")
        return
      }
      try {
        await loadAuthenticatedUser()
        setLoading(false)
      } catch (rawError) {
      const error = asApiError(rawError)
        console.error("User init failed:", error)
        setLoading(false)
      }
    }
    initUser()
  }, [navigate, loadAuthenticatedUser])

  useEffect(() => {
    if (!user?._id) return
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

  const _openSecondStepJobModal = () => {
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
        return <AdvancedBlogModal closeFnc={handleCloseActiveModal} />
      case ACTIVE_MODELS.Bulk_Blog:
        return <BulkBlogModal closeFnc={handleCloseActiveModal} />
      default:
        return null
    }
  }

  // --- Tool Categorization ---

  // 1. Blog Creation Studio (Priority Tools)
  const creationTools = tools.filter((t) =>
    ["quick-blog", "advanced-blog", "bulk-blog", "youtube-blog"].includes(t.id)
  )

  // 2. Content Suite (Rest of Content)
  const contentTools = tools.filter(
    (t) =>
      ["blog", "youtube", "text", "image", "social"].includes(t.category) &&
      !creationTools.find((ct) => ct.id === t.id)
  )

  // 3. Growth & SEO (Research, Analysis, Ranking)
  const growthTools = tools.filter(
    (t) => !creationTools.find((ct) => ct.id === t.id) && !contentTools.find((ct) => ct.id === t.id)
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
      />

      {activeModel && renderModel()}

      <motion.div
        className="min-h-screen p-4 md:p-8 space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header / Hero Section */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {getGreeting()},{" "}
            <span className="text-primary">{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="text-gray-500 mt-2 text-base font-medium">Your creative command center</p>
        </motion.div>

        {/* Instant Topic-only Blog Generator Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/80 via-violet-50/50 to-white dark:from-slate-900/60 dark:via-indigo-950/15 dark:to-slate-900/40 border border-indigo-100/70 dark:border-indigo-950/80 p-6 md:p-8 shadow-xs transition-all duration-300 hover:shadow-sm"
        >
          {/* Decorative glowing gradient elements */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                Instant Blog Writer
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Enter your topic below to generate a fully structured, SEO-optimized blog post in
                seconds.
              </p>
            </div>

            <form onSubmit={handleTopicSubmit} className="w-full">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-between">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating || isReadOnlyWorkspace}
                    title={isReadOnlyWorkspace ? readOnlyMessage : undefined}
                    placeholder={
                      isReadOnlyWorkspace
                        ? "Blog creation is unavailable in a read-only workspace"
                        : "Enter blog topic (e.g., '10 Best SEO Practices for 2026')..."
                    }
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl text-sm focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200 font-medium transition-all shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || isReadOnlyWorkspace}
                  title={isReadOnlyWorkspace ? readOnlyMessage : undefined}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer sm:shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Blog
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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
              className="group relative overflow-hidden rounded-xl bg-white p-5 border border-indigo-100 shadow-none hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer"
            >
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.04] transition-opacity" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-base text-indigo-600 font-bold">Analytics</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Insights & Trends</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500 text-white">
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
              className="group relative overflow-hidden rounded-xl bg-white p-5 border border-gray-200 shadow-none hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.04] transition-opacity" />
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
              className="group relative overflow-hidden rounded-xl bg-white p-5 border border-gray-200 shadow-none hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-[0.04] transition-opacity" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Posted</p>
                  <p className="text-2xl md:text-3xl font-bold text-emerald-600 mt-1">
                    {postedBlogs}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Archived */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-xl bg-white p-5 border border-gray-200 shadow-none hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-[0.04] transition-opacity" />
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
              className="group relative overflow-hidden rounded-xl bg-white p-5 border border-gray-200 shadow-none hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.04] transition-opacity" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Branded</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary mt-1">{brandedBlogs}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
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
            {creationTools.map((tool) => (
              <motion.div
                key={tool.id}
                aria-disabled={isReadOnlyWorkspace || undefined}
                title={isReadOnlyWorkspace ? readOnlyMessage : undefined}
                className={`group relative bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 shadow-none hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between min-h-[180px] ${
                  isReadOnlyWorkspace ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={() => guardWrite(() => setActiveModel(tool.modelKey ?? ""))}
              >
                {isReadOnlyWorkspace && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold border border-gray-200">
                    <Lock className="w-3 h-3" />
                    Read-only
                  </div>
                )}
                {!isReadOnlyWorkspace && tool.credit && (
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
          {sections.map((_section) => {
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
                    {section.data.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        item={tool}
                        // Every tool is locked, not just the creation modals: the
                        // navigation-only ones land on pages that generate content and
                        // spend the owner's credits, so they're no safer to open.
                        disabled={isReadOnlyWorkspace}
                        disabledReason={readOnlyMessage}
                        onClick={() => tool.type === "modal" && setActiveModel(tool.modelKey ?? "")}
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
                type="button"
                onClick={() => navigate("/all-blogs")}
                className="text-sm text-primary hover:text-primary/80 font-bold"
              >
                View All
              </button>
            </div>

            <div className="gap-6">
              {recentBlogs.slice(0, 4).map((blog: any) => (
                <motion.div
                  key={blog._id}
                  onClick={() => navigate(`/blog/${blog._id}`)}
                  className="group bg-white rounded-xl border border-gray-200 shadow-none hover:shadow-lg cursor-pointer transition-all overflow-hidden flex flex-col h-full mb-8"
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

                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-snug">
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
          className="fixed right-[-30px] bottom-36 z-50 bg-primary text-white px-4 py-2 rounded-t-lg rotate-90 flex items-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-md origin-bottom-right"
        >
          Feedback
        </a>
      </motion.div>
    </Suspense>
  )
}

export default Dashboard
