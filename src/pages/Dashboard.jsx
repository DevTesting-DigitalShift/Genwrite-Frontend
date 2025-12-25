import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { DashboardBox, QuickBox, Blogs } from "../utils/DashboardBox"
import { useDispatch, useSelector } from "react-redux"
import { createNewBlog, fetchAllBlogs, fetchBlogs } from "@store/slices/blogSlice"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { computeCost } from "@/data/pricingConfig"
import { AnimatePresence, motion } from "framer-motion"
import { loadAuthenticatedUser, selectUser } from "@store/slices/authSlice"
import { Clock, Sparkles, FileText, UploadCloud, Archive, BadgePercent } from "lucide-react"
import { Helmet } from "react-helmet"
import { SkeletonDashboardCard, SkeletonGridCard } from "../components/UI/SkeletonLoader"
import { openJobModal } from "@store/slices/jobSlice"
import { message, Modal } from "antd"
import { clearKeywordAnalysis, clearSelectedKeywords } from "@store/slices/analysisSlice"
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import GoThrough from "../components/dashboardModals/GoThrough"
import { letsBegin, quickTools } from "../data/dashData/dash"
import InlineAnnouncementBanner from "@/layout/InlineAnnouncementBanner"
import dayjs from "dayjs"
import LoadingScreen from "@components/UI/LoadingScreen"
import { ACTIVE_MODELS } from "@/data/dashModels"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import DashboardTour from "@components/DashboardTour"
import { getBlogStatus } from "@/api/analysisApi"
import WinterSaleBanner from "../components/WinterSaleBanner"

// lazy imports
const QuickBlogModal = lazy(() => import("@components/multipleStepModal/QuickBlogModal"))
const AdvancedBlogModal = lazy(() => import("@components/multipleStepModal/AdvancedBlogModal"))
const BulkBlogModal = lazy(() => import("@components/multipleStepModal/BulkBlogModal"))
const KeywordResearchModel = lazy(() =>
  import("../components/dashboardModals/KeywordResearchModel")
)
const PerformanceMonitoringModal = lazy(() =>
  import("../components/dashboardModals/PerformanceMonitoringModal")
)
const CompetitiveAnalysisModal = lazy(() =>
  import("../components/dashboardModals/CompetitiveAnalysisModal")
)

ChartJS.register(
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const Dashboard = () => {
  const [activeModel, setActiveModel] = useState("")
  const [recentBlogData, setRecentBlogData] = useState([])
  const [loading, setLoading] = useState(true)
  const { blogs, error, allBlogs } = useSelector(state => state.blog)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const { handlePopup } = useConfirmPopup()
  const queryClient = useQueryClient()
  const [runTour, setRunTour] = useState(false)

  // Default state
  const [dateRange, setDateRange] = useState([undefined, undefined])

  // Fetch blog status for analytics cards
  const { data: blogStatus } = useQuery({
    queryKey: ["blogStatus"],
    queryFn: () => {
      const endDate = dayjs().endOf("day").toISOString()
      const params = {
        start: new Date(user?.createdAt || Date.now()).toISOString(),
        end: endDate,
      }
      return getBlogStatus(params)
    },
    enabled: !!user,
  })

  const stats = blogStatus?.stats || {}
  const { totalBlogs = 0, postedBlogs = 0, archivedBlogs = 0, brandedBlogs = 0 } = stats

  // Check if we should show analytics cards (only if there's data)
  const hasAnalyticsData =
    totalBlogs > 0 || postedBlogs > 0 || archivedBlogs > 0 || brandedBlogs > 0

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  let limit = 5
  let sort = "updatedAt:desc"
  // Fetch function
  const fetchBlogsQuery = useCallback(async () => {
    if (!user?.createdAt) return

    setLoading(true)

    const startDate = user.createdAt
    const endDate = dateRange[1] || dayjs().endOf("day")

    const queryParams = {
      start: dayjs(startDate).toISOString(),
      end: dayjs(endDate).endOf("day").toISOString(),
      limit,
      sort, // just this one
    }

    try {
      const response = await dispatch(fetchAllBlogs(queryParams)).unwrap()

      const activeBlogs = (response.data || []).filter(b => !b.isArchived)

      // Sort only if `sort` is provided
      let sortedBlogs = activeBlogs
      if (sort) {
        sortedBlogs = [...activeBlogs].sort((a, b) => {
          const aValue = a[sort]
          const bValue = b[sort]

          // Check if values are dates
          if (dayjs(aValue).isValid() && dayjs(bValue).isValid()) {
            return dayjs(bValue).valueOf() - dayjs(aValue).valueOf() // default desc
          }
          // fallback for numbers/strings
          if (typeof aValue === "number" && typeof bValue === "number") return bValue - aValue
          if (typeof aValue === "string" && typeof bValue === "string")
            return bValue.localeCompare(aValue)
          return 0
        })
      }

      setRecentBlogData(sortedBlogs.slice(0, 3))
    } catch (error) {
      console.error("Failed to fetch blogs:", error)
      setRecentBlogData([])
    } finally {
      setLoading(false)
    }
  }, [dispatch, dateRange, limit, user?.createdAt, sort])

  useEffect(() => {
    if (!blogs?.data || !Array.isArray(blogs.data)) {
      setRecentBlogData([])
      return
    }

    const activeBlogs = blogs.data.filter(b => !b.isArchived)

    // Sort DESC → newest first
    const sortedBlogs = activeBlogs.sort(
      (a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()
    )

    // Take top 3
    setRecentBlogData(sortedBlogs.slice(0, 3))
  }, [blogs])

  // Fetch blogs on mount
  useEffect(() => {
    fetchBlogsQuery()
  }, [fetchBlogsQuery])

  // Show walkthrough only for first-time users on desktop
  useEffect(() => {
    if (!user) return

    // Check if device is mobile (width < 768px)
    const isMobile = window.innerWidth < 768

    const hasSeenTour = localStorage.getItem("hasSeenDashboardTour") === "true"
    const hasCompletedOnboarding = localStorage.getItem("hasCompletedOnboarding") === "true"
    const justCompletedOnboarding = sessionStorage.getItem("justCompletedOnboarding") === "true"

    console.log("Dashboard Flow Check:", {
      hasSeenTour,
      hasCompletedOnboarding,
      justCompletedOnboarding,
      userLastLogin: user.lastLogin,
      isMobile,
    })

    // Show tour for first-time users who just completed onboarding (desktop only)
    // Check both lastLogin and localStorage (localStorage is fallback for immediate check)
    if (
      !user.lastLogin &&
      hasCompletedOnboarding &&
      !hasSeenTour &&
      justCompletedOnboarding &&
      !isMobile
    ) {
      console.log("Starting tour for first-time user after onboarding...")
      sessionStorage.removeItem("justCompletedOnboarding") // Clean up flag
      setTimeout(() => setRunTour(true), 1000)
    }
  }, [user])

  const handleCloseModal = () => {
    setShowWhatsNew(false)
    sessionStorage.setItem("hasSeenGoThrough", "true")
    sessionStorage.removeItem("showIntroVideo") // Clean up flag
  }

  const openSecondStepJobModal = () => {
    setActiveModel("")
    navigate("/jobs")
    dispatch(openJobModal())
  }

  useEffect(() => {
    dispatch(fetchBlogs())
  }, [dispatch])

  useEffect(() => {
    const initUser = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      try {
        const result = await dispatch(loadAuthenticatedUser())
        if (loadAuthenticatedUser.rejected.match(result)) {
          console.warn("Failed to load user, redirecting...")
          navigate("/login")
        }
      } catch (error) {
        console.error("User init failed:", error)
        message.error("Failed to load user data.")
      }
    }
    initUser()
  }, [dispatch, navigate])

  const handleSubmit = updatedData => {
    try {
      const totalCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
      // Prepare features array based on selected options
      const features = []
      if (updatedData.isCheckedBrand) features.push("brandVoice")
      if (updatedData.options?.includeCompetitorResearch) features.push("competitorResearch")
      if (updatedData.options?.performKeywordResearch) features.push("keywordResearch")
      if (updatedData.options?.includeInterlinks) features.push("internalLinking")
      if (updatedData.options?.includeFaqs) features.push("faqGeneration")

      const estimatedBlogCost = computeCost({
        wordCount: updatedData.userDefinedLength || 1000,
        features,
        aiModel: updatedData.aiModel || "gemini",
        includeImages: updatedData.isCheckedGeneratedImages || false,
        imageSource: updatedData.imageSource || "stock",
        numberOfImages:
          updatedData.imageSource === "custom"
            ? updatedData.blogImages?.length || 0
            : updatedData.numberOfImages || 0,
      })

      // Check if user has sufficient credits
      if (estimatedBlogCost > totalCredits) {
        handlePopup({
          title: "Insufficient Credits",
          description: (
            <div>
              <p>You don't have enough credits to generate this blog.</p>
              <p className="mt-1">
                <strong>Required:</strong> {estimatedBlogCost} credits
              </p>
              <p>
                <strong>Available:</strong> {totalCredits} credits
              </p>
            </div>
          ),
          okText: "Buy Credits",
          onConfirm: () => {
            navigate("/pricing")
          },
        })
        return
      }

      // Directly create blog without confirmation
      dispatch(createNewBlog({ blogData: updatedData, user, navigate, queryClient }))
      dispatch(clearSelectedKeywords())
    } catch (error) {
      console.error("Error submitting form:", error)
      message.error("Failed to create blog.")
    }
  }

  const handleCloseActiveModal = () => {
    if ([ACTIVE_MODELS.Advanced_Blog].includes(activeModel)) {
      dispatch(clearSelectedKeywords())
    }
    setActiveModel("")
  }

  const renderModel = () => {
    switch (activeModel) {
      case ACTIVE_MODELS.Quick_Blog:
        return <QuickBlogModal type="quick" closeFnc={handleCloseActiveModal} />
      case ACTIVE_MODELS.YouTube_Blog:
        return <QuickBlogModal type="yt" closeFnc={handleCloseActiveModal} />
      case ACTIVE_MODELS.Advanced_Blog:
        return <AdvancedBlogModal closeFnc={handleCloseActiveModal} onSubmit={handleSubmit} />
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
            allBlogs={allBlogs}
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
          localStorage.setItem("hasSeenDashboardTour", "true")
        }}
        onOpenQuickBlog={() => setActiveModel(ACTIVE_MODELS.Quick_Blog)}
      />

      <WinterSaleBanner />

      <InlineAnnouncementBanner />

      {activeModel && renderModel()}

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-10 md:mt-5 ml-4 md:ml-10 mr-4 md:mr-10 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {getGreeting()},{" "}
              <span className="text-transparent">{user?.name?.split(" ")[0] || "there"}</span>
            </h1>

            <p className="text-gray-600 mt-1 text-base font-medium">
              Let's create something amazing today
            </p>
          </div>
        </div>

        {/* Analytics Cards - Only show if there's data */}
        {hasAnalyticsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Blogs */}
            <motion.div
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-5
               border border-gray-100 shadow-sm"
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-[0.06] transition-opacity" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Blogs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalBlogs}</p>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Posted */}
            <motion.div
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-5
               border border-gray-100 shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 opacity-0 group-hover:opacity-[0.06] transition-opacity" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Posted</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{postedBlogs}</p>
                </div>

                <div className="p-3 rounded-xl bg-green-500/10 text-green-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Archived */}
            <motion.div
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-5
               border border-gray-100 shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-[0.06] transition-opacity" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Archived</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{archivedBlogs}</p>
                </div>

                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
                  <Archive className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Branded */}
            <motion.div
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-5
               border border-gray-100 shadow-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 opacity-0 group-hover:opacity-[0.06] transition-opacity" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Branded</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{brandedBlogs}</p>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                  <BadgePercent className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      <div className="min-h-screen p-3 md:p-6 relative">
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonDashboardCard key={idx} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <SkeletonGridCard key={idx} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonDashboardCard key={idx} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonGridCard key={idx} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10 p-0 md:p-6 pt-0">
            {/* Let's Begin Section */}
            <div data-tour="lets-begin">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Let's Begin
                </h2>
              </div>
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                data-tour="quick-actions"
              >
                <AnimatePresence>
                  {loading
                    ? Array.from({ length: 4 }).map((_, idx) => <SkeletonDashboardCard key={idx} />)
                    : letsBegin.map((item, index) => (
                        <DashboardBox
                          key={index}
                          icon={item.icon}
                          title={item.title}
                          content={item.content}
                          id={item.id}
                          gradient={item.hoverGradient}
                          showModal={() => setActiveModel(item.modelKey)}
                          dataTour={index === 0 ? "create-blog" : undefined}
                        />
                      ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Tools Section */}
            <div data-tour="analytics">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Quick Tools
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <AnimatePresence>
                  {loading
                    ? Array.from({ length: 4 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                    : quickTools.map((item, index) => (
                        <QuickBox
                          key={index}
                          id={item.id}
                          icon={item.icon}
                          title={item.title}
                          content={item.content}
                          bgColor={item.bgColor}
                          hoverBg={item.hoverBg}
                          color={item.color}
                          navigate={item.navigate}
                          showModal={() => setActiveModel(item?.modelKey || "")}
                        />
                      ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Recent Projects Section */}
            {recentBlogData.length > 0 && !runTour && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Recent Projects
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate("/blogs")}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View All →
                  </button>
                </div>
                <AnimatePresence>
                  {loading
                    ? Array.from({ length: 3 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                    : recentBlogData.map((item, index) => (
                        <Blogs
                          key={index}
                          title={item.title}
                          content={item.shortContent}
                          tags={item.focusKeywords}
                          item={item}
                          time={item.updatedAt}
                        />
                      ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
        {/* Feedback Button */}
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScIdA2aVtugx-zMGON8LJKD4IRWtLZqiiurw-jU6wRYfOv7EA/viewform?usp=sharing&ouid=117159793210831255816"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-0 bottom-28 z-50"
        >
          <button
            className="fixed right-[-30px] bottom-28 bg-blue-600 text-white px-4 py-2 rounded-lg rotate-90 flex items-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-md z-50"
            style={{
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}
            aria-label="Provide feedback"
          >
            Feedback
          </button>
        </a>
      </div>
    </Suspense>
  )
}

export default Dashboard
