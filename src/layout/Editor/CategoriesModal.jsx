import React, { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, AlertCircle } from "lucide-react"
import useContentStore from "@store/useContentStore"
import { toast } from "sonner"

// Popular WordPress categories (limited to 15 for relevance)
const POPULAR_CATEGORIES = [
  "Blogging",
  "Technology",
  "Lifestyle",
  "Travel",
  "Food & Drink",
  "Health & Wellness",
  "Fashion",
  "Business",
  "Education",
  "Entertainment",
  "Photography",
  "Fitness",
  "Marketing",
  "Finance",
  "DIY & Crafts",
]

const CategoriesModal = ({
  isCategoryModalOpen,
  setIsCategoryModalOpen,
  onSubmit,
  initialIncludeTableOfContents = false,
  integrations,
  blogData,
  posted,
}) => {
  const [customCategory, setCustomCategory] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [includeTableOfContents, setIncludeTableOfContents] = useState(
    initialIncludeTableOfContents
  )
  const [categoryError, setCategoryError] = useState(false)
  const [platformError, setPlatformError] = useState(false)
  const [errors, setErrors] = useState({ category: "", platform: "" })
  const { categories, fetchCategories, resetCategories, error: wordpressError } = useContentStore()
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)

  const hasShopifyPosted = posted?.SHOPIFY?.link ? true : false

  useEffect(() => {
    if (selectedIntegration?.platform) {
      fetchCategories(selectedIntegration.platform.toUpperCase())
    }
  }, [fetchCategories, selectedIntegration?.platform])

  const handleIntegrationChange = (platform, url) => {
    setSelectedIntegration({
      platform: platform.toLowerCase(), // for UI
      rawPlatform: platform, // for backend
      url,
    })

    // Clear platform error when platform is selected
    setPlatformError(false)
    setErrors(prev => ({ ...prev, platform: "" }))

    if (platform === "SHOPIFY") {
      if (hasShopifyPosted) {
        setIsCategoryLocked(true)
      } else {
        setIsCategoryLocked(false)
      }
    } else {
      setIsCategoryLocked(false)
    }
  }

  // Handle adding a category (custom or predefined)
  const handleCategoryAdd = useCallback(category => {
    setSelectedCategory(category)
    setCategoryError(false)
    setErrors(prev => ({ ...prev, category: "" }))
  }, [])

  // Handle removing the selected category
  const handleCategoryRemove = useCallback(() => {
    setSelectedCategory("")
    setCategoryError(false)
    setErrors(prev => ({ ...prev, category: "" }))
  }, [])

  // Handle table of contents toggle
  const handleCheckboxChange = useCallback(e => {
    setIncludeTableOfContents(e.target.checked)
  }, [])

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors = { category: "", platform: "" }
    let isValid = true

    // Check if integrations exist and platform is selected
    if (integrations?.integrations && Object.keys(integrations.integrations).length > 0) {
      if (!selectedIntegration) {
        newErrors.platform = "Please select a publishing platform"
        setPlatformError(true)
        isValid = false
      } else {
        setPlatformError(false)
      }
    }

    // Check if category is selected
    if (!selectedCategory || selectedCategory.trim() === "") {
      newErrors.category = "Please select or enter a category"
      setCategoryError(true)
      isValid = false
    } else {
      // Validate category length
      if (selectedCategory.length > 50) {
        newErrors.category = "Category name must be less than 50 characters"
        setCategoryError(true)
        isValid = false
      } else if (selectedCategory.length < 2) {
        newErrors.category = "Category name must be at least 2 characters"
        setCategoryError(true)
        isValid = false
      } else {
        setCategoryError(false)
      }
    }

    setErrors(newErrors)
    return isValid
  }, [selectedCategory, selectedIntegration, integrations])

  // Handle modal submission
  const handleSubmit = useCallback(() => {
    // Validate form
    if (!validateForm()) {
      // Show error message for the first error found
      if (errors.platform) {
        toast.error(errors.platform)
      } else if (errors.category) {
        toast.error(errors.category)
      }
      return
    }

    onSubmit({
      category: selectedCategory.trim(),
      includeTableOfContents,
      type: {
        platform: selectedIntegration?.rawPlatform, // SEND UPPERCASE
        url: selectedIntegration?.url,
      },
    })

    // Reset form
    setIsCategoryModalOpen(false)
    setSelectedCategory("")
    setIncludeTableOfContents(false)
    setCustomCategory("")
    setCategoryError(false)
    setPlatformError(false)
    setErrors({ category: "", platform: "" })
  }, [
    validateForm,
    errors,
    selectedCategory,
    includeTableOfContents,
    selectedIntegration,
    onSubmit,
    setIsCategoryModalOpen,
  ])

  // Handle modal cancellation
  const handleCancel = useCallback(() => {
    setIsCategoryModalOpen(false)
    setSelectedCategory("")
    setIncludeTableOfContents(false)
    setCustomCategory("")
    setCategoryError(false)
    setPlatformError(false)
    setErrors({ category: "", platform: "" })
  }, [setIsCategoryModalOpen])

  const handleCategoryInputChange = useCallback(e => {
    const value = e.target.value
    setSelectedCategory(value)
    if (value) {
      setCategoryError(false)
      setErrors(prev => ({ ...prev, category: "" }))
    }
  }, [])

  // Cleanup effect - reset everything when modal closes
  useEffect(() => {
    if (!isCategoryModalOpen) {
      // Reset all state when modal is closed
      setSelectedCategory("")
      setSelectedIntegration(null)
      setIncludeTableOfContents(initialIncludeTableOfContents)
      setCustomCategory("")
      setCategoryError(false)
      setPlatformError(false)
      setErrors({ category: "", platform: "" })
      setIsCategoryLocked(false)

      // Reset categories in store
      resetCategories()
    }
  }, [isCategoryModalOpen, initialIncludeTableOfContents, resetCategories])

  // Auto-select platform based on posting history (only when modal opens)
  useEffect(() => {
    if (!isCategoryModalOpen) return

    const shopify = posted?.SHOPIFY

    // CASE 1: Posted via Shopify → lock everything
    if (shopify?.link) {
      setIsCategoryLocked(true)
      setSelectedCategory(blogData?.category || "")

      setSelectedIntegration({
        platform: "shopify",
        rawPlatform: "SHOPIFY",
        url: shopify?.url || "",
      })

      return
    }

    // CASE 2: Shopify connected but NOT posted yet → first time posting
    if (shopify && !shopify.link) {
      setIsCategoryLocked(false)
      // Don't auto-select category for new posts
      setSelectedCategory("")

      setSelectedIntegration({
        platform: "shopify",
        rawPlatform: "SHOPIFY",
        url: shopify?.url || "",
      })

      return
    }

    // CASE 3: Posted on other platforms → DO NOT LOCK CATEGORY
    const otherPosted = Object.entries(posted || {}).find(
      ([key, val]) => key !== "SHOPIFY" && val?.link
    )

    if (otherPosted) {
      const [platformKey, val] = otherPosted

      // platform auto-select only (NO category lock)
      setIsCategoryLocked(false)
      // Don't auto-select category for new posts
      setSelectedCategory("")

      setSelectedIntegration({
        platform: platformKey.toLowerCase(),
        rawPlatform: platformKey,
        url: val?.url || "",
      })

      return
    }

    // CASE 4: No posting anywhere → everything unlocked
    setIsCategoryLocked(false)
    setSelectedCategory("")
    setSelectedIntegration(null)
  }, [isCategoryModalOpen, posted, blogData])

  return (
    <AnimatePresence>
      {isCategoryModalOpen && (
        <dialog className="modal modal-open">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="modal-box w-full max-w-xl p-0 overflow-hidden bg-white rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Select Category</h3>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {integrations?.integrations && Object.keys(integrations.integrations).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Your Publishing Platform
                    <p className="text-xs text-gray-500 mt-0.5">
                      Post your blog automatically to connected platforms only.
                    </p>
                  </label>

                  <select
                    className={`select select-bordered w-full h-10 min-h-0 text-sm ${
                      platformError ? "select-error" : ""
                    }`}
                    value={selectedIntegration?.rawPlatform || ""}
                    onChange={e => {
                      const platform = e.target.value
                      const details = integrations.integrations[platform]
                      handleIntegrationChange(platform, details?.url)
                    }}
                  >
                    <option value="" disabled>
                      Select platform
                    </option>
                    {Object.entries(integrations.integrations).map(([platform, details]) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                  {platformError && errors.platform && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 text-xs text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle size={12} /> {errors.platform}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Selected Category Display */}
              {selectedCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Selected:</span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm">
                    <span className="truncate max-w-[200px] font-medium">{selectedCategory}</span>
                    {!isCategoryLocked && (
                      <button
                        onClick={handleCategoryRemove}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                        aria-label={`Remove category ${selectedCategory}`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Auto-Generated Categories Section */}
              {!wordpressError && categories?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Auto-Generated Categories
                  </h3>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 max-h-40 overflow-y-auto">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => !isCategoryLocked && handleCategoryAdd(category)}
                        disabled={selectedCategory === category || isCategoryLocked}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-all duration-200 flex items-center gap-1
                            ${
                              selectedCategory === category
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200 cursor-default"
                                : isCategoryLocked
                                  ? "bg-white text-gray-400 border-gray-200 cursor-not-allowed"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                            }`}
                      >
                        {selectedCategory === category && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        )}
                        {category}
                        {selectedCategory !== category && !isCategoryLocked && (
                          <Plus size={12} className="text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Selection Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select or Add Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="popular-categories"
                    placeholder="Type to search or add new..."
                    value={selectedCategory}
                    onChange={handleCategoryInputChange}
                    disabled={isCategoryLocked}
                    className={`input input-bordered w-full h-10 text-sm ${categoryError ? "input-error" : ""}`}
                  />
                  <datalist id="popular-categories">
                    {POPULAR_CATEGORIES.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                {categoryError && errors.category && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle size={12} /> {errors.category}
                  </motion.p>
                )}
              </div>

              {selectedIntegration?.platform === "shopify" && (
                <div
                  className={`p-3 rounded-md text-sm ${
                    isCategoryLocked
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}
                >
                  {isCategoryLocked
                    ? "This blog was already published on Shopify. Category is locked and cannot be changed."
                    : "Once you publish on Shopify, the category becomes permanent and cannot be changed later."}
                </div>
              )}

              {/* Table of Contents Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    Include Table of Contents
                  </span>
                  <span className="text-xs text-gray-500">
                    Generate a table of contents for each blog.
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={includeTableOfContents}
                  onChange={handleCheckboxChange}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCancel}>close</button>
          </form>
        </dialog>
      )}
    </AnimatePresence>
  )
}

export default CategoriesModal
