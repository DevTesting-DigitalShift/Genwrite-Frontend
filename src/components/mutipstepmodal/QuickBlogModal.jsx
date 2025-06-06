import { useState } from "react"
import { createNewQuickBlog } from "../../store/slices/blogSlice"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { packages } from "@constants/templates"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { toast, useToast } from "react-toastify"

const QuickBlogModal = ({ closefnc }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [inputs, setInputs] = useState([])
  const [formData, setFormData] = useState({
    package: null,
    keywords: [],
    focusKeywords: [],
    videoLinks: [],
    keywordInput: "",
    focusKeywordInput: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleClose = () => {
    closefnc()
  }

  const handleSubmit = () => {
    if (!(formData.focusKeywords.length && formData.keywords.length && inputs.length)) {
      toast.error("Please fill all the fields")
    } else {
      const finalData = {
        ...formData,
        videoLinks: inputs,
      }
      console.log("Form Data:", finalData)
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
          dispatch(createNewQuickBlog(finalData, navigate))
          console.log("Form submitted successfully")
          handleClose()
        },
      })
    }
  }

  const handlePackageSelect = (index) => {
    setSelectedPackage(index)
    setFormData({
      ...formData,
      package: packages[index].name,
    })
  }

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
  }

  const handleKeywordInputChange = (e, type) => {
    if (type === "keywords") {
      setFormData((prevState) => ({
        ...prevState,
        [`${type}Input`]: e.target.value,
        keywordInput: e.target.value,
      }))
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [`${type}Input`]: e.target.value,
        focusKeywordInput: e.target.value,
      }))
    }
  }

  const handleAddKeyword = (type) => {
    const inputValue = formData[`${type}Input`]
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "")
      if (type === "focusKeywords" && formData[type].length + newKeywords.length > 3) {
        alert("You can only add up to 3 focus keywords.")
        return
      }
      if (type === "focusKeywords") {
        setFormData({
          ...formData,
          [type]: [...formData[type], ...newKeywords],
          [`${type}Input`]: "",
          focusKeywordInput: "",
        })
      } else {
        setFormData({
          ...formData,
          [type]: [...formData[type], ...newKeywords],
          [`${type}Input`]: "",
          keywordInput: "",
        })
      }
    }
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl">
        <div className="p-6">
          {currentStep === 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-montserrat font-semibold">Create Quick Blog</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-3">
                <Carousel>
                  {packages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer transition-all duration-200 ${
                        formData.package === pkg.name ? "border-blue-500 border-2" : ""
                      }`}
                      onClick={() => handlePackageSelect(index)}
                    >
                      <div className="bg-white rounded-lg overflow-hidden">
                        <div className=" relative">
                          <img
                            src={pkg.imgSrc || "/placeholder.svg"}
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className={`${
                            index === 2
                              ? "mt-3"
                              : index === 3
                              ? "mt-1"
                              : index === 4
                              ? "mt-2"
                              : index === 6
                              ? "mt-5"
                              : index === 7
                              ? "mt-3"
                              : ""
                          } p-2`}
                        >
                          <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </>
          )}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-montserrat font-semibold">Create Quick Blog</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Focus Keywords
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.focusKeywordInput}
                      onChange={(e) => handleKeywordInputChange(e, "focusKeywords")}
                      onKeyDown={(e) => handleKeyPress(e, "focusKeywords")}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                      placeholder="Enter focus keywords"
                    />
                    <button
                      onClick={() => handleAddKeyword("focusKeywords")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                    >
                      Add
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
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.keywordInput}
                      onChange={(e) => handleKeywordInputChange(e, "keywords")}
                      onKeyDown={(e) => handleKeyPress(e, "keywords")}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                      placeholder="Enter keywords"
                    />
                    <button
                      onClick={() => handleAddKeyword("keywords")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(index, "keywords")}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-hind font-normal mb-2">
                    Add video embedded links (max 3)
                  </h3>
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter YouTube video link"
                    />
                    <button
                      onClick={() => {
                        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
                        if (!formData.videoLinkInput) {
                          toast.error("Please enter a video link.")
                        } else if (!youtubeRegex.test(formData.videoLinkInput)) {
                          toast.error("Please enter a valid YouTube link.")
                        } else if (inputs.length >= 3) {
                          toast.error("You can only add up to 3 video links.")
                        } else if (inputs.includes(formData.videoLinkInput)) {
                          toast.error("This link has already been added.")
                        } else {
                          setInputs([...inputs, formData.videoLinkInput])
                          setFormData((prevState) => ({
                            ...prevState,
                            videoLinkInput: "",
                          }))
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inputs.map((input, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700"
                      >
                        {input}
                        <button
                          onClick={() => {
                            const updatedInputs = [...inputs]
                            updatedInputs.splice(index, 1)
                            setInputs(updatedInputs)
                          }}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-4">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                  onClick={handlePrev}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickBlogModal
