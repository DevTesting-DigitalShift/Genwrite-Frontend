import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { DashboardBox, QuickBox, Blogs } from "../utils/DashboardBox"
import { useDispatch, useSelector } from "react-redux"
import { createNewBlog, fetchAllBlogs, fetchBlogs } from "@store/slices/blogSlice"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { AnimatePresence, motion } from "framer-motion"
import { loadAuthenticatedUser, selectUser } from "@store/slices/authSlice"
import { Clock, Sparkles } from "lucide-react"
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

  // Default state
  const [dateRange, setDateRange] = useState([undefined, undefined])

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

  // Consolidated useEffect for GoThrough modal logic
  useEffect(() => {
    const currentUser = user
    const hasSeenGoThrough = sessionStorage.getItem("hasSeenGoThrough") === "true"
    if (currentUser && !currentUser.lastLogin && !hasSeenGoThrough) {
      setShowWhatsNew(true)
    } else {
      setShowWhatsNew(false) // Explicitly set to false to prevent reappearing
    }
  }, [user])

  const handleCloseModal = () => {
    setShowWhatsNew(false)
    sessionStorage.setItem("hasSeenGoThrough", "true")
  }

  const openSecondStepJobModal = () => {
    setKeywordResearchModal(false)
    dispatch(openJobModal())
    navigate("/jobs")
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
      const estimatedBlogCost = getEstimatedCost("blog.single", updatedData.aiModel || "default")
      handlePopup({
        title: "Confirm Blog Creation",
        description: (
          <>
            <span>
              Single Blog generation cost: <b>{estimatedBlogCost} credits</b>
            </span>
            <br />
            <span>Do you want to continue?</span>
          </>
        ),
        onConfirm: () => {
          if (estimatedBlogCost > totalCredits) {
            message.error("You do not have enough credits to generate this blog.")
            handlePopup(false)
            return
          }
          dispatch(createNewBlog({ blogData: updatedData, user, navigate }))
        },
      })
      dispatch(clearSelectedKeywords())
    } catch (error) {
      console.error("Error submitting form:", error)
      message.error("Failed to create blog.")
    }
  }

  const handleCloseActiveModal = () => {
    if ([ACTIVE_MODELS.Advanced_Blog, ACTIVE_MODELS.Keyword_Research].includes(activeModel)) {
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

      <InlineAnnouncementBanner />

      {activeModel && renderModel()}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-10 md:mt-5 ml-5 md:ml-10"
      >
        <h1 className="bg-clip-text bg-gradient-to-r font-bold from-blue-600 md:text-4xl text-3xl text-transparent to-purple-600">
          Let's Begin <span className="ml-2 text-2xl text-yellow-400">✨</span>
        </h1>
        <p className="text-gray-600 text-lg mt-2">
          Welcome back <b>{user?.name || "User"}</b>! Ready to create something amazing today?
        </p>
      </motion.div>

      <div className="min-h-screen p-2 md:p-6 relative">
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
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-4">
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
                      />
                    ))}
              </AnimatePresence>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Tools</h2>
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

            {recentBlogData.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mt-6">
                <div className="mb-6 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
                  </div>
                </div>
                <div>
                  <AnimatePresence>
                    {loading
                      ? Array.from({ length: 3 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                      : recentBlogData.map((item, index) => (
                          <Blogs
                            key={index}
                            title={item.title}
                            content={item.content}
                            tags={item.focusKeywords}
                            item={item}
                            time={item.updatedAt}
                          />
                        ))}
                  </AnimatePresence>
                  <div className="mt-6 text-center">
                    <button
                      className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => navigate("/blogs")}
                    >
                      View All Projects
                    </button>
                  </div>
                </div>
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
