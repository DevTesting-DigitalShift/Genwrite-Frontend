import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { createNewQuickBlog } from "../../store/slices/blogSlice"
import { selectUser } from "@store/slices/authSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { message, Modal } from "antd"
import { Plus, X } from "lucide-react"
import Carousel from "./Carousel"
import { packages } from "@/data/templates"

const YoutubeBlogModal = ({ closeFnc }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [ytLinks, setYtLinks] = useState([])
  const [formData, setFormData] = useState({
    topic: "",
    performKeywordResearch: true,
    imageSource: "unsplash",
    template: null,
    keywords: [],
    focusKeywords: [],
    ytLinkInput: "",
    focusKeywordInput: "",
    keywordInput: "",
  })
  const [errors, setErrors] = useState({
    topic: "",
    template: "",
    focusKeywords: "",
    keywords: "",
    ytLinks: "",
    imageSource: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(selectUser)

  // Sync selected template when modal opens
  useEffect(() => {
    if (formData.template) {
      const index = packages.findIndex(pkg => pkg.name === formData.template)
      if (index !== -1) {
        setSelectedPackage(index)
      }
    } else {
      setSelectedPackage(null)
    }
  }, [formData.template])

  // Handle navigation to the next step
  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.template) {
        setErrors(prev => ({ ...prev, template: "Please select a template." }))
        return
      }
      setErrors(prev => ({ ...prev, template: "" }))
      setCurrentStep(1)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setSelectedPackage(null)
    setFormData({
      topic: "",
      performKeywordResearch: true,
      imageSource: "unsplash",
      template: null,
      keywords: [],
      focusKeywords: [],
      ytLinkInput: "",
      focusKeywordInput: "",
      keywordInput: "",
    })
    setYtLinks([])
    setErrors({
      topic: "",
      template: "",
      focusKeywords: "",
      keywords: "",
      ytLinks: "",
      imageSource: "",
    })
    closeFnc()
  }

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = {
      topic: !formData.topic.trim() ? "Please enter a topic." : "",
      focusKeywords:
        formData.performKeywordResearch && formData.focusKeywords.length === 0
          ? "Please add at least one focus keyword."
          : "",
      keywords:
        formData.performKeywordResearch && formData.keywords.length === 0
          ? "Please add at least one secondary keyword."
          : "",
      ytLinks: ytLinks.length === 0 ? "Please add at least one valid YouTube link." : "",
      imageSource: !formData.imageSource ? "Please select an image source." : "",
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some(error => error)) {
      message.error("Please fill all required fields correctly.")
      return
    }

    if (ytLinks.length > 3) {
      setErrors(prev => ({ ...prev, ytLinks: "You can only add up to 3 YouTube links." }))
      return
    }

    const finalData = {
      ...formData,
      ytLinks,
    }

    handlePopup({
      title: "YouTube Blog Generation",
      description: (
        <>
          <span>
            YouTube blog generation costs <b>{getEstimatedCost("blog.quick")} credits</b>.
          </span>
          <br />
          <span>Are you sure you want to proceed?</span>
        </>
      ),
      onConfirm: () => {
        dispatch(createNewQuickBlog({ blogData: finalData, user, navigate, type: "yt" }))
        handleClose()
      },
    })
  }

  // Handle template selection
  const handlePackageSelect = index => {
    setSelectedPackage(index)
    setFormData(prev => ({
      ...prev,
      template: packages[index].name,
    }))
    setErrors(prev => ({ ...prev, template: "" }))
  }

  // Handle input changes
  const handleInputChange = (e, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))
    setErrors(prev => ({ ...prev, [field]: "" }))
  }

  // Handle keyword input changes
  const handleKeywordInputChange = (e, type) => {
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setFormData(prev => ({
      ...prev,
      [key]: e.target.value,
    }))
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Add keywords to the form data
  const handleAddKeyword = type => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors(prev => ({ ...prev, [type]: "Please enter a keyword." }))
      return
    }

    const existingSet = new Set(formData[type].map(k => k.trim().toLowerCase()))
    const newKeywords = inputValue
      .split(",")
      .map(k => k.trim())
      .filter(k => k !== "" && !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors(prev => ({
        ...prev,
        [type]: "Please enter valid, non-duplicate keywords separated by commas.",
      }))
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      setErrors(prev => ({ ...prev, [type]: "You can only add up to 3 focus keywords." }))
      message.error("You can only add up to 3 focus keywords.")
      return
    }

    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [inputKey]: "",
    }))
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Remove a keyword
  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
    setErrors(prev => ({ ...prev, [type]: "" }))
  }

  // Handle Enter key for keywords
  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  // Extract YouTube video ID from URL
  const getVideoId = url => {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase().replace("www.", "")

      if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
        return null
      }

      let videoId = null

      if (hostname === "youtube.com" || hostname === "m.youtube.com") {
        const pathname = parsed.pathname
        if (pathname.startsWith("/watch")) {
          videoId = parsed.searchParams.get("v")
        } else if (pathname.startsWith("/embed/")) {
          videoId = pathname.split("/embed/")[1].split("/")[0].split("?")[0]
        } else if (pathname.startsWith("/v/")) {
          videoId = pathname.split("/v/")[1].split("/")[0].split("?")[0]
        } else if (pathname.startsWith("/shorts/")) {
          videoId = pathname.split("/shorts/")[1].split("/")[0].split("?")[0]
        }
      } else if (hostname === "youtu.be") {
        videoId = parsed.pathname.slice(1).split("/")[0].split("?")[0]
      }

      return videoId
    } catch {
      return null
    }
  }

  // Validate URL for YouTube links
  const validateUrl = url => {
    const videoId = getVideoId(url)
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/

    if (!videoId || !videoIdRegex.test(videoId)) {
      return {
        valid: false,
        error: "Please enter a valid YouTube video link with a proper video ID.",
      }
    }

    return { valid: true }
  }

  // Add YouTube links
  const handleAddLink = () => {
    const input = formData.ytLinkInput?.trim()
    const maxLinks = 3

    if (!input) {
      setErrors(prev => ({
        ...prev,
        ytLinks: "Please enter at least one valid YouTube link.",
      }))
      return
    }

    const newLinks = input
      .split(",")
      .map(link => link.trim())
      .filter(link => link !== "")

    const validNewLinks = []

    for (let link of newLinks) {
      if (ytLinks.includes(link) || validNewLinks.includes(link)) {
        continue
      }

      const validation = validateUrl(link)
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, ytLinks: validation.error }))
        message.error(validation.error)
        return
      }

      validNewLinks.push(link)
    }

    if (validNewLinks.length === 0) {
      setErrors(prev => ({
        ...prev,
        ytLinks: "No valid, unique YouTube links found.",
      }))
      return
    }

    if (ytLinks.length + validNewLinks.length > maxLinks) {
      setErrors(prev => ({
        ...prev,
        ytLinks: `You can only add up to ${maxLinks} YouTube links.`,
      }))
      return
    }

    setYtLinks([...ytLinks, ...validNewLinks])
    setFormData(prev => ({
      ...prev,
      ytLinkInput: "",
    }))
    setErrors(prev => ({ ...prev, ytLinks: "" }))
  }

  // Handle Enter key for links
  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddLink()
    }
  }

  // Remove a YouTube link
  const handleRemoveLink = index => {
    const updatedLinks = [...ytLinks]
    updatedLinks.splice(index, 1)
    setYtLinks(updatedLinks)
    setErrors(prev => ({ ...prev, ytLinks: "" }))
  }

  // Handle image source selection
  const handleImageSourceChange = source => {
    setFormData(prev => ({
      ...prev,
      imageSource: source,
    }))
    setErrors(prev => ({ ...prev, imageSource: "" }))
  }

  const imageSources = [
    { id: "unsplash", label: "Stock Images", value: "unsplash" },
    { id: "ai-generated", label: "AI-Generated Images", value: "ai-generated" },
  ]

  return (
    <Modal
      title="Generate YouTube Blog"
      open={true}
      onCancel={handleClose}
      footer={
        currentStep === 0
          ? [
              <button
                key="next"
                onClick={handleNext}
                className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors"
                aria-label="Next step"
              >
                Next
              </button>,
            ]
          : [
              <button
                key="previous"
                onClick={() => setCurrentStep(0)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                aria-label="Previous step"
              >
                Previous
              </button>,
              <button
                key="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 transition-colors ml-3"
                aria-label="Submit quick blog"
              >
                Submit
              </button>,
            ]
      }
      width={800}
      centered
      transitionName=""
      maskTransitionName=""
    >
      <div className="p-2 md:p-4 lg:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {currentStep === 0 && (
          <div>
            {/* Mobile View: Vertical Scrolling Layout */}
            <div
              className={`sm:hidden grid grid-cols-2 gap-4 ${
                errors.template ? "border-2 border-red-500 rounded-lg p-2" : ""
              }`}
            >
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all duration-200 w-full ${
                    formData.template === pkg.name ? "border-gray-200 border-2 rounded-md" : ""
                  }`}
                  onClick={() => handlePackageSelect(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && handlePackageSelect(index)}
                  aria-label={`Select ${pkg.name} template`}
                >
                  <div className="bg-white rounded-md overflow-hidden shadow-sm">
                    <div className="relative">
                      <img
                        src={pkg.imgSrc || "/placeholder.svg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Carousel Layout */}
            <div
              className={`hidden sm:block ${
                errors.template ? "border-2 border-red-500 rounded-lg p-2" : ""
              }`}
            >
              <Carousel className="flex flex-row gap-4">
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all duration-200 w-full ${
                      formData.template === pkg.name ? "border-gray-200 border-2 rounded-md" : ""
                    }`}
                    onClick={() => handlePackageSelect(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && handlePackageSelect(index)}
                    aria-label={`Select ${pkg.name} template`}
                  >
                    <div className="bg-white rounded-md overflow-hidden shadow-sm">
                      <div className="relative">
                        <img
                          src={pkg.imgSrc || "/placeholder.svg"}
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
              {errors.template && <p className="text-red-500 text-sm mt-2">{errors.template}</p>}
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={e => handleInputChange(e, "topic")}
                className={`w-full px-3 py-2 border ${
                  errors.topic ? "border-red-500" : "border-gray-200"
                } rounded-md text-sm bg-gray-50`}
                placeholder="Enter the blog topic"
                aria-label="Blog topic"
              />
              {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Perform Keyword Research
              </label>
              <label className="relative inline-block w-11 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.performKeywordResearch}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      performKeywordResearch: e.target.checked,
                      focusKeywords: e.target.checked ? prev.focusKeywords : [],
                      keywords: e.target.checked ? prev.keywords : [],
                      focusKeywordInput: "",
                      keywordInput: "",
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="absolute inset-0 bg-gray-200 rounded-full transition-colors duration-200 peer-checked:bg-[#1B6FC9]"></div>
                <div className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full border border-gray-300 transition-transform duration-200 peer-checked:translate-x-5"></div>
              </label>
            </div>
            {formData.performKeywordResearch && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Keywords <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.focusKeywordInput}
                      onChange={e => handleKeywordInputChange(e, "focusKeywords")}
                      onKeyDown={e => handleKeyPress(e, "focusKeywords")}
                      className={`flex-1 px-3 py-2 border ${
                        errors.focusKeywords ? "border-red-500" : "border-gray-200"
                      } rounded-md text-sm bg-gray-50`}
                      placeholder="Enter focus keywords, separated by commas"
                      aria-label="Focus keywords"
                    />
                    <button
                      onClick={() => handleAddKeyword("focusKeywords")}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                      aria-label="Add focus keywords"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.focusKeywords && (
                    <p className="text-red-500 text-sm mt-1">{errors.focusKeywords}</p>
                  )}
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
                          aria-label={`Remove ${keyword}`}
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.keywordInput}
                      onChange={e => handleKeywordInputChange(e, "keywords")}
                      onKeyDown={e => handleKeyPress(e, "keywords")}
                      className={`flex-1 px-3 py-2 border ${
                        errors.keywords ? "border-red-500" : "border-gray-200"
                      } rounded-md text-sm bg-gray-50`}
                      placeholder="Enter secondary keywords, separated by commas"
                      aria-label="Secondary keywords"
                    />
                    <button
                      onClick={() => handleAddKeyword("keywords")}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                      aria-label="Add secondary keywords"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.keywords && (
                    <p className="text-red-500 text-sm mt-1">{errors.keywords}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(index, "keywords")}
                          className="ml-1 text-blue-400 hover:text-blue-600"
                          aria-label={`Remove ${keyword}`}
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Source <span className="text-red-500">*</span>
              </label>
              <div
                className={`grid grid-cols-2 gap-4 mx-auto w-full ${
                  errors.imageSource ? "border-2 border-red-500 rounded-lg p-2" : ""
                }`}
              >
                {imageSources.map(source => (
                  <label
                    key={source.id}
                    htmlFor={source.id}
                    className={`relative border rounded-lg px-4 py-3 flex items-center gap-3 justify-center cursor-pointer transition-all duration-150
                      ${
                        formData.imageSource === source.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300"
                      } hover:shadow-sm w-full`}
                  >
                    <input
                      type="radio"
                      id={source.id}
                      name="imageSource"
                      value={source.value}
                      checked={formData.imageSource === source.value}
                      onChange={() => handleImageSourceChange(source.value)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium text-gray-800">{source.label}</span>
                  </label>
                ))}
              </div>
              {errors.imageSource && (
                <p className="text-red-500 text-sm mt-1">{errors.imageSource}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add YouTube Link <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.ytLinkInput}
                    onChange={e => setFormData(prev => ({ ...prev, ytLinkInput: e.target.value }))}
                    onKeyDown={e => handleKeyDown(e)}
                    className={`flex-1 px-3 py-2 border ${
                      errors.ytLinks ? "border-red-500" : "border-gray-200"
                    } rounded-md text-sm bg-gray-50`}
                    placeholder="Enter full YouTube URLs, separated by commas"
                    aria-label="YouTube links"
                  />
                  <button
                    onClick={() => handleAddLink()}
                    className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                    aria-label="Add YouTube links"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.ytLinks && <p className="text-red-500 text-sm mt-1">{errors.ytLinks}</p>}
                <div className="flex flex-wrap gap-2">
                  {ytLinks.map((link, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {link}
                      <button
                        onClick={() => handleRemoveLink(index)}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                        aria-label={`Remove ${link}`}
                      >
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default YoutubeBlogModal
