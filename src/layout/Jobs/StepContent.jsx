import React, { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import MultiDatePicker from "react-multi-date-picker"
import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@/data/templates"
import { Crown, Info, Plus, TriangleAlert, Upload, X } from "lucide-react"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchIntegrations } from "@api/otherApi"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import clsx from "clsx"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { toast } from "sonner"
import { Switch } from "@components/ui/switch"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { IMAGE_SOURCE } from "@/data/blogData"

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
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const isProUser = user?.subscription?.plan === "pro"

  const { data: integrations } = useQuery({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (integrations?.integrations && Object.keys(integrations.integrations).length > 0) {
      if (!formData.postingType) {
        setFormData(prev => ({ ...prev, postingType: Object.keys(integrations.integrations)[0] }))
      }
    }
  }, [integrations])

  const wordLengths = [500, 1000, 1500, 2000, 3000]
  const MAX_BLOGS = 10
  const MAX_IMAGES = 15
  const isAiImagesLimitReached = (user?.usage?.aiImages || 0) >= (user?.usageLimits?.aiImages || 0)

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

  const handleIntegrationChange = platform => {
    setFormData(prev => ({ ...prev, postingType: platform }))
    setErrors(prev => ({ ...prev, postingType: false })) // Clear error on change
  }

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
      setFormData(prev => ({ ...prev, topicInput: "" }))
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
    if (type === "tel" || type === "range") {
      if (value === "") {
        val = "" // allow clearing
      } else {
        val = parseInt(value, 10)
        if (val < 0) val = 0 // min value
        if (val > MAX_IMAGES) val = MAX_IMAGES // max value
      }
    } else {
      val = value
    }

    // Update state
    setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, [name]: val } }))
  }

  const handleCSVUpload = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) {
      toast.error("No file selected. Please choose a valid CSV file.")
      return
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file type. Please upload a .csv file.")
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024 // 20KB
    if (file.size > maxSizeInBytes) {
      toast.error("File size exceeds 20KB limit. Please upload a smaller file.")
      e.target.value = null
      return
    }

    const reader = new FileReader()
    reader.onload = event => {
      const text = event.target?.result
      if (!text || typeof text !== "string") {
        toast.error("Failed to read the CSV file. Please ensure it is valid.")
        return
      }

      // Split the CSV content into lines
      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        toast.error("The CSV file is empty. Please provide a valid CSV with topics or keywords.")
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
        toast.warning(`No valid ${type} found in the CSV file.`)
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
        toast.warning(
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
        setFormData(prev => ({ ...prev, keywords: [...prev.keywords, ...uniqueNewItems] }))
        setNewJob(prev => ({
          ...prev,
          blogs: { ...prev.blogs, keywords: [...prev.blogs.keywords, ...uniqueNewItems] },
        }))
        setErrors(prev => ({ ...prev, keywords: false }))
      }

      // Notify user of successful upload
      toast.success(`${uniqueNewItems.length} new ${type} added from CSV.`)

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
      toast.error("An error occurred while reading the CSV file.")
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const handleCheckboxChange = e => {
    const { name, checked } = e.target
    if (name === "wordpressPosting" && checked) {
      const hasAnyIntegration = Object.keys(integrations?.integrations || {}).length > 0

      if (!hasAnyIntegration) {
        toast.error("Please connect your account in plugins.")
        return
      }
    }
    setNewJob(prev => ({ ...prev, options: { ...prev.options, [name]: checked } }))
    if (name === "wordpressPosting") {
      setFormData(prev => ({
        ...prev,
        postingType: checked
          ? prev.postingType || Object.keys(integrations?.integrations || {})[0]
          : null,
      }))
    }
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

    setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, numberOfBlogs: numberValue } }))

    setErrors(prev => ({ ...prev, numberOfBlogs: false }))
  }

  const keywordsToShow = showAllKeywords
    ? formData.keywords.slice().reverse()
    : formData.keywords.slice().reverse().slice(0, 18)

  const topicsToShow = showAllTopics
    ? newJob.blogs.topics.slice().reverse()
    : newJob.blogs.topics.slice().reverse().slice(0, 18)

  const handleImageSourceChange = source => {
    setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, imageSource: source } }))
    setErrors(prev => ({ ...prev, imageSource: false })) // Clear error
  }

  const handleTemplateSelection = useCallback(temps => {
    setNewJob(prev => ({
      ...prev,
      blogs: { ...prev.blogs, templates: temps.map(t => t.name) },
      templateIds: temps.map(t => t.id),
    }))
    setErrors(prev => ({ ...prev, templates: false }))
  }, [])

  switch (currentStep) {
    case 1:
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`space-y-4 sm:space-y-6 ${clsx(
            errors.templates && "border-2 border-red-500 rounded-lg"
          )}`}
        >
          <p
            className={`text-sm ${
              errors?.templates ? "text-red-500" : "text-gray-600"
            }  mt-3 mb-0 px-4`}
          >
            {errors?.templates
              ? errors.templates
              : "Select up to 3 templates for the types of blogs you want to generate."}
          </p>
          <TemplateSelection
            numberOfSelection={3}
            userSubscriptionPlan={userPlan ?? "free"}
            preSelectedIds={newJob?.blogs?.templates ?? []}
            onClick={handleTemplateSelection}
          />
        </motion.div>
      )
    case 2:
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Name</label>
              <input
                type="text"
                value={newJob.name}
                placeholder="Enter job name"
                onChange={e => {
                  setNewJob({ ...newJob, name: e.target.value })
                  setErrors(prev => ({ ...prev, name: false }))
                }}
                className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "input-error" : ""
                }`}
                aria-label="Job name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex gap-2 items-center">
                Topics
                <div
                  className="tooltip"
                  data-tip="Upload a .csv file in the format: `Topics` as header"
                >
                  <Info size={16} className="text-blue-500 cursor-pointer" />
                </div>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.topicInput || ""}
                  onKeyDown={e =>
                    e.key === "Enter" && handleAddItems(formData.topicInput, "topics")
                  }
                  onChange={e => setFormData(prev => ({ ...prev, topicInput: e.target.value }))}
                  className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.topics ? "input-error" : ""
                  }`}
                  placeholder="Add a topic..."
                  aria-label="Add topic"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddItems(formData.topicInput, "topics")}
                  className="px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg btn border-none min-h-auto h-auto"
                  aria-label="Add topic"
                >
                  <Plus />
                </motion.button>
                <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 h-auto btn min-h-auto border-gray-200">
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
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
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
                        className="ml-1.5 shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
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
                    className="text-xs font-semibold text-blue-600 self-center cursor-pointer flex items-center gap-1"
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
              <span className="text-sm font-semibold text-gray-700">
                Perform Keyword Research?
                <p className="text-xs text-gray-500">
                  Allow AI to find relevant keywords for the topics.
                </p>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <Switch
                  checked={formData.performKeywordResearch}
                  onCheckedChange={checked =>
                    handleCheckboxChange({ target: { name: "performKeywordResearch", checked } })
                  }
                />
              </label>
            </div>
            {!formData.performKeywordResearch && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex gap-2 items-center">
                  Keywords
                  <div
                    className="tooltip"
                    data-tip="Upload a .csv file in the format: `Keywords` as header"
                  >
                    <Info size={16} className="text-blue-500 cursor-pointer" />
                  </div>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.keywordInput}
                    onChange={e => setFormData(prev => ({ ...prev, keywordInput: e.target.value }))}
                    onKeyDown={e =>
                      e.key === "Enter" && handleAddItems(formData.keywordInput, "keywords")
                    }
                    className={`flex-1 px-3 py-2 border rounded-md text-sm input input-bordered focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.keywords ? "input-error" : "border-gray-300"
                    }`}
                    placeholder="e.g., digital marketing trends, AI in business"
                  />
                  <button
                    onClick={() => handleAddItems(formData.keywordInput, "keywords")}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90 btn border-none min-h-auto h-auto"
                  >
                    <Plus />
                  </button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 btn min-h-auto h-auto border-gray-200">
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
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
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
                          className="ml-1.5 shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                  {(formData.keywords.length > 18 || recentlyUploadedKeywordsCount) && (
                    <span
                      onClick={() => setShowAllKeywords(prev => !prev)}
                      className="text-xs font-semibold text-blue-600 self-center cursor-pointer flex items-center gap-1"
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
                <label htmlFor="tone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Tone of Voice <span className="text-red-500">*</span>
                </label>
                <select
                  className={`select select-bordered w-full h-10 min-h-0 text-sm ${errors.tone ? "select-error" : ""}`}
                  value={newJob.blogs.tone}
                  onChange={e => {
                    setNewJob({ ...newJob, blogs: { ...newJob.blogs, tone: e.target.value } })
                    setErrors(prev => ({ ...prev, tone: false }))
                  }}
                >
                  <option value="" disabled>
                    Select Tone
                  </option>
                  <option value="Professional">Professional</option>
                  <option value="Casual">Casual</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Formal">Formal</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Witty">Witty</option>
                  <option value="Informative">Informative</option>
                  <option value="Inspirational">Inspirational</option>
                  <option value="Persuasive">Persuasive</option>
                  <option value="Empathetic">Empathetic</option>
                </select>
                {errors.tone && <p className="text-red-500 text-xs mt-1">{errors.tone}</p>}
              </div>
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Language <span className="text-red-500">*</span>
                </label>
                <select
                  className="select select-bordered w-full h-10 min-h-0 text-sm"
                  value={newJob.blogs.languageToWrite}
                  onChange={e => {
                    setNewJob({
                      ...newJob,
                      blogs: { ...newJob.blogs, languageToWrite: e.target.value },
                    })
                  }}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Dutch">Dutch</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Approx. Blog Length (Words)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    value={newJob.blogs.userDefinedLength}
                    className="range range-xs range-primary w-full"
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
      const percentage = (newJob.blogs.numberOfImages / MAX_IMAGES) * 100
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-gray-700">Add Image</label>
            <div className="flex items-center">
              <Switch
                checked={newJob.blogs.isCheckedGeneratedImages}
                onCheckedChange={checked => {
                  setNewJob(prev => ({
                    ...prev,
                    blogs: {
                      ...prev.blogs,
                      isCheckedGeneratedImages: checked,
                      imageSource: checked ? prev.blogs.imageSource : "stock",
                    },
                  }))
                }}
              />
            </div>
          </div>
          {newJob.blogs.isCheckedGeneratedImages && (
            <div className="mt-4">
              <ImageSourceSelector
                value={newJob.blogs.imageSource}
                onChange={handleImageSourceChange}
                userPlan={userPlan}
                isAiLimitReached={isAiImagesLimitReached}
                navigate={navigate}
                error={errors.imageSource}
                showUpload={false}
              />
            </div>
          )}

          {newJob.blogs.isCheckedGeneratedImages && (
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Number of Images
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Use the slider to select the number of images (0 = AI will decide)
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="numberOfImages"
                  min="0"
                  max={MAX_IMAGES}
                  value={newJob.blogs.numberOfImages || 0}
                  onChange={handleInputChange}
                  style={{
                    background: `linear-gradient(to right, #1B6FC9 ${percentage}%, #e5e7eb ${percentage}%)`,
                  }}
                  className="w-full h-1.5 rounded-lg appearance-none"
                />
                <span className="text-sm font-bold text-gray-700 w-8">
                  {newJob.blogs.numberOfImages || 0}
                </span>
              </div>
              {errors.numberOfImages && (
                <p className="text-red-500 text-xs mt-1">{errors.numberOfImages}</p>
              )}
            </div>
          )}

          <AiModelSelector
            value={formData.aiModel}
            onChange={modelId => setFormData(prev => ({ ...prev, aiModel: modelId }))}
            userPlan={userPlan}
            navigate={navigate}
            error={errors.aiModel}
          />

          {/* Cost Cutter Toggle */}
          <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-green-900 mb-1">💰 Cost Cutter</h3>
                <p className="text-xs text-green-700">Use AI Flash model for 25% savings</p>
              </div>
              <label htmlFor="cost-cutter-toggle" className="relative inline-block w-12 h-6">
                <Switch
                  id="cost-cutter-toggle"
                  checked={newJob.blogs.costCutter || false}
                  onCheckedChange={checked => {
                    setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, costCutter: checked } }))
                  }}
                  className="data-[state=checked]:bg-green-500"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Schedule Type
              </label>
              <select
                value={newJob.schedule.type}
                onChange={e => {
                  const value = e.target.value
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
                className="select select-bordered w-full h-10 min-h-0 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {newJob.schedule.type === "weekly" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Dates
                </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numberOfBlogs ? "input-error" : ""
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
          <div className="mt-0 space-y-4">
            {/* Group 1: Standard Options */}
            <div className="space-y-1">
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
              ].map(({ label, name, desc }) => (
                <div key={name} className="flex items-center justify-between py-2 mt-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <Switch
                    checked={newJob.options[name]}
                    onCheckedChange={checked => handleCheckboxChange({ target: { name, checked } })}
                  />
                </div>
              ))}
            </div>

            {/* Group 2: Automatic Posting & Integration grouping */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Enable Automatic Posting
                  </span>
                  <p className="text-xs text-gray-500">
                    Automatically post the blog to your connected plugins.
                  </p>
                </div>
                <Switch
                  checked={newJob.options.wordpressPosting}
                  onCheckedChange={checked =>
                    handleCheckboxChange({ target: { name: "wordpressPosting", checked } })
                  }
                />
              </div>

              {newJob.options.wordpressPosting &&
                Object.keys(integrations?.integrations || {}).length > 0 && (
                  <div
                    className={`pt-2 ${
                      errors.postingType ? "border border-red-500 rounded-lg p-3 bg-red-50/50" : ""
                    }`}
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      Select Your Publishing Platform
                    </label>
                    <p className="text-xs text-gray-500 font-normal mt-1">
                      Post your blog automatically to connected platforms only.
                    </p>

                    <select
                      className={`select select-bordered w-full h-10 min-h-0 text-sm mt-3 ${
                        errors.postingType ? "select-error" : ""
                      }`}
                      value={formData.postingType || ""}
                      onChange={e => handleIntegrationChange(e.target.value)}
                    >
                      <option value="" disabled>
                        Select platform
                      </option>
                      {Object.keys(integrations.integrations || {}).map(platform => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                    {errors.postingType && (
                      <p className="text-red-500 text-xs mt-1">{errors.postingType}</p>
                    )}
                  </div>
                )}
            </div>

            {/* Group 3: Post-Posting / Layout Options */}
            <div className="space-y-1">
              {[
                ...(newJob.options.wordpressPosting
                  ? [
                      {
                        label: "Table of Content",
                        name: "includeTableOfContents",
                        desc: "Display a table of contents for easier navigation.",
                      },
                    ]
                  : []),
                {
                  label: "Easy to Understand",
                  name: "easyToUnderstand",
                  desc: "Make the content simple and easy to read.",
                },
                {
                  label: "Embed YouTube Videos",
                  name: "embedYouTubeVideos",
                  desc: "Add relevant YouTube videos to your blog content.",
                },
              ].map(({ label, name, desc }) => (
                <div key={name} className="flex items-center justify-between py-2 mt-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <Switch
                    checked={newJob.options[name]}
                    onCheckedChange={checked => handleCheckboxChange({ target: { name, checked } })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="my-5">
            <BrandVoiceSelector
              label="Write with Brand Voice"
              labelClass="text-sm font-semibold text-gray-700"
              errorText={errors.brandId}
              size="large"
              value={{
                isCheckedBrand: newJob.blogs.useBrandVoice,
                brandId: newJob.blogs.brandId,
                addCTA: newJob.blogs.addCTA,
              }}
              onChange={val => {
                setNewJob(prev => ({
                  ...prev,
                  blogs: {
                    ...prev.blogs,
                    useBrandVoice: val.isCheckedBrand,
                    brandId: val.brandId,
                    addCTA: val.addCTA,
                  },
                }))
                val.brandId && setErrors(prev => ({ ...prev, brandId: false }))
              }}
            />
          </div>
        </div>
      )
    default:
      return null
  }
}

export default StepContent
