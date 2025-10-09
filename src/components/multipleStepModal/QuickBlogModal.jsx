import { useState, useEffect } from "react"
import { createNewQuickBlog } from "../../store/slices/blogSlice"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { packages } from "@/data/templates"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { message, Modal, Switch } from "antd"
import { Plus, X } from "lucide-react"
import { selectUser } from "@store/slices/authSlice"

const QuickBlogModal = ({ closeFnc }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [videoLinks, setVideoLinks] = useState([])
  const [otherLinks, setOtherLinks] = useState([])
  const [isOtherLinksEnabled, setIsOtherLinksEnabled] = useState(false)
  const user = useSelector(selectUser)
  const [errors, setErrors] = useState({
    template: "",
    focusKeywords: "",
    keywords: "",
    videoLinks: "",
    otherLinks: "",
  })
  const [formData, setFormData] = useState({
    template: null,
    keywords: [],
    focusKeywords: [],
    videoLinkInput: "",
    otherLinkInput: "",
    focusKeywordInput: "",
    keywordInput: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  // Sync selected template when modal opens
  useEffect(() => {
    if (formData.template) {
      const index = packages.findIndex((pkg) => pkg.name === formData.template)
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
        setErrors((prev) => ({ ...prev, template: "Please select a template." }))
        return
      }
      setErrors((prev) => ({ ...prev, template: "" }))
      setCurrentStep(1)
    }
  }

  // Handle navigation to the previous step
  const handlePrev = () => {
    setCurrentStep(0)
  }

  // Handle modal close
  const handleClose = () => {
    setSelectedPackage(null)
    setFormData({
      template: null,
      keywords: [],
      focusKeywords: [],
      videoLinkInput: "",
      otherLinkInput: "",
      focusKeywordInput: "",
      keywordInput: "",
    })
    setVideoLinks([])
    setOtherLinks([])
    setIsOtherLinksEnabled(false)
    setErrors({
      template: "",
      focusKeywords: "",
      keywords: "",
      videoLinks: "",
      otherLinks: "",
    })
    closeFnc()
  }

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = {
      focusKeywords:
        formData.focusKeywords.length === 0 ? "Please add at least one focus keyword." : "",
      keywords: formData.keywords.length === 0 ? "Please add at least one secondary keyword." : "",
      videoLinks:
        videoLinks.length === 0 ? "Please add at least one valid YouTube video link." : "",
      otherLinks:
        isOtherLinksEnabled && otherLinks.length === 0
          ? "Please add at least one valid other link."
          : "",
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      message.error("Please fill all required fields correctly.")
      return
    }

    // Additional validation for link limits
    if (videoLinks.length > 3) {
      setErrors((prev) => ({ ...prev, videoLinks: "You can only add up to 3 video links." }))
      message.error("You can only add up to 3 video links.")
      return
    }
    if (otherLinks.length > 3) {
      setErrors((prev) => ({ ...prev, otherLinks: "You can only add up to 3 other links." }))
      message.error("You can only add up to 3 other links.")
      return
    }

    const finalData = {
      ...formData,
      videoLinks: [...videoLinks, ...otherLinks],
    }

    handlePopup({
      title: "Quick Blog Generation",
      description: (
        <>
          <span>
            Quick blog generation costs <b>{getEstimatedCost("blog.quick")} credits</b>.
          </span>
          <br />
          <span>Are you sure you want to proceed?</span>
        </>
      ),
      onConfirm: () => {
        dispatch(createNewQuickBlog({ blogData: finalData, user, navigate }))
        handleClose()
      },
    })
  }

  // Handle template selection
  const handlePackageSelect = (index) => {
    setSelectedPackage(index)
    setFormData((prev) => ({
      ...prev,
      template: packages[index].name,
    }))
    setErrors((prev) => ({ ...prev, template: "" }))
  }

  // Handle keyword input changes
  const handleKeywordInputChange = (e, type) => {
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value,
    }))
    setErrors((prev) => ({ ...prev, [type]: "" }))
  }

  // Add keywords to the form data
  const handleAddKeyword = (type) => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors((prev) => ({ ...prev, [type]: "Please enter a keyword." }))
      message.error("Please enter a keyword.")
      return
    }

    const existingSet = new Set(formData[type].map((k) => k.trim().toLowerCase()))
    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "" && !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Please enter valid, non-duplicate keywords separated by commas.",
      }))
      message.error("Please enter valid, non-duplicate keywords separated by commas.")
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      setErrors((prev) => ({ ...prev, [type]: "You can only add up to 3 focus keywords." }))
      message.error("You can only add up to 3 focus keywords.")
      return
    }

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [inputKey]: "",
    }))
    setErrors((prev) => ({ ...prev, [type]: "" }))
  }

  // Remove a keyword
  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
    setErrors((prev) => ({ ...prev, [type]: "" }))
  }

  // Handle Enter key for keywords
  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  // Validate YouTube URL and extract video ID
  const validateYouTubeUrl = (url) => {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
        return { valid: false, error: "Please enter a valid YouTube URL." }
      }

      let videoId = ""
      if (hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v") || ""
      } else if (hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.split("/")[1] || ""
      }

      // YouTube video IDs are 11 characters long, alphanumeric with some special characters
      const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
      if (!videoId || !videoIdRegex.test(videoId)) {
        return { valid: false, error: "Please enter a YouTube URL." }
      }

      return { valid: true, videoId }
    } catch {
      return { valid: false, error: "Invalid YouTube URL format." }
    }
  }

  // Validate general URL for other links
  const validateUrl = (url) => {
    try {
      new URL(url)
      return { valid: true }
    } catch {
      return { valid: false, error: "Please enter a valid URL (e.g., https://example.com)." }
    }
  }

  // Add links (video or other)
  const handleAddLink = (type) => {
    const isVideo = type === "video"
    const inputKey = isVideo ? "videoLinkInput" : "otherLinkInput"
    const errorKey = isVideo ? "videoLinks" : "otherLinks"
    const input = formData[inputKey]?.trim()
    const existingLinks = isVideo ? videoLinks : otherLinks
    const setLinks = isVideo ? setVideoLinks : setOtherLinks
    const maxLinks = 3

    if (!input) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: `Please enter at least one ${isVideo ? "YouTube video" : "valid"} link.`,
      }))
      message.error(`Please enter at least one ${isVideo ? "YouTube video" : "valid"} link.`)
      return
    }

    const newLinks = input
      .split(",")
      .map((link) => link.trim())
      .filter((link) => link !== "")

    const validNewLinks = []

    for (let link of newLinks) {
      if (existingLinks.includes(link) || validNewLinks.includes(link)) {
        continue // Skip duplicates
      }

      const validation = isVideo ? validateYouTubeUrl(link) : validateUrl(link)
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, [errorKey]: validation.error }))
        message.error(validation.error)
        return
      }

      validNewLinks.push(link)
    }

    if (validNewLinks.length === 0) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: `No valid, unique ${isVideo ? "YouTube video" : "other"} links found.`,
      }))
      message.error(`No valid, unique ${isVideo ? "YouTube video" : "other"} links found.`)
      return
    }

    if (existingLinks.length + validNewLinks.length > maxLinks) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: `You can only add up to ${maxLinks} ${isVideo ? "video" : "other"} links.`,
      }))
      message.error(`You can only add up to ${maxLinks} ${isVideo ? "video" : "other"} links.`)
      return
    }

    setLinks([...existingLinks, ...validNewLinks])
    setFormData((prev) => ({
      ...prev,
      [inputKey]: "",
    }))
    setErrors((prev) => ({ ...prev, [errorKey]: "" }))
  }

  // Handle Enter key for links
  const handleKeyDown = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddLink(type)
    }
  }

  // Remove a link
  const handleRemoveLink = (index, type) => {
    const isVideo = type === "video"
    const existingLinks = isVideo ? videoLinks : otherLinks
    const setLinks = isVideo ? setVideoLinks : setOtherLinks
    const updatedLinks = [...existingLinks]
    updatedLinks.splice(index, 1)
    setLinks(updatedLinks)
    setErrors((prev) => ({ ...prev, [isVideo ? "videoLinks" : "otherLinks"]: "" }))
  }

  return (
    <Modal
      title="Generate Quick Blog"
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
                onClick={handlePrev}
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
                  onKeyDown={(e) => e.key === "Enter" && handlePackageSelect(index)}
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
                    onKeyDown={(e) => e.key === "Enter" && handlePackageSelect(index)}
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
                Focus Keywords <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.focusKeywordInput}
                  onChange={(e) => handleKeywordInputChange(e, "focusKeywords")}
                  onKeyDown={(e) => handleKeyPress(e, "focusKeywords")}
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
                  onChange={(e) => handleKeywordInputChange(e, "keywords")}
                  onKeyDown={(e) => handleKeyPress(e, "keywords")}
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
              {errors.keywords && <p className="text-red-500 text-sm mt-1">{errors.keywords}</p>}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Links (e.g., YouTube) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.videoLinkInput}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, videoLinkInput: e.target.value }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, "video")}
                  className={`flex-1 px-3 py-2 border ${
                    errors.videoLinks ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm bg-gray-50`}
                  placeholder="Enter YouTube video links, separated by commas"
                  aria-label="Video links"
                />
                <button
                  onClick={() => handleAddLink("video")}
                  className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                  aria-label="Add video links"
                >
                  <Plus size={16} />
                </button>
              </div>
              {errors.videoLinks && (
                <p className="text-red-500 text-sm mt-1">{errors.videoLinks}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {videoLinks.map((link, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {link}
                    <button
                      onClick={() => handleRemoveLink(index, "video")}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                      aria-label={`Remove ${link}`}
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Other Links (e.g., articles, websites)
                  {isOtherLinksEnabled && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isOtherLinksEnabled}
                    onChange={(checked) => {
                      setIsOtherLinksEnabled(checked)
                      if (!checked) {
                        setOtherLinks([])
                        setFormData((prev) => ({ ...prev, otherLinkInput: "" }))
                        setErrors((prev) => ({ ...prev, otherLinks: "" }))
                      }
                    }}
                    aria-label="Toggle other links input"
                  />
                </div>
              </div>
              {isOtherLinksEnabled && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.otherLinkInput}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, otherLinkInput: e.target.value }))
                      }
                      onKeyDown={(e) => handleKeyDown(e, "other")}
                      className={`flex-1 px-3 py-2 border ${
                        errors.otherLinks ? "border-red-500" : "border-gray-200"
                      } rounded-md text-sm bg-gray-50`}
                      placeholder="Enter full URLs (e.g., https://example.com), separated by commas"
                      aria-label="Other links"
                    />
                    <button
                      onClick={() => handleAddLink("other")}
                      className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center hover:bg-[#1B6FC9]/90 transition-colors"
                      aria-label="Add other links"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.otherLinks && (
                    <p className="text-red-500 text-sm mt-1">{errors.otherLinks}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {otherLinks.map((link, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {link}
                        <button
                          onClick={() => handleRemoveLink(index, "other")}
                          className="ml-1 text-blue-400 hover:text-blue-600"
                          aria-label={`Remove ${link}`}
                        >
                          <X size={16} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default QuickBlogModal
