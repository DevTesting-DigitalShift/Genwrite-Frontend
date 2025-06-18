import { useState, useEffect } from "react"
import Modal from "../utils/Modal"
import SelectTemplateModal from "./mutipstepmodal/SelectTemplateModal"
import FirstStepModal from "./mutipstepmodal/FirstStepModal"
import SecondStepModal from "./mutipstepmodal/SecondStepModal"
import ThirdStepModal from "./mutipstepmodal/ThirdStepModal"
import { letsBegin, quickTools } from "./dashdata/dash"
import { DashboardBox, QuickBox, RecentProjects } from "../utils/DashboardBox"
import QuestionButton from "../utils/QuestionButton"
import { useDispatch, useSelector } from "react-redux"
import { createNewBlog } from "@store/slices/blogSlice"
import { useNavigate } from "react-router-dom"
import MultiStepModal from "./mutipstepmodal/DaisyUi"
import DaisyUIModal from "./DaisyUIModal"
import QuickBlogModal from "./mutipstepmodal/QuickBlogModal"
import CompetitiveAnalysisModal from "./mutipstepmodal/CompetitiveAnalysisModal"
import PerformanceMonitoringModal from "./mutipstepmodal/PerformanceMonitoringModal"
import axiosInstance from "@api/index"
import { load } from "@store/slices/authSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { toast, ToastContainer } from "react-toastify"
import { loadUser } from "@api/authApi"
import { SkeletonDashboardCard, SkeletonGridCard } from "./Projects/SkeletonLoader"
import { AnimatePresence } from "framer-motion"

/*
 [s ] instead of asking for upgrade, show animation of crown with toast & disable features on plan based like free & basic can't open bulk blogs & other features
  check the ui first for free version & then change it in a more good way
 */

// [ ] remove search
// [ ] skeleton loading
const Dashboard = () => {
  // State declarations
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [daisyUIModal, setDaisyUIModal] = useState(false)
  const [multiStepModal, setMultiStepModal] = useState(false)
  const [quickBlogModal, setQuickBlogModal] = useState(false)
  const [competitiveAnalysisModal, setCompetitiveAnalysisModal] = useState(false)
  const [performanceModal, setPerformanceModal] = useState(false)
  const [modelData, setModelData] = useState({})
  const [recentBlogData, setRecentBlogData] = useState([])
  const [allBlogs, setAllBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Hooks
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
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
        // Avoid duplicate call by combining
        const userRes = await loadUser(navigate)

        if (!userRes?._id || !userRes?.name) {
          await load()(dispatch)
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

      {daisyUIModal && <DaisyUIModal closefnc={hideDaisy} />}

      {multiStepModal && <MultiStepModal closefnc={hideMultiStepModal} />}

      {quickBlogModal && <QuickBlogModal closefnc={hideQuickBlogModal} />}

      {competitiveAnalysisModal && <CompetitiveAnalysisModal closefnc={hideCompetitiveAnalysis} />}

      {performanceModal && (
        <PerformanceMonitoringModal closefnc={() => setPerformanceModal(false)} />
      )}

      <div className="p-10">
        <h3 className="text-[24px] font-[600] mb-8 font-montserrat">Let's Begin </h3>

        <div className="flex justify-between items-center gap-8 p-4 sm:flex-wrap md:flex-nowrap">
          <AnimatePresence mode="wait">
            {loading
              ? Array.from({ length: 4 }).map((_, idx) => <SkeletonDashboardCard key={idx} />)
              : letsBegin.map((item, index) => (
                  <DashboardBox
                    key={index}
                    imageUrl={item.imageUrl}
                    title={item.title}
                    content={item.content}
                    id={item.id}
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

        <div className="mt-5 ">
          <h3 className="text-[24px] font-[600] mb-8 font-montserrat">Quick Tools</h3>
          <div className="grid m-2 gap-8 sm:grid-cols-4 p-4">
            <AnimatePresence mode="wait">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                : quickTools.map((item, index) => (
                    <QuickBox
                      key={index}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      content={item.content}
                      id={item.id}
                      functions={{
                        ...(item.id === 3
                          ? { showPerformanceMonitoring: () => setPerformanceModal(true) }
                          : {}),
                        ...(item.id === 4 ? { showCompetitiveAnalysis } : {}),
                      }}
                    />
                  ))}
            </AnimatePresence>
          </div>
        </div>

        {recentBlogData.length > 0 && (
          <div className="mt-5 ">
            <div className="mt-8 mb-8 flex justify-between items-center">
              <h3 className="text-[24px] font-[600] font-montserrat">Recent Projects</h3>
              <span className="mr-5">
                <select
                  name=""
                  id=""
                  className="font-hind text-md p-1 border-1 border-black bg-blue-50 rounded-xl"
                >
                  <option className="font-hind" value="">
                    Top Performing
                  </option>
                </select>
              </span>
            </div>
            <div className="grid m-4 gap-10 sm:grid-cols-3">
              <AnimatePresence mode="wait">
                {loading
                  ? Array.from({ length: 4 }).map((_, idx) => <SkeletonGridCard key={idx} />)
                  : recentBlogData.map((item, index) => {
                      return (
                        <RecentProjects
                          key={index}
                          title={item.title}
                          content={item.content}
                          tags={item.focusKeywords}
                          item={item}
                        />
                      )
                    })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard
