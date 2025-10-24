import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Modal, Input, Select, message, Spin } from "antd"
import { Plus, RefreshCcw, Sparkles, X } from "lucide-react"
import Carousel from "@components/multipleStepModal/Carousel"
import { packages } from "@/data/templates"
import { fetchGeneratedTitles } from "@store/slices/blogSlice"
import { selectUser } from "@store/slices/authSlice"
import TemplateSelection from "@components/multipleStepModal/TemplateSelection"

const TemplateModal = ({
  closeFnc,
  isOpen,
  handleSubmit,
  errors,
  setErrors,
  formData,
  setFormData,
}) => {
  const user = useSelector(selectUser)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState([])
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [generatedTitles, setGeneratedTitles] = useState([])
  const [hasGeneratedTitles, setHasGeneratedTitles] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)

  const visibleKeywords = showAllKeywords ? formData.keywords : formData.keywords.slice(0, 18)

  const dispatch = useDispatch()

  // useEffect(() => {
  //   if (isOpen) document.body.classList.add("backdrop-blur")
  //   else document.body.classList.remove("backdrop-blur")
  // }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep === 0 && !selectedTemplate) {
      setErrors(prev => ({ ...prev, template: true }))
      message.error("Please select a template before proceeding.")
      return
    }
    setErrors(prev => ({ ...prev, template: false }))
    setCurrentStep(1)
  }

  const handlePrev = () => setCurrentStep(0)

  const handleClose = () => closeFnc()

  const handlePackageSelect = useCallback(temp => {
    setSelectedTemplate(temp)
    setFormData(prev => ({ ...prev, template: temp?.[0]?.name || "" }))
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
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setFormData(prev => ({ ...prev, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [type]: false }))
  }

  const handleAddKeyword = type => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors(prev => ({ ...prev, [type]: true }))
      message.error("Please enter a keyword.")
      return
    }

    const existingSet = new Set(formData[type].map(k => k.trim().toLowerCase()))
    const newKeywords = inputValue
      .split(",")
      .map(k => k.trim())
      .filter(k => k && !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors(prev => ({ ...prev, [type]: true }))
      message.error("Please enter valid, non-duplicate keywords separated by commas.")
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      setErrors(prev => ({ ...prev, [type]: true }))
      message.error("You can only add up to 3 focus keywords.")
      return
    }

    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [inputKey]: "",
    }))
    setErrors(prev => ({ ...prev, [type]: false }))
  }

  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
  }

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  const handleGenerateTitles = async () => {
    if (!formData.topic.trim()) {
      setErrors(prev => ({ ...prev, topic: true }))
      message.error("Please enter a topic before generating titles.")
      return
    }
    if (formData.focusKeywords.length < 1 && formData.keywords.length < 1) {
      setErrors(prev => ({ ...prev, focusKeywords: true, keywords: true }))
      message.error("Please add at least one focus keyword or secondary keyword.")
      return
    }

    setIsGeneratingTitles(true)
    try {
      const result = await dispatch(
        fetchGeneratedTitles({
          keywords: formData.focusKeywords,
          focusKeywords: formData.keywords,
          topic: formData.topic,
          template: selectedTemplate,
          ...(hasGeneratedTitles && { oldTitles: generatedTitles }),
        })
      ).unwrap()
      setGeneratedTitles(result)
      setHasGeneratedTitles(true)
      message.success("Titles generated successfully!")
    } catch (error) {
      console.error("Failed to generate titles:", error)
      message.error(error?.message || "Failed to generate titles. Please try again.")
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  useEffect(() => {
    setHasGeneratedTitles(false)
    setGeneratedTitles([])
  }, [])

  return (
    <Modal
      title={currentStep === 0 ? "Select Template" : "Create Simple Blog"}
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
          : [
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
                className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
                aria-label="Submit blog"
              >
                Submit
              </button>,
            ]
      }
      width={800}
      centered
    >
      <div className="p-2">
        {currentStep === 0 && (
          <div className="p-3">
            <TemplateSelection
              userSubscriptionPlan={user?.subscription?.plan || "free"}
              preSelectedIds={selectedTemplate?.map(t => t?.id || "")}
              onClick={handlePackageSelect}
            />
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
                onChange={e => handleInputChange(e, "topic")}
                placeholder="Enter blog topic..."
                className={`w-full px-3 py-2 border ${
                  errors.topic ? "border-red-500" : "border-gray-200"
                } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                aria-label="Blog topic"
              />
              {errors.topic && <p className="text-red-500 text-sm mt-1">Topic cannot be empty.</p>}
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
              >
                <Select.Option value="Informative">Informative</Select.Option>
                <Select.Option value="Casual">Casual</Select.Option>
                <Select.Option value="Professional">Professional</Select.Option>
                <Select.Option value="Persuasive">Persuasive</Select.Option>
                <Select.Option value="Humorous">Humorous</Select.Option>
              </Select>
              {errors.tone && <p className="text-red-500 text-sm mt-1">Tone cannot be empty.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Keywords (max 3) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.focusKeywordInput}
                  onChange={e => handleKeywordInputChange(e, "focusKeywords")}
                  onKeyDown={e => handleKeyPress(e, "focusKeywords")}
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.keywordInput}
                  onChange={e => handleKeywordInputChange(e, "keywords")}
                  onKeyDown={e => handleKeyPress(e, "keywords")}
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
                    onClick={() => setShowAllKeywords(prev => !prev)}
                    className="text-xs font-medium text-blue-600 self-center cursor-pointer flex items-center gap-1"
                  >
                    {showAllKeywords ? <>Show less</> : <>+{formData.keywords.length - 18} more</>}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <Input
                  value={formData.title}
                  onChange={e => handleInputChange(e, "title")}
                  placeholder="Enter blog title..."
                  className={`w-full px-3 flex-1 py-2 border ${
                    errors.title ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm focus:ring-2 focus:ring-blue-600`}
                  aria-label="Blog title"
                />
                {/* {!hasGeneratedTitles && ( */}
                <button
                  onClick={handleGenerateTitles}
                  disabled={isGeneratingTitles}
                  className={`px-4 py-2 bg-gradient-to-r from-[#1B6FC9] to-[#4C9FE8] text-white rounded-lg flex items-center ${
                    isGeneratingTitles
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-[#1B6FC9]/90 hover:to-[#4C9FE8]/90"
                  }`}
                >
                  {isGeneratingTitles ? (
                    <Spin size="small text-white" />
                  ) : hasGeneratedTitles ? (
                    <>
                      <RefreshCcw size={16} className="mr-2" />
                      Generate More
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="mr-2" />
                      Generate Titles
                    </>
                  )}
                </button>
              </div>
              {generatedTitles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {generatedTitles.map((generatedTitle, index) => {
                    const isSelected = generatedTitle === formData.title
                    return (
                      <div key={index} className="relative group">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, title: generatedTitle }))
                            setErrors(prev => ({ ...prev, title: false }))
                          }}
                          className={`px-3 py-1 rounded-full text-sm border transition truncate max-w-[200px] sm:max-w-[300px] ${
                            isSelected
                              ? "bg-[#1B6FC9] text-white border-[#1B6FC9]"
                              : "bg-gray-100 text-gray-700 border-gray-300 opacity-60 hover:opacity-100 hover:bg-gray-200"
                          }`}
                          aria-label={`Select title: ${generatedTitle}`}
                        >
                          {generatedTitle}
                        </button>
                      </div>
                    )
                  })}
                </div>
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
                onChange={e => handleInputChange(e, "userDefinedLength")}
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
      </div>
    </Modal>
  )
}

export default TemplateModal
