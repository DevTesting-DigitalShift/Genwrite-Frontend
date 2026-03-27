import { useState, useCallback } from "react"
import { toast } from "sonner"
import { RefreshCw, Plus, X, Zap } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { TONES } from "@/data/blogData"
import { IMAGE_SOURCE } from "@/data/blogData"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { useNavigate } from "react-router-dom"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { computeCost } from "@/data/pricingConfig"
import AiModelSelector from "@components/AiModelSelector"
import ImageSourceSelector from "@components/ImageSourceSelector"

const RegenerateModal = ({
  isOpen,
  onClose,
  onSubmit,
  isRegenerating,
  regenForm,
  updateRegenField,
  userPlan,
  user,
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
    if (regenForm.isCheckedBrand) features.push("brandVoice")
    if (regenForm.options.includeCompetitorResearch) features.push("competitorResearch")
    if (regenForm.options.performKeywordResearch) features.push("keywordResearch")
    if (regenForm.options.includeFaqs) features.push("faqGeneration")
    if (regenForm.options.includeInterlinks) features.push("internalLinking")
    if (regenForm.isCheckedQuick) features.push("quickSummary")
    if (regenForm.options.automaticPosting) features.push("automaticPosting")

    let cost = computeCost({
      wordCount: regenForm.userDefinedLength || 1000,
      features,
      aiModel: regenForm.aiModel || "gemini",
      includeImages: regenForm.isCheckedGeneratedImages,
      imageSource: regenForm.imageSource,
      numberOfImages: regenForm.numberOfImages || 3,
      isCheckedBrand: regenForm.isCheckedBrand,
    })

    // Apply Cost Cutter discount (25% off)
    if (regenForm.costCutter) {
      cost = Math.round(cost * 0.5)
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
      <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden">
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
                  <label className="text-sm font-semibold  mb-2 block">Topic</label>
                  <input
                    type="text"
                    className="input outline-0 w-full"
                    value={regenForm.topic}
                    onChange={e => updateRegenField("topic", e.target.value)}
                    placeholder="Blog topic..."
                  />
                </div>

                {/* Perform Keyword Research Toggle - below Topic */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Perform Keyword Research</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      AI will auto-generate title and keywords based on your topic
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.performKeywordResearch}
                    onCheckedChange={checked =>
                      updateRegenField("options.performKeywordResearch", checked)
                    }
                    size="large"
                  />
                </div>

                {/* Only show Title input if performKeywordResearch is OFF */}
                {!regenForm.options.performKeywordResearch && (
                  <div>
                    <label className="text-sm font-semibold  mb-2 block">Title</label>
                    <input
                      type="text"
                      className="input outline-0 w-full"
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
                  <label className="text-sm font-semibold  mb-2 block">
                    Focus Keywords (max 3)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input outline-0 w-full"
                      value={focusKeywordInput}
                      onChange={e => setFocusKeywordInput(e.target.value)}
                      onKeyDown={e =>
                        e.key === "Enter" && (e.preventDefault(), addRegenKeyword("focus"))
                      }
                      placeholder="Add keyword..."
                    />
                    <button
                      className="btn bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white border-none rounded-md transition-all"
                      onClick={() => addRegenKeyword("focus")}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {regenForm.focusKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-semibold"
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
                  <label className="text-sm font-semibold  mb-2 block">Keywords</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input outline-0 w-full"
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      onKeyDown={e =>
                        e.key === "Enter" && (e.preventDefault(), addRegenKeyword("secondary"))
                      }
                      placeholder="Add keywords..."
                    />
                    <button
                      className="btn bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white border-none rounded-md transition-all"
                      onClick={() => addRegenKeyword("secondary")}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {regenForm.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm font-semibold"
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
                  <label className="text-sm font-semibold  mb-2 block">Tone</label>
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
                  <label className="text-sm font-semibold  mb-2 block">Word Count</label>
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

              <AiModelSelector
                value={regenForm.aiModel}
                onChange={modelId => updateRegenField("aiModel", modelId)}
                showCostCutter={true}
                costCutterValue={regenForm.costCutter}
                onCostCutterChange={checked => updateRegenField("costCutter", checked)}
              />

              {/* Add Images Toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-semibold ">Add Images</span>
                <Switch
                  checked={regenForm.isCheckedGeneratedImages}
                  onCheckedChange={checked => {
                    updateRegenField("isCheckedGeneratedImages", checked)
                    if (checked) {
                      const newSource =
                        regenForm.imageSource === IMAGE_SOURCE.NONE || !regenForm.imageSource
                          ? IMAGE_SOURCE.STOCK
                          : regenForm.imageSource
                      updateRegenField("imageSource", newSource)
                    } else {
                      updateRegenField("imageSource", IMAGE_SOURCE.NONE)
                    }
                  }}
                  size="large"
                />
              </div>

              {regenForm.isCheckedGeneratedImages && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <ImageSourceSelector
                    value={regenForm.imageSource || IMAGE_SOURCE.STOCK}
                    onChange={newSource => updateRegenField("imageSource", newSource)}
                    showNone={false}
                    numberOfImages={regenForm.numberOfImages}
                    onNumberChange={val => updateRegenField("numberOfImages", val)}
                  />
                </div>
              )}
            </div>
          ) : (
            // Step 2: Content Enhancement Options + Brand Voice
            <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scroll">
              {/* Brand Voice - Moved to Step 2 */}
              <BrandVoiceSelector
                label="Write with Brand Voice"
                size="large"
                labelClass="text-sm font-semibold "
                value={{
                  isCheckedBrand: regenForm.isCheckedBrand,
                  brandId: regenForm.brandId,
                  addCTA: regenForm.options.addCTA,
                }}
                onChange={val => {
                  updateRegenField("isCheckedBrand", val.isCheckedBrand)
                  updateRegenField("brandId", val.brandId)
                  updateRegenField("options.addCTA", val.addCTA)
                }}
              />

              {/* E nhancement Options */}
              <div className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Add FAQs</span>
                    <p className="text-[10px] text-gray-500">
                      Include a section for common reader questions
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.includeFaqs}
                    onCheckedChange={checked => updateRegenField("options.includeFaqs", checked)}
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Include Interlinks</span>
                    <p className="text-[10px] text-gray-500">
                      Connect your post with other relevant internal pages
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.includeInterlinks}
                    onCheckedChange={checked =>
                      updateRegenField("options.includeInterlinks", checked)
                    }
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Perform Competitive Research</span>
                    <p className="text-[10px] text-gray-500">
                      Power your content with insights from top competitors
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.includeCompetitorResearch}
                    onCheckedChange={checked =>
                      updateRegenField("options.includeCompetitorResearch", checked)
                    }
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Show Outbound Links</span>
                    <p className="text-[10px] text-gray-500">
                      Cite high-authority external websites for SEO
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.addOutBoundLinks}
                    onCheckedChange={checked =>
                      updateRegenField("options.addOutBoundLinks", checked)
                    }
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Add a Quick Summary</span>
                    <p className="text-[10px] text-gray-500">
                      Add a short TL;DR summary at the top
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.isCheckedQuick}
                    onCheckedChange={checked => updateRegenField("isCheckedQuick", checked)}
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Easy to Understand</span>
                    <p className="text-[10px] text-gray-500">
                      Optimized for readability and simple comprehension
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.easyToUnderstand}
                    onCheckedChange={checked =>
                      updateRegenField("options.easyToUnderstand", checked)
                    }
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Embed YouTube Videos</span>
                    <p className="text-[10px] text-gray-500">
                      Enhance your post with relevant video content
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.embedYouTubeVideos}
                    onCheckedChange={checked =>
                      updateRegenField("options.embedYouTubeVideos", checked)
                    }
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Extended Thinking</span>
                    <p className="text-[10px] text-gray-500">
                      Deepen AI reasoning for logical outputs
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.extendedThinking}
                    onCheckedChange={checked =>
                      updateRegenField("options.extendedThinking", checked)
                    }
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Deep Research</span>
                    <p className="text-[10px] text-gray-500">
                      Extensive multi-source investigative research
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.deepResearch}
                    onCheckedChange={checked => updateRegenField("options.deepResearch", checked)}
                    size="large"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold ">Humanisation</span>
                    <p className="text-[10px] text-gray-500">
                      Natural linguistic patterns to bypass AI filters
                    </p>
                  </div>
                  <Switch
                    checked={regenForm.options.humanisation}
                    onCheckedChange={checked => updateRegenField("options.humanisation", checked)}
                    size="large"
                  />
                </div>

                {/* Automate Posting */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold ">Enable Automate Posting</span>
                      <p className="text-[10px] text-gray-500">
                        Directly publish to your WordPress or other accounts
                      </p>
                    </div>
                    <Switch
                      checked={regenForm.options.automaticPosting}
                      onCheckedChange={checked => {
                        const hasIntegrations =
                          Object.keys(integrations?.integrations || {}).length > 0
                        if (checked && !hasIntegrations) {
                          toast.error("Please connect your account in plugins.")
                          return
                        }
                        updateRegenField("options.automaticPosting", checked)
                        if (checked) {
                          const firstKey = Object.keys(integrations?.integrations || {})[0]
                          if (firstKey && !regenForm.postingDefaultType) {
                            updateRegenField("postingDefaultType", firstKey)
                          }
                        } else {
                          updateRegenField("postingDefaultType", null)
                        }
                      }}
                      size="large"
                    />
                  </div>

                  {regenForm.options.automaticPosting && (
                    <div className="mt-4 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold ">Show Table of Content</span>
                          <p className="text-[10px] text-gray-500">
                            Help users navigate with a structural outline
                          </p>
                        </div>
                        <Switch
                          checked={regenForm.options.includeTableOfContents}
                          onCheckedChange={checked =>
                            updateRegenField("options.includeTableOfContents", checked)
                          }
                          size="large"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          Choose Platform
                        </label>
                        <select
                          className="select select-bordered outline-0 w-full"
                          value={regenForm.postingDefaultType || ""}
                          onChange={e => updateRegenField("postingDefaultType", e.target.value)}
                        >
                          <option value="" disabled>
                            Select Platform
                          </option>
                          {integrations?.integrations &&
                            Object.keys(integrations.integrations).map(platform => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
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
              <button
                className="btn rounded-md transition-all"
                onClick={() => setRegenerateStep(1)}
              >
                Back
              </button>
            )}
            {regenerateStep === 1 ? (
              <button
                className="btn bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white border-none rounded-md transition-all"
                onClick={() => setRegenerateStep(2)}
              >
                Next: Enhancement Options
              </button>
            ) : (
              <button
                className="btn bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white border-none rounded-md transition-all"
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
