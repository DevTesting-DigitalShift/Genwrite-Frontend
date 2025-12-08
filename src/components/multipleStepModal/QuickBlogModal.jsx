import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { createNewQuickBlog } from "../../store/slices/blogSlice"
import { selectUser } from "@store/slices/authSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { computeCost } from "@/data/pricingConfig"
import { message, Modal, Tooltip } from "antd"
import { Plus, X, Crown } from "lucide-react" // Added Crown icon
import Carousel from "./Carousel"
import { packages } from "@/data/templates"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { useQueryClient } from "@tanstack/react-query"

// Quick Blog Modal Component - Updated pricing calculation
const QuickBlogModal = ({ type = "quick", closeFnc }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [otherLinks, setOtherLinks] = useState([])

  const initialFormData = {
    topic: "",
    performKeywordResearch: false,
    addImages: false,
    imageSource: "unsplash",
    template: null,
    templateIds: [],
    keywords: [],
    focusKeywords: [],
    otherLinkInput: "",
    focusKeywordInput: "",
    keywordInput: "",
    languageToWrite: "English",
    costCutter: false,
  }

  const initialErrors = {
    topic: "",
    template: "",
    focusKeywords: "",
    keywords: "",
    otherLinks: "",
  }

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState(initialErrors)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(selectUser)
  const queryClient = useQueryClient()

  // Check if user has a pro subscription
  const isProUser = user?.subscription?.plan === "pro"

  // Handle navigation to the next step
  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.template) {
        setErrors(prev => ({ ...prev, template: "Please select a template." }))
        return
      }
      setErrors(prev => ({ ...prev, template: "" }))
      setCurrentStep(1)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setFormData(initialFormData)
    setOtherLinks([])
    setErrors(initialErrors)
    closeFnc()
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = {
      topic: !formData.topic.trim() ? "Please enter a topic." : "",
      focusKeywords:
        !formData.performKeywordResearch && formData.focusKeywords.length === 0
          ? "Please add at least one focus keyword."
          : "",
      keywords:
        !formData.performKeywordResearch && formData.keywords.length === 0
          ? "Please add at least one secondary keyword."
          : "",
      otherLinks:
        otherLinks.length === 0 && type === "yt" ? "Please add at least one valid link." : "",
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some(error => error)) {
      message.error("Please fill all required fields correctly.")
      return
    }

    if (otherLinks.length > 3) {
      setErrors(prev => ({
        ...prev,
        otherLinks: "You can only add up to 3 links.",
      }))
      message.error("You can only add up to 3 links.")
      return
    }

    // Check if user has sufficient credits
    const features = []
    if (formData.performKeywordResearch) features.push("keywordResearch")

    let estimatedCost = computeCost({
      wordCount: 1500,
      features,
      aiModel: "gemini",
      includeImages: formData.addImages,
      imageSource: formData.imageSource === "ai-generated" ? "ai" : "stock",
      numberOfImages: 0, // AI decides the number
    })

    // Apply Cost Cutter discount (25% off)
    if (formData.costCutter) {
      estimatedCost = Math.round(estimatedCost * 0.75)
    }

    const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

    if (userCredits < estimatedCost) {
      handlePopup({
        title: "Insufficient Credits",
        description: (
          <div>
            <p>You don't have enough credits to generate this blog.</p>
            <p className="mt-1">
              <strong>Required:</strong> {estimatedCost} credits
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

    const finalData = {
      ...formData,
      type,
      otherLinks,
    }

    dispatch(createNewQuickBlog({ blogData: finalData, user, navigate, queryClient, type }))
    handleClose()
  }

  // Handle template selection
  const handlePackageSelect = useCallback(templates => {
    setFormData(prev => ({
      ...prev,
      template: templates?.[0]?.name ?? null,
      templateIds: templates?.map(t => t.id),
    }))
    setErrors(prev => ({ ...prev, template: "" }))
  }, [])

  // Handle keyword input changes
  const handleKeywordInputChange = (e, type) => {
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setFormData(prev => ({
      ...prev,
      [key]: e.target.value,
    }))
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Add keywords to the form data
  const handleAddKeyword = type => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors(prev => ({ ...prev, [type]: "Please enter a keyword." }))
      return
    }

    const existingSet = new Set(formData[type].map(k => k.trim().toLowerCase()))
    const newKeywords = inputValue
      .split(",")
      .map(k => k.trim())
      .filter(k => k !== "" && !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors(prev => ({
        ...prev,
        [type]: "Please enter valid, non-duplicate keywords separated by commas.",
      }))
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      setErrors(prev => ({
        ...prev,
        [type]: "You can only add up to 3 focus keywords.",
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [inputKey]: "",
    }))
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Remove a keyword
  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Handle Enter key for keywords
  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  // Extract YouTube video ID from URL
  const getVideoId = url => {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase().replace("www.", "")

      if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
        return null
      }

      let videoId = null

      if (hostname === "youtube.com" || hostname === "m.youtube.com") {
        const pathname = parsed.pathname
        if (pathname.startsWith("/watch")) {
          videoId = parsed.searchParams.get("v")
        } else if (pathname.startsWith("/embed/")) {
          videoId = pathname.split("/embed/")[1].split("/")[0].split("?")[0]
        } else if (pathname.startsWith("/v/")) {
          videoId = pathname.split("/v/")[1].split("/")[0].split("?")[0]
        } else if (pathname.startsWith("/shorts/")) {
          videoId = pathname.split("/shorts/")[1].split("/")[0].split("?")[0]
        }
      } else if (hostname === "youtu.be") {
        videoId = parsed.pathname.slice(1).split("/")[0].split("?")[0]
      }

      return videoId
    } catch {
      return null
    }
  }

  // Validate URL for reference links
  const validateUrl = url => {
    switch (type) {
      case "yt":
        const videoId = getVideoId(url)
        const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
        if (!videoId || !videoIdRegex.test(videoId)) {
          return {
            valid: false,
            error: "Please enter a valid YouTube video link with a proper video ID.",
          }
        }
        break
      default:
        try {
          new URL(url)
        } catch (e) {
          return { valid: false, error: "Please enter a valid URL (e.g., https://example.com)." }
        }
    }
    return { valid: true }
  }

  // Add reference links
  const handleAddLink = () => {
    const input = formData.otherLinkInput?.trim()
    const maxLinks = 3

    if (!input) {
      setErrors(prev => ({
        ...prev,
        otherLinks: `Please enter valid ${type === "yt" ? "youtube" : "reference"} links.`,
      }))
      return
    }

    const newLinks = input
      .split(",")
      .map(link => link.trim())
      .filter(link => link !== "")

    const validNewLinks = []

    for (let link of newLinks) {
      if (otherLinks.includes(link) || validNewLinks.includes(link)) {
        continue
      }

      const validation = validateUrl(link)
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, otherLinks: validation.error }))
        message.error(validation.error)
        return
      }

      validNewLinks.push(link)
    }

    if (validNewLinks.length === 0) {
      setErrors(prev => ({
        ...prev,
        otherLinks: "No valid, unique links found.",
      }))
      return
    }

    if (otherLinks.length + validNewLinks.length > maxLinks) {
      setErrors(prev => ({
        ...prev,
        otherLinks: `You can only add up to ${maxLinks} links.`,
      }))
      return
    }

    setOtherLinks([...otherLinks, ...validNewLinks])
    setFormData(prev => ({
      ...prev,
      otherLinkInput: "",
    }))
    setErrors(prev => ({ ...prev, otherLinks: "" }))
  }

  // Handle Enter key for links
  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddLink()
    }
  }

  // Remove a reference link
  const handleRemoveLink = index => {
    const updatedLinks = [...otherLinks]
    updatedLinks.splice(index, 1)
    setOtherLinks(updatedLinks)
    setErrors(prev => ({ ...prev, otherLinks: "" }))
  }

  const imageSources = [
    { id: "unsplash", label: "Stock Images", value: "unsplash" },
    { id: "ai-generated", label: "AI-Generated Images", value: "ai-generated" },
  ]

  const languages = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "German", label: "German" },
    { value: "French", label: "French" },
    { value: "Italian", label: "Italian" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Dutch", label: "Dutch" },
    { value: "Japanese", label: "Japanese" },
  ]

  return (
    <Modal
      title={`Generate ${type === "quick" ? "Quick" : "Youtube"} Blog`}
      open={true}
      onCancel={handleClose}
      footer={
        currentStep === 0
          ? [
              <button
                key="next"
                onClick={handleNext}
                className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors"
                aria-label="Next step"
              >
                Next
              </button>,
            ]
          : [
              <div key="footer-content" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="font-bold text-blue-600">
                    {(() => {
                      const features = []
                      if (formData.performKeywordResearch) features.push("keywordResearch")

                      let cost = computeCost({
                        wordCount: 1500,
                        features,
                        aiModel: "gemini",
                        includeImages: formData.addImages,
                        imageSource: formData.imageSource === "ai-generated" ? "ai" : "stock",
                        numberOfImages: 0,
                      })
                      if (formData.costCutter) {
                        cost = Math.round(cost * 0.75)
                      }
                      return cost
                    })()}{" "}
                    credits
                  </span>
                  {formData.costCutter && (
                    <span className="text-xs text-green-600 font-medium">(-25% off)</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    key="previous"
                    onClick={() => setCurrentStep(0)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    aria-label="Previous step"
                  >
                    Previous
                  </button>
                  <button
                    key="submit"
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors ml-3"
                    aria-label="Submit quick blog"
                  >
                    Submit
                  </button>
                </div>
              </div>,
            ]
      }
      width={800}
      centered
      transitionName=""
      maskTransitionName=""
      destroyOnHidden
    >
      <div className="p-2 space-y-2">
        {currentStep === 0 && (
          <>
            <div
              className={`!max-h-[75vh] overflow-clip p-4 pt-0 ${
                errors.template ? "border-2 border-red-500 rounded-lg p-2" : ""
              }`}
            >
              <TemplateSelection
                userSubscriptionPlan={user?.subscription?.plan ?? "free"}
                onClick={handlePackageSelect}
                preSelectedIds={formData.templateIds}
              />
            </div>
            {errors.template && <p className="text-red-500 text-sm mt-2">{errors.template}</p>}
          </>
        )}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.topic ? "border-red-500" : "border-gray-200"
                } rounded-md text-sm bg-gray-50`}
                placeholder="Enter the blog topic"
                aria-label="Blog topic"
              />
              {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language <span className="text-red-500">*</span>
              </label>
              <select
                name="languageToWrite"
                value={formData.languageToWrite}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B6FC9] focus:border-transparent"
                aria-label="Select language"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Perform Keyword Research
              </label>
              <label className="relative inline-block w-11 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.performKeywordResearch}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      performKeywordResearch: e.target.checked,
                      focusKeywords: e.target.checked ? [] : prev.focusKeywords,
                      keywords: e.target.checked ? [] : prev.keywords,
                      focusKeywordInput: "",
                      keywordInput: "",
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="absolute inset-0 bg-gray-200 rounded-full transition-colors duration-200 peer-checked:bg-[#1B6FC9]"></div>
                <div className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full border border-gray-300 transition-transform duration-200 peer-checked:translate-x-5"></div>
              </label>
            </div>
            {!formData.performKeywordResearch && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Keywords (Max 3) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.focusKeywordInput}
                      onChange={e => handleKeywordInputChange(e, "focusKeywords")}
                      onKeyDown={e => handleKeyPress(e, "focusKeywords")}
                      className={`flex-1 px-3 py-2 border ${
                        errors.focusKeywords ? "border-red-500" : "border-gray-200"
                      } rounded-md text-sm bg-gray-50`}
                      placeholder="Enter focus keywords, separated by commas"
                      aria-label="Focus keywords"
                    />
                    <button
                      onClick={() => handleAddKeyword("focusKeywords")}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                      aria-label="Add focus keywords"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.focusKeywords && (
                    <p className="text-red-500 text-sm mt-1">{errors.focusKeywords}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.focusKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(index, "focusKeywords")}
                          className="ml-1 text-blue-400 hover:text-blue-600"
                          aria-label={`Remove ${keyword}`}
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.keywordInput}
                      onChange={e => handleKeywordInputChange(e, "keywords")}
                      onKeyDown={e => handleKeyPress(e, "keywords")}
                      className={`flex-1 px-3 py-2 border ${
                        errors.keywords ? "border-red-500" : "border-gray-200"
                      } rounded-md text-sm bg-gray-50`}
                      placeholder="Enter secondary keywords, separated by commas"
                      aria-label="Secondary keywords"
                    />
                    <button
                      onClick={() => handleAddKeyword("keywords")}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                      aria-label="Add secondary keywords"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.keywords && (
                    <p className="text-red-500 text-sm mt-1">{errors.keywords}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(index, "keywords")}
                          className="ml-1 text-blue-400 hover:text-blue-600"
                          aria-label={`Remove ${keyword}`}
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Add Images & Source Selection */}
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Add Images</label>
              <label className="relative inline-block w-11 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.addImages}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      addImages: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="absolute inset-0 bg-gray-200 rounded-full transition-colors duration-200 peer-checked:bg-[#1B6FC9]"></div>
                <div className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full border border-gray-300 transition-transform duration-200 peer-checked:translate-x-5"></div>
              </label>
            </div>
            {formData.addImages && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Image Source</label>
                <div className={`grid grid-cols-2 gap-4 mx-auto w-full mb-2`}>
                  {imageSources.map(source => (
                    <label
                      key={source.id}
                      htmlFor={source.id}
                      className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150
                      ${
                        formData.imageSource === source.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300"
                      } hover:shadow-sm w-full`}
                    >
                      <input
                        type="radio"
                        id={source.id}
                        name="imageSource"
                        value={source.value}
                        checked={formData.imageSource === source.value}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <span className="text-sm font-medium text-gray-800">{source.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Links Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === "yt"
                  ? "YouTube Video Links "
                  : "Reference Links (e.g., articles, websites)"}{" "}
                (Max 3 links) {type === "yt" && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.otherLinkInput}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, otherLinkInput: e.target.value }))
                    }
                    onKeyDown={e => handleKeyDown(e)}
                    className={`flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50`}
                    placeholder="Enter full URLs (e.g., https://example.com), separated by commas"
                    aria-label="Reference/Video links"
                  />
                  <button
                    onClick={() => handleAddLink()}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                    aria-label="Add reference/video links"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.otherLinks && (
                  <p className="text-red-500 text-sm mt-1">{errors.otherLinks}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {otherLinks.map((link, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {link}
                      <button
                        onClick={() => handleRemoveLink(index)}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                        aria-label={`Remove ${link}`}
                      >
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Cutter Toggle */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-green-900 mb-1">💰 Cost Cutter</h3>
                  <p className="text-xs text-green-700">Use AI Flash model for 25% savings</p>
                </div>
                <label className="relative inline-block w-14 h-7 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.costCutter}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        costCutter: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="absolute inset-0 bg-gray-300 rounded-full transition-colors duration-200 peer-checked:bg-green-500"></div>
                  <div className="absolute top-[2px] left-[2px] h-6 w-6 bg-white rounded-full border border-gray-300 transition-transform duration-200 peer-checked:translate-x-7 shadow-md"></div>
                </label>
              </div>
            </div>

            {/* Blog Configuration Info */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
                📝 Blog Configuration
              </h3>

              <div className="space-y-2 text-sm">
                {/* Row */}
                <div className="flex items-center justify-between">
                  <span className="text-blue-900/70">Word Count</span>
                  <span className="font-semibold text-blue-900">~1500 words</span>
                </div>

                {/* Divider */}
                <div className="border-t border-blue-200/60"></div>

                {/* Row */}
                <div className="flex items-center justify-between">
                  <span className="text-blue-900/70">AI Model</span>
                  <span className="font-semibold text-blue-900">Gemini Flash</span>
                </div>

                {/* Divider */}
                <div className="border-t border-blue-200/60"></div>

                {/* Row */}
                <div className="flex items-center justify-between">
                  <span className="text-blue-900/70">Images</span>
                  <span className="font-semibold text-blue-900">
                    {formData.addImages
                      ? formData.imageSource === "ai-generated"
                        ? "AI Generated"
                        : "Stock Images"
                      : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default QuickBlogModal
