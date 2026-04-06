import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { setValueByPath } from "@utils/ObjectPath"
import { AI_MODELS, TONES, IMAGE_OPTIONS, IMAGE_SOURCE, LANGUAGES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import AdvancedOptions from "@components/AdvancedOptions"
import { computeCost } from "@/data/pricingConfig"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { validateAdvancedBlogData } from "@/types/forms.schemas"
import { useQueryClient } from "@tanstack/react-query"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"
import { toast } from "sonner"
import { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import useAnalysisStore from "@store/useAnalysisStore"
import { getGeneratedTitles } from "@api/blogApi"
import clsx from "clsx"
import { Switch } from "@components/ui/switch"
import { Slider } from "@components/ui/slider"
import { X } from "lucide-react"
import useIntegrationStore from "@store/useIntegrationStore"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

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
    tone: TONES[0] as string,
    userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT as number,
    brief: "" as string,
    aiModel: AI_MODELS[0].id as string,
    isCheckedGeneratedImages: false as boolean,
    imageSource: IMAGE_OPTIONS[0].id as any,
    numberOfImages: 0 as number,
    blogImages: [] as any[],
    referenceLinks: [] as string[],
    isCheckedQuick: false as boolean,
    isCheckedBrand: false as boolean,
    brandId: "" as string,
    languageToWrite: "English" as string,
    costCutter: true as boolean,
    wordpressPostStatus: false as boolean,
    postingType: null as string | null,
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
      includeTableOfContents: false as boolean,
      extendedThinking: false as boolean,
      deepResearch: false as boolean,
      humanisation: false as boolean,
    },
  }

  type FormError = Partial<Record<keyof typeof initialData, string>>

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()
  const { integrations, fetchIntegrations } = useIntegrationStore()

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
  const { selectedKeywords, pendingImport, setPendingImport } = useAnalysisStore()
  useEffect(() => {
    if (pendingImport === "blog" && selectedKeywords) {
      setFormData(prev => ({
        ...prev,
        focusKeywords: selectedKeywords.focusKeywords || prev.focusKeywords,
        keywords: selectedKeywords.keywords || prev.keywords,
      }))
      setPendingImport(null)
    }
  }, [selectedKeywords, pendingImport, setPendingImport])

  const handleAddKeywordItems = (
    inputValue: string | string[],
    type: "keywords" | "focusKeywords"
  ) => {
    const seen = new Set<string>()
    const rawItems = Array.isArray(inputValue) ? inputValue : inputValue.split(/[,\t\n\r;]+/)
    const items = rawItems
      .map(k => k.trim())
      .filter(k => k !== "" && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))
    if (items.length === 0) return

    const existingSet = new Set(formData[type].map(k => k.trim().toLowerCase()))
    const newItems = items
      .map(k => k.trim())
      .filter(k => k !== "" && !existingSet.has(k.toLowerCase()))

    if (newItems.length === 0) return

    if (type === "focusKeywords" && formData.focusKeywords.length + newItems.length > 3) {
      toast.error("Maximum 3 focus keywords allowed. Adding only the first available.")
      const available = 3 - formData.focusKeywords.length
      if (available > 0) {
        updateFormData({
          focusKeywords: [...formData.focusKeywords, ...newItems.slice(0, available)],
        })
      }
      return
    }

    updateFormData({ [type]: [...formData[type], ...newItems] })
  }

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
    if (formData.options.humanisation) features.push("humanisation")
    if (formData.options.extendedThinking) features.push("extendedThinking")
    if (formData.options.deepResearch) features.push("deepResearch")

    let cost = computeCost({
      wordCount: formData.userDefinedLength,
      features,
      aiModel: formData.aiModel || "gemini",
      includeImages: formData.isCheckedGeneratedImages,
      imageSource: formData.imageSource,
      numberOfImages:
        formData.imageSource === IMAGE_SOURCE.UPLOAD
          ? formData.blogImages.length
          : formData.numberOfImages,
    })

    if (formData.costCutter) {
      cost = Math.round(cost * 0.5)
    }

    return cost
  }, [
    formData.isCheckedBrand,
    formData.options.includeCompetitorResearch,
    formData.options.performKeywordResearch,
    formData.options.includeInterlinks,
    formData.options.includeFaqs,
    formData.options.humanisation,
    formData.options.extendedThinking,
    formData.options.deepResearch,
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
        if (formData.templateIds.length === 0)
          errors.template = "Please select a template to continue."
        else if (formData.templateIds.length > 1) errors.template = "Please select only 1 template."
        break
      case 1:
        if (!formData.topic.length) errors.topic = "Please enter a topic name"

        if (!formData.options.performKeywordResearch) {
          if (!formData.focusKeywords.length)
            errors.focusKeywords = "Please enter at least 1 focus keyword"

          if (!formData.keywords.length) errors.keywords = "Please enter at least 1 keyword"

          if (!formData.title.length) errors.title = "Please enter a title"
        }
        break
      case 2:
        if (
          formData.isCheckedGeneratedImages &&
          formData.imageSource === IMAGE_SOURCE.UPLOAD &&
          formData.blogImages.length == 0
        )
          errors.blogImages = "Please upload at least 1 image."
        break
      case 3:
        if (formData.wordpressPostStatus && !formData.postingType)
          errors.postingType = "Please select a Publishing Platform"
        break
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

      if (!formData.isCheckedGeneratedImages || formData.imageSource !== IMAGE_SOURCE.UPLOAD) {
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
    // Clear error as soon as exactly 1 template is selected
    if (templates?.length === 1) {
      updateErrors({ template: "" })
    }
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
        // Special handling for image toggle
        if (name === "isCheckedGeneratedImages") {
          setFormData(prev => ({
            ...prev,
            isCheckedGeneratedImages: value as boolean,
            imageSource: value
              ? prev.imageSource === IMAGE_SOURCE.NONE
                ? IMAGE_SOURCE.STOCK
                : prev.imageSource
              : IMAGE_SOURCE.NONE,
          }))
          updateErrors({ isCheckedGeneratedImages: "", imageSource: "" } as any)
          return
        }

        updateFormData({ [name]: value } as unknown as Partial<typeof initialData>)

        updateErrors({ [name]: "" })
      }
    },
    [updateFormData, updateErrors]
  )

  const renderSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            {/* Instruction hint */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-slate-500">
                Select <span className="font-semibold text-slate-700">exactly 1 template</span> to
                continue to the next step.
              </p>
              {formData.templateIds.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  {formData.templateIds.length} selected
                </span>
              )}
            </div>

            {/* Template grid with error highlight */}
            <div
              className={clsx(
                "rounded-xl transition-all duration-200",
                errors?.template ? "border-2 border-red-500 p-1" : "p-1"
              )}
            >
              <TemplateSelection
                userSubscriptionPlan={user?.subscription?.plan || "free"}
                preSelectedIds={formData.templateIds}
                onClick={handleTemplateSelection}
                error={errors?.template}
              />
            </div>

            {/* Inline error message handled by TemplateSelection internally */}
          </div>
        )
      case 1:
        return (
          <div className="space-y-3 p-4 pt-0">
            {/* Topic */}
            <div>
              <label className="text-sm font-semibold ">
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
              <label>
                <span className="text-sm font-semibold">
                  Language <span className="text-error">*</span>
                </span>
              </label>

              <select
                value={formData.languageToWrite}
                onChange={e =>
                  handleInputChange({ target: { name: "languageToWrite", value: e.target.value } })
                }
                className="select w-full rounded-lg focus:outline-none focus:border-0 mt-3"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Generate Toggle */}
            <div className="flex items-center justify-between mt-4">
              <label className="text-sm font-semibold ">Auto Generate Title & Keywords</label>
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
                  <label className="text-sm font-semibold ">
                    Focus Keywords (max 3) <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Type and press comma"
                    className={`w-full mt-2 p-2 rounded-md border bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 ${errors.focusKeywords ? "border-red-500" : "border-slate-300"
                      }`}
                    onKeyDown={e => {
                      if (e.key === "," || e.key === "Enter") {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value
                        handleAddKeywordItems(val, "focusKeywords")
                          ; (e.target as HTMLInputElement).value = ""
                      }
                    }}
                    onPaste={e => {
                      extractKeywordsFromClipboard(e, {
                        type: "focusKeywords",
                        cb: handleAddKeywordItems,
                      })
                    }}
                  />
                  {errors.focusKeywords && (
                    <p className="text-xs mt-1 text-red-500">{errors.focusKeywords}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.focusKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1"
                      >
                        {kw}
                        <button
                          title="Remove keyword"
                          onClick={() => {
                            handleInputChange({
                              target: {
                                name: "focusKeywords",
                                value: formData.focusKeywords.filter((_, idx) => idx !== i),
                              },
                            })
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold ">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Type and press comma"
                    className={`w-full mt-2 p-2 rounded-md border bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 ${errors.keywords ? "border-red-500" : "border-slate-300"
                      }`}
                    onKeyDown={e => {
                      if (e.key === "," || e.key === "Enter") {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value
                        handleAddKeywordItems(val, "keywords")
                          ; (e.target as HTMLInputElement).value = ""
                      }
                    }}
                    onPaste={e => {
                      extractKeywordsFromClipboard(e, {
                        type: "keywords",
                        cb: handleAddKeywordItems,
                      })
                    }}
                  />
                  {errors.keywords && (
                    <p className="text-xs mt-1 text-red-500">{errors.keywords}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1"
                      >
                        {kw}
                        <button
                          title="Remove keyword"
                          onClick={() => {
                            handleInputChange({
                              target: {
                                name: "keywords",
                                value: formData.keywords.filter((_, idx) => idx !== i),
                              },
                            })
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold ">
                    Blog Title <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="title"
                      placeholder="e.g., How to create a blog"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`flex-1 mt-2 p-2 rounded-md border bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 ${errors.title ? "border-red-500" : "border-slate-300"
                        }`}
                    />
                    <button
                      onClick={handleGenerateTitles}
                      disabled={isGenerating}
                      className="mt-2 px-6 py-2 rounded-md bg-[#4C5BD6] text-white text-sm font-bold
              hover:bg-[#3B4BB8] transition disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </button>
                  </div>
                  {errors.title && <p className="text-xs mt-1 text-red-500">{errors.title}</p>}

                  {generatedTitles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedTitles.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => handleInputChange({ target: { name: "title", value: t } })}
                          className={`px-3 py-1 text-xs rounded-md border transition
                  ${formData.title === t
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
                  <label className="text-sm font-semibold ">Use Exact Title for Blog</label>
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
                <label className="pb-0">
                  <span className="text-sm font-semibold ">Tone of Voice</span>
                </label>

                <select
                  value={formData.tone}
                  onChange={e =>
                    handleInputChange({ target: { name: "tone", value: e.target.value } })
                  }
                  className={`select select-bordered w-full rounded-lg mt-3 ${errors.tone ? "border-red-500" : ""
                    }`}
                >
                  {TONES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blog Length */}
              <div className="form-control space-y-3">
                <label>
                  <span className="text-sm font-semibold ">Blog Length</span>
                  <span className="text-sm ml-2 font-semibold text-primary">
                    {formData.userDefinedLength} words
                  </span>
                </label>
                <Slider
                  min={BLOG_CONFIG.LENGTH.MIN}
                  max={BLOG_CONFIG.LENGTH.MAX}
                  step={BLOG_CONFIG.LENGTH.STEP}
                  value={[formData.userDefinedLength]}
                  onValueChange={(vals: number[]) =>
                    handleInputChange({ target: { name: "userDefinedLength", value: vals[0] } })
                  }
                  className="w-full mt-5"
                />

                <div className="flex justify-between text-xs text-slate-400">
                  <span>{BLOG_CONFIG.LENGTH.MIN}</span>
                  <span>{BLOG_CONFIG.LENGTH.MAX}</span>
                </div>
              </div>
            </div>

            {/* Brief */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ">Add Brief Section</label>
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
            <AiModelSelector
              value={formData.aiModel}
              onChange={(modelId: string) => updateFormData({ aiModel: modelId })}
              showCostCutter={true}
              costCutterValue={formData.costCutter}
              onCostCutterChange={(checked: boolean) => updateFormData({ costCutter: checked })}
            />

            {/* Feature Toggles */}
            <div className="space-y-4 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Add Images</span>
                <Switch
                  size="large"
                  checked={formData.isCheckedGeneratedImages}
                  onCheckedChange={(checked: boolean) =>
                    updateFormData({ isCheckedGeneratedImages: checked })
                  }
                />
              </div>
            </div>

            {/* Image Source Settings */}
            {formData.isCheckedGeneratedImages && (
              <div className="space-y-6 overflow-hidden">
                <ImageSourceSelector
                  value={formData.imageSource}
                  onChange={(sourceId: string) => {
                    handleInputChange({ target: { name: "imageSource", value: sourceId } })
                  }}
                  showUpload={true}
                  error={errors.imageSource}
                  numberOfImages={formData.numberOfImages}
                  onNumberChange={(val: number) => {
                    handleInputChange({ target: { name: "numberOfImages", value: val } })
                  }}
                />

                {/* Custom Image Upload Zone */}
                {formData.imageSource === IMAGE_SOURCE.UPLOAD && (
                  <div className="space-y-3 mt-2">
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                        ${errors.blogImages
                          ? "border-red-400 bg-red-50"
                          : "border-slate-300 bg-slate-50 hover:border-[#4C5BD6] hover:bg-blue-50/30"
                        }
                      `}
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/*"
                        input.multiple = true
                        input.onchange = async (e: Event) => {
                          const files = Array.from((e.target as HTMLInputElement).files || [])
                          if (
                            formData.blogImages.length + files.length >
                            BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT
                          ) {
                            toast.error(
                              `You can upload a maximum of ${BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT} images.`
                            )
                            return
                          }
                          const oversized = files.filter(
                            f => f.size > BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB * 1024 * 1024
                          )
                          if (oversized.length > 0) {
                            toast.error(
                              `Each image must be ${BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB}MB or less.`
                            )
                            return
                          }
                          const readers = files.map(
                            file =>
                              new Promise<any>(resolve => {
                                const reader = new FileReader()
                                reader.onload = ev =>
                                  resolve({
                                    originFileObj: file,
                                    name: file.name,
                                    type: file.type,
                                    src: ev.target?.result as string,
                                  })
                                reader.readAsDataURL(file)
                              })
                          )
                          const newImages = await Promise.all(readers)
                          updateFormData({ blogImages: [...formData.blogImages, ...newImages] })
                          updateErrors({ blogImages: "" })
                        }
                        input.click()
                      }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => {
                        e.preventDefault()
                        const files = Array.from(e.dataTransfer.files).filter(f =>
                          f.type.startsWith("image/")
                        )
                        if (
                          formData.blogImages.length + files.length >
                          BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT
                        ) {
                          toast.error(
                            `You can upload a maximum of ${BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT} images.`
                          )
                          return
                        }
                        const oversized = files.filter(
                          f => f.size > BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB * 1024 * 1024
                        )
                        if (oversized.length > 0) {
                          toast.error(
                            `Each image must be ${BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB}MB or less.`
                          )
                          return
                        }
                        const readers = files.map(
                          file =>
                            new Promise<any>(resolve => {
                              const reader = new FileReader()
                              reader.onload = ev =>
                                resolve({
                                  originFileObj: file,
                                  name: file.name,
                                  type: file.type,
                                  src: ev.target?.result as string,
                                })
                              reader.readAsDataURL(file)
                            })
                        )
                        const newImages = await Promise.all(readers)
                        updateFormData({ blogImages: [...formData.blogImages, ...newImages] })
                        updateErrors({ blogImages: "" })
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-600">
                          Click or drag images here
                        </p>
                        <div className="text-xs text-slate-500 mt-2 space-y-1">
                          <p>Supported: PNG, JPEG, WEBP</p>
                          <p>
                            Max {BLOG_CONFIG.IMAGES.MAX_UPLOAD_COUNT} images • Max{" "}
                            {BLOG_CONFIG.IMAGES.MAX_FILE_SIZE_MB}MB per image
                          </p>
                        </div>
                      </div>
                    </div>

                    {errors.blogImages && (
                      <p className="text-xs text-red-500 font-medium">{errors.blogImages}</p>
                    )}

                    {/* Preview grid */}
                    {formData.blogImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {formData.blogImages.map((img, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img
                              src={img.src || img}
                              alt={`Upload ${i + 1}`}
                              className="w-full h-full object-cover rounded-lg border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateFormData({
                                  blogImages: formData.blogImages.filter((_, idx) => idx !== i),
                                })
                              }
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full
                                flex items-center justify-center opacity-0 group-hover:opacity-100
                                transition-opacity text-[10px] leading-none"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-400 text-right">
                      {formData.blogImages.length} / 15 images uploaded
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reference Links */}
            <div className="space-y-4 mt-5">
              <h4 className="text-sm font-semibold">Reference Links (max 3)</h4>

              <input
                placeholder="Add reference links"
                className="input input-bordered w-full rounded-lg"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const val = (e.target as HTMLInputElement).value.trim()

                    if (val) {
                      if (formData.referenceLinks.includes(val)) {
                        toast.error("This reference link is already added.")
                        return
                      }
                      if (formData.referenceLinks.length >= 3) {
                        toast.error("Maximum 3 reference links allowed.")
                        return
                      }
                      handleInputChange({
                        target: {
                          name: "referenceLinks",
                          value: [...formData.referenceLinks, val],
                        },
                      })
                        ; (e.target as HTMLInputElement).value = ""
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
          <div className="space-y-6 p-4 pt-0">
            {/* 1-4. AdvancedOptions Group A */}
            <AdvancedOptions
              formData={formData}
              updateFormData={updateFormData}
              isNestedOptions={true}
              showFields={["easyToUnderstand", "humanisation", "extendedThinking", "deepResearch"]}
            />

            {/* 5. Add Quick Summary */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-semibold">Add a Quick Summary</label>
                <p className="text-xs text-slate-500">Generate a concise summary for the readers</p>
              </div>
              <div className="flex items-center">
                <Switch
                  size="large"
                  checked={formData.isCheckedQuick}
                  onCheckedChange={(checked: boolean) =>
                    updateFormData({ isCheckedQuick: checked })
                  }
                />
              </div>
            </div>

            {/* 6-9. AdvancedOptions Group B */}
            <AdvancedOptions
              formData={formData}
              updateFormData={updateFormData}
              isNestedOptions={true}
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
              updateFormData={updateFormData}
              isNestedOptions={true}
              showFields={["embedYouTubeVideos"]}
            />

            {/* 11. Write with Brand Voice */}
            <BrandVoiceSelector
              label="Write with Brand Voice"
              value={{
                isCheckedBrand: formData.isCheckedBrand,
                brandId: formData.brandId,
                addCTA: formData.options.addCTA,
              }}
              labelClass="text-sm font-semibold"
              onChange={val => {
                const opts = formData.options
                updateFormData({
                  isCheckedBrand: val.isCheckedBrand,
                  brandId: val.brandId,
                  options: { ...opts, addCTA: val.addCTA },
                })
              }}
            />

            {/* 12. Automatic Posting */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold">Automatic Posting</label>
                  <p className="text-xs text-slate-500">
                    Automatically post to your connected platforms
                  </p>
                </div>
                <div className="flex items-center">
                  <Switch
                    checked={formData.wordpressPostStatus}
                    size="large"
                    onCheckedChange={(checked: boolean) => {
                      const hasAnyIntegration =
                        Object.keys(integrations?.integrations || {}).length > 0
                      if (checked && !hasAnyIntegration) {
                        toast.error("Please connect your account in plugins.")
                        return
                      }
                      updateFormData({
                        wordpressPostStatus: checked,
                        postingType: checked
                          ? formData.postingType || Object.keys(integrations?.integrations || {})[0]
                          : null,
                      })
                    }}
                  />
                </div>
              </div>

              {formData.wordpressPostStatus &&
                integrations?.integrations &&
                Object.keys(integrations.integrations).length > 0 && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Publishing Platform
                    </label>
                    <select
                      value={formData.postingType || ""}
                      onChange={e => updateFormData({ postingType: e.target.value })}
                      className="select select-bordered w-full rounded-lg text-sm h-10 min-h-0 focus:outline-none"
                    >
                      <option value="" disabled>
                        Select Platform
                      </option>
                      {Object.entries(integrations.integrations).map(([platform]) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                    {errors.postingType && (
                      <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                        {errors.postingType}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-sm font-semibold ">Table of Contents</p>
                        <p className="text-xs text-slate-500">
                          Include a table of contents in your post
                        </p>
                      </div>
                      <Switch
                        size="large"
                        checked={formData.options.includeTableOfContents}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange({
                            target: { name: "options.includeTableOfContents", value: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
            </div>
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

        <div className="p-4 border-t border-gray-300 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Cost Section */}
            {(currentStep === 2 || currentStep === 3) && (
              <div className="flex items-center w-full gap-2 text-sm">
                <span className="text-gray-600 font-semibold">Estimated Cost:</span>
                <span className="font-bold text-[#4C5BD6]">{estimatedCost}</span>
                {formData.costCutter && (
                  <span className="text-xs text-green-600 font-medium">(-50% off)</span>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 w-full">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="w-full sm:w-auto px-8 py-2 bg-gray-200 text-gray-800 rounded-md border border-gray-300 hover:bg-gray-200/90 font-bold transition-colors"
                >
                  Previous
                </button>
              )}

              <button
                onClick={currentStep === 3 ? handleSubmit : handleNext}
                className="w-full sm:w-auto px-8 py-2 bg-[#4C5BD6] text-white rounded-md hover:bg-[#3B4BB8] font-bold transition-colors"
              >
                {currentStep === 3 ? "Generate Blog" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default AdvancedBlogModal
