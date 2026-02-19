import { motion, AnimatePresence } from "framer-motion"
import {
  Crown,
  Sparkles,
  ChevronRight,
  X,
  Layers,
  Zap,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getValueByPath, setValueByPath } from "@utils/ObjectPath"
import { AI_MODELS, TONES, IMAGE_OPTIONS, IMAGE_SOURCE, LANGUAGES } from "@/data/blogData"
import BlogImageUpload from "@components/multipleStepModal/BlogImageUpload"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { computeCost } from "@/data/pricingConfig"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { validateAdvancedBlogData } from "@/types/forms.schemas"
import { useQueryClient } from "@tanstack/react-query"
import toast from "@utils/toast"
import { BlogTemplate } from "@components/multipleStepModal/TemplateSelection"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import useAnalysisStore from "@store/useAnalysisStore"
import { getGeneratedTitles } from "@api/blogApi"
import clsx from "clsx"

interface AdvancedBlogModalProps {
  onSubmit: (data: unknown) => void
  closeFnc: () => void
}

// Advanced Blog Modal Component - Updated pricing on Steps 2 & 3
const AdvancedBlogModal: FC<AdvancedBlogModalProps> = ({ closeFnc }) => {
  const STEP_TITLES = ["Template Selection", "Basic Information", "Customization", "Blog Options"]

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
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div
              className={clsx("p-2", errors?.template && "border-2 border-rose-500 rounded-2xl")}
            >
              <label className="flex flex-col gap-1 mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {errors?.template ? (
                    <span className="text-rose-500">{errors.template}</span>
                  ) : (
                    "Active Framework"
                  )}
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formData.template || "Select Template Architecture"}
                </span>
              </label>

              <TemplateSelection
                userSubscriptionPlan={user?.subscription?.plan || "free"}
                preSelectedIds={formData.templateIds}
                onClick={handleTemplateSelection}
              />
            </div>
          </motion.div>
        )
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 p-1"
          >
            {/* Topic Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Source Objective <span className="text-rose-500">*</span>
              </label>
              <input
                name="topic"
                placeholder="e.g., Quantum Computing Architecture"
                value={formData.topic}
                onChange={handleInputChange as any}
                className={clsx(
                  "w-full h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none transition-all font-medium",
                  errors.topic && "ring-rose-500 focus:ring-rose-500/20"
                )}
              />
              {errors.topic && (
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2">
                  {errors.topic}
                </p>
              )}
            </div>

            {/* Language Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Output Dialect <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.languageToWrite}
                onChange={e =>
                  handleInputChange({ target: { name: "languageToWrite", value: e.target.value } })
                }
                className="select select-bordered w-full h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium flex items-center"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Generate Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100/50 group hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    Neural Auto-Key
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Machine Title Generation
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.options.performKeywordResearch}
                onChange={e =>
                  handleInputChange({
                    target: { name: "options.performKeywordResearch", value: e.target.checked },
                  })
                }
              />
            </div>

            {/* Focus Keywords */}
            {!formData.options.performKeywordResearch && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    Core Metrics (Focus Keywords) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      placeholder="Type and press comma..."
                      className={clsx(
                        "w-full h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none transition-all font-medium",
                        errors.focusKeywords && "ring-rose-500"
                      )}
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
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.focusKeywords.map((kw, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                          {kw}
                          <X
                            size={12}
                            className="cursor-pointer hover:text-rose-400 transition-colors"
                            onClick={() =>
                              handleInputChange({
                                target: {
                                  name: "focusKeywords",
                                  value: formData.focusKeywords.filter((_, idx) => idx !== i),
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {errors.focusKeywords && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2">
                      {errors.focusKeywords}
                    </p>
                  )}
                </div>

                {/* Secondary Keywords */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    Latent Semantic Keywords <span className="text-rose-500">*</span>
                  </label>
                  <input
                    placeholder="Type and press comma..."
                    className={clsx(
                      "w-full h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none transition-all font-medium",
                      errors.keywords && "ring-rose-500"
                    )}
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
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.keywords.map((kw, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        {kw}
                        <X
                          size={12}
                          className="cursor-pointer hover:text-rose-500 transition-colors"
                          onClick={() =>
                            handleInputChange({
                              target: {
                                name: "keywords",
                                value: formData.keywords.filter((_, idx) => idx !== i),
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {errors.keywords && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2">
                      {errors.keywords}
                    </p>
                  )}
                </div>

                {/* Title Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    Signature Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="title"
                      placeholder="Initiate Title Concept..."
                      value={formData.title}
                      onChange={handleInputChange as any}
                      className={clsx(
                        "flex-1 h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none transition-all font-medium",
                        errors.title && "ring-rose-500"
                      )}
                    />
                    <button
                      onClick={handleGenerateTitles}
                      disabled={isGenerating}
                      className="px-6 h-14 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {generatedTitles?.length ? "Refresh" : "Synthesize"}
                    </button>
                  </div>
                  {errors.title && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2">
                      {errors.title}
                    </p>
                  )}

                  {generatedTitles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 max-h-40 overflow-y-auto custom-scroll p-1">
                      {generatedTitles.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => handleInputChange({ target: { name: "title", value: t } })}
                          className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            formData.title === t
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30"
                              : "bg-white text-slate-600 border-slate-100 hover:border-blue-200"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Maintain Absolute Title Literal
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={formData.options.exactTitle}
                    onChange={e =>
                      handleInputChange({
                        target: { name: "options.exactTitle", value: e.target.checked },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Tone & Word Length */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                  Vocal Signature <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.tone}
                  onChange={e =>
                    handleInputChange({ target: { name: "tone", value: e.target.value } })
                  }
                  className="select select-bordered w-full h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium"
                >
                  <option value="" disabled>
                    Select Resonance...
                  </option>
                  {TONES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.tone && (
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2">
                    {errors.tone}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Unit Magnitude
                  </label>
                  <span className="text-lg font-black text-blue-600 tracking-tighter">
                    {formData.userDefinedLength}{" "}
                    <span className="text-[10px] uppercase">Words</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={formData.userDefinedLength}
                  onChange={e =>
                    handleInputChange({
                      target: { name: "userDefinedLength", value: parseInt(e.target.value) },
                    })
                  }
                  className="range range-xs range-primary"
                />
                <div className="flex justify-between w-full px-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                  <span>500</span>
                  <span>2500</span>
                  <span>5000</span>
                </div>
              </div>
            </div>

            {/* Brief Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Instructional Protocol (Brief)
              </label>
              <textarea
                name="brief"
                value={formData.brief}
                onChange={handleInputChange as any}
                placeholder="Neural directives for logic steering..."
                className="w-full min-h-[100px] bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl p-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none transition-all font-medium resize-none shadow-inner"
              />
            </div>
          </motion.div>
        )

      case 2: {
        const isValidURL = (str: string) => {
          try {
            const url = new URL(str)
            return url.protocol === "http:" || url.protocol === "https:"
          } catch {
            return false
          }
        }

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 p-1"
          >
            {/* AI Model Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Neural Processor Engine <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() =>
                      handleInputChange({ target: { name: "aiModel", value: model.id } })
                    }
                    className={clsx(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                      formData.aiModel === model.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                        : "bg-white border-slate-100 hover:border-blue-200 text-slate-600"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                        formData.aiModel === model.id
                          ? "bg-white/10 border-white/20"
                          : "bg-slate-50 border-slate-100 group-hover:border-blue-100"
                      )}
                    >
                      <img src={model.logo} alt={model.label} className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight">{model.label}</h4>
                      <p
                        className={clsx(
                          "text-[9px] font-bold uppercase tracking-widest",
                          formData.aiModel === model.id ? "text-slate-400" : "text-slate-400"
                        )}
                      >
                        {model.id.includes("pro") ? "Pro Logic" : "Standard"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-[28px] p-6 group hover:bg-emerald-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm">
                      <Zap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Cost Cutter</h4>
                      <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">
                        25% Logic Savings
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={formData.costCutter}
                    onChange={e => updateFormData({ costCutter: e.target.checked })}
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-[28px] p-6 group hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-sm">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Adaptive Clarity</h4>
                      <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest">
                        Easy to Understand
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.options.easyToUnderstand}
                    onChange={e =>
                      handleInputChange({
                        target: { name: "options.easyToUnderstand", value: e.target.checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[28px] group hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Visual Synthesis</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    AI Guided Image Injection
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={formData.isCheckedGeneratedImages}
                onChange={e => {
                  const val = e.target.checked
                  ;[
                    { name: "isCheckedGeneratedImages", value: val },
                    { name: "blogImages", value: [] },
                  ].map(t => handleInputChange({ target: t }))
                }}
              />
            </div>

            {/* Image Source Settings */}
            <AnimatePresence>
              {formData.isCheckedGeneratedImages && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    Image Source Origin
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {IMAGE_OPTIONS.map((option, index) => {
                      const isRestricted = option.restrict && user?.subscription?.plan === "free"
                      const isLimitReached =
                        index === 1 && user?.usage?.aiImages >= user?.usageLimits?.aiImages
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
                            "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group overflow-hidden",
                            formData.imageSource === option.id
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-100 hover:border-blue-200 text-slate-600",
                            isDisabled &&
                              "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100"
                          )}
                        >
                          {isRestricted && (
                            <div className="absolute top-2 right-2">
                              <Crown className="w-4 h-4 text-amber-500" />
                            </div>
                          )}
                          {isLimitReached && (
                            <div className="absolute top-2 right-2">
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            </div>
                          )}
                          <span className="text-xs font-black uppercase tracking-widest text-center">
                            {option.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {formData.imageSource !== IMAGE_OPTIONS.at(-1)?.id ? (
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                          Injection Count (0 = Neural Choice)
                        </label>
                        <span className="text-xl font-black text-blue-600 tracking-tighter">
                          {formData.numberOfImages}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={formData.numberOfImages}
                        onChange={e =>
                          handleInputChange({
                            target: { name: "numberOfImages", value: parseInt(e.target.value) },
                          })
                        }
                        className="range range-xs range-primary"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <BlogImageUpload
                        id="blog-upload-images"
                        label="Upload Custom Images"
                        maxCount={15}
                        initialFiles={formData.blogImages}
                        onChange={file =>
                          handleInputChange({ target: { name: "blogImages", value: file } })
                        }
                      />
                      {errors.blogImages && (
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                          {errors.blogImages}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reference Links */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Evidence Protocol (Reference Links - max 3)
              </label>
              <div className="space-y-4">
                <input
                  placeholder="Paste URL and press Enter..."
                  className="w-full h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-2xl px-6 focus:ring-2 focus:ring-blue-600/20 focus:bg-white outline-none transition-all font-medium"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val && formData.referenceLinks.length < 3) {
                        if (isValidURL(val)) {
                          handleInputChange({
                            target: {
                              name: "referenceLinks",
                              value: [...formData.referenceLinks, val],
                            },
                          })
                          ;(e.target as HTMLInputElement).value = ""
                        } else {
                          toast.error("Please enter a valid URL protocol")
                        }
                      }
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  {formData.referenceLinks.map((link, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-blue-100 transition-colors"
                    >
                      <span className="text-xs text-slate-500 truncate max-w-[90%] font-medium">
                        {link}
                      </span>
                      <X
                        size={14}
                        className="text-slate-300 hover:text-rose-500 cursor-pointer transition-colors"
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "referenceLinks",
                              value: formData.referenceLinks.filter((_, idx) => idx !== i),
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )
      }
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 p-1"
          >
            <div className="grid grid-cols-1 gap-4">
              {BLOG_OPTIONS.map((option, index) => (
                <div
                  key={option.key + index}
                  className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[28px] hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Layers size={14} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                      {option.label}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-primary"
                    checked={getValueByPath(formData, option.key)}
                    onChange={e =>
                      handleInputChange({ target: { name: option.key, value: e.target.checked } })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-xl shadow-slate-200 mt-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <BrandVoiceSelector
                  label=""
                  value={{
                    isCheckedBrand: formData.isCheckedBrand,
                    brandId: formData.brandId,
                    addCTA: formData.options.addCTA,
                  }}
                  size="default"
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
            </div>
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Neural Header */}
          <div className="p-8 pb-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {STEP_TITLES[currentStep]}
                </h2>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-11">
                Step 0{currentStep + 1} of 04 • Neural Configuration
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors group"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 pt-6">
            <div className="flex gap-2 mb-2">
              {STEP_TITLES.map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                    i <= currentStep ? "bg-slate-900" : "bg-slate-100"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Main Body */}
          <div
            className="flex-1 overflow-y-auto p-8 custom-scroll"
            style={{ scrollbarWidth: "none" }}
          >
            {renderSteps()}
          </div>

          {/* Premium Glass Footer */}
          <div className="p-8 pt-4 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between sticky bottom-0 z-20">
            <div className="flex items-center gap-6">
              {(currentStep === 2 || currentStep === 3) && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Resource Commitment
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 tracking-tighter">
                      {estimatedCost}
                    </span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      Credits
                    </span>
                    {formData.costCutter && (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-full">
                        -25% Logic Savings
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-8 h-12 rounded-2xl border-2 border-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-widest hover:border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Previous Phase
                </button>
              )}
              <button
                onClick={currentStep === 3 ? handleSubmit : handleNext}
                className="px-8 h-12 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 group"
              >
                {currentStep === 3 ? (
                  <>
                    <Zap className="w-4 h-4 group-hover:animate-pulse" />
                    Initialize Generation
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AdvancedBlogModal
