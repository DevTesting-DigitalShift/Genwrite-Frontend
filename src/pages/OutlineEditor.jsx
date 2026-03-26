import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@/data/templates"
import { toast } from "sonner"
import { Plus, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react"
import React, { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"
import { brandsQuery } from "@api/Brand/Brand.query"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"
import useAuthStore from "@store/useAuthStore"
import useContentStore from "@store/useContentStore"
import { TONES } from "@/data/blogData"
import { BLOG_CONFIG } from "@/data/blogConfig"
import { Slider } from "@/components/ui/slider"
import { Helmet } from "react-helmet"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const OutlineEditor = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createOutline } = useContentStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState([])
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    tone: TONES[0],
    focusKeywords: [],
    keywords: [],
    userDefinedLength: BLOG_CONFIG.LENGTH.DEFAULT,
    focusKeywordInput: "",
    keywordInput: "",
    template: "",
    brandId: null,
    resources: [],
    resourceInput: "",
  })
  const [errors, setErrors] = useState({
    title: false,
    topic: false,
    tone: false,
    focusKeywords: false,
    keywords: false,
    template: false,
    resources: false,
  })
  const [markdownContent, setMarkdownContent] = useState(null)

  const { data: brands = [], isLoading: loadingBrands, error: brandError } = brandsQuery.useList()

  const handleClose = () => {
    setIsOpen(false)
    navigate("/dashboard")
  }

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleNext = () => {
    let newErrors = {}

    if (currentStep === 0) {
      if (!selectedTemplate) {
        newErrors.template = true
        setErrors(prev => ({ ...prev, ...newErrors }))
        return
      }
    }

    if (currentStep === 1) {
      newErrors = {
        title: !formData.title.trim(),
        topic: !formData.topic.trim(),
        focusKeywords: formData.focusKeywords.length === 0,
        keywords: formData.keywords.length === 0,
      }
      if (Object.values(newErrors).some(error => error)) {
        setErrors(prev => ({ ...prev, ...newErrors }))
        return
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors, template: false }))
    setCurrentStep(prev => prev + 1)
  }

  const handlePackageSelect = useCallback(temps => {
    setSelectedTemplate(temps)
    setFormData(prev => ({ ...prev, template: temps?.[0]?.name || "" }))
    setErrors(prev => ({ ...prev, template: false }))
  }, [])

  const handleInputChange = (e, key) => {
    setFormData(prev => ({ ...prev, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [key]: false }))
  }

  const handleSelectChange = value => {
    setFormData(prev => ({ ...prev, tone: value }))
    setErrors(prev => ({ ...prev, tone: false }))
  }

  const handleKeywordInputChange = (e, type) => {
    const key =
      type === "keywords"
        ? "keywordInput"
        : type === "focusKeywords"
          ? "focusKeywordInput"
          : "resourceInput"
    setFormData(prev => ({ ...prev, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [type]: false }))
  }

  const handleAddKeyword = type => {
    const inputKey =
      type === "keywords"
        ? "keywordInput"
        : type === "focusKeywords"
          ? "focusKeywordInput"
          : "resourceInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors(prev => ({ ...prev, [type]: true }))
      return
    }

    const existingSet = new Set(formData[type].map(k => k.trim().toLowerCase()))
    const newItems = inputValue
      .split(",")
      .map(k => k.trim())
      .filter(k => k && !existingSet.has(k.toLowerCase()))

    if (newItems.length === 0) {
      setErrors(prev => ({ ...prev, [type]: true }))
      return
    }

    if (
      type === "focusKeywords" &&
      formData[type].length + newItems.length > BLOG_CONFIG.CONSTRAINTS.MAX_FOCUS_KEYWORDS
    ) {
      setErrors(prev => ({ ...prev, [type]: true }))
      return
    }

    if (
      type === "resources" &&
      formData[type].length + newItems.length > BLOG_CONFIG.CONSTRAINTS.MAX_REFERENCE_LINKS
    ) {
      setErrors(prev => ({ ...prev, [type]: true }))
      return
    }

    if (type === "resources") {
      const invalidUrls = newItems.filter(url => {
        try {
          new URL(url)
          return false
        } catch {
          return true
        }
      })
      if (invalidUrls.length > 0) {
        setErrors(prev => ({ ...prev, [type]: true }))
        return
      }
    }

    setFormData(prev => ({ ...prev, [type]: [...prev[type], ...newItems], [inputKey]: "" }))
    setErrors(prev => ({ ...prev, [type]: false }))
  }

  const handleRemoveKeyword = (index, type) => {
    const updatedItems = [...formData[type]]
    updatedItems.splice(index, 1)
    setFormData({ ...formData, [type]: updatedItems })
  }

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  const handleBrandSelect = brandId => {
    setFormData(prev => ({ ...prev, brandId: prev.brandId === brandId ? null : brandId }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const selectedBrand = brands.find(brand => brand._id === formData.brandId)
    const blogData = {
      title: formData.title?.trim(),
      topic: formData.topic?.trim(),
      tone: formData.tone?.trim(),
      focusKeywords: formData.focusKeywords,
      keywords: formData.keywords,
      wordsLimit: Number(formData.userDefinedLength),
      template: formData.template,
      brandData: selectedBrand
        ? {
            name: selectedBrand.nameOfVoice,
            audience: selectedBrand.describeBrand,
            values: selectedBrand.keywords,
          }
        : undefined,
      resources: formData?.resources || undefined,
    }

    const newErrors = {
      title: !blogData.title,
      topic: !blogData.topic,
      template: !blogData.template,
      focusKeywords: !blogData.focusKeywords || blogData.focusKeywords.length === 0,
      keywords: !blogData.keywords || blogData.keywords.length === 0,
    }

    if (Object.values(newErrors).some(error => error)) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      setCurrentStep(1)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await createOutline(blogData)
      setMarkdownContent(response)
      setIsOpen(false)
    } catch (err) {
      console.error("Failed to create blog:", err)
      toast.error(err?.message || "Failed to create outline")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportMarkdown = () => {
    if (!markdownContent) return
    const blob = new Blob([markdownContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${formData.title || "blog-outline"}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleContentChange = e => {
    setMarkdownContent(e.target.value)
  }

  const handleFormat = format => {
    const textarea = document.getElementById("outline-editor")
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = markdownContent.substring(start, end)
    let newText = markdownContent

    if (format === "bold") {
      newText =
        markdownContent.substring(0, start) + `**${selectedText}**` + markdownContent.substring(end)
    } else if (format === "italic") {
      newText =
        markdownContent.substring(0, start) + `*${selectedText}*` + markdownContent.substring(end)
    } else if (format === "list") {
      const lines = selectedText.split("\n").filter(line => line.trim())
      const formattedLines = lines.map(line => `- ${line.trim()}`).join("\n")
      newText =
        markdownContent.substring(0, start) + formattedLines + markdownContent.substring(end)
    }

    setMarkdownContent(newText)
  }

  const isImageUrl = url => {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"]
    try {
      const urlObj = new URL(url)
      return imageExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))
    } catch {
      return false
    }
  }

  const visibleKeywords = showAllKeywords
    ? formData.keywords
    : formData.keywords.slice(0, BLOG_CONFIG.CONSTRAINTS.MAX_SECONDARY_KEYWORDS)

  const min = BLOG_CONFIG.LENGTH.MIN
  const max = BLOG_CONFIG.LENGTH.MAX
  const percent = ((formData.userDefinedLength - min) / (max - min)) * 100

  return (
    <>
      <Helmet>
        <title>Outline Editor | GenWrite</title>
      </Helmet>

      {isSubmitting && <ProgressLoadingScreen message="Generating your outline..." />}

      <div className="px-6">
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={handleClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative gap-2 w-full max-w-3xl bg-white rounded-md flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 px-8 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-base font-bold">
                  {currentStep === 0
                    ? "Select Template"
                    : currentStep === 1
                      ? "Blog Details"
                      : currentStep === 2
                        ? "Brand Voice & Resources"
                        : "Generated Outline"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-50 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 pb-6">
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <TemplateSelection
                      userSubscriptionPlan={user?.subscription?.plan || "free"}
                      preSelectedIds={selectedTemplate?.map(t => t?.id || "")}
                      onClick={handlePackageSelect}
                    />
                    {errors.template && (
                      <p className="text-rose-500 text-sm font-medium">
                        Please select a template to continue.
                      </p>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">
                          Blog Topic <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.topic}
                        onChange={e => handleInputChange(e, "topic")}
                        placeholder="e.g. How to use AI for content marketing"
                        className={`input outline-0 w-full rounded-md focus:ring ${errors.topic ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                      />
                      {errors.topic && (
                        <span className="text-rose-500 text-xs">Topic is required</span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">Writing Tone</span>
                      </label>
                      <select
                        value={formData.tone}
                        onChange={e => handleSelectChange(e.target.value)}
                        className={`select select-bordered w-full rounded-md focus:ring ${errors.tone ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                      >
                        {TONES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">
                          Focus Keywords (Max 3) <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <div className="relative flex gap-2">
                        <input
                          type="text"
                          value={formData.focusKeywordInput}
                          onChange={e => handleKeywordInputChange(e, "focusKeywords")}
                          onKeyDown={e => handleKeyPress(e, "focusKeywords")}
                          placeholder="Type and press Enter..."
                          className={`input outline-0 w-full pr-2 rounded-md ${errors.focusKeywords ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                        />
                        <button
                          onClick={() => handleAddKeyword("focusKeywords")}
                          className="w-10 p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all font-bold shadow-none"
                        >
                          <Plus size={20} className="ml-1" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.focusKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="badge bg-blue-50 text-blue-700 border-blue-100 py-3 px-3 rounded-md gap-2 text-xs font-bold"
                          >
                            {keyword}
                            <X
                              size={12}
                              className="cursor-pointer hover:text-blue-900"
                              onClick={() => handleRemoveKeyword(index, "focusKeywords")}
                            />
                          </span>
                        ))}
                      </div>
                      {errors.focusKeywords && (
                        <span className="text-rose-500 text-xs">
                          At least one focus keyword is required
                        </span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">
                          Secondary Keywords <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <div className="relative flex gap-2">
                        <input
                          type="text"
                          value={formData.keywordInput}
                          onChange={e => handleKeywordInputChange(e, "keywords")}
                          onKeyDown={e => handleKeyPress(e, "keywords")}
                          placeholder="Add secondary keywords..."
                          className={`input outline-0 w-full pr-2 rounded-md ${errors.keywords ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                        />
                        <button
                          onClick={() => handleAddKeyword("keywords")}
                          className="w-10 p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all font-bold shadow-none"
                        >
                          <Plus size={20} className="ml-1" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {visibleKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="badge bg-slate-50 text-slate-600 border-slate-100 py-3 px-3 rounded-md gap-2 text-xs font-bold"
                          >
                            {keyword}
                            <X
                              size={12}
                              className="cursor-pointer hover:text-slate-900"
                              onClick={() => handleRemoveKeyword(index, "keywords")}
                            />
                          </span>
                        ))}
                        {formData.keywords.length >
                          BLOG_CONFIG.CONSTRAINTS.MAX_SECONDARY_KEYWORDS && (
                          <button
                            onClick={() => setShowAllKeywords(!showAllKeywords)}
                            className="text-xs font-bold text-primary hover:text-primary/80 ml-1"
                          >
                            {showAllKeywords
                              ? "Show Less"
                              : `+${formData.keywords.length - BLOG_CONFIG.CONSTRAINTS.MAX_SECONDARY_KEYWORDS} more`}
                          </button>
                        )}
                      </div>
                      {errors.keywords && (
                        <span className="text-rose-500 text-xs">Keywords are required</span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">
                          Suggested Title <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => handleInputChange(e, "title")}
                        placeholder="Project title..."
                        className={`input outline-0 w-full rounded-md focus:ring ${errors.title ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                      />
                      {errors.title && (
                        <span className="text-rose-500 text-xs">Title is required</span>
                      )}
                    </div>

                    <div className="w-full">
                      <label className="block mb-3 text-sm font-semibold text-slate-700">
                        Choose length of Blog <span className="text-red-500">*</span>
                      </label>

                      <div className="flex items-center gap-6">
                        <div className="relative flex-1">
                          <Slider
                            min={BLOG_CONFIG.LENGTH.MIN}
                            max={BLOG_CONFIG.LENGTH.MAX}
                            step={BLOG_CONFIG.LENGTH.STEP}
                            value={[formData.userDefinedLength]}
                            onValueChange={vals =>
                              handleInputChange({ target: { value: vals[0] } }, "userDefinedLength")
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="text-sm font-semibold text-slate-600 min-w-[90px] text-right">
                          {formData.userDefinedLength} <span className="text-slate-400">words</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="form-control w-full">
                      <div className="flex items-center justify-between mb-2">
                        <label className="label text-sm p-0">
                          <span className="label-text font-bold text-slate-700">Brand Voice</span>
                        </label>
                        {formData.brandId && (
                          <button
                            onClick={() => handleBrandSelect(formData.brandId)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      <div className="mt-2 p-3 sm:p-4 rounded-md border border-gray-200 bg-gray-50">
                        {brands?.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {brands.map(voice => (
                              <label
                                key={voice._id}
                                className={`flex items-start gap-3 p-4 rounded-md cursor-pointer transition-all border ${
                                  formData.brandId === voice._id
                                    ? "bg-primary/10 border-primary/20 shadow-none"
                                    : "bg-white border-slate-100 hover:border-slate-200"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleBrandSelect(voice._id);
                                }}
                              >
                                <input
                                  type="radio"
                                  className="radio radio-primary radio-xs"
                                  checked={formData.brandId === voice._id}
                                  readOnly
                                />
                                <div>
                                  <div className="font-bold text-slate-700 text-sm">
                                    {voice.nameOfVoice}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {voice.describeBrand}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400">
                            <Sparkles className="mx-auto mb-2 opacity-20" size={32} />
                            <p className="text-sm font-medium italic">
                              No brand voices found. Using default voice.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">
                          Resource Links (Max {BLOG_CONFIG.CONSTRAINTS.MAX_REFERENCE_LINKS})
                        </span>
                      </label>
                      <div className="relative flex gap-2">
                        <input
                          type="text"
                          value={formData.resourceInput}
                          onChange={e => handleKeywordInputChange(e, "resources")}
                          onKeyDown={e => handleKeyPress(e, "resources")}
                          placeholder="Add URLs to context or sources..."
                          className={`input outline-0 w-full pr-2 rounded-md ${errors.resources ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                        />
                        <button
                          onClick={() => handleAddKeyword("resources")}
                          className="w-10 p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all font-bold shadow-none"
                        >
                          <Plus size={20} className="ml-1" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.resources.map((resource, index) => (
                          <div
                            key={index}
                            className="badge h-auto py-2 bg-slate-50 text-primary border-slate-100 rounded-md gap-2 text-xs font-bold flex items-center"
                          >
                            <span className="max-w-[150px] truncate">{resource}</span>
                            <X
                              size={12}
                              className="cursor-pointer hover:text-rose-500"
                              onClick={() => handleRemoveKeyword(index, "resources")}
                            />
                          </div>
                        ))}
                      </div>
                      {errors.resources && (
                        <span className="text-rose-500 text-xs">
                          Invalid URL or maximum reached (4)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-8 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                      {markdownContent ? (
                        <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {markdownContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-slate-400">
                          <Sparkles className="mx-auto mb-4 opacity-20" size={48} />
                          <p className="text-sm font-medium italic">No outline generated yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-300 flex items-center justify-between gap-3 bg-slate-50/10">
                {currentStep > 0 && currentStep < 4 ? (
                  <button
                    onClick={handlePrev}
                    className="px-6 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-3">
                  {currentStep === 0 && (
                    <button
                      onClick={handleNext}
                      className="px-8 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all shadow-none font-bold"
                    >
                      Next
                    </button>
                  )}

                  {currentStep === 1 && (
                    <button
                      onClick={handleNext}
                      className="px-8 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all shadow-none font-bold"
                    >
                      Next
                    </button>
                  )}

                  {currentStep === 2 && (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all shadow-none font-bold"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        <span>Generate Outline</span>
                      )}
                    </button>
                  )}

                  {currentStep === 3 && (
                    <>
                      <button
                        onClick={handleExportMarkdown}
                        className="px-6 py-2.5 rounded-md text-primary font-bold hover:bg-primary/5 border border-primary/10 transition-all"
                      >
                        Export .MD
                      </button>
                      <button
                        onClick={handleClose}
                        className="px-10 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all font-bold shadow-none"
                      >
                        Finish Editor
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="py-6 min-h-screen flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">
              Blog Outline Editor
            </h1>

            <button
              onClick={handleExportMarkdown}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all text-sm sm:text-base font-bold flex justify-center items-center gap-2"
              aria-label="Export as Markdown"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 sm:h-5 w-4 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export as Markdown
            </button>
          </div>

          {markdownContent ? (
            <div className="flex-1 flex flex-col sm:flex-row sm:space-x-6">
              <div className="w-full sm:w-1/2 mb-6 sm:mb-0 flex flex-col">
                <h3 className="text-sm font-semibold mb-3 px-1 text-slate-500 uppercase tracking-widest">
                  Preview
                </h3>
                <div className="flex-1 p-6 sm:p-8 border border-gray-200 rounded-md bg-white overflow-y-auto shadow-sm min-h-[500px]">
                  <div className="prose prose-sm sm:prose-base prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 flex flex-col">
                <h3 className="text-sm font-semibold mb-3 px-1 text-slate-500 uppercase tracking-widest">
                  Markdown Editor
                </h3>
                <textarea
                  id="outline-editor"
                  value={markdownContent}
                  onChange={handleContentChange}
                  className="flex-1 min-h-[500px] p-6 sm:p-8 border border-gray-200 rounded-md text-xs sm:text-sm font-mono bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-0 resize-none shadow-sm"
                  aria-label="Edit blog outline"
                  placeholder="Edit your blog outline here..."
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-xs sm:text-sm">No content available to display.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default OutlineEditor
