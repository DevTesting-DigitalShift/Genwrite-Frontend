import { useState, useEffect } from "react"
import Modal from "../utils/Modal"
import SelectTemplateModal from "./multipleStepModal/SelectTemplateModal"
import FirstStepModal from "./multipleStepModal/FirstStepModal"
import SecondStepModal from "./multipleStepModal/SecondStepModal"
import { letsBegin, quickTools, stats } from "./dashData/dash"
import { DashboardBox, QuickBox, Blogs } from "../utils/DashboardBox"
import { useDispatch, useSelector } from "react-redux"
import { createNewBlog } from "@store/slices/blogSlice"
import { useNavigate } from "react-router-dom"
import MultiStepModal from "./multipleStepModal/DaisyUi"
import DaisyUIModal from "./DaisyUIModal"
import QuickBlogModal from "./multipleStepModal/QuickBlogModal"
import CompetitiveAnalysisModal from "./multipleStepModal/CompetitiveAnalysisModal"
import PerformanceMonitoringModal from "./multipleStepModal/PerformanceMonitoringModal"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { AnimatePresence } from "framer-motion"
import { loadAuthenticatedUser, selectUser } from "@store/slices/authSlice"
import { Clock, Sparkles } from "lucide-react"
import { Helmet } from "react-helmet"
import SeoAnalysisModal from "./multipleStepModal/SeoAnalysisModal"
import KeywordResearchModel from "./multipleStepModal/KeywordResearchModel"
import { getAllBlogs } from "@api/blogApi"
import { SkeletonDashboardCard, SkeletonGridCard } from "./Projects/SkeletonLoader"
import { openJobModal } from "@store/slices/jobSlice"
import { message } from "antd"
import { motion } from "framer-motion"
import { clearKeywordAnalysis } from "@store/slices/analysisSlice"

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
  const { blogs} = useSelector((state) => state.blog)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const { handlePopup } = useConfirmPopup()

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

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
      }
    }

    initUser()
  }, [dispatch, navigate])

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogs = await getAllBlogs()
        const recent = blogs
          .filter((b) => b.status === "complete" && b.isArchived === false)
          .slice(-3)
        setRecentBlogData(recent)
      } catch (error) {
        console.error("Error fetching blogs:", error.message)
      }
    }

    fetchBlogs()
  }, [])

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

  const handleSubmit = async (updatedData) => {
    try {
      const totalCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
      const estimatedCost =
        getEstimatedCost("blog.single", modelData.aiModel) +
        (modelData.isUnsplashActive ? 0 : getEstimatedCost("aiImages"))
      handlePopup({
        title: "Confirm Blog Creation",
        description: (
          <>
            <span>
              Single Blog generation cost: <b>{estimatedCost} credits.</b>
            </span>
            <br />
            <span>Do you want to continue?</span>
          </>
        ),
        onConfirm: () => {
          if (estimatedCost > totalCredits) {
            message.error("You do not have enough credits to generate this blog.")
            handlePopup(false)
            return
          } else {
            dispatch(createNewBlog({ blogData: updatedData, navigate }))
            setIsModalVisible(false)
            setCurrentStep(0)
          }
        },
      })
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setCurrentStep(0)
    setModelData({})
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
        <PerformanceMonitoringModal closeFnc={() => setPerformanceModal(false)} visible={() => setPerformanceModal(true)} />
      )}
      {keywordResearchModal && (
        <KeywordResearchModel
          closeFnc={() => {
            setKeywordResearchModal(false)
            dispatch(clearKeywordAnalysis())
          }}
          openSecondStepModal={openSecondStepModal}
          openJobModal={openSecondStepJobModal} // Pass the job modal opener
        />
      )}
      {seoAnalysisModal && <SeoAnalysisModal closeFnc={() => setSeoAnalysisModal(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="space-y-8">
          <div className="gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Let's Begin
                <span className="ml-2 text-2xl text-yellow-400">✨</span>
              </motion.h1>
              <p className="text-gray-600 text-lg mt-2">
                Welcome back <b>{user?.name}</b>! Ready to create something amazing today?
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
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

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Tools</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols- lg:grid-cols-3">
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
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-10">
              <div className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
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
                    className="px-6 py-3 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => navigate("/blogs")}
                  >
                    View All Projects
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Dashboard
