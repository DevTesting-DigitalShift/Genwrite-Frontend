import { useEffect, useState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { Info, TriangleAlert, Upload, X } from "lucide-react"
import { packages } from "@/data/templates"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { createMultiBlog } from "@store/slices/blogSlice"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { Modal, Select, Tooltip, message } from "antd"
import { fetchBrands } from "@store/slices/brandSlice"
import { useQuery } from "@tanstack/react-query"
import { getIntegrationsThunk } from "@store/slices/otherSlice"

const MultiStepModal = ({ closeFnc }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const { data: integrations } = useSelector((state) => state.wordpress)
  const userPlan = user?.subscription?.plan || user?.plan
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const isAiImagesLimitReached = user?.usage?.aiImages >= user?.usageLimits?.aiImages
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [recentlyUploadedTopicsCount, setRecentlyUploadedTopicsCount] = useState(null)
  const [recentlyUploadedKeywordsCount, setRecentlyUploadedKeywordsCount] = useState(null)
  const { Option } = Select
  const [errors, setErrors] = useState({
    topics: false,
    keywords: false,
    tone: false,
    integration: false, // New error for integration selection
  })

  const [formData, setFormData] = useState({
    templates: [],
    topics: [],
    keywords: [],
    topicInput: "",
    keywordInput: "",
    performKeywordResearch: true,
    tone: "",
    numberOfCounts: 5,
    userDefinedLength: 1000,
    imageSource: "unsplash",
    useBrandVoice: true,
    useCompetitors: false,
    includeInterlinks: true,
    includeMetaHeadlines: true,
    includeFaqs: true,
    numberOfBlogs: 1,
    numberOfImages: 0,
    wordpressPostStatus: false,
    postFrequency: 10 * 60,
    selectedDates: null,
    aiModel: "gemini",
    includeTableOfContents: false,
    isCheckedGeneratedImages: true,
    addOutBoundLinks: false,
    blogImages: [],
    selectedIntegration: null, // New field for selected integration
  })

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
    enabled: formData.isCheckedBrand,
  })

  useEffect(() => {
    dispatch(getIntegrationsThunk())
  }, [dispatch])

  useEffect(() => {
    // Fire message if brand voices array is empty
    if (formData.isCheckedBrand && (!brands || brands.length === 0)) {
      message.warning("No brand voices available. Create one to get started.", 3)
    }
  }, [formData.isCheckedBrand, brands])

  useEffect(() => {
    if (isAiImagesLimitReached && formData.isCheckedGeneratedImages) {
      setFormData((prev) => ({
        ...prev,
        isCheckedGeneratedImages: false,
        imageSource: "unsplash",
      }))
    }
  }, [isAiImagesLimitReached, formData.isCheckedGeneratedImages])

  const handleNext = () => {
    if (currentStep === 0) {
      if (formData.templates.length === 0) {
        message.error("Please add at least one template.")
        return
      }
    }
    if (currentStep === 1) {
      const newErrors = {
        topics: formData.topics.length === 0 && formData.topicInput.trim() === "",
        keywords:
          !formData.performKeywordResearch &&
          formData.keywords.length === 0 &&
          formData.keywordInput.trim() === "",
        tone: !formData.tone,
        integration: false,
      }
      setErrors(newErrors)
      if (Object.values(newErrors).some((error) => error)) {
        message.error("Please fill all required fields in this step.")
        return
      }
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleClose = () => {
    closeFnc()
  }

  const handleSubmit = () => {
    const newErrors = {
      topics: formData.topics.length === 0 && formData.topicInput.trim() === "",
      keywords:
        !formData.performKeywordResearch &&
        formData.keywords.length === 0 &&
        formData.keywordInput.trim() === "",
      tone: !formData.tone,
      integration:
        formData.wordpressPostStatus &&
        Object.keys(integrations).length > 0 &&
        !formData.selectedIntegration,
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      message.error("Please fill all required fields.")
      return
    }

    if (formData.numberOfBlogs < 1 || formData.numberOfBlogs > 10) {
      message.error("Number of blogs must be between 1 and 10.")
      return
    }

    const model = formData.aiModel || "gemini"
    const blogCost = getEstimatedCost("blog.single", model)
    const totalCost = formData.numberOfBlogs * blogCost

    handlePopup({
      title: "Bulk Blog Generation",
      description: (
        <>
          <span>
            Estimated cost for <b>{formData.numberOfBlogs}</b> blog
            {formData.numberOfBlogs > 1 ? "s" : ""}: <b>{totalCost} credits</b>
          </span>
          <br />
          <span>Do you want to continue?</span>
        </>
      ),
      onConfirm: () => {
        dispatch(createMultiBlog({ blogData: formData, user, navigate }))
        handleClose()
      },
    })
  }

  const handlePackageSelect = (index) => {
    const selectedPackageName = packages[index].name
    const isSelected = formData.templates.includes(selectedPackageName)

    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        templates: prev.templates.filter((name) => name !== selectedPackageName),
      }))
    } else if (formData.templates.length < 3) {
      setFormData((prev) => ({
        ...prev,
        templates: [...prev.templates, selectedPackageName],
      }))
    } else {
      message.error("You can select a maximum of 3 templates.")
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const val = type === "number" ? parseInt(value, 10) || 0 : value
    setFormData({
      ...formData,
      [name]: val,
    })
  }

  const handleCheckboxChange = async (e) => {
    const { name, checked } = e.target
    if (name === "wordpressPostStatus" && checked) {
      const hasAnyIntegration = Object.keys(integrations?.integrations || {}).length > 0

      if (!hasAnyIntegration) {
        message.error("Please connect your account in plugins.")
        return
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
      // Reset selectedIntegration if disabling wordpressPostStatus
      selectedIntegration:
        name === "wordpressPostStatus" && !checked ? null : prev.selectedIntegration,
    }))
    if (name === "performKeywordResearch") {
      setErrors((prev) => ({ ...prev, keywords: false }))
    }
  }

  const handleTopicInputChange = (e) => {
    setFormData((prev) => ({ ...prev, topicInput: e.target.value }))
    setErrors((prev) => ({ ...prev, topics: false }))
  }

  const handleKeywordInputChange = (e) => {
    setFormData((prev) => ({ ...prev, keywordInput: e.target.value }))
    setErrors((prev) => ({ ...prev, keywords: false }))
  }

  const handleAddTopic = () => {
    const inputValue = formData.topicInput
    if (inputValue.trim() === "") {
      setErrors((prev) => ({ ...prev, topics: true }))
      message.error("Please enter a topic.")
      return false
    }

    const existing = formData.topics.map((t) => t.toLowerCase().trim())
    const newTopics = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "" && !existing.includes(t.toLowerCase()))

    if (newTopics.length === 0) {
      setErrors((prev) => ({ ...prev, topics: true }))
      setFormData((prev) => ({ ...prev, topicInput: "" }))
      return false
    }

    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, ...newTopics],
      topicInput: "",
    }))
    setErrors((prev) => ({ ...prev, topics: false }))
    return true
  }

  const handleRemoveTopic = (index) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }))
  }

  const handleAddKeyword = () => {
    const inputValue = formData.keywordInput
    if (inputValue.trim() === "") {
      setErrors((prev) => ({ ...prev, keywords: true }))
      message.error("Please enter a keyword.")
      return false
    }

    const existing = formData.keywords.map((k) => k.toLowerCase().trim())
    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "" && !existing.includes(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors((prev) => ({ ...prev, keywords: true }))
      message.error("Please enter valid, non-duplicate keywords separated by commas.")
      setFormData((prev) => ({ ...prev, keywordInput: "" }))
      return false
    }

    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, ...newKeywords],
      keywordInput: "",
    }))
    setErrors((prev) => ({ ...prev, keywords: false }))
    return true
  }

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }))
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
    setFormData((prev) => ({ ...prev, imageSource: source }))
  }

  const handleIntegrationChange = (platform, url) => {
    setFormData((prev) => ({
      ...prev,
      selectedIntegration: { platform, url },
    }))
    setErrors((prev) => ({ ...prev, integration: false }))
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
      if (!text || typeof text !== "string") {
        message.error("Failed to read the CSV file. Please ensure it is valid.")
        return
      }

      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        message.error("The CSV file is empty. Please provide a valid CSV with topics.")
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
        message.warning("No valid topics found in the CSV file.")
        return
      }

      const existing = formData.topics.map((t) => t.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter((item) => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        message.warning(
          "No new topics found in the CSV. All provided items are either duplicates or already exist."
        )
        return
      }

      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, ...uniqueNewItems],
      }))
      setErrors((prev) => ({ ...prev, topics: false }))

      message.success(`${uniqueNewItems.length} new topics added from CSV.`)

      setRecentlyUploadedTopicsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedTopicsCount(null), 5000)
    }
    reader.onerror = () => {
      message.error("An error occurred while reading the CSV file.")
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
      if (!text || typeof text !== "string") {
        message.error("Failed to read the CSV file. Please ensure it is valid.")
        return
      }

      let lines = text.trim().split(/\r?\n/)
      if (lines.length === 0) {
        message.error("The CSV file is empty. Please provide a valid CSV with keywords.")
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
        message.warning("No valid keywords found in the CSV file.")
        return
      }

      const existing = formData.keywords.map((k) => k.toLowerCase().trim())
      const seen = new Set()
      const uniqueNewItems = items.filter((item) => {
        const lower = item.toLowerCase().trim()
        if (!item || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

      if (uniqueNewItems.length === 0) {
        message.warning(
          "No new keywords found in the CSV. All provided items are either duplicates or already exist."
        )
        return
      }

      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, ...uniqueNewItems],
      }))
      setErrors((prev) => ({ ...prev, keywords: false }))

      message.success(`${uniqueNewItems.length} new keywords added from CSV.`)

      setRecentlyUploadedKeywordsCount(uniqueNewItems.length)
      setTimeout(() => setRecentlyUploadedKeywordsCount(null), 5000)
    }
    reader.onerror = () => {
      message.error("An error occurred while reading the CSV file.")
    }
    reader.readAsText(file)
    e.target.value = null
  }

  const validateImages = (files) => {
    const maxImages = 15
    const maxSize = 5 * 1024 * 1024 // 5 MB in bytes
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (!files || files.length === 0) return []

    const validFiles = Array.from(files).filter((file) => {
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

    const totalImages = formData.blogImages.length + validFiles.length
    if (totalImages > maxImages) {
      message.error(`Cannot upload more than ${maxImages} images.`)
      return validFiles.slice(0, maxImages - formData.blogImages.length)
    }

    return validFiles
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        blogImages: [...prev.blogImages, ...validFiles],
      }))
      message.success(`${validFiles.length} image(s) added successfully!`)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFormData((prev) => ({ ...prev, isDragging: false }))

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const validFiles = validateImages(files)
    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        blogImages: [...prev.blogImages, ...validFiles],
      }))
      message.success(`${validFiles.length} image(s) added successfully!`)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFormData((prev) => ({ ...prev, isDragging: true }))
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFormData((prev) => ({ ...prev, isDragging: false }))
  }

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      blogImages: prev.blogImages.filter((_, i) => i !== index),
    }))
  }

  const steps = ["Select Template's", "Add Details", "Blog Options"]

  return (
    <Modal
      title={`Step ${currentStep + 1} : ${steps[currentStep]}`}
      open={true}
      onCancel={handleClose}
      footer={
        <div className="flex justify-end gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Previous
            </button>
          )}
          <button
            onClick={currentStep === 2 ? handleSubmit : handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1B6FC9] rounded-md hover:bg-[#1B6FC9]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {currentStep === 2 ? "Generate Blogs" : "Next"}
          </button>
        </div>
      }
      width={800}
      centered
      transitionName=""
      maskTransitionName=""
    >
      <div className="p-2 md:p-4 max-h-[80vh] overflow-y-auto">
        {currentStep === 0 && (
          <div className="p-3 md:p-0">
            <p className="text-sm text-gray-600 mb-3 sm:mb-4">
              Select up to 3 templates for the types of blogs you want to generate.
            </p>
            <div className="sm:hidden grid grid-cols-2 gap-4">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.name}
                  className={`cursor-pointer transition-all duration-200 w-full ${
                    formData.templates.includes(pkg.name)
                      ? "border-gray-300 border-2 rounded-lg"
                      : ""
                  }`}
                  onClick={() => handlePackageSelect(index)}
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
            <div className="hidden sm:block">
              <Carousel className="flex flex-row gap-4">
                {packages.map((pkg, index) => (
                  <div
                    key={pkg.name}
                    className={`cursor-pointer transition-all duration-200 w-full ${
                      formData.templates.includes(pkg.name)
                        ? "border-gray-300 border-2 rounded-lg"
                        : ""
                    }`}
                    onClick={() => handlePackageSelect(index)}
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
                  className={`w-full px-3 py-2 border ${
                    errors.topics ? "border-red-500" : "border-gray-300"
                  } rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50`}
                  placeholder="e.g., digital marketing trends, AI in business"
                />
                <button
                  onClick={handleAddTopic}
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                >
                  Add
                </button>
                <label className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center justify-center gap-1 hover:bg-gray-200">
                  <Upload size={16} />
                  <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
                </label>
              </div>
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
                    onClick={() => setShowAllTopics((prev) => !prev)}
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
                      className={`flex-1 px-3 py-2 border ${
                        errors.keywords ? "border-red-500" : "border-gray-300"
                      } rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50`}
                      placeholder="e.g., digital marketing trends, AI in business"
                    />
                    <button
                      onClick={handleAddKeyword}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm hover:bg-[#1B6FC9]/90"
                    >
                      Add
                    </button>
                    <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                      <Upload size={16} />
                      <input type="file" accept=".csv" onChange={handleCSVKeywordUpload} hidden />
                    </label>
                  </div>
                  {errors.keywords && (
                    <p className="mt-1 text-sm text-red-500">Please add at least one keyword</p>
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
                        onClick={() => setShowAllKeywords((prev) => !prev)}
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
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, tone: value }))
                    setErrors((prev) => ({ ...prev, tone: false }))
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
                    onChange={(e) => {
                      setFormData((prev) => ({
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
                Select AI Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "gemini",
                    label: "Gemini",
                    logo: "/Images/gemini.png",
                    restricted: false,
                  },
                  {
                    id: "chatgpt",
                    label: "ChatGPT",
                    logo: "/Images/chatgpt.png",
                    restricted: userPlan === "free",
                  },
                  {
                    id: "claude",
                    label: "Claude",
                    logo: "/Images/claude.png",
                    restricted: userPlan === "free" || userPlan === "basic",
                  },
                ].map((model) => (
                  <label
                    key={model.id}
                    htmlFor={model.id}
                    className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                      formData.aiModel === model.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    } hover:shadow-sm`}
                  >
                    <input
                      type="radio"
                      id={model.id}
                      name="aiModel"
                      value={model.id}
                      checked={formData.aiModel === model.id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          aiModel: e.target.value,
                        }))
                      }
                      className="hidden"
                    />
                    <img src={model.logo} alt={model.label} className="w-6 h-6 object-contain" />
                    <span className="text-sm font-medium text-gray-800">{model.label}</span>
                  </label>
                ))}
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
                    onChange={(e) => {
                      if (isAiImagesLimitReached) {
                        openUpgradePopup({ featureName: "AI-Generated Images", navigate })
                        return
                      }
                      const checked = e.target.checked
                      setFormData((prev) => ({
                        ...prev,
                        isCheckedGeneratedImages: checked,
                        imageSource: checked ? prev.imageSource : "unsplash",
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
            {formData.isCheckedGeneratedImages &&
              !formData.isCheckedblogImages &&
              !isAiImagesLimitReached && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Image Source
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    ].map((source) => (
                      <label
                        key={source.id}
                        htmlFor={source.id}
                        className={`border rounded-lg px-4 py-3 flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 ${
                          formData.imageSource === source.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300"
                        } hover:shadow-sm`}
                      >
                        <input
                          type="radio"
                          id={source.id}
                          name="imageSource"
                          value={source.value}
                          checked={formData.imageSource === source.value}
                          onChange={() => handleImageSourceChange(source.value)}
                          className="hidden"
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
                      max="20"
                      value={formData.numberOfImages}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 transition"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
              )}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Write with Brand Voice</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isCheckedBrand && brands?.length > 0}
                      onChange={() => {
                        if (!brands || brands.length === 0) {
                          message.warning(
                            "No brand voices available. Create one to enable this option.",
                            3
                          )
                          return
                        }
                        setFormData((prev) => ({
                          ...prev,
                          isCheckedBrand: !prev.isCheckedBrand,
                          brandId: null,
                        }))
                      }}
                      className="sr-only peer"
                      aria-checked={formData.isCheckedBrand && brands?.length > 0}
                    />

                    <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
                  </label>
                </div>
                {formData.isCheckedBrand && (
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
                                formData.brandId === voice._id
                                  ? "bg-blue-100 border-blue-300"
                                  : "bg-white border border-gray-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="selectedBrandVoice"
                                value={voice._id}
                                checked={formData.brandId === voice._id}
                                onChange={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    brandId: voice._id,
                                  }))
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
                {formData.isCheckedBrand && (
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium text-gray-700">Add CTA at the End</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.addCTA}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            addCTA: !prev.addCTA,
                          }))
                        }}
                        className="sr-only peer"
                        aria-checked={formData.addCTA}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
                    </label>
                  </div>
                )}
              </div>
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
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Select Your Publishing Platform
                    <p className="text-xs text-gray-500">
                      Post your blog automatically to connected platforms only.
                    </p>
                  </span>

                  <Select
                    className="w-full mt-2"
                    placeholder="Select platform"
                    value={formData.selectedIntegration?.platform || undefined}
                    onChange={(platform) => {
                      const details = integrations.integrations[platform]
                      handleIntegrationChange(platform, details.url)
                    }}
                  >
                    {Object.entries(integrations.integrations).map(([platform, details]) => (
                      <Option key={platform} value={platform}>
                        {platform}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}

            {formData.wordpressPostStatus && (
              <div className="flex items-center justify-between py-2 border-b">
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
                  Number of Blogs
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
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default MultiStepModal
