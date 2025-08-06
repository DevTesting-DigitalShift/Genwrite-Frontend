import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button, Modal, Select, message } from "antd"
import { useSelector } from "react-redux"
import { Plus, X } from "lucide-react"

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
  initialCategory = "",
  initialIncludeTableOfContents = false,
}) => {
  const [customCategory, setCustomCategory] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(
    initialIncludeTableOfContents
  )
  const [categoryError, setCategoryError] = useState(false)
  const { categories, error: wordpressError } = useSelector((state) => state.wordpress)

  // Handle adding a category (custom or predefined)
  const handleCategoryAdd = useCallback(
    (category) => {
      if (selectedCategory) {
        message.error("Only one category can be selected.")
        return
      }
      setSelectedCategory(category)
      setCategoryError(false)
    },
    [selectedCategory]
  )

  // Handle removing the selected category
  const handleCategoryRemove = useCallback(() => {
    setSelectedCategory("")
    setCategoryError(false)
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
  const handleCheckboxChange = useCallback((e) => {
    setIncludeTableOfContents(e.target.checked)
  }, [])

  // Handle modal submission
  const handleSubmit = useCallback(() => {
    if (!selectedCategory) {
      setCategoryError(true)
      message.error("Please select a category.")
      return
    }
    onSubmit({ category: selectedCategory, includeTableOfContents })
    setIsCategoryModalOpen(false)
    setSelectedCategory("")
    setIncludeTableOfContents(false)
    setCustomCategory("")
    setCategoryError(false)
  }, [selectedCategory, includeTableOfContents, onSubmit, setIsCategoryModalOpen])

  // Handle modal cancellation
  const handleCancel = useCallback(() => {
    setIsCategoryModalOpen(false)
    setSelectedCategory("")
    setIncludeTableOfContents(false)
    setCustomCategory("")
    setCategoryError(false)
  }, [setIsCategoryModalOpen])

  const handleCategoryChange = useCallback((value) => {
    if (value.length > 1) {
      message.error("Only one category can be selected.")
      return
    }
    const newCategory = value.length > 0 ? value[0] : ""
    setSelectedCategory(newCategory)
    setCategoryError(false)
  }, [])

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
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCategoryRemove}
                className="text-white hover:text-gray-200"
                aria-label={`Remove category ${selectedCategory}`}
              >
                <X size={15} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-Generated Categories Section */}
        {!wordpressError && categories?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Auto-Generated Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-3 rounded-md border border-indigo-200 bg-indigo-50 max-h-96">
              {categories.map((category) => (
                <motion.div
                  key={category.id || category.name}
                  onClick={() => handleCategoryAdd(category.name)}
                  whileHover={{ scale: 1.02, backgroundColor: "#e0e7ff" }}
                  className={`flex items-center justify-between p-3 rounded-md bg-white border ${
                    categoryError && !selectedCategory ? "border-red-500" : "border-indigo-200"
                  } text-sm font-medium cursor-pointer transition-all duration-200 ${
                    selectedCategory === category.name
                      ? "bg-indigo-100 border-indigo-400"
                      : selectedCategory
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <span className="truncate">{category.name}</span>
                  {!selectedCategory && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-indigo-600 hover:text-indigo-700"
                      aria-label={`Add category ${category.name}`}
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
            className="w-full"
            allowClear
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={POPULAR_CATEGORIES.map((category) => ({
              value: category,
              label: category,
            }))}
            dropdownStyle={{ borderRadius: "8px" }}
            popupClassName="rounded-lg"
            aria-label="Select or add a category"
          />
          {categoryError && !selectedCategory && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-red-500"
            >
              Please select a category
            </motion.p>
          )}
        </div>

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
