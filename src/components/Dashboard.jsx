import { useState, useEffect } from "react"
import Modal from "../utils/Modal"
import SelectTemplateModal from "./multipleStepModal/SelectTemplateModal"
import FirstStepModal from "./multipleStepModal/FirstStepModal"
import SecondStepModal from "./multipleStepModal/SecondStepModal"
import ThirdStepModal from "./multipleStepModal/ThirdStepModal"
import { letsBegin, quickTools, stats } from "./dashData/dash"
import { DashboardBox, QuickBox, RecentProjects } from "../utils/DashboardBox"
import { useDispatch, useSelector } from "react-redux"
import { createNewBlog } from "@store/slices/blogSlice"
import { useNavigate } from "react-router-dom"
import MultiStepModal from "./multipleStepModal/DaisyUi"
import DaisyUIModal from "./DaisyUIModal"
import QuickBlogModal from "./multipleStepModal/QuickBlogModal"
import CompetitiveAnalysisModal from "./multipleStepModal/CompetitiveAnalysisModal"
import PerformanceMonitoringModal from "./multipleStepModal/PerformanceMonitoringModal"
import axiosInstance from "@api/index"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { toast, ToastContainer } from "react-toastify"
import { SkeletonDashboardCard, SkeletonGridCard } from "./Projects/SkeletonLoader"
import { AnimatePresence } from "framer-motion"
import { loadAuthenticatedUser, selectUser } from "@store/slices/authSlice"
import { Clock, Sparkles } from "lucide-react"
import { Helmet } from "react-helmet"
import SeoAnalysisModal from "./multipleStepModal/SeoAnalysisModal"

const Dashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [daisyUIModal, setDaisyUIModal] = useState(false)
  const [multiStepModal, setMultiStepModal] = useState(false)
  const [quickBlogModal, setQuickBlogModal] = useState(false)
  const [competitiveAnalysisModal, setCompetitiveAnalysisModal] = useState(false)
  const [performanceModal, setPerformanceModal] = useState(false)
  const [seoAnalysisModal, setSeoAnalysisModal] = useState(false)
  const [modelData, setModelData] = useState({})
  const [recentBlogData, setRecentBlogData] = useState([])
  const [allBlogs, setAllBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const { handlePopup } = useConfirmPopup()

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200) // 1.2s delay for animation simulation

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
          // Handle failed case
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
        const response = await axiosInstance.get("/blogs/")
        const blogs = response.data

        // For recent complete blogs
        const recent = blogs.filter((b) => b.status === "complete").slice(-3)
        setRecentBlogData(recent)

        // Set all blogs for dropdown
        setAllBlogs(blogs)
      } catch (error) {
        console.error("Error fetching blogs:", error.response?.data?.message || error.message)
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

  const handleSubmit = async (updatedData) => {
    try {
      const totalCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
      console.log("totalCredits", totalCredits)
      const estimatedCost =
        getEstimatedCost("blog.single", modelData.aiModel) +
        (modelData.isUnsplashActive ? 0 : getEstimatedCost("aiImages"))
      handlePopup({
        title: "  ",
        description: (
          <>
            <span>
              Single Blog generation cost: <b>{estimatedCost} credits.</b>
            </span>
            <br />
            <span>Do you want to continue ?</span>
          </>
        ),
        onConfirm: () => {
          if (estimatedCost > totalCredits) {
            toast.error("You do not have enough credits to generate this blog.")
            handlePopup(false) // Close the modal
            return
          } else {
            dispatch(createNewBlog(updatedData, navigate))
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
      <ToastContainer />
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
          />
        )}
        {currentStep === 3 && (
          <ThirdStepModal
            handlePrevious={handlePrev}
            handleSubmit={handleSubmit}
            handleClose={handleCancel}
            data={modelData}
            setData={setModelData}
          />
        )}
        <div className="flex items-center justify-center mt-4">
          <progress className="w-full max-w-md" max="3" value={currentStep}></progress>
        </div>
      </Modal>

      {daisyUIModal && <DaisyUIModal closeFnc={hideDaisy} />}

      {multiStepModal && <MultiStepModal closeFnc={hideMultiStepModal} />}

      {quickBlogModal && <QuickBlogModal closeFnc={hideQuickBlogModal} />}

      {competitiveAnalysisModal && <CompetitiveAnalysisModal closeFnc={hideCompetitiveAnalysis} />}

      {performanceModal && (
        <PerformanceMonitoringModal closeFnc={() => setPerformanceModal(false)} />
      )}

       {seoAnalysisModal && (
        <SeoAnalysisModal closeFnc={() => setSeoAnalysisModal(false)} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Let's Begin
                <span className="ml-2 text-2xl">✨</span>
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back <b>{user?.name}</b>! Ready to create something amazing today?
              </p>
            </div>

            {/* Quick Stats */}
            {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-blue-600">{stat.icon}</div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div> */}
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
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence>
                {loading
                  ? Array.from({ length: 4 }).map((_, idx) => <SkeletonGridCard key={idx} />)
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
                            ? { showPerformanceMonitoring: () => setSeoAnalysisModal(true) }
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
                    : recentBlogData.map((item, index) => {
                        return (
                          <RecentProjects
                            key={index}
                            title={item.title}
                            content={item.content}
                            tags={item.focusKeywords}
                            item={item}
                            time={item.updatedAt}
                          />
                        )
                      })}
                </AnimatePresence>
                <div className="mt-6 text-center">
                  <button
                    className="px-6 py-3 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => navigate("/project")}
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
