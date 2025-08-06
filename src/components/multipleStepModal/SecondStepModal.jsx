import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchBrands } from "@store/slices/brandSlice"
import { message, Modal, Tooltip } from "antd"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { Crown, Plus, TriangleAlert, X } from "lucide-react"

const SecondStepModal = ({
  handlePrevious,
  handleClose,
  data,
  setData,
  handleSubmit,
  navigate,
}) => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { brands, loading: loadingBrands, error: brandError } = useSelector((state) => state.brand)
  const userPlan = user?.subscription?.plan || user?.plan || "free"

  // Check if AI image usage limit is reached
  const isAiImagesLimitReached = user?.usage?.aiImages >= user?.usageLimits?.aiImages

  const [formData, setFormData] = useState({
    isCheckedQuick: data.isCheckedQuick || false,
    isCheckedBrand: data.isCheckedBrand || false,
    aiModel: data.aiModel || "gemini",
    brandId: data.brandId || null,
    isFAQEnabled: data.isFAQEnabled || false,
    imageSource: data.imageSource || "unsplash",
    isCheckedGeneratedImages: data.isCheckedGeneratedImages || false,
    referenceLinks: data.referenceLinks || [],
    includeInterlinks: data.includeInterlinks || false,
    addOutBoundLinks: data.addOutBoundLinks || false,
    addCTA: data.addCTA || true,
  })
  const [localFormData, setLocalFormData] = useState({
    newLink: "",
  })

  // Reset isCheckedGeneratedImages if AI image limit is reached
  useEffect(() => {
    if (isAiImagesLimitReached && formData.isCheckedGeneratedImages) {
      setFormData((prev) => ({
        ...prev,
        isCheckedGeneratedImages: false,
        imageSource: "unsplash", // Default to unsplash when AI images are disabled
      }))
      setData((prev) => ({
        ...prev,
        isCheckedGeneratedImages: false,
        imageSource: "unsplash",
      }))
    }
  }, [isAiImagesLimitReached, formData.isCheckedGeneratedImages, setData])

  useEffect(() => {
    if (formData.isCheckedBrand) {
      dispatch(fetchBrands())
    }
  }, [formData.isCheckedBrand, dispatch])

  const handleAddLink = () => {
    const input = localFormData.newLink.trim()
    if (!input) return

    const existing = formData.referenceLinks.map((link) => link.toLowerCase().trim())

    const isValidURL = (url) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    const seen = new Set()
    const newLinks = input
      .split(",")
      .map((link) => link.trim())
      .filter((link) => {
        const lower = link.toLowerCase()
        return !seen.has(lower) && isValidURL(link) && !existing.includes(lower) && seen.add(lower)
      })

    if (newLinks.length === 0) {
      message.error("Please enter valid, non-duplicate URLs separated by commas.")
      return
    }

    setFormData((prev) => ({
      ...prev,
      referenceLinks: [...prev.referenceLinks, ...newLinks],
    }))
    setLocalFormData((prev) => ({ ...prev, newLink: "" }))
    message.success("Reference link added!")
  }

  const handleRemoveLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }))
  }

  const handleNextStep = () => {
    const updatedData = {
      ...data,
      ...formData,
    }
    handleSubmit(updatedData)
  }

  const handleImageSourceChange = (source) => {
    // if (source === "ai" && userPlan === "free") {
    //   openUpgradePopup({ featureName: "AI-Generated Images", navigate })
    //   return
    // }
    setFormData((prev) => ({
      ...prev,
      imageSource: source,
      isCheckedGeneratedImages: source === "ai",
    }))
    setData((prev) => ({
      ...prev,
      imageSource: source,
      isCheckedGeneratedImages: source === "ai",
      isUnsplashActive: source === "unsplash",
    }))
  }

  return (
    <Modal
      title="Final Step: Content Enhancements"
      open={true}
      onCancel={handleClose}
      footer={[
        <button
          key="previous"
          onClick={handlePrevious}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Previous
        </button>,
        <button
          key="next"
          onClick={handleNextStep}
          className="px-6 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-md ml-3"
        >
          Submit
        </button>,
      ]}
      width={800}
      centered
      transitionName=""
      maskTransitionName=""
    >
      <div className="p-4">
        <div className="space-y-6">
          {/* AI Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select AI Model
            </label>
            <div className="flex gap-6 flex-wrap">
              {[
                {
                  id: "gemini",
                  label: "Gemini",
                  logo: "/Images/gemini.png",
                  restricted: false,
                },
                {
                  id: "chatgpt",
                  label: "ChatGPT",
                  logo: "/Images/chatgpt.png",
                  // restricted: userPlan === "free",
                },
                {
                  id: "claude",
                  label: "Claude",
                  logo: "/Images/claude.png",
                  // restricted: userPlan === "free" || userPlan === "basic",
                },
              ].map((model) => (
                <label
                  key={model.id}
                  htmlFor={model.id}
                  className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                    formData.aiModel === model.id ? "border-blue-600 bg-blue-50" : "border-gray-300"
                  } hover:shadow-sm w-full max-w-[200px]`}
                  onClick={(e) => {
                    if (model.restricted) {
                      e.preventDefault()
                      openUpgradePopup({ featureName: model.label, navigate })
                    }
                  }}
                >
                  <input
                    type="radio"
                    id={model.id}
                    name="aiModel"
                    value={model.id}
                    checked={formData.aiModel === model.id}
                    onChange={(e) => {
                      if (!model.restricted) {
                        setFormData((prev) => ({ ...prev, aiModel: e.target.value }))
                        setData((prev) => ({ ...prev, aiModel: e.target.value }))
                      }
                    }}
                    className="hidden"
                  />
                  <img src={model.logo} alt={model.label} className="w-6 h-6 object-contain" />
                  <span className="text-sm font-medium text-gray-800">{model.label}</span>
                  {model.restricted && (
                    <Crown className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Toggle for Adding Image */}
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Add Image</label>
            <div className="flex items-center">
              <label
                htmlFor="add-image-toggle"
                className={`relative inline-block w-12 h-6 ${
                  isAiImagesLimitReached ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  id="add-image-toggle"
                  className="sr-only peer"
                  checked={formData.isCheckedGeneratedImages}
                  disabled={isAiImagesLimitReached}
                  onChange={(e) => {
                    if (isAiImagesLimitReached) {
                      openUpgradePopup({ featureName: "AI-Generated Images", navigate })
                      return
                    }
                    const checked = e.target.checked
                    setFormData((prev) => ({
                      ...prev,
                      isCheckedGeneratedImages: checked,
                      imageSource: checked ? prev.imageSource : "unsplash",
                    }))
                    setData((prev) => ({
                      ...prev,
                      isCheckedGeneratedImages: checked,
                      imageSource: checked ? prev.imageSource : "unsplash",
                      isUnsplashActive: !checked ? true : prev.isUnsplashActive,
                    }))
                  }}
                />
                <div
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${
                    formData.isCheckedGeneratedImages && !isAiImagesLimitReached
                      ? "bg-[#1B6FC9]"
                      : "bg-gray-300"
                  }`}
                />
                <div
                  className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-transform duration-300 ${
                    formData.isCheckedGeneratedImages && !isAiImagesLimitReached
                      ? "translate-x-6"
                      : ""
                  }`}
                />
              </label>
              {isAiImagesLimitReached && (
                <Tooltip
                  title="You've reached your AI image generation limit. It'll reset in the next billing cycle."
                  overlayInnerStyle={{
                    backgroundColor: "#FEF9C3", // light yellow
                    border: "1px solid #FACC15", // yellow-400 border
                    color: "#78350F", // dark yellow text
                  }}
                >
                  <TriangleAlert className="text-yellow-400 ml-4" size={15} />
                </Tooltip>
              )}
            </div>
          </div>

          {/* Image Source Selection - Only show if toggle is ON and limit not reached */}
          {formData.isCheckedGeneratedImages && !isAiImagesLimitReached && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Image Source</label>
              <div className="flex gap-6 flex-wrap">
                <label
                  htmlFor="unsplash"
                  className={`border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150 ${
                    formData.imageSource === "unsplash"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300"
                  } hover:shadow-sm w-full max-w-[200px]`}
                >
                  <input
                    type="radio"
                    id="unsplash"
                    name="imageSource"
                    checked={formData.imageSource === "unsplash"}
                    onChange={() => handleImageSourceChange("unsplash")}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-gray-800">Stock Images</span>
                </label>
                <label
                  htmlFor="ai-generated"
                  // className={`border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150 ${
                  //   formData.imageSource === "ai" ? "border-blue-600 bg-blue-50" : "border-gray-300"
                  // } hover:shadow-sm w-full max-w-[200px] relative`}
                  className={`border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150
          ${formData.imageSource === "ai" ? "border-blue-600 bg-blue-50" : "border-gray-300"}
          hover:shadow-sm w-full max-w-[220px] relative

        `}
                  onClick={(e) => {
                    if (userPlan === "free") {
                      e.preventDefault()
                      openUpgradePopup({ featureName: "AI-Generated Images", navigate })
                    }
                  }}
                >
                  <input
                    type="radio"
                    id="ai-generated"
                    name="imageSource"
                    checked={formData.imageSource === "ai"}
                    onChange={() => handleImageSourceChange("ai")}
                    className="hidden"
                    disabled={userPlan === "free" || isAiImagesLimitReached}
                  />
                  <span className="text-sm font-medium text-gray-800">AI-Generated Images</span>
                  {userPlan === "free" && (
                    <Crown className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Quick Summary Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Add a Quick Summary</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCheckedQuick}
                onChange={() => {
                  setFormData((prev) => ({
                    ...prev,
                    isCheckedQuick: !prev.isCheckedQuick,
                  }))
                  setData((prev) => ({
                    ...prev,
                    isCheckedQuick: !prev.isCheckedQuick,
                  }))
                }}
                className="sr-only peer"
                aria-checked={formData.isCheckedQuick}
              />
              <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
            </label>
          </div>

          {/* Brand Voice Section */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Write with Brand Voice</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCheckedBrand}
                  onChange={() => {
                    setFormData((prev) => ({
                      ...prev,
                      isCheckedBrand: !prev.isCheckedBrand,
                      brandId: !prev.isCheckedBrand ? prev.brandId : null,
                    }))
                    setData((prev) => ({
                      ...prev,
                      isCheckedBrand: !prev.isCheckedBrand,
                      brandId: !prev.isCheckedBrand ? prev.brandId : null,
                    }))
                  }}
                  className="sr-only peer"
                  aria-checked={formData.isCheckedBrand}
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
              </label>
            </div>
            {formData.isCheckedBrand && (
              <div className="mt-3 p-4 rounded-md border border-gray-200 bg-gray-50">
                {loadingBrands ? (
                  <div className="text-gray-500 text-sm">Loading brand voices...</div>
                ) : brandError ? (
                  <div className="text-red-500 text-sm font-medium">{brandError}</div>
                ) : brands?.length > 0 ? (
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
                            onChange={() => {
                              setFormData((prev) => ({
                                ...prev,
                                brandId: voice._id,
                              }))
                              setData((prev) => ({
                                ...prev,
                                brandId: voice._id,
                              }))
                            }}
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
                    No brand voices available. Create one to get started.
                  </div>
                )}
              </div>
            )}

            {formData.isCheckedBrand && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium text-gray-700">Add CTA at the End</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.addCTA}
                    onChange={() => {
                      setNewJob((prev) => ({
                        ...prev,
                        blogs: {
                          ...prev.blogs,
                          addCTA: !prev.formData.addCTA,
                        },
                      }))
                    }}
                    className="sr-only peer"
                    aria-checked={formData.addCTA}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Add FAQ Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Add FAQ</p>
                <p className="text-xs font-medium text-gray-500">
                  Generate frequently asked questions for your blog.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFAQEnabled}
                  onChange={() => {
                    setFormData((prev) => ({
                      ...prev,
                      isFAQEnabled: !prev.isFAQEnabled,
                    }))
                    setData((prev) => ({
                      ...prev,
                      isFAQEnabled: !prev.isFAQEnabled,
                    }))
                  }}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
              </label>
            </div>

            {/* Interlinks Toggle */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700">
                Include Interlinks
                <p className="text-xs text-gray-500">
                  Auto-link to other blogs within your content.
                </p>
              </span>
              <label className="relative inline-flex items-center cursor-pointer self-end">
                <input
                  type="checkbox"
                  checked={formData.includeInterlinks}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      includeInterlinks: e.target.checked,
                    }))
                    setData((prev) => ({
                      ...prev,
                      includeInterlinks: e.target.checked,
                    }))
                  }}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
              </label>
            </div>

            {/* Competitive Research */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700">
                Add Competitive Research
                <p className="text-xs text-gray-500">
                  Analyze similar blogs to find strategic insights.
                </p>
              </span>
              <label className="relative inline-flex items-center cursor-pointer self-end">
                <input
                  type="checkbox"
                  checked={formData.isCompetitiveResearchEnabled}
                  onChange={() => {
                    setFormData((prev) => ({
                      ...prev,
                      isCompetitiveResearchEnabled: !prev.isCompetitiveResearchEnabled,
                    }))
                    setData((prev) => ({
                      ...prev,
                      isCompetitiveResearchEnabled: !prev.isCompetitiveResearchEnabled,
                    }))
                  }}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
              </label>
            </div>

            {/* Outbound Links (Only if Competitive Research is enabled) */}
            {formData.isCompetitiveResearchEnabled && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Show Outbound Links
                  <p className="text-xs text-gray-500">
                    Display reference links from competitor analysis.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer self-end">
                  <input
                    type="checkbox"
                    checked={formData.addOutBoundLinks}
                    onChange={() => {
                      setFormData((prev) => ({
                        ...prev,
                        addOutBoundLinks: !prev.addOutBoundLinks,
                      }))
                      setData((prev) => ({
                        ...prev,
                        addOutBoundLinks: !prev.addOutBoundLinks,
                      }))
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
                </label>
              </div>
            )}
          </div>

          {/* Reference Links Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Reference Links (Helps make blog more compelling)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddLink()
                  }
                }}
                value={localFormData.newLink}
                onChange={(e) =>
                  setLocalFormData((prev) => ({
                    ...prev,
                    newLink: e.target.value,
                  }))
                }
              />
              <button
                onClick={handleAddLink}
                className="px-3 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.referenceLinks.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.referenceLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 truncate"
                    >
                      {link}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default SecondStepModal
