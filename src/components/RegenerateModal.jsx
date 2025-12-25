import { useState, useCallback } from "react"
import { Modal, Button, Input, Select, Switch, InputNumber, message } from "antd"
import { RefreshCw, Plus, X, Zap, Lightbulb } from "lucide-react"
import { TONES } from "@/data/blogData"
import { IMAGE_SOURCE } from "@/data/blogData"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { useNavigate } from "react-router-dom"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { computeCost } from "@/data/pricingConfig"

// AI Models config
const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.png", restrictedPlans: [] },
  { id: "openai", label: "ChatGPT", logo: "/Images/chatgpt.png", restrictedPlans: ["free"] },
  { id: "claude", label: "Claude", logo: "/Images/claude.png", restrictedPlans: ["free", "basic"] },
]

const RegenerateModal = ({
  isOpen,
  onClose,
  onSubmit,
  isRegenerating,
  regenForm,
  updateRegenField,
  userPlan,
}) => {
  const navigate = useNavigate()
  const [regenerateStep, setRegenerateStep] = useState(1)
  const [keywordInput, setKeywordInput] = useState("")
  const [focusKeywordInput, setFocusKeywordInput] = useState("")

  // Calculate regenerate cost using pricing config
  const calculateRegenCost = useCallback(() => {
    const features = []

    // Add features based on selections
    if (regenForm.useBrandVoice) features.push("brandVoice")
    if (regenForm.options.includeCompetitorResearch) features.push("competitorResearch")
    if (regenForm.options.includeFaqs) features.push("faqGeneration")
    if (regenForm.options.includeInterlinks) features.push("internalLinking")

    let cost = computeCost({
      wordCount: regenForm.userDefinedLength || 1000,
      features,
      aiModel: regenForm.aiModel || "gemini",
      includeImages: regenForm.isCheckedGeneratedImages,
      imageSource: regenForm.imageSource,
      numberOfImages: regenForm.numberOfImages || 3,
      isCheckedBrand: regenForm.useBrandVoice,
    })

    // Apply Cost Cutter discount (25% off)
    if (regenForm.costCutter) {
      cost = Math.round(cost * 0.75)
    }

    return cost
  }, [regenForm])

  const addRegenKeyword = type => {
    const input = type === "focus" ? focusKeywordInput : keywordInput
    const field = type === "focus" ? "focusKeywords" : "keywords"
    if (!input.trim()) return
    const existing = regenForm[field].map(k => k.toLowerCase())
    const newKws = input
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k && !existing.includes(k))
    if (type === "focus" && regenForm.focusKeywords.length + newKws.length > 3) {
      return message.warning("Max 3 focus keywords")
    }
    if (newKws.length > 0) updateRegenField(field, [...regenForm[field], ...newKws])
    type === "focus" ? setFocusKeywordInput("") : setKeywordInput("")
  }

  const removeRegenKeyword = (type, index) => {
    const field = type === "focus" ? "focusKeywords" : "keywords"
    updateRegenField(
      field,
      regenForm[field].filter((_, i) => i !== index)
    )
  }

  const handleClose = () => {
    setRegenerateStep(1)
    onClose()
  }

  const handleSubmit = () => {
    onSubmit()
    setRegenerateStep(1)
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <span className="text-base font-semibold">
            Regenerate Blog - Step {regenerateStep} of 2
          </span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-600 font-medium">Estimated Cost:</span>
              <span className="font-bold text-blue-600 text-base">
                {calculateRegenCost()} credits
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {regenerateStep === 2 && (
              <Button size="large" onClick={() => setRegenerateStep(1)}>
                Back
              </Button>
            )}
            {regenerateStep === 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={() => setRegenerateStep(2)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0"
              >
                Next: Enhancement Options
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={isRegenerating}
                onClick={handleSubmit}
                icon={<RefreshCw className="w-4 h-4" />}
                className="bg-gradient-to-r from-blue-600 to-purple-600 border-0"
              >
                Regenerate Blog
              </Button>
            )}
          </div>
        </div>
      }
      centered
      width={650}
    >
      {regenerateStep === 1 ? (
        // Step 1: Regenerate Blog Settings
        <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
          <p className="text-sm text-gray-500 mb-4">
            Configure your blog regeneration settings. You can modify the topic, keywords, tone, and
            other options.
          </p>

          {/* Topic & Title */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Topic</label>
              <Input
                size="large"
                value={regenForm.topic}
                onChange={e => updateRegenField("topic", e.target.value)}
                placeholder="Blog topic..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
              <Input
                size="large"
                value={regenForm.title}
                onChange={e => updateRegenField("title", e.target.value)}
                placeholder="Blog title..."
              />
            </div>
          </div>

          {/* Focus Keywords */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Focus Keywords (max 3)
            </label>
            <div className="flex items-center gap-2">
              <Input
                size="large"
                value={focusKeywordInput}
                onChange={e => setFocusKeywordInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRegenKeyword("focus"))}
                placeholder="Add keyword..."
              />
              <Button
                type="primary"
                size="large"
                onClick={() => addRegenKeyword("focus")}
                icon={<Plus className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {regenForm.focusKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {kw}
                  <button onClick={() => removeRegenKeyword("focus", i)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Secondary Keywords */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Keywords</label>
            <div className="flex items-center gap-2">
              <Input
                size="large"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e =>
                  e.key === "Enter" && (e.preventDefault(), addRegenKeyword("secondary"))
                }
                placeholder="Add keywords..."
              />
              <Button
                type="primary"
                size="large"
                onClick={() => addRegenKeyword("secondary")}
                icon={<Plus className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {regenForm.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"
                >
                  {kw}
                  <button onClick={() => removeRegenKeyword("secondary", i)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tone & Length */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tone</label>
              <Select
                size="large"
                value={regenForm.tone}
                onChange={val => updateRegenField("tone", val)}
                options={TONES.map(t => ({ label: t, value: t }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Word Count</label>
              <Select
                size="large"
                value={regenForm.userDefinedLength}
                onChange={val => updateRegenField("userDefinedLength", val)}
                options={[
                  { label: "500 words", value: 500 },
                  { label: "1,000 words", value: 1000 },
                  { label: "1,500 words", value: 1500 },
                  { label: "2,000 words", value: 2000 },
                  { label: "2,500 words", value: 2500 },
                  { label: "3,000 words", value: 3000 },
                  { label: "3,500 words", value: 3500 },
                  { label: "4,000 words", value: 4000 },
                  { label: "4,500 words", value: 4500 },
                  { label: "5,000 words", value: 5000 },
                ]}
                className="w-full"
              />
            </div>
          </div>

          {/* AI Model */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">AI Model</label>
            <div className="grid grid-cols-3 gap-3">
              {AI_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (model.restrictedPlans.includes(userPlan)) {
                      openUpgradePopup({ featureName: model.label, navigate })
                    } else {
                      updateRegenField("aiModel", model.id)
                    }
                  }}
                  className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                    regenForm.aiModel === model.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${model.restrictedPlans.includes(userPlan) ? "opacity-50" : ""}`}
                >
                  <img src={model.logo} alt={model.label} className="w-6 h-6 mx-auto mb-1.5" />
                  {model.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add Images Section - Radio Buttons */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block">Add Images</label>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-all">
                <input
                  type="radio"
                  name="imageSource"
                  checked={!regenForm.isCheckedGeneratedImages}
                  onChange={() => {
                    updateRegenField("isCheckedGeneratedImages", false)
                    updateRegenField("imageSource", IMAGE_SOURCE.NONE)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">None</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-all">
                <input
                  type="radio"
                  name="imageSource"
                  checked={
                    regenForm.isCheckedGeneratedImages &&
                    regenForm.imageSource === IMAGE_SOURCE.STOCK
                  }
                  onChange={() => {
                    updateRegenField("isCheckedGeneratedImages", true)
                    updateRegenField("imageSource", IMAGE_SOURCE.STOCK)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Stock Images</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-all">
                <input
                  type="radio"
                  name="imageSource"
                  checked={
                    regenForm.isCheckedGeneratedImages && regenForm.imageSource === IMAGE_SOURCE.AI
                  }
                  onChange={() => {
                    updateRegenField("isCheckedGeneratedImages", true)
                    updateRegenField("imageSource", IMAGE_SOURCE.AI)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">AI Generated</span>
              </label>
            </div>

            {regenForm.isCheckedGeneratedImages && (
              <div className="pt-2">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Number of Images: {regenForm.numberOfImages || 3}
                </label>
                <InputNumber
                  size="large"
                  min={1}
                  max={10}
                  value={regenForm.numberOfImages || 3}
                  onChange={val => updateRegenField("numberOfImages", val)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // Step 2: Content Enhancement Options + Brand Voice
        <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
          <p className="text-sm text-gray-500 mb-4">
            Select the content enhancement options and brand voice settings for your regenerated
            blog.
          </p>

          {/* Brand Voice - Moved to Step 2 */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <BrandVoiceSelector
              label="Brand Voice"
              size="default"
              labelClass="text-base font-semibold text-gray-700"
              value={{
                isCheckedBrand: regenForm.useBrandVoice,
                brandId: regenForm.brandId,
                addCTA: regenForm.addCTA,
              }}
              onChange={val => {
                updateRegenField("useBrandVoice", val.isCheckedBrand)
                updateRegenField("brandId", val.brandId)
                updateRegenField("addCTA", val.addCTA)
              }}
            />
          </div>

          {/* Enhancement Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Content Enhancement Options
            </h4>

            <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    regenForm.options.includeFaqs ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-base font-medium text-gray-700">Include FAQs</span>
              </div>
              <Switch
                checked={regenForm.options.includeFaqs}
                onChange={val => updateRegenField("options.includeFaqs", val)}
              />
            </div>

            <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    regenForm.options.includeInterlinks ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-base font-medium text-gray-700">Include Interlinks</span>
              </div>
              <Switch
                checked={regenForm.options.includeInterlinks}
                onChange={val => updateRegenField("options.includeInterlinks", val)}
              />
            </div>

            <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    regenForm.options.includeCompetitorResearch ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <div>
                  <span className="text-base font-medium text-gray-700">Competitor Research</span>
                  <span className="ml-2 text-sm text-amber-600 font-semibold">+10 credits</span>
                </div>
              </div>
              <Switch
                checked={regenForm.options.includeCompetitorResearch}
                onChange={val => updateRegenField("options.includeCompetitorResearch", val)}
              />
            </div>

            <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    regenForm.options.addOutBoundLinks ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-base font-medium text-gray-700">Add Outbound Links</span>
              </div>
              <Switch
                checked={regenForm.options.addOutBoundLinks}
                onChange={val => updateRegenField("options.addOutBoundLinks", val)}
              />
            </div>

            {/* Cost Cutter */}
            <div className="flex items-center justify-between py-4 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-colors border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    regenForm.costCutter ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <div>
                  <span className="text-base font-medium text-gray-700">Cost Cutter</span>
                  <span className="ml-2 text-sm text-green-600 font-semibold">Save 25%</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reduce credits by 25% with optimized generation
                  </p>
                </div>
              </div>
              <Switch
                checked={regenForm.costCutter}
                onChange={val => updateRegenField("costCutter", val)}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default RegenerateModal
