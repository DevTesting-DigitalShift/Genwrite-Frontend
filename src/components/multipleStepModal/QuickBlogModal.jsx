import { useState } from "react"
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
  const [videoLinks, setVideoLinks] = useState([]) // Store video links
  const [otherLinks, setOtherLinks] = useState([]) // Store other links
  const [isOtherLinksEnabled, setIsOtherLinksEnabled] = useState(false) // Toggle for other links
  const user = useSelector(selectUser)
  const [errors, setErrors] = useState({
    template: false,
    focusKeywords: false,
    keywords: false,
    videoLinks: false,
    otherLinks: false,
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

  // Handle navigation to the next step
  const handleNext = () => {
    if (currentStep === 0 && !formData.template) {
      setErrors((prev) => ({ ...prev, template: true }))
      message.error("Please select a template before proceeding.")
      return
    }
    setErrors((prev) => ({ ...prev, template: false }))
    setCurrentStep(currentStep + 1)
  }

  // Handle navigation to the previous step
  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  // Handle modal close
  const handleClose = () => {
    closeFnc()
  }

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = {
      template: !formData.template,
      focusKeywords: formData.focusKeywords.length === 0,
      keywords: formData.keywords.length === 0,
      videoLinks: videoLinks.length === 0,
      otherLinks: isOtherLinksEnabled && otherLinks.length === 0,
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      message.error("Please fill all required fields.")
      return
    }

    // Additional validation for link limits
    if (videoLinks.length > 3) {
      setErrors((prev) => ({ ...prev, videoLinks: true }))
      message.error("You can only add up to 3 video links.")
      return
    }
    if (otherLinks.length > 3) {
      setErrors((prev) => ({ ...prev, otherLinks: true }))
      message.error("You can only add up to 3 other links.")
      return
    }

    const finalData = {
      ...formData,
      videoLinks: [...videoLinks, ...otherLinks], // Merge video and other links
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
    setErrors((prev) => ({ ...prev, template: false }))
  }

  // Handle keyword input changes
  const handleKeywordInputChange = (e, type) => {
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value,
    }))
    setErrors((prev) => ({ ...prev, [type]: false }))
  }

  // Add keywords to the form data
  const handleAddKeyword = (type) => {
    const inputKey = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    const inputValue = formData[inputKey].trim()

    if (!inputValue) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      message.error("Please enter a keyword.")
      return
    }

    const existingSet = new Set(formData[type].map((k) => k.trim().toLowerCase()))
    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "" && !existingSet.has(k.toLowerCase()))

    if (newKeywords.length === 0) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      message.error("Please enter valid, non-duplicate keywords separated by commas.")
      return
    }

    if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
      setErrors((prev) => ({ ...prev, [type]: true }))
      message.error("You can only add up to 3 focus keywords.")
      return
    }

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [inputKey]: "",
    }))
    setErrors((prev) => ({ ...prev, [type]: false }))
  }

  // Remove a keyword
  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
  }

  // Handle Enter key for keywords
  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
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
    const maxLinks = 3 // Maximum links per type

    if (!input) {
      setErrors((prev) => ({ ...prev, [errorKey]: true }))
      message.error(`Please enter at least one ${isVideo ? "video" : "other"} link.`)
      return
    }

    const newLinks = input
      .split(",")
      .map((link) => link.trim())
      .filter((link) => link !== "")

    const validNewLinks = []

    for (let rawLink of newLinks) {
      let validatedUrl = rawLink
      if (!/^https?:\/\//i.test(validatedUrl)) {
        validatedUrl = `https://${validatedUrl}`
      }

      try {
        const urlObj = new URL(validatedUrl)
        if (isVideo) {
          const videoDomains = ["youtube.com", "youtu.be"]
          if (!videoDomains.some((domain) => urlObj.hostname.includes(domain))) {
            setErrors((prev) => ({ ...prev, videoLinks: true }))
            message.error("Please enter a valid video URL (e.g., YouTube).")
            continue
          }
        }
        if (
          !videoLinks.includes(validatedUrl) &&
          !otherLinks.includes(validatedUrl) &&
          !validNewLinks.includes(validatedUrl)
        ) {
          validNewLinks.push(validatedUrl)
        }
      } catch {
        setErrors((prev) => ({ ...prev, [errorKey]: true }))
        message.error(`Invalid ${isVideo ? "video" : "other"} URL: ${rawLink}`)
      }
    }

    // if (validNewLinks.length === 0) {
    //   setErrors((prev) => ({ ...prev, [errorKey]: true }))
    //   message.error(`No valid, unique ${isVideo ? "video" : "other"} URLs found.`)
    //   return
    // }

    if (existingLinks.length + validNewLinks.length > maxLinks) {
      setErrors((prev) => ({ ...prev, [errorKey]: true }))
      message.error(`You can only add up to ${maxLinks} ${isVideo ? "video" : "other"} links.`)
      return
    }

    setLinks([...existingLinks, ...validNewLinks])
    setFormData((prev) => ({
      ...prev,
      [inputKey]: "",
    }))
    setErrors((prev) => ({ ...prev, [errorKey]: false }))
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
    setErrors((prev) => ({ ...prev, [isVideo ? "videoLinks" : "otherLinks"]: false }))
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
              <div className="sm:hidden grid grid-cols-2 gap-4">
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all duration-200 w-full ${
                    formData.template === pkg.name ? "border-gray-300 border-2 rounded-md" : ""
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
            <div className="hidden sm:block">
              <Carousel className="flex flex-row gap-4">
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all duration-200 w-full ${
                      formData.template === pkg.name ? "border-gray-300 border-2 rounded-md" : ""
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
              {/* {errors.template && (
                <p className="text-red-500 text-sm mt-2">Please select a template.</p>
              )} */}
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-8">
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
                  } rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600`}
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
                <p className="text-red-500 text-sm mt-1">Please add at least one focus keyword.</p>
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
                  } rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600`}
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
                  } rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600`}
                  placeholder="Enter video links (e.g., YouTube), separated by commas"
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
                  {/* <span className="text-sm text-gray-600">Enable Other Links</span> */}
                  <Switch
                    checked={isOtherLinksEnabled}
                    onChange={(checked) => {
                      setIsOtherLinksEnabled(checked)
                      if (!checked) {
                        setOtherLinks([]) // Clear other links when toggle is turned off
                        setFormData((prev) => ({ ...prev, otherLinkInput: "" }))
                        setErrors((prev) => ({ ...prev, otherLinks: false }))
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
                      } rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600`}
                      placeholder="Enter other links (e.g., articles, websites), separated by commas"
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
