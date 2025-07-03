"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchBrands } from "@store/slices/brandSlice"

const ThirdStepModal = ({ handleSubmit, handlePrevious, handleClose, data, setData }) => {
  const { brands } = useSelector((state) => state.brand)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchBrands())
  }, [dispatch])

  const [formData, setFormData] = useState({
    isCheckedBrand: data.isCheckedBrand || false,
    brandId: data.brandId || null, // Added brandId to formData
    ...data,
  })

  const [localFormData, setLocalFormData] = useState({
    images: [],
    currentImageIndex: 0,
    referenceLinks: [],
    newLink: "",
  })

  const {
    items: brandVoices,
    loading: loadingBrands,
    error: brandError,
  } = useSelector((state) => state.brand)

  useEffect(() => {
    if (formData.isCheckedBrand) {
      dispatch(fetchBrands())
    }
  }, [formData.isCheckedBrand, dispatch])

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
      brandId: formData.isCheckedBrand ? formData.brandId : null, // Include brandId in payload
      images: [...(data.images || []), ...localFormData.images],
      referenceLinks: [...(data.referenceLinks || []), ...localFormData.referenceLinks],
    }
    handleSubmit(updatedData)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-[800px] bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Step 3: Final Details</h2>
          <button
            onClick={handleClose}
            className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
          >
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
              <div className="mt-4 p-6 rounded-lg border border-indigo-100 bg-indigo-50/50 shadow-sm">
                {loadingBrands ? (
                  <div className="text-gray-500 text-sm animate-pulse">Loading brand voices...</div>
                ) : brandError ? (
                  <div className="text-red-500 text-sm font-medium">{brandError}</div>
                ) : brands?.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <div className="grid gap-4">
                      {brands.map((voice) => (
                        <label
                          key={voice._id}
                          className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.brandId === voice._id
                              ? "bg-indigo-100 border-indigo-300 shadow-md"
                              : "bg-white border border-gray-200 hover:bg-indigo-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedBrandVoice"
                            value={voice._id}
                            checked={formData.brandId === voice._id}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                brandId: voice._id,
                              }))
                            }
                            className="mt-1 form-radio text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-indigo-800 text-base">
                              {voice.nameOfVoice}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                              {voice.describeBrand}
                            </p>
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

            {/* --- End Brand Voice Section --- */}

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

          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={handlePrevious}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
