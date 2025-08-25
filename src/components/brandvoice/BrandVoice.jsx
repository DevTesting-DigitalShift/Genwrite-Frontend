import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { FaEdit, FaTimes } from "react-icons/fa"
import { useDispatch, useSelector } from "react-redux"
import { Info, Loader2, Upload } from "lucide-react"
import { Helmet } from "react-helmet"
import { Modal, Tooltip, message } from "antd"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createBrandVoiceThunk,
  deleteBrandVoiceThunk,
  fetchBrands,
  fetchSiteInfo,
  updateBrandVoiceThunk,
  resetSiteInfo,
} from "@store/slices/brandSlice"

const BrandVoice = () => {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient() // Added for cache management
  const [inputValue, setInputValue] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    nameOfVoice: "",
    postLink: "",
    keywords: [],
    describeBrand: "",
    sitemapUrl: "",
    selectedVoice: null,
    _id: undefined,
  })
  const [errors, setErrors] = useState({})
  const { siteInfo } = useSelector((state) => state.brand)
  const [lastScrapedUrl, setLastScrapedUrl] = useState("")
  const [isFormReset, setIsFormReset] = useState(false)
  const {
    data: brands = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await dispatch(fetchBrands()).unwrap() // Dispatch and unwrap the payload
      return response // Return the brands data
    },
    // staleTime: 5 * 60 * 1000,
    // cacheTime: 10 * 60 * 1000,
  })

  // Reset form on mount and unmount (page change)
  useEffect(() => {
    if (!formData._id) {
      resetForm()
    }
    return () => {
      resetForm()
      dispatch(resetSiteInfo()) // Clear siteInfo on unmount
    }
  }, [dispatch])

  // Populate form with fetched siteInfo data
  useEffect(() => {
    if (siteInfo.data && !isFormReset) {
      setFormData((prev) => ({
        ...prev,
        nameOfVoice: siteInfo.data.nameOfVoice || prev.nameOfVoice,
        describeBrand: siteInfo.data.describeBrand || prev.describeBrand,
        keywords: siteInfo.data.keywords || prev.keywords,
        postLink: siteInfo.data.postLink || prev.postLink,
        sitemapUrl: siteInfo.data.sitemap || prev.sitemapUrl,
      }))
      setErrors((prev) => ({
        ...prev,
        nameOfVoice: undefined,
        describeBrand: undefined,
        keywords: undefined,
        postLink: undefined,
        sitemapUrl: undefined,
      }))
      setLastScrapedUrl(formData.postLink)
    }
  }, [siteInfo, formData.postLink, isFormReset])

  // Reset form function
  const resetForm = useCallback(() => {
    setFormData({
      nameOfVoice: "",
      postLink: "",
      keywords: [],
      describeBrand: "",
      sitemapUrl: "",
      selectedVoice: brands && brands.length > 0 ? brands[0] : null,
      _id: undefined,
    })
    setInputValue("")
    setErrors({})
    setLastScrapedUrl("")
    setIsFormReset(true) // Set flag to prevent siteInfo repopulation
  }, [brands])

  // Validate form fields
  const validateForm = useCallback(() => {
    const newErrors = {}
    if (!formData.nameOfVoice.trim()) {
      newErrors.nameOfVoice = "Name of Voice is required."
    }
    if (!formData.postLink.trim()) {
      newErrors.postLink = "Post link is required."
    } else {
      try {
        new URL(formData.postLink)
      } catch {
        newErrors.postLink = "Please enter a valid URL (e.g., https://example.com)."
      }
    }
    if (formData.keywords.length === 0) {
      newErrors.keywords = "At least one keyword is required."
    }
    if (!formData.describeBrand.trim()) {
      newErrors.describeBrand = "Brand description is required."
    }
    if (!formData.sitemapUrl.trim()) {
      newErrors.sitemapUrl = "Sitemap URL is required."
    } else {
      try {
        new URL(formData.sitemapUrl)
      } catch {
        newErrors.sitemapUrl = "Please enter a valid URL (e.g., https://example.com/sitemap.xml)."
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle form input changes
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, [name]: undefined }))
      if (name === "postLink" && value !== lastScrapedUrl) {
        setLastScrapedUrl("")
      }
      setIsFormReset(false) // Allow siteInfo to populate if user edits
    },
    [lastScrapedUrl]
  )

  // Handle keyword input
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && inputValue.trim()) {
        event.preventDefault()
        const existing = formData.keywords.map((k) => k.toLowerCase())
        const seen = new Set()
        const newKeywords = inputValue
          .split(",")
          .map((k) => k.trim())
          .filter((k) => {
            const lower = k.toLowerCase()
            if (!k || existing.includes(lower) || seen.has(lower)) return false
            seen.add(lower)
            return true
          })
        if (newKeywords.length === 0) return
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...newKeywords],
        }))
        setInputValue("")
        setErrors((prev) => ({ ...prev, keywords: undefined }))
        setIsFormReset(false)
      }
    },
    [inputValue, formData.keywords]
  )

  // Remove keyword
  const removeKeyword = useCallback((keyword) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }))
    setIsFormReset(false)
  }, [])

  // Handle CSV file upload for keywords
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) {
      message.error("Invalid file type. Please upload a .csv file.")
      event.target.value = null
      return
    }
    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      message.error("File size exceeds 20KB limit. Please upload a smaller file.")
      event.target.value = null
      return
    }
    if (file.type !== "text/csv") {
      message.error("Please upload a valid CSV file.")
      event.target.value = null
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const keywords = text
        .split(/,|\n|;/)
        .map((kw) => kw.trim())
        .filter((kw) => kw.length > 0)
      setFormData((prev) => ({
        ...prev,
        keywords: [...new Set([...prev.keywords, ...keywords])],
      }))
      setErrors((prev) => ({ ...prev, keywords: undefined }))
      setIsFormReset(false)
    }
    reader.onerror = () => message.error("Error reading CSV file.")
    reader.readAsText(file)
    event.target.value = null
  }, [])

  // Save or update brand voice
  const handleSave = useCallback(async () => {
    if (!validateForm()) return
    setIsUploading(true)
    const payload = {
      nameOfVoice: formData.nameOfVoice.trim(),
      postLink: formData.postLink.trim(),
      keywords: formData.keywords.map((k) => k.trim()).filter(Boolean),
      describeBrand: formData.describeBrand.trim(),
      sitemap: formData.sitemapUrl.trim(),
      userId: user?._id,
    }

    // Check for duplicate postLink
    const isDuplicate = brands.some(
      (brand) =>
        brand.postLink === payload.postLink && (formData._id ? brand._id !== formData._id : true)
    )

    if (isDuplicate) {
      message.error("A brand voice already exists with that name and link.")
      setIsUploading(false)
      return
    }

    try {
      if (formData._id) {
        await dispatch(updateBrandVoiceThunk({ id: formData._id, payload })).unwrap()
      } else {
        await dispatch(createBrandVoiceThunk({ payload })).unwrap()
      }
      resetForm()
      queryClient.invalidateQueries(["brands"])
      dispatch(resetSiteInfo()) // Clear siteInfo after save
    } catch (error) {
      console.error("Error saving brand voice:", error)
      message.error(
        formData._id ? "Failed to update brand voice." : "Failed to create brand voice."
      )
    } finally {
      setIsUploading(false)
    }
  }, [formData, user, dispatch, validateForm, resetForm, brands, queryClient])

  // Edit brand voice
  const handleEdit = useCallback((brand) => {
    setFormData({
      nameOfVoice: brand.nameOfVoice || "",
      postLink: brand.postLink || "",
      keywords: Array.isArray(brand.keywords) ? brand.keywords : [],
      describeBrand: brand.describeBrand || "",
      sitemapUrl: brand.sitemap || "",
      selectedVoice: brand,
      _id: brand._id,
    })
    setErrors({})
    setLastScrapedUrl(brand.postLink || "")
    setIsFormReset(false)
  }, [])

  // Delete brand voice
  const handleDelete = useCallback(
    (brand) => {
      Modal.confirm({
        title: "Delete Brand Voice?",
        content: "Are you sure you want to delete this brand voice? This action cannot be undone.",
        okText: "Delete",
        cancelText: "Cancel",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            // Optimistic update: Remove brand from cache immediately
            queryClient.setQueryData(["brands"], (oldBrands = []) =>
              oldBrands.filter((b) => b._id !== brand._id)
            )

            await dispatch(deleteBrandVoiceThunk({ id: brand._id })).unwrap()

            // Invalidate query to refetch latest data
            queryClient.invalidateQueries(["brands"])

            // Reset form if deleted brand was selected
            if (formData.selectedVoice?._id === brand._id) {
              resetForm()
              dispatch(resetSiteInfo())
            }
          } catch (error) {
            console.error("Failed to delete brand voice:", error)
            // Rollback optimistic update by invalidating query
            queryClient.invalidateQueries(["brands"])
          }
        },
      })
    },
    [dispatch, formData.selectedVoice, resetForm, queryClient]
  )

  // Select brand voice
  const handleSelect = useCallback((voice) => {
    setFormData((prev) => ({ ...prev, selectedVoice: voice }))
    setIsFormReset(false)
  }, [])

  // Fetch site info
  const handleFetchSiteInfo = useCallback(() => {
    const url = formData.postLink.trim()
    if (!url) {
      setErrors((prev) => ({
        ...prev,
        postLink: "Post link is required to fetch site info.",
      }))
      return
    }
    if (url === lastScrapedUrl) {
      message.info("This URL has already been fetched.")
      return
    }
    try {
      new URL(url)
      dispatch(fetchSiteInfo(url))
        .unwrap()
        .then(() => {
          setIsFormReset(false) // Allow form population
        })
    } catch {
      setErrors((prev) => ({
        ...prev,
        postLink: "Please enter a valid URL (e.g., https://example.com).",
      }))
    }
  }, [formData.postLink, lastScrapedUrl, dispatch])

  // Memoized keywords rendering
  const renderKeywords = useMemo(() => {
    const latestKeywords = formData.keywords.slice(-3)
    const remainingCount = formData.keywords.length - latestKeywords.length
    return (
      <div className={`flex flex-wrap gap-2 ${formData.keywords.length > 0 ? "mb-1" : "hidden"}`}>
        {remainingCount > 0 && (
          <motion.div
            className="flex items-center bg-indigo-100 text-indigo-700 rounded-md px-2 py-1 mr-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            title={`+${remainingCount} more keywords`}
          >
            <span className="text-sm">{`+${remainingCount}`}</span>
          </motion.div>
        )}
        {latestKeywords.map((keyword) => (
          <motion.div
            key={keyword}
            className="flex items-center w-fit bg-indigo-100 text-indigo-700 rounded-md px-2 py-1 mr-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm truncate max-w-[100px]">{keyword}</span>
            <FaTimes
              className="ml-1 cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                removeKeyword(keyword)
              }}
              aria-label={`Remove ${keyword}`}
            />
          </motion.div>
        ))}
      </div>
    )
  }, [formData.keywords, removeKeyword])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-7xl mx-auto"
    >
      <Helmet>
        <title>Brand Voice | GenWrite</title>
      </Helmet>

      {/* Left Section: Form */}
      <motion.div
        className="w-full lg:w-[60%] bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Create Your Brand Voice
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Define your brand's unique tone and style to ensure consistent content creation.
        </p>

        <div className="space-y-4">
          {/* Post Link */}
          <div>
            <label htmlFor="postLink" className="text-sm font-medium text-gray-700 flex gap-2 mb-1">
              Post or Blog Link <span className="text-red-500">*</span>
              <Tooltip
                title="Add a link of your home page to fetch site info"
                styles={{
                  body: {
                    backgroundColor: "#4169e1",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    maxWidth: "220px",
                  },
                }}
              >
                <span className="cursor-pointer">
                  <Info size={16} className="text-blue-500" />
                </span>
              </Tooltip>
            </label>
            <div className="flex gap-2">
              <motion.input
                id="postLink"
                type="url"
                name="postLink"
                value={formData.postLink}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com/blog"
                className={`flex-grow p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.postLink ? "border-red-500" : "border-gray-300"
                }`}
                whileFocus={{ scale: 1.01 }}
                aria-invalid={!!errors.postLink}
                aria-describedby={errors.postLink ? "postLink-error" : undefined}
              />
              <motion.button
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleFetchSiteInfo}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  siteInfo.loading || (formData.postLink && formData.postLink === lastScrapedUrl)
                }
                aria-label="Fetch Site Info"
              >
                {siteInfo.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Fetching...
                  </span>
                ) : (
                  "Fetch Site Info"
                )}
              </motion.button>
            </div>
            {errors.postLink && (
              <p id="postLink-error" className="text-red-500 text-xs mt-1">
                {errors.postLink}
              </p>
            )}
          </div>

          {/* Name of Voice */}
          <div>
            <label
              htmlFor="nameOfVoice"
              className="text-sm font-medium text-gray-700 flex gap-2 mb-1"
            >
              Name of Voice <span className="text-red-500">*</span>
            </label>
            <motion.input
              id="nameOfVoice"
              type="text"
              name="nameOfVoice"
              value={formData.nameOfVoice}
              onChange={handleInputChange}
              placeholder="e.g., Friendly Tech"
              className={`w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.nameOfVoice ? "border-red-500" : "border-gray-300"
              }`}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.nameOfVoice}
              aria-describedby={errors.nameOfVoice ? "nameOfVoice-error" : undefined}
            />
            {errors.nameOfVoice && (
              <p id="nameOfVoice-error" className="text-red-500 text-xs mt-1">
                {errors.nameOfVoice}
              </p>
            )}
          </div>

          {/* Keywords */}
          <div>
            <label htmlFor="keywords" className="text-sm font-medium text-gray-700 flex gap-2 mb-1">
              Keywords <span className="text-red-500">*</span>
              <Tooltip
                title="Upload a .csv file in the format: `Keyword` as header"
                styles={{
                  body: {
                    backgroundColor: "#4169e1",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    maxWidth: "220px",
                  },
                }}
              >
                <span className="cursor-pointer">
                  <Info size={16} className="text-blue-500" />
                </span>
              </Tooltip>
            </label>
            <motion.div
              className={`flex bg-white border rounded-lg p-2 flex-col gap-2 ${
                errors.keywords ? "border-red-500" : "border-gray-300"
              }`}
              whileHover={{ boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)" }}
            >
              {renderKeywords}
              <div className="flex-grow flex w-full items-center gap-2">
                <input
                  id="keywords"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-grow p-2 bg-transparent border-none outline-none text-sm"
                  placeholder="Type a keyword and press Enter"
                  aria-describedby={errors.keywords ? "keywords-error" : undefined}
                />
                <label htmlFor="file-upload" className="flex items-center cursor-pointer">
                  <motion.div
                    className="bg-indigo-100 p-2 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Upload CSV file"
                  >
                    <Upload size={20} className="text-indigo-600" />
                  </motion.div>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".csv"
                />
              </div>
            </motion.div>
            {errors.keywords && (
              <p id="keywords-error" className="text-red-500 text-xs mt-1">
                {errors.keywords}
              </p>
            )}
          </div>

          {/* Sitemap URL */}
          <div>
            <label
              htmlFor="sitemapUrl"
              className="text-sm font-medium text-gray-700 flex gap-2 mb-1"
            >
              Sitemap URL <span className="text-red-500">*</span>
              <Tooltip
                title="Paste the URL of your XML sitemap (e.g., https://example.com/sitemap.xml)"
                styles={{
                  body: {
                    backgroundColor: "#4169e1",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    maxWidth: "320px",
                  },
                }}
              >
                <span className="cursor-pointer">
                  <Info size={16} className="text-blue-500" />
                </span>
              </Tooltip>
            </label>
            <motion.input
              id="sitemapUrl"
              type="url"
              name="sitemapUrl"
              value={formData.sitemapUrl}
              onChange={handleInputChange}
              placeholder="e.g., https://example.com/sitemap.xml"
              className={`w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.sitemapUrl ? "border-red-500" : "border-gray-300"
              }`}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.sitemapUrl}
              aria-describedby={errors.sitemapUrl ? "sitemapUrl-error" : undefined}
            />
            {errors.sitemapUrl && (
              <p id="sitemapUrl-error" className="text-red-500 text-xs mt-1">
                {errors.sitemapUrl}
              </p>
            )}
          </div>

          {/* Brand Description */}
          <div>
            <label
              htmlFor="describeBrand"
              className="text-sm font-medium text-gray-700 flex gap-2 mb-1"
            >
              Describe Your Brand <span className="text-red-500">*</span>
            </label>
            <motion.textarea
              id="describeBrand"
              name="describeBrand"
              value={formData.describeBrand}
              onChange={handleInputChange}
              placeholder="Describe your brand's tone and personality"
              className={`w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.describeBrand ? "border-red-500" : "border-gray-300"
              }`}
              rows="4"
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.describeBrand}
              aria-describedby={errors.describeBrand ? "describeBrand-error" : undefined}
            />
            {errors.describeBrand && (
              <p id="describeBrand-error" className="text-red-500 text-xs mt-1">
                {errors.describeBrand}
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-2 justify-end">
            <motion.button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUploading}
              aria-label={formData._id ? "Update Brand Voice" : "Save Brand Voice"}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  Saving...
                </span>
              ) : formData._id ? (
                "Update Brand Voice"
              ) : (
                "Save Brand Voice"
              )}
            </motion.button>

            {/* Reset Button */}
            <motion.button
              className="bg-gradient-to-tr from-red-700 from-10% via-red-500 via-80% to-red-700 to-100% text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={resetForm}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUploading}
              aria-label="Clear Form"
            >
              Clear
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Right Section: Brand Voices List */}
      <motion.div
        className="w-full lg:w-[40%] bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        initial={{ x: 20 }}
        animate={{ x: 0 }}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Brand Voices</h2>
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          {brands.length > 0 ? (
            brands.map((item) => (
              <YourVoicesComponent
                key={item._id}
                id={item._id}
                brandName={item.nameOfVoice}
                brandVoice={item.describeBrand}
                onSelect={() => handleSelect(item)}
                isSelected={formData.selectedVoice?._id === item._id}
                onEdit={(e) => {
                  e.stopPropagation()
                  handleEdit(item)
                }}
                onDelete={(e) => {
                  e.stopPropagation()
                  handleDelete(item)
                }}
              />
            ))
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500 text-sm">
              No brand voices created yet. Start by adding one on the left.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

const YourVoicesComponent = ({
  id,
  brandName,
  brandVoice,
  onSelect,
  isSelected,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      className={`p-4 mt-2 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 shadow-md"
          : "bg-white border border-gray-200 hover:bg-gray-50"
      }`}
      onClick={onSelect}
      whileHover={{
        y: -2,
        boxShadow: "0 4px 15px rgba(99, 64, 241, 0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-label={`Select ${brandName} brand voice`}
    >
      <div className="flex justify-between items-center">
        <h3
          className={`font-medium text-sm ${
            isSelected ? "text-indigo-700" : "text-gray-700"
          } truncate max-w-[70%]`}
        >
          {brandName}
        </h3>
        <div className="flex space-x-2">
          <motion.button
            className="text-indigo-500 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            aria-label={`Edit ${brandName}`}
            title="Edit"
          >
            <FaEdit className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="text-gray-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            aria-label={`Delete ${brandName}`}
            title="Delete"
          >
            <img src="/Images/trash.png" alt="Delete" className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{brandVoice}</p>
    </motion.div>
  )
}

export default BrandVoice
