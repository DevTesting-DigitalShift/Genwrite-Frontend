import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@constants/templates"
import { createOutlineThunk } from "@store/slices/otherSlice"
import { Empty, Input, Select, Modal } from "antd"
import { Bold, Italic, List, Plus, Sparkles, X } from "lucide-react"
import React, { useState } from "react"
import { useDispatch } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import { fetchBrands } from "@store/slices/brandSlice"
import { useNavigate } from "react-router-dom"

const { Option } = Select

const OutlineEditor = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
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

  const {
    data: brands = [],
    isLoading: loadingBrands,
    error: brandError,
  } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await dispatch(fetchBrands()).unwrap() // Dispatch and unwrap the payload
      return response // Return the brands data
    },
    enabled: formData.isCheckedBrand,
  })

  const handleClose = () => {
    setIsOpen(false)
    navigate("/toolbox")
  }

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleNext = () => {
    let newErrors = {}

    if (currentStep === 0) {
      if (!selectedTemplate) {
        newErrors.template = true
        setErrors((prev) => ({ ...prev, ...newErrors }))
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
      if (Object.values(newErrors).some((error) => error)) {
        setErrors((prev) => ({ ...prev, ...newErrors }))
        return
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors, template: false }))
    setCurrentStep((prev) => prev + 1)
  }

  const handlePackageSelect = (index) => {
    setSelectedTemplate(packages[index].name)
    setFormData((prev) => ({ ...prev, template: packages[index].name }))
    setErrors((prev) => ({ ...prev, template: false }))
  }

  const handleInputChange = (e, key) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: false }))
  }

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, tone: value }))
    setErrors((prev) => ({ ...prev, tone: false }))
  }

  const handleKeywordInputChange = (e, type) => {
    const key =
      type === "keywords"
        ? "keywordInput"
        : type === "focusKeywords"
        ? "focusKeywordInput"
        : "resourceInput"
    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [type]: false }))
  }

  const handleAddKeyword = (type) => {
    const inputKey =
      type === "keywords"
        ? "keywordInput"
        : type === "focusKeywords"
        ? "focusKeywordInput"
        : "resourceInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      return
    }

    const existingSet = new Set(formData[type].map((k) => k.trim().toLowerCase()))
    const newItems = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k && !existingSet.has(k.toLowerCase()))

    if (newItems.length === 0) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      return
    }

    if (type === "focusKeywords" && formData[type].length + newItems.length > 3) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      return
    }

    if (type === "resources" && formData[type].length + newItems.length > 4) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      return
    }

    if (type === "resources") {
      const invalidUrls = newItems.filter((url) => {
        try {
          new URL(url)
          return false
        } catch {
          return true
        }
      })
      if (invalidUrls.length > 0) {
        setErrors((prev) => ({ ...prev, [type]: true }))
        return
      }
    }

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...newItems],
      [inputKey]: "",
    }))
    setErrors((prev) => ({ ...prev, [type]: false }))
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

  const handleBrandSelect = (brandId) => {
    setFormData((prev) => ({ ...prev, brandId }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const selectedBrand = brands.find((brand) => brand._id === formData.brandId)
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

    if (Object.values(newErrors).some((error) => error)) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      setCurrentStep(1)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await dispatch(createOutlineThunk(blogData)).unwrap()
      setMarkdownContent(response)
      setIsOpen(false)
    } catch (err) {
      console.error("Failed to create blog:", err)
      message.error(err?.message || "Failed to create blog")
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

  const handleContentChange = (e) => {
    setMarkdownContent(e.target.value)
  }

  const handleFormat = (format) => {
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
      const lines = selectedText.split("\n").filter((line) => line.trim())
      const formattedLines = lines.map((line) => `- ${line.trim()}`).join("\n")
      newText =
        markdownContent.substring(0, start) + formattedLines + markdownContent.substring(end)
    }

    setMarkdownContent(newText)
  }

  const isImageUrl = (url) => {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"]
    try {
      const urlObj = new URL(url)
      return imageExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))
    } catch {
      return false
    }
  }

  const visibleKeywords = showAllKeywords ? formData.keywords : formData.keywords.slice(0, 18)

  return (
    <div>
      <Modal
        title={
          currentStep === 0
            ? "Select Template"
            : currentStep === 1
            ? "Tell us about your blog, we'll outline it for you!"
            : "Brand Voice & Resources"
        }
        open={isOpen}
        onCancel={handleClose}
        footer={
          currentStep === 0
            ? [
                <button
                  key="next"
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
                  aria-label="Proceed to next step"
                >
                  Next
                </button>,
              ]
            : currentStep === 1
            ? [
                <button
                  key="previous"
                  onClick={handlePrev}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  aria-label="Go to previous step"
                >
                  Previous
                </button>,
                <button
                  key="next"
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
                  aria-label="Proceed to brand and resources"
                >
                  Next
                </button>,
              ]
            : currentStep === 2
            ? [
                <button
                  key="previous"
                  onClick={handlePrev}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  aria-label="Go to previous step"
                >
                  Previous
                </button>,
                <button
                  key="submit"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  aria-label="Submit blog"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>,
              ]
            : [
                <button
                  key="export"
                  onClick={handleExportMarkdown}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  aria-label="Export as Markdown"
                >
                  Export as Markdown
                </button>,
                <button
                  key="close"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 ml-3"
                  aria-label="Close modal"
                >
                  Close
                </button>,
              ]
        }
        width={800}
        centered
        bodyStyle={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(8px)" }}
        maskStyle={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      >
        <div className="p-2">
          {currentStep === 0 && (
            <div className="p-3">
              <Carousel>
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedTemplate === pkg.name ? "border-blue-600 border-2 rounded-lg" : ""
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
                      <div className="p-2 mt-2">
                        <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
              {errors.template && (
                <p className="text-red-500 text-sm mt-2">Please select a template.</p>
              )}
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.topic}
                  onChange={(e) => handleInputChange(e, "topic")}
                  placeholder="Enter blog topic..."
                  className={`w-full px-3 py-2 border ${
                    errors.topic ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                  aria-label="Blog topic"
                />
                {errors.topic && (
                  <p className="text-red-500 text-sm mt-1">Topic cannot be empty.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tone <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.tone}
                  onChange={handleSelectChange}
                  className={`w-full ${errors.tone ? "border-red-500" : ""}`}
                  aria-label="Blog tone"
                  placeholder="Select tone"
                >
                  <Option value="Informative">Informative</Option>
                  <Option value="Casual">Casual</Option>
                  <Option value="Professional">Professional</Option>
                  <Option value="Persuasive">Persuasive</Option>
                  <Option value="Humorous">Humorous</Option>
                </Select>
                {errors.tone && <p className="text-red-500 text-sm mt-1">Please select a tone.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Focus Keywords (max 3) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.focusKeywordInput}
                    onChange={(e) => handleKeywordInputChange(e, "focusKeywords")}
                    onKeyDown={(e) => handleKeyPress(e, "focusKeywords")}
                    placeholder="Enter focus keywords, separated by commas"
                    className={`flex-1 px-3 py-2 border ${
                      errors.focusKeywords ? "border-red-500" : "border-gray-200"
                    } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                    aria-label="Focus keywords"
                  />
                  <button
                    onClick={() => handleAddKeyword("focusKeywords")}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center"
                    aria-label="Add focus keyword"
                  >
                    <Plus size={16} />
                  </button>
                </div>
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
                        aria-label={`Remove focus keyword ${keyword}`}
                      >
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
                {errors.focusKeywords && (
                  <p className="text-red-500 text-sm mt-1">
                    At least one focus keyword is required (max 3).
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.keywordInput}
                    onChange={(e) => handleKeywordInputChange(e, "keywords")}
                    onKeyDown={(e) => handleKeyPress(e, "keywords")}
                    placeholder="Enter secondary keywords, separated by commas"
                    className={`flex-1 px-3 py-2 border ${
                      errors.keywords ? "border-red-500" : "border-gray-200"
                    } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                    aria-label="Secondary keywords"
                  />
                  <button
                    onClick={() => handleAddKeyword("keywords")}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center"
                    aria-label="Add keyword"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {visibleKeywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(index, "keywords")}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                        aria-label={`Remove keyword ${keyword}`}
                      >
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                  {formData.keywords.length > 18 && (
                    <span
                      onClick={() => setShowAllKeywords((prev) => !prev)}
                      className="text-xs font-medium text-blue-600 self-center cursor-pointer flex items-center gap-1"
                    >
                      {showAllKeywords ? (
                        <>Show less</>
                      ) : (
                        <>+{formData.keywords.length - 18} more</>
                      )}
                    </span>
                  )}
                </div>
                {errors.keywords && (
                  <p className="text-red-500 text-sm mt-1">At least one keyword is required.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange(e, "title")}
                    placeholder="Enter blog title..."
                    className={`w-full px-3 flex-1 py-2 border ${
                      errors.title ? "border-red-500" : "border-gray-200"
                    } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                    aria-label="Blog title"
                  />
                </div>
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">Title cannot be empty.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose length of Blog <span className="text-red-500">*</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  value={formData.userDefinedLength ?? 1000}
                  onChange={(e) => handleInputChange(e, "userDefinedLength")}
                  placeholder="Enter desired word count..."
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                  style={{
                    background: `linear-gradient(to right, #1B6FC9 ${
                      ((formData?.userDefinedLength ?? 1000) - 500) / 45
                    }%, #e5e7eb 0%)`,
                  }}
                  aria-label="Desired word count"
                />
                <span className="mt-2 text-sm text-gray-600 block">
                  {formData?.userDefinedLength ?? 1000} words
                </span>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Brand Voice
                </label>
                <div className="mt-3 p-4 rounded-md border border-gray-200 bg-gray-50">
                  {brands?.length > 0 ? (
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
                              onChange={() => handleBrandSelect(voice._id)}
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
                      <Empty /> No brand voices available. Create one to get started.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Links (max 4)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.resourceInput}
                    onChange={(e) => handleKeywordInputChange(e, "resources")}
                    onKeyDown={(e) => handleKeyPress(e, "resources")}
                    placeholder="Enter resource links (YouTube or others), separated by commas"
                    className={`flex-1 px-3 py-2 border ${
                      errors.resources ? "border-red-500" : "border-gray-200"
                    } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                    aria-label="Resource links"
                  />
                  <button
                    onClick={() => handleAddKeyword("resources")}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center"
                    aria-label="Add resource link"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.resources.map((resource, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {isImageUrl(resource) ? (
                        <img
                          src={resource}
                          alt={`Resource ${index + 1}`}
                          className="h-16 w-auto object-contain rounded mr-2 hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <a
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline mr-2 truncate max-w-[150px]"
                        >
                          {resource}
                        </a>
                      )}
                      <button
                        onClick={() => handleRemoveKeyword(index, "resources")}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                        aria-label={`Remove resource ${resource}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.resources && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter valid resource links (max 4).
                  </p>
                )}
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Generated Blog Outline</h2>
              {markdownContent ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: markdownContent
                      .replace(/^#+\s+/gm, (match) => `<h${match.length}>`)
                      .replace(/\n/gm, "<br>")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/^- (.*)$/gm, "<li>$1</li>")
                      .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>"),
                  }}
                />
              ) : (
                <p className="text-gray-500 text-sm">No content available to display.</p>
              )}
            </div>
          )}
        </div>
      </Modal>
      <div className="rounded-lg p-6 min-h-[600px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r mb-2 from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Blog Outline Editor
          </h1>
          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
            aria-label="Export as Markdown"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          <div className="flex-1 flex space-x-4">
            <div className="w-1/2">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 px-3 tracking-wide">
                Preview
              </h3>
              <div className="w-full h-screen p-4 border border-gray-200 rounded-lg bg-white overflow-y-auto prose prose-sm max-w-none text-gray-700 shadow-sm">
                <div
                  dangerouslySetInnerHTML={{
                    __html: markdownContent
                      .replace(/^#+\s+/gm, (match) => `<h${match.length}>`)
                      .replace(/\n/gm, "<br>")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/^- (.*)$/gm, "<li>$1</li>")
                      .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>")
                      .replace(/^(<h[1-6]>.*<\/h[1-6]>)$/gm, '<div class="mt-4">$1</div>')
                      .replace(/^(<ul>.*<\/ul>)$/gm, '<div class="mt-2">$1</div>'),
                  }}
                />
              </div>
            </div>
            <div className="w-1/2">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 px-3 tracking-wide">
                Edit Your Blog Outline
              </h3>
              <textarea
                id="outline-editor"
                value={markdownContent}
                onChange={handleContentChange}
                className="w-full h-screen p-4 border border-gray-200 rounded-lg text-sm font-mono bg-white focus:ring-2 focus:ring-blue-600 resize-none shadow-sm"
                aria-label="Edit blog outline"
                placeholder="Edit your blog outline here..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No content available to display.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OutlineEditor
