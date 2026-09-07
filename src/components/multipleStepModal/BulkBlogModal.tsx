import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { debugPayload } from "@utils/debugPayload"
import { Upload, X } from "lucide-react"
import FieldLabel from "@components/ui/FieldLabel"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { computeCost } from "@/data/pricingConfig"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { TONES, VALID_IMAGE_CONFIG } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import AdvancedOptions from "@components/AdvancedOptions"
import { useZodForm } from "@/lib/forms"
import {
  BULK_BLOG_STEP_FIELDS,
  bulkBlogFormDefaults,
  bulkBlogFormSchema,
  bulkStepOfField,
  toBulkBlogPayload,
} from "@/forms/bulkBlogForm"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import useIntegrationStore from "@store/useIntegrationStore"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

const BulkBlogModal = ({ closeFnc }) => {
  const { user } = useAuthStore()
  const { integrations, fetchIntegrations } = useIntegrationStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()
  const queryClient = useQueryClient()
  const _userPlan = user?.subscription?.plan || user?.plan
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const _isAiImagesLimitReached = (user?.usage?.aiImages || 0) >= (user?.usageLimits?.aiImages || 0)
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [recentlyUploadedTopicsCount, setRecentlyUploadedTopicsCount] = useState(null)
  const [recentlyUploadedKeywordsCount, setRecentlyUploadedKeywordsCount] = useState(null)

  // Form state and its validation both live in `bulkBlogFormSchema`; the request body
  // is derived from it by `toBulkBlogPayload`, so UI-only state (the raw topic and
  // keyword boxes, the template ids, the drag flag) can never leak into the request.
  const {
    watch,
    setValue,
    getValues,
    getFieldState,
    trigger,
    reset,
    setError,
    clearErrors,
    handleSubmit: submitForm,
    formState: { errors },
  } = useZodForm(bulkBlogFormSchema, bulkBlogFormDefaults)

  const formData = watch()

  /**
   * Writes one field. Validation only re-runs for a field that is *already* showing
   * an error, so messages appear on Next/Submit and then clear as the user fixes
   * them — they never pop up while the form is still being filled in.
   */
  const setField = useCallback(
    (name, value) =>
      setValue(name, value, {
        shouldValidate: !!getFieldState(name).error,
        shouldDirty: true,
      }),
    [setValue, getFieldState]
  )

  /** Sets or clears one message — an empty string means "this is fine now". */
  const setFieldError = useCallback(
    (name, message) => (message ? setError(name, { message }) : clearErrors(name)),
    [setError, clearErrors]
  )

  /** Writes several fields at once — the shape `AdvancedOptions` expects. */
  const applyUpdates = useCallback(
    (updates) => {
      for (const [name, value] of Object.entries(updates)) setField(name, value)
    },
    [setField]
  )

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  useEffect(() => {
    const connected = integrations?.integrations
    if (connected && Object.keys(connected).length > 0 && !formData.postingType) {
      setValue("postingType", Object.keys(connected)[0])
    }
  }, [integrations, formData.postingType, setValue])

  // Memoized estimated cost calculation
  const estimatedCost = useMemo(() => {
    const features = []
    if (formData.isCheckedBrand) features.push("brandVoice")
    if (formData.includeCompetitorResearch) features.push("competitorResearch")
    if (formData.performKeywordResearch) features.push("keywordResearch")
    if (formData.includeInterlinks) features.push("internalLinking")
    if (formData.includeFaqs) features.push("faqGeneration")
    if (formData.addOutBoundLinks) features.push("outboundLinks")
    if (formData.humanisation) features.push("humanisation")
    if (formData.extendedThinking) features.push("extendedThinking")
    if (formData.deepResearch) features.push("deepResearch")

    const blogCost = computeCost({
      wordCount: formData.userDefinedLength,
      features,
      aiModel: formData.aiModel || "gemini",
      includeImages: formData.isCheckedGeneratedImages,
      imageSource: formData.imageSource,
      numberOfImages:
        formData.imageSource === "customImage"
          ? formData.blogImages.length
          : formData.numberOfImages,
    })

    let totalCost = formData.numberOfBlogs * blogCost
    if (formData.costCutter) {
      totalCost = Math.round(totalCost * 0.5)
    }

    return totalCost
  }, [
    formData.isCheckedBrand,
    formData.includeCompetitorResearch,
    formData.performKeywordResearch,
    formData.includeInterlinks,
    formData.includeFaqs,
    formData.addOutBoundLinks,
    formData.humanisation,
    formData.extendedThinking,
    formData.deepResearch,
    formData.userDefinedLength,
    formData.aiModel,
    formData.isCheckedGeneratedImages,
    formData.imageSource,
    formData.numberOfImages,
    formData.blogImages.length,
    formData.numberOfBlogs,
    formData.costCutter,
  ])

  const handleNext = async () => {
    if (!(await trigger(BULK_BLOG_STEP_FIELDS[currentStep] ?? []))) {
      // Only the topic count is loud enough to deserve a toast; the rest render
      // inline. `getFieldState` is read instead of `errors` because the render that
      // carries the new errors has not happened yet.
      const topicsError = getFieldState("topics").error?.message
      if (currentStep === 1 && topicsError) toast.error(topicsError)
      return
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
    clearErrors()
  }

  const handleClose = () => {
    reset(bulkBlogFormDefaults)
    setCurrentStep(0)
    closeFnc()
  }

  // react-hook-form validates the whole schema before this runs, so `values` is
  // complete and checked; `toBulkBlogPayload` is the single place that decides what
  // actually goes on the wire.
  const handleSubmit = submitForm(
    async (values) => {
      // Use memoized estimated cost
      const totalCost = estimatedCost

      const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

      // Check if user has sufficient credits
      if (userCredits < totalCost) {
        handlePopup({
          title: "Insufficient Credits",
          description: (
            <div>
              <p>
                You don't have enough credits to generate {values.numberOfBlogs} blog
                {values.numberOfBlogs > 1 ? "s" : ""}.
              </p>
              <p className="mt-2">
                <strong>Required:</strong> {totalCost} credits
              </p>
              <p>
                <strong>Available:</strong> {userCredits} credits
              </p>
            </div>
          ),
          confirmText: "Buy Credits",
          onConfirm: () => {
            navigate("/pricing")
            handleClose()
          },
        })
        return
      }

      const loadingId = showLoading(
        `Creating ${values.numberOfBlogs} blog${values.numberOfBlogs > 1 ? "s" : ""}...`
      )

      try {
        const payload = toBulkBlogPayload(values)
        if (debugPayload("BulkBlog", payload)) return

        const { createMultiBlog } = useBlogStore.getState()
        // Don't await the promise so the modal closes immediately
        createMultiBlog({ blogData: payload, navigate, queryClient })
          .catch((error) => {
            toast.error(error?.message || "Failed to create blogs. Please try again.")
          })
          .finally(() => {
            hideLoading(loadingId)
          })

        handleClose()
      } catch (error) {
        toast.error(error?.message || "Failed to create blogs. Please try again.")
        hideLoading(loadingId)
      }
    },
    (invalid) => {
      // Land on the earliest step holding a failing field so its message is visible.
      const steps = Object.keys(invalid).map(bulkStepOfField)
      setCurrentStep(steps.length ? Math.min(...steps) : currentStep)
    }
  )

  const handlePackageSelect = useCallback(
    (templates) => {
      setField(
        "templates",
        templates.map((t) => t.name)
      )
      setField(
        "templateIds",
        templates.map((t) => t.id)
      )
    },
    [setField]
  )

  const handleInputChange = (e) => {
    const { name, value, type } = e.target

    let val
    if (type === "tel" || type === "range") {
      if (value === "") {
        val = ""
      } else {
        const parsed = parseInt(value, 10)
        if (Number.isNaN(parsed)) {
          val = ""
        } else {
          val = parsed
          if (val < 0) val = 0
          if (name === "numberOfBlogs" && val > BLOG_CONFIG.BULK.MAX_BLOGS)
            val = BLOG_CONFIG.BULK.MAX_BLOGS
          if (name === "numberOfImages" && val > BLOG_CONFIG.IMAGES.MAX_COUNT)
            val = BLOG_CONFIG.IMAGES.MAX_COUNT
        }
      }
    } else {
      val = value
    }

    setField(name, val)

    if (name === "numberOfBlogs") {
      const minBlogs = Math.max(1, formData.topics.length)
      if (val === "" || val < minBlogs) {
        setFieldError(
          "numberOfBlogs",
          `Number of blogs must be at least ${minBlogs} (number of topics provided).`
        )
      }
    }
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setField(name, checked)
    if (name === "performKeywordResearch") {
      clearErrors(["keywords", "keywordsCSV"])
    }
  }

  const handleTopicInputChange = (e) => {
    setField("topicInput", e.target.value)
    clearErrors(["topics", "topicsCSV"])
  }

  const handleKeywordInputChange = (e) => {
    setField("keywordInput", e.target.value)
    clearErrors(["keywords", "keywordsCSV"])
  }

  const handlePasteItems = (e, type) => {
    extractKeywordsFromClipboard(e, {
      type,
      cb: (items) => {
        if (type === "topics") {
          handleAddTopic(items)
        } else {
          handleAddKeyword(items)
        }
      },
    })
  }

  const handleAddTopic = (inputValueOrItems) => {
    const seen = new Set()
    const rawItems = Array.isArray(inputValueOrItems)
      ? inputValueOrItems
      : (typeof inputValueOrItems === "string" ? inputValueOrItems : formData.topicInput).split(
          /[,\t\n\r;]+/
        )
    const items = rawItems
      .map((t) => t.trim())
      .filter((t) => t !== "" && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))

    if (items.length === 0) {
      if (typeof inputValueOrItems !== "string" && !Array.isArray(inputValueOrItems))
        setFieldError("topics", "Please enter a topic.")
      return false
    }

    const existing = formData.topics.map((t) => t.toLowerCase().trim())
    const newTopics = items.filter((t) => !existing.includes(t.toLowerCase()))

    if (newTopics.length === 0) {
      setFieldError("topics", "Please enter valid, non-duplicate topics.")
      setField("topicInput", "")
      return false
    }

    const limit = formData.numberOfBlogs || 0
    if (formData.topics.length + newTopics.length > limit) {
      const allowedCount = limit - formData.topics.length
      if (allowedCount <= 0) {
        setFieldError("topics", `Cannot add more than ${limit} topics.`)
        toast.error(
          `Cannot add more than ${limit} topics. Please increase the number of blogs first if you want more topics.`
        )
        setField("topicInput", "")
        return false
      } else {
        const slicedNewTopics = newTopics.slice(0, allowedCount)
        setField("topics", [...formData.topics, ...slicedNewTopics])
        setField("topicInput", "")
        clearErrors(["topics", "topicsCSV"])
        toast.warning(
          `Only ${allowedCount} topic(s) were added because the limit of ${limit} blogs is reached.`
        )
        return true
      }
    }

    setField("topics", [...formData.topics, ...newTopics])
    setField("topicInput", "")
    clearErrors(["topics", "topicsCSV"])
    return true
  }

  const handleRemoveTopic = (index) => {
    setField(
      "topics",
      formData.topics.filter((_, i) => i !== index)
    )
    clearErrors(["topics", "topicsCSV"])
  }

  const handleAddKeyword = (inputValueOrItems) => {
    const seen = new Set()
    const rawItems = Array.isArray(inputValueOrItems)
      ? inputValueOrItems
      : (typeof inputValueOrItems === "string" ? inputValueOrItems : formData.keywordInput).split(
          /[,\t\n\r;]+/
        )
    const items = rawItems
      .map((k) => k.trim())
      .filter((k) => k !== "" && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))

    if (items.length === 0) {
      if (typeof inputValueOrItems !== "string" && !Array.isArray(inputValueOrItems))
        setFieldError("keywords", "Please enter a keyword.")
      return false
    }

    const existing = formData.keywords.map((k) => k.toLowerCase().trim())
    const newKeywords = items.filter((k) => !existing.includes(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setFieldError("keywords", "Please enter valid, non-duplicate keywords.")
      setField("keywordInput", "")
      return false
    }

    setField("keywords", [...formData.keywords, ...newKeywords])
    setField("keywordInput", "")
    clearErrors(["keywords", "keywordsCSV"])
    return true
  }

  const handleRemoveKeyword = (index) => {
    setField(
      "keywords",
      formData.keywords.filter((_, i) => i !== index)
    )
    clearErrors(["keywords", "keywordsCSV"])
  }

  const handleTopicKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const topicAdded = handleAddTopic()
      if (!formData.performKeywordResearch && topicAdded) {
        handleAddKeyword()
      }
    }
  }

  const handleImageSourceChange = (source) => {
    setField("imageSource", source)
    clearErrors(["blogImages", "numberOfImages"])
  }

  const _handleIntegrationChange = (platform) => {
    setField("postingType", platform)
    clearErrors("integration")
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFieldError("topicsCSV", "No file selected. Please choose a valid CSV file.")
      e.target.value = null
      return
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFieldError("topicsCSV", "Invalid file type. Please upload a .csv file.")
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      setFieldError("topicsCSV", "File size exceeds 20KB limit. Please upload a smaller file.")
      e.target.value = null
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (!text || typeof text !== "string") {
        setFieldError("topicsCSV", "Failed to read the CSV file. Please ensure it is valid.")
        return
      }

      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        setFieldError("topicsCSV", "The CSV file is empty. Please provide a valid CSV with topics.")
        return
      }

      if (lines[0].toLowerCase().includes("topics") || lines[0].toLowerCase().includes("keyword")) {
        lines = lines.slice(1)
      }

      const items = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.map((part) => part.trim()).find((part) => part) || null
        })
        .filter((item) => item && item.trim().length > 0)

      if (items.length === 0) {
        setFieldError("topicsCSV", "No valid topics found in the CSV file.")
        return
      }

      const existing = getValues("topics").map((t) => t.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter((item) => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        setFieldError(
          "topicsCSV",
          "No new topics found in the CSV. All provided items are either duplicates or already exist."
        )
        return
      }

      const limit = getValues("numberOfBlogs") || 0
      if (getValues("topics").length + uniqueNewItems.length > limit) {
        const allowedCount = limit - getValues("topics").length
        if (allowedCount <= 0) {
          setFieldError("topicsCSV", `Cannot add more than ${limit} topics. CSV upload ignored.`)
          toast.error(`CSV ignored. Adding these topics would exceed your limit of ${limit} blogs.`)
          return
        } else {
          const slicedNewTopics = uniqueNewItems.slice(0, allowedCount)
          setField("topics", [...getValues("topics"), ...slicedNewTopics])
          clearErrors(["topics", "topicsCSV"])
          setRecentlyUploadedTopicsCount(slicedNewTopics.length)
          setTimeout(() => setRecentlyUploadedTopicsCount(null), 5000)
          toast.warning(
            `Only ${allowedCount} topic(s) from CSV were added to match your limit of ${limit} blogs.`
          )
          return
        }
      }

      setField("topics", [...getValues("topics"), ...uniqueNewItems])
      clearErrors(["topics", "topicsCSV"])
      setRecentlyUploadedTopicsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedTopicsCount(null), 5000)
    }

    reader.onerror = () => {
      setFieldError("topicsCSV", "An error occurred while reading the CSV file.")
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const handleCSVKeywordUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFieldError("keywordsCSV", "No file selected. Please choose a valid CSV file.")
      e.target.value = null
      return
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFieldError("keywordsCSV", "Invalid file type. Please upload a .csv file.")
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      setFieldError("keywordsCSV", "File size exceeds 20KB limit. Please upload a smaller file.")
      e.target.value = null
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (!text || typeof text !== "string") {
        setFieldError("keywordsCSV", "Failed to read the CSV file. Please ensure it is valid.")
        return
      }

      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        setFieldError(
          "keywordsCSV",
          "The CSV file is empty. Please provide a valid CSV with keywords."
        )
        return
      }

      if (
        lines[0].toLowerCase().includes("keywords") ||
        lines[0].toLowerCase().includes("keyword")
      ) {
        lines = lines.slice(1)
      }

      const items = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.map((part) => part.trim()).find((part) => part) || null
        })
        .filter((item) => item && item.trim().length > 0)

      if (items.length === 0) {
        setFieldError("keywordsCSV", "No valid keywords found in the CSV file.")
        return
      }

      const existing = getValues("keywords").map((k) => k.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter((item) => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        setFieldError(
          "keywordsCSV",
          "No new keywords found in the CSV. All provided items are either duplicates or already exist."
        )
        return
      }

      setField("keywords", [...getValues("keywords"), ...uniqueNewItems])
      clearErrors(["keywords", "keywordsCSV"])
      setRecentlyUploadedKeywordsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedKeywordsCount(null), 5000)
    }

    reader.onerror = () => {
      setFieldError("keywordsCSV", "An error occurred while reading the CSV file.")
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const validateImages = (files) => {
    const { types: allowedTypes, max_size: maxSize, max_files: maxImages } = VALID_IMAGE_CONFIG

    if (!files || files.length === 0) {
      setFieldError("blogImages", "No images selected. Please choose valid images.")
      return []
    }

    const validFiles = Array.from(files).filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        setFieldError(
          "blogImages",
          `"${file.name}" is not a valid image type. Only PNG, JPEG, and WebP are allowed.`
        )
        return false
      }
      if (file.size > maxSize) {
        setFieldError("blogImages", `"${file.name}" exceeds the 5 MB size limit.`)
        return false
      }
      return true
    })

    const totalImages = formData.blogImages.length + validFiles.length
    if (totalImages > maxImages) {
      setFieldError("blogImages", `Cannot upload more than ${maxImages} images.`)
      return validFiles.slice(0, maxImages - formData.blogImages.length)
    }

    return validFiles
  }

  const _handleFileChange = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setField("blogImages", [...formData.blogImages, ...validFiles])
      clearErrors("blogImages")
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const steps = formData.enableAdvanced
    ? ["Templates", "Basic Info", "Settings", "Bulk Options"]
    : ["Templates", "Basic Info", "Settings"]

  const isNextDisabled =
    currentStep === 1 && (formData.numberOfBlogs === "" || formData.numberOfBlogs < 1)

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 px-6">
          <h3 className="text-md font-black text-slate-900 tracking-tight">{`Step ${currentStep + 1}: ${steps[currentStep]}`}</h3>
          <button type="button" onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Sleek Minimal Progress Bar */}
        <div className="w-full bg-slate-100 h-[3px] overflow-hidden">
          <div
            className="bg-[#4C5BD6] h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="p-6 pt-2 max-h-[70vh] overflow-y-auto custom-scroll space-y-4">
          {currentStep === 0 && (
            <TemplateSelection
              numberOfSelection={3}
              userSubscriptionPlan={user?.subscription?.plan ?? "free"}
              preSelectedIds={formData.templateIds}
              onClick={handlePackageSelect}
              error={errors.templates?.message}
            />
          )}
          {currentStep === 1 && (
            <div className="space-y-6 pt-2">
              {/* Number of Blogs */}
              <div>
                <label htmlFor="bulk-number-of-blogs" className="block text-sm font-semibold">
                  Number of Blogs <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  How many blogs to generate based on the topics provided.
                </p>
                <input
                  id="bulk-number-of-blogs"
                  type="tel"
                  inputMode="numeric"
                  name="numberOfBlogs"
                  min="1"
                  max={BLOG_CONFIG.BULK.MAX_BLOGS}
                  value={formData.numberOfBlogs === 0 ? "" : formData.numberOfBlogs}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    errors.numberOfBlogs?.message ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="e.g., 5"
                />
                {errors.numberOfBlogs?.message && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.numberOfBlogs?.message}
                  </p>
                )}
              </div>

              {/* Topics */}
              <div>
                <FieldLabel
                  tip="The main subject/topic for each blog. Add one per blog you want to generate. Supports bulk CSV upload."
                  required
                >
                  Topics ({formData.topics.length}/{formData.numberOfBlogs || 0} added)
                </FieldLabel>
                <p className="text-xs text-slate-500 font-medium mb-2">
                  Enter the main topics for your blogs.
                </p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.topicInput}
                    onChange={handleTopicInputChange}
                    onKeyDown={handleTopicKeyPress}
                    onPaste={(e) => handlePasteItems(e, "topics")}
                    className={`w-full px-3 py-2 border outline-0 rounded-md text-sm bg-gray-50 ${
                      errors.topics?.message ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter topics (comma, tab, or newline separated)"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="flex-1 sm:flex-none px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] font-bold transition-all"
                  >
                    Add
                  </button>
                  <label
                    className={`flex-1 sm:flex-none px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center justify-center gap-1 hover:bg-gray-200 ${
                      errors.topicsCSV?.message ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
                  </label>
                </div>
                {errors.topics?.message && <p className="text-red-500 text-xs mt-1">{errors.topics?.message}</p>}
                {errors.topicsCSV?.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.topicsCSV?.message}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {(showAllTopics
                    ? formData.topics.slice().reverse()
                    : formData.topics.slice().reverse().slice(0, 18)
                  ).map((topic, reversedIndex) => {
                    const actualIndex = formData.topics.length - 1 - reversedIndex
                    return (
                      <span
                        key={`${topic}-${actualIndex}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(actualIndex)}
                          className="ml-1.5 shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                  {(formData.topics.length > 18 || recentlyUploadedTopicsCount) && (
                    <button
                      type="button"
                      onClick={() => setShowAllTopics((prev) => !prev)}
                      className="cursor-pointer text-xs font-semibold text-blue-600 self-center flex items-center gap-1"
                    >
                      {showAllTopics ? (
                        <>Show less</>
                      ) : (
                        <>
                          {formData.topics.length > 18 && `+${formData.topics.length - 18} more`}
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
                <Switch
                  checked={formData.performKeywordResearch}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange({ target: { name: "performKeywordResearch", checked } })
                  }
                  size="large"
                />
              </div>
              {!formData.performKeywordResearch && (
                <div className="space-y-6">
                  <div>
                    <FieldLabel
                      tip="Secondary keywords to weave throughout all blog articles. Supports CSV upload for bulk entry."
                      required
                    >
                      Keywords
                    </FieldLabel>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.keywordInput}
                        onChange={handleKeywordInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddKeyword()
                          }
                        }}
                        onPaste={(e) => handlePasteItems(e, "keywords")}
                        className={`flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          errors.keywords?.message ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter keywords (comma, tab, or newline separated)"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] font-bold transition-all"
                      >
                        Add
                      </button>
                      <label
                        className={`px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 ${
                          errors.keywordsCSV?.message ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <Upload size={16} />
                        <input type="file" accept=".csv" onChange={handleCSVKeywordUpload} hidden />
                      </label>
                    </div>
                    {errors.keywords?.message && (
                      <p className="text-red-500 text-xs mt-1">{errors.keywords?.message}</p>
                    )}
                    {errors.keywordsCSV?.message && (
                      <p className="text-red-500 text-xs mt-1">{errors.keywordsCSV?.message}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                      {(showAllKeywords
                        ? formData.keywords.slice().reverse()
                        : formData.keywords.slice().reverse().slice(0, 18)
                      ).map((keyword, reversedIndex) => {
                        const actualIndex = formData.keywords.length - 1 - reversedIndex
                        return (
                          <span
                            key={`${keyword}-${actualIndex}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(actualIndex)}
                              className="ml-1.5 shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )
                      })}
                      {(formData.keywords.length > 18 || recentlyUploadedKeywordsCount) && (
                        <button
                          type="button"
                          onClick={() => setShowAllKeywords((prev) => !prev)}
                          className="cursor-pointer text-xs font-semibold text-blue-600 self-center flex items-center gap-1"
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
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bulk-tone" className="block text-sm font-semibold">
                    Tone of Voice
                  </label>
                  <select
                    id="bulk-tone"
                    className={`select select-bordered w-full h-10 min-h-0 text-sm mt-3 ${
                      errors.tone?.message ? "select-error" : ""
                    }`}
                    value={formData.tone}
                    onChange={(e) => {
                      setField("tone", e.target.value)
                      clearErrors("tone")
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
                  <label htmlFor="bulk-language" className="block text-sm font-semibold">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bulk-language"
                    className="select select-bordered w-full h-10 min-h-0 text-sm mt-3"
                    value={formData.languageToWrite}
                    onChange={(e) => {
                      setField("languageToWrite", e.target.value)
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
                  </select>
                </div>
                <div>
                  <span className="block text-sm font-semibold mb-2">
                    Approx. Blog Length
                    <span className="text-sm ml-2 font-bold text-blue-600">
                      {formData.userDefinedLength} words
                    </span>
                  </span>
                  <div className="relative mt-5">
                    <Slider
                      min={BLOG_CONFIG.LENGTH.MIN}
                      max={BLOG_CONFIG.LENGTH.MAX}
                      step={BLOG_CONFIG.LENGTH.STEP}
                      value={[formData.userDefinedLength]}
                      onValueChange={(vals) =>
                        setField("userDefinedLength", vals[0])
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {
            currentStep === 2 && (
              <div className="space-y-8 p-4 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="block text-sm font-semibold">Add Image</span>
                      <p className="text-xs text-slate-500 font-medium">
                        Search and add relevant images to your blogs
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        id="add-image-toggle"
                        checked={formData.isCheckedGeneratedImages}
                        onCheckedChange={(checked) => {
                          setField("isCheckedGeneratedImages", checked)
                          setField(
                            "imageSource",
                            checked
                              ? formData.imageSource === "none"
                                ? "stock"
                                : formData.imageSource
                              : "none"
                          )
                          clearErrors(["numberOfImages", "blogImages"])
                        }}
                        size="large"
                      />
                    </div>
                  </div>
                  {formData.isCheckedGeneratedImages && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <ImageSourceSelector
                        value={formData.imageSource}
                        onChange={handleImageSourceChange}
                        error={errors.blogImages?.message}
                        showUpload={false}
                        numberOfImages={formData.numberOfImages}
                        onNumberChange={(val) =>
                          setField("numberOfImages", val)
                        }
                      />
                      {errors.numberOfImages?.message && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.numberOfImages?.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Advanced Options Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-5">
                  <FieldLabel tip="Enable this to customize AI model selection and extra advanced options in the next step.">
                    Advanced Options
                  </FieldLabel>
                  <Switch
                    checked={formData.enableAdvanced}
                    onCheckedChange={(checked) =>
                      setField("enableAdvanced", checked)
                    }
                  />
                </div>

                {formData.enableAdvanced && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <AiModelSelector
                      value={formData.aiModel}
                      onChange={(modelId) => {
                        setField("aiModel", modelId)
                        clearErrors("aiModel")
                      }}
                      showCostCutter={true}
                      costCutterValue={formData.costCutter}
                      onCostCutterChange={(checked) => {
                        setField("costCutter", checked)
                      }}
                      error={errors.aiModel?.message}
                    />
                  </div>
                )}
              </div>
            ) /* end of case 2 */
          }
          {currentStep === 3 && (
            <div className="space-y-6 p-4 pt-4">
              {/* 1-4. AdvancedOptions Group A */}
              <AdvancedOptions
                formData={formData}
                updateFormData={applyUpdates}
                showFields={[
                  "easyToUnderstand",
                  "humanisation",
                  "extendedThinking",
                  "deepResearch",
                ]}
              />

              {/* (5. Quick Summary skipped - not in Bulk) */}

              {/* 6-9. AdvancedOptions Group B */}
              <AdvancedOptions
                formData={formData}
                updateFormData={applyUpdates}
                showFields={[
                  "includeFaqs",
                  "includeInterlinks",
                  "addOutBoundLinks",
                  "includeCompetitorResearch",
                ]}
              />

              {/* 10. Embed YouTube Videos */}
              <AdvancedOptions
                formData={formData}
                updateFormData={applyUpdates}
                showFields={["embedYouTubeVideos"]}
              />

              {/* 11. Write with Brand Voice */}
              <BrandVoiceSelector
                label="Write with Brand Voice"
                size="large"
                labelClass="text-sm font-semibold"
                value={{
                  isCheckedBrand: formData.isCheckedBrand,
                  brandId: formData.brandId,
                  addCTA: formData.addCTA,
                  createBrandedImages: formData.createBrandedImages,
                }}
                imageSource={formData.imageSource}
                onChange={(val) => {
                  setField("isCheckedBrand", val.isCheckedBrand)
                  setField("brandId", val.brandId)
                  setField("addCTA", val.addCTA)
                  setField("createBrandedImages", val.createBrandedImages)
                }}
              />

              {/* 12. Automatic Posting */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">Automatic Posting</p>
                    <p className="text-xs text-slate-500 font-medium">
                      Automatically post to your connected platforms
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={formData.wordpressPostStatus}
                      size="large"
                      onCheckedChange={(checked) => {
                        const hasAnyIntegration =
                          Object.keys(integrations?.integrations || {}).length > 0
                        if (checked && !hasAnyIntegration) {
                          toast.error("Please connect your account in plugins.")
                          return
                        }
                        setField("wordpressPostStatus", checked)
                        setField(
                          "postingType",
                          checked
                            ? formData.postingType ||
                                Object.keys(integrations?.integrations || {})[0]
                            : null
                        )
                      }}
                    />
                  </div>
                </div>

                {formData.wordpressPostStatus &&
                  integrations?.integrations &&
                  Object.keys(integrations.integrations).length > 0 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label htmlFor="bulk-publishing-platform" className="font-semibold text-sm">
                        Publishing Platform
                      </label>
                      <select
                        id="bulk-publishing-platform"
                        value={formData.postingType || ""}
                        onChange={(e) =>
                          setField("postingType", e.target.value)
                        }
                        className="select select-bordered w-full rounded-lg text-sm h-10 min-h-0 focus:outline-none mt-3"
                      >
                        {Object.entries(integrations.integrations).map(([platform]) => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-sm font-semibold">Table of Contents</p>
                          <p className="text-xs text-slate-500 font-medium">
                            Include a table of contents in your post
                          </p>
                        </div>
                        <Switch
                          checked={formData.includeTableOfContents}
                          size="large"
                          onCheckedChange={(checked) =>
                            setField("includeTableOfContents", checked)
                          }
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-300 bg-white">
          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-4 ${
              currentStep === (formData.enableAdvanced ? 3 : 2)
                ? "sm:justify-between"
                : "sm:justify-end"
            }`}
          >
            {/* Cost Section */}
            {currentStep === (formData.enableAdvanced ? 3 : 2) && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-600 font-semibold">Estimated Cost:</span>

                <span className="font-bold text-[#4C5BD6]">{estimatedCost} credits</span>

                {formData.costCutter && (
                  <span className="text-xs text-green-600 font-semibold">(-50% off)</span>
                )}

                <span className="text-xs text-gray-500">
                  ({formData.numberOfBlogs} blog
                  {formData.numberOfBlogs > 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 sm:justify-end">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-full sm:w-auto px-6 py-2 text-sm font-bold bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Previous
                </button>
              )}

              <button
                type="button"
                onClick={
                  currentStep === (formData.enableAdvanced ? 3 : 2) ? handleSubmit : handleNext
                }
                disabled={isNextDisabled}
                className={`w-full sm:w-auto px-8 py-2 text-sm font-bold text-white bg-[#4C5BD6] rounded-md transition ${
                  isNextDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#3B4BB8]"
                }`}
              >
                {currentStep === (formData.enableAdvanced ? 3 : 2) ? "Generate Blogs" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>
          close
        </button>
      </form>
    </dialog>
  )
}

export default BulkBlogModal
