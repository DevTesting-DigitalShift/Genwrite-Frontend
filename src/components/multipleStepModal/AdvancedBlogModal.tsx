import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getValueByPath, setValueByPath } from "@utils/ObjectPath"
import { AI_MODELS, TONES, IMAGE_OPTIONS, IMAGE_SOURCE, LANGUAGES } from "@/data/blogData"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { computeCost } from "@/data/pricingConfig"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { validateAdvancedBlogData } from "@/types/forms.schemas"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import useAnalysisStore from "@store/useAnalysisStore"
import { getGeneratedTitles } from "@api/blogApi"
import clsx from "clsx"
import { Switch } from "@components/ui/switch"
import { X } from "lucide-react"
import BlogImageUpload from "@components/multipleStepModal/BlogImageUpload"

interface AdvancedBlogModalProps {
  onSubmit: (data: unknown) => void
  closeFnc: () => void
}

// Advanced Blog Modal Component - Updated pricing on Steps 2 & 3
const AdvancedBlogModal: FC<AdvancedBlogModalProps> = ({ closeFnc }) => {
  const STEP_TITLES = [
    "Step 1  : Template Selection",
    "Step 2: Basic Information",
    "Step 3: Customization",
    "Step 4: Blog Options",
  ]

  const initialData = {
    templateIds: [] as number[],
    template: "" as string,
    topic: "" as string,
    focusKeywords: [] as string[],
    keywords: [] as string[],
    title: "" as string,
    tone: "" as string,
    userDefinedLength: 1000 as number,
    brief: "" as string,
    aiModel: AI_MODELS[0].id as string,
    isCheckedGeneratedImages: false as boolean,
    imageSource: IMAGE_OPTIONS[0].id as string,
    numberOfImages: 0 as number,
    blogImages: [] as any[],
    referenceLinks: [] as string[],
    isCheckedQuick: false as boolean,
    isCheckedBrand: false as boolean,
    brandId: "" as string,
    languageToWrite: "English" as string,
    costCutter: true as boolean,
    options: {
      exactTitle: false as boolean,
      performKeywordResearch: false as boolean,
      includeFaqs: false as boolean,
      includeInterlinks: false as boolean,
      includeCompetitorResearch: false as boolean,
      addOutBoundLinks: false as boolean,
      addCTA: false as boolean,
      easyToUnderstand: false as boolean,
      embedYouTubeVideos: false as boolean,
    },
  }

  type FormError = Partial<Record<keyof typeof initialData, string>>

  const BLOG_OPTIONS = [
    { key: "isCheckedQuick", label: "Add a Quick Summary" },
    { key: "options.includeFaqs", label: "Add FAQs (Frequently Asked Questions)" },
    { key: "options.includeInterlinks", label: "Include Interlinks" },
    { key: "options.includeCompetitorResearch", label: "Perform Competitive Research" },
    { key: "options.addOutBoundLinks", label: "Show Outbound Links" },
  ]

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()

  const [currentStep, setCurrentStep] = useState<number>(0)
  const [formData, setFormData] = useState<typeof initialData>(initialData)
  const [errors, setErrors] = useState<FormError>({})

  // For Generating Titles
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const handleGenerateTitles = async () => {
    try {
      setIsGenerating(true)
      if (
        !formData.topic.trim() ||
        formData.focusKeywords.length === 0 ||
        formData.keywords.length === 0
      ) {
        updateErrors({
          topic: !formData.topic.trim() ? "Please enter a topic name" : "",
          focusKeywords:
            formData.focusKeywords.length === 0 ? "Please enter at least 1 focus keyword" : "",
          keywords: formData.keywords.length === 0 ? "Please enter at least 1 keyword" : "",
        })
        toast.error(
          "Please enter a topic and at least one focus keyword and keyword before generating titles."
        )
        return
      }
      const payload = {
        template: formData.template,
        topic: formData.topic,
        focusKeywords: formData.focusKeywords,
        keywords: formData.keywords,
        ...(generatedTitles?.length > 0 && { oldTitles: generatedTitles }),
      }
      const result = await getGeneratedTitles(payload)
      setGeneratedTitles(result)
    } catch (error) {
      console.error("Error generating titles:", error)
      toast.error("Failed to generate titles. Please try again later.")
    } finally {
      setIsGenerating(false)
    }
  }

  // setting the selected analyzed keywords from keywords planner
  const selectedKeywords = useAnalysisStore(state => state.selectedKeywords)
  useEffect(() => {
    if (selectedKeywords) {
      setFormData(prev => ({
        ...prev,
        focusKeywords: selectedKeywords.focusKeywords || prev.focusKeywords,
        keywords: selectedKeywords.keywords || prev.keywords,
      }))
    }
  }, [selectedKeywords])

  // Memoized estimated cost calculation
  const estimatedCost = useMemo(() => {
    const features = []
    if (formData.isCheckedBrand) features.push("brandVoice")
    if (formData.options.includeCompetitorResearch) features.push("competitorResearch")
    if (formData.options.performKeywordResearch) features.push("keywordResearch")
    if (formData.options.includeInterlinks) features.push("internalLinking")
    if (formData.options.includeFaqs) features.push("faqGeneration")
    if (formData.isCheckedQuick) features.push("quickSummary")
    if (formData.options.addOutBoundLinks) features.push("outboundLinks")

    let cost = computeCost({
      wordCount: formData.userDefinedLength,
      features,
      aiModel: formData.aiModel || "gemini",
      includeImages: formData.isCheckedGeneratedImages,
      imageSource: formData.imageSource,
      numberOfImages:
        formData.imageSource === IMAGE_OPTIONS.at(-1)?.id
          ? formData.blogImages.length
          : formData.numberOfImages,
    })

    if (formData.costCutter) {
      cost = Math.round(cost * 0.75)
    }

    return cost
  }, [
    formData.isCheckedBrand,
    formData.options.includeCompetitorResearch,
    formData.options.performKeywordResearch,
    formData.options.includeInterlinks,
    formData.options.includeFaqs,
    formData.isCheckedQuick,
    formData.options.addOutBoundLinks,
    formData.userDefinedLength,
    formData.aiModel,
    formData.isCheckedGeneratedImages,
    formData.imageSource,
    formData.numberOfImages,
    formData.blogImages.length,
    formData.costCutter,
  ])

  const updateFormData = useCallback((newData: Partial<typeof initialData>) => {
    setFormData(prev => ({ ...prev, ...newData }))
  }, [])

  const updateErrors = useCallback((error: FormError) => {
    setErrors(prev => ({ ...prev, ...error }))
  }, [])

  const validateFields = useCallback(() => {
    const errors: FormError = {}
    switch (currentStep) {
      case 0:
        if (formData.templateIds.length !== 1) errors.template = "Please select at least 1 template"

        break
      case 1:
        if (!formData.topic.length) errors.topic = "Please enter a topic name"

        if (!formData.options.performKeywordResearch) {
          if (!formData.focusKeywords.length)
            errors.focusKeywords = "Please enter at least 1 focus keyword"

          if (!formData.keywords.length) errors.keywords = "Please enter at least 1 keyword"

          if (!formData.title.length) errors.title = "Please enter a title"
        }

        if (!formData.tone.trim()) errors.tone = "Please select a tone of voice"
        break
      case 2:
        if (
          formData.isCheckedGeneratedImages &&
          formData.imageSource === IMAGE_OPTIONS.at(-1)?.id &&
          formData.blogImages.length == 0
        )
          errors.blogImages = "Please upload at least 1 image."
        break
      case 3:
        if (formData.isCheckedBrand && !formData.brandId.trim())
          errors.brandId = "Please select a Brand Voice"
    }
    if (Object.keys(errors).length) {
      updateErrors(errors)
      return false
    }
    return true
  }, [formData, currentStep, updateErrors])

  const handleNext = useCallback(() => {
    if (validateFields()) {
      setCurrentStep(prev => prev + 1)
    }
  }, [validateFields])

  const handlePrev = useCallback(() => setCurrentStep(prev => prev - 1), [])

  const handleClose = () => {
    setFormData(initialData)
    setErrors({})
    setCurrentStep(0)
    closeFnc?.()
  }

  const handleSubmit = async () => {
    if (validateFields()) {
      // Check if user has sufficient credits
      // Use memoized estimated cost
      const finalCost = estimatedCost

      const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

      if (userCredits < finalCost) {
        handlePopup({
          title: "Insufficient Credits",
          description: (
            <div>
              <p>You don't have enough credits to generate this blog.</p>
              <p className="mt-1">
                <strong>Required:</strong> {finalCost} credits
              </p>
              <p>
                <strong>Available:</strong> {userCredits} credits
              </p>
            </div>
          ),
          okText: "Buy Credits",
          onConfirm: () => {
            void navigate("/pricing")
            handleClose()
          },
        })
        return
      }

      console.debug("Advanced Modal Form Data : ", formData)
      const data = { ...formData, options: { ...formData.options } } as Partial<typeof initialData>

      // Set imageSource to "none" if images are disabled
      if (!formData.isCheckedGeneratedImages) {
        data.imageSource = IMAGE_SOURCE.NONE
      }

      if (!formData.isCheckedGeneratedImages || formData.imageSource !== IMAGE_OPTIONS.at(-1)?.id) {
        delete data.blogImages
      }
      if (!formData.isCheckedBrand) {
        delete data.brandId
      }
      if (formData.options.performKeywordResearch) {
        delete data.title
        delete data.keywords
        delete data.focusKeywords
      }
      // Validate with Zod schema (logs to console when VITE_VALIDATE_FORMS=true)
      const validatedData = validateAdvancedBlogData(data)

      const loadingId = showLoading("Creating your blog...")

      try {
        const { createNewBlog } = useBlogStore.getState()

        await createNewBlog({ blogData: validatedData, user, navigate, queryClient } as any)

        // ✅ Only close modal on success
        handleClose()
      } catch (error: unknown) {
        // ❌ Don't close modal - let user retry
        toast.error((error as Error)?.message || "Failed to create blog. Please try again.")
      } finally {
        hideLoading(loadingId)
      }
    }
  }

  const handleTemplateSelection = useCallback((templates: BlogTemplate[]) => {
    updateFormData({ template: templates?.[0]?.name || "", templateIds: templates?.map(t => t.id) })
    updateErrors({ template: "" })
  }, [])

  const handleInputChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
        | { target: { name: string; value: string | number | boolean | string[] | any[] } }
    ) => {
      const { name, value } = event.target

      if (!name) throw new Error("Advanced blog form component error")

      const keys = name.split(".")

      if (keys.length > 1) {
        setFormData(prev => setValueByPath(prev, keys, value))
      } else {
        updateFormData({ [name]: value } as unknown as Partial<typeof initialData>)

        updateErrors({ [name]: "" })
      }
    },
    []
  )

  const renderSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div
              className={clsx("p-2", errors?.template && "border-2 border-rose-500 rounded-2xl")}
            >
              <TemplateSelection
                userSubscriptionPlan={user?.subscription?.plan || "free"}
                preSelectedIds={formData.templateIds}
                onClick={handleTemplateSelection}
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-3 p-4 pt-0">
            {/* Topic */}
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                name="topic"
                placeholder="e.g., Tech Blog"
                value={formData.topic}
                onChange={handleInputChange}
                className={`w-full mt-2 p-2 rounded-md border bg-white text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600
        ${errors.topic ? "border-red-500" : "border-slate-300"}`}
              />
              {errors.topic && <p className="text-xs mt-1 text-red-500">{errors.topic}</p>}
            </div>

            {/* Language */}
            <div className="form-control space-y-2">
              <label className="label pb-0">
                <span className="label-text font-semibold text-slate-800">
                  Language <span className="text-error">*</span>
                </span>
              </label>

              <select
                value={formData.languageToWrite}
                onChange={e =>
                  handleInputChange({ target: { name: "languageToWrite", value: e.target.value } })
                }
                className="select w-full rounded-lg focus:outline-none focus:border-0"
              >
                <option value="">Select language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Generate Toggle */}
            <div className="flex items-center justify-between mt-4">
              <label className="text-sm font-semibold text-slate-800">
                Auto Generate Title & Keywords
              </label>
              <Switch
                checked={formData.options.performKeywordResearch}
                onCheckedChange={(checked: boolean) =>
                  handleInputChange({
                    target: { name: "options.performKeywordResearch", value: checked },
                  })
                }
              />
            </div>

            {!formData.options.performKeywordResearch && (
              <>
                {/* Focus Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Focus Keywords (max 3)
                  </label>
                  <input
                    placeholder="Type and press comma"
                    className="w-full mt-2 p-2 rounded-md border border-slate-300 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
                    onKeyDown={e => {
                      if (e.key === "," || e.key === "Enter") {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && formData.focusKeywords.length < 3) {
                          handleInputChange({
                            target: {
                              name: "focusKeywords",
                              value: [...formData.focusKeywords, val],
                            },
                          })
                          ;(e.target as HTMLInputElement).value = ""
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.focusKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Keywords</label>
                  <input
                    placeholder="Type and press comma"
                    className="w-full mt-2 p-2 rounded-md border border-slate-300 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
                    onKeyDown={e => {
                      if (e.key === "," || e.key === "Enter") {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val) {
                          handleInputChange({
                            target: { name: "keywords", value: [...formData.keywords, val] },
                          })
                          ;(e.target as HTMLInputElement).value = ""
                        }
                      }
                    }}
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Blog Title</label>
                  <div className="flex gap-2">
                    <input
                      name="title"
                      placeholder="e.g., How to create a blog"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="flex-1 mt-2 p-2 rounded-md border border-slate-300 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
                    />
                    <button
                      onClick={handleGenerateTitles}
                      disabled={isGenerating}
                      className="mt-2 p-2 rounded-md bg-blue-600 text-white text-sm font-semibold
              hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  </div>

                  {generatedTitles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedTitles.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => handleInputChange({ target: { name: "title", value: t } })}
                          className={`px-3 py-1 text-xs rounded-md border transition
                  ${
                    formData.title === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-slate-300 hover:bg-slate-100"
                  }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exact Title Toggle */}
                <div className="flex items-center justify-between my-4">
                  <label className="text-sm font-semibold text-slate-800">
                    Use Exact Title for Blog
                  </label>
                  <Switch
                    checked={formData.options.exactTitle}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange({ target: { name: "options.exactTitle", value: checked } })
                    }
                  />
                </div>
              </>
            )}

            {/* Tone + Length */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Tone */}
              <div className="form-control space-y-2">
                <label className="label pb-0">
                  <span className="label-text font-semibold text-slate-800">Tone of Voice</span>
                </label>

                <select
                  value={formData.tone}
                  onChange={e =>
                    handleInputChange({ target: { name: "tone", value: e.target.value } })
                  }
                  className="select select-bordered w-full rounded-lg"
                >
                  <option value="">Select tone</option>
                  {TONES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blog Length */}
              <div className="form-control space-y-3">
                <label className="label">
                  <span className="label-text font-semibold text-slate-800">Blog Length</span>
                  <span className="label-text-alt font-semibold text-primary">
                    {formData.userDefinedLength} words
                  </span>
                </label>

                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={formData.userDefinedLength}
                  onChange={e =>
                    handleInputChange({
                      target: { name: "userDefinedLength", value: Number(e.target.value) },
                    })
                  }
                  className="range range-primary"
                />

                <div className="flex justify-between text-xs text-slate-400">
                  <span>500</span>
                  <span>5000</span>
                </div>
              </div>
            </div>

            {/* Brief */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">Add Brief Section</label>
              <textarea
                name="brief"
                rows={3}
                value={formData.brief}
                onChange={handleInputChange}
                placeholder="Enter the brief info or instructions"
                className="w-full mt-2 px-4 py-3 rounded-lg border border-slate-300 bg-white text-sm
        focus:outline-none resize-none"
              />
            </div>
          </div>
        )

      case 2: {
        return (
          <div className="space-y-3 p-4 pt-0">
            {/* AI Model Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Select AI Model</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {AI_MODELS.map(model => {
                  const isActive = formData.aiModel === model.id

                  return (
                    <button
                      key={model.id}
                      onClick={() =>
                        handleInputChange({ target: { name: "aiModel", value: model.id } })
                      }
                      className={`flex items-center gap-3 px-5 py-4 rounded-lg border transition
              ${
                isActive ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              }`}
                    >
                      <img src={model.logo} alt={model.label} className="w-6 h-6" />
                      <span className="font-semibold text-sm">{model.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cost Cutter */}
            <div className="flex items-center justify-between p-5 rounded-lg bg-green-50 border border-green-200">
              <div>
                <p className="font-semibold text-sm text-green-800">Cost Cutter</p>
                <p className="text-xs text-green-600 mt-1">Use AI Flash model for 25% savings</p>
              </div>

              <Switch
                checked={formData.costCutter}
                onCheckedChange={(checked: boolean) => updateFormData({ costCutter: checked })}
              />
            </div>

            {/* Feature Toggles */}
            <div className="space-y-5 my-5">
              {[
                { label: "Easy to Understand", name: "options.easyToUnderstand" },
                { label: "Embed YouTube Videos", name: "options.embedYouTubeVideos" },
                { label: "Add Images", name: "isCheckedGeneratedImages" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.label}</span>

                  <Switch
                    checked={
                      item.name.includes("options")
                        ? formData.options[item.name.split(".")[1]]
                        : formData[item.name]
                    }
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange({ target: { name: item.name, value: checked } })
                    }
                  />
                </div>
              ))}
            </div>

            {/* Image Source Settings */}
            {formData.isCheckedGeneratedImages && (
              <div className="space-y-6 overflow-hidden mt-6">
                <label className="text-sm font-semibold text-slate-800">Select Image Mode</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {IMAGE_OPTIONS.map((option, index) => {
                    const isRestricted = option.restrict && user?.subscription?.plan === "free"
                    const isLimitReached =
                      index === 1 &&
                      (user?.usage?.aiImages || 0) >= (user?.usageLimits?.aiImages || 0)
                    const isDisabled = isRestricted || isLimitReached

                    return (
                      <button
                        key={option.id}
                        disabled={isDisabled}
                        onClick={() => {
                          handleInputChange({ target: { name: "imageSource", value: option.id } })
                          if (option.id !== IMAGE_OPTIONS.at(-1)?.id) {
                            handleInputChange({ target: { name: "blogImages", value: [] } })
                          }
                        }}
                        className={clsx(
                          "relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-sm",
                          formData.imageSource === option.id
                            ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                            : "bg-white border-slate-200 hover:border-blue-200 text-slate-600",
                          isDisabled && "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100"
                        )}
                      >
                        <span className="text-center">{option.label}</span>
                      </button>
                    )
                  })}
                </div>

                {formData.imageSource !== IMAGE_OPTIONS.at(-1)?.id ? (
                  <div className="flex items-center justify-between mt-4">
                    <label className="text-sm font-semibold text-slate-800">
                      Number of Images (0 = Decided by AI) :
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={formData.numberOfImages}
                      onChange={e =>
                        handleInputChange({
                          target: {
                            name: "numberOfImages",
                            value: e.target.value ? parseInt(e.target.value) : 0,
                          },
                        })
                      }
                      className="w-48 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <BlogImageUpload
                      id="blog-upload-images"
                      label="Upload Custom Images"
                      maxCount={15}
                      initialFiles={formData.blogImages}
                      onChange={(file: any) =>
                        handleInputChange({ target: { name: "blogImages", value: file } })
                      }
                    />
                    {errors.blogImages && (
                      <p className="text-xs text-red-500 font-semibold mt-1">{errors.blogImages}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reference Links */}
            <div className="space-y-4 mt-8">
              <h4 className="text-sm font-semibold">Reference Links (max 3)</h4>

              <input
                placeholder="Add reference links"
                className="input input-bordered w-full rounded-lg"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const val = (e.target as HTMLInputElement).value.trim()

                    if (val && formData.referenceLinks.length < 3) {
                      handleInputChange({
                        target: {
                          name: "referenceLinks",
                          value: [...formData.referenceLinks, val],
                        },
                      })
                      ;(e.target as HTMLInputElement).value = ""
                    }
                  }
                }}
              />

              <div className="space-y-2">
                {formData.referenceLinks.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-md"
                  >
                    <span className="text-sm text-slate-600 truncate">{link}</span>

                    <button
                      onClick={() =>
                        handleInputChange({
                          target: {
                            name: "referenceLinks",
                            value: formData.referenceLinks.filter((_, idx) => idx !== i),
                          },
                        })
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
      case 3:
        return (
          <div className="space-y-8 p-4 pt-0">
            {/* Options List */}
            <div className="space-y-6">
              {BLOG_OPTIONS.map((option, index) => (
                <div key={option.key + index} className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{option.label}</span>

                  <Switch
                    checked={getValueByPath(formData, option.key)}
                    onCheckedChange={(checked: boolean) =>
                      handleInputChange({ target: { name: option.key, value: checked } })
                    }
                  />
                </div>
              ))}
            </div>

            <BrandVoiceSelector
              label="Write with Brand Voice"
              value={{
                isCheckedBrand: formData.isCheckedBrand,
                brandId: formData.brandId,
                addCTA: formData.options.addCTA,
              }}
              size="default"
              labelClass="text-sm font-semibold"
              onChange={val => {
                const opts = formData.options
                updateFormData({
                  isCheckedBrand: val.isCheckedBrand,
                  brandId: val.brandId,
                  options: { ...opts, addCTA: val.addCTA },
                })
                updateErrors({ brandId: "" })
              }}
              errorText={errors.brandId}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <dialog className="modal modal-open bg-black/60">
      <div className="modal-box w-full max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-md font-black text-slate-900 tracking-tight">
              Generate Advanced Blog | {STEP_TITLES[currentStep]}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </button>
        </div>

        <div
          className="p-4 pt-0 max-h-[70vh] overflow-y-auto custom-scroll space-y-4"
          style={{ scrollbarWidth: "none" }}
        >
          {renderSteps()}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between border-gray-300">
          <div className="flex items-center gap-6">
            {(currentStep === 2 || currentStep === 3) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-bold text-blue-600"> {estimatedCost}</span>
                <span className="text-xs text-green-600 font-medium">(-25% off)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-200/90 transition-colors border border-gray-300"
              >
                Previous
              </button>
            )}
            <button
              onClick={currentStep === 3 ? handleSubmit : handleNext}
              className="px-6 py-2 bg-[#1B6FC9] text-white rounded-md hover:bg-[#1B6FC9]/90 transition-colors"
            >
              {currentStep === 3 ? <>Generate Blog</> : <>Next</>}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default AdvancedBlogModal
