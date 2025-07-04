import React, { useState, useEffect } from "react"
import MultiDatePicker from "react-multi-date-picker"
import { motion, AnimatePresence } from "framer-motion"
import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@constants/templates"
import { FiPlus, FiSettings, FiCalendar, FiFileText, FiEdit } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { message, Pagination, Popconfirm, Tooltip } from "antd"
import { Gem, Info, Upload, X } from "lucide-react"
import { Helmet } from "react-helmet"
import {
  closeJobModal,
  createJobThunk,
  deleteJobThunk,
  fetchJobs,
  openJobModal,
  toggleJobStatusThunk,
  updateJobThunk,
} from "@store/slices/jobSlice"
import SkeletonLoader from "@components/Projects/SkeletonLoader"
import { selectUser } from "@store/slices/authSlice"

const initialJob = {
  name: "",
  schedule: { type: "daily", customDates: [], days: [] },
  blogs: {
    numberOfBlogs: 1,
    topics: [],
    keywords: [],
    focusKeywords: [],
    templates: [],
    tone: "Professional",
    userDefinedLength: 1000,
    imageSource: "stock images",
    aiModel: "gemini",
  },
  options: {
    wordpressPosting: false,
    includeFaqs: false,
    useBrandVoice: false,
    includeCompetitorResearch: false,
    includeInterlinks: false,
    performKeywordResearch: false,
    includeTableOfContents: false,
  },
  status: "active",
}

const PAGE_SIZE = 15

const Jobs = () => {
  const tones = ["Professional", "Casual", "Friendly", "Formal", "Technical"]
  const wordLengths = [500, 1000, 1500, 2000, 3000]
  const [currentStep, setCurrentStep] = useState(1)
  const [newJob, setNewJob] = useState(initialJob)
  const [topicInput, setTopicInput] = useState("")
  const { handlePopup } = useConfirmPopup()
  const [errors, setErrors] = useState({})
  const user = useSelector(selectUser)
  // Fallback to "free" if user plan is undefined
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const navigate = useNavigate()
  const [recentlyUploadedCount, setRecentlyUploadedCount] = useState(null)
  const dispatch = useDispatch()
  const { jobs, loading: isLoading, showJobModal } = useSelector((state) => state.jobs)
  const [currentPage, setCurrentPage] = useState(1)
  const { selectedKeywords } = useSelector((state) => state.analysis)
  const totalPages = jobs.length
  const [formData, setFormData] = useState({
    focusKeywords: [],
    focusKeywordInput: "",
    keywords: [],
    keywordInput: "",
    performKeywordResearch: false,
  })
  // Add loading state for user data
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  // Calculate paginated jobs
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedJobs = jobs.slice(startIndex, startIndex + PAGE_SIZE)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  useEffect(() => {
    dispatch(fetchJobs())
  }, [dispatch])

  // Check if user is loaded
  useEffect(() => {
    if (user?.name || user?.credits) {
      setIsUserLoaded(true)
    } else {
      setIsUserLoaded(false)
    }
  }, [user])

  // Sync formData with selectedKeywords when it changes
  useEffect(() => {
    if (selectedKeywords && selectedKeywords.length > 0) {
      const uniqueKeywords = [...new Set(selectedKeywords)]
      setFormData((prev) => ({
        ...prev,
        keywords: uniqueKeywords,
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          keywords: uniqueKeywords,
        },
      }))
    }
  }, [selectedKeywords])

  const handleCreateJob = () => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.")
      return
    }
    if (["free", "basic"].includes(userPlan)) {
      handlePopup({
        title: "Upgrade Required",
        description: "Job creation is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/upgrade"),
      })
      return
    }

    const jobPayload = {
      ...newJob,
      blogs: {
        ...newJob.blogs,
        focusKeywords: formData.focusKeywords,
        keywords: formData.keywords,
      },
      options: {
        ...newJob.options,
        includeFaqs: newJob.options.includeFaqs || false,
        useBrandVoice: newJob.options.useBrandVoice || false,
        includeCompetitorResearch: newJob.options.includeCompetitorResearch || false,
        includeInterlinks: newJob.options.includeInterlinks || false,
        performKeywordResearch: formData.performKeywordResearch || false,
        includeTableOfContents: newJob.options.includeTableOfContents || false,
      },
    }

    dispatch(
      createJobThunk({
        jobPayload,
        onSuccess: () => {
          dispatch(closeJobModal())
          dispatch(fetchJobs())
          setCurrentPage(1)
        },
      })
    )
  }

  const handleUpdateJob = async (jobId) => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.")
      return
    }
    if (["free", "basic"].includes(userPlan)) {
      handlePopup({
        title: "Upgrade Required",
        description: "Job editing is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/upgrade"),
      })
      return
    }

    const jobPayload = {
      ...newJob,
      blogs: {
        ...newJob.blogs,
        focusKeywords: formData.focusKeywords,
        keywords: formData.keywords,
      },
      options: {
        ...newJob.options,
        includeFaqs: newJob.options.includeFaqs || false,
        useBrandVoice: newJob.options.useBrandVoice || false,
        includeCompetitorResearch: newJob.options.includeCompetitorResearch || false,
        includeInterlinks: newJob.options.includeInterlinks || false,
        performKeywordResearch: formData.performKeywordResearch || false,
        includeTableOfContents: newJob.options.includeTableOfContents || false,
      },
    }

    dispatch(
      updateJobThunk({
        jobId,
        jobPayload,
        onSuccess: () => {
          dispatch(closeJobModal())
          dispatch(fetchJobs())
          setCurrentPage(1)
        },
      })
    )
  }

  const handlenumberOfBlogsChange = (e) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      setNewJob({
        ...newJob,
        blogs: { ...newJob.blogs, numberOfBlogs: value },
      })
    }
  }

  const handleStartJob = (jobId) => {
    const job = jobs.find((job) => job._id === jobId)
    dispatch(toggleJobStatusThunk({ jobId, currentStatus: job.status }))
  }

  const handleDeleteJob = (jobId) => {
    dispatch(deleteJobThunk(jobId))
    if (paginatedJobs.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const validateSteps = (step) => {
    const errors = {}

    if (step === 1) {
      if (newJob.blogs.templates.length === 0) {
        errors.template = true
        message.error("Please select at least one template before proceeding.")
      }
    }

    if (step === 2) {
      if (!newJob.name) {
        errors.name = true
        message.error("Please fill all the required fields.")
      }
    }

    setErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddKeyword = (type) => {
    if (topicInput.trim() !== "") {
      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          topics: [...prev.blogs.topics, topicInput.trim()],
        },
      }))
      setTopicInput("")
    }
  }

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  const handleEditJob = (job) => {
    if (job.status === "active") {
      message.error("Stop the job before editing")
      return
    }
    setNewJob({
      ...job,
      blogs: {
        ...job.blogs,
        focusKeywords: job.blogs.focusKeywords || [],
        keywords: job.blogs.keywords || [],
      },
    })
    setFormData({
      focusKeywords: job.blogs.focusKeywords || [],
      focusKeywordInput: "",
      keywords: job.blogs.keywords || [],
      keywordInput: "",
      performKeywordResearch: job.options.performKeywordResearch || false,
    })
    dispatch(openJobModal())
    setCurrentStep(1)
  }

  const handleKeywordInputChange = (e, type) => {
    setFormData((prevState) => ({
      ...prevState,
      [`${type}Input`]: e.target.value,
    }))
  }

  const handleAddFocusKeyword = (type) => {
    const inputValue = formData[`${type}Input`]
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "")
      if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
        message.error("You can only add up to 3 focus keywords.")
        return
      }
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], ...newKeywords],
        [`${type}Input`]: "",
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          [type]: [...prev.blogs[type], ...newKeywords],
        },
      }))
    }
  }

  const handleKeyFocusPress = (e, type) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddFocusKeyword(type)
    }
  }

  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
    setNewJob((prev) => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        [type]: updatedKeywords,
      },
    }))
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      message.error("Invalid file type. Please upload a .csv file.")
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      message.error("File size exceeds 20KB limit. Please upload a smaller file.")
      e.target.value = null
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      const text = event.target?.result
      if (!text) return

      const lines = text.trim().split(/\r?\n/).slice(1)
      const keywords = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.length >= 2 ? parts[1].trim() : null
        })
        .filter(Boolean)

      const existingTopics = newJob.blogs.topics.map((t) => t.toLowerCase().trim())
      const uniqueNewTopics = keywords.filter(
        (kw) => !existingTopics.includes(kw.toLowerCase().trim())
      )

      if (uniqueNewTopics.length === 0) {
        message.warning("No new topics found in the CSV.")
        return
      }

      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          topics: [...prev.blogs.topics, ...uniqueNewTopics],
        },
      }))

      if (uniqueNewTopics.length > 8) {
        setRecentlyUploadedCount(uniqueNewTopics.length)
        setTimeout(() => setRecentlyUploadedCount(null), 5000)
      }
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const handleKeywordToggleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, keywordInput: e.target.value }))
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    if (name === "wordpressPosting" && checked) {
      if (!user?.wordpressLink) {
        message.error(
          "Please connect your WordPress account in your profile before enabling automatic posting."
        )
        navigate("/profile")
        return
      }
    }
    setFormData({
      ...formData,
      [name]: checked,
    })
    setNewJob((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [name]: checked,
      },
    }))
  }

  const handleTopicKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddKeyword()
      handleAddToggleKeyword()
    }
  }

  const handleAddToggleKeyword = () => {
    const inputValue = formData.keywordInput
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "" && !formData.keywords.includes(keyword))

      if (newKeywords.length > 0) {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...newKeywords],
          keywordInput: "",
        }))
        setNewJob((prev) => ({
          ...prev,
          blogs: {
            ...prev.blogs,
            keywords: [...prev.blogs.keywords, ...newKeywords],
          },
        }))
        return true
      } else {
        setFormData((prev) => ({ ...prev, keywordInput: "" }))
        return false
      }
    }
    return false
  }

  const handleRemoveToggleKeyword = (index) => {
    setFormData((prev) => {
      const updatedKeywords = prev.keywords.filter((_, i) => i !== index)
      setNewJob((prevJob) => ({
        ...prevJob,
        blogs: {
          ...prevJob.blogs,
          keywords: updatedKeywords,
        },
      }))
      return {
        ...prev,
        keywords: updatedKeywords,
      }
    })
  }

  const handleCSVKeywordUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      message.error("Invalid file type. Please upload a .csv file.")
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      message.error("File size exceeds 20KB limit. Please upload a smaller file.")
      e.target.value = null
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      const text = event.target?.result
      if (!text) return

      const lines = text.trim().split(/\r?\n/).slice(1)
      const keywords = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.length >= 2 ? parts[1].trim() : null
        })
        .filter(Boolean)

      const existingKeywords = formData.keywords.map((t) => t.toLowerCase().trim())
      const existingFocusKeywords = formData.focusKeywords.map((t) => t.toLowerCase().trim())
      const uniqueNewKeywords = keywords.filter(
        (kw) =>
          !existingKeywords.includes(kw.toLowerCase().trim()) &&
          !existingFocusKeywords.includes(kw.toLowerCase().trim())
      )

      if (uniqueNewKeywords.length === 0) {
        message.warning("No new keywords found in the CSV.")
        return
      }

      const newFocusKeywords = uniqueNewKeywords.slice(0, 3 - formData.focusKeywords.length)
      const newRegularKeywords = uniqueNewKeywords.slice(3 - formData.focusKeywords.length)

      setFormData((prev) => ({
        ...prev,
        focusKeywords: [...prev.focusKeywords, ...newFocusKeywords].slice(0, 3),
        keywords: [...prev.keywords, ...newRegularKeywords],
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          focusKeywords: [...prev.blogs.focusKeywords, ...newFocusKeywords].slice(0, 3),
          keywords: [...prev.blogs.keywords, ...newRegularKeywords],
        },
      }))

      if (uniqueNewKeywords.length > 8) {
        setRecentlyUploadedCount(uniqueNewKeywords.length)
        setTimeout(() => setRecentlyUploadedCount(null), 5000)
      }
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Select Templates</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select up to 3 templates for the types of blogs you want to generate.
            </p>
            <Carousel>
              {packages.map((pkg, index) => (
                <div
                  key={pkg.name}
                  className={`cursor-pointer transition-all duration-200 ${
                    newJob.blogs.templates.includes(pkg.name)
                      ? "border-gray-300 border-2 rounded-lg"
                      : errors.templates
                      ? "border-red-500 border-2"
                      : ""
                  }`}
                  onClick={() => {
                    if (newJob.blogs.templates.includes(pkg.name)) {
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          templates: prev.blogs.templates.filter(
                            (template) => template !== pkg.name
                          ),
                        },
                      }))
                    } else if (newJob.blogs.templates.length < 3) {
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          templates: [...prev.blogs.templates, pkg.name],
                        },
                      }))
                    } else {
                      message.error("You can only select up to 3 templates.")
                    }
                  }}
                >
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="relative">
                      <img
                        src={pkg.imgSrc || "/placeholder.svg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  if (validateSteps(1)) setCurrentStep(2)
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Job Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Name</label>
                <input
                  type="text"
                  value={newJob.name}
                  placeholder="Enter job name"
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex gap-2 items-center">
                  Topics
                  <Tooltip title="Upload a .csv file in the format: `S.No., Keyword`">
                    <div className="cursor-pointer">
                      <Info size={16} className="text-blue-500" />
                    </div>
                  </Tooltip>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={topicInput}
                    onKeyDown={(e) => handleKeyPress(e, "topics")}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.topic ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Add a topic..."
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddKeyword("topics")}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg"
                  >
                    Add
                  </motion.button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newJob.blogs.topics
                    .slice()
                    .reverse()
                    .slice(0, 18)
                    .map((topic, reversedIndex) => {
                      const actualIndex = newJob.blogs.topics.length - 1 - reversedIndex
                      return (
                        <span
                          key={`${topic}-${actualIndex}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() =>
                              setNewJob((prev) => ({
                                ...prev,
                                blogs: {
                                  ...prev.blogs,
                                  topics: prev.blogs.topics.filter((_, i) => i !== actualIndex),
                                },
                              }))
                            }
                            className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )
                    })}
                  {(newJob.blogs.topics.length > 18 || recentlyUploadedCount) && (
                    <span className="text-xs font-medium text-blue-600 self-center">
                      {newJob.blogs.topics.length > 18 &&
                        `+${newJob.blogs.topics.length - 18} more `}
                      {recentlyUploadedCount && `(+${recentlyUploadedCount} uploaded)`}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone of Voice
                </label>
                <select
                  value={newJob.blogs.tone}
                  onChange={(e) =>
                    setNewJob({ ...newJob, blogs: { ...newJob.blogs, tone: e.target.value } })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.tone ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <select
                  value={newJob.blogs.userDefinedLength}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      blogs: { ...newJob.blogs, userDefinedLength: parseInt(e.target.value) },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {wordLengths.map((length) => (
                    <option key={length} value={length}>
                      {length} words
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Source</label>
                <select
                  value={newJob.blogs.imageSource}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      blogs: { ...newJob.blogs, imageSource: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ai-generated">AI-Generated Images</option>
                  <option value="unsplash">Stock Images</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                <select
                  value={newJob.blogs.aiModel}
                  onChange={(e) =>
                    setNewJob({ ...newJob, blogs: { ...newJob.blogs, aiModel: e.target.value } })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">Open AI</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Perform Keyword Research?
                  <p className="text-xs text-gray-500">
                    Allow AI to find relevant keywords for the topics.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="performKeywordResearch"
                    checked={formData.performKeywordResearch}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {!formData.performKeywordResearch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.keywordInput}
                    onChange={handleKeywordToggleInputChange}
                    onKeyDown={handleTopicKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., digital marketing trends, AI in business"
                  />
                  <button
                    onClick={handleAddToggleKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVKeywordUpload} hidden />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {formData.keywords
                    .slice()
                    .reverse()
                    .slice(0, 18)
                    .map((keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveToggleKeyword(formData.keywords.length - 1 - index)
                          }
                          className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  {(formData.keywords.length > 18 || recentlyUploadedCount) && (
                    <span className="text-xs font-medium text-blue-600 self-center">
                      {formData.keywords.length > 18 && `+${formData.keywords.length - 18} more `}
                      {recentlyUploadedCount && `(+${recentlyUploadedCount} uploaded)`}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (validateSteps(2)) setCurrentStep(3)
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 3: Blog Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Add FAQ</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newJob.options.includeFaqs}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        options: { ...newJob.options, includeFaqs: e.target.checked },
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Add Competitive Research</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newJob.options.includeCompetitorResearch}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        options: { ...newJob.options, includeCompetitorResearch: e.target.checked },
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Add InterLinks</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newJob.options.includeInterlinks}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        options: { ...newJob.options, includeInterlinks: e.target.checked },
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-gray-700">
                  WordPress Automatic Posting
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newJob.options.wordpressPosting}
                    onChange={handleCheckboxChange}
                    name="wordpressPosting"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {newJob.options.wordpressPosting && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-gray-700">Table of Content</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newJob.options.includeTableOfContents}
                      onChange={(e) =>
                        setNewJob({
                          ...newJob,
                          options: { ...newJob.options, includeTableOfContents: e.target.checked },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          </motion.div>
        )
      case 4:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 4: Schedule Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <select
                  value={newJob.schedule.type}
                  onChange={(e) => {
                    const type = e.target.value
                    let daysOfWeek = []
                    let daysOfMonth = []
                    if (type === "weekly") daysOfWeek = []
                    if (type === "monthly") daysOfMonth = []
                    setNewJob({
                      ...newJob,
                      schedule: {
                        ...newJob.schedule,
                        type,
                        daysOfWeek,
                        daysOfMonth,
                        customDates: [],
                      },
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {newJob.schedule.type === "weekly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days of Week
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`px-2 py-1 rounded ${
                          newJob.schedule.daysOfWeek?.includes(i)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => {
                          setNewJob((prev) => {
                            const daysOfWeek = prev.schedule.daysOfWeek?.includes(i)
                              ? prev.schedule.daysOfWeek.filter((day) => day !== i)
                              : [...(prev.schedule.daysOfWeek || []), i]
                            return { ...prev, schedule: { ...prev.schedule, daysOfWeek } }
                          })
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {newJob.schedule.type === "monthly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Dates of Month
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                      <button
                        key={date}
                        type="button"
                        className={`px-2 py-1 rounded ${
                          newJob.schedule.daysOfMonth?.includes(date)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => {
                          setNewJob((prev) => {
                            const daysOfMonth = prev.schedule.daysOfMonth?.includes(date)
                              ? prev.schedule.daysOfMonth.filter((d) => d !== date)
                              : [...(prev.schedule.daysOfMonth || []), date]
                            return { ...prev, schedule: { ...prev.schedule, daysOfMonth } }
                          })
                        }}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {newJob.schedule.type === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Dates
                  </label>
                  <MultiDatePicker
                    value={newJob.schedule.customDates}
                    onChange={(dates) =>
                      setNewJob({
                        ...newJob,
                        schedule: {
                          ...newJob.schedule,
                          customDates: dates,
                          days: [],
                          daysOfMonth: [],
                        },
                      })
                    }
                    multiple
                    format="YYYY-MM-DD"
                    className="w-full"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Blogs
                </label>
                <input
                  type="number"
                  value={newJob.blogs.numberOfBlogs}
                  onChange={handlenumberOfBlogsChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the number of blogs"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={newJob?._id ? () => handleUpdateJob(newJob._id) : handleCreateJob}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {newJob?._id ? "Update" : "Create"} Job
              </button>
            </div>
          </motion.div>
        )
      default:
        return null
    }
  }

  const handleOpenJobModal = () => {
    if (!isUserLoaded) {
      message.error("User data is still loading. Please try again.")
      return
    }
    if (["free", "basic"].includes(userPlan)) {
      handlePopup({
        title: "Upgrade Required",
        description: "Job creation is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        icon: <Gem style={{ fontSize: 50, color: "#a47dab" }} />,
        onConfirm: () => navigate("/upgrade"),
      })
      return
    }
    setNewJob(initialJob)
    setFormData({
      focusKeywords: selectedKeywords ? selectedKeywords.slice(0, 3) : [],
      focusKeywordInput: "",
      keywords: selectedKeywords ? selectedKeywords.slice(3) : [],
      keywordInput: "",
      performKeywordResearch: true,
    })
    dispatch(openJobModal())
    setCurrentStep(1)
  }

  return (
    <>
      <Helmet>
        <title>Content Agent | GenWrite</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-8">
        <div>
          <div className="mb-8">
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Jobs Automation
            </motion.h1>
            <p className="text-gray-600 mt-2">Manage your automated content generation jobs</p>
          </div>

          <motion.div
            whileHover={{ y: -2 }}
            className="w-full md:w-1/2 lg:w-1/3 h-48 p-6 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer mb-8"
            onClick={handleOpenJobModal}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="bg-blue-100 rounded-lg p-3">
                <FiPlus className="w-6 h-6 text-blue-600" />
              </span>
              {["free", "basic"].includes(userPlan) && (
                <span className="flex items-center gap-2 rounded-md text-white font-semibold border p-1 px-2 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out animate-pulse backdrop-blur-sm text-lg">
                  <Gem className="w-4 h-4 animate-bounce" />
                  Pro
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-gray-800">Create New Job</h3>
              <p className="text-gray-500 mt-2 text-sm">
                Set up automated content generation with custom templates and scheduling
              </p>
            </div>
          </motion.div>
          {totalPages > 0 && (
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Active Jobs</h2>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(PAGE_SIZE)].map((_, index) => (
                <SkeletonLoader key={index} />
              ))}
            </div>
          ) : totalPages === 0 ? (
            <div
              className="flex flex-col justify-center items-center"
              style={{ minHeight: "calc(100vh - 250px)" }}
            >
              <p className="text-xl text-gray-600">No jobs available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedJobs.map((job) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">{job.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {job._id.toString().slice(-6)}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartJob(job._id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.status === "active"
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-green-100 text-green-600 hover:bg-green-200"
                      }`}
                    >
                      {job.status === "active" ? "Stop" : "Start"}
                    </motion.button>
                  </div>

                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2 capitalize">
                      <FiCalendar className="w-4 h-4 text-blue-500" />
                      <span>Scheduling: {job.schedule.type}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span>Daily Blogs: {job.blogs.numberOfBlogs}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <FiSettings className="w-4 h-4 text-green-500" />
                      <span>Model: {job.blogs.aiModel}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <FiCalendar className="w-4 h-4 text-red-500" />
                      <span>Status: {job.status}</span>
                    </div>
                    {job.blogs.topics.length > 0 && (
                      <div className="flex items-start gap-2 capitalize">
                        <FiFileText className="w-4 h-4 text-purple-500 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          Topics:
                          {job.blogs.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.blogs.focusKeywords?.length > 0 && (
                      <div className="flex items-start gap-2 capitalize">
                        <FiFileText className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          Focus Keywords:
                          {job.blogs.focusKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.blogs.keywords?.length > 0 && (
                      <div className="flex items-start gap-2 capitalize">
                        <FiFileText className="w-4 h-4 text-indigo-500 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          Keywords:
                          {job.blogs.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-md text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-yellow-500" />
                      <span>
                        Created:{" "}
                        {new Date(job.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }) || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span>Generated Blogs: {job?.createdBlogs?.length}</span>
                    </div>
                    {job?.lastRun && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-yellow-500" />
                        <span>
                          Last Run:{" "}
                          {new Date(job.lastRun).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditJob(job)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                    >
                      <FiEdit />
                      Edit
                    </motion.button>
                    <Popconfirm
                      title="Job Deletion"
                      description="Are you sure to delete the job?"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => handleDeleteJob(job._id)}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        Delete
                      </motion.button>
                    </Popconfirm>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {totalPages > PAGE_SIZE && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={totalPages}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                responsive={true}
              />
            </div>
          )}
        </div>
      </div>
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 max-w-3xl p-6 relative max-h-[98vh] overflow-y-auto">
            <button
              onClick={() => dispatch(closeJobModal())}
              className="absolute top-2 p-4 right-2 text-xl font-bold text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            {renderStep()}
          </div>
        </div>
      )}
    </>
  )
}

export default Jobs
