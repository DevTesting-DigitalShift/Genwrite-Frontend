import { useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import MultiDatePicker from "react-multi-date-picker"
import { Plus, Upload, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchIntegrations } from "@api/otherApi"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { brandsQuery } from "@api/Brand/Brand.query"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { toast } from "sonner"
import { Switch } from "@components/ui/switch"
import FieldLabel from "@components/ui/FieldLabel"
import { Slider } from "@components/ui/slider"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import AdvancedOptions from "@components/AdvancedOptions"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

interface StepContentProps {
  currentStep: number
  /** The whole job form value, as react-hook-form currently holds it. */
  newJob: any
  /** Writes one field by its dotted path, e.g. `setField("blogs.tone", "Casual")`. */
  setField: (path: any, value: any) => void
  /** Reads the live form values — needed inside async callbacks, where `newJob` is stale. */
  getValues: () => any
  clearErrors: (name?: any) => void
  errors: Record<string, any>
  recentlyUploadedTopicsCount: number
  setRecentlyUploadedTopicsCount: (count: number) => void
  recentlyUploadedKeywordsCount: number
  setRecentlyUploadedKeywordsCount: (count: number) => void
  showAllTopics: boolean
  setShowAllTopics: (show: boolean) => void
  showAllKeywords: boolean
  setShowAllKeywords: (show: boolean) => void
  user: any
  userPlan?: string
}

const StepContent = ({
  currentStep,
  newJob,
  setField,
  getValues,
  clearErrors,
  errors,
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
}: StepContentProps) => {
  const _navigate = useNavigate()
  const _fileInputRef = useRef<any>(null)
  const _isProUser = user?.subscription?.plan === "pro"

  const { data: integrations } = useQuery({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
    staleTime: 5 * 60 * 1000,
  })

  // Prefetches/warms the shared brands query cache so BrandVoiceSelector below
  // doesn't show a loading flicker when it mounts.
  brandsQuery.useList()

  useEffect(() => {
    if (integrations?.integrations && Object.keys(integrations.integrations).length > 0) {
      if (!newJob.blogs.postingType) {
        setField("blogs.postingType", Object.keys(integrations.integrations)[0])
      }
    }
  }, [integrations, newJob.blogs.postingType, setField])

  const _wordLengths = [500, 1000, 1500, 2000, 3000]
  const MAX_BLOGS = BLOG_CONFIG.BULK.MAX_BLOGS
  const MAX_IMAGES = BLOG_CONFIG.IMAGES.MAX_COUNT
  const _isAiImagesLimitReached = (user?.usage?.aiImages || 0) >= (user?.usageLimits?.aiImages || 0)

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      newJob?.blogs?.blogImages?.forEach((image: any) => {
        if (image instanceof File) {
          URL.revokeObjectURL(URL.createObjectURL(image))
        }
      })
    }
  }, [newJob.blogs.blogImages])

  const handleIntegrationChange = (platform: any) => {
    setField("blogs.postingType", platform)
    clearErrors("blogs.postingType") // Clear error on change
  }

  const handleAddItems = (input: any, type: any) => {
    const items = Array.isArray(input)
      ? input
      : typeof input === "string"
        ? input
            .split(/[,\t\n\r]+/)
            .map((item) => item.trim())
            .filter((item) => item !== "")
        : []

    if (items.length === 0) return

    const existing =
      type === "topics"
        ? (newJob.blogs?.topics || []).map((t: any) => t.toLowerCase().trim())
        : (newJob.blogs.keywords || []).map((k: any) => k.toLowerCase().trim())

    const seen = new Set()
    const newItems = items
      .map((item) => item.trim())
      .filter((item) => {
        const lower = item.toLowerCase()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

    if (newItems.length === 0) return

    if (type === "topics") {
      setField("topicInput", "")
      setField("blogs.topics", [...newJob.blogs.topics, ...newItems])
      clearErrors("blogs.topics")
    } else {
      setField("keywordInput", "")
      setField("blogs.keywords", [...newJob.blogs.keywords, ...newItems])
      clearErrors("blogs.keywords")
    }
  }

  const _handleInputChange = (e: any) => {
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
    setField(`blogs.${name}`, val)
  }

  const handleCSVUpload = (e: any, type: any) => {
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
    reader.onload = (event) => {
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
      const _headerKey = type.charAt(0).toUpperCase() + type.slice(1) // "Topics" or "Keywords"
      if (lines[0].toLowerCase().includes(type)) {
        lines = lines.slice(1)
      }

      // Extract items from the CSV (taking the first non-empty column)
      const items = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.map((part) => part.trim()).find((part) => part) || null
        })
        .filter((item) => item && item.trim().length > 0)

      if (items.length === 0) {
        toast.warning(`No valid ${type} found in the CSV file.`)
        return
      }

      // Compare with existing items (case-insensitive)
      const existing =
        type === "topics"
          ? (getValues("blogs.topics") || []).map((t: any) => t.toLowerCase().trim())
          : (getValues("blogs.keywords") || []).map((k: any) => k.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter((item) => {
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
        setField("blogs.topics", [...getValues("blogs.topics"), ...uniqueNewItems])
        clearErrors("blogs.topics")
      } else {
        setField("blogs.keywords", [...getValues("blogs.keywords"), ...uniqueNewItems])
        clearErrors("blogs.keywords")
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

  const handleCheckboxChange = (e: any) => {
    const { name, checked } = e.target
    if (name === "wordpressPosting" && checked) {
      const hasAnyIntegration = Object.keys(integrations?.integrations || {}).length > 0

      if (!hasAnyIntegration) {
        toast.error("Please connect your account in plugins.")
        return
      }
    }
    setField(`options.${name}`, checked)
    if (name === "wordpressPosting") {
      setField(
        "blogs.postingType",
        checked
          ? newJob.blogs.postingType || Object.keys(integrations?.integrations || {})[0]
          : null
      )
    }
    if (name === "performKeywordResearch") {
      setField("options.performKeywordResearch", checked)
      clearErrors("blogs.keywords") // Clear keyword error if enabling research
    }
  }

  const handleNumberOfBlogsChange = (e: any) => {
    const { value } = e.target

    let numberValue
    if (value === "") {
      numberValue = "" // allow clearing
    } else {
      numberValue = parseInt(value, 10)
      if (Number.isNaN(numberValue)) numberValue = "" // ignore invalid input
      if (numberValue > MAX_BLOGS) numberValue = MAX_BLOGS // clamp to max
      if (numberValue < 0) numberValue = 0 // optional: clamp to min
    }

    setField("blogs.numberOfBlogs", numberValue)

    clearErrors("blogs.numberOfBlogs")
  }

  const keywordsToShow = showAllKeywords
    ? (newJob.blogs.keywords || []).slice().reverse()
    : (newJob.blogs.keywords || []).slice().reverse().slice(0, 18)

  const topicsToShow = showAllTopics
    ? (newJob.blogs?.topics || []).slice().reverse()
    : (newJob.blogs?.topics || []).slice().reverse().slice(0, 18)

  const handleImageSourceChange = (source: any) => {
    setField("blogs.imageSource", source)
    clearErrors("blogs.imageSource") // Clear error
  }

  const handleTemplateSelection = useCallback((temps: any) => {
    setField("blogs.templates", temps.map((t: any) => t.name))
    setField("templateIds", temps.map((t: any) => t.id))
    clearErrors("blogs.templates")
  }, [setField, clearErrors])

  switch (currentStep) {
    case 1:
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 sm:space-y-6"
        >
          <p className="text-sm text-gray-600">
            Select up to 7 templates for the types of blogs you want to generate. (
            {newJob.blogs.templates.length}/7 selected)
          </p>
          <TemplateSelection
            numberOfSelection={7}
            userSubscriptionPlan={userPlan ?? "free"}
            preSelectedIds={newJob?.blogs?.templates ?? []}
            onClick={handleTemplateSelection}
            error={errors.blogs?.templates?.message}
          />
        </motion.div>
      )
    case 2:
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="job-name" className="block text-sm font-semibold  mb-2">
                Job Name
              </label>
              <input
                id="job-name"
                type="text"
                value={newJob.name}
                placeholder="Enter job name"
                onChange={(e) => {
                  setField("name", e.target.value)
                  clearErrors("name")
                }}
                className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6] ${
                  errors.name?.message ? "input-error" : ""
                }`}
                aria-label="Job name"
              />
              {errors.name?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.name?.message}</p>
              )}
            </div>
            <div>
              <FieldLabel tip="The main subject/topic for each blog in this job. Add one per blog you want to generate. Supports bulk CSV upload.">
                Topics
              </FieldLabel>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newJob.topicInput || ""}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddItems(newJob.topicInput, "topics")
                  }
                  onChange={(e) => setField("topicInput", e.target.value)}
                  onPaste={(e) => {
                    extractKeywordsFromClipboard(e, { type: "topics", cb: handleAddItems })
                  }}
                  className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6] ${
                    errors.blogs?.topics?.message ? "input-error" : ""
                  }`}
                  placeholder="Enter topics (comma, tab, or newline separated)"
                  aria-label="Add topic"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddItems(newJob.topicInput, "topics")}
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
                    onChange={(e) => handleCSVUpload(e, "topics")}
                    hidden
                  />
                  <span className="sr-only">Upload CSV for topics</span>
                </label>
              </div>
              {errors.blogs?.topics?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.blogs?.topics?.message}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {topicsToShow.map((topic: any, reversedIndex: any) => {
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
                          setField("blogs.topics", (newJob.blogs?.topics || []).filter(
                                (_: any, i: any) => i !== actualIndex
                              ))
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
                  <button
                    type="button"
                    onClick={() => setShowAllTopics((prev: any) => !prev)}
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
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel tip="Allow AI to automatically discover high-traffic SEO keywords for your topics. Disable to enter your own keywords.">
                Perform Keyword Research?
              </FieldLabel>
              <span className="relative inline-flex items-center cursor-pointer">
                <Switch
                  checked={newJob.options.performKeywordResearch}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange({ target: { name: "performKeywordResearch", checked } })
                  }
                />
              </span>
            </div>
            {!newJob.options.performKeywordResearch && (
              <div>
                <FieldLabel tip="Secondary keywords to weave throughout all blog articles in this job. Supports CSV upload for bulk entry.">
                  Keywords
                </FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newJob.keywordInput}
                    onChange={(e) =>
                      setField("keywordInput", e.target.value)
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddItems(newJob.keywordInput, "keywords")
                    }
                    onPaste={(e) => {
                      extractKeywordsFromClipboard(e, { type: "keywords", cb: handleAddItems })
                    }}
                    className={`flex-1 px-3 py-2 border rounded-md text-sm input input-bordered focus:outline-none focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6] ${
                      errors.blogs?.keywords?.message ? "input-error" : "border-gray-300"
                    }`}
                    placeholder="Enter keywords (comma, tab, or newline separated)"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItems(newJob.keywordInput, "keywords")}
                    className="px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] btn border-none min-h-auto h-auto transition-all"
                  >
                    <Plus />
                  </button>
                  <label className="px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 btn min-h-auto h-auto border-gray-200">
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
                {errors.blogs?.keywords?.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.blogs?.keywords?.message}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {keywordsToShow.map((keyword: any, reversedIndex: any) => {
                    const actualIndex = (newJob.blogs.keywords?.length || 0) - 1 - reversedIndex
                    return (
                      <span
                        key={`${keyword}-${actualIndex}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedKeywords = [...(newJob.blogs.keywords || [])]
                            updatedKeywords.splice(actualIndex, 1)
                            setField("blogs.keywords", updatedKeywords)
                          }}
                          className="ml-1.5 shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                  {((newJob.blogs.keywords?.length || 0) > 18 || recentlyUploadedKeywordsCount) && (
                    <button
                      type="button"
                      onClick={() => setShowAllKeywords((prev: any) => !prev)}
                      className="text-xs font-semibold text-blue-600 self-center cursor-pointer flex items-center gap-1"
                    >
                      {showAllKeywords ? (
                        <>Show less</>
                      ) : (
                        <>
                          {(newJob.blogs.keywords?.length || 0) > 18 &&
                            `+${(newJob.blogs.keywords?.length || 0) - 18} more`}
                          {recentlyUploadedKeywordsCount &&
                            ` (+${recentlyUploadedKeywordsCount} uploaded)`}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
            <div>
              <span className="text-sm font-semibold  mb-2 flex gap-2 items-center">
                References (URLs, max 3)
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newJob.referenceInput || ""}
                  onChange={(e) =>
                    setField("referenceInput", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = newJob.referenceInput?.trim()
                      if (!val) return
                      if ((newJob.blogs?.references?.length || 0) >= 3) {
                        toast.error("Maximum 3 references allowed.")
                        return
                      }
                      if (!val.startsWith("http")) {
                        toast.error("Please enter a valid URL.")
                        return
                      }
                      if ((newJob.blogs?.references || []).includes(val)) {
                        toast.error("This reference link is already added.")
                        return
                      }
                      setField("blogs.references", [...(newJob.blogs?.references || []), val])
                      setField("referenceInput", "")
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded-md text-sm border-gray-300 focus:outline-none focus:ring-[#4C5BD6]/20 focus:border-[#4C5BD6]"
                  placeholder="https://example.com/blog-post"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newJob.referenceInput?.trim()
                    if (!val) return
                    if ((newJob.blogs?.references?.length || 0) >= 3) {
                      toast.error("Maximum 3 references allowed.")
                      return
                    }
                    if (!val.startsWith("http")) {
                      toast.error("Please enter a valid URL.")
                      return
                    }
                    if ((newJob.blogs?.references || []).includes(val)) {
                      toast.error("This reference link is already added.")
                      return
                    }
                    setField("blogs.references", [...(newJob.blogs?.references || []), val])
                    setField("referenceInput", "")
                  }}
                  className="px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] btn border-none min-h-auto h-auto transition-all"
                >
                  <Plus />
                </button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {newJob.blogs?.references?.map((ref: any, idx: any) => (
                  <div
                    key={ref}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded text-xs text-blue-600 truncate"
                  >
                    <span className="truncate flex-1">{ref}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setField("blogs.references", (newJob.blogs?.references || []).filter((_: any, i: any) => i !== idx))
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
                  id="tone"
                  className={`select select-bordered w-full h-10 min-h-0 text-sm ${
                    errors.blogs?.tone?.message ? "select-error" : ""
                  }`}
                  value={newJob.blogs.tone}
                  onChange={(e) => {
                    setField("blogs.tone", e.target.value)
                    clearErrors("blogs.tone")
                  }}
                >
                  {TONES.map((t) => (
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
                  id="language"
                  className="select select-bordered w-full h-10 min-h-0 text-sm"
                  value={newJob.blogs.languageToWrite}
                  onChange={(e) => {
                    setField("blogs.languageToWrite", e.target.value)
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
                <span className="block text-sm font-semibold  mb-2">
                  Approx. Blog Length (Words)
                </span>
                <div className="relative">
                  <Slider
                    min={BLOG_CONFIG.LENGTH.MIN}
                    max={BLOG_CONFIG.LENGTH.MAX}
                    step={BLOG_CONFIG.LENGTH.STEP}
                    value={[newJob.blogs.userDefinedLength]}
                    onValueChange={(vals) =>
                      setField("blogs.userDefinedLength", vals[0])
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
    case 3: {
      const _percentage = (newJob.blogs.numberOfImages / MAX_IMAGES) * 100
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="block text-sm font-semibold ">Add Image</span>
            <div className="flex items-center">
              <Switch
                checked={newJob.blogs.isCheckedGeneratedImages}
                onCheckedChange={(checked) => {
                  setField("blogs.isCheckedGeneratedImages", checked)
                  setField("blogs.imageSource", checked
                        ? newJob.blogs.imageSource === "none"
                          ? "stock"
                          : newJob.blogs.imageSource
                        : "none")
                }}
              />
            </div>
          </div>
          {newJob.blogs.isCheckedGeneratedImages && (
            <div className="mt-4">
              <ImageSourceSelector
                value={newJob.blogs.imageSource}
                onChange={handleImageSourceChange}
                error={errors.blogs?.imageSource?.message}
                showUpload={false}
                numberOfImages={newJob.blogs.numberOfImages}
                onNumberChange={(val) =>
                  setField("blogs.numberOfImages", val)
                }
              />
              {errors.blogs?.numberOfImages?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.blogs?.numberOfImages?.message}</p>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="schedule-type" className="block text-sm font-semibold  mb-2">
                Schedule Type
              </label>
              <select
                id="schedule-type"
                value={newJob.schedule.type}
                onChange={(e) => {
                  const value = e.target.value
                  setField("schedule.type", value)
                  if (value === "weekly") setField("schedule.daysOfWeek", [])
                  if (value === "monthdays") setField("schedule.daysOfMonth", [])
                  if (value === "custom") setField("schedule.customDates", [])
                  clearErrors(["schedule.daysOfWeek", "schedule.daysOfMonth", "schedule.customDates"])
                }}
                className="select select-bordered w-full h-10 min-h-0 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthdays">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {newJob.schedule.type === "weekly" && (
              <div>
                <span className="block text-sm font-semibold  mb-2">Select Days of Week</span>
                <div
                  className={`flex gap-2 flex-wrap ${
                    errors.schedule?.daysOfWeek?.message ? "border-red-500 border-2 p-2 rounded" : ""
                  }`}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      className={`px-2 py-1 rounded-md transition-all ${
                        newJob.schedule.daysOfWeek?.includes(i)
                          ? "bg-[#4C5BD6] text-white"
                          : "bg-gray-200 "
                      }`}
                      onClick={() => {
                        setField(
                          "schedule.daysOfWeek",
                          newJob.schedule.daysOfWeek?.includes(i)
                            ? newJob.schedule.daysOfWeek.filter((day: any) => day !== i)
                            : [...(newJob.schedule.daysOfWeek || []), i]
                        )
                        clearErrors("schedule.daysOfWeek")
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {errors.schedule?.daysOfWeek?.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.schedule?.daysOfWeek?.message}</p>
                )}
              </div>
            )}
            {newJob.schedule.type === "monthdays" && (
              <div>
                <span className="block text-sm font-semibold  mb-2">Select Dates of Month</span>
                <div
                  className={`flex gap-2 flex-wrap ${
                    errors.schedule?.daysOfMonth?.message ? "border-red-500 border-2 p-2 rounded" : ""
                  }`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                    <button
                      key={date}
                      type="button"
                      className={`px-2 py-1 rounded-md transition-all ${
                        newJob.schedule.daysOfMonth?.includes(date)
                          ? "bg-[#4C5BD6] text-white"
                          : "bg-gray-200 "
                      }`}
                      onClick={() => {
                        setField(
                          "schedule.daysOfMonth",
                          newJob.schedule.daysOfMonth?.includes(date)
                            ? newJob.schedule.daysOfMonth.filter((d: any) => d !== date)
                            : [...(newJob.schedule.daysOfMonth || []), date]
                        )
                        clearErrors("schedule.daysOfMonth")
                      }}
                    >
                      {date}
                    </button>
                  ))}
                </div>
                {errors.schedule?.daysOfMonth?.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.schedule?.daysOfMonth?.message}</p>
                )}
              </div>
            )}
            {newJob.schedule.type === "custom" && (
              <div>
                <span className="block text-sm font-semibold  mb-2">Select Dates</span>
                <div
                  className={
                    errors.schedule?.customDates?.message ? "border-2 border-red-500 rounded-lg" : ""
                  }
                >
                  <MultiDatePicker
                    value={newJob.schedule.customDates}
                    onChange={(dates) => {
                      setField("schedule.customDates", dates)
                      setField("schedule.daysOfWeek", [])
                      setField("schedule.daysOfMonth", [])
                      clearErrors("schedule.customDates")
                    }}
                    multiple
                    format="YYYY-MM-DD"
                    className="w-full"
                    inputClass="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {errors.schedule?.customDates?.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.schedule?.customDates?.message}</p>
                )}
              </div>
            )}
            <div>
              <label htmlFor="number-of-blogs" className="block text-sm font-semibold  mb-2">
                Number of Blogs
              </label>
              <input
                id="number-of-blogs"
                type="tel"
                inputMode="numeric"
                name="numberOfBlogs"
                min="1"
                max={MAX_BLOGS}
                value={newJob.blogs.numberOfBlogs ?? ""}
                onChange={handleNumberOfBlogsChange}
                onWheel={(e) => e.currentTarget.blur()}
                className={`input input-bordered w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.blogs?.numberOfBlogs?.message ? "input-error" : ""
                }`}
                placeholder="Enter the number of blogs"
              />
              {errors.blogs?.numberOfBlogs?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.blogs?.numberOfBlogs?.message}</p>
              )}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 mt-5">
            <div className="flex items-center justify-between">
              <FieldLabel tip="Enable this to customize AI model selection and extra advanced options in the next step.">
                Advanced Options
              </FieldLabel>
              <Switch
                checked={newJob.blogs.enableAdvanced}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setField("blogs.enableAdvanced", true)
                    return
                  }
                  // Turning advanced mode off resets every advanced-section field
                  // back to its default so stale values don't linger hidden.
                  setField("blogs.enableAdvanced", false)
                  setField("blogs.useBrandVoice", false)
                  setField("blogs.brandId", null)
                  setField("blogs.addCTA", true)
                  setField("blogs.createBrandedImages", false)
                  setField("blogs.postingType", null)
                  setField("options.wordpressPosting", false)
                  setField("options.includeFaqs", false)
                  setField("options.includeCompetitorResearch", false)
                  setField("options.includeInterlinks", false)
                  setField("options.addOutBoundLinks", false)
                  setField("options.easyToUnderstand", false)
                  setField("options.embedYouTubeVideos", false)
                  setField("options.extendedThinking", false)
                  setField("options.deepResearch", false)
                  setField("options.humanisation", false)
                  setField("options.includeTableOfContents", false)
                  setField("blogs.aiModel", "gemini")
                  setField("blogs.postingType", null)
                }}
              />
            </div>
            {newJob.blogs.enableAdvanced && (
              <div className="mt-2 border-t border-dashed border-slate-100 pt-4">
                <AiModelSelector
                  value={newJob.blogs.aiModel}
                  onChange={(modelId) => setField("blogs.aiModel", modelId)}
                  showCostCutter={true}
                  costCutterValue={newJob.blogs.costCutter || false}
                  onCostCutterChange={(checked) => {
                    setField("blogs.costCutter", checked)
                  }}
                  error={errors.blogs?.aiModel?.message}
                />
              </div>
            )}
          </div>
        </motion.div>
      )
    }
    case 4:
      return (
        <div>
          <div className="mt-0 space-y-4">
            {/* Advanced Tool Settings */}
            <AdvancedOptions
              formData={newJob}
              updateFormData={(updates) => {
                const flat = updates.options
                  ? Object.entries(updates.options).map(([key, value]) => ["options." + key, value])
                  : Object.entries(updates)
                for (const [name, value] of flat) setField(name, value)
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

            {/* Group 3: Brand Voice Selector */}
            <BrandVoiceSelector
              label="Write with Brand Voice"
              labelClass="text-sm font-semibold"
              value={{
                isCheckedBrand: newJob.blogs.useBrandVoice,
                brandId: newJob.blogs.brandId,
                addCTA: newJob.blogs.addCTA,
                createBrandedImages: newJob.blogs.createBrandedImages,
              }}
              imageSource={newJob.blogs.imageSource}
              onChange={(val) => {
                setField("blogs.useBrandVoice", val.isCheckedBrand)
                setField("blogs.brandId", val.brandId)
                setField("blogs.addCTA", val.addCTA)
                setField("blogs.createBrandedImages", val.createBrandedImages)
              }}
            />

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
                  onCheckedChange={(checked) =>
                    handleCheckboxChange({ target: { name: "wordpressPosting", checked } })
                  }
                />
              </div>

              {newJob.options.wordpressPosting && (
                <div
                  className={`pt-2 ${
                    errors.blogs?.postingType?.message
                      ? "border border-red-500 rounded-lg p-3 bg-red-50/50"
                      : ""
                  }`}
                >
                  <span className="block text-sm font-semibold ">
                    Select Your Publishing Platform
                  </span>
                  <p className="text-xs text-gray-500 font-normal mt-1">
                    Post your blog automatically to connected platforms.
                  </p>

                  <select
                    className={`select select-bordered w-full h-10 min-h-0 text-sm mt-3 ${
                      errors.blogs?.postingType?.message ? "select-error" : ""
                    }`}
                    value={newJob.blogs.postingType || ""}
                    onChange={(e) => handleIntegrationChange(e.target.value)}
                  >
                    <option value="" disabled>
                      Select platform
                    </option>
                    {integrations?.integrations &&
                      Object.keys(integrations.integrations).map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                  </select>
                  {errors.blogs?.postingType?.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.blogs?.postingType?.message}</p>
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
                    onCheckedChange={(checked) =>
                      setField("options.includeTableOfContents", checked)
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
