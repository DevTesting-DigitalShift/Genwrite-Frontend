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
import { brandsQuery } from "@api/Brand/Brand.query"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { toast } from "sonner"
import { Switch } from "@components/ui/switch"
import { Slider } from "@components/ui/slider"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { IMAGE_SOURCE, TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import AdvancedOptions from "@components/AdvancedOptions"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

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

  const { data: brands = [] } = brandsQuery.useList()

  useEffect(() => {
    if (integrations?.integrations && Object.keys(integrations.integrations).length > 0) {
      if (!formData.postingType) {
        setFormData(prev => ({ ...prev, postingType: Object.keys(integrations.integrations)[0] }))
      }
    }
  }, [integrations])

  const wordLengths = [500, 1000, 1500, 2000, 3000]
  const MAX_BLOGS = BLOG_CONFIG.BULK.MAX_BLOGS
  const MAX_IMAGES = BLOG_CONFIG.IMAGES.MAX_COUNT
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
    const items = Array.isArray(input)
      ? input
      : typeof input === "string"
        ? input
            .split(/[,\t\n\r]+/)
            .map(item => item.trim())
            .filter(item => item !== "")
        : []

    if (items.length === 0) return

    const existing =
      type === "topics"
        ? (newJob.blogs?.topics || []).map(t => t.toLowerCase().trim())
        : (formData?.keywords || []).map(k => k.toLowerCase().trim())

    const seen = new Set()
    const newItems = items
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
          ? (newJob.blogs?.topics || []).map(t => t.toLowerCase().trim())
          : (formData?.keywords || []).map(k => k.toLowerCase().trim())
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
    ? (formData?.keywords || []).slice().reverse()
    : (formData?.keywords || []).slice().reverse().slice(0, 18)

  const topicsToShow = showAllTopics
    ? (newJob.blogs?.topics || []).slice().reverse()
    : (newJob.blogs?.topics || []).slice().reverse().slice(0, 18)

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
          <p className={`text-sm ${errors?.templates ? "text-red-500" : "text-gray-600"} mb-4`}>
            {errors?.templates
              ? errors.templates
              : `Select up to 7 templates for the types of blogs you want to generate. (${newJob.blogs.templates.length}/7 selected)`}
          </p>
          <TemplateSelection
            numberOfSelection={7}
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
              <label className="block text-sm font-semibold  mb-2">Job Name</label>
              <input
                type="text"
                value={newJob.name}
                placeholder="Enter job name"
                onChange={e => {
                  setNewJob({ ...newJob, name: e.target.value })
                  setErrors(prev => ({ ...prev, name: false }))
                }}
                className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6] ${
                  errors.name ? "input-error" : ""
                }`}
                aria-label="Job name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold  mb-2 flex gap-2 items-center">
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
                  onPaste={e => {
                    extractKeywordsFromClipboard(e, {
                      type: "topics",
                      cb: handleAddItems,
                    })
                  }}
                  className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6] ${
                    errors.topics ? "input-error" : ""
                  }`}
                  placeholder="Enter topics (comma, tab, or newline separated)"
                  aria-label="Add topic"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddItems(formData.topicInput, "topics")}
                  className="px-6 py-2 bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white rounded-md btn border-none min-h-auto h-auto transition-all"
                  aria-label="Add topic"
                >
                  <Plus />
                </motion.button>
                <label className="px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 h-auto btn min-h-auto border-gray-200">
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
                      className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() =>
                          setNewJob(prev => ({
                            ...prev,
                            blogs: {
                              ...prev.blogs,
                              topics: (prev.blogs?.topics || []).filter(
                                (_, i) => i !== actualIndex
                              ),
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
                {(newJob.blogs?.topics?.length > 18 || recentlyUploadedTopicsCount) && (
                  <span
                    onClick={() => setShowAllTopics(prev => !prev)}
                    className="text-xs font-semibold text-blue-600 self-center cursor-pointer flex items-center gap-1"
                  >
                    {showAllTopics ? (
                      <>Show less</>
                    ) : (
                      <>
                        {(newJob.blogs?.topics?.length || 0) > 18 &&
                          `+${(newJob.blogs?.topics?.length || 0) - 18} more`}
                        {recentlyUploadedTopicsCount &&
                          ` (+${recentlyUploadedTopicsCount} uploaded)`}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold ">
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
                <label className="text-sm font-semibold  mb-2 flex gap-2 items-center">
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
                    onPaste={e => {
                      extractKeywordsFromClipboard(e, {
                        type: "keywords",
                        cb: handleAddItems,
                      })
                    }}
                    className={`flex-1 px-3 py-2 border rounded-md text-sm input input-bordered focus:outline-none focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6] ${
                      errors.keywords ? "input-error" : "border-gray-300"
                    }`}
                    placeholder="Enter keywords (comma, tab, or newline separated)"
                  />
                  <button
                    onClick={() => handleAddItems(formData.keywordInput, "keywords")}
                    className="px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] btn border-none min-h-auto h-auto transition-all"
                  >
                    <Plus />
                  </button>
                  <label className="px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 btn min-h-auto h-auto border-gray-200">
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
                    const actualIndex = (formData?.keywords?.length || 0) - 1 - reversedIndex
                    return (
                      <span
                        key={`${keyword}-${actualIndex}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedKeywords = [...(formData?.keywords || [])]
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
                  {((formData?.keywords?.length || 0) > 18 || recentlyUploadedKeywordsCount) && (
                    <span
                      onClick={() => setShowAllKeywords(prev => !prev)}
                      className="text-xs font-semibold text-blue-600 self-center cursor-pointer flex items-center gap-1"
                    >
                      {showAllKeywords ? (
                        <>Show less</>
                      ) : (
                        <>
                          {(formData?.keywords?.length || 0) > 18 &&
                            `+${(formData?.keywords?.length || 0) - 18} more`}
                          {recentlyUploadedKeywordsCount &&
                            ` (+${recentlyUploadedKeywordsCount} uploaded)`}
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-semibold  mb-2 flex gap-2 items-center">
                References (URLs, max 3)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.referenceInput || ""}
                  onChange={e => setFormData(prev => ({ ...prev, referenceInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = formData.referenceInput?.trim()
                      if (!val) return
                      if ((newJob.blogs?.references?.length || 0) >= 3) {
                        toast.error("Maximum 3 references allowed.")
                        return
                      }
                      if (!val.startsWith("http")) {
                        toast.error("Please enter a valid URL.")
                        return
                      }
                      setNewJob(prev => {
                        if ((prev.blogs?.references || []).includes(val)) {
                          toast.error("This reference link is already added.")
                          return prev
                        }
                        return {
                          ...prev,
                          blogs: {
                            ...prev.blogs,
                            references: [...(prev.blogs?.references || []), val],
                          },
                        }
                      })
                      setFormData(prev => ({ ...prev, referenceInput: "" }))
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded-md text-sm border-gray-300 focus:outline-none focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6]"
                  placeholder="https://example.com/blog-post"
                />
                <button
                  onClick={() => {
                    const val = formData.referenceInput?.trim()
                    if (!val) return
                    if ((newJob.blogs?.references?.length || 0) >= 3) {
                      toast.error("Maximum 3 references allowed.")
                      return
                    }
                    if (!val.startsWith("http")) {
                      toast.error("Please enter a valid URL.")
                      return
                    }
                    setNewJob(prev => {
                      if ((prev.blogs?.references || []).includes(val)) {
                        toast.error("This reference link is already added.")
                        return prev
                      }
                      return {
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          references: [...(prev.blogs?.references || []), val],
                        },
                      }
                    })
                    setFormData(prev => ({ ...prev, referenceInput: "" }))
                  }}
                  className="px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] btn border-none min-h-auto h-auto transition-all"
                >
                  <Plus />
                </button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {newJob.blogs?.references?.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded text-xs text-blue-600 truncate"
                  >
                    <span className="truncate flex-1">{ref}</span>
                    <button
                      onClick={() =>
                        setNewJob(prev => ({
                          ...prev,
                          blogs: {
                            ...prev.blogs,
                            references: (prev.blogs?.references || []).filter((_, i) => i !== idx),
                          },
                        }))
                      }
                      className="ml-2 text-red-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tone" className="block text-sm font-semibold  mb-2">
                  Tone of Voice
                </label>
                <select
                  className={`select select-bordered w-full h-10 min-h-0 text-sm ${errors.tone ? "select-error" : ""}`}
                  value={newJob.blogs.tone}
                  onChange={e => {
                    setNewJob({ ...newJob, blogs: { ...newJob.blogs, tone: e.target.value } })
                    setErrors(prev => ({ ...prev, tone: false }))
                  }}
                >
                  {TONES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-semibold  mb-2">
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
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold  mb-2">
                  Approx. Blog Length (Words)
                </label>
                <div className="relative">
                  <Slider
                    min={BLOG_CONFIG.LENGTH.MIN}
                    max={BLOG_CONFIG.LENGTH.MAX}
                    step={BLOG_CONFIG.LENGTH.STEP}
                    value={[newJob.blogs.userDefinedLength]}
                    onValueChange={vals =>
                      setNewJob({
                        ...newJob,
                        blogs: { ...newJob.blogs, userDefinedLength: vals[0] },
                      })
                    }
                    className="w-full"
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
            <label className="block text-sm font-semibold ">Add Image</label>
            <div className="flex items-center">
              <Switch
                checked={newJob.blogs.isCheckedGeneratedImages}
                onCheckedChange={checked => {
                  setNewJob(prev => ({
                    ...prev,
                    blogs: {
                      ...prev.blogs,
                      isCheckedGeneratedImages: checked,
                      imageSource: checked
                        ? prev.blogs.imageSource === "none"
                          ? "stock"
                          : prev.blogs.imageSource
                        : "none",
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
                error={errors.imageSource}
                showUpload={false}
                numberOfImages={newJob.blogs.numberOfImages}
                onNumberChange={val =>
                  setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, numberOfImages: val } }))
                }
              />
              {errors.numberOfImages && (
                <p className="text-red-500 text-xs mt-1">{errors.numberOfImages}</p>
              )}
            </div>
          )}

          <AiModelSelector
            value={formData.aiModel}
            onChange={modelId => setFormData(prev => ({ ...prev, aiModel: modelId }))}
            showCostCutter={true}
            costCutterValue={newJob.blogs.costCutter || false}
            onCostCutterChange={checked => {
              setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, costCutter: checked } }))
            }}
            error={errors.aiModel}
          />

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold  mb-2">Schedule Type</label>
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
                <label className="block text-sm font-semibold  mb-2">Select Days of Week</label>
                <div
                  className={`flex gap-2 flex-wrap ${
                    errors.daysOfWeek ? "border-red-500 border-2 p-2 rounded" : ""
                  }`}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`px-2 py-1 rounded-md transition-all ${
                        newJob.schedule.daysOfWeek?.includes(i)
                          ? "bg-[#4C5BD6] text-white"
                          : "bg-gray-200 "
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
                <label className="block text-sm font-semibold  mb-2">Select Dates of Month</label>
                <div
                  className={`flex gap-2 flex-wrap ${
                    errors.daysOfMonth ? "border-red-500 border-2 p-2 rounded" : ""
                  }`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                    <button
                      key={date}
                      type="button"
                      className={`px-2 py-1 rounded-md transition-all ${
                        newJob.schedule.daysOfMonth?.includes(date)
                          ? "bg-[#4C5BD6] text-white"
                          : "bg-gray-200 "
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
                <label className="block text-sm font-semibold  mb-2">Select Dates</label>
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
              <label className="block text-sm font-semibold  mb-2">Number of Blogs</label>
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
            {/* Advanced Tool Settings */}
            <AdvancedOptions
              formData={newJob}
              updateFormData={updates => {
                if (updates.options) {
                  setNewJob(prev => ({ ...prev, options: { ...prev.options, ...updates.options } }))
                } else {
                  setNewJob(prev => ({ ...prev, ...updates }))
                }
              }}
              isNestedOptions={true}
              showFields={[
                "extendedThinking",
                "deepResearch",
                "humanisation",
                "includeFaqs",
                "includeCompetitorResearch",
                "addOutBoundLinks",
                "includeInterlinks",
                "easyToUnderstand",
                "embedYouTubeVideos",
              ]}
            />

            {/* Group 3: Brand Voice Selector (Select Input Mode) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-semibold ">Write with Brand Voice</span>
                  <p className="text-xs text-gray-500 font-normal">
                    Apply your brand's unique tone and style.
                  </p>
                </div>
                <Switch
                  size="large"
                  checked={newJob.blogs.useBrandVoice}
                  onCheckedChange={checked => {
                    if (checked && brands.length === 0) {
                      toast.error("No brand voices available. Create one to enable this option.")
                      return
                    }
                    setNewJob(prev => ({
                      ...prev,
                      blogs: {
                        ...prev.blogs,
                        useBrandVoice: checked,
                        brandId: checked ? prev.blogs.brandId || (brands[0]?._id ?? null) : null,
                      },
                    }))
                  }}
                />
              </div>

              {newJob.blogs.useBrandVoice && brands.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold ">Select Brand Voice</label>
                    <select
                      className={`select select-bordered w-full h-10 min-h-0 text-sm mt-3`}
                      value={newJob.blogs.brandId || ""}
                      onChange={e => {
                        setNewJob(prev => ({
                          ...prev,
                          blogs: { ...prev.blogs, brandId: e.target.value },
                        }))
                      }}
                    >
                      {brands.map(brand => (
                        <option key={brand._id} value={brand._id}>
                          {brand.nameOfVoice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold ">Add CTA at the End</span>
                      <p className="text-xs text-gray-500">
                        Include a call-to-action to engage audience
                      </p>
                    </div>
                    <Switch
                      size="large"
                      checked={newJob.blogs.addCTA}
                      onCheckedChange={checked =>
                        setNewJob(prev => ({ ...prev, blogs: { ...prev.blogs, addCTA: checked } }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Group 4: Automatic Posting & Integration grouping (MUST BE LAST) */}
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold ">Enable Automatic Posting</span>
                  <p className="text-xs text-gray-500">
                    Automatically post the blog to your connected platforms.
                  </p>
                </div>
                <Switch
                  size="large"
                  checked={newJob.options.wordpressPosting}
                  onCheckedChange={checked =>
                    handleCheckboxChange({ target: { name: "wordpressPosting", checked } })
                  }
                />
              </div>

              {newJob.options.wordpressPosting && (
                <div
                  className={`pt-2 ${
                    errors.postingType ? "border border-red-500 rounded-lg p-3 bg-red-50/50" : ""
                  }`}
                >
                  <label className="block text-sm font-semibold ">
                    Select Your Publishing Platform
                  </label>
                  <p className="text-xs text-gray-500 font-normal mt-1">
                    Post your blog automatically to connected platforms.
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
                    {integrations?.integrations &&
                      Object.keys(integrations.integrations).map(platform => (
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

              {newJob.options.wordpressPosting && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Include Table of Content</span>
                    <p className="text-xs text-gray-500">Add a table of content to the blog post</p>
                  </div>
                  <Switch
                    size="large"
                    checked={newJob.options.includeTableOfContents}
                    onCheckedChange={checked =>
                      setNewJob(prev => ({
                        ...prev,
                        options: { ...prev.options, includeTableOfContents: checked },
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

export default StepContent
