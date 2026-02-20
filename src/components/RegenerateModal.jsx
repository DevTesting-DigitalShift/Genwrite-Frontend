import { useState, useCallback } from "react"
import toast from "@utils/toast"
import { RefreshCw, Plus, X, Zap } from "lucide-react"
import { TONES } from "@/data/blogData"
import { IMAGE_SOURCE } from "@/data/blogData"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { useNavigate } from "react-router-dom"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { computeCost } from "@/data/pricingConfig"

// AI Models config
const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.webp", restrictedPlans: [] },
  { id: "openai", label: "ChatGPT", logo: "/Images/chatgpt.webp", restrictedPlans: ["free"] },
  {
    id: "claude",
    label: "Claude",
    logo: "/Images/claude.webp",
    restrictedPlans: ["free", "basic"],
  },
]

const RegenerateModal = ({
  isOpen,
  onClose,
  onSubmit,
  isRegenerating,
  regenForm,
  updateRegenField,
  userPlan,
  integrations,
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
    if (regenForm.options.performKeywordResearch) features.push("keywordResearch")
    if (regenForm.options.includeFaqs) features.push("faqGeneration")
    if (regenForm.options.includeInterlinks) features.push("internalLinking")
    if (regenForm.isCheckedQuick) features.push("quickSummary")
    if (regenForm.wordpressPostStatus) features.push("automaticPosting")

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
      return toast.warning("Max 3 focus keywords")
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
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 bg-base-100">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span className="text-base font-semibold">
              Regenerate Blog - Step {regenerateStep} of 2
            </span>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 relative">
          {isRegenerating && (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 font-semibold text-gray-600">Processing...</p>
            </div>
          )}

          {regenerateStep === 1 ? (
            // Step 1: Regenerate Blog Settings
            <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
              <p className="text-sm text-gray-500 mb-4">
                Configure your blog regeneration settings. You can modify the topic, keywords, tone,
                and other options.
              </p>

              {/* Topic & Title */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Topic</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={regenForm.topic}
                    onChange={e => updateRegenField("topic", e.target.value)}
                    placeholder="Blog topic..."
                  />
                </div>

                {/* Perform Keyword Research Toggle - below Topic */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Perform Keyword Research
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      AI will auto-generate title and keywords based on your topic
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.options.performKeywordResearch}
                    onChange={e =>
                      updateRegenField("options.performKeywordResearch", e.target.checked)
                    }
                  />
                </div>

                {/* Only show Title input if performKeywordResearch is OFF */}
                {!regenForm.options.performKeywordResearch && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Title</label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={regenForm.title}
                      onChange={e => updateRegenField("title", e.target.value)}
                      placeholder="Blog title..."
                    />
                  </div>
                )}
              </div>

              {/* Focus Keywords - Only show if performKeywordResearch is OFF */}
              {!regenForm.options.performKeywordResearch && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Focus Keywords (max 3)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={focusKeywordInput}
                      onChange={e => setFocusKeywordInput(e.target.value)}
                      onKeyDown={e =>
                        e.key === "Enter" && (e.preventDefault(), addRegenKeyword("focus"))
                      }
                      placeholder="Add keyword..."
                    />
                    <button className="btn btn-primary" onClick={() => addRegenKeyword("focus")}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {regenForm.focusKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
                      >
                        {kw}
                        <button onClick={() => removeRegenKeyword("focus", i)}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Keywords - Only show if performKeywordResearch is OFF */}
              {!regenForm.options.performKeywordResearch && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Keywords</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      onKeyDown={e =>
                        e.key === "Enter" && (e.preventDefault(), addRegenKeyword("secondary"))
                      }
                      placeholder="Add keywords..."
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => addRegenKeyword("secondary")}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {regenForm.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold"
                      >
                        {kw}
                        <button onClick={() => removeRegenKeyword("secondary", i)}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tone & Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Tone</label>
                  <select
                    className="select select-bordered w-full"
                    value={regenForm.tone}
                    onChange={e => updateRegenField("tone", e.target.value)}
                  >
                    {TONES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Word Count
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={regenForm.userDefinedLength}
                    onChange={e => updateRegenField("userDefinedLength", parseInt(e.target.value))}
                  >
                    <option value={500}>500 words</option>
                    <option value={1000}>1,000 words</option>
                    <option value={1500}>1,500 words</option>
                    <option value={2000}>2,000 words</option>
                    <option value={2500}>2,500 words</option>
                    <option value={3000}>3,000 words</option>
                    <option value={3500}>3,500 words</option>
                    <option value={4000}>4,000 words</option>
                    <option value={4500}>4,500 words</option>
                    <option value={5000}>5,000 words</option>
                  </select>
                </div>
              </div>

              {/* AI Model */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">AI Model</label>
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
                      className={`p-3 rounded-lg border-2 text-center text-sm font-semibold transition-all ${
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
                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-300 transition-all">
                    <input
                      type="radio"
                      name="imageSource"
                      checked={!regenForm.isCheckedGeneratedImages}
                      onChange={() => {
                        updateRegenField("isCheckedGeneratedImages", false)
                        updateRegenField("imageSource", IMAGE_SOURCE.NONE)
                      }}
                      className="radio radio-primary radio-sm"
                    />
                    <span className="text-sm font-semibold text-gray-700">None</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-300 transition-all">
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
                      className="radio radio-primary radio-sm"
                    />
                    <span className="text-sm font-semibold text-gray-700">Stock Images</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-300 transition-all">
                    <input
                      type="radio"
                      name="imageSource"
                      checked={
                        regenForm.isCheckedGeneratedImages &&
                        regenForm.imageSource === IMAGE_SOURCE.AI
                      }
                      onChange={() => {
                        updateRegenField("isCheckedGeneratedImages", true)
                        updateRegenField("imageSource", IMAGE_SOURCE.AI)
                      }}
                      className="radio radio-primary radio-sm"
                    />
                    <span className="text-sm font-semibold text-gray-700">AI Generated</span>
                  </label>
                </div>

                {regenForm.isCheckedGeneratedImages && (
                  <div className="pt-2">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Number of Images: {regenForm.numberOfImages ?? 0}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={regenForm.numberOfImages ?? 0}
                      onChange={e =>
                        updateRegenField("numberOfImages", parseInt(e.target.value) ?? 0)
                      }
                      className="input input-bordered w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Step 2: Content Enhancement Options + Brand Voice
            <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Content Enhancement Options
              </h4>

              {/* Brand Voice - Moved to Step 2 */}
              <div className="p-4 bg-linear-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <BrandVoiceSelector
                  label="Write with Brand Voice"
                  size="default"
                  labelClass="text-sm font-semibold text-gray-700"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Add FAQs (Frequently Asked Questions)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.options.includeFaqs}
                    onChange={e => updateRegenField("options.includeFaqs", e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-semibold text-gray-700">Include Interlinks</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.options.includeInterlinks}
                    onChange={e => updateRegenField("options.includeInterlinks", e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Perform Competitive Research
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.options.includeCompetitorResearch}
                    onChange={e =>
                      updateRegenField("options.includeCompetitorResearch", e.target.checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-semibold text-gray-700">Show Outbound Links</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.options.addOutBoundLinks}
                    onChange={e => updateRegenField("options.addOutBoundLinks", e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-semibold text-gray-700">Add a Quick Summary</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.isCheckedQuick}
                    onChange={e => updateRegenField("isCheckedQuick", e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-semibold text-gray-700">Easy to Understand</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.easyToUnderstand}
                    onChange={e => updateRegenField("easyToUnderstand", e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Embed YouTube Videos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={regenForm.embedYouTubeVideos}
                    onChange={e => updateRegenField("embedYouTubeVideos", e.target.checked)}
                  />
                </div>

                {/* Automate Posting */}
                <div className="">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Enable Automate Posting
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={regenForm.wordpressPostStatus}
                      onChange={e => updateRegenField("wordpressPostStatus", e.target.checked)}
                    />
                  </div>

                  {regenForm.wordpressPostStatus && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          Show Table of Content
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={regenForm.includeTableOfContents}
                          onChange={e =>
                            updateRegenField("includeTableOfContents", e.target.checked)
                          }
                        />
                      </div>

                      <label className="text-sm font-semibold text-gray-600 block my-2 mt-6">
                        Choose Platform
                      </label>
                      <select
                        className="select select-bordered w-full mb-3"
                        value={regenForm.postingType}
                        onChange={e => updateRegenField("postingType", e.target.value)}
                      >
                        <option disabled selected>
                          Select Platform
                        </option>
                        <option value="WORDPRESS">WORDPRESS</option>
                        <option value="SERVERENDPOINT">SERVERENDPOINT</option>
                        <option value="SHOPIFY">SHOPIFY</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Cost Cutter */}
                <div className="flex items-center justify-between py-4 px-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 trans mt-3ition-colors border-2 border-green-200">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Cost Cutter</span>
                      <span className="ml-2 text-sm text-green-600 font-semibold">Save 25%</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Reduce credits by 25% with optimized generation
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={regenForm.costCutter}
                    onChange={e => updateRegenField("costCutter", e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-action px-6 py-4 bg-base-100 border-t border-gray-300 flex justify-between items-center mt-0">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-600 font-semibold">Estimated Cost:</span>
              <span className="font-bold text-blue-600 text-sm">
                {calculateRegenCost()} credits
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {regenerateStep === 2 && (
              <button className="btn" onClick={() => setRegenerateStep(1)}>
                Back
              </button>
            )}
            {regenerateStep === 1 ? (
              <button
                className="btn btn-primary bg-linear-to-r from-blue-500 rounded-lg to-indigo-600 border-0 text-white"
                onClick={() => setRegenerateStep(2)}
              >
                Next: Enhancement Options
              </button>
            ) : (
              <button
                className="btn btn-primary bg-linear-to-r from-blue-600 rounded-lg to-purple-600 border-0 text-white"
                disabled={isRegenerating}
                onClick={handleSubmit}
              >
                {isRegenerating ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerate Blog
              </button>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  )
}

export default RegenerateModal
