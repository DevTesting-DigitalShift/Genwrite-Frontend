import React, { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { createMultiBlog } from "../../store/slices/blogSlice"
import Carousel from "./Carousel"
import { X } from "lucide-react"
import { toast } from "react-toastify"
import { packages } from "@constants/templates"

const MultiStepModal = ({ closefnc }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)

  const [formData, setFormData] = useState({
    templates: [],
    topics: [],
    topicInput: "",
    performKeywordResearch: true,
    tone: "",
    userDefinedLength: 1000,
    imageSource: "unsplash",
    useBrandVoice: true,
    useCompetitors: false,
    includeInterlinks: true,
    includeMetaHeadlines: true,
    includeFaqs: true,
    numberOfBlogs: 2,
    wordpressPostStatus: false,
    postFrequency: 10 * 60, // in seconds
  })

  const handleNext = () => {
    if (currentStep === 1) {
      if (formData.topics.length === 0 && formData.topicInput.trim() === "") {
        toast.error("Please add at least one topic.")
        return
      }
      if (!formData.tone) {
        toast.error("Please select a Tone of Voice.")
        return
      }
      if (formData.topicInput.trim() !== "") {
        handleAddTopic()
      }
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleClose = () => {
    closefnc()
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

    let finalTopics = formData.topics
    if (formData.topicInput.trim() !== "") {
      const newTopics = formData.topicInput
        .split(",")
        .map((topic) => topic.trim())
        .filter((topic) => topic !== "" && !finalTopics.includes(topic))
      finalTopics = [...finalTopics, ...newTopics]
    }

    const finalData = {
      ...formData,
      topics: finalTopics,
      topicInput: "",
    }

    console.log("Form submitted with data:", finalData)
    dispatch(createMultiBlog(finalData, navigate))
    handleClose()
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
      alert("You can select a maximum of 3 templates.")
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleTopicInputChange = (e) => {
    setFormData((prev) => ({ ...prev, topicInput: e.target.value }))
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

  const handleRemoveTopic = (index) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }))
  }

  const handleTopicKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTopic()
    }
  }

  const handleImageSourceChange = (source) => {
    setFormData((prev) => ({ ...prev, imageSource: source }))
  }

  const steps = ["Select Template(s)", "Add Details", "Configure Output"]

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
                <p className="text-xs text-gray-500 mb-2">
                  Enter the main topics for your blogs (comma-separated or add one by one).
                </p>
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
                </div>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[28px]">
                  {formData.topics.map((topic, index) => (
                    <span
                      key={`${topic}-${index}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(index)}
                        className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
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
                    <option value="" disabled>
                      -- Select a Tone --
                    </option>
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
                  <input
                    type="range"
                    name="userDefinedLength"
                    min="500"
                    max="3000"
                    step="100"
                    value={formData.userDefinedLength}
                    onChange={handleInputChange}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-[#1B6FC9] to-gray-100 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                    style={{
                      background: `linear-gradient(to right, #1B6FC9 ${
                        ((formData.userDefinedLength - 500) / (3000 - 500)) * 100
                      }%, #E5E7EB ${((formData.userDefinedLength - 500) / (3000 - 500)) * 100}%)`,
                    }}
                  />
                  <div className="text-sm text-gray-600 mt-1 text-center">
                    ~{formData.userDefinedLength} words
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
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
                        AI Generated (DALL-E)
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
                        Stock Photos (Unsplash)
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
              <div className="flex items-center justify-between">
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
              </div>
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
                <div className="flex items-center justify-between">
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
                </div>
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
                      name="includeFAQ"
                      checked={formData.includeFaqs}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
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
                    value={formData.numberOfBlogs}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                  />
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
