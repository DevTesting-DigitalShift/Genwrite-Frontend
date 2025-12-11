import React, { useState, useEffect, useCallback } from "react"
import { Modal, Input, Select, Slider, Switch, Radio, InputNumber, message, Steps } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { updateBlog, retryBlogById } from "@api/blogApi"
import { TONES } from "@/data/blogData"
import { getEstimatedCost, creditCostsWithGemini } from "@utils/getEstimatedCost"
import { useQueryClient } from "@tanstack/react-query"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { X, Plus, RefreshCw, FileText, Sparkles, Settings, Zap } from "lucide-react"

const { TextArea } = Input

const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.png", restricted: false },
  { id: "chatgpt", label: "ChatGPT", logo: "/Images/chatgpt.png", restrictedPlans: ["free"] },
  { id: "claude", label: "Claude", logo: "/Images/claude.png", restrictedPlans: ["free", "basic"] },
]

const IMAGE_SOURCES = [
  { id: "unsplash", label: "Stock Images", restrictedPlans: [] },
  { id: "ai", label: "AI Generated", restrictedPlans: ["free"] },
]

const RegenerateModal = ({ blog, isOpen, onClose }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan?.toLowerCase() || "free"

  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [focusKeywordInput, setFocusKeywordInput] = useState("")

  const [formData, setFormData] = useState({
    topic: "",
    title: "",
    focusKeywords: [],
    keywords: [],
    tone: "Professional",
    userDefinedLength: 1000,
    aiModel: "gemini",
    isCheckedGeneratedImages: false,
    imageSource: "unsplash",
    numberOfImages: 0,
    isCheckedQuick: false,
    useBrandVoice: false,
    brandId: "",
    addCTA: false,
    options: {
      includeFaqs: false,
      includeInterlinks: false,
      includeCompetitorResearch: false,
      addOutBoundLinks: false,
    },
  })

  // Initialize from blog when modal opens
  useEffect(() => {
    if (blog && isOpen) {
      setFormData({
        topic: blog.topic || "",
        title: blog.title || "",
        focusKeywords: blog.focusKeywords || [],
        keywords: blog.keywords || [],
        tone: blog.tone || "Professional",
        userDefinedLength: blog.userDefinedLength || 1000,
        aiModel: blog.aiModel || "gemini",
        isCheckedGeneratedImages: blog.isCheckedGeneratedImages || false,
        imageSource: blog.imageSource || "unsplash",
        numberOfImages: blog.numberOfImages || 0,
        isCheckedQuick: blog.isCheckedQuick || false,
        useBrandVoice: blog.isCheckedBrand || false,
        brandId: blog.brandId || "",
        addCTA: blog.options?.addCTA || false,
        options: {
          includeFaqs: blog.options?.includeFaqs || false,
          includeInterlinks: blog.options?.includeInterlinks || false,
          includeCompetitorResearch: blog.options?.includeCompetitorResearch || false,
          addOutBoundLinks: blog.options?.addOutBoundLinks || false,
        },
      })
      setCurrentStep(0)
      setKeywordInput("")
      setFocusKeywordInput("")
    }
  }, [blog, isOpen])

  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".")
        return { ...prev, [parent]: { ...prev[parent], [child]: value } }
      }
      return { ...prev, [field]: value }
    })
  }, [])

  const addKeyword = type => {
    const input = type === "focus" ? focusKeywordInput : keywordInput
    const field = type === "focus" ? "focusKeywords" : "keywords"
    const maxCount = type === "focus" ? 3 : undefined

    if (!input.trim()) return

    const existing = formData[field].map(k => k.toLowerCase())
    const newKeywords = input
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k && !existing.includes(k))

    if (maxCount && formData[field].length + newKeywords.length > maxCount) {
      message.warning(`Maximum ${maxCount} focus keywords allowed`)
      return
    }

    if (newKeywords.length > 0) {
      updateField(field, [...formData[field], ...newKeywords])
    }
    type === "focus" ? setFocusKeywordInput("") : setKeywordInput("")
  }

  const removeKeyword = (type, index) => {
    const field = type === "focus" ? "focusKeywords" : "keywords"
    updateField(
      field,
      formData[field].filter((_, i) => i !== index)
    )
  }

  const calculateCost = useCallback(() => {
    let cost = getEstimatedCost("blog.single", formData.aiModel)
    if (formData.isCheckedGeneratedImages) {
      cost +=
        formData.imageSource === "ai"
          ? creditCostsWithGemini.aiImages * (formData.numberOfImages || 3)
          : 10
    }
    if (formData.options.includeCompetitorResearch) cost += 10
    if (formData.useBrandVoice) cost += 10
    return cost
  }, [formData])

  const handleRegenerate = async () => {
    if (!blog?._id) return message.error("Blog ID is missing.")

    const cost = calculateCost()
    const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

    if (credits < cost) {
      return handlePopup({
        title: "Insufficient Credits",
        description: `You need ${cost} credits but only have ${credits}.`,
        confirmText: "Buy Credits",
        onConfirm: () => navigate("/pricing"),
      })
    }

    handlePopup({
      title: "Confirm Regeneration",
      description: (
        <>
          Regenerate this blog with new settings?{" "}
          <span className="font-bold">Cost: {cost} credits</span>
        </>
      ),
      confirmText: "Regenerate",
      onConfirm: async () => {
        setIsLoading(true)
        try {
          await updateBlog(blog._id, {
            ...formData,
            isCheckedBrand: formData.useBrandVoice,
            options: {
              ...formData.options,
              addCTA: formData.addCTA,
            },
          })
          await retryBlogById(blog._id, { createNew: true })
          queryClient.invalidateQueries({ queryKey: ["blogs"] })
          queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
          message.success("Blog regeneration started!")
          onClose()
          navigate("/blogs")
        } catch (error) {
          message.error(error.message || "Failed to regenerate.")
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  const isModelRestricted = model => {
    return model.restrictedPlans?.includes(userPlan)
  }

  const isSourceRestricted = source => {
    return source.restrictedPlans?.includes(userPlan)
  }

  const steps = [
    { title: "Content", icon: <FileText className="w-4 h-4" /> },
    { title: "AI & Media", icon: <Sparkles className="w-4 h-4" /> },
    { title: "Options", icon: <Settings className="w-4 h-4" /> },
  ]

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
        <Input
          value={formData.topic}
          onChange={e => updateField("topic", e.target.value)}
          placeholder="What's your blog about?"
          size="large"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <Input
          value={formData.title}
          onChange={e => updateField("title", e.target.value)}
          placeholder="Blog title..."
          size="large"
        />
      </div>

      {/* Focus Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Focus Keywords <span className="text-gray-400">(max 3)</span>
        </label>
        <div className="flex gap-2">
          <Input
            value={focusKeywordInput}
            onChange={e => setFocusKeywordInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword("focus"))}
            placeholder="Add focus keyword..."
            size="large"
          />
          <button
            onClick={() => addKeyword("focus")}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.focusKeywords.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {kw}
              <button onClick={() => removeKeyword("focus", i)} className="hover:text-blue-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Secondary Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Keywords</label>
        <div className="flex gap-2">
          <Input
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword("secondary"))}
            placeholder="Add keywords (comma separated)..."
            size="large"
          />
          <button
            onClick={() => addKeyword("secondary")}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.keywords.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {kw}
              <button onClick={() => removeKeyword("secondary", i)} className="hover:text-gray-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tone of Voice</label>
        <Select
          value={formData.tone}
          onChange={val => updateField("tone", val)}
          options={TONES.map(t => ({ label: t, value: t }))}
          className="w-full"
          size="large"
        />
      </div>

      {/* Word Length */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Word Length: <span className="text-blue-600 font-bold">{formData.userDefinedLength}</span>
        </label>
        <Slider
          value={formData.userDefinedLength}
          onChange={val => updateField("userDefinedLength", val)}
          min={500}
          max={5000}
          step={100}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      {/* AI Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Select AI Model</label>
        <div className="grid grid-cols-3 gap-3">
          {AI_MODELS.map(model => {
            const restricted = isModelRestricted(model)
            return (
              <button
                key={model.id}
                onClick={() => {
                  if (restricted) {
                    openUpgradePopup({ featureName: model.label, navigate })
                  } else {
                    updateField("aiModel", model.id)
                  }
                }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  formData.aiModel === model.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${restricted ? "opacity-50" : ""}`}
              >
                <img src={model.logo} alt={model.label} className="w-8 h-8" />
                <span className="text-sm font-medium">{model.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add Images */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-900">Add Images</p>
          <p className="text-sm text-gray-500">Include visuals in your blog</p>
        </div>
        <Switch
          checked={formData.isCheckedGeneratedImages}
          onChange={val => updateField("isCheckedGeneratedImages", val)}
        />
      </div>

      {formData.isCheckedGeneratedImages && (
        <>
          {/* Image Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Image Source</label>
            <div className="grid grid-cols-2 gap-3">
              {IMAGE_SOURCES.map(source => {
                const restricted = isSourceRestricted(source)
                return (
                  <button
                    key={source.id}
                    onClick={() => {
                      if (restricted) {
                        openUpgradePopup({ featureName: source.label, navigate })
                      } else {
                        updateField("imageSource", source.id)
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.imageSource === source.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${restricted ? "opacity-50" : ""}`}
                  >
                    <span className="text-sm font-medium">{source.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number of Images */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Number of Images</p>
              <p className="text-xs text-gray-500">0 = AI decides</p>
            </div>
            <InputNumber
              value={formData.numberOfImages}
              onChange={val => updateField("numberOfImages", val || 0)}
              min={0}
              max={15}
              className="w-20"
            />
          </div>
        </>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Brand Voice */}
      <BrandVoiceSelector
        label="Write with Brand Voice"
        labelClass="text-sm font-medium text-gray-700"
        value={{
          isCheckedBrand: formData.useBrandVoice,
          brandId: formData.brandId,
          addCTA: formData.addCTA,
        }}
        onChange={val => {
          updateField("useBrandVoice", val.isCheckedBrand)
          updateField("brandId", val.brandId)
          updateField("addCTA", val.addCTA)
        }}
      />

      {/* Include Interlinks */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-900">Include Interlinks</p>
          <p className="text-xs text-gray-500">Link between related content</p>
        </div>
        <Switch
          checked={formData.options.includeInterlinks}
          onChange={val => updateField("options.includeInterlinks", val)}
        />
      </div>

      {/* Include FAQs */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-900">Include FAQ Section</p>
          <p className="text-xs text-gray-500">Auto-generate FAQs</p>
        </div>
        <Switch
          checked={formData.options.includeFaqs}
          onChange={val => updateField("options.includeFaqs", val)}
        />
      </div>

      {/* Quick Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-900">Add Quick Summary</p>
          <p className="text-xs text-gray-500">TL;DR section at the top</p>
        </div>
        <Switch
          checked={formData.isCheckedQuick}
          onChange={val => updateField("isCheckedQuick", val)}
        />
      </div>

      {/* Competitive Research */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-900">Competitive Research</p>
          <p className="text-xs text-gray-500">Analyze similar blogs (+10 credits)</p>
        </div>
        <Switch
          checked={formData.options.includeCompetitorResearch}
          onChange={val => updateField("options.includeCompetitorResearch", val)}
        />
      </div>

      {formData.options.includeCompetitorResearch && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl ml-4">
          <div>
            <p className="font-medium text-gray-900">Show Outbound Links</p>
            <p className="text-xs text-gray-500">Include competitor links</p>
          </div>
          <Switch
            checked={formData.options.addOutBoundLinks}
            onChange={val => updateField("options.addOutBoundLinks", val)}
          />
        </div>
      )}
    </div>
  )

  const estimatedCost = calculateCost()

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Regenerate Blog</h3>
            <p className="text-xs text-gray-500 font-normal">Update settings and regenerate</p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={600}
      centered
      footer={
        <div className="flex flex-col gap-4">
          {/* Cost Display */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
            <span className="text-sm text-gray-600">Estimated Cost:</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-bold text-blue-600">{estimatedCost} credits</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(p => Math.max(0, p - 1))}
              disabled={currentStep === 0}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {currentStep < 2 ? (
              <button
                onClick={() => setCurrentStep(p => p + 1)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Blog
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Steps */}
      <Steps
        current={currentStep}
        onChange={setCurrentStep}
        className="mb-6"
        items={steps.map((step, i) => ({
          title: step.title,
          icon: step.icon,
        }))}
      />

      {/* Content */}
      <div className="max-h-[50vh] overflow-y-auto pr-2">
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
      </div>
    </Modal>
  )
}

export default RegenerateModal
