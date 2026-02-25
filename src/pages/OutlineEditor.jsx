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
import { Helmet } from "react-helmet"

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
    tone: "Informative",
    focusKeywords: [],
    keywords: [],
    userDefinedLength: 1200,
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
        tone: !formData.tone,
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

    if (type === "focusKeywords" && formData[type].length + newItems.length > 3) {
      setErrors(prev => ({ ...prev, [type]: true }))
      return
    }

    if (type === "resources" && formData[type].length + newItems.length > 4) {
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
    setFormData(prev => ({ ...prev, brandId }))
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
      tone: !blogData.tone,
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

  const visibleKeywords = showAllKeywords ? formData.keywords : formData.keywords.slice(0, 18)

  const min = 500
  const max = 5000
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
            <div onClick={handleClose} className="absolute inset-0 bg-black/60" />
            <div className="relative gap-2 w-full max-w-3xl bg-white rounded-lg flex flex-col max-h-[90vh]">
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
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
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
                        className={`input outline-0 w-full rounded-lg focus:ring ${errors.topic ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                      />
                      {errors.topic && (
                        <span className="text-rose-500 text-xs">Topic is required</span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">
                          Writing Tone <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <select
                        value={formData.tone}
                        onChange={e => handleSelectChange(e.target.value)}
                        className={`select select-bordered w-full rounded-lg focus:ring ${errors.tone ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                      >
                        <option value="Informative">Informative</option>
                        <option value="Casual">Casual</option>
                        <option value="Professional">Professional</option>
                        <option value="Persuasive">Persuasive</option>
                        <option value="Humorous">Humorous</option>
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
                          className={`input outline-0 w-full pr-2g rounded-lg ${errors.focusKeywords ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                        />
                        <button
                          onClick={() => handleAddKeyword("focusKeywords")}
                          className="w-10 p-1.5 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
                        >
                          <Plus size={20} className="ml-1" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.focusKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="badge bg-blue-50 text-blue-700 border-blue-100 py-3 px-3 rounded-lg gap-2 text-xs font-bold"
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
                          className={`input outline-0 w-full pr-2g rounded-lg ${errors.keywords ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                        />
                        <button
                          onClick={() => handleAddKeyword("keywords")}
                          className="w-10 p-1.5 bg-[#1B6FC9] text-white rounded-lg hover:bg-blue-700/90"
                        >
                          <Plus size={20} className="ml-1" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {visibleKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="badge bg-slate-50 text-slate-600 border-slate-100 py-3 px-3 rounded-lg gap-2 text-xs font-bold"
                          >
                            {keyword}
                            <X
                              size={12}
                              className="cursor-pointer hover:text-slate-900"
                              onClick={() => handleRemoveKeyword(index, "keywords")}
                            />
                          </span>
                        ))}
                        {formData.keywords.length > 18 && (
                          <button
                            onClick={() => setShowAllKeywords(!showAllKeywords)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-1"
                          >
                            {showAllKeywords
                              ? "Show Less"
                              : `+${formData.keywords.length - 18} more`}
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
                        className={`input outline-0 w-full rounded-lg focus:ring ${errors.title ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step="100"
                            value={formData.userDefinedLength}
                            onChange={e => handleInputChange(e, "userDefinedLength")}
                            className="custom-slider w-full"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`,
                            }}
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
                      <label className="label text-sm mb-2">
                        <span className="label-text font-bold text-slate-700">Brand Voice</span>
                      </label>
                      <div className="mt-2 p-3 sm:p-4 rounded-md border border-gray-200 bg-gray-50">
                        {brands?.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {brands.map(voice => (
                              <label
                                key={voice._id}
                                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all border ${
                                  formData.brandId === voice._id
                                    ? "bg-blue-50 border-blue-200 shadow-sm"
                                    : "bg-white border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  className="radio radio-primary radio-xs"
                                  checked={formData.brandId === voice._id}
                                  onChange={() => handleBrandSelect(voice._id)}
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
                          Resource Links (Max 4)
                        </span>
                      </label>
                      <div className="relative flex gap-2">
                        <input
                          type="text"
                          value={formData.resourceInput}
                          onChange={e => handleKeywordInputChange(e, "resources")}
                          onKeyDown={e => handleKeyPress(e, "resources")}
                          placeholder="Add URLs to context or sources..."
                          className={`input outline-0 w-full pr-2g rounded-lg ${errors.resources ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                        />
                        <button
                          onClick={() => handleAddKeyword("resources")}
                          className="w-10 p-1 bg-[#1B6FC9] text-white rounded-lg hover:bg-blue-700/90"
                        >
                          <Plus size={20} className="ml-1" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.resources.map((resource, index) => (
                          <div
                            key={index}
                            className="badge h-auto py-2 bg-slate-50 text-blue-600 border-slate-100 rounded-lg gap-2 text-xs font-bold flex items-center"
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
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      {markdownContent ? (
                        <div
                          className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: markdownContent
                              .replace(
                                /^#+\s+/gm,
                                match =>
                                  `<h${match.length} class="font-bold text-slate-900 mt-4 outline-header">`
                              )
                              .replace(/\n/gm, "<br>")
                              .replace(
                                /\*\*(.*?)\*\*/g,
                                "<strong class='text-slate-900'>$1</strong>"
                              )
                              .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
                              .replace(/^- (.*)$/gm, "<li class='list-disc ml-4'>$1</li>")
                              .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>"),
                          }}
                        />
                      ) : (
                        <div className="text-center py-10 text-slate-400">
                          <p className="text-sm font-medium italic">No content generated yet.</p>
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
                    className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
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
                      className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors"
                    >
                      Next
                    </button>
                  )}

                  {currentStep === 1 && (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors"
                    >
                      Next
                    </button>
                  )}

                  {currentStep === 2 && (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Generating...
                        </>
                      ) : (
                        <>Generate Outline</>
                      )}
                    </button>
                  )}

                  {currentStep === 3 && (
                    <>
                      <button
                        onClick={handleExportMarkdown}
                        className="btn btn-ghost px-6 rounded-2xl text-emerald-600 font-bold hover:bg-emerald-50 border border-emerald-100"
                      >
                        Export .MD
                      </button>
                      <button
                        onClick={handleClose}
                        className="btn btn-primary px-10 rounded-2xl bg-slate-900 border-none text-white font-black shadow-lg hover:bg-slate-800"
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
            <h1 className="text-xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center sm:text-left">
              Blog Outline Editor
            </h1>

            <button
              onClick={handleExportMarkdown}
              className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base font-medium flex justify-center items-center gap-2"
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
            <div className="flex-1 flex flex-col sm:flex-row sm:space-x-4">
              <div className="w-full sm:w-1/2 mb-4 sm:mb-0">
                <h3 className="text-base sm:text-md font-semibold text-gray-700 mb-2 sm:mb-3 px-3 tracking-wide">
                  Preview
                </h3>
                <div className="w-full h-[50vh] sm:h-[70vh] p-3 sm:p-4 border border-gray-200 rounded-lg bg-white overflow-y-auto prose prose-sm max-w-none text-gray-700 shadow-sm text-xs sm:text-sm">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: markdownContent
                        .replace(/^#+\s+/gm, match => `<h${match.length}>`)
                        .replace(/\n/gm, "<br>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/^- (.*)$/gm, "<li>$1</li>")
                        .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>")
                        .replace(/^(<h[1-6]>.*<\/h[1-6]>)$/gm, '<div class="mt-3 sm:mt-4">$1</div>')
                        .replace(/^(<ul>.*<\/ul>)$/gm, '<div class="mt-2">$1</div>'),
                    }}
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/2">
                <h3 className="text-base sm:text-md font-semibold text-gray-700 mb-2 sm:mb-3 px-3 tracking-wide">
                  Edit Your Blog Outline
                </h3>
                <textarea
                  id="outline-editor"
                  value={markdownContent}
                  onChange={handleContentChange}
                  className="w-full h-[50vh] sm:h-[70vh] p-3 sm:p-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-mono bg-white focus:ring-2 focus:ring-blue-600 resize-none shadow-sm"
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
