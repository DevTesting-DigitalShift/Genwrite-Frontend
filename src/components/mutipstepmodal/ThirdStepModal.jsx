"use client"

import { useState, useEffect } from "react"
import axiosInstance from "@/api/index"
import BrandVoiceSection from "./BrandVoiceSection"

const ThirdStepModal = ({ handleSubmit, handlePrevious, handleClose, data, setData }) => {
  const [formData, setFormData] = useState({
    isCheckedBrand: data.isCheckedBrand || false,
    ...data,
  })
  const [localFormData, setLocalFormData] = useState({
    images: [],
    currentImageIndex: 0,
    referenceLinks: [],
    newLink: "",
  })
  const [brandVoices, setBrandVoices] = useState([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [brandError, setBrandError] = useState(null)

  useEffect(() => {
    if (formData.isCheckedBrand) {
      setLoadingBrands(true)
      axiosInstance
        .get("/brand")
        .then((res) => {
          let brandsArr = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
          setBrandVoices(brandsArr)
          setLoadingBrands(false)
        })
        .catch((err) => {
          setBrandError("Failed to fetch brand voices")
          setLoadingBrands(false)
        })
    }
  }, [formData.isCheckedBrand])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://localhost:6500/api/upload", {
        method: "POST",
        body: formData,
      })
      const resData = await response.json()
      setLocalFormData((prev) => ({
        ...prev,
        images: [...prev.images, resData.imageUrl],
      }))
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  const removeImage = (index) => {
    setLocalFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const navigateImages = (direction) => {
    setLocalFormData((prev) => ({
      ...prev,
      currentImageIndex:
        direction === "next"
          ? Math.min(prev.currentImageIndex + 1, prev.images.length - 1)
          : Math.max(prev.currentImageIndex - 1, 0),
    }))
  }

  const handleAddLink = () => {
    if (localFormData.newLink.trim()) {
      setLocalFormData((prev) => ({
        ...prev,
        referenceLinks: [...prev.referenceLinks, prev.newLink.trim()],
        newLink: "",
      }))
    }
  }

  const handleRemoveLink = (index) => {
    setLocalFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }))
  }

  const handleCheckboxChange = () => {
    setData((prevData) => ({
      ...prevData,
      isCheckedGeneratedImages: !prevData.isCheckedGeneratedImages,
    }))
  }

  const handleNextClick = () => {
    const updatedData = {
      ...data,
      images: [...(data.images || []), ...localFormData.images],
      referenceLinks: [...(data.referenceLinks || []), ...localFormData.referenceLinks],
    }
    handleSubmit(updatedData)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium">Step 3: One last step</h2>
          <button onClick={handleClose} className="ml-4 text-4xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step 3 of 3</span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-full bg-[#1B6FC9] rounded-full" />
            </div>
          </div>

          <div className="space-y-6">
            {/* --- Brand Voice Section from Step 2 --- */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Write with Brand Voice</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCheckedBrand}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isCheckedBrand: !prev.isCheckedBrand,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div>
            {formData.isCheckedBrand && (
              <div className="mt-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50">
                {loadingBrands ? (
                  <div className="text-gray-500 text-sm">Loading brand voices...</div>
                ) : brandError ? (
                  <div className="text-red-500 text-sm">{brandError}</div>
                ) : brandVoices.length > 0 ? (
                  <div className="space-y-2">
                    {brandVoices.map((voice) => (
                      <label
                        key={voice._id}
                        className="flex items-center gap-3 mb-2 cursor-pointer p-2 rounded hover:bg-indigo-100 transition"
                      >
                        <input
                          type="radio"
                          name="selectedBrandVoice"
                          value={voice._id}
                          checked={formData.selectedBrandVoice === voice._id}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              selectedBrandVoice: voice._id,
                            }))
                          }
                          className="form-radio text-[#1B6FC9] focus:ring-[#1B6FC9]"
                        />
                        <div>
                          <div className="font-semibold text-indigo-700">{voice.nameOfVoice}</div>
                          <div className="text-gray-700 text-sm mt-1">{voice.describeBrand}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No brand voices created yet.</div>
                )}
              </div>
            )}
            {/* --- End Brand Voice Section --- */}

            {/* <div>
              <label className="block text-sm font-medium mb-2">
                Add Images
              </label>
              <div className="grid grid-cols-4 gap-4">
                {localFormData.images
                  .slice(
                    localFormData.currentImageIndex,
                    localFormData.currentImageIndex + 3
                  )
                  .map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          removeImage(localFormData.currentImageIndex + index)
                        }
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                      >
                        X
                      </button>
                    </div>
                  ))}
                <label className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100">
                  <div className="bg-blue-500 flex items-center rounded-full w-6 h-6 justify-center text-white">
                    +
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </label>
              </div>
              {localFormData.images.length > 3 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => navigateImages("prev")}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    {`<`}
                  </button>
                  <button
                    onClick={() => navigateImages("next")}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    {`>`}
                  </button>
                </div>
              )}
            </div> */}

            {/* <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Add Generated Images</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.isCheckedGeneratedImages}
                  onChange={handleCheckboxChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div> */}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Add FAQ</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.isFAQEnabled}
                  onChange={() =>
                    setData((prevData) => ({
                      ...prevData,
                      isFAQEnabled: !prevData.isFAQEnabled,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium">Add Competitive Research</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.isCompetitiveResearchEnabled}
                  onChange={() =>
                    setData((prevData) => ({
                      ...prevData,
                      isCompetitiveResearchEnabled: !prevData.isCompetitiveResearchEnabled,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div>

            {/* <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium">Automatic Posting on WordPress</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.isAutoPostToWordPressEnabled}
                  onChange={() =>
                    setData((prevData) => ({
                      ...prevData,
                      isAutoPostToWordPressEnabled: !prevData.isAutoPostToWordPressEnabled,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div> */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Add Reference Links (Helps to make blog more compelling)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
                  placeholder="Add link +"
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
                  className="px-3 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {localFormData.referenceLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate"
                    >
                      {link}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(index)}
                      className="ml-4 text-4xl text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={handlePrevious}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Previous
            </button>
            <button
              onClick={handleNextClick}
              className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThirdStepModal
