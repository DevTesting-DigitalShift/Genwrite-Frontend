import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import Carousel from "./Carousel"
import { Info, Upload, X } from "lucide-react"
import { toast } from "react-toastify"
import { packages } from "@constants/templates"
import "react-datepicker/dist/react-datepicker.css"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { createMultiBlog } from "@store/slices/blogSlice"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { Tooltip } from "antd"

const MultiStepModal = ({ closeFnc }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user) // <-- Add this line

  const [currentStep, setCurrentStep] = useState(0)
  const [recentlyUploadedCount, setRecentlyUploadedCount] = useState(null)

  const [formData, setFormData] = useState({
    templates: [],
    topics: [],
    keywords: [],
    topicInput: "",
    keywordInput: "",
    performKeywordResearch: true,
    tone: "",
    numberOfCounts: 5,
    userDefinedLength: 1000,
    imageSource: "unsplash",
    useBrandVoice: true,
    useCompetitors: false,
    includeInterlinks: true,
    includeMetaHeadlines: true,
    includeFaqs: true,
    numberOfBlogs: 1,
    wordpressPostStatus: false,
    postFrequency: 10 * 60, // in seconds
    selectedDates: null,
    aiModel: "gemini",
  })

  const handleNext = () => {
    if (currentStep === 0) {
      if (formData.templates.length === 0) {
        toast.error("Please add at least one topic.")
        return
      }
    }
    if (currentStep === 1) {
      if (formData.topics.length === 0 && formData.topicInput.trim() === "") {
        toast.error("Please add at least one topic.")
        return
      }
      if (!formData.tone) {
        toast.error("Please select a Tone of Voice.")
        return
      }
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleClose = () => {
    closeFnc()
  }

  const handleSubmit = () => {
    if (formData.topics.length === 0 && formData.topicInput.trim() === "") {
      toast.error("Please add at least one topic.")
      return
    }
    if (!formData.tone) {
      toast.error("Please select a Tone of Voice.")
      return
    }
    if (formData.numberOfBlogs < 1) {
      toast.error("Number of blogs must be at least 1.")
      return
    }
    if (formData.numberOfBlogs > 10) {
      toast.error("Number of blogs must be at most 10.")
      return
    }

    handlePopup({
      title: "Bulk Blog Generation",
      description: (
        <>
          <span>
            Estimated Cost for bulk blogs :{" "}
            <b>
              {formData.numberOfBlogs *
                (getEstimatedCost("blog.single") +
                  (formData.imageSource == "unsplash" ? 0 : getEstimatedCost("aiImages")))}{" "}
              credits
            </b>
          </span>
          <br />
          <span>Do you want to continue ? </span>
        </>
      ),
      onConfirm: () => {
        dispatch(createMultiBlog({blogData: formData, navigate}))
      },
    })
  }

  const handlePackageSelect = (index) => {
    const ss = formData.templates
    const selectedPackageName = packages[index].name
    const isSelected = ss.includes(selectedPackageName)

    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        templates: prev.templates.filter((name) => name !== selectedPackageName),
      }))
    } else if (ss.length < 3) {
      setFormData((prev) => ({
        ...prev,
        templates: [...prev.templates, selectedPackageName],
      }))
    } else {
      toast.error("You can select a maximum of 3 templates.")
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const val = type === "number" ? parseInt(value, 10) || 0 : value
    setFormData({
      ...formData,
      [name]: val,
    })
  }

  const handleCheckboxChange = async (e) => {
    const { name, checked } = e.target
    if (name === "wordpressPostStatus" && checked) {
      try {
        if (!user?.wordpressLink) {
          toast.error(
            "Please connect your WordPress account in your profile before enabling automatic posting."
          )
          navigate("/profile")
          return
        }
      } catch {
        toast.error("Failed to check profile. Please try again.")
        return
      }
    }
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleTopicInputChange = (e) => {
    setFormData((prev) => ({ ...prev, topicInput: e.target.value }))
  }

  const handleKeywordInputChange = (e) => {
    setFormData((prev) => ({ ...prev, keywordInput: e.target.value }))
  }

  const handleAddTopic = () => {
    const inputValue = formData.topicInput
    if (inputValue.trim() !== "") {
      const newTopics = inputValue
        .split(",")
        .map((topic) => topic.trim())
        .filter((topic) => topic !== "" && !formData.topics.includes(topic))

      if (newTopics.length > 0) {
        setFormData((prev) => ({
          ...prev,
          topics: [...prev.topics, ...newTopics],
          topicInput: "",
        }))
        return true
      } else {
        setFormData((prev) => ({ ...prev, topicInput: "" }))
        return false
      }
    }
    return false
  }

  const handleAddKeyword = () => {
    const inputValue = formData.keywordInput
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "" && !formData.keywords.includes(keyword))

      if (newKeywords.length > 0) {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...newKeywords],
          keywordInput: "",
        }))
        return true
      } else {
        setFormData((prev) => ({ ...prev, keywordInput: "" }))
        return false
      }
    }
    return false
  }

  const handleRemoveTopic = (index) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }))
  }

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }))
  }

  const handleTopicKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTopic()
      handleAddKeyword()
    }
  }

  const handleImageSourceChange = (source) => {
    setFormData((prev) => ({ ...prev, imageSource: source }))
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const text = event.target?.result
      if (!text) return

      const lines = text.trim().split(/\r?\n/).slice(1) // skip header
      const keywords = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.length >= 2 ? parts[1].trim() : null
        })
        .filter(Boolean)

      // Normalize for comparison (lowercase, trimmed)
      const existingTopics = formData.topics.map((t) => t.toLowerCase().trim())

      const uniqueNewTopics = keywords.filter((kw) => {
        const normalized = kw.toLowerCase().trim()
        return !existingTopics.includes(normalized)
      })

      if (uniqueNewTopics.length === 0) {
        toast.warning("No new topics found in the CSV.")
        return
      }

      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, ...uniqueNewTopics],
      }))

      if (uniqueNewTopics.length > 8) {
        setRecentlyUploadedCount(uniqueNewTopics.length)
        setTimeout(() => setRecentlyUploadedCount(null), 5000)
      }
    }

    reader.readAsText(file)

    // ✅ Reset file input to allow uploading the same file again
    e.target.value = null
  }

  const handleCSVKeywordUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const text = event.target?.result
      if (!text) return

      const lines = text.trim().split(/\r?\n/).slice(1) // skip header
      const keywords = lines
        .map((line) => {
          const parts = line.split(",")
          return parts.length >= 2 ? parts[1].trim() : null
        })
        .filter(Boolean)

      // Normalize for comparison (lowercase, trimmed)
      const existingTopics = formData.keywords.map((t) => t.toLowerCase().trim())

      const uniqueNewTopics = keywords.filter((kw) => {
        const normalized = kw.toLowerCase().trim()
        return !existingTopics.includes(normalized)
      })

      if (uniqueNewTopics.length === 0) {
        toast.warning("No new topics found in the CSV.")
        return
      }

      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, ...uniqueNewTopics],
      }))

      if (uniqueNewTopics.length > 8) {
        setRecentlyUploadedCount(uniqueNewTopics.length)
        setTimeout(() => setRecentlyUploadedCount(null), 5000)
      }
    }

    reader.readAsText(file)

    // ✅ Reset file input to allow uploading the same file again
    e.target.value = null
  }

  const steps = ["Select Template's", "Add Details", "Configure Output"]

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center relative justify-between p-6 border-b">
          <div className="flex items-center gap-2 ">
            <h2 className="text-lg font-semibold">
              Step {currentStep + 1} | {steps[currentStep]}
            </h2>
          </div>
          <button onClick={handleClose} className=" text-gray-400 hover:text-gray-600">
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

        <div className="px-6 pb-2 overflow-y-auto">
          <div className="w-full bg-gray-100 h-2 rounded-full my-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {currentStep === 0 && (
            <div className="">
              <p className="text-sm text-gray-600 mb-4">
                Select up to 3 templates for the types of blogs you want to generate.
              </p>
              <Carousel>
                {packages.map((pkg, index) => (
                  <div
                    key={pkg.name}
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.templates.includes(pkg.name) ? "border-blue-500 border-2" : ""
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
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  Topics <span className="text-red-500">*</span>
                  <Tooltip title="Upload a .csv file in the format: `S.No., Keyword`">
                    <div className="cursor-pointer">
                      <Info size={16} className="text-blue-500" />
                    </div>
                  </Tooltip>
                </label>
                <p className="text-xs text-gray-500 mb-2">Enter the main topics for your blogs .</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.topicInput}
                    onChange={handleTopicInputChange}
                    onKeyDown={handleTopicKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., digital marketing trends, AI in business"
                  />
                  <button
                    onClick={handleAddTopic}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                    <Upload size={16} />
                    <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {formData.topics
                    .slice() // make a shallow copy
                    .reverse() // newest first
                    .slice(0, 18)
                    .map((topic, index) => (
                      <span
                        key={`${topic}-${index}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(formData.topics.length - 1 - index)} // adjusted for reversed index
                          className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                  {/* Combined +X more and +Y uploaded */}
                  {(formData.topics.length > 18 || recentlyUploadedCount) && (
                    <span className="text-xs font-medium text-blue-600 self-center">
                      {formData.topics.length > 18 && `+${formData.topics.length - 18} more `}
                      {recentlyUploadedCount && `(+${recentlyUploadedCount} uploaded)`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Perform Keyword Research?
                  <p className="text-xs text-gray-500">
                    Allow AI to find relevant keywords for the topics.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="performKeywordResearch"
                    checked={formData.performKeywordResearch}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {!formData.performKeywordResearch && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Keywords
                      <Tooltip title="Upload a .csv file in the format: `S.No., Keyword`">
                        <div className="cursor-pointer">
                          <Info size={16} className="text-blue-500" />
                        </div>
                      </Tooltip>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.keywordInput}
                        onChange={handleKeywordInputChange}
                        onKeyDown={handleTopicKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., digital marketing trends, AI in business"
                      />
                      <button
                        onClick={handleAddKeyword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <label className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md text-sm cursor-pointer flex items-center gap-1 hover:bg-gray-200">
                        <Upload size={16} />
                        <input type="file" accept=".csv" onChange={handleCSVKeywordUpload} hidden />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                      {formData.keywords
                        .slice() // make a shallow copy
                        .reverse() // newest first
                        .slice(0, 18)
                        .map((topic, index) => (
                          <span
                            key={`${topic}-${index}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {topic}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveKeyword(formData.keywords.length - 1 - index)
                              } // adjusted for reversed index
                              className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                      {/* Combined +X more and +Y uploaded */}
                      {(formData.keywords.length > 18 || recentlyUploadedCount) && (
                        <span className="text-xs font-medium text-blue-600 self-center">
                          {formData.keywords.length > 18 &&
                            `+${formData.keywords.length - 18} more `}
                          {recentlyUploadedCount && `(+${recentlyUploadedCount} uploaded)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                    Tone of Voice <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tone"
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 ${
                      !formData.tone ? "border-red-300 text-gray-500" : "border-gray-300"
                    }`}
                  >
                    <option disabled>-- Select a Tone --</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approx. Blog Length (Words)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="500"
                      max="5000" // Updated max value
                      value={formData.userDefinedLength}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer 
      bg-gradient-to-r from-[#1B6FC9] to-gray-100
      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]`}
                      style={{
                        background: `linear-gradient(to right, #1B6FC9 ${
                          ((formData.userDefinedLength - 500) / 4500) * 100 // Adjusted for 5000 max
                        }%, #E5E7EB ${((formData.userDefinedLength - 500) / 4500) * 100}%)`,
                      }}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          userDefinedLength: e.target.value,
                        }))
                      }}
                    />
                    <span className="mt-2 text-sm text-gray-600 block">
                      {formData.userDefinedLength} words
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select AI Model
                </label>
                <select
                  value={formData.aiModel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      aiModel: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gemini">Gemini</option>
                  <option value="chatgpt">Chatgpt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Source</label>
                <fieldset className="mt-2">
                  <legend className="sr-only">Image source selection</legend>
                  <div className="flex items-center gap-x-6">
                    <div className="flex items-center gap-x-2">
                      <input
                        id="image-source-ai"
                        name="image-source"
                        type="radio"
                        value="ai"
                        checked={formData.imageSource === "ai"}
                        onChange={() => handleImageSourceChange("ai")}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="image-source-ai"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        AI Generated Images
                      </label>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <input
                        id="image-source-unsplash"
                        name="image-source"
                        type="radio"
                        value="unsplash"
                        checked={formData.imageSource === "unsplash"}
                        onChange={() => handleImageSourceChange("unsplash")}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="image-source-unsplash"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Unsplash Stock Images
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
              {/* <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Use Brand Voice?
                  <p className="text-xs text-gray-500">
                    Apply your configured brand voice to the blogs.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="useBrandVoice"
                    checked={formData.useBrandVoice}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div> */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include Interlinks
                    <p className="text-xs text-gray-500">
                      Attempt to link between generated blogs if relevant.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeInterlinks"
                      checked={formData.includeInterlinks}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {/* <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include Meta Headlines
                    <p className="text-xs text-gray-500">
                      Generate suggested meta titles/headlines.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeMetaHeadlines"
                      checked={formData.includeMetaHeadlines}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div> */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include FAQ Section
                    <p className="text-xs text-gray-500">
                      Generate relevant FAQ questions and answers for the blog.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeFaqs"
                      checked={formData.includeFaqs}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-gray-700">
                  Enable Competitive Research
                  <p className="text-xs text-gray-500">
                    Perform competitive research to analyze similar blogs.
                  </p>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="useCompetitors"
                    checked={formData.useCompetitors}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Blogs
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    How many blogs to generate based on the topics provided.
                  </p>
                  <input
                    type="number"
                    name="numberOfBlogs"
                    min="1"
                    max="10"
                    value={formData.numberOfBlogs}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm font-medium text-gray-700">
                    Enable Automatic Posting
                    <p className="text-xs text-gray-500">
                      Automatically post blogs on the selected dates.
                    </p>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="wordpressPostStatus"
                      checked={formData.wordpressPostStatus}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div>
                  {/* <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Dates for Blog Posting
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choose specific dates to generate and post blogs. Only future dates are allowed.
                  </p>
                    {/* Calendar for selecting multiple dates *\/}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Dates
                      </label>
                      <MultiDatePicker
                        value={formData.selectedDates}
                        onChange={(dates) => {
                          setFormData((prev) => ({
                            ...prev,
                            selectedDates: dates.map((date) => new Date(date)), // Ensure valid Date objects
                          }))
                        }}
                        minDate={new Date()} // Restrict to today or future dates
                        multiple
                        className="border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Display selected dates *\/}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Selected Dates
                      </label>
                      <div className="bg-gray-50 border border-gray-300 rounded-md p-3 text-sm text-gray-700">
                        {formData.selectedDates?.length > 0 ? (
                          formData.selectedDates.map((date, index) => (
                            <span key={index} className="block">
                              {date ? new Date(date).toLocaleDateString() : "Invalid date"}
                            </span>
                          ))
                        ) : (
                          <span>No dates selected</span>
                        )}
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 mt-auto">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Previous
            </button>
          )}
          <button
            onClick={currentStep === 2 ? handleSubmit : handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {currentStep === 2 ? "Generate Blogs" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MultiStepModal
