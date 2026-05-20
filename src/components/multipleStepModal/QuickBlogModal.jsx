import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { debugPayload } from "@utils/debugPayload"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { computeCost } from "@/data/pricingConfig"
import { toast } from "sonner"
import { Plus, X, Crown } from "lucide-react"
import Carousel from "./Carousel"
import { packages } from "@/data/templates"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { IMAGE_SOURCE, LANGUAGES, IMAGE_OPTIONS } from "@/data/blogData"
import ImageSourceSelector from "@components/ImageSourceSelector"
import AdvancedOptions from "@components/AdvancedOptions"
import AiModelSelector from "@components/AiModelSelector"
import { Switch } from "@components/ui/switch"
import FieldLabel from "@components/ui/FieldLabel"
import { useQueryClient } from "@tanstack/react-query"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { validateQuickBlogData } from "@/types/forms.schemas"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

// Quick Blog Modal Component - Updated pricing calculation
const QuickBlogModal = ({ type = "quick", closeFnc }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [otherLinks, setOtherLinks] = useState([])

  const initialFormData = {
    topic: "",
    exactTitle: false,
    performKeywordResearch: false,
    addImages: false,
    imageSource: IMAGE_SOURCE.NONE,
    numberOfImages: 0,
    template: null,
    templateIds: [],
    keywords: [],
    focusKeywords: [],
    otherLinkInput: "",
    focusKeywordInput: "",
    keywordInput: "",
    languageToWrite: "English",
    costCutter: true,
    easyToUnderstand: false,
    embedYouTubeVideos: false,
    humanisation: false,
    aiModel: "gemini",
    enableAdvanced: false,
  }

  const initialErrors = { topic: "", template: "", focusKeywords: "", keywords: "", otherLinks: "" }

  const [formData, setFormData] = useState({
    ...initialFormData,
    embedYouTubeVideos: type === "yt" ? true : initialFormData.embedYouTubeVideos,
  })
  const [errors, setErrors] = useState(initialErrors)

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()
  const queryClient = useQueryClient()

  // Check if user has a pro subscription
  const isProUser = user?.subscription?.plan === "pro"

  // Memoized estimated cost calculation
  const estimatedCost = useMemo(() => {
    const features = []
    if (formData.performKeywordResearch) features.push("keywordResearch")
    if (formData.humanisation) features.push("humanisation")

    let cost = computeCost({
      wordCount: 1500,
      features,
      aiModel: formData.aiModel || "gemini",
      includeImages: formData.addImages,
      imageSource: formData.imageSource,
      numberOfImages: formData.numberOfImages,
    })

    if (formData.costCutter) {
      cost = Math.round(cost * 0.5)
    }

    return cost
  }, [
    formData.performKeywordResearch,
    formData.humanisation,
    formData.addImages,
    formData.imageSource,
    formData.costCutter,
    formData.aiModel,
  ])

  // Handle navigation to the next step
  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.template) {
        setErrors(prev => ({ ...prev, template: "Please select a template." }))
        return
      }
      setErrors(prev => ({ ...prev, template: "" }))
      setCurrentStep(1)
    } else if (currentStep === 1 && formData.enableAdvanced) {
      setCurrentStep(2)
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
    setFormData(prev => ({ ...prev, [name]: value }))
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
      toast.error("Please fill all required fields correctly.")
      return
    }

    if (otherLinks.length > 3) {
      setErrors(prev => ({ ...prev, otherLinks: "You can only add up to 3 links." }))
      toast.error("You can only add up to 3 links.")
      return
    }

    // Check if user has sufficient credits
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
      // Set imageSource to "none" if images are disabled
      imageSource: formData.addImages ? formData.imageSource : IMAGE_SOURCE.NONE,
    }

    const submitBlog = async () => {
      const loadingId = showLoading(`Creating ${type === "quick" ? "quick" : "YouTube"} blog...`)

      try {
        // Validate with Zod schema (logs to console when VITE_VALIDATE_FORMS=true)
        const validatedData = validateQuickBlogData(finalData)
        if (debugPayload(type === "yt" ? "YouTubeBlog" : "QuickBlog", validatedData)) return

        // Dispatch and await the result
        const { createNewQuickBlog } = useBlogStore.getState()
        await createNewQuickBlog({ blogData: validatedData, user, navigate, type, queryClient })

        // ✅ Only close modal on success
        handleClose()
      } catch (error) {
        // ❌ Don't close modal - let user retry
        toast.error(error?.message || "Failed to create blog. Please try again.")
      } finally {
        hideLoading(loadingId)
      }
    }

    submitBlog()
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
    setFormData(prev => ({ ...prev, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Add keywords to the form data
  const handleAddKeyword = (type, forcedValue = null) => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const seen = new Set()
    const rawItems = Array.isArray(forcedValue)
      ? forcedValue
      : (forcedValue !== null ? forcedValue : formData[inputKey]).split(/[,\t\n\r;]+/)
    const items = rawItems
      .map(k => k.trim())
      .filter(k => k !== "" && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))

    if (items.length === 0) {
      if (forcedValue === null) setErrors(prev => ({ ...prev, [type]: "Please enter a keyword." }))
      return
    }

    const existingSet = new Set(formData[type].map(k => k.trim().toLowerCase()))
    const newKeywords = items.filter(k => !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      if (forcedValue === null) {
        setErrors(prev => ({
          ...prev,
          [type]: "Please enter valid, non-duplicate keywords.",
        }))
      }
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      const availableSlots = 3 - formData[type].length
      if (availableSlots > 0) {
        const toAdd = newKeywords.slice(0, availableSlots)
        setFormData(prev => ({ ...prev, [type]: [...prev[type], ...toAdd], [inputKey]: "" }))
        setErrors(prev => ({ ...prev, [type]: "" }))
      } else {
        setErrors(prev => ({ ...prev, [type]: "You can only add up to 3 focus keywords." }))
      }
      toast.warning("You can only add up to 3 focus keywords.")
      return
    }

    setFormData(prev => ({ ...prev, [type]: [...prev[type], ...newKeywords], [inputKey]: "" }))
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Handle Clipboard Paste for Keywords
  const handlePasteKeywords = (e, type) => {
    extractKeywordsFromClipboard(e, {
      type,
      cb: (items, fieldType) => handleAddKeyword(fieldType, items),
    })
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
        toast.error(validation.error)
        return
      }

      validNewLinks.push(link)
    }

    if (validNewLinks.length === 0) {
      setErrors(prev => ({ ...prev, otherLinks: "No valid, unique links found." }))
      return
    }

    if (otherLinks.length + validNewLinks.length > maxLinks) {
      setErrors(prev => ({ ...prev, otherLinks: `You can only add up to ${maxLinks} links.` }))
      return
    }

    setOtherLinks([...otherLinks, ...validNewLinks])
    setFormData(prev => ({ ...prev, otherLinkInput: "" }))
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
    { id: "stock", label: "Stock Images", value: IMAGE_SOURCE.STOCK },
    { id: "ai", label: "AI-Generated Images", value: IMAGE_SOURCE.AI },
  ]

  return (
    <dialog className="modal modal-open bg-black/60">
      <div className="modal-box w-full max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 px-6">
          <h3 className="font-bold text-md">{`Generate ${type === "quick" ? "Quick" : "Youtube"} Blog`}</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Sleek Minimal Progress Bar */}
        <div className="w-full bg-slate-100 h-[3px] overflow-hidden">
          <div 
            className="bg-[#4C5BD6] h-full transition-all duration-300 ease-out" 
            style={{ width: `${((currentStep + 1) / (formData.enableAdvanced ? 3 : 2)) * 100}%` }}
          />
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto custom-scroll space-y-4">
          {currentStep === 0 && (
            <div
              className={`rounded-xl transition-all duration-200 ${
                errors.template ? "border-2 border-red-500 p-1 pb-0" : "border-0"
              }`}
            >
              <TemplateSelection
                userSubscriptionPlan={user?.subscription?.plan ?? "free"}
                onClick={handlePackageSelect}
                preSelectedIds={formData.templateIds}
                error={errors.template}
              />
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-5 p-3 pt-4">
              <div>
                <FieldLabel tip="The core subject or concept you want the blog post to write about." required>
                  Topic
                </FieldLabel>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.topic ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm bg`}
                  placeholder="Enter the blog topic"
                  aria-label="Blog topic"
                />
                {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
              </div>
              <div className="flex items-center justify-between mb-4">
                <FieldLabel tip="Ensures the generated blog uses your exact topic string as its main H1 title.">
                  Use Topic name as Blog Title
                </FieldLabel>
                <Switch
                  checked={formData.exactTitle}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, exactTitle: checked }))
                  }
                  size="large"
                />
              </div>
              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="text-black text-sm font-semibold">
                    Language <span className="text-error">*</span>
                  </span>
                </label>

                <select
                  name="languageToWrite"
                  value={formData.languageToWrite}
                  onChange={handleChange}
                  className="select rounded-lg w-full bg-base-100 focus:border-0 outline-0"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between mb-4">
                <FieldLabel tip="Allow AI to automatically discover high-traffic SEO keywords for this topic.">
                  Perform Keyword Research
                </FieldLabel>
                <Switch
                  checked={formData.performKeywordResearch}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      performKeywordResearch: checked,
                      focusKeywords: checked ? [] : prev.focusKeywords,
                      keywords: checked ? [] : prev.keywords,
                      focusKeywordInput: "",
                      keywordInput: "",
                    }))
                  }
                  size="large"
                />
              </div>
              {!formData.performKeywordResearch && (
                <>
                  <div>
                    <FieldLabel tip="The #1 keyword you want this article to rank for in search engines. Appears most often in the blog." required>
                      Focus Keywords (Max 3)
                    </FieldLabel>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.focusKeywordInput}
                        onChange={e => handleKeywordInputChange(e, "focusKeywords")}
                        onKeyDown={e => handleKeyPress(e, "focusKeywords")}
                        onPaste={e => handlePasteKeywords(e, "focusKeywords")}
                        className={`flex-1 px-3 py-2 border ${
                          errors.focusKeywords ? "border-red-500" : "border-gray-200"
                        } rounded-md text-sm bg-gray-50`}
                        placeholder="Enter keywords (comma, tab, or newline separated)"
                        aria-label="Focus keywords"
                      />
                      <button
                        onClick={() => handleAddKeyword("focusKeywords")}
                        className="px-4 py-2 bg-[#4C5BD6] text-white rounded-md text-sm flex items-center hover:bg-[#3B4BB8] transition-all"
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
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"
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
                    <FieldLabel tip="Secondary helper keywords woven throughout the article for broader SEO coverage." required>
                      Keywords
                    </FieldLabel>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.keywordInput}
                        onChange={e => handleKeywordInputChange(e, "keywords")}
                        onKeyDown={e => handleKeyPress(e, "keywords")}
                        onPaste={e => handlePasteKeywords(e, "keywords")}
                        className={`flex-1 px-3 py-2 border ${
                          errors.keywords ? "border-red-500" : "border-gray-200"
                        } rounded-md text-sm bg-gray-50`}
                        placeholder="Enter keywords (comma, tab, or newline separated)"
                        aria-label="Secondary keywords"
                      />
                      <button
                        onClick={() => handleAddKeyword("keywords")}
                        className="px-4 py-2 bg-[#4C5BD6] text-white rounded-md text-sm flex items-center hover:bg-[#3B4BB8] transition-all"
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
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"
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

              <div className="space-y-6">
                {/* Add Images & Source Selection */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="block text-sm font-semibold">Add Images</label>
                    <p className="text-xs text-gray-500">
                      Search and add relevant images to your blog
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={formData.addImages}
                      onCheckedChange={checked => {
                        setFormData(prev => ({
                          ...prev,
                          addImages: checked,
                          imageSource: checked
                            ? prev.imageSource === "none" || !prev.imageSource
                              ? "stock"
                              : prev.imageSource
                            : "none",
                        }))
                        setErrors(prev => ({ ...prev, imageSource: "" }))
                      }}
                      size="large"
                    />
                  </div>
                </div>
                {formData.addImages && (
                  <ImageSourceSelector
                    value={formData.imageSource}
                    onChange={sourceId => setFormData(prev => ({ ...prev, imageSource: sourceId }))}
                    numberOfImages={formData.numberOfImages}
                    onNumberChange={val => setFormData(prev => ({ ...prev, numberOfImages: val }))}
                    showUpload={false}
                  />
                )}

                {/* Advanced Options Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <FieldLabel tip="Enable this to customize AI model selection and extra advanced options in the next step.">
                    Advanced Options
                  </FieldLabel>
                  <Switch
                    checked={formData.enableAdvanced}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, enableAdvanced: checked }))
                    }
                    size="large"
                  />
                </div>
              </div>

              {/* Reference Links Section */}
              <div>
                <label className="block text-sm font-semibold  mb-2">
                  {type === "yt" ? "YouTube Video Links " : "Reference Links "} (Max 3 links){" "}
                  {type === "yt" && <span className="text-red-500">*</span>}
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
                      className={`flex-1 px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50`}
                      placeholder="Enter full URLs (e.g., https://example.com), separated by commas"
                      aria-label="Reference/Video links"
                    />
                    <button
                      onClick={() => handleAddLink()}
                      className="px-4 py-2 bg-[#4C5BD6] text-white rounded-md text-sm flex items-center hover:bg-[#3B4BB8] transition-all"
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
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"
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
              <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-1">💰 Cost Cutter</h3>
                    <p className="text-xs text-green-700">Use AI Flash model for 50% savings</p>
                  </div>
                  <Switch
                    checked={formData.costCutter}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, costCutter: checked }))
                    }
                    className="data-[state=checked]:bg-green-500"
                    size="large"
                  />
                </div>
              </div>

              {/* Blog Configuration Info */}
              <div className="bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  📝 Blog Configuration
                </h3>

                <div className="space-y-2 text-sm">
                  {/* Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-blue-900/70 font-semibold">Word Count</span>
                    <span className="font-semibold text-blue-900">~1500 words</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-blue-200/60"></div>

                  {/* Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-blue-900/70 font-semibold">AI Model</span>
                    <span className="font-semibold text-blue-900">Gemini Flash</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-blue-200/60"></div>

                  {/* Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-blue-900/70 font-semibold">Images</span>
                    <span className="font-semibold text-blue-900">
                      {formData.addImages
                        ? `${formData.imageSource.includes("ai") ? "AI Generated" : "Stock Images"} (${formData.numberOfImages || "AI Decides"})`
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && formData.enableAdvanced && (
            <div className="space-y-6 p-4 pt-4">
              <AiModelSelector
                value={formData.aiModel}
                onChange={modelId => setFormData(prev => ({ ...prev, aiModel: modelId }))}
                showCostCutter={true}
                costCutterValue={formData.costCutter}
                onCostCutterChange={checked =>
                  setFormData(prev => ({ ...prev, costCutter: checked }))
                }
              />
              <AdvancedOptions
                formData={formData}
                updateFormData={updates => setFormData(prev => ({ ...prev, ...updates }))}
                showFields={["easyToUnderstand", "humanisation", "embedYouTubeVideos"]}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-300 bg-gray-50">
          {currentStep === 0 ? (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="w-full sm:w-auto px-8 py-2 text-sm font-bold text-white bg-[#4C5BD6] rounded-md hover:bg-[#3B4BB8] transition"
              >
                Next
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Cost Section */}
              <div className="flex items-center gap-2 w-full text-sm">
                <span className="text-gray-600 font-semibold">Estimated Cost:</span>
                <span className="font-bold text-blue-600">{estimatedCost} credits</span>
                {formData.costCutter && (
                  <span className="text-xs text-green-600 font-semibold">(-50% off)</span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full justify-end">
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="w-full sm:w-auto px-6 py-2 text-sm font-bold bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Previous
                </button>

                <button
                  onClick={currentStep === (formData.enableAdvanced ? 2 : 1) ? handleSubmit : handleNext}
                  className="w-full sm:w-auto px-8 py-2 text-sm font-bold text-white bg-[#4C5BD6] rounded-md hover:bg-[#3B4BB8] transition"
                >
                  {currentStep === (formData.enableAdvanced ? 2 : 1) ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  )
}

export default QuickBlogModal
