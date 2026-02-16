import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { FaEdit, FaTimes } from "react-icons/fa"
import useAuthStore from "@store/useAuthStore"
import useBrandStore from "@store/useBrandStore"
import { Info, Loader2, Trash, Upload, RefreshCcw } from "lucide-react"
import { Helmet } from "react-helmet"
import { Modal, Tooltip, message, Button } from "antd"
import BrandVoicesComponent from "@components/BrandVoiceComponent"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import UpgradeModal from "@components/UpgradeModal"
import { brandsQuery } from "@api/Brand/Brand.query"
import { useEntityMutations } from "@/hooks/useEntityMutation"

const BrandVoice = () => {
  const { user } = useAuthStore()
  const { siteInfo, fetchSiteInfo, resetSiteInfo } = useBrandStore()
  const [inputValue, setInputValue] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const [formData, setFormData] = useState({
    nameOfVoice: "",
    postLink: "",
    keywords: [],
    describeBrand: "",
    sitemapUrl: "",
    persona: "",
    selectedVoice: null,
    _id: undefined,
  })
  const [errors, setErrors] = useState({})
  const [lastScrapedUrl, setLastScrapedUrl] = useState("")
  const [isFormReset, setIsFormReset] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)

  const totalCredits = user?.credits?.base + user?.credits?.extra

  const showTrialMessage =
    totalCredits === 0 &&
    user?.subscription?.plan === "free" &&
    user?.subscription?.status === "unpaid"

  if (showTrialMessage) {
    return <UpgradeModal featureName="Brand Voice" />
  }

  const { brand: brandVoiceMutations } = useEntityMutations()

  const { data: brands = [], isLoading, error } = brandsQuery.useList()

  useEffect(() => {
    if (!formData._id) {
      resetForm()
    }
  }, [])

  useEffect(() => {
    if (siteInfo.data && !isFormReset) {
      setFormData(prev => ({
        ...prev,
        nameOfVoice: siteInfo.data.nameOfVoice || prev.nameOfVoice,
        describeBrand: siteInfo.data.describeBrand || prev.describeBrand,
        keywords: siteInfo.data.keywords || prev.keywords,
        postLink: siteInfo.data.postLink || prev.postLink,
        sitemapUrl: siteInfo.data.sitemap || prev.sitemapUrl,
        persona: siteInfo.data.persona || prev.persona,
      }))
      setErrors(prev => ({
        ...prev,
        nameOfVoice: undefined,
        describeBrand: undefined,
        keywords: undefined,
        postLink: undefined,
        sitemapUrl: undefined,
        persona: undefined,
      }))
      setLastScrapedUrl(formData.postLink)
    }
  }, [siteInfo, formData.postLink, isFormReset])

  const resetForm = useCallback(() => {
    setFormData({
      nameOfVoice: "",
      postLink: "",
      keywords: [],
      describeBrand: "",
      sitemapUrl: "",
      persona: "",
      selectedVoice: brands && brands.length > 0 ? brands[0] : null,
      _id: undefined,
    })
    setInputValue("")
    setErrors({})
    setLastScrapedUrl("")
    setIsFormReset(true)
    setShowAllKeywords(false)
    resetSiteInfo()
  }, [brands, resetSiteInfo])

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
    if (!formData.persona.trim()) {
      newErrors.persona = "Persona is required."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleInputChange = useCallback(
    e => {
      const { name, value } = e.target
      setFormData(prev => ({ ...prev, [name]: value }))
      setErrors(prev => ({ ...prev, [name]: undefined }))
      if (name === "postLink" && value !== lastScrapedUrl) {
        setLastScrapedUrl("")
      }
      setIsFormReset(false)
    },
    [lastScrapedUrl]
  )

  const handleKeyDown = useCallback(
    event => {
      if (event.key === "Enter" && inputValue.trim()) {
        event.preventDefault()
        const existing = formData.keywords.map(k => k.toLowerCase())
        const seen = new Set()
        const newKeywords = inputValue
          .split(",")
          .map(k => k.trim())
          .filter(k => {
            const lower = k.toLowerCase()
            if (!k || existing.includes(lower) || seen.has(lower)) return false
            seen.add(lower)
            return true
          })
        if (newKeywords.length === 0) return
        setFormData(prev => ({ ...prev, keywords: [...prev.keywords, ...newKeywords] }))
        setInputValue("")
        setErrors(prev => ({ ...prev, keywords: undefined }))
        setIsFormReset(false)
      }
    },
    [inputValue, formData.keywords]
  )

  const removeKeyword = useCallback(keyword => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keyword) }))
    setIsFormReset(false)
  }, [])

  const handleFileChange = useCallback(event => {
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
    reader.onload = e => {
      const text = e.target.result
      const keywords = text
        .split(/,|\n|;/)
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0)
      setFormData(prev => ({ ...prev, keywords: [...new Set([...prev.keywords, ...keywords])] }))
      setErrors(prev => ({ ...prev, keywords: undefined }))
      setIsFormReset(false)
    }
    reader.onerror = () => message.error("Error reading CSV file.")
    reader.readAsText(file)
    event.target.value = null
  }, [])

  const handleSave = useCallback(async () => {
    if (!validateForm()) return
    setIsUploading(true)
    const payload = {
      nameOfVoice: formData.nameOfVoice.trim(),
      postLink: formData.postLink.trim(),
      keywords: formData.keywords.map(k => k.trim()).filter(Boolean),
      describeBrand: formData.describeBrand.trim(),
      sitemap: formData.sitemapUrl.trim(),
      persona: formData.persona.trim(),
    }

    const isDuplicate = brands.some(
      brand =>
        brand.postLink === payload.postLink && (formData._id ? brand._id !== formData._id : true)
    )

    if (isDuplicate) {
      message.error("A brand voice already exists with that name and link.")
      setIsUploading(false)
      return
    }

    try {
      if (formData._id) {
        await brandVoiceMutations.update.mutateAsync({ id: formData._id, data: payload })
      } else {
        await brandVoiceMutations.create.mutateAsync(payload)
      }
      resetForm()
      // queryClient.invalidateQueries(["brands"])
    } catch (error) {
      console.error("Error saving brand voice:", error)
    } finally {
      setIsUploading(false)
    }
  }, [formData, user, validateForm, resetForm, brands, brandVoiceMutations])

  const handleEdit = useCallback(brand => {
    setFormData({
      nameOfVoice: brand.nameOfVoice || "",
      postLink: brand.postLink || "",
      keywords: Array.isArray(brand.keywords) ? brand.keywords : [],
      describeBrand: brand.describeBrand || "",
      sitemapUrl: brand.sitemap || "",
      persona: brand.persona || "",
      selectedVoice: brand,
      _id: brand._id,
    })
    setErrors({})
    setLastScrapedUrl(brand.postLink || "")
    setIsFormReset(false)
    setShowAllKeywords(false)
  }, [])

  const handleDelete = useCallback(
    brand => {
      handlePopup({
        title: "Delete Brand Voice?",
        description: (
          <span className="my-2">
            Are you sure you want to delete <b>{brand.name}</b>? This action cannot be undone.
          </span>
        ),
        confirmText: "Delete",
        onConfirm: async () => {
          try {
            await brandVoiceMutations.delete.mutateAsync(brand._id)
            if (formData?.selectedVoice?._id === brand._id) {
              resetForm()
            }
          } catch (error) {
            console.error("Failed to delete brand voice:", error)
            message.error("Failed to delete Brand Voice")
          }
        },
        confirmProps: {
          type: "text",
          className: "border-red-500 hover:bg-red-500 bg-red-100 text-red-600",
        },
        cancelProps: { danger: false },
      })
    },
    [brandVoiceMutations, formData.selectedVoice, resetForm]
  )

  const handleSelect = useCallback(voice => {
    setFormData(prev => ({ ...prev, selectedVoice: voice }))
    setIsFormReset(false)
  }, [])

  const handleFetchSiteInfo = useCallback(() => {
    const url = formData.postLink.trim()
    if (!url) {
      setErrors(prev => ({ ...prev, postLink: "Post link is required to fetch site info." }))
      return
    }
    if (url === lastScrapedUrl) {
      message.info("This URL has already been fetched.")
      return
    }
    try {
      new URL(url)
      fetchSiteInfo(url)
        .then(() => {
          setIsFormReset(false)
        })
        .catch(() => message.error("Failed to fetch site info. Please try a different URL."))
    } catch {
      setErrors(prev => ({
        ...prev,
        postLink: "Please enter a valid URL (e.g., https://example.com).",
      }))
    }
  }, [formData.postLink, lastScrapedUrl])

  const handleRefresh = async () => {
    // queryClient.invalidateQueries(["brands"])
    await brandsQuery.invalidateList()
  }

  const renderKeywords = useMemo(() => {
    const maxInitialKeywords = 12
    const displayedKeywords = showAllKeywords
      ? formData.keywords
      : formData.keywords.slice(0, maxInitialKeywords)
    const remainingCount = formData.keywords.length - maxInitialKeywords
    return (
      <div className={`flex flex-wrap gap-2 ${formData.keywords.length > 0 ? "mb-1" : "hidden"}`}>
        {displayedKeywords.map(keyword => (
          <motion.div
            key={keyword}
            className="flex items-center bg-indigo-100 text-indigo-700 rounded-md px-2 sm:px-3 py-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[120px]">
              {keyword}
            </span>
            <FaTimes
              className="ml-1 cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors w-3 sm:w-4 h-3 sm:h-4"
              onClick={e => {
                e.stopPropagation()
                removeKeyword(keyword)
              }}
              aria-label={`Remove ${keyword}`}
            />
          </motion.div>
        ))}
        {remainingCount > 0 && (
          <button
            type="button"
            className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => setShowAllKeywords(!showAllKeywords)}
          >
            {showAllKeywords ? "Show Less" : `Show More (+${remainingCount})`}
          </button>
        )}
      </div>
    )
  }, [formData.keywords, removeKeyword, showAllKeywords])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto"
    >
      <Helmet>
        <title>Brand Voice | GenWrite</title>
      </Helmet>

      <motion.div
        className="w-full lg:w-[60%] bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Your Brand Voice
          </h1>
        </div>
        <p className="text-gray-600 text-sm mb-4 sm:mb-6">
          Define your brand's unique tone and style to ensure consistent content creation.
        </p>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="postLink" className="text-sm font-medium text-gray-700 flex gap-2 mb-1">
              Post or Blog Link <span className="text-red-500">*</span>
              <Tooltip
                title="Add a link of your home page to fetch site info"
                styles={{
                  backgroundColor: "#4169e1",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  maxWidth: "220px",
                }}
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </Tooltip>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <motion.input
                id="postLink"
                type="url"
                name="postLink"
                value={formData.postLink}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com/blog"
                className={`flex-grow p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base ${
                  errors.postLink ? "border-red-500" : "border-gray-300"
                }`}
                whileFocus={{ scale: 1.01 }}
                aria-invalid={!!errors.postLink}
                aria-describedby={errors.postLink ? "postLink-error" : undefined}
              />
              <motion.button
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                onClick={handleFetchSiteInfo}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  siteInfo.loading ||
                  (formData.postLink && formData.postLink === lastScrapedUrl) ||
                  showTrialMessage
                }
                aria-label="Fetch Site Info"
              >
                {siteInfo.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 sm:w-5 h-4 sm:h-5" />
                    Fetching...
                  </span>
                ) : (
                  "Fetch Site Info"
                )}
              </motion.button>
            </div>
            {errors.postLink && (
              <p id="postLink-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.postLink}
              </p>
            )}
          </div>

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
              className={`w-full p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base ${
                errors.nameOfVoice ? "border-red-500" : "border-gray-300"
              }`}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.nameOfVoice}
              aria-describedby={errors.nameOfVoice ? "nameOfVoice-error" : undefined}
            />
            {errors.nameOfVoice && (
              <p id="nameOfVoice-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.nameOfVoice}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="keywords" className="text-sm font-medium text-gray-700 flex gap-2 mb-1">
              Keywords <span className="text-red-500">*</span>
              <Tooltip
                title="Upload a .csv file in the format: `Keyword` as header"
                styles={{
                  backgroundColor: "#4169e1",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  maxWidth: "220px",
                }}
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </Tooltip>
            </label>
            <motion.div
              className={`flex bg-white border rounded-lg p-2 sm:p-3 flex-col gap-2 ${
                errors.keywords ? "border-red-500" : "border-gray-300"
              }`}
              whileHover={{ boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)" }}
            >
              {renderKeywords}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  id="keywords"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-grow bg-transparent border-none outline-none text-sm sm:text-base"
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
                    <Upload className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />
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
              <p id="keywords-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.keywords}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sitemapUrl"
              className="text-sm font-medium text-gray-700 flex gap-2 mb-1"
            >
              Sitemap URL <span className="text-red-500">*</span>
              <Tooltip
                title="Paste the URL of your XML sitemap (e.g., https://example.com/sitemap.xml)"
                styles={{
                  backgroundColor: "#4169e1",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  maxWidth: "320px",
                }}
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
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
              className={`w-full p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base ${
                errors.sitemapUrl ? "border-red-500" : "border-gray-300"
              }`}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.sitemapUrl}
              aria-describedby={errors.sitemapUrl ? "sitemapUrl-error" : undefined}
            />
            {errors.sitemapUrl && (
              <p id="sitemapUrl-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.sitemapUrl}
              </p>
            )}
          </div>

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
              className={`w-full p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base ${
                errors.describeBrand ? "border-red-500" : "border-gray-300"
              }`}
              rows={4}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.describeBrand}
              aria-describedby={errors.describeBrand ? "describeBrand-error" : undefined}
            />
            {errors.describeBrand && (
              <p id="describeBrand-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.describeBrand}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="persona" className="text-sm font-medium text-gray-700 flex gap-2 mb-1">
              Author Persona <span className="text-red-500">*</span>
              <Tooltip
                title="Describe the author's bio, writing style, tones (e.g., professional, casual), dialect preferences, target audiences, and brand identities. This helps generate content that resonates with your brand voice."
                styles={{
                  backgroundColor: "#4169e1",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  maxWidth: "320px",
                }}
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </Tooltip>
            </label>
            <motion.textarea
              id="persona"
              name="persona"
              value={formData.persona}
              onChange={handleInputChange}
              placeholder="e.g., A seasoned tech blogger with a friendly, conversational tone. Writes for developers and startup founders. Uses American English with occasional technical jargon."
              className={`w-full p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base ${
                errors.persona ? "border-red-500" : "border-gray-300"
              }`}
              rows={3}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.persona}
              aria-describedby={errors.persona ? "persona-error" : undefined}
            />
            {errors.persona && (
              <p id="persona-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.persona}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
            <motion.button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              onClick={handleSave}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUploading || showTrialMessage}
              aria-label={formData._id ? "Update Brand Voice" : "Save Brand Voice"}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 sm:w-5 h-4 sm:h-5" />
                  Saving...
                </span>
              ) : formData._id ? (
                "Update Brand Voice"
              ) : (
                "Save Brand Voice"
              )}
            </motion.button>

            <motion.button
              className="bg-gradient-to-tr from-red-700 from-10% via-red-500 via-80% to-red-700 to-100% text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

      <motion.div
        className="w-full lg:w-[40%] bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100"
        initial={{ x: 20 }}
        animate={{ x: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
            Your Brand Voices
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-xs sm:text-sm px-4 py-2"
            />
          </motion.div>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-250px)]">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
          ) : brands.length > 0 ? (
            brands.map(item => (
              <BrandVoicesComponent
                key={item._id}
                id={item._id}
                brandName={item.nameOfVoice}
                brandVoice={item.describeBrand}
                onSelect={() => handleSelect(item)}
                isSelected={formData.selectedVoice?._id === item._id}
                onEdit={e => {
                  e.stopPropagation()
                  handleEdit(item)
                }}
                onDelete={e => {
                  e.stopPropagation()
                  handleDelete(item)
                }}
              />
            ))
          ) : (
            <div className="p-4 sm:p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500 text-xs sm:text-sm">
              No brand voices created yet. Start by adding one on the left.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default BrandVoice
