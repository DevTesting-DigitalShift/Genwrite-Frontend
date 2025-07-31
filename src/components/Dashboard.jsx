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
  ThumbsUp, // Added for feedback button
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
  const { blogs, error } = useSelector((state) => state.blog)
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
    // dispatch(fetchBlogStatus())
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
      const recent = blogs.data.filter((b) => b.isArchived === false).slice(0, 3)
      setRecentBlogData(recent)
    } else {
      setRecentBlogData([])
    }
  }, [blogs])

  // Handle errors
  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

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

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-5 ml-10"
      >
        <h1 className="bg-clip-text bg-gradient-to-r font-bold from-blue-600 md:text-4xl text-3xl text-transparent to-purple-600">
          Let's Begin <span className="ml-2 text-2xl text-yellow-400">✨</span>
        </h1>
        <p className="text-gray-600 text-lg mt-2">
          Welcome back <b>{user?.name || "User"}</b>! Ready to create something amazing today?
        </p>
      </motion.div>

      <div className="min-h-screen bg-gray-50 p-6 relative">
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
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <AnimatePresence>
                  {loading
                    ? Array.from({ length: 4 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                    : quickTools.map((item, index) => {
                        const functions = {}

                        if (item.id === 1) {
                          functions.showKeywordResearch = () => setKeywordResearchModal(true)
                        } else if (item.id === 2) {
                          functions.showSeoAnalysis = () => setSeoAnalysisModal(true)
                        } else if (item.id === 3) {
                          functions.showPerformanceMonitoring = () => setPerformanceModal(true)
                        } else if (item.id === 4) {
                          functions.showCompetitiveAnalysis = () => showCompetitiveAnalysis()
                        }

                        return (
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
                            functions={functions}
                          />
                        )
                      })}
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
          href="https://docs.google.com/forms/d/e/1FAIpQLScIdA2aVtugx-zMGON8LJKD4IRWtLZqiiurw-jU6wRYfOv7EA/viewform?usp=sharing&ouid=117159793210831255816
"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-0 bottom-28 z-50"
        >
          <button
            className="fixed right-[-30px] bottom-28 bg-blue-600 text-white px-4 py-2 rounded-lg rotate-90 flex items-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-md z-50"
            style={{
              // transformOrigin: "bottom right",
              backfaceVisibility: "hidden", // Helps with blurry text sometimes
              WebkitFontSmoothing: "antialiased", // Fix for Safari
              MozOsxFontSmoothing: "grayscale", // Fix for Firefox
            }}
            aria-label="Provide feedback"
          >
            Feedback
          </button>
        </a>
      </div>
    </>
  )
}

export default Dashboard
