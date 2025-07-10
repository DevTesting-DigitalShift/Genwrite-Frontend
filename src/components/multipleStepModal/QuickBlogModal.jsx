import { useState } from "react"
import { createNewQuickBlog } from "../../store/slices/blogSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { packages } from "@constants/templates"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { message, Modal } from "antd"
import { Plus, X } from "lucide-react"

const QuickBlogModal = ({ closeFnc }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [inputs, setInputs] = useState([])
  const [errors, setErrors] = useState({
    template: false,
    focusKeywords: false,
    keywords: false,
    videoLinks: false,
  })
  const [formData, setFormData] = useState({
    template: null,
    keywords: [],
    focusKeywords: [],
    videoLinks: [],
    keywordInput: "",
    focusKeywordInput: "",
    videoLinkInput: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  const handleNext = () => {
    if (currentStep === 0 && !formData.template) {
      setErrors((prev) => ({ ...prev, template: true }))
      message.error("Please select a template before proceeding.")
      return
    }
    setErrors((prev) => ({ ...prev, template: false }))
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleClose = () => {
    closeFnc()
  }

  const handleSubmit = () => {
    const newErrors = {
      template: !formData.template,
      focusKeywords: formData.focusKeywords.length === 0,
      keywords: formData.keywords.length === 0,
      videoLinks: inputs.length === 0,
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      message.error("Please fill all the fields")
      return
    }

    const finalData = {
      ...formData,
      videoLinks: inputs,
    }
    handlePopup({
      title: "Quick Blog Generation",
      description: (
        <>
          <span>
            Quick blog generation is <b>{getEstimatedCost("blog.quick")} credits.</b>
          </span>
          <br />
          <span>Are you sure ?</span>
        </>
      ),
      onConfirm: () => {
        dispatch(createNewQuickBlog({ blogData: finalData, navigate }))
        handleClose()
      },
    })
  }

  const handlePackageSelect = (index) => {
    setSelectedPackage(index)
    setFormData({
      ...formData,
      template: packages[index].name,
    })
    setErrors((prev) => ({ ...prev, template: false }))
  }

  const handleKeywordInputChange = (e, type) => {
    const key = type === "keywords" ? "keywordInput" : "focusKeywordInput"
    setFormData((prevState) => ({
      ...prevState,
      [key]: e.target.value,
    }))
    setErrors((prev) => ({ ...prev, [type]: false }))
  }

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

  const handleAddLink = () => {
    const input = formData.videoLinkInput?.trim()
    if (!input) {
      setErrors((prev) => ({ ...prev, videoLinks: true }))
      message.error("Please enter at least one link.")
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
        if (!inputs.includes(validatedUrl) && !validNewLinks.includes(validatedUrl)) {
          validNewLinks.push(validatedUrl)
        }
      } catch {
        // Invalid URL, skip it
      }
    }

    if (validNewLinks.length === 0) {
      setErrors((prev) => ({ ...prev, videoLinks: true }))
      message.error("No valid, unique URLs found.")
      return
    }

    const totalLinks = inputs.length + validNewLinks.length
    if (totalLinks > 3) {
      setErrors((prev) => ({ ...prev, videoLinks: true }))
      message.error("You can only add up to 3 links in total.")
      return
    }

    setInputs([...inputs, ...validNewLinks])
    setFormData((prev) => ({
      ...prev,
      videoLinkInput: "",
    }))
    setErrors((prev) => ({ ...prev, videoLinks: false }))
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddLink()
    }
  }

  const handleRemoveLink = (index) => {
    const updatedInputs = [...inputs]
    updatedInputs.splice(index, 1)
    setInputs(updatedInputs)
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
                className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
              >
                Next
              </button>,
            ]
          : [
              <button
                key="previous"
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Previous
              </button>,
              <button
                key="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
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
      <div className="p-4">
        {currentStep === 0 && (
          <div>
            <div className="p-3">
              <Carousel>
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.template === pkg.name ? "border-gray-300 border-2 rounded-md" : ""
                    }`}
                    onClick={() => handlePackageSelect(index)}
                  >
                    <div className="bg-white rounded-md overflow-hidden">
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
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                />
                <button
                  onClick={() => handleAddKeyword("focusKeywords")}
                  className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center"
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
                <input
                  type="text"
                  value={formData.keywordInput}
                  onChange={(e) => handleKeywordInputChange(e, "keywords")}
                  onKeyDown={(e) => handleKeyPress(e, "keywords")}
                  className={`flex-1 px-3 py-2 border ${
                    errors.keywords ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600`}
                  placeholder="Enter secondary keywords, separated by commas"
                />
                <button
                  onClick={() => handleAddKeyword("keywords")}
                  className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center"
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
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Links (max 3) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.videoLinkInput || ""}
                  onChange={(e) =>
                    setFormData((prevState) => ({
                      ...prevState,
                      videoLinkInput: e.target.value,
                    }))
                  }
                  onKeyDown={handleKeyDown}
                  className={`flex-1 px-3 py-2 border ${
                    errors.videoLinks ? "border-red-500" : "border-gray-200"
                  } rounded-md text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600`}
                  placeholder="Enter links, separated by commas"
                />
                <button
                  onClick={handleAddLink}
                  className="px-4 py-2 bg-[#1B6FC9] text-white rounded-md text-sm flex items-center"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {inputs.map((input, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {input}
                    <button
                      onClick={() => handleRemoveLink(index)}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default QuickBlogModal
