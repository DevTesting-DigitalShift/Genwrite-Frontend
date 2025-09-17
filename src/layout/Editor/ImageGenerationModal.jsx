import React, { useRef, useState } from "react"

const ImageGenerationModal = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState({ brief: "", tags: [], keywords: [] })
  const keywordInputRef = useRef(null)

  const tagsList = ["Ultrarealistic", "Photography", "Art", "Illustration"] // Predefined tags

  const handleNext = () => setCurrentStep(currentStep + 1)
  const handlePrev = () => setCurrentStep(currentStep - 1)

  const handleTagToggle = (tag) => {
    const isSelected = data.tags.includes(tag)
    if (isSelected) {
      setData({ ...data, tags: data.tags.filter((t) => t !== tag) })
    } else {
      setData({ ...data, tags: [...data.tags, tag] })
    }
  }

  const handleKeywordInputKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && e.target.value.trim()) {
      e.preventDefault()
      const keyword = e.target.value.trim().replace(/,$/, "")
      if (!data.keywords.includes(keyword)) {
        setData((prev) => ({ ...prev, keywords: [...prev.keywords, keyword] }))
      }
      e.target.value = ""
    }
  }

  const handleAddKeywordManually = () => {
    const value = keywordInputRef.current?.value.trim()
    if (value && !data.keywords.includes(value)) {
      setData((prev) => ({ ...prev, keywords: [...prev.keywords, value] }))
      keywordInputRef.current.value = ""
    }
  }

  const handleRemoveKeyword = (keywordToRemove) => {
    setData({
      ...data,
      keywords: data.keywords.filter((keyword) => keyword !== keywordToRemove),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-[90vw] max-w-5xl h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-semibold font-montserrat">Generate an Image</h3>
          <button
            onClick={onClose}
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {currentStep === 0 && (
            <div>
              {/* Description */}
              <h1 className="text-xl font-hind font-medium mb-2">Image Description</h1>
              <textarea
                className="w-full p-3 border border-gray-300 bg-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter brief description"
                rows="3"
                value={data.brief}
                onChange={(e) => setData({ ...data, brief: e.target.value })}
              />

              {/* Tags */}
              <div className="mt-6">
                <h3 className="text-xl font-hind font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tagsList.map((tag, index) => (
                    <span
                      key={index}
                      onClick={() => handleTagToggle(tag)}
                      className={`cursor-pointer px-4 py-2 border rounded-full text-sm ${
                        data.tags.includes(tag)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="mt-6">
                <h3 className="text-xl font-hind font-medium mb-2">Keywords</h3>

                <div className="flex flex-col gap-3">
                  {/* Input field */}
                  <div className="flex gap-2">
                    <input
                      ref={keywordInputRef}
                      type="text"
                      onKeyDown={handleKeywordInputKeyDown}
                      placeholder="Type keyword and press Enter or ,"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddKeywordManually}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2">
                    {data.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="text-red-500 text-base leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h4 className="text-xl font-hind font-medium mb-4">Generated Results</h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((_, i) => (
                  <div
                    key={i}
                    className="relative bg-gray-200 rounded-lg overflow-hidden h-[15rem]"
                  >
                    <div className="absolute top-2 right-2 bg-blue-500 h-8 w-8 flex items-center justify-center text-white rounded-md">
                      <i className="fa-solid fa-download"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t flex justify-end gap-3 items-center sticky bottom-0 bg-white z-10">
          {currentStep > 0 && (
            <>
              <button
                onClick={handlePrev}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Regenerate
              </button>
            </>
          )}
          {currentStep < 1 && (
            <button
              onClick={handleNext}
              className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageGenerationModal
