import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { debugPayload } from "@utils/debugPayload"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { computeCost } from "@/data/pricingConfig"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { IMAGE_SOURCE, LANGUAGES } from "@/data/blogData"
import ImageSourceSelector from "@components/ImageSourceSelector"
import AdvancedOptions from "@components/AdvancedOptions"
import AiModelSelector from "@components/AiModelSelector"
import { Switch } from "@components/ui/switch"
import FieldLabel from "@components/ui/FieldLabel"
import { useQueryClient } from "@tanstack/react-query"
import { useZodForm } from "@/lib/forms"
import {
  QUICK_BLOG_MAX_LINKS,
  QUICK_BLOG_STEP_FIELDS,
  quickBlogFormDefaults,
  quickBlogFormSchema,
  toQuickBlogPayload,
} from "@/forms/quickBlogForm"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

// Quick Blog Modal Component - Updated pricing calculation
const QuickBlogModal = ({ type = "quick", closeFnc }) => {
  const [currentStep, setCurrentStep] = useState(0)

  // Form state and its validation both live in `quickBlogFormSchema`; the payload is
  // derived from it by `toQuickBlogPayload`, so UI-only fields (the raw tag inputs,
  // the template ids, the advanced-options switch) can never leak into the request.
  const {
    watch,
    setValue,
    getFieldState,
    trigger,
    reset,
    setError,
    clearErrors,
    handleSubmit: submitForm,
    formState: { errors },
  } = useZodForm(quickBlogFormSchema, quickBlogFormDefaults(type))

  const formData = watch()
  const otherLinks = formData.otherLinks

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

  /** Writes several fields at once — the shape `AdvancedOptions` expects. */
  const applyUpdates = useCallback(
    (updates) => {
      for (const [name, value] of Object.entries(updates)) setField(name, value)
    },
    [setField]
  )

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()
  const queryClient = useQueryClient()

  // Check if user has a pro subscription
  const _isProUser = user?.subscription?.plan === "pro"

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
    formData.aiModel, formData.numberOfImages
  ])

  // Handle navigation to the next step
  const handleNext = async () => {
    if (currentStep === 0) {
      if (!(await trigger(QUICK_BLOG_STEP_FIELDS[0]))) return
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // Don't let the user move on with missing fields - the errors would render
      // on a step they can no longer see.
      if (!(await trigger(QUICK_BLOG_STEP_FIELDS[1]))) {
        toast.error("Please fill all required fields correctly.")
        return
      }

      if (formData.enableAdvanced) {
        setCurrentStep(2)
      }
    }
  }

  // Handle modal close
  const handleClose = () => {
    reset(quickBlogFormDefaults(type))
    setCurrentStep(0)
    closeFnc()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setField(name, value)
  }

  // Handle form submission. react-hook-form validates against the schema first, so
  // `values` is complete and checked by the time this runs, and `toQuickBlogPayload`
  // is the only thing that decides what actually goes on the wire.
  const handleSubmit = submitForm(
    async (values) => {
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
          confirmText: "Buy Credits",
          onConfirm: () => {
            navigate("/pricing")
            handleClose()
          },
        })
        return
      }

      const loadingId = showLoading(`Creating ${type === "quick" ? "quick" : "YouTube"} blog...`)

      try {
        const payload = toQuickBlogPayload(values)
        if (debugPayload(type === "yt" ? "YouTubeBlog" : "QuickBlog", payload)) return

        // Dispatch and await the result
        const { createNewQuickBlog } = useBlogStore.getState()
        await createNewQuickBlog({ blogData: payload, navigate, type, queryClient })

        // ✅ Only close modal on success
        handleClose()
      } catch (error) {
        // ❌ Don't close modal - let user retry
        toast.error(error?.message || "Failed to create blog. Please try again.")
      } finally {
        hideLoading(loadingId)
      }
    },
    (invalid) => {
      // Send the user back to the step that holds the first failing field, otherwise
      // the message renders on a screen they cannot see.
      setCurrentStep(invalid.template ? 0 : 1)
      toast.error("Please fill all required fields correctly.")
    }
  )

  // Handle template selection
  const handlePackageSelect = useCallback(
    (templates) => {
      setField("template", templates?.[0]?.name ?? null)
      setField("templateIds", templates?.map((t) => t.id) ?? [])
    },
    [setField]
  )

  // Handle keyword input changes
  const handleKeywordInputChange = (e, type) => {
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setField(key, e.target.value)
    clearErrors(type)
  }

  // Add keywords to the form data
  const handleAddKeyword = (type, forcedValue = null) => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const seen = new Set()
    const rawItems = Array.isArray(forcedValue)
      ? forcedValue
      : (forcedValue !== null ? forcedValue : formData[inputKey]).split(/[,\t\n\r;]+/)
    const items = rawItems
      .map((k) => k.trim())
      .filter((k) => k !== "" && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))

    if (items.length === 0) {
      if (forcedValue === null) setError(type, { message: "Please enter a keyword." })
      return
    }

    const existingSet = new Set(formData[type].map((k) => k.trim().toLowerCase()))
    const newKeywords = items.filter((k) => !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      if (forcedValue === null) {
        setError(type, { message: "Please enter valid, non-duplicate keywords." })
      }
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      const availableSlots = 3 - formData[type].length
      if (availableSlots > 0) {
        setField(type, [...formData[type], ...newKeywords.slice(0, availableSlots)])
        setField(inputKey, "")
      } else {
        setError(type, { message: "You can only add up to 3 focus keywords." })
      }
      toast.warning("You can only add up to 3 focus keywords.")
      return
    }

    setField(type, [...formData[type], ...newKeywords])
    setField(inputKey, "")
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
    setField(type, updatedKeywords)
  }

  // Handle Enter key for keywords
  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  // Extract YouTube video ID from URL
  const getVideoId = (url) => {
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
  const validateUrl = (url) => {
    switch (type) {
      case "yt": {
        const videoId = getVideoId(url)
        const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
        if (!videoId || !videoIdRegex.test(videoId)) {
          return {
            valid: false,
            error: "Please enter a valid YouTube video link with a proper video ID.",
          }
        }
        break
      }
      default:
        try {
          new URL(url)
        } catch (_e) {
          return { valid: false, error: "Please enter a valid URL (e.g., https://example.com)." }
        }
    }
    return { valid: true }
  }

  // Add reference links
  const handleAddLink = () => {
    const input = formData.otherLinkInput?.trim()
    const maxLinks = QUICK_BLOG_MAX_LINKS

    if (!input) {
      setError("otherLinks", {
        message: `Please enter valid ${type === "yt" ? "youtube" : "reference"} links.`,
      })
      return
    }

    const newLinks = input
      .split(",")
      .map((link) => link.trim())
      .filter((link) => link !== "")

    const validNewLinks = []

    for (const link of newLinks) {
      if (otherLinks.includes(link) || validNewLinks.includes(link)) {
        continue
      }

      const validation = validateUrl(link)
      if (!validation.valid) {
        setError("otherLinks", { message: validation.error })
        toast.error(validation.error)
        return
      }

      validNewLinks.push(link)
    }

    if (validNewLinks.length === 0) {
      setError("otherLinks", { message: "No valid, unique links found." })
      return
    }

    if (otherLinks.length + validNewLinks.length > maxLinks) {
      setError("otherLinks", { message: `You can only add up to ${maxLinks} links.` })
      return
    }

    setField("otherLinks", [...otherLinks, ...validNewLinks])
    setField("otherLinkInput", "")
  }

  // Handle Enter key for links
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddLink()
    }
  }

  // Remove a reference link
  const handleRemoveLink = (index) => {
    const updatedLinks = [...otherLinks]
    updatedLinks.splice(index, 1)
    setField("otherLinks", updatedLinks)
  }

  const _imageSources = [
    { id: "stock", label: "Stock Images", value: IMAGE_SOURCE.STOCK },
    { id: "ai", label: "AI-Generated Images", value: IMAGE_SOURCE.AI },
  ]

  return (
    <dialog className="modal modal-open bg-black/60">
      <div className="modal-box w-full max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 px-6">
          <h3 className="font-bold text-md">{`Generate ${type === "quick" ? "Quick" : "Youtube"} Blog`}</h3>
          <button type="button" onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
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
            <TemplateSelection
              userSubscriptionPlan={user?.subscription?.plan ?? "free"}
              onClick={handlePackageSelect}
              preSelectedIds={formData.templateIds}
              error={errors.template?.message}
            />
          )}
          {currentStep === 1 && (
            <div className="space-y-5 p-3 pt-4">
              <div>
                <FieldLabel
                  tip="The core subject or concept you want the blog post to write about."
                  required
                >
                  Topic
                </FieldLabel>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.topic?.message ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm bg`}
                  placeholder="Enter the blog topic"
                  aria-label="Blog topic"
                />
                {errors.topic?.message && <p className="text-red-500 text-sm mt-1">{errors.topic?.message}</p>}
              </div>
              <div className="flex items-center justify-between mb-4">
                <FieldLabel tip="Ensures the generated blog uses your exact topic string as its main H1 title.">
                  Use Topic name as Blog Title
                </FieldLabel>
                <Switch
                  checked={formData.exactTitle}
                  onCheckedChange={(checked) =>
                    setField("exactTitle", checked)
                  }
                  size="large"
                />
              </div>
              <div className="form-control w-full">
                <label htmlFor="quick-language" className="label pb-1">
                  <span className="text-black text-sm font-semibold">
                    Language <span className="text-error">*</span>
                  </span>
                </label>

                <select
                  id="quick-language"
                  name="languageToWrite"
                  value={formData.languageToWrite}
                  onChange={handleChange}
                  className="select rounded-lg w-full bg-base-100 focus:border-0 outline-0"
                >
                  {LANGUAGES.map((lang) => (
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
                  onCheckedChange={(checked) =>
                    {
                      setField("performKeywordResearch", checked)
                      if (checked) {
                        setField("focusKeywords", [])
                        setField("keywords", [])
                        // The lists are no longer required, so their errors go with them.
                        clearErrors(["focusKeywords", "keywords"])
                      }
                      setField("focusKeywordInput", "")
                      setField("keywordInput", "")
                    }
                  }
                  size="large"
                />
              </div>
              {!formData.performKeywordResearch && (
                <>
                  <div>
                    <FieldLabel
                      tip="The #1 keyword you want this article to rank for in search engines. Appears most often in the blog."
                      required
                    >
                      Focus Keywords (Max 3)
                    </FieldLabel>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.focusKeywordInput}
                        onChange={(e) => handleKeywordInputChange(e, "focusKeywords")}
                        onKeyDown={(e) => handleKeyPress(e, "focusKeywords")}
                        onPaste={(e) => handlePasteKeywords(e, "focusKeywords")}
                        className={`flex-1 px-3 py-2 border ${
                          errors.focusKeywords?.message ? "border-red-500" : "border-gray-200"
                        } rounded-md text-sm bg-gray-50`}
                        placeholder="Enter keywords (comma, tab, or newline separated)"
                        aria-label="Focus keywords"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddKeyword("focusKeywords")}
                        className="px-4 py-2 bg-[#4C5BD6] text-white rounded-md text-sm flex items-center hover:bg-[#3B4BB8] transition-all"
                        aria-label="Add focus keywords"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {errors.focusKeywords?.message && (
                      <p className="text-red-500 text-sm mt-1">{errors.focusKeywords?.message}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.focusKeywords.map((keyword, index) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"
                        >
                          {keyword}
                          <button
                            type="button"
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
                    <FieldLabel
                      tip="Secondary helper keywords woven throughout the article for broader SEO coverage."
                      required
                    >
                      Keywords
                    </FieldLabel>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.keywordInput}
                        onChange={(e) => handleKeywordInputChange(e, "keywords")}
                        onKeyDown={(e) => handleKeyPress(e, "keywords")}
                        onPaste={(e) => handlePasteKeywords(e, "keywords")}
                        className={`flex-1 px-3 py-2 border ${
                          errors.keywords?.message ? "border-red-500" : "border-gray-200"
                        } rounded-md text-sm bg-gray-50`}
                        placeholder="Enter keywords (comma, tab, or newline separated)"
                        aria-label="Secondary keywords"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddKeyword("keywords")}
                        className="px-4 py-2 bg-[#4C5BD6] text-white rounded-md text-sm flex items-center hover:bg-[#3B4BB8] transition-all"
                        aria-label="Add secondary keywords"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {errors.keywords?.message && (
                      <p className="text-red-500 text-sm mt-1">{errors.keywords?.message}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.keywords.map((keyword, index) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"
                        >
                          {keyword}
                          <button
                            type="button"
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
                    <span className="block text-sm font-semibold">Add Images</span>
                    <p className="text-xs text-gray-500">
                      Search and add relevant images to your blog
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      checked={formData.addImages}
                      onCheckedChange={(checked) => {
                        setField("addImages", checked)
                        setField(
                          "imageSource",
                          checked
                            ? formData.imageSource === "none" || !formData.imageSource
                              ? "stock"
                              : formData.imageSource
                            : "none"
                        )
                      }}
                      size="large"
                    />
                  </div>
                </div>
                {formData.addImages && (
                  <ImageSourceSelector
                    value={formData.imageSource}
                    onChange={(sourceId) =>
                      setField("imageSource", sourceId)
                    }
                    numberOfImages={formData.numberOfImages}
                    onNumberChange={(val) =>
                      setField("numberOfImages", val)
                    }
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
                    onCheckedChange={(checked) =>
                      setField("enableAdvanced", checked)
                    }
                    size="large"
                  />
                </div>

                {formData.enableAdvanced && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <AiModelSelector
                      value={formData.aiModel}
                      onChange={(modelId) => setField("aiModel", modelId)}
                      showCostCutter={true}
                      costCutterValue={formData.costCutter}
                      onCostCutterChange={(checked) =>
                        setField("costCutter", checked)
                      }
                    />
                  </div>
                )}
              </div>

              {/* Reference Links Section */}
              <div>
                <label htmlFor="quick-reference-links" className="block text-sm font-semibold  mb-2">
                  {type === "yt" ? "YouTube Video Links " : "Reference Links "} (Max 3 links){" "}
                  {type === "yt" && <span className="text-red-500">*</span>}
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="quick-reference-links"
                      type="url"
                      value={formData.otherLinkInput}
                      onChange={(e) =>
                        setField("otherLinkInput", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e)}
                      className={`flex-1 px-3 py-2 border ${
                        errors.otherLinks?.message ? "border-red-500" : "border-gray-200"
                      } rounded-md text-sm bg-gray-50`}
                      placeholder="Enter full URLs (e.g., https://example.com), separated by commas"
                      aria-label="Reference/Video links"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddLink()}
                      className="px-4 py-2 bg-[#4C5BD6] text-white rounded-md text-sm flex items-center hover:bg-[#3B4BB8] transition-all"
                      aria-label="Add reference/video links"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.otherLinks?.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.otherLinks?.message}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {otherLinks.map((link, index) => (
                      <span
                        key={link}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700"
                      >
                        {link}
                        <button
                          type="button"
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
                    onCheckedChange={(checked) =>
                      setField("costCutter", checked)
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
              <AdvancedOptions
                formData={formData}
                updateFormData={applyUpdates}
                isNestedOptions={false}
                showFields={["easyToUnderstand", "humanisation", "embedYouTubeVideos"]}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-300 bg-gray-50">
          {currentStep === 0 ? (
            <div className="flex justify-end">
              <button
                type="button"
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
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="w-full sm:w-auto px-6 py-2 text-sm font-bold bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={
                    currentStep === (formData.enableAdvanced ? 2 : 1) ? handleSubmit : handleNext
                  }
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
        <button type="button" onClick={handleClose}>
          close
        </button>
      </form>
    </dialog>
  )
}

export default QuickBlogModal
