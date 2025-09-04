import React, { useEffect } from "react"
import { motion } from "framer-motion"
import { Select, message, Tooltip } from "antd"
import MultiDatePicker from "react-multi-date-picker"
import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@constants/templates"
import { Crown, Info, Plus, TriangleAlert, Upload, X } from "lucide-react"
import { useDispatch } from "react-redux"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { useNavigate } from "react-router-dom"
import { fetchBrands } from "@store/slices/brandSlice"
import { useQuery } from "@tanstack/react-query"

const { Option } = Select

const StepContent = ({
  currentStep,
  newJob,
  setNewJob,
  formData,
  setFormData,
  errors,
  setErrors,
  recentlyUploadedCount,
  setRecentlyUploadedCount,
  showAllTopics,
  setShowAllTopics,
  showAllKeywords,
  setShowAllKeywords,
  user,
  userPlan,
}) => {
  const dispatch = useDispatch()
  const {
    data: brands = [],
    isLoading: loadingBrands,
    error: brandError,
  } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await dispatch(fetchBrands()).unwrap() // Dispatch and unwrap the payload
      return response // Return the brands data
    },
    // staleTime: 5 * 60 * 1000,
    // cacheTime: 10 * 60 * 1000,
  })

  const tones = ["Professional", "Casual", "Friendly", "Formal", "Technical"]
  const wordLengths = [500, 1000, 1500, 2000, 3000]
  const MAX_BLOGS = 100
  const isAiImagesLimitReached = user?.usage?.aiImages >= user?.usageLimits?.aiImages
  const navigate = useNavigate()

  useEffect(() => {
    if (isAiImagesLimitReached && formData.isCheckedGeneratedImages) {
      setFormData((prev) => ({
        ...prev,
        isCheckedGeneratedImages: false,
        imageSource: "unsplash", // Default to unsplash when AI images are disabled
      }))
    }
  }, [isAiImagesLimitReached, formData.isCheckedGeneratedImages])

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
      // restricted: userPlan === "free",
      logo: "/Images/chatgpt.png",
      featureName: "ChatGPT (Open AI)",
    },
    {
      id: "claude",
      label: "Claude",
      value: "claude",
      // restricted: userPlan === "free" || userPlan === "basic",
      logo: "/Images/claude.png",
      featureName: "Claude",
    },
  ]

  const handleAddItems = (input, type) => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    const existing =
      type === "topics"
        ? newJob.blogs.topics.map((t) => t.toLowerCase().trim())
        : formData.keywords.map((k) => k.toLowerCase().trim())
    const seen = new Set()
    const newItems = trimmedInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => {
        const lower = item.toLowerCase()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

    if (newItems.length === 0) return

    if (type === "topics") {
      setFormData((prev) => ({
        ...prev,
        topicInput: "",
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: { ...prev.blogs, topics: [...prev.blogs.topics, ...newItems] },
      }))
      setErrors((prev) => ({ ...prev, topics: false }))
    } else {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, ...newItems],
        keywordInput: "",
      }))
      setNewJob((prev) => ({
        ...prev,
        blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...newItems] },
      }))
      setErrors((prev) => ({ ...prev, keywords: false }))
    }
  }

  const handleCSVUpload = (e, type) => {
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
      const items = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.length >= 2 ? parts[1].trim() : null
        })
        .filter(Boolean)

      const existing =
        type === "topics"
          ? newJob.blogs.topics.map((t) => t.toLowerCase().trim())
          : formData.keywords.map((k) => k.toLowerCase().trim())
      const uniqueNewItems = items.filter((item) => !existing.includes(item.toLowerCase().trim()))

      if (uniqueNewItems.length === 0) {
        message.warning(`No new ${type} found in the CSV.`)
        return
      }

      if (type === "topics") {
        setNewJob((prev) => ({
          ...prev,
          blogs: { ...prev.blogs, topics: [...prev.blogs.topics, ...uniqueNewItems] },
        }))
        setErrors((prev) => ({ ...prev, topics: false }))
      } else {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...uniqueNewItems],
        }))
        setNewJob((prev) => ({
          ...prev,
          blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...uniqueNewItems] },
        }))
        setErrors((prev) => ({ ...prev, keywords: false }))
      }

      if (uniqueNewItems.length > 8) {
        setRecentlyUploadedCount(uniqueNewItems.length)
        setTimeout(() => setRecentlyUploadedCount(null), 5000)
      }
    }
    reader.readAsText(file)
    e.target.value = null
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    if (name === "wordpressPosting" && checked && !user?.wordpressLink) {
      message.error(
        "Please connect your WordPress account in your profile before enabling automatic posting."
      )
      navigate("/profile")
      return
    }
    setNewJob((prev) => ({
      ...prev,
      options: { ...prev.options, [name]: checked },
    }))
    if (name === "performKeywordResearch") {
      setFormData((prev) => ({ ...prev, performKeywordResearch: checked }))
    }
  }

  const handleNumberOfBlogsChange = (e) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= MAX_BLOGS) {
      setNewJob({ ...newJob, blogs: { ...newJob.blogs, numberOfBlogs: value } })
      setErrors((prev) => ({ ...prev, numberOfBlogs: false }))
    }
  }

  const keywordsToShow = showAllKeywords
    ? formData.keywords.slice().reverse()
    : formData.keywords.slice().reverse().slice(0, 18)

  const topicsToShow = showAllTopics
    ? newJob.blogs.topics.slice().reverse()
    : newJob.blogs.topics.slice().reverse().slice(0, 18)

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
          <div className="block sm:hidden space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`cursor-pointer transition-all duration-200 w-full ${
                  newJob.blogs.templates.includes(pkg.name)
                    ? "border-gray-300 border-2 rounded-lg"
                    : errors.template
                    ? "border-red-500 border-2"
                    : ""
                }`}
                onClick={() => {
                  if (newJob.blogs.templates.includes(pkg.name)) {
                    setNewJob((prev) => ({
                      ...prev,
                      blogs: {
                        ...prev.blogs,
                        templates: prev.blogs.templates.filter((template) => template !== pkg.name),
                      },
                    }))
                    setErrors((prev) => ({ ...prev, template: false }))
                  } else if (newJob.blogs.templates.length < 3) {
                    setNewJob((prev) => ({
                      ...prev,
                      blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                    }))
                    setErrors((prev) => ({ ...prev, template: false }))
                  } else {
                    message.error("You can only select up to 3 templates.")
                  }
                }}
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="relative">
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Carousel Layout */}
          <div className="hidden sm:block">
            <Carousel className="flex flex-row gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`cursor-pointer transition-all duration-200 w-full${
                    newJob.blogs.templates.includes(pkg.name)
                      ? "border-gray-300 border-2 rounded-lg"
                      : errors.template
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
                      setErrors((prev) => ({ ...prev, template: false }))
                    } else if (newJob.blogs.templates.length < 3) {
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: { ...prev.blogs, templates: [...prev.blogs.templates, pkg.name] },
                      }))
                      setErrors((prev) => ({ ...prev, template: false }))
                    } else {
                      message.error("You can only select up to 3 templates.")
                    }
                  }}
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="relative">
                      <img
                        src={pkg.imgSrc || "/placeholder.svg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
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
                onChange={(e) => {
                  setNewJob({ ...newJob, name: e.target.value })
                  setErrors((prev) => ({ ...prev, name: false }))
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-200"
                }`}
                aria-label="Job name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex gap-2 items-center">
                Topics
                <Tooltip title="Upload a .csv file in the format: `Keyword` as header">
                  <Info size={16} className="text-blue-500 cursor-pointer" />
                </Tooltip>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.topicInput || ""}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddItems(formData.topicInput, "topics")
                  }
                  onChange={(e) => setFormData((prev) => ({ ...prev, topicInput: e.target.value }))}
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
                    onChange={(e) => handleCSVUpload(e, "topics")}
                    hidden
                  />
                  <span className="sr-only">Upload CSV for topics</span>
                </label>
              </div>
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
                  <span
                    onClick={() => setShowAllTopics((prev) => !prev)}
                    className="text-xs font-medium text-blue-600 self-center cursor-pointer flex items-center gap-1"
                  >
                    {showAllTopics ? (
                      <>Show less</>
                    ) : (
                      <>
                        +{newJob.blogs.topics.length - 18} more
                        {recentlyUploadedCount && ` (+${recentlyUploadedCount} uploaded)`}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone of Voice</label>
              <Select
                value={newJob.blogs.tone}
                onChange={(value) =>
                  setNewJob({ ...newJob, blogs: { ...newJob.blogs, tone: value } })
                }
                className="w-full"
                aria-label="Select tone of voice"
              >
                {tones.map((tone) => (
                  <Option key={tone} value={tone}>
                    {tone}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
              <Select
                value={newJob.blogs.userDefinedLength}
                onChange={(value) =>
                  setNewJob({
                    ...newJob,
                    blogs: { ...newJob.blogs, userDefinedLength: parseInt(value) },
                  })
                }
                className="w-full"
                aria-label="Select blog length"
              >
                {wordLengths.map((length) => (
                  <Option key={length} value={length}>
                    {length} words
                  </Option>
                ))}
              </Select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">AI Model</label>
              <div className="flex gap-4 flex-wrap">
                {aiModels.map((model) => (
                  <label
                    key={model.id}
                    htmlFor={model.id}
                    className={`border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                      newJob.blogs.aiModel === model.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    } hover:shadow-sm w-full max-w-[220px] relative`}
                    onClick={(e) => {
                      if (model.restricted) {
                        e.preventDefault()
                        openUpgradePopup({ featureName: model.featureName, navigate })
                      }
                    }}
                  >
                    <input
                      type="radio"
                      id={model.id}
                      name="aiModel"
                      value={model.value}
                      checked={newJob.blogs.aiModel === model.value}
                      onChange={() => {
                        if (!model.restricted) {
                          setNewJob({
                            ...newJob,
                            blogs: { ...newJob.blogs, aiModel: model.value },
                          })
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
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Add Image</label>
              <div className="flex items-center">
                <label htmlFor="add-image-toggle" className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    id="add-image-toggle"
                    className="sr-only peer"
                    checked={newJob.blogs.isCheckedGeneratedImages}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          isCheckedGeneratedImages: checked,
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
                      backgroundColor: "#FEF9C3", // light yellow
                      border: "1px solid #FACC15", // yellow-400 border
                      color: "#78350F", // dark yellow text
                    }}
                  >
                    <TriangleAlert className="text-yellow-400 ml-4" size={15} />
                  </Tooltip>
                )}
              </div>
            </div>
            {newJob.blogs.isCheckedGeneratedImages && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Image Source
                </label>
                <div className="flex gap-4 flex-wrap">
                  {imageSources.map((source) => {
                    const isAiRestricted =
                      source.value === "ai-generated" && source.isAiImagesLimitReached

                    const isBlocked = source.restricted || isAiRestricted

                    return (
                      <label
                        key={source.id}
                        htmlFor={source.id}
                        className={`border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150
          ${
            newJob.blogs.imageSource === source.value
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300"
          }
          hover:shadow-sm w-full max-w-[220px] relative
          ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}
        `}
                        onClick={(e) => {
                          if (isBlocked) {
                            e.preventDefault()
                            // openUpgradePopup({
                            //   featureName: source.featureName || "AI-Generated Images",
                            //   navigate,
                            // })
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
                              setNewJob({
                                ...newJob,
                                blogs: { ...newJob.blogs, imageSource: source.value },
                              })
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
              </div>
            )}
          </div>
        </motion.div>
      )
    case 3:
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
          <div className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.keywordInput}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, keywordInput: e.target.value }))
                    }
                    onKeyDown={(e) =>
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
                      onChange={(e) => handleCSVUpload(e, "keywords")}
                      hidden
                    />
                    <span className="sr-only">Upload CSV</span>
                  </label>
                </div>
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
                            setFormData((prev) => ({ ...prev, keywords: updatedKeywords }))
                            setNewJob((prev) => ({
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
                  {(formData.keywords.length > 18 || recentlyUploadedCount) && (
                    <span
                      onClick={() => setShowAllKeywords((prev) => !prev)}
                      className="text-xs font-medium text-blue-600 self-center cursor-pointer flex items-center gap-1"
                    >
                      {showAllKeywords ? (
                        <>Show less</>
                      ) : (
                        <>
                          +{formData.keywords.length - 18} more
                          {recentlyUploadedCount && ` (+${recentlyUploadedCount} uploaded)`}
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <Select
                  value={newJob.schedule.type}
                  onChange={(value) => {
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
                    setErrors((prev) => ({
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
                  <div className="flex gap-2 flex-wrap">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`px-2 py-1 rounded ${
                          newJob.schedule.daysOfWeek?.includes(i)
                            ? "bg-[#1B6FC9] text-white"
                            : "bg-gray-200 text-gray-700"
                        } ${errors.daysOfWeek ? "border-2 border-red-500" : ""}`}
                        onClick={() => {
                          setNewJob((prev) => {
                            const daysOfWeek = prev.schedule.daysOfWeek?.includes(i)
                              ? prev.schedule.daysOfWeek.filter((day) => day !== i)
                              : [...(prev.schedule.daysOfWeek || []), i]
                            return { ...prev, schedule: { ...prev.schedule, daysOfWeek } }
                          })
                          setErrors((prev) => ({ ...prev, daysOfWeek: false }))
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
                            ? "bg-[#1B6FC9] text-white"
                            : "bg-gray-200 text-gray-700"
                        } ${errors.daysOfMonth ? "border-2 border-red-500" : ""}`}
                        onClick={() => {
                          setNewJob((prev) => {
                            const daysOfMonth = prev.schedule.daysOfMonth?.includes(date)
                              ? prev.schedule.daysOfMonth.filter((d) => d !== date)
                              : [...(prev.schedule.daysOfMonth || []), date]
                            return { ...prev, schedule: { ...prev.schedule, daysOfMonth } }
                          })
                          setErrors((prev) => ({ ...prev, daysOfMonth: false }))
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
                  <div className={errors.customDates ? "border-2 border-red-500 rounded-lg" : ""}>
                    <MultiDatePicker
                      value={newJob.schedule.customDates}
                      onChange={(dates) => {
                        setNewJob({
                          ...newJob,
                          schedule: {
                            ...newJob.schedule,
                            customDates: dates,
                            daysOfWeek: [],
                            daysOfMonth: [],
                          },
                        })
                        setErrors((prev) => ({ ...prev, customDates: false }))
                      }}
                      multiple
                      format="YYYY-MM-DD"
                      className="w-full"
                      inputClass="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.numberOfBlogs ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Enter the number of blogs"
                  min="1"
                  max={MAX_BLOGS}
                />
              </div>
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
                      desc: "Add outbound links to relevant competitor content.",
                    },
                  ]
                : []),
              {
                label: "Add InterLinks",
                name: "includeInterlinks",
                desc: "Add internal links between your blogs for better SEO.",
              },
              {
                label: "WordPress Automatic Posting",
                name: "wordpressPosting",
                desc: "Automatically post the blog to your connected WordPress site.",
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
          </div>
          <div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-medium text-gray-700">Write with Brand Voice</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newJob.blogs.useBrandVoice}
                  onChange={() => {
                    setNewJob((prev) => ({
                      ...prev,
                      blogs: {
                        ...prev.blogs,
                        useBrandVoice: !prev.blogs.useBrandVoice,
                        brandId: !prev.blogs.useBrandVoice ? prev.blogs.brandId : null,
                      },
                    }))
                    setErrors((prev) => ({ ...prev, brandId: false }))
                  }}
                  className="sr-only peer"
                  aria-checked={newJob.blogs.useBrandVoice}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
              </label>
            </div>
            {newJob.blogs.useBrandVoice && (
              <div className="mt-3 p-4 rounded-md border border-gray-200 bg-gray-50">
                {loadingBrands ? (
                  <div className="text-gray-500 text-sm">Loading brand voices...</div>
                ) : brandError ? (
                  <div className="text-red-500 text-sm font-medium">{brandError}</div>
                ) : brands?.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto pr-1">
                    <div className="grid gap-3">
                      {brands.map((voice) => (
                        <label
                          key={voice._id}
                          className={`flex items-start gap-2 p-3 rounded-md cursor-pointer ${
                            newJob.blogs.brandId === voice._id
                              ? "bg-blue-100 border-blue-300"
                              : "bg-white border border-gray-200"
                          } ${errors.brandId ? "border-red-500" : ""}`}
                        >
                          <input
                            type="radio"
                            name="selectedBrandVoice"
                            value={voice._id}
                            checked={newJob.blogs.brandId === voice._id}
                            onChange={() => {
                              setNewJob((prev) => ({
                                ...prev,
                                blogs: { ...prev.blogs, brandId: voice._id },
                              }))
                              setErrors((prev) => ({ ...prev, brandId: false }))
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

            {newJob.blogs.useBrandVoice && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium text-gray-700">Add CTA at the End</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newJob.blogs.addCTA}
                    onChange={() => {
                      setNewJob((prev) => ({
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
