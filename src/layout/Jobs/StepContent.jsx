import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Select, message, Tooltip } from "antd"
import MultiDatePicker from "react-multi-date-picker"
import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@/data/templates"
import { Crown, Info, Plus, TriangleAlert, Upload, X } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { useNavigate } from "react-router-dom"
import { fetchBrands } from "@store/slices/brandSlice"
import { useQuery } from "@tanstack/react-query"
import { getIntegrationsThunk } from "@store/slices/otherSlice"

const { Option } = Select

const StepContent = ({
  currentStep,
  newJob,
  setNewJob,
  formData,
  setFormData,
  errors,
  setErrors,
  recentlyUploadedTopicsCount,
  setRecentlyUploadedTopicsCount,
  recentlyUploadedKeywordsCount,
  setRecentlyUploadedKeywordsCount,
  showAllTopics,
  setShowAllTopics,
  showAllKeywords,
  setShowAllKeywords,
  user,
  userPlan,
}) => {
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  const isProUser = user?.subscription?.plan === "pro"
  const { data: integrations } = useSelector(state => state.wordpress)
  const {
    data: brands = [],
    isLoading: loadingBrands,
    error: brandError,
  } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await dispatch(fetchBrands()).unwrap()
      return response
    },
  })

  useEffect(() => {
    if (integrations?.integrations?.size) {
      setFormData(prev => ({
        ...prev,
        postingType: integrations.integrations.key().next().value,
      }))
    }
  }, [integrations])

  const tones = [
    "Professional",
    "Casual",
    "Friendly",
    "Formal",
    "Conversational",
    "Witty",
    "Informative",
    "Inspirational",
    "Persuasive",
    "Empathetic",
  ]
  const wordLengths = [500, 1000, 1500, 2000, 3000]
  const MAX_BLOGS = 10
  const isAiImagesLimitReached = user?.usage?.aiImages >= user?.usageLimits?.aiImages
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(getIntegrationsThunk())
  }, [dispatch])

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      newJob?.blogs?.blogImages?.forEach(image => {
        if (image instanceof File) {
          URL.revokeObjectURL(URL.createObjectURL(image))
        }
      })
    }
  }, [newJob.blogs.blogImages])

  useEffect(() => {
    if (isAiImagesLimitReached && newJob.blogs.isCheckedGeneratedImages) {
      setNewJob(prev => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          isCheckedGeneratedImages: false,
          imageSource: "unsplash",
        },
      }))
    }
  }, [isAiImagesLimitReached, newJob.blogs.isCheckedGeneratedImages])

  const imageSources = [
    {
      id: "unsplash",
      label: "Stock Images",
      value: "unsplash",
      restricted: false,
    },
    {
      id: "ai-generated",
      label: "AI-Generated Images",
      value: "ai-generated",
      restricted: userPlan === "free",
      featureName: "AI-Generated Images",
      isAiImagesLimitReached,
    },
  ]

  const aiModels = [
    {
      id: "gemini",
      label: "Gemini",
      value: "gemini",
      logo: "/Images/gemini.png",
      restricted: false,
    },
    {
      id: "chatgpt",
      label: "ChatGPT (Open AI)",
      value: "openai",
      logo: "/Images/chatgpt.png",
      featureName: "ChatGPT (Open AI)",
    },
    {
      id: "claude",
      label: "Claude",
      value: "claude",
      logo: "/Images/claude.png",
      featureName: "Claude",
    },
  ]

  const handleIntegrationChange = platform => {
    setFormData(prev => ({
      ...prev,
      postingType: platform,
    }))
    setErrors(prev => ({ ...prev, postingType: false })) // Clear error on change
  }

  useEffect(() => {
    if (newJob.blogs.useBrandVoice && (!brands || brands.length === 0)) {
      setNewJob(prev => ({
        ...prev,
        blogs: { ...prev.blogs, useBrandVoice: false, brandId: null },
      }))
      message.warning("No brand voices available. Create one to enable this option.", 3)
    }
  }, [brands, newJob.blogs.useBrandVoice])

  const handleAddItems = (input, type) => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    const existing =
      type === "topics"
        ? newJob.blogs.topics.map(t => t.toLowerCase().trim())
        : formData.keywords.map(k => k.toLowerCase().trim())
    const seen = new Set()
    const newItems = trimmedInput
      .split(",")
      .map(item => item.trim())
      .filter(item => {
        const lower = item.toLowerCase()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

    if (newItems.length === 0) return

    if (type === "topics") {
      setFormData(prev => ({
        ...prev,
        topicInput: "",
      }))
      setNewJob(prev => ({
        ...prev,
        blogs: { ...prev.blogs, topics: [...prev.blogs.topics, ...newItems] },
      }))
      setErrors(prev => ({ ...prev, topics: false }))
    } else {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, ...newItems],
        keywordInput: "",
      }))
      setNewJob(prev => ({
        ...prev,
        blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...newItems] },
      }))
      setErrors(prev => ({ ...prev, keywords: false }))
    }
  }

  const handleInputChange = e => {
    const { name, value, type } = e.target

    // Determine the value for number inputs
    let val
    if (type === "tel") {
      if (value === "") {
        val = "" // allow clearing
      } else {
        val = parseInt(value, 10)
        if (val < 0) val = 0 // min value
        if (val > 20) val = 20 // max value
      }
    } else {
      val = value
    }

    // Update state
    setNewJob(prev => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        [name]: val,
      },
    }))
  }

  const handleCSVUpload = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) {
      message.error("No file selected. Please choose a valid CSV file.")
      return
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      message.error("Invalid file type. Please upload a .csv file.")
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024 // 20KB
    if (file.size > maxSizeInBytes) {
      message.error("File size exceeds 20KB limit. Please upload a smaller file.")
      e.target.value = null
      return
    }

    const reader = new FileReader()
    reader.onload = event => {
      const text = event.target?.result
      if (!text || typeof text !== "string") {
        message.error("Failed to read the CSV file. Please ensure it is valid.")
        return
      }

      // Split the CSV content into lines
      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        message.error("The CSV file is empty. Please provide a valid CSV with topics or keywords.")
        return
      }

      // Check if first line is header and skip if it matches the type
      const headerKey = type.charAt(0).toUpperCase() + type.slice(1) // "Topics" or "Keywords"
      if (lines[0].toLowerCase().includes(type)) {
        lines = lines.slice(1)
      }

      // Extract items from the CSV (taking the first non-empty column)
      const items = lines
        .map(line => {
          const parts = line.split(",")
          return parts.map(part => part.trim()).find(part => part) || null
        })
        .filter(item => item && item.trim().length > 0)

      if (items.length === 0) {
        message.warning(`No valid ${type} found in the CSV file.`)
        return
      }

      // Compare with existing items (case-insensitive)
      const existing =
        type === "topics"
          ? newJob.blogs.topics.map(t => t.toLowerCase().trim())
          : formData.keywords.map(k => k.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter(item => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        message.warning(
          `No new ${type} found in the CSV. All provided items are either duplicates or already exist.`
        )
        return
      }

      // Update state with new items
      if (type === "topics") {
        setNewJob(prev => ({
          ...prev,
          blogs: { ...prev.blogs, topics: [...prev.blogs.topics, ...uniqueNewItems] },
        }))
        setErrors(prev => ({ ...prev, topics: false }))
      } else {
        setFormData(prev => ({
          ...prev,
          keywords: [...prev.keywords, ...uniqueNewItems],
        }))
        setNewJob(prev => ({
          ...prev,
          blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...uniqueNewItems] },
        }))
        setErrors(prev => ({ ...prev, keywords: false }))
      }

      // Notify user of successful upload
      message.success(`${uniqueNewItems.length} new ${type} added from CSV.`)

      // Update recently uploaded count based on type
      if (type === "topics") {
        setRecentlyUploadedTopicsCount(uniqueNewItems.length)
        setTimeout(() => setRecentlyUploadedTopicsCount(null), 5000)
      } else {
        setRecentlyUploadedKeywordsCount(uniqueNewItems.length)
        setTimeout(() => setRecentlyUploadedKeywordsCount(null), 5000)
      }
    }

    reader.onerror = () => {
      message.error("An error occurred while reading the CSV file.")
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const handleCheckboxChange = e => {
    const { name, checked } = e.target
    if (name === "wordpressPosting" && checked) {
      const hasAnyIntegration = Object.keys(integrations?.integrations || {}).length > 0

      if (!hasAnyIntegration) {
        message.error("Please connect your account in plugins.")
        return
      }
    }
    setNewJob(prev => ({
      ...prev,
      options: { ...prev.options, [name]: checked },
    }))
    if (name === "performKeywordResearch") {
      setFormData(prev => ({ ...prev, performKeywordResearch: checked }))
      setErrors(prev => ({ ...prev, keywords: false })) // Clear keyword error if enabling research
    }
  }

  const handleNumberOfBlogsChange = e => {
    const { value } = e.target

    let numberValue
    if (value === "") {
      numberValue = "" // allow clearing
    } else {
      numberValue = parseInt(value, 10)
      if (isNaN(numberValue)) numberValue = "" // ignore invalid input
      if (numberValue > MAX_BLOGS) numberValue = MAX_BLOGS // clamp to max
      if (numberValue < 0) numberValue = 0 // optional: clamp to min
    }

    setNewJob(prev => ({
      ...prev,
      blogs: { ...prev.blogs, numberOfBlogs: numberValue },
    }))

    setErrors(prev => ({ ...prev, numberOfBlogs: false }))
  }

  const keywordsToShow = showAllKeywords
    ? formData.keywords.slice().reverse()
    : formData.keywords.slice().reverse().slice(0, 18)

  const topicsToShow = showAllTopics
    ? newJob.blogs.topics.slice().reverse()
    : newJob.blogs.topics.slice().reverse().slice(0, 18)

  const handleImageSourceChange = source => {
    setNewJob(prev => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        imageSource: source,
        isUnsplashActive: source === "unsplash",
      },
    }))
    setErrors(prev => ({ ...prev, imageSource: false })) // Clear error
  }

  const validateImages = files => {
    const maxImages = 15
    const maxSize = 5 * 1024 * 1024 // 5 MB in bytes
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (!files || files.length === 0) return []

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        message.error(
          `"${file.name}" is not a valid image type. Only PNG, JPEG, and WebP are allowed.`
        )
        return false
      }
      if (file.size > maxSize) {
        message.error(`"${file.name}" exceeds the 5 MB size limit.`)
        return false
      }
      return true
    })

    const totalImages = newJob.blogs.blogImages.length + validFiles.length
    if (totalImages > maxImages) {
      message.error(`Cannot upload more than ${maxImages} images.`)
      return validFiles.slice(0, maxImages - newJob.blogs.blogImages.length)
    }

    return validFiles
  }

  const handleFileChange = e => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setNewJob(prev => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          blogImages: [...prev.blogs.blogImages, ...validFiles],
        },
      }))
      message.success(`${validFiles.length} image(s) added successfully!`)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset input
    }
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setFormData(prev => ({ ...prev, isDragging: false }))

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setNewJob(prev => ({
        ...prev,
        blogs: {
          ...prev.blogs,
          blogImages: [...prev.blogs.blogImages, ...validFiles],
        },
      }))
      // message.success(`${validFiles.length} image(s) added successfully!`)
    }
  }

  const handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    setFormData(prev => ({ ...prev, isDragging: true }))
  }

  const handleDragLeave = e => {
    e.preventDefault()
    e.stopPropagation()
    setFormData(prev => ({ ...prev, isDragging: false }))
  }

  const handleRemoveImage = index => {
    setNewJob(prev => ({
      ...prev,
      blogs: {
        ...prev.blogs,
        blogImages: prev.blogs.blogImages.filter((_, i) => i !== index),
      },
    }))
  }

  switch (currentStep) {
    case 1:
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 sm:space-y-6"
        >
          <p className="text-sm text-gray-600 mb-3 sm:mb-4">
            Select up to 3 templates for the types of blogs you want to generate.
          </p>
          {/* Mobile View: Vertical Scrolling Layout */}
          <div
            className={`sm:hidden grid grid-cols-2 gap-4 ${
              errors.templates ? "border-red-500 border-2" : ""
            }`}
          >
            {packages.map(pkg => (
              <div
                key={pkg.name}
                className={`relative cursor-pointer transition-all duration-200 w-full ${
                  newJob.blogs.templates.includes(pkg.name)
                    ? "border-gray-300 border-2 rounded-lg"
                    : ""
                } ${pkg.paid && !isProUser ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (pkg.paid && !isProUser) {
                    message.error("Please upgrade to a Pro subscription to access this template.")
                    return
                  }
                  if (newJob.blogs.templates.includes(pkg.name)) {
                    setNewJob(prev => ({
                      ...prev,
                      blogs: {
                        ...prev.blogs,
                        templates: prev.blogs.templates.filter(template => template !== pkg.name),
                      },
                    }))
                    setErrors(prev => ({ ...prev, templates: false }))
                  } else if (newJob.blogs.templates.length < 3) {
                    setNewJob(prev => ({
                      ...prev,
                      blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                    }))
                    setErrors(prev => ({ ...prev, templates: false }))
                  } else {
                    message.error("You can only select up to 3 templates.")
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    if (pkg.paid && !isProUser) {
                      message.error("Please upgrade to a Pro subscription to access this template.")
                      return
                    }
                    if (newJob.blogs.templates.includes(pkg.name)) {
                      setNewJob(prev => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          templates: prev.blogs.templates.filter(template => template !== pkg.name),
                        },
                      }))
                      setErrors(prev => ({ ...prev, templates: false }))
                    } else if (newJob.blogs.templates.length < 3) {
                      setNewJob(prev => ({
                        ...prev,
                        blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                      }))
                      setErrors(prev => ({ ...prev, templates: false }))
                    } else {
                      message.error("You can only select up to 3 templates.")
                    }
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${pkg.name} template`}
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="relative">
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                    {pkg.paid && !isProUser && (
                      <div className="absolute top-2 right-2">
                        <Crown size={20} className="text-yellow-500" aria-label="Pro feature" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.templates && <p className="text-red-500 text-xs">{errors.templates}</p>}

          {/* Desktop View: 1x2 Grid Layout */}
          <div className={`hidden sm:block ${errors.templates ? "border-red-500 border-2" : ""}`}>
            <div className="grid grid-cols-2 gap-4">
              {packages.map(pkg => (
                <div
                  key={pkg.name}
                  className={`relative cursor-pointer transition-all duration-200 w-full ${
                    newJob.blogs.templates.includes(pkg.name)
                      ? "border-gray-300 border-2 rounded-lg"
                      : ""
                  } ${pkg.paid && !isProUser ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (pkg.paid && !isProUser) {
                      message.error("Please upgrade to a Pro subscription to access this template.")
                      return
                    }
                    if (newJob.blogs.templates.includes(pkg.name)) {
                      setNewJob(prev => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          templates: prev.blogs.templates.filter(template => template !== pkg.name),
                        },
                      }))
                      setErrors(prev => ({ ...prev, templates: false }))
                    } else if (newJob.blogs.templates.length < 3) {
                      setNewJob(prev => ({
                        ...prev,
                        blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                      }))
                      setErrors(prev => ({ ...prev, templates: false }))
                    } else {
                      message.error("You can only select up to 3 templates.")
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (pkg.paid && !isProUser) {
                        message.error(
                          "Please upgrade to a Pro subscription to access this template."
                        )
                        return
                      }
                      if (newJob.blogs.templates.includes(pkg.name)) {
                        setNewJob(prev => ({
                          ...prev,
                          blogs: {
                            ...prev.blogs,
                            templates: prev.blogs.templates.filter(
                              template => template !== pkg.name
                            ),
                          },
                        }))
                        setErrors(prev => ({ ...prev, templates: false }))
                      } else if (newJob.blogs.templates.length < 3) {
                        setNewJob(prev => ({
                          ...prev,
                          blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                        }))
                        setErrors(prev => ({ ...prev, templates: false }))
                      } else {
                        message.error("You can only select up to 3 templates.")
                      }
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${pkg.name} template`}
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="relative">
                      <img
                        src={pkg.imgSrc || "/placeholder.svg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                      {pkg.paid && !isProUser && (
                        <div className="absolute top-2 right-2">
                          <Crown size={20} className="text-yellow-500" aria-label="Pro feature" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {errors.templates && <p className="text-red-500 text-xs">{errors.templates}</p>}
        </motion.div> 
      )
    case 2:
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Name</label>
              <input
                type="text"
                value={newJob.name}
                placeholder="Enter job name"
                onChange={e => {
                  setNewJob({ ...newJob, name: e.target.value })
                  setErrors(prev => ({ ...prev, name: false }))
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-200"
                }`}
                aria-label="Job name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex gap-2 items-center">
                Topics
                <Tooltip title="Upload a .csv file in the format: `Topics` as header">
                  <Info size={16} className="text-blue-500 cursor-pointer" />
                </Tooltip>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.topicInput || ""}
                  onKeyDown={e =>
                    e.key === "Enter" && handleAddItems(formData.topicInput, "topics")
                  }
                  onChange={e => setFormData(prev => ({ ...prev, topicInput: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.topics ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Add a topic..."
                  aria-label="Add topic"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddItems(formData.topicInput, "topics")}
                  className="px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg"
                  aria-label="Add topic"
                >
                  <Plus />
                </motion.button>
                <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => handleCSVUpload(e, "topics")}
                    hidden
                  />
                  <span className="sr-only">Upload CSV for topics</span>
                </label>
              </div>
              {errors.topics && <p className="text-red-500 text-xs mt-1">{errors.topics}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {topicsToShow.map((topic, reversedIndex) => {
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
                          setNewJob(prev => ({
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
                {(newJob.blogs.topics.length > 18 || recentlyUploadedTopicsCount) && (
                  <span
                    onClick={() => setShowAllTopics(prev => !prev)}
                    className="text-xs font-medium text-blue-600 self-center cursor-pointer flex items-center gap-1"
                  >
                    {showAllTopics ? (
                      <>Show less</>
                    ) : (
                      <>
                        {newJob.blogs.topics.length > 18 &&
                          `+${newJob.blogs.topics.length - 18} more`}
                        {recentlyUploadedTopicsCount &&
                          ` (+${recentlyUploadedTopicsCount} uploaded)`}
                      </>
                    )}
                  </span>
                )}
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
              </label>
            </div>
            {!formData.performKeywordResearch && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex gap-2 items-center">
                  Keywords
                  <Tooltip title="Upload a .csv file in the format: `Keywords` as header">
                    <Info size={16} className="text-blue-500 cursor-pointer" />
                  </Tooltip>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.keywordInput}
                    onChange={e => setFormData(prev => ({ ...prev, keywordInput: e.target.value }))}
                    onKeyDown={e =>
                      e.key === "Enter" && handleAddItems(formData.keywordInput, "keywords")
                    }
                    className={`flex-1 px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.keywords ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., digital marketing trends, AI in business"
                  />
                  <button
                    onClick={() => handleAddItems(formData.keywordInput, "keywords")}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                  >
                    <Plus />
                  </button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => handleCSVUpload(e, "keywords")}
                      hidden
                    />
                    <span className="sr-only">Upload CSV</span>
                  </label>
                </div>
                {errors.keywords && <p className="text-red-500 text-xs mt-1">{errors.keywords}</p>}
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {keywordsToShow.map((keyword, reversedIndex) => {
                    const actualIndex = formData.keywords.length - 1 - reversedIndex
                    return (
                      <span
                        key={`${keyword}-${actualIndex}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedKeywords = [...formData.keywords]
                            updatedKeywords.splice(actualIndex, 1)
                            setFormData(prev => ({ ...prev, keywords: updatedKeywords }))
                            setNewJob(prev => ({
                              ...prev,
                              blogs: { ...prev.blogs, keywords: updatedKeywords },
                            }))
                          }}
                          className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                  {(formData.keywords.length > 18 || recentlyUploadedKeywordsCount) && (
                    <span
                      onClick={() => setShowAllKeywords(prev => !prev)}
                      className="text-xs font-medium text-blue-600 self-center cursor-pointer flex items-center gap-1"
                    >
                      {showAllKeywords ? (
                        <>Show less</>
                      ) : (
                        <>
                          {formData.keywords.length > 18 &&
                            `+${formData.keywords.length - 18} more`}
                          {recentlyUploadedKeywordsCount &&
                            ` (+${recentlyUploadedKeywordsCount} uploaded)`}
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                  Tone of Voice <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full"
                  value={newJob.blogs.tone}
                  onChange={value => {
                    setNewJob({ ...newJob, blogs: { ...newJob.blogs, tone: value } })
                    setErrors(prev => ({ ...prev, tone: false }))
                  }}
                  placeholder="Select tone"
                  status={errors.tone ? "error" : ""}
                >
                  <Option value="">Select Tone</Option>
                  <Option value="professional">Professional</Option>
                  <Option value="casual">Casual</Option>
                  <Option value="friendly">Friendly</Option>
                  <Option value="formal">Formal</Option>
                  <Option value="conversational">Conversational</Option>
                  <Option value="witty">Witty</Option>
                  <Option value="informative">Informative</Option>
                  <Option value="inspirational">Inspirational</Option>
                  <Option value="persuasive">Persuasive</Option>
                  <Option value="empathetic">Empathetic</Option>
                </Select>
                {errors.tone && <p className="text-red-500 text-xs mt-1">{errors.tone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approx. Blog Length (Words)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    value={newJob.blogs.userDefinedLength}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-[#1B6FC9] to-gray-100 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                    style={{
                      background: `linear-gradient(to right, #1B6FC9 ${
                        ((newJob.blogs.userDefinedLength - 500) / 4500) * 100
                      }%, #E5E7EB ${((newJob.blogs.userDefinedLength - 500) / 4500) * 100}%)`,
                    }}
                    onChange={e =>
                      setNewJob({
                        ...newJob,
                        blogs: { ...newJob.blogs, userDefinedLength: parseInt(e.target.value) },
                      })
                    }
                  />
                  <span className="mt-2 text-sm text-gray-600 block">
                    {newJob.blogs.userDefinedLength} words
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )
    case 3:
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-gray-700">Add Image</label>
            <div className="flex items-center">
              <label htmlFor="add-image-toggle" className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  id="add-image-toggle"
                  className="sr-only peer"
                  checked={newJob.blogs.isCheckedGeneratedImages}
                  onChange={e => {
                    const checked = e.target.checked
                    setNewJob(prev => ({
                      ...prev,
                      blogs: {
                        ...prev.blogs,
                        isCheckedGeneratedImages: checked,
                        imageSource: checked ? prev.blogs.imageSource : "unsplash",
                      },
                    }))
                  }}
                />
                <div
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${
                    newJob.blogs.isCheckedGeneratedImages ? "bg-[#1B6FC9]" : "bg-gray-300"
                  }`}
                />
                <div
                  className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-300 ${
                    newJob.blogs.isCheckedGeneratedImages ? "translate-x-6" : ""
                  }`}
                />
              </label>
              {newJob.blogs.isCheckedGeneratedImages && isAiImagesLimitReached && (
                <Tooltip
                  title="You've reached your AI image generation limit. It'll reset in the next billing cycle."
                  overlayInnerStyle={{
                    backgroundColor: "#FEF9C3",
                    border: "1px solid #FACC15",
                    color: "#78350F",
                  }}
                >
                  <TriangleAlert className="text-yellow-400 ml-4" size={15} />
                </Tooltip>
              )}
            </div>
          </div>
          {newJob.blogs.isCheckedCustomImages && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Custom Images (Max 15, each 5MB)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  formData.isDragging ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop images here or click to select
                </p>
                <button
                  className="px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-md text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Images
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                />
              </div>
              {newJob.blogs.blogImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {newJob.blogs.blogImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image instanceof File ? URL.createObjectURL(image) : image}
                        alt={image instanceof File ? image.name : `Image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {image instanceof File ? image.name : `Image ${index + 1}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {newJob.blogs.isCheckedGeneratedImages && !newJob.blogs.isCheckedCustomImages && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Image Source
                </label>

                {/* Responsive grid */}
                <div
                  className={`grid grid-cols-2 gap-4 mx-auto w-full ${
                    errors.imageSource ? "border-2 border-red-500 rounded-lg p-2" : ""
                  }`}
                >
                  {imageSources.map(source => {
                    const isAiRestricted =
                      source.value === "ai-generated" && source.isAiImagesLimitReached

                    const isBlocked = source.restricted || isAiRestricted

                    return (
                      <label
                        key={source.id}
                        htmlFor={source.id}
                        className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150
              ${
                newJob.blogs.imageSource === source.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300"
              }
              hover:shadow-sm w-full
              ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}
            `}
                        onClick={e => {
                          if (isBlocked) {
                            e.preventDefault()
                            openUpgradePopup({
                              featureName: source.featureName || "AI-Generated Images",
                              navigate,
                            })
                          }
                        }}
                      >
                        <input
                          type="radio"
                          id={source.id}
                          name="imageSource"
                          value={source.value}
                          checked={newJob.blogs.imageSource === source.value}
                          onChange={() => {
                            if (!isBlocked) {
                              handleImageSourceChange(source.value)
                            }
                          }}
                          className="hidden"
                          disabled={isBlocked}
                        />
                        <span className="text-sm font-medium text-gray-800">{source.label}</span>
                        {(source.restricted || isAiRestricted) && (
                          <Crown className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                        )}
                      </label>
                    )
                  })}
                </div>
                {errors.imageSource && (
                  <p className="text-red-500 text-xs mt-1">{errors.imageSource}</p>
                )}
              </div>
              <div className="w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Number of Images
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Enter the number of images (0 = AI will decide)
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="numberOfImages"
                  min="0"
                  max="15"
                  value={newJob.blogs.numberOfImages ?? ""}
                  onChange={handleInputChange}
                  onWheel={e => e.currentTarget.blur()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 transition"
                  placeholder="e.g., 5"
                />
                {errors.numberOfImages && (
                  <p className="text-red-500 text-xs mt-1">{errors.numberOfImages}</p>
                )}
              </div>
            </>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select AI Model
            </label>
            {/* Responsive grid: 1 col (mobile), 2 cols (tablet), 3 cols (desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {[
                { id: "gemini", label: "Gemini", logo: "/Images/gemini.png", restricted: false },
                { id: "chatgpt", label: "ChatGPT", logo: "/Images/chatgpt.png" },
                { id: "claude", label: "Claude", logo: "/Images/claude.png" },
              ].map(model => (
                <label
                  key={model.id}
                  htmlFor={model.id}
                  className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-150
      ${formData.aiModel === model.id ? "border-blue-600 bg-blue-50" : "border-gray-300"}
      hover:shadow-sm w-full`}
                  onClick={e => {
                    if (model.restricted) {
                      e.preventDefault()
                      openUpgradePopup({ featureName: model.label, navigate })
                    }
                  }}
                >
                  <input
                    type="radio"
                    id={model.id}
                    name="aiModel"
                    value={model.id}
                    checked={formData.aiModel === model.id}
                    onChange={e => {
                      if (!model.restricted) {
                        setFormData(prev => ({ ...prev, aiModel: e.target.value }))
                      }
                    }}
                    className="hidden"
                  />
                  <img src={model.logo} alt={model.label} className="w-6 h-6 object-contain" />
                  <span className="text-sm font-medium text-gray-800">{model.label}</span>
                  {model.restricted && (
                    <Crown className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
              <Select
                value={newJob.schedule.type}
                onChange={value => {
                  setNewJob({
                    ...newJob,
                    schedule: {
                      ...newJob.schedule,
                      type: value,
                      daysOfWeek: value === "weekly" ? [] : newJob.schedule.daysOfWeek,
                      daysOfMonth: value === "monthly" ? [] : newJob.schedule.daysOfMonth,
                      customDates: value === "custom" ? [] : newJob.schedule.customDates,
                    },
                  })
                  setErrors(prev => ({
                    ...prev,
                    daysOfWeek: false,
                    daysOfMonth: false,
                    customDates: false,
                  }))
                }}
                className="w-full"
              >
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </div>
            {newJob.schedule.type === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Days of Week
                </label>
                <div
                  className={`flex gap-2 flex-wrap ${
                    errors.daysOfWeek ? "border-red-500 border-2 p-2 rounded" : ""
                  }`}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`px-2 py-1 rounded ${
                        newJob.schedule.daysOfWeek?.includes(i)
                          ? "bg-[#1B6FC9] text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setNewJob(prev => {
                          const daysOfWeek = prev.schedule.daysOfWeek?.includes(i)
                            ? prev.schedule.daysOfWeek.filter(day => day !== i)
                            : [...(prev.schedule.daysOfWeek || []), i]
                          return { ...prev, schedule: { ...prev.schedule, daysOfWeek } }
                        })
                        setErrors(prev => ({ ...prev, daysOfWeek: false }))
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {errors.daysOfWeek && (
                  <p className="text-red-500 text-xs mt-1">{errors.daysOfWeek}</p>
                )}
              </div>
            )}
            {newJob.schedule.type === "monthly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Dates of Month
                </label>
                <div
                  className={`flex gap-2 flex-wrap ${
                    errors.daysOfMonth ? "border-red-500 border-2 p-2 rounded" : ""
                  }`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                    <button
                      key={date}
                      type="button"
                      className={`px-2 py-1 rounded ${
                        newJob.schedule.daysOfMonth?.includes(date)
                          ? "bg-[#1B6FC9] text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => {
                        setNewJob(prev => {
                          const daysOfMonth = prev.schedule.daysOfMonth?.includes(date)
                            ? prev.schedule.daysOfMonth.filter(d => d !== date)
                            : [...(prev.schedule.daysOfMonth || []), date]
                          return { ...prev, schedule: { ...prev.schedule, daysOfMonth } }
                        })
                        setErrors(prev => ({ ...prev, daysOfMonth: false }))
                      }}
                    >
                      {date}
                    </button>
                  ))}
                </div>
                {errors.daysOfMonth && (
                  <p className="text-red-500 text-xs mt-1">{errors.daysOfMonth}</p>
                )}
              </div>
            )}
            {newJob.schedule.type === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Dates</label>
                <div className={errors.customDates ? "border-2 border-red-500 rounded-lg" : ""}>
                  <MultiDatePicker
                    value={newJob.schedule.customDates}
                    onChange={dates => {
                      setNewJob({
                        ...newJob,
                        schedule: {
                          ...newJob.schedule,
                          customDates: dates,
                          daysOfWeek: [],
                          daysOfMonth: [],
                        },
                      })
                      setErrors(prev => ({ ...prev, customDates: false }))
                    }}
                    multiple
                    format="YYYY-MM-DD"
                    className="w-full"
                    inputClass="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {errors.customDates && (
                  <p className="text-red-500 text-xs mt-1">{errors.customDates}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Blogs
              </label>
              <input
                type="tel"
                inputMode="numeric"
                name="numberOfBlogs"
                min="1"
                max={MAX_BLOGS}
                value={newJob.blogs.numberOfBlogs ?? ""}
                onChange={handleNumberOfBlogsChange}
                onWheel={e => e.currentTarget.blur()}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.numberOfBlogs ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Enter the number of blogs"
              />
              {errors.numberOfBlogs && (
                <p className="text-red-500 text-xs mt-1">{errors.numberOfBlogs}</p>
              )}
            </div>
          </div>
        </motion.div>
      )
    case 4:
      return (
        <div>
          <div className="mt-0">
            {[
              {
                label: "Add FAQ",
                name: "includeFaqs",
                desc: "Include frequently asked questions at the end of the blog.",
              },
              {
                label: "Add Competitive Research",
                name: "includeCompetitorResearch",
                desc: "Analyze competitors to improve blog quality.",
              },
              ...(newJob.options.includeCompetitorResearch
                ? [
                    {
                      label: "Show Outbound Links",
                      name: "addOutBoundLinks",
                      desc: "Add outbound links, references of other websites",
                    },
                  ]
                : []),
              {
                label: "Add InterLinks",
                name: "includeInterlinks",
                desc: "Add internal links between your blogs for better SEO.",
              },
              {
                label: "Enable Automatic Posting",
                name: "wordpressPosting",
                desc: "Automatically post the blog to your connected plugins.",
              },
              ...(newJob.options.wordpressPosting
                ? [
                    {
                      label: "Table of Content",
                      name: "includeTableOfContents",
                      desc: "Display a table of contents for easier navigation.",
                    },
                  ]
                : []),
            ].map(({ label, name, desc }) => (
              <div key={name} className="flex items-start justify-between py-2 mt-3">
                <span className="text-sm font-medium text-gray-700">
                  {label}
                  <p className="text-xs text-gray-500">{desc}</p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newJob.options[name]}
                    onChange={handleCheckboxChange}
                    name={name}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
                </label>
              </div>
            ))}

            {/* Only show integration options if wordpressPosting is true AND integrations exist */}
            {newJob.options.wordpressPosting &&
              Object.keys(integrations?.integrations || {}).length > 0 && (
                <div className="my-5">
                  <span className="text-sm font-medium text-gray-700">
                    Select Your Publishing Platform
                    <p className="text-xs text-gray-500">
                      Post your blog automatically to connected platforms only.
                    </p>
                  </span>

                  <Select
                    className="w-full mt-2"
                    placeholder="Select platform"
                    value={formData.postingType}
                    onChange={handleIntegrationChange}
                    status={errors.postingType ? "error" : ""}
                  >
                    {Object.entries(integrations.integrations).map(([platform, details]) => (
                      <Option key={platform} value={platform}>
                        {platform}
                      </Option>
                    ))}
                  </Select>
                  {errors.postingType && (
                    <p className="text-red-500 text-xs mt-1">{errors.postingType}</p>
                  )}
                </div>
              )}
          </div>

          <div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-medium text-gray-700">Write with Brand Voice</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newJob.blogs.useBrandVoice && brands?.length > 0}
                  onChange={() => {
                    if (!brands || brands.length === 0) {
                      message.warning(
                        "No brand voices available. Create one to enable this option.",
                        3
                      )
                      return
                    }
                    setNewJob(prev => ({
                      ...prev,
                      blogs: {
                        ...prev.blogs,
                        useBrandVoice: !prev.blogs.useBrandVoice,
                        brandId: !prev.blogs.useBrandVoice ? prev.blogs.brandId : null,
                      },
                    }))
                    setErrors(prev => ({ ...prev, brandId: false }))
                  }}
                  className="sr-only peer"
                  aria-checked={newJob.blogs.useBrandVoice && brands?.length > 0}
                />

                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
              </label>
            </div>
            {newJob.blogs.useBrandVoice && (
              <div
                className={`mt-3 flex p-4 rounded-md border bg-gray-50 ${
                  errors.brandId ? "border-red-500" : "border-gray-200"
                }`}
              >
                {loadingBrands ? (
                  <div className="text-gray-500 text-sm">Loading brand voices...</div>
                ) : brandError ? (
                  <div className="text-red-500 text-sm font-medium">{brandError}</div>
                ) : brands?.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto pr-1">
                    <div>
                      {brands.map(voice => (
                        <label
                          key={voice._id}
                          className={`flex items-start gap-2 p-3 mb-3 rounded-md cursor-pointer ${
                            newJob.blogs.brandId === voice._id
                              ? "bg-blue-100 border-blue-300"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedBrandVoice"
                            value={voice._id}
                            checked={newJob.blogs.brandId === voice._id}
                            onChange={() => {
                              setNewJob(prev => ({
                                ...prev,
                                blogs: { ...prev.blogs, brandId: voice._id },
                              }))
                              setErrors(prev => ({ ...prev, brandId: false }))
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">{voice.nameOfVoice}</div>
                            <p className="text-sm text-gray-600 mt-1">{voice.describeBrand}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm italic">
                    No brand voices available. Create one to get started.
                  </div>
                )}
              </div>
            )}
            {errors.brandId && <p className="text-red-500 text-xs mt-1">{errors.brandId}</p>}

            {newJob.blogs.useBrandVoice && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium text-gray-700">Add CTA at the End</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newJob.blogs.addCTA}
                    onChange={() => {
                      setNewJob(prev => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          addCTA: !prev.blogs.addCTA,
                        },
                      }))
                    }}
                    className="sr-only peer"
                    aria-checked={newJob.blogs.addCTA}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
                </label>
              </div>
            )}
          </div>
        </div>
      )
    default:
      return null
  }
}

export default StepContent
