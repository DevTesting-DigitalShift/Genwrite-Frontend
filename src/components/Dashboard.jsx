import React, { useState, useEffect } from "react"
import Modal from "../utils/Modal"
import SelectTemplateModal from "./multipleStepModal/SelectTemplateModal"
import FirstStepModal from "./multipleStepModal/FirstStepModal"
import SecondStepModal from "./multipleStepModal/SecondStepModal"
import { letsBegin, quickTools } from "./dashData/dash"
import { DashboardBox, QuickBox, Blogs } from "../utils/DashboardBox"
import { useDispatch, useSelector } from "react-redux"
import { createNewBlog, fetchAllBlogs, fetchBlogStatus } from "@store/slices/blogSlice"
import { useNavigate } from "react-router-dom"
import MultiStepModal from "./multipleStepModal/DaisyUi"
import DaisyUIModal from "./DaisyUIModal"
import QuickBlogModal from "./multipleStepModal/QuickBlogModal"
import CompetitiveAnalysisModal from "./multipleStepModal/CompetitiveAnalysisModal"
import PerformanceMonitoringModal from "./multipleStepModal/PerformanceMonitoringModal"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { AnimatePresence, motion } from "framer-motion"
import { loadAuthenticatedUser, selectUser } from "@store/slices/authSlice"
import {
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  UploadCloud,
  Archive,
  BadgePercent,
} from "lucide-react"
import { Helmet } from "react-helmet"
import SeoAnalysisModal from "./multipleStepModal/SeoAnalysisModal"
import KeywordResearchModel from "./multipleStepModal/KeywordResearchModel"
import { SkeletonDashboardCard, SkeletonGridCard } from "./Projects/SkeletonLoader"
import { openJobModal } from "@store/slices/jobSlice"
import { message } from "antd"
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
import { Pie, Line } from "react-chartjs-2"

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
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [daisyUIModal, setDaisyUIModal] = useState(false)
  const [multiStepModal, setMultiStepModal] = useState(false)
  const [quickBlogModal, setQuickBlogModal] = useState(false)
  const [competitiveAnalysisModal, setCompetitiveAnalysisModal] = useState(false)
  const [performanceModal, setPerformanceModal] = useState(false)
  const [keywordResearchModal, setKeywordResearchModal] = useState(false)
  const [seoAnalysisModal, setSeoAnalysisModal] = useState(false)
  const [modelData, setModelData] = useState({})
  const [recentBlogData, setRecentBlogData] = useState([])
  const [loading, setLoading] = useState(true)
  const [pieChartIndex, setPieChartIndex] = useState(0)
  const [lineChartIndex, setLineChartIndex] = useState(0)
  const { blogs, blogStatus, loading: statusLoading, error } = useSelector((state) => state.blog)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const { handlePopup } = useConfirmPopup()

  // Event handlers
  const showModal = () => setIsModalVisible(true)
  const showDaisy = () => setDaisyUIModal(true)
  const hideDaisy = () => setDaisyUIModal(false)
  const showMultiStepModal = () => setMultiStepModal(true)
  const hideMultiStepModal = () => setMultiStepModal(false)
  const showQuickBlogModal = () => setQuickBlogModal(true)
  const hideQuickBlogModal = () => setQuickBlogModal(false)
  const showCompetitiveAnalysis = () => setCompetitiveAnalysisModal(true)
  const hideCompetitiveAnalysis = () => setCompetitiveAnalysisModal(false)

  const openSecondStepModal = () => {
    setKeywordResearchModal(false)
    setIsModalVisible(true)
    setCurrentStep(0)
  }

  const openSecondStepJobModal = () => {
    setKeywordResearchModal(false)
    dispatch(openJobModal())
    navigate("/jobs")
  }

  // Initialize data and fetch
  useEffect(() => {
    dispatch(fetchBlogStatus())
    dispatch(fetchAllBlogs())
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
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

  useEffect(() => {
    if (blogs?.data && Array.isArray(blogs.data)) {
      const recent = blogs.data
        .filter((b) => b.status === "complete" && b.isArchived === false)
        .slice(-3)
      setRecentBlogData(recent)
    } else {
      setRecentBlogData([])
    }
  }, [blogs])

  // Auto-scroll for charts
  useEffect(() => {
    if (!blogStatus?.stats) return
    const pieInterval = setInterval(() => {
      setPieChartIndex((prev) => (prev + 1) % 2)
    }, 5000)
    const lineInterval = setInterval(() => {
      setLineChartIndex((prev) => (prev + 1) % 2)
    }, 5000)
    return () => {
      clearInterval(pieInterval)
      clearInterval(lineInterval)
    }
  }, [blogStatus])

  // Handle errors
  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

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

  // Chart Data with validation
  const pieCharts = [
    {
      title: "Blogs by Model",
      data: {
        labels: Object.keys(blogsByModel).length ? Object.keys(blogsByModel) : ["No Data"],
        datasets: [
          {
            data: Object.keys(blogsByModel).length ? Object.values(blogsByModel) : [1],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#6B7280"],
            hoverOffset: 20,
          },
        ],
      },
    },
    {
      title: "Image Sources",
      data: {
        labels: Object.keys(imageSources).length ? Object.keys(imageSources) : ["No Data"],
        datasets: [
          {
            data: Object.keys(imageSources).length ? Object.values(imageSources) : [1],
            backgroundColor: ["#10B981", "#F59E0B"],
            hoverOffset: 20,
          },
        ],
      },
    },
  ]

  const lineCharts = [
    {
      title: "Blogs by Status",
      data: {
        labels: Object.keys(blogsByStatus).length ? Object.keys(blogsByStatus) : ["No Data"],
        datasets: [
          {
            label: "Blogs by Status",
            data: Object.keys(blogsByStatus).length ? Object.values(blogsByStatus) : [0],
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
    },
    {
      title: "Templates Used",
      data: {
        labels: Object.keys(templatesUsed).length ? Object.keys(templatesUsed) : ["No Data"],
        datasets: [
          {
            label: "Templates Used",
            data: Object.keys(templatesUsed).length ? Object.values(templatesUsed) : [0],
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
    },
  ]

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 12 }, padding: 20 } },
      tooltip: { enabled: true },
    },
  }

  const lineChartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
    },
  }

  const handleSubmit = async (updatedData) => {
    try {
      const totalCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
      const estimatedBlogCost = getEstimatedCost("blog.single", modelData.aiModel || "default")
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
          dispatch(createNewBlog({ blogData: updatedData, navigate }))
          setIsModalVisible(false)
          setCurrentStep(0)
        },
      })
      dispatch(clearSelectedKeywords())
    } catch (error) {
      console.error("Error submitting form:", error)
      message.error("Failed to create blog.")
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setCurrentStep(0)
    setModelData({})
    dispatch(clearSelectedKeywords())
  }

  const handleNext = () => setCurrentStep(currentStep + 1)
  const handlePrev = () => setCurrentStep(currentStep - 1)

  return (
    <>
      <Helmet>
        <title>Home | GenWrite</title>
      </Helmet>
      <Modal
        title={`Step ${currentStep}/3`}
        visible={isModalVisible}
        onCancel={handleCancel}
        className="max-h-[90vh] overflow-scroll"
      >
        {currentStep === 0 && (
          <SelectTemplateModal
            handleNext={handleNext}
            handleClose={handleCancel}
            data={modelData}
            setData={setModelData}
          />
        )}
        {currentStep === 1 && (
          <FirstStepModal
            handleNext={handleNext}
            handleClose={handleCancel}
            handlePrevious={handlePrev}
            data={modelData}
            setData={setModelData}
          />
        )}
        {currentStep === 2 && (
          <SecondStepModal
            handleNext={handleNext}
            handlePrevious={handlePrev}
            handleClose={handleCancel}
            data={modelData}
            setData={setModelData}
            handleSubmit={handleSubmit}
          />
        )}
        <div className="flex items-center justify-center mt-4">
          <progress className="w-full max-w-md" max="3" value={currentStep}></progress>
        </div>
      </Modal>

      {daisyUIModal && <DaisyUIModal closeFnc={hideDaisy} />}
      {multiStepModal && <MultiStepModal closeFnc={hideMultiStepModal} />}
      {quickBlogModal && <QuickBlogModal closeFnc={hideQuickBlogModal} />}
      {competitiveAnalysisModal && (
        <CompetitiveAnalysisModal
          closeFnc={hideCompetitiveAnalysis}
          open={showCompetitiveAnalysis}
          blogs={blogs}
        />
      )}
      {performanceModal && (
        <PerformanceMonitoringModal
          allBlogs={blogs}
          closeFnc={() => setPerformanceModal(false)}
          visible={() => setPerformanceModal(true)}
        />
      )}
      {keywordResearchModal && (
        <KeywordResearchModel
          closeFnc={() => {
            setKeywordResearchModal(false)
            dispatch(clearKeywordAnalysis())
          }}
          openSecondStepModal={openSecondStepModal}
          openJobModal={openSecondStepJobModal}
          visible={keywordResearchModal}
        />
      )}
      {seoAnalysisModal && <SeoAnalysisModal closeFnc={() => setSeoAnalysisModal(false)} />}

      <div className="min-h-screen bg-gray-50 p-6">
        {loading || statusLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Let's Begin <span className="ml-2 text-2xl text-yellow-400">✨</span>
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                Welcome back <b>{user?.name || "User"}</b>! Ready to create something amazing today?
              </p>
            </motion.div>

            {/* Blog Statistics */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Blog Statistics</h2>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    title: "Total Blogs",
                    value: totalBlogs,
                    icon: <FileText className="w-5 h-5 text-white" />,
                    iconBg: "bg-blue-500",
                    cardBg: "bg-blue-50", // soft bg
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
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
        group relative ${item.cardBg} p-4 rounded-xl border border-gray-200
        shadow-sm hover:shadow-md transition-all duration-300
        hover:ring-1 hover:ring-offset-2 ${item.ringColor}
      `}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">{item.title}</h3>
                        <div className={`p-2 rounded-md ${item.iconBg} shadow-md`}>{item.icon}</div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              {blogStatus?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pieCharts[pieChartIndex].title}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPieChartIndex((prev) => (prev - 1 + 2) % 2)}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Previous Pie Chart"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setPieChartIndex((prev) => (prev + 1) % 2)}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Next Pie Chart"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <motion.div
                      key={pieChartIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="h-64"
                    >
                      <Pie data={pieCharts[pieChartIndex].data} options={chartOptions} />
                    </motion.div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lineCharts[lineChartIndex].title}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLineChartIndex((prev) => (prev - 1 + 2) % 2)}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Previous Line Chart"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setLineChartIndex((prev) => (prev + 1) % 2)}
                          className="p-1 hover:bg-gray-100 rounded"
                          aria-label="Next Line Chart"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <motion.div
                      key={lineChartIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="h-64"
                    >
                      <Line data={lineCharts[lineChartIndex].data} options={lineChartOptions} />
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {loading
                  ? Array.from({ length: 3 }).map((_, idx) => <SkeletonDashboardCard key={idx} />)
                  : letsBegin.map((item, index) => (
                      <DashboardBox
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        content={item.content}
                        id={item.id}
                        gradient={item.hoverGradient}
                        functions={{
                          showModal,
                          setModelData,
                          showDaisy,
                          showMultiStepModal,
                          showQuickBlogModal,
                          showCompetitiveAnalysis,
                        }}
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
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {loading
                    ? Array.from({ length: 3 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                    : quickTools.map((item, index) => (
                        <QuickBox
                          key={index}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          content={item.content}
                          id={item.id}
                          color={item.color}
                          icon={item.icon}
                          bgColor={item.bgColor}
                          hoverBg={item.hoverBg}
                          functions={{
                            ...(item.id === 3
                              ? { showPerformanceMonitoring: () => setPerformanceModal(true) }
                              : {}),
                            ...(item.id === 2
                              ? { showSeoAnalysis: () => setSeoAnalysisModal(true) }
                              : {}),
                            ...(item.id === 1
                              ? { showKeywordResearch: () => setKeywordResearchModal(true) }
                              : {}),
                            ...(item.id === 4 ? { showCompetitiveAnalysis } : {}),
                          }}
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
      </div>
    </>
  )
}

export default Dashboard
