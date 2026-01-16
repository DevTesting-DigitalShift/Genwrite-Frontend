import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { Info, TriangleAlert, Upload, X } from "lucide-react"
import { packages } from "@/data/templates"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { createMultiBlog } from "@store/slices/blogSlice"
import { computeCost } from "@/data/pricingConfig"
import { message, Modal, Select, Tooltip } from "antd"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getIntegrationsThunk } from "@store/slices/otherSlice"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { queryClient } from "@utils/queryClient"
import { IMAGE_SOURCE } from "@/data/blogData"
import { validateBulkBlogData } from "@/types/forms.schemas"

// Bulk Blog Modal Component - Updated with Outbound Links pricing
const BulkBlogModal = ({ closeFnc }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()
  const user = useSelector(state => state.auth.user)
  const { data: integrations } = useSelector(state => state.wordpress)
  const userPlan = user?.subscription?.plan || user?.plan
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const isAiImagesLimitReached = user?.usage?.aiImages >= user?.usageLimits?.aiImages
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [recentlyUploadedTopicsCount, setRecentlyUploadedTopicsCount] = useState(null)
  const [recentlyUploadedKeywordsCount, setRecentlyUploadedKeywordsCount] = useState(null)
  const { Option } = Select

  // Initial Form Data
  const initialFormData = {
    templates: [],
    templateIds: [],
    topics: [],
    keywords: [],
    topicInput: "",
    keywordInput: "",
    performKeywordResearch: true,
    tone: "",
    languageToWrite: "English",
    userDefinedLength: 1000,
    imageSource: IMAGE_SOURCE.STOCK,
    isCheckedBrand: false,
    useCompetitors: false,
    includeInterlinks: true,
    includeFaqs: true,
    numberOfBlogs: 1,
    numberOfImages: 0,
    wordpressPostStatus: false,
    postFrequency: 10 * 60,
    aiModel: "gemini",
    includeTableOfContents: false,
    isCheckedGeneratedImages: true,
    addOutBoundLinks: false,
    blogImages: [],
    postingType: null,
    brandId: null,
    addCTA: false,
    isDragging: false,
    costCutter: true,
  }

  const initialErrorsState = {
    templates: "",
    topics: "",
    topicsCSV: "",
    keywords: "",
    keywordsCSV: "",
    tone: "",
    integration: "",
    aiModel: "",
    numberOfBlogs: "",
    numberOfImages: "",
    blogImages: "",
    brandId: "",
  }

  const [errors, setErrors] = useState(initialErrorsState)

  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    dispatch(getIntegrationsThunk())
  }, [dispatch])

  useEffect(() => {
    if (isAiImagesLimitReached && formData.isCheckedGeneratedImages) {
      setFormData(prev => ({
        ...prev,
        isCheckedGeneratedImages: false,
        imageSource: IMAGE_SOURCE.STOCK,
      }))
      setErrors(prev => ({ ...prev, numberOfImages: false, blogImages: false }))
    }
  }, [isAiImagesLimitReached])

  // Memoized estimated cost calculation
  const estimatedCost = useMemo(() => {
    const features = []
    if (formData.isCheckedBrand) features.push("brandVoice")
    if (formData.useCompetitors) features.push("competitorResearch")
    if (formData.performKeywordResearch) features.push("keywordResearch")
    if (formData.includeInterlinks) features.push("internalLinking")
    if (formData.includeFaqs) features.push("faqGeneration")
    if (formData.wordpressPostStatus) features.push("automaticPosting")
    if (formData.addOutBoundLinks) features.push("outboundLinks")

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
      totalCost = Math.round(totalCost * 0.75)
    }

    return totalCost
  }, [
    formData.isCheckedBrand,
    formData.useCompetitors,
    formData.performKeywordResearch,
    formData.includeInterlinks,
    formData.includeFaqs,
    formData.wordpressPostStatus,
    formData.addOutBoundLinks,
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
        tone: !formData.tone ? "Please select a tone of voice." : "",
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
    setErrors(prev => ({
      ...prev,
      ...initialErrorsState,
    }))
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
      tone: !formData.tone ? "Please select a tone of voice." : "",
      integration:
        formData.wordpressPostStatus &&
        Object.keys(integrations?.integrations || {}).length > 0 &&
        !formData.postingType
          ? "Please select a publishing platform."
          : "",
      aiModel: !formData.aiModel ? "Please select an AI model." : "",
      numberOfBlogs:
        formData.numberOfBlogs < 1 || formData.numberOfBlogs > 10
          ? "Number of blogs must be between 1 and 10."
          : "",
      numberOfImages:
        formData.numberOfImages === "" ||
        formData.numberOfImages < 0 ||
        formData.numberOfImages > 20
          ? "Number of images must be between 0 and 20."
          : "",
      blogImages:
        formData.isCheckedGeneratedImages &&
        formData.imageSource === "customImage" &&
        formData.blogImages.length === 0
          ? "Please upload at least one custom image."
          : "",
      brandId: formData.isCheckedBrand && !formData.brandId ? "Please select a brand voice." : "",
    }

    setErrors(prev => ({ ...prev, ...newErrors }))

    if (Object.values(newErrors).some(error => error)) {
      // Find the step where the first error occurs
      const errorStep = newErrors.templates
        ? 0
        : newErrors.topics || newErrors.keywords || newErrors.tone
        ? 1
        : 2
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
      imageSource: formData.isCheckedGeneratedImages ? formData.imageSource : IMAGE_SOURCE.NONE,
    }
    const validatedData = validateBulkBlogData(finalData)

    const loadingId = showLoading(
      `Creating ${formData.numberOfBlogs} blog${formData.numberOfBlogs > 1 ? "s" : ""}...`
    )

    try {
      await dispatch(
        createMultiBlog({ blogData: validatedData, user, navigate, queryClient })
      ).unwrap()
      handleClose() // ✅ Only close on success
    } catch (error) {
      message.error(error?.message || "Failed to create blogs. Please try again.")
    } finally {
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
    if (type === "tel") {
      if (value === "") {
        val = ""
      } else {
        const parsed = parseInt(value, 10)
        if (isNaN(parsed)) {
          val = ""
        } else {
          val = parsed
          if (val < 0) val = 0
          if (name === "numberOfBlogs" && val > 10) val = 10
          if (name === "numberOfImages" && val > 20) val = 20
        }
      }
    } else {
      val = value
    }

    setFormData(prev => ({
      ...prev,
      [name]: val,
    }))
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleCheckboxChange = e => {
    const { name, checked } = e.target
    if (name === "wordpressPostStatus" && checked) {
      const hasAnyIntegration = Object.keys(integrations?.integrations || {}).length > 0
      if (!hasAnyIntegration) {
        setErrors(prev => ({
          ...prev,
          integration: "Please connect your account in plugins.",
        }))
        return
      }
    }
    setFormData(prev => ({
      ...prev,
      [name]: checked,
      postingType: name === "wordpressPostStatus" && !checked ? null : prev.postingType,
    }))
    if (name === "performKeywordResearch") {
      setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
    }
    if (name === "wordpressPostStatus") {
      setErrors(prev => ({ ...prev, integration: "" }))
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

  const handleAddTopic = () => {
    const inputValue = formData.topicInput.trim()
    if (inputValue === "") {
      setErrors(prev => ({ ...prev, topics: "Please enter a topic." }))
      return false
    }

    const existing = formData.topics.map(t => t.toLowerCase().trim())
    const newTopics = inputValue
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "" && !existing.includes(t.toLowerCase()))

    if (newTopics.length === 0) {
      setErrors(prev => ({
        ...prev,
        topics: "Please enter valid, non-duplicate topics separated by commas.",
      }))
      setFormData(prev => ({ ...prev, topicInput: "" }))
      return false
    }

    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, ...newTopics],
      topicInput: "",
    }))
    setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
    return true
  }

  const handleRemoveTopic = index => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }))
    setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
  }

  const handleAddKeyword = () => {
    const inputValue = formData.keywordInput.trim()
    if (inputValue === "") {
      setErrors(prev => ({ ...prev, keywords: "Please enter a keyword." }))
      return false
    }

    const existing = formData.keywords.map(k => k.toLowerCase().trim())
    const newKeywords = inputValue
      .split(",")
      .map(k => k.trim())
      .filter(k => k !== "" && !existing.includes(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors(prev => ({
        ...prev,
        keywords: "Please enter valid, non-duplicate keywords separated by commas.",
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
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }))
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
    setFormData(prev => ({
      ...prev,
      postingType: platform,
    }))
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
      setErrors(prev => ({
        ...prev,
        topicsCSV: "Invalid file type. Please upload a .csv file.",
      }))
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
        setErrors(prev => ({
          ...prev,
          topicsCSV: "No valid topics found in the CSV file.",
        }))
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

      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, ...uniqueNewItems],
      }))
      setErrors(prev => ({ ...prev, topics: "", topicsCSV: "" }))
      setRecentlyUploadedTopicsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedTopicsCount(null), 5000)
    }

    reader.onerror = () => {
      setErrors(prev => ({
        ...prev,
        topicsCSV: "An error occurred while reading the CSV file.",
      }))
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
      setErrors(prev => ({
        ...prev,
        keywordsCSV: "Invalid file type. Please upload a .csv file.",
      }))
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
        setErrors(prev => ({
          ...prev,
          keywordsCSV: "No valid keywords found in the CSV file.",
        }))
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

      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, ...uniqueNewItems],
      }))
      setErrors(prev => ({ ...prev, keywords: "", keywordsCSV: "" }))
      setRecentlyUploadedKeywordsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedKeywordsCount(null), 5000)
    }

    reader.onerror = () => {
      setErrors(prev => ({
        ...prev,
        keywordsCSV: "An error occurred while reading the CSV file.",
      }))
    }

    reader.readAsText(file)
    e.target.value = null
  }

  const validateImages = files => {
    const maxImages = 15
    const maxSize = 5 * 1024 * 1024 // 5 MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

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
        setErrors(prev => ({
          ...prev,
          blogImages: `"${file.name}" exceeds the 5 MB size limit.`,
        }))
        return false
      }
      return true
    })

    const totalImages = formData.blogImages.length + validFiles.length
    if (totalImages > maxImages) {
      setErrors(prev => ({
        ...prev,
        blogImages: `Cannot upload more than ${maxImages} images.`,
      }))
      return validFiles.slice(0, maxImages - formData.blogImages.length)
    }

    return validFiles
  }

  const handleFileChange = e => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        blogImages: [...prev.blogImages, ...validFiles],
      }))
      setErrors(prev => ({ ...prev, blogImages: "" }))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const steps = ["Select Templates", "Add Details", "Blog Options"]

  return (
    <>
      {" "}
      <Modal
        title={`Step ${currentStep + 1}: ${steps[currentStep]}`}
        open={true}
        onCancel={handleClose}
        footer={
          <div className="flex items-center justify-between w-full">
            {currentStep === 2 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-bold text-blue-600">{estimatedCost} credits</span>
                {formData.costCutter && (
                  <span className="text-xs text-green-600 font-medium">(-25% off)</span>
                )}
                <span className="text-xs text-gray-500">
                  ({formData.numberOfBlogs} blog{formData.numberOfBlogs > 1 ? "s" : ""})
                </span>
              </div>
            )}
            <div className={`flex gap-3 ${currentStep !== 2 ? "w-full justify-end" : ""}`}>
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                >
                  Previous
                </button>
              )}
              <button
                onClick={currentStep === 2 ? handleSubmit : handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1B6FC9] rounded-md hover:bg-[#1B6FC9]/90 focus:outline-none"
              >
                {currentStep === 2 ? "Generate Blogs" : "Next"}
              </button>
            </div>
          </div>
        }
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <div className="p-2 md:p-4 max-h-[80vh] overflow-y-auto">
          {currentStep === 0 && (
            <div
              className={`p-3 md:p-0 ${
                errors.templates ? "border-2 border-red-500 rounded-lg" : ""
              }`}
            >
              <TemplateSelection
                numberOfSelection={3}
                userSubscriptionPlan={user?.subscription?.plan ?? "free"}
                preSelectedIds={formData.templateIds}
                onClick={handlePackageSelect}
              />
              <p
                className={`text-sm ${
                  errors?.templates ? "text-red-500" : "text-gray-600"
                }  my-3 sm:mb-4 px-4`}
              >
                {errors?.templates
                  ? errors.templates
                  : "Select up to 3 templates for the types of blogs you want to generate."}
              </p>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  Topics <span className="text-red-500">*</span>
                  <Tooltip title="Upload a .csv file in the format: `Topics` as header">
                    <div className="cursor-pointer">
                      <Info size={16} className="text-blue-500" />
                    </div>
                  </Tooltip>
                </label>
                <p className="text-xs text-gray-500 mb-2">Enter the main topics for your blogs.</p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={formData.topicInput}
                    onChange={handleTopicInputChange}
                    onKeyDown={handleTopicKeyPress}
                    className={`w-full px-3 py-2 border rounded-md text-sm bg-gray-50 ${
                      errors.topics ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g., digital marketing trends, AI in business"
                  />
                  <button
                    onClick={handleAddTopic}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                  >
                    Add
                  </button>
                  <label
                    className={`flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center justify-center gap-1 hover:bg-gray-200 ${
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
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(actualIndex)}
                          className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                  {(formData.topics.length > 18 || recentlyUploadedTopicsCount) && (
                    <span
                      onClick={() => setShowAllTopics(prev => !prev)}
                      className="cursor-pointer text-xs font-medium text-blue-600 self-center flex items-center gap-1"
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
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Keywords <span className="text-red-500">*</span>
                      <Tooltip title="Upload a .csv file in the format: `Keywords` as header">
                        <div className="cursor-pointer">
                          <Info size={16} className="text-blue-500" />
                        </div>
                      </Tooltip>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.keywordInput}
                        onChange={handleKeywordInputChange}
                        onKeyDown={handleTopicKeyPress}
                        className={`flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50 ${
                          errors.keywords ? "border-red-500" : "border-gray-300"
                        } focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., digital marketing trends, AI in business"
                      />
                      <button
                        onClick={handleAddKeyword}
                        className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                      >
                        Add
                      </button>
                      <label
                        className={`px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200 ${
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
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(actualIndex)}
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
                          className="cursor-pointer text-xs font-medium text-blue-600 self-center flex items-center gap-1"
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
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                    Tone of Voice <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    value={formData.tone}
                    onChange={value => {
                      setFormData(prev => ({ ...prev, tone: value }))
                      setErrors(prev => ({ ...prev, tone: "" }))
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
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Language <span className="text-red-500">*</span>
                  </label>
                  <Select
                    className="w-full"
                    value={formData.languageToWrite}
                    onChange={value => {
                      setFormData(prev => ({ ...prev, languageToWrite: value }))
                    }}
                    placeholder="Select language"
                  >
                    <Option value="English">English</Option>
                    <Option value="Spanish">Spanish</Option>
                    <Option value="German">German</Option>
                    <Option value="French">French</Option>
                    <Option value="Italian">Italian</Option>
                    <Option value="Portuguese">Portuguese</Option>
                    <Option value="Dutch">Dutch</Option>
                    <Option value="Japanese">Japanese</Option>
                  </Select>
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
                      value={formData.userDefinedLength}
                      className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-[#1B6FC9] to-gray-100 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                      style={{
                        background: `linear-gradient(to right, #1B6FC9 ${
                          ((formData.userDefinedLength - 500) / 4500) * 100
                        }%, #E5E7EB ${((formData.userDefinedLength - 500) / 4500) * 100}%)`,
                      }}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          userDefinedLength: parseInt(e.target.value, 10),
                        }))
                      }}
                    />
                    <span className="mt-2 text-sm text-gray-600 block">
                      {formData.userDefinedLength} words
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select AI Model <span className="text-red-500">*</span>
                </label>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${
                    errors.aiModel ? "border-2 border-red-500 rounded-lg p-2" : ""
                  }`}
                >
                  {[
                    {
                      id: "gemini",
                      label: "Gemini",
                      logo: "/Images/gemini.webp",
                      restricted: false,
                    },
                    {
                      id: "openai",
                      label: "ChatGPT",
                      logo: "/Images/chatgpt.webp",
                      restricted: userPlan === "free",
                    },
                    {
                      id: "claude",
                      label: "Claude",
                      logo: "/Images/claude.webp",
                      restricted: userPlan === "free" || userPlan === "basic",
                    },
                  ].map(model => (
                    <label
                      key={model.id}
                      htmlFor={model.id}
                      className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                        formData.aiModel === model.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300"
                      } hover:shadow-sm ${model.restricted ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={e => {
                        if (model.restricted) {
                          e.preventDefault()
                          // Assuming openUpgradePopup is defined elsewhere
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
                            setFormData(prev => ({
                              ...prev,
                              aiModel: e.target.value,
                            }))
                            setErrors(prev => ({ ...prev, aiModel: "" }))
                          }
                        }}
                        className="hidden"
                        disabled={model.restricted}
                      />
                      <img src={model.logo} alt={model.label} className="w-6 h-6 object-contain" />
                      <span className="text-sm font-medium text-gray-800">{model.label}</span>
                    </label>
                  ))}
                </div>
                {errors.aiModel && <p className="text-red-500 text-xs mt-1">{errors.aiModel}</p>}
              </div>

              {/* Cost Cutter Toggle */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-1">💰 Cost Cutter</h3>
                    <p className="text-xs text-green-700">Use AI Flash model for 25% savings</p>
                  </div>
                  <label
                    htmlFor="bulk-cost-cutter-toggle"
                    className="relative inline-block w-12 h-6"
                  >
                    <input
                      type="checkbox"
                      id="bulk-cost-cutter-toggle"
                      className="sr-only peer"
                      checked={formData.costCutter || false}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          costCutter: e.target.checked,
                        }))
                      }}
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-all duration-300 ${
                        formData.costCutter ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-300 shadow-md ${
                        formData.costCutter ? "translate-x-6" : ""
                      }`}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Add Image</label>
                <div className="flex items-center">
                  <label
                    htmlFor="add-image-toggle"
                    className={`relative inline-block w-12 h-6 ${
                      isAiImagesLimitReached ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="add-image-toggle"
                      className="sr-only peer"
                      checked={formData.isCheckedGeneratedImages}
                      disabled={isAiImagesLimitReached}
                      onChange={e => {
                        if (isAiImagesLimitReached) {
                          openUpgradePopup({ featureName: "AI-Generated Images", navigate })
                          return
                        }
                        const checked = e.target.checked
                        setFormData(prev => ({
                          ...prev,
                          isCheckedGeneratedImages: checked,
                          imageSource: checked ? prev.imageSource : "unsplash",
                        }))
                        setErrors(prev => ({
                          ...prev,
                          numberOfImages: "",
                          blogImages: "",
                        }))
                      }}
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-all duration-300 ${
                        formData.isCheckedGeneratedImages && !isAiImagesLimitReached
                          ? "bg-[#1B6FC9]"
                          : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-300 ${
                        formData.isCheckedGeneratedImages && !isAiImagesLimitReached
                          ? "translate-x-6"
                          : ""
                      }`}
                    />
                  </label>
                  {isAiImagesLimitReached && (
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
              {formData.isCheckedGeneratedImages && !isAiImagesLimitReached && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Image Source
                  </label>
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                      errors.blogImages && formData.imageSource === "customImage"
                        ? "border-2 border-red-500 rounded-lg p-2"
                        : ""
                    }`}
                  >
                    {[
                      {
                        id: "unsplash",
                        label: "Stock Images",
                        value: "unsplash",
                        restricted: false,
                      },
                      {
                        id: "ai",
                        label: "AI Generated",
                        value: "ai",
                        restricted: userPlan === "free",
                      },
                    ].map(source => (
                      <label
                        key={source.id}
                        htmlFor={source.id}
                        className={`border rounded-lg px-4 py-3 flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 ${
                          formData.imageSource === source.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300"
                        } hover:shadow-sm ${
                          source.restricted ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={e => {
                          if (source.restricted) {
                            e.preventDefault()
                            openUpgradePopup({ featureName: source.label, navigate })
                          }
                        }}
                      >
                        <input
                          type="radio"
                          id={source.id}
                          name="imageSource"
                          value={source.value}
                          checked={formData.imageSource === source.value}
                          onChange={() => {
                            if (!source.restricted) {
                              handleImageSourceChange(source.value)
                            }
                          }}
                          className="hidden"
                          disabled={source.restricted}
                        />
                        <span className="text-sm font-medium text-gray-800">{source.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-4 w-full">
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
                      value={formData.numberOfImages}
                      onChange={handleInputChange}
                      onWheel={e => e.currentTarget.blur()}
                      className={`w-full px-4 py-2 border rounded-lg text-sm placeholder-gray-400 transition ${
                        errors.numberOfImages ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., 5"
                    />
                    {errors.numberOfImages && (
                      <p className="text-red-500 text-xs mt-1">{errors.numberOfImages}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <BrandVoiceSelector
                  label="Write with Brand Voice"
                  size="large"
                  labelClass="text-sm font-medium text-gray-700"
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
                    setErrors(prev => ({ ...prev, brandId: "" }))
                  }}
                  errorText={errors.brandId}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include Interlinks
                    <p className="text-xs text-gray-500">
                      Attempt to link between generated blogs if relevant.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeInterlinks"
                      checked={formData.includeInterlinks}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include FAQ Section
                    <p className="text-xs text-gray-500">
                      Generate relevant FAQ questions and answers for the blog.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeFaqs"
                      checked={formData.includeFaqs}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-gray-700">
                  Enable Automatic Posting
                  <p className="text-xs text-gray-500">
                    Automatically post blogs on the selected dates.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="wordpressPostStatus"
                    checked={formData.wordpressPostStatus}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
                </label>
              </div>
              {formData.wordpressPostStatus &&
                integrations?.integrations &&
                Object.keys(integrations.integrations).length > 0 && (
                  <div
                    className={`${
                      errors.integration ? "border-2 border-red-500 rounded-lg p-2" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      Select Your Publishing Platform <span className="text-red-500">*</span>
                      <p className="text-xs text-gray-500">
                        Post your blog automatically to connected platforms only.
                      </p>
                    </span>
                    <Select
                      className="w-full mt-2"
                      placeholder="Select platform"
                      value={formData.postingType}
                      onChange={handleIntegrationChange}
                      status={errors.integration ? "error" : ""}
                    >
                      <Option value={null}>Select Platform</Option>
                      {Object.entries(integrations.integrations).map(([platform]) => (
                        <Option key={platform} value={platform}>
                          {platform}
                        </Option>
                      ))}
                    </Select>
                    {errors.integration && (
                      <p className="text-red-500 text-xs mt-1">{errors.integration}</p>
                    )}
                  </div>
                )}
              {formData.wordpressPostStatus && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">
                    Include Table of Contents
                    <p className="text-xs text-gray-500">
                      Generate a table of contents for each blog.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeTableOfContents"
                      checked={formData.includeTableOfContents}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
                  </label>
                </div>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-gray-700">
                  Enable Competitive Research
                  <p className="text-xs text-gray-500">
                    Perform competitive research to analyze similar blogs.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="useCompetitors"
                    checked={formData.useCompetitors}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]"></div>
                </label>
              </div>
              {formData.useCompetitors && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-700">
                    Show Outbound Links
                    <p className="text-xs text-gray-500">
                      Display outbound links found during competitor analysis.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="addOutBoundLinks"
                      checked={formData.addOutBoundLinks}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
                  </label>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Blogs <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    How many blogs to generate based on the topics provided.
                  </p>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="numberOfBlogs"
                    min="1"
                    max="10"
                    value={formData.numberOfBlogs === 0 ? "" : formData.numberOfBlogs}
                    onChange={handleInputChange}
                    onWheel={e => e.currentTarget.blur()}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.numberOfBlogs ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g., 5"
                  />
                  {errors.numberOfBlogs && (
                    <p className="text-red-500 text-xs mt-1">{errors.numberOfBlogs}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

export default BulkBlogModal
