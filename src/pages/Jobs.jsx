import React, { useState, useEffect } from "react"
import MultiDatePicker from "react-multi-date-picker"
import { motion, AnimatePresence } from "framer-motion"
import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@constants/templates"
import { FiPlus, FiSettings, FiCalendar, FiFileText, FiEdit } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLocation, useNavigate } from "react-router-dom"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { message, Pagination, Popconfirm, Tooltip } from "antd"
import { Crown, Gem, Info, Upload, X } from "lucide-react"
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
import { openUpgradePopup } from "@utils/UpgardePopUp"

const initialJob = {
  name: "",
  schedule: { type: "daily", customDates: [], days: [] },
  blogs: {
    numberOfBlogs: 1,
    topics: [],
    keywords: [],
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
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const navigate = useNavigate()
  const [recentlyUploadedCount, setRecentlyUploadedCount] = useState(null)
  const dispatch = useDispatch()
  const { jobs, loading: isLoading, showJobModal } = useSelector((state) => state.jobs)
  const [currentPage, setCurrentPage] = useState(1)
  const { selectedKeywords } = useSelector((state) => state.analysis)
  const [isUserLoaded, setIsUserLoaded] = useState(false)
  const totalPages = jobs.length

  // Initialize formData with keywords from selectedKeywords
  const [formData, setFormData] = useState({
    keywords: [
      ...new Set([
        ...(selectedKeywords?.focusKeywords || []),
        ...(selectedKeywords?.allKeywords || []),
      ]),
    ],
    keywordInput: "",
    performKeywordResearch: false,
  })

  // Debug: Log selectedKeywords and formData.keywords
  useEffect(() => {
    console.log("Jobs: Current selectedKeywords in Redux:", selectedKeywords)
    console.log("Jobs: Current formData.keywords:", formData.keywords)
  }, [selectedKeywords, formData.keywords])

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

  // Sync formData and newJob with selectedKeywords
  useEffect(() => {
    if (selectedKeywords?.focusKeywords?.length > 0 || selectedKeywords?.allKeywords?.length > 0) {
      const uniqueKeywords = [
        ...new Set([
          ...(selectedKeywords.focusKeywords || []),
          ...(selectedKeywords.allKeywords || []),
        ]),
      ]
      console.log("Jobs: Updating formData and newJob with uniqueKeywords:", uniqueKeywords)
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
    const jobPayload = {
      ...newJob,
      blogs: {
        ...newJob.blogs,
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

    console.log("Jobs: Creating job with payload:", jobPayload)
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

    const jobPayload = {
      ...newJob,
      blogs: {
        ...newJob.blogs,
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

    console.log("Jobs: Updating job with payload:", jobPayload)
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

  const handleNumberOfBlogsChange = (e) => {
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
    const input = topicInput.trim()
    if (!input) return

    const existing = newJob.blogs.topics.map((t) => t.toLowerCase().trim())
    const seen = new Set()

    const newTopics = input
      .split(",")
      .map((t) => t.trim())
      .filter((t) => {
        const lower = t.toLowerCase()
        if (!t || existing.includes(lower) || seen.has(lower)) return false
        seen.add(lower)
        return true
      })

    if (newTopics.length === 0) return

    setNewJob((prev) => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        topics: [...prev.blogs.topics, ...newTopics],
      },
    }))

    setTopicInput("")
  }

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  const handleEditJob = (job) => {
    if (job.status === "active") {
      message.error("Stop the job before editing")
      return
    }
    const uniqueKeywords = [
      ...new Set([...(job.blogs.keywords || []), ...(selectedKeywords?.focusKeywords || [])]),
    ]
    setNewJob({
      ...job,
      blogs: {
        ...job.blogs,
        keywords: uniqueKeywords,
      },
    })
    setFormData({
      keywords: uniqueKeywords,
      keywordInput: "",
      performKeywordResearch: job.options.performKeywordResearch || false,
    })
    console.log("Jobs: Editing job with keywords:", uniqueKeywords)
    dispatch(openJobModal())
    setCurrentStep(1)
  }

  const handleKeywordInputChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      keywordInput: e.target.value,
    }))
  }

  const handleAddKeywordManual = () => {
    const inputValue = formData.keywordInput.trim()
    if (inputValue !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "" && !formData.keywords.includes(keyword.toLowerCase()))
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
      console.log("Jobs: Added manual keywords:", newKeywords)
    }
  }

  const handleKeyPressKeyword = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeywordManual()
    }
  }

  const handleRemoveKeyword = (index) => {
    const updatedKeywords = [...formData.keywords]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, keywords: updatedKeywords })
    setNewJob((prev) => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        keywords: updatedKeywords,
      },
    }))
    console.log("Jobs: Removed keyword at index:", index, "New keywords:", updatedKeywords)
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
      const uniqueNewKeywords = keywords.filter(
        (kw) => !existingKeywords.includes(kw.toLowerCase().trim())
      )

      if (uniqueNewKeywords.length === 0) {
        message.warning("No new keywords found in the CSV.")
        return
      }

      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, ...uniqueNewKeywords],
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          keywords: [...prev.blogs.keywords, ...uniqueNewKeywords],
        },
      }))
      console.log("Jobs: Uploaded CSV keywords:", uniqueNewKeywords)

      if (uniqueNewKeywords.length > 8) {
        setRecentlyUploadedCount(uniqueNewKeywords.length)
        setTimeout(() => setRecentlyUploadedCount(null), 5000)
      }
    }

    reader.readAsText(file)
    e.target.value = null
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
        ...newJob.options,
        [name]: checked,
      },
    }))
  }

  const handleTopicKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
      handleAddKeywordManual()
    }
  }

  const handleAddToggleKeyword = () => {
    const inputValue = formData.keywordInput.trim()
    if (!inputValue) return false

    const existingKeywords = formData.keywords.map((k) => k.toLowerCase())
    const jobKeywords = newJob.blogs.keywords.map((k) => k.toLowerCase())

    const seen = new Set()

    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => {
        const lower = k.toLowerCase()
        if (
          !k ||
          seen.has(lower) ||
          existingKeywords.includes(lower) ||
          jobKeywords.includes(lower)
        )
          return false
        seen.add(lower)
        return true
      })

    if (newKeywords.length === 0) {
      setFormData((prev) => ({ ...prev, keywordInput: "" }))
      return false
    }

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
    console.log("Jobs: Added toggle keywords:", newKeywords)
    return true
  }

  const handleRemoveToggleKeyword = (index) => {
    const updatedKeywords = [...formData.keywords]
    updatedKeywords.splice(index, 1)
    setFormData((prev) => ({
      ...prev,
      keywords: updatedKeywords,
    }))
    setNewJob((prev) => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        keywords: updatedKeywords,
      },
    }))
    console.log("Jobs: Removed toggle keyword at index:", index, "New keywords:", updatedKeywords)
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
                  aria-label="Job name"
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
                    aria-label="Add topic"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddKeyword("topics")}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg"
                    aria-label="Add topic"
                  >
                    Add
                  </motion.button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
                    <span className="sr-only">Upload CSV for topics</span>
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
                            aria-label={`Remove topic ${topic}`}
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
                  aria-label="Select tone of voice"
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
                  aria-label="Select blog length"
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
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="unsplash"
                      name="imageSource"
                      value="unsplash"
                      checked={newJob.blogs.imageSource === "unsplash"}
                      onChange={(e) =>
                        setNewJob({
                          ...newJob,
                          blogs: { ...newJob.blogs, imageSource: e.target.value },
                        })
                      }
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label htmlFor="unsplash" className="text-sm text-gray-700 whitespace-nowrap">
                      Stock Images
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="ai-generated"
                      name="imageSource"
                      value="ai-generated"
                      checked={newJob.blogs.imageSource === "ai-generated"}
                      onChange={(e) => {
                        if (userPlan !== "free") {
                          setNewJob({
                            ...newJob,
                            blogs: { ...newJob.blogs, imageSource: e.target.value },
                          })
                        }
                      }}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label
                      htmlFor="ai-generated"
                      onClick={(e) => {
                        if (userPlan === "free") {
                          e.preventDefault()
                          openUpgradePopup({ featureName: "AI-Generated Images", navigate })
                        }
                      }}
                      className="text-sm cursor-pointer flex items-center gap-1 text-gray-700"
                    >
                      AI-Generated Images
                      {userPlan === "free" && <Crown className="w-4 h-4 text-yellow-500" />}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="gemini"
                      name="aiModel"
                      value="gemini"
                      checked={newJob.blogs.aiModel === "gemini"}
                      onChange={(e) =>
                        setNewJob({
                          ...newJob,
                          blogs: { ...newJob.blogs, aiModel: e.target.value },
                        })
                      }
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label htmlFor="gemini" className="text-sm text-gray-700">
                      Gemini
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="openai"
                      name="aiModel"
                      value="openai"
                      checked={newJob.blogs.aiModel === "openai"}
                      onChange={(e) => {
                        if (userPlan !== "free") {
                          setNewJob({
                            ...newJob,
                            blogs: { ...newJob.blogs, aiModel: e.target.value },
                          })
                        }
                      }}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label
                      htmlFor="openai"
                      onClick={(e) => {
                        if (userPlan === "free") {
                          e.preventDefault()
                          openUpgradePopup({ featureName: "ChatGPT (Open AI)", navigate })
                        }
                      }}
                      className="text-sm cursor-pointer flex items-center gap-1 text-gray-700"
                    >
                      ChatGPT (Open AI)
                      {userPlan === "free" && <Crown className="w-4 h-4 text-yellow-500" />}
                    </label>
                  </div>
                </div>
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
                    onChange={handleKeywordInputChange}
                    onKeyDown={handleKeyPressKeyword}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., digital marketing trends, AI in business"
                    aria-label="Add keyword"
                  />
                  <button
                    onClick={handleAddKeywordManual}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    aria-label="Add keyword"
                  >
                    Add
                  </button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVKeywordUpload} hidden />
                    <span className="sr-only">Upload CSV for keywords</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {formData.keywords
                    .slice()
                    .reverse()
                    .slice(0, 18)
                    .map((keyword, reversedIndex) => {
                      const actualIndex = formData.keywords.length - 1 - reversedIndex
                      return (
                        <span
                          key={`${keyword}-${actualIndex}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(actualIndex)}
                            className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                            aria-label={`Remove keyword ${keyword}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )
                    })}
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
                aria-label="Previous step"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (validateSteps(2)) setCurrentStep(3)
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                aria-label="Next step"
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
                    aria-label="Toggle FAQ inclusion"
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
                    aria-label="Toggle competitive research inclusion"
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
                    aria-label="Toggle interlinks inclusion"
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
                    aria-label="Toggle WordPress automatic posting"
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
                      aria-label="Toggle table of contents inclusion"
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
                aria-label="Previous step"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                aria-label="Next step"
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
                  aria-label="Select schedule type"
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
                        aria-label={`Select ${d} for weekly schedule`}
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
                        aria-label={`Select date ${date} for monthly schedule`}
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
                    aria-label="Select custom dates"
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
                  onChange={handleNumberOfBlogsChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the number of blogs"
                  aria-label="Number of blogs"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                aria-label="Previous step"
              >
                Previous
              </button>
              <button
                onClick={newJob?._id ? () => handleUpdateJob(newJob._id) : handleCreateJob}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                aria-label={newJob?._id ? "Update job" : "Create job"}
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

    const uniqueKeywords = [
      ...new Set([
        ...(selectedKeywords?.focusKeywords || []),
        ...(selectedKeywords?.allKeywords || []),
      ]),
    ]
    console.log("Jobs: Opening job modal with keywords:", uniqueKeywords)
    setNewJob({
      ...initialJob,
      blogs: {
        ...initialJob.blogs,
        keywords: uniqueKeywords,
      },
    })
    setFormData({
      keywords: uniqueKeywords,
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
                      aria-label={job.status === "active" ? "Stop job" : "Start job"}
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
                      aria-label="Edit job"
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
