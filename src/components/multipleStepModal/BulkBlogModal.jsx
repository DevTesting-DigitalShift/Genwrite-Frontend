import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { Info, TriangleAlert, Upload, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { packages } from "@/data/templates"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { computeCost } from "@/data/pricingConfig"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { IMAGE_SOURCE, TONES, VALID_IMAGE_CONFIG } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import AdvancedOptions from "@components/AdvancedOptions"
import { queryClient } from "@utils/queryClient"
import { validateBulkBlogData } from "@/types/forms.schemas"
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
  const userPlan = user?.subscription?.plan || user?.plan
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const isAiImagesLimitReached = (user?.usage?.aiImages || 0) >= (user?.usageLimits?.aiImages || 0)
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [recentlyUploadedTopicsCount, setRecentlyUploadedTopicsCount] = useState(null)
  const [recentlyUploadedKeywordsCount, setRecentlyUploadedKeywordsCount] = useState(null)

  const initialFormData = {
    templates: [],
    templateIds: [],
    topics: [],
    keywords: [],
    topicInput: "",
    keywordInput: "",
    performKeywordResearch: true,
    tone: TONES[0],
    languageToWrite: "English",
    userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
    imageSource: IMAGE_SOURCE.STOCK,
    isCheckedBrand: false,
    includeCompetitorResearch: false,
    includeInterlinks: false,
    includeFaqs: false,
    numberOfBlogs: 1,
    numberOfImages: 0,
    aiModel: "gemini",
    isCheckedGeneratedImages: true,
    addOutBoundLinks: false,
    blogImages: [],
    brandId: null,
    addCTA: false,
    isDragging: false,
    costCutter: true,
    easyToUnderstand: false,
    embedYouTubeVideos: false,
    extendedThinking: false,
    deepResearch: false,
    humanisation: false,
    wordpressPostStatus: false,
    includeTableOfContents: false,
  }

  const initialErrorsState = {
    templates: "",
    topics: "",
    topicsCSV: "",
    keywords: "",
    keywordsCSV: "",
    tone: "",
    aiModel: "",
    numberOfBlogs: "",
    numberOfImages: "",
    blogImages: "",
    brandId: "",
  }

  const [errors, setErrors] = useState(initialErrorsState)

  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  useEffect(() => {
    if (integrations?.integrations && Object.keys(integrations.integrations).length > 0) {
      if (!formData.postingType) {
        setFormData(prev => ({ ...prev, postingType: Object.keys(integrations.integrations)[0] }))
      }
    }
  }, [integrations])

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

  const handleNext = () => {
    if (currentStep === 0) {
      if (formData.templates.length === 0) {
        setErrors(prev => ({ ...prev, templates: "Please select at least one template." }))
        return
      }
      setErrors(prev => ({ ...prev, templates: "" }))
    }
    if (currentStep === 1) {
      const newErrors = {
        topics:
          formData.topics.length === 0 && formData.topicInput.trim() === ""
            ? "Please add at least one topic."
            : "",
        keywords:
          !formData.performKeywordResearch &&
          formData.keywords.length === 0 &&
          formData.keywordInput.trim() === ""
            ? "Please add at least one keyword."
            : "",
      }
      setErrors(prev => ({ ...prev, ...newErrors }))
      if (Object.values(newErrors).some(error => error)) {
        return
      }
    }
    if (currentStep === 2) {
      const newErrors = {
        aiModel: !formData.aiModel ? "Please select an AI model." : "",
        numberOfImages:
          formData.isCheckedGeneratedImages &&
          (formData.numberOfImages === "" ||
            formData.numberOfImages < 0 ||
            formData.numberOfImages > BLOG_CONFIG.IMAGES.MAX_COUNT)
            ? `Number of images must be between 0 and ${BLOG_CONFIG.IMAGES.MAX_COUNT}.`
            : "",
        blogImages:
          formData.isCheckedGeneratedImages &&
          formData.imageSource === "customImage" &&
          formData.blogImages.length === 0
            ? "Please upload at least one custom image."
            : "",
      }
      setErrors(prev => ({ ...prev, ...newErrors }))
      if (Object.values(newErrors).some(error => error)) {
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handlePrev = () => {
    setCurrentStep(prev => (prev > 0 ? prev - 1 : prev))
    setErrors(prev => ({ ...prev, ...initialErrorsState }))
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setErrors(initialErrorsState)
    closeFnc()
  }

  const handleSubmit = async () => {
    const newErrors = {
      templates: formData.templates.length === 0 ? "Please select at least one template." : "",
      topics:
        formData.topics.length === 0 && formData.topicInput.trim() === ""
          ? "Please add at least one topic."
          : "",
      keywords:
        !formData.performKeywordResearch &&
        formData.keywords.length === 0 &&
        formData.keywordInput.trim() === ""
          ? "Please add at least one keyword."
          : "",
      aiModel: !formData.aiModel ? "Please select an AI model." : "",
      numberOfBlogs:
        formData.numberOfBlogs < 1 || formData.numberOfBlogs > BLOG_CONFIG.BULK.MAX_BLOGS
          ? `Number of blogs must be between 1 and ${BLOG_CONFIG.BULK.MAX_BLOGS}.`
          : "",
      numberOfImages:
        formData.numberOfImages === "" ||
        formData.numberOfImages < 0 ||
        formData.numberOfImages > BLOG_CONFIG.IMAGES.MAX_COUNT
          ? `Number of images must be between 0 and ${BLOG_CONFIG.IMAGES.MAX_COUNT}.`
          : "",
      blogImages:
        formData.isCheckedGeneratedImages &&
        formData.imageSource === "customImage" &&
        formData.blogImages.length === 0
          ? "Please upload at least one custom image."
          : "",
      brandId: "",
    }

    setErrors(prev => ({ ...prev, ...newErrors }))

    if (Object.values(newErrors).some(error => error)) {
      // Find the step where the first error occurs
      const errorStep = newErrors.templates
        ? 0
        : newErrors.topics || newErrors.keywords
          ? 1
          : newErrors.aiModel || newErrors.numberOfImages || newErrors.blogImages
            ? 2
            : 3
      setCurrentStep(errorStep)
      return
    }

    const model = formData.aiModel || "gemini"

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
              You don't have enough credits to generate {formData.numberOfBlogs} blog
              {formData.numberOfBlogs > 1 ? "s" : ""}.
            </p>
            <p className="mt-2">
              <strong>Required:</strong> {totalCost} credits
            </p>
            <p>
              <strong>Available:</strong> {userCredits} credits
            </p>
          </div>
        ),
        okText: "Buy Credits",
        onConfirm: () => {
          navigate("/pricing")
          handleClose()
        },
      })
      return
    }
    // Validate with Zod schema (logs to console when VITE_VALIDATE_FORMS=true)
    const finalData = {
      ...formData,
      imageSource: formData.isCheckedGeneratedImages ? formData.imageSource : "none", // Explicitly use "none" string if needed, or IMAGE_SOURCE.NONE
      tone: formData.tone || undefined, // Send undefined if empty to let Zod catch it as required
    }
    const validatedData = validateBulkBlogData(finalData)

    const loadingId = showLoading(
      `Creating ${formData.numberOfBlogs} blog${formData.numberOfBlogs > 1 ? "s" : ""}...`
    )

    try {
      const { createMultiBlog } = useBlogStore.getState()
      // Don't await the promise so the modal closes immediately
      createMultiBlog({ blogData: validatedData, user, navigate, queryClient })
        .then(() => {
          // Optional: You can show a success message here if needed,
          // but the store action likely handles the main success feedback/navigation
        })
        .catch(error => {
          toast.error(error?.message || "Failed to create blogs. Please try again.")
        })
        .finally(() => {
          hideLoading(loadingId)
        })

      handleClose()
    } catch (error) {
      // This catch block might not be hit if createMultiBlog validation fails synchronously before returning a promise
      // but good to keep for safety
      toast.error(error?.message || "Failed to create blogs. Please try again.")
      hideLoading(loadingId)
    }
  }

  const handlePackageSelect = useCallback(templates => {
    setFormData(prev => ({
      ...prev,
      templates: templates.map(t => t.name),
      templateIds: templates.map(t => t.id),
    }))
    setErrors(prev => ({ ...prev, templates: "" }))
  }, [])

  const handleInputChange = e => {
    const { name, value, type } = e.target

    let val
    if (type === "tel" || type === "range") {
      if (value === "") {
        val = ""
      } else {
        const parsed = parseInt(value, 10)
        if (isNaN(parsed)) {
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

    setFormData(prev => ({ ...prev, [name]: val }))
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleCheckboxChange = e => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
    if (name === "performKeywordResearch") {
      setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
    }
  }

  const handleTopicInputChange = e => {
    setFormData(prev => ({ ...prev, topicInput: e.target.value }))
    setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
  }

  const handleKeywordInputChange = e => {
    setFormData(prev => ({ ...prev, keywordInput: e.target.value }))
    setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
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

  const handleAddTopic = inputValueOrItems => {
    const seen = new Set()
    const rawItems = Array.isArray(inputValueOrItems)
      ? inputValueOrItems
      : (typeof inputValueOrItems === "string" ? inputValueOrItems : formData.topicInput).split(
          /[,\t\n\r;]+/
        )
    const items = rawItems
      .map(t => t.trim())
      .filter(t => t !== "" && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))

    if (items.length === 0) {
      if (typeof inputValueOrItems !== "string" && !Array.isArray(inputValueOrItems))
        setErrors(prev => ({ ...prev, topics: "Please enter a topic." }))
      return false
    }

    const existing = formData.topics.map(t => t.toLowerCase().trim())
    const newTopics = items.filter(t => !existing.includes(t.toLowerCase()))

    if (newTopics.length === 0) {
      setErrors(prev => ({
        ...prev,
        topics: "Please enter valid, non-duplicate topics.",
      }))
      setFormData(prev => ({ ...prev, topicInput: "" }))
      return false
    }

    setFormData(prev => ({ ...prev, topics: [...prev.topics, ...newTopics], topicInput: "" }))
    setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
    return true
  }

  const handleRemoveTopic = index => {
    setFormData(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }))
    setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
  }

  const handleAddKeyword = inputValueOrItems => {
    const seen = new Set()
    const rawItems = Array.isArray(inputValueOrItems)
      ? inputValueOrItems
      : (typeof inputValueOrItems === "string" ? inputValueOrItems : formData.keywordInput).split(
          /[,\t\n\r;]+/
        )
    const items = rawItems
      .map(k => k.trim())
      .filter(k => k !== "" && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))

    if (items.length === 0) {
      if (typeof inputValueOrItems !== "string" && !Array.isArray(inputValueOrItems))
        setErrors(prev => ({ ...prev, keywords: "Please enter a keyword." }))
      return false
    }

    const existing = formData.keywords.map(k => k.toLowerCase().trim())
    const newKeywords = items.filter(k => !existing.includes(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors(prev => ({
        ...prev,
        keywords: "Please enter valid, non-duplicate keywords.",
      }))
      setFormData(prev => ({ ...prev, keywordInput: "" }))
      return false
    }

    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, ...newKeywords],
      keywordInput: "",
    }))
    setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
    return true
  }

  const handleRemoveKeyword = index => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter((_, i) => i !== index) }))
    setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
  }

  const handleTopicKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      const topicAdded = handleAddTopic()
      if (!formData.performKeywordResearch && topicAdded) {
        handleAddKeyword()
      }
    }
  }

  const handleImageSourceChange = source => {
    setFormData(prev => ({ ...prev, imageSource: source }))
    setErrors(prev => ({ ...prev, blogImages: "", numberOfImages: "" }))
  }

  const handleIntegrationChange = platform => {
    setFormData(prev => ({ ...prev, postingType: platform }))
    setErrors(prev => ({ ...prev, integration: "" }))
  }

  const handleCSVUpload = e => {
    const file = e.target.files?.[0]
    if (!file) {
      setErrors(prev => ({
        ...prev,
        topicsCSV: "No file selected. Please choose a valid CSV file.",
      }))
      e.target.value = null
      return
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(prev => ({ ...prev, topicsCSV: "Invalid file type. Please upload a .csv file." }))
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      setErrors(prev => ({
        ...prev,
        topicsCSV: "File size exceeds 20KB limit. Please upload a smaller file.",
      }))
      e.target.value = null
      return
    }

    const reader = new FileReader()
    reader.onload = event => {
      const text = event.target?.result
      if (!text || typeof text !== "string") {
        setErrors(prev => ({
          ...prev,
          topicsCSV: "Failed to read the CSV file. Please ensure it is valid.",
        }))
        return
      }

      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        setErrors(prev => ({
          ...prev,
          topicsCSV: "The CSV file is empty. Please provide a valid CSV with topics.",
        }))
        return
      }

      if (lines[0].toLowerCase().includes("topics") || lines[0].toLowerCase().includes("keyword")) {
        lines = lines.slice(1)
      }

      const items = lines
        .map(line => {
          const parts = line.split(",")
          return parts.map(part => part.trim()).find(part => part) || null
        })
        .filter(item => item && item.trim().length > 0)

      if (items.length === 0) {
        setErrors(prev => ({ ...prev, topicsCSV: "No valid topics found in the CSV file." }))
        return
      }

      const existing = formData.topics.map(t => t.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter(item => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        setErrors(prev => ({
          ...prev,
          topicsCSV:
            "No new topics found in the CSV. All provided items are either duplicates or already exist.",
        }))
        return
      }

      setFormData(prev => ({ ...prev, topics: [...prev.topics, ...uniqueNewItems] }))
      setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
      setRecentlyUploadedTopicsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedTopicsCount(null), 5000)
    }

    reader.onerror = () => {
      setErrors(prev => ({ ...prev, topicsCSV: "An error occurred while reading the CSV file." }))
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const handleCSVKeywordUpload = e => {
    const file = e.target.files?.[0]
    if (!file) {
      setErrors(prev => ({
        ...prev,
        keywordsCSV: "No file selected. Please choose a valid CSV file.",
      }))
      e.target.value = null
      return
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(prev => ({ ...prev, keywordsCSV: "Invalid file type. Please upload a .csv file." }))
      e.target.value = null
      return
    }

    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      setErrors(prev => ({
        ...prev,
        keywordsCSV: "File size exceeds 20KB limit. Please upload a smaller file.",
      }))
      e.target.value = null
      return
    }

    const reader = new FileReader()
    reader.onload = event => {
      const text = event.target?.result
      if (!text || typeof text !== "string") {
        setErrors(prev => ({
          ...prev,
          keywordsCSV: "Failed to read the CSV file. Please ensure it is valid.",
        }))
        return
      }

      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        setErrors(prev => ({
          ...prev,
          keywordsCSV: "The CSV file is empty. Please provide a valid CSV with keywords.",
        }))
        return
      }

      if (
        lines[0].toLowerCase().includes("keywords") ||
        lines[0].toLowerCase().includes("keyword")
      ) {
        lines = lines.slice(1)
      }

      const items = lines
        .map(line => {
          const parts = line.split(",")
          return parts.map(part => part.trim()).find(part => part) || null
        })
        .filter(item => item && item.trim().length > 0)

      if (items.length === 0) {
        setErrors(prev => ({ ...prev, keywordsCSV: "No valid keywords found in the CSV file." }))
        return
      }

      const existing = formData.keywords.map(k => k.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter(item => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        setErrors(prev => ({
          ...prev,
          keywordsCSV:
            "No new keywords found in the CSV. All provided items are either duplicates or already exist.",
        }))
        return
      }

      setFormData(prev => ({ ...prev, keywords: [...prev.keywords, ...uniqueNewItems] }))
      setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
      setRecentlyUploadedKeywordsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedKeywordsCount(null), 5000)
    }

    reader.onerror = () => {
      setErrors(prev => ({ ...prev, keywordsCSV: "An error occurred while reading the CSV file." }))
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const validateImages = files => {
    const { types: allowedTypes, max_size: maxSize, max_files: maxImages } = VALID_IMAGE_CONFIG

    if (!files || files.length === 0) {
      setErrors(prev => ({
        ...prev,
        blogImages: "No images selected. Please choose valid images.",
      }))
      return []
    }

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          blogImages: `"${file.name}" is not a valid image type. Only PNG, JPEG, and WebP are allowed.`,
        }))
        return false
      }
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, blogImages: `"${file.name}" exceeds the 5 MB size limit.` }))
        return false
      }
      return true
    })

    const totalImages = formData.blogImages.length + validFiles.length
    if (totalImages > maxImages) {
      setErrors(prev => ({ ...prev, blogImages: `Cannot upload more than ${maxImages} images.` }))
      return validFiles.slice(0, maxImages - formData.blogImages.length)
    }

    return validFiles
  }

  const handleFileChange = e => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setFormData(prev => ({ ...prev, blogImages: [...prev.blogImages, ...validFiles] }))
      setErrors(prev => ({ ...prev, blogImages: "" }))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const steps = ["Templates", "Basic Info", "Settings", "Bulk Options"]

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 px-6">
          <h3 className="text-md font-black text-slate-900 tracking-tight">{`Step ${currentStep + 1}: ${steps[currentStep]}`}</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 pt-2 max-h-[70vh] overflow-y-auto custom-scroll space-y-4">
          {currentStep === 0 && (
            <div
              className={`transition-all duration-200 ${
                errors.templates ? "border-2 border-red-500 rounded-xl p-1 pb-0" : ""
              }`}
            >
              <TemplateSelection
                numberOfSelection={3}
                userSubscriptionPlan={user?.subscription?.plan ?? "free"}
                preSelectedIds={formData.templateIds}
                onClick={handlePackageSelect}
                error={errors.templates}
              />
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-1 flex items-center gap-1">
                  Topics <span className="text-red-500">*</span>
                  <div
                    className="tooltip"
                    data-tip="Upload a .csv file in the format: `Topics` as header"
                  >
                    <div className="cursor-pointer">
                      <Info size={16} className="text-blue-500" />
                    </div>
                  </div>
                </label>
                <p className="text-xs text-slate-500 font-medium mb-2">
                  Enter the main topics for your blogs.
                </p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.topicInput}
                    onChange={handleTopicInputChange}
                    onKeyDown={handleTopicKeyPress}
                    onPaste={e => handlePasteItems(e, "topics")}
                    className={`w-full px-3 py-2 border outline-0 rounded-md text-sm bg-gray-50 ${
                      errors.topics ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter topics (comma, tab, or newline separated)"
                  />
                  <button
                    onClick={handleAddTopic}
                    className="flex-1 sm:flex-none px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] font-bold transition-all"
                  >
                    Add
                  </button>
                  <label
                    className={`flex-1 sm:flex-none px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center justify-center gap-1 hover:bg-gray-200 ${
                      errors.topicsCSV ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
                  </label>
                </div>
                {errors.topics && <p className="text-red-500 text-xs mt-1">{errors.topics}</p>}
                {errors.topicsCSV && (
                  <p className="text-red-500 text-xs mt-1">{errors.topicsCSV}</p>
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
                    <span
                      onClick={() => setShowAllTopics(prev => !prev)}
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
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold ">
                  Perform Keyword Research?
                  <p className="text-xs text-slate-500 font-medium">
                    Allow AI to find relevant keywords for the topics.
                  </p>
                </span>
                <Switch
                  checked={formData.performKeywordResearch}
                  onCheckedChange={checked =>
                    handleCheckboxChange({ target: { name: "performKeywordResearch", checked } })
                  }
                  size="large"
                />
              </div>
              {!formData.performKeywordResearch && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold  mb-1 flex items-center gap-1">
                      Keywords <span className="text-red-500">*</span>
                      <div
                        className="tooltip"
                        data-tip="Upload a .csv file in the format: `Keywords` as header"
                      >
                        <div className="cursor-pointer">
                          <Info size={16} className="text-blue-500" />
                        </div>
                      </div>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.keywordInput}
                        onChange={handleKeywordInputChange}
                        onKeyDown={e =>
                          e.key === "Enter" && (e.preventDefault(), handleAddKeyword())
                        }
                        onPaste={e => handlePasteItems(e, "keywords")}
                        className={`flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          errors.keywords ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter keywords (comma, tab, or newline separated)"
                      />
                      <button
                        onClick={handleAddKeyword}
                        className="px-6 py-2 bg-[#4C5BD6] text-white rounded-md text-sm hover:bg-[#3B4BB8] font-bold transition-all"
                      >
                        Add
                      </button>
                      <label
                        className={`px-4 py-2 bg-gray-100  border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 ${
                          errors.keywordsCSV ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <Upload size={16} />
                        <input type="file" accept=".csv" onChange={handleCSVKeywordUpload} hidden />
                      </label>
                    </div>
                    {errors.keywords && (
                      <p className="text-red-500 text-xs mt-1">{errors.keywords}</p>
                    )}
                    {errors.keywordsCSV && (
                      <p className="text-red-500 text-xs mt-1">{errors.keywordsCSV}</p>
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
                        <span
                          onClick={() => setShowAllKeywords(prev => !prev)}
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
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tone" className="block text-sm font-semibold">
                    Tone of Voice
                  </label>
                  <select
                    className={`select select-bordered w-full h-10 min-h-0 text-sm mt-3 ${
                      errors.tone ? "select-error" : ""
                    }`}
                    value={formData.tone}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, tone: e.target.value }))
                      setErrors(prev => ({ ...prev, tone: "" }))
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
                  <label htmlFor="language" className="block text-sm font-semibold">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="select select-bordered w-full h-10 min-h-0 text-sm mt-3"
                    value={formData.languageToWrite}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, languageToWrite: e.target.value }))
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
                  <label className="block text-sm font-semibold mb-2">
                    Approx. Blog Length
                    <span className="text-sm ml-2 font-bold text-blue-600">
                      {formData.userDefinedLength} words
                    </span>
                  </label>
                  <div className="relative mt-5">
                    <Slider
                      min={BLOG_CONFIG.LENGTH.MIN}
                      max={BLOG_CONFIG.LENGTH.MAX}
                      step={BLOG_CONFIG.LENGTH.STEP}
                      value={[formData.userDefinedLength]}
                      onValueChange={vals =>
                        setFormData({ ...formData, userDefinedLength: vals[0] })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-8 p-4 pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-sm font-semibold">Add Image</label>
                    <p className="text-xs text-slate-500 font-medium">
                      Search and add relevant images to your blogs
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id="add-image-toggle"
                      checked={formData.isCheckedGeneratedImages}
                      onCheckedChange={checked => {
                        setFormData(prev => ({
                          ...prev,
                          isCheckedGeneratedImages: checked,
                          imageSource: checked
                            ? prev.imageSource === "none"
                              ? "stock"
                              : prev.imageSource
                            : "none",
                        }))
                        setErrors(prev => ({ ...prev, numberOfImages: "", blogImages: "" }))
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
                      error={errors.blogImages}
                      showUpload={false}
                      numberOfImages={formData.numberOfImages}
                      onNumberChange={val =>
                        setFormData(prev => ({ ...prev, numberOfImages: val }))
                      }
                    />
                    {errors.numberOfImages && (
                      <p className="text-red-500 text-xs mt-1 font-bold italic">
                        {errors.numberOfImages}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <AiModelSelector
                value={formData.aiModel}
                onChange={modelId => {
                  setFormData(prev => ({ ...prev, aiModel: modelId }))
                  setErrors(prev => ({ ...prev, aiModel: "" }))
                }}
                showCostCutter={true}
                costCutterValue={formData.costCutter}
                onCostCutterChange={checked => {
                  setFormData(prev => ({ ...prev, costCutter: checked }))
                }}
                error={errors.aiModel}
              />

              <div className="pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-semibold">
                    Number of Blogs <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    How many blogs to generate based on the topics provided.
                  </p>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="numberOfBlogs"
                    min="1"
                    max={BLOG_CONFIG.BULK.MAX_BLOGS}
                    value={formData.numberOfBlogs === 0 ? "" : formData.numberOfBlogs}
                    onChange={handleInputChange}
                    onWheel={e => e.currentTarget.blur()}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.numberOfBlogs ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                    placeholder="e.g., 5"
                  />
                  {errors.numberOfBlogs && (
                    <p className="text-red-500 text-xs mt-1 font-bold italic">
                      {errors.numberOfBlogs}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-6 p-4 pt-0">
              {/* 1-4. AdvancedOptions Group A */}
              <AdvancedOptions
                formData={formData}
                updateFormData={updates => setFormData(prev => ({ ...prev, ...updates }))}
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
                updateFormData={updates => setFormData(prev => ({ ...prev, ...updates }))}
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
                updateFormData={updates => setFormData(prev => ({ ...prev, ...updates }))}
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
                }}
                onChange={val => {
                  setFormData(prev => ({
                    ...prev,
                    isCheckedBrand: val.isCheckedBrand,
                    brandId: val.brandId,
                    addCTA: val.addCTA,
                  }))
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
                      onCheckedChange={checked => {
                        const hasAnyIntegration =
                          Object.keys(integrations?.integrations || {}).length > 0
                        if (checked && !hasAnyIntegration) {
                          toast.error("Please connect your account in plugins.")
                          return
                        }
                        setFormData(prev => ({
                          ...prev,
                          wordpressPostStatus: checked,
                          postingType: checked
                            ? prev.postingType || Object.keys(integrations?.integrations || {})[0]
                            : null,
                        }))
                      }}
                    />
                  </div>
                </div>

                {formData.wordpressPostStatus &&
                  integrations?.integrations &&
                  Object.keys(integrations.integrations).length > 0 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="font-semibold text-sm">Publishing Platform</label>
                      <select
                        value={formData.postingType || ""}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, postingType: e.target.value }))
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
                          onCheckedChange={checked =>
                            setFormData(prev => ({ ...prev, includeTableOfContents: checked }))
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
              currentStep === 3 ? "sm:justify-between" : "sm:justify-end"
            }`}
          >
            {/* Cost Section */}
            {currentStep === 3 && (
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
                  onClick={handlePrev}
                  className="w-full sm:w-auto px-6 py-2 text-sm font-bold bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Previous
                </button>
              )}

              <button
                onClick={currentStep === 3 ? handleSubmit : handleNext}
                className="w-full sm:w-auto px-8 py-2 text-sm font-bold text-white bg-[#4C5BD6] rounded-md hover:bg-[#3B4BB8] transition"
              >
                {currentStep === 3 ? "Generate Blogs" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  )
}

export default BulkBlogModal
