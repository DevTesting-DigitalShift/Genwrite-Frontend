import React, { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Modal, Select, message } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { Plus, X } from "lucide-react"
import { getCategoriesThunk, resetCategories } from "@store/slices/otherSlice"

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
  const [errors, setErrors] = useState({
    category: "",
    platform: "",
  })
  const { categories, error: wordpressError } = useSelector(state => state.wordpress)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)

  const hasShopifyPosted = posted?.SHOPIFY?.link ? true : false

  const dispatch = useDispatch()

  useEffect(() => {
    if (selectedIntegration?.platform) {
      dispatch(getCategoriesThunk(selectedIntegration.platform.toUpperCase())).unwrap()
    }
  }, [dispatch, selectedIntegration?.platform])

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
  const handleCategoryAdd = useCallback(
    category => {
      if (selectedCategory) {
        // message.error("Only one category can be selected.")
        return
      }
      setSelectedCategory(category)
      setCategoryError(false)
      setErrors(prev => ({ ...prev, category: "" }))
    },
    [selectedCategory]
  )

  // Handle removing the selected category
  const handleCategoryRemove = useCallback(() => {
    setSelectedCategory("")
    setCategoryError(false)
    setErrors(prev => ({ ...prev, category: "" }))
  }, [])

  // Handle adding a custom category
  const addCustomCategory = useCallback(() => {
    if (customCategory.trim()) {
      if (selectedCategory === customCategory.trim()) {
        message.error("Category already selected.")
        return
      }
      setSelectedCategory(customCategory.trim())
      setCustomCategory("")
      setCategoryError(false)
    }
  }, [customCategory, selectedCategory])

  // Handle table of contents toggle
  const handleCheckboxChange = useCallback(e => {
    setIncludeTableOfContents(e.target.checked)
  }, [])

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors = {
      category: "",
      platform: "",
    }
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
        message.error(errors.platform)
      } else if (errors.category) {
        message.error(errors.category)
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

  const handleCategoryChange = useCallback(value => {
    if (value.length > 1) {
      message.error("Only one category can be selected.")
      return
    }
    const newCategory = value.length > 0 ? value[0] : ""
    setSelectedCategory(newCategory)
    setCategoryError(false)
    setErrors(prev => ({ ...prev, category: "" }))
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

      // Reset categories in Redux store
      dispatch(resetCategories())
    }
  }, [isCategoryModalOpen, initialIncludeTableOfContents, dispatch])

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
    <Modal
      title="Select Category"
      open={isCategoryModalOpen}
      onCancel={handleCancel}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Cancel category selection"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Confirm category selection"
          >
            Confirm
          </Button>
        </div>
      }
      centered
      width={600}
    >
      <div className="p-3 space-y-4">
        {integrations?.integrations && Object.keys(integrations.integrations).length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">
              Select Your Publishing Platform
              <p className="text-xs text-gray-500 mt-1">
                Post your blog automatically to connected platforms only.
              </p>
            </span>

            <Select
              className={`w-full mt-2 ${platformError ? "border-red-500" : ""}`}
              placeholder="Select platform"
              value={selectedIntegration?.rawPlatform || undefined}
              onChange={platform => {
                const details = integrations.integrations[platform]
                handleIntegrationChange(platform, details?.url)
              }}
              status={platformError ? "error" : ""}
            >
              {Object.entries(integrations.integrations).map(([platform, details]) => (
                <Option key={platform} value={platform}>
                  {platform}
                </Option>
              ))}
            </Select>
            {platformError && errors.platform && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-red-500"
              >
                {errors.platform}
              </motion.p>
            )}
          </div>
        )}
        {/* Selected Category Display */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm w-fit"
            >
              <span className="truncate max-w-[150px]">{selectedCategory}</span>
              {!isCategoryLocked && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCategoryRemove}
                  className="text-white hover:text-gray-200"
                  aria-label={`Remove category ${selectedCategory}`}
                >
                  <X size={15} />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-Generated Categories Section */}
        {!wordpressError && categories?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Auto-Generated Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-3 rounded-md border border-indigo-200 bg-indigo-50 max-h-96">
              {categories.map(category => (
                <motion.div
                  key={category}
                  onClick={() => !isCategoryLocked && handleCategoryAdd(category)}
                  whileHover={{ scale: 1.02, backgroundColor: "#e0e7ff" }}
                  className={`flex items-center justify-between p-3 rounded-md bg-white border ${
                    categoryError && !selectedCategory ? "border-red-500" : "border-indigo-200"
                  } text-sm font-medium cursor-pointer transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-indigo-100 border-indigo-400"
                      : selectedCategory
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <span className="truncate">{category}</span>
                  {!selectedCategory && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-indigo-600 hover:text-indigo-700"
                      aria-label={`Add category ${category}`}
                    >
                      <Plus size={16} />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Select or Add Category</h3>
          <Select
            mode="tags"
            placeholder="Select or type a category"
            value={selectedCategory ? [selectedCategory] : []}
            onChange={handleCategoryChange}
            disabled={isCategoryLocked}
            className="w-full"
            allowClear
            showSearch
            status={categoryError ? "error" : ""}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={POPULAR_CATEGORIES.map(category => ({
              value: category,
              label: category,
            }))}
            styles={{ popup: { root: { borderRadius: "8px" } } }}
            aria-label="Select or add a category"
          />
          {categoryError && errors.category && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-red-500"
            >
              {errors.category}
            </motion.p>
          )}
        </div>

        {selectedIntegration?.platform === "shopify" && (
          <div
            className={`p-3 rounded-md text-sm ${
              isCategoryLocked
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-blue-100 text-blue-700 border border-blue-300"
            }`}
          >
            {isCategoryLocked
              ? "This blog was already published on Shopify. Category is locked and cannot be changed."
              : "Once you publish on Shopify, the category becomes permanent and cannot be changed later."}
          </div>
        )}

        {/* Table of Contents Toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            Include Table of Contents
            <p className="text-xs text-gray-500">Generate a table of contents for each blog.</p>
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="includeTableOfContents"
              checked={includeTableOfContents}
              onChange={handleCheckboxChange}
              className="sr-only peer"
              aria-label="Toggle table of contents"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </Modal>
  )
}

export default CategoriesModal
