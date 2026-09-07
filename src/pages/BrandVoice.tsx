import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { FaTimes } from "react-icons/fa"
import useAuthStore from "@store/useAuthStore"
import useBrandStore from "@store/useBrandStore"
import { Info, Loader2, Upload, RefreshCcw, X } from "lucide-react"
import { Helmet } from "react-helmet"
import BrandVoicesComponent from "@components/BrandVoiceComponent"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import UpgradeModal from "@components/UpgradeModal"
import { brandsQuery } from "@api/Brand/Brand.query"
import { useEntityMutations } from "@/hooks/useEntityMutation"
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard"
import { toast } from "sonner"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"
import { VALID_IMAGE_CONFIG } from "@/data/blogData"
import { uploadImage } from "@api/imageGalleryApi"
import { useZodForm } from "@/lib/forms"
import {
  brandVoiceFormDefaults,
  brandVoiceFormSchema,
  toBrandVoicePayload,
} from "@/forms/brandVoiceForm"

// Stable reference for the "no brands yet" case. An inline `= []` default would build a
// fresh array on every render, changing `resetForm`'s identity each time, which made the
// reset effect below re-fire forever ("Maximum update depth exceeded") whenever the
// brands request failed and `data` stayed undefined.
const NO_BRANDS = []

const BrandVoice = () => {
  const { user } = useAuthStore()
  const { siteInfo, fetchSiteInfo, resetSiteInfo } = useBrandStore()
  const [inputValue, setInputValue] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { handlePopup } = useConfirmPopup()
  // Form state and its validation both live in `brandVoiceFormSchema`; the request
  // body comes from `toBrandVoicePayload`, so page state (`_id`, `selectedVoice`)
  // cannot leak into it.
  const {
    watch,
    setValue,
    getValues,
    getFieldState,
    reset,
    setError,
    clearErrors,
    handleSubmit: submitForm,
    formState: { errors },
  } = useZodForm(brandVoiceFormSchema, brandVoiceFormDefaults)

  const formData = watch()

  /**
   * Writes one field. Validation only re-runs for a field that is *already* showing
   * an error, so messages appear on Next/Submit and then clear as the user fixes
   * them — they never pop up while the form is still being filled in.
   */
  const setField = useCallback(
    (name: any, value: any) =>
      setValue(name, value, {
        shouldValidate: !!getFieldState(name).error,
        shouldDirty: true,
      }),
    [setValue, getFieldState]
  )

  /** Sets or clears one message — an empty string means "this is fine now". */
  const setFieldError = useCallback(
    (name: any, message: any) => (message ? setError(name, { message }) : clearErrors(name)),
    [setError, clearErrors]
  )
  const [lastScrapedUrl, setLastScrapedUrl] = useState("")
  const [isFormReset, setIsFormReset] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)

  const totalCredits = user?.credits?.base + user?.credits?.extra

  const showTrialMessage =
    totalCredits === 0 &&
    user?.subscription?.plan === "free" &&
    user?.subscription?.status === "unpaid"

  const { brand: brandVoiceMutations } = useEntityMutations()
  const { isReadOnlyWorkspace, readOnlyMessage } = useReadOnlyGuard()

  const { data: brands = NO_BRANDS, isLoading } = brandsQuery.useList()

  const resetForm = useCallback(() => {
    reset({
      ...brandVoiceFormDefaults,
      selectedVoice: brands && brands.length > 0 ? brands[0] : null,
    })
    setInputValue("")
    setLastScrapedUrl("")
    setIsFormReset(true)
    setShowAllKeywords(false)
    resetSiteInfo()
  }, [brands, resetSiteInfo, reset])

  // Held in a ref so the effect below keys off the *editing state* only. Depending on
  // `resetForm` directly re-fired it on every identity change of `brands` — on mount that
  // was an infinite loop, and after mount a background refetch would silently wipe a
  // half-filled new-brand form.
  const resetFormRef = useRef(resetForm)
  resetFormRef.current = resetForm

  useEffect(() => {
    if (!formData._id) {
      resetFormRef.current()
    }
  }, [formData._id])

  useEffect(() => {
    if (siteInfo.data && !isFormReset) {
      const current = getValues()
      setField("nameOfVoice", siteInfo.data.nameOfVoice || current.nameOfVoice)
      setField("describeBrand", siteInfo.data.describeBrand || current.describeBrand)
      setField("keywords", siteInfo.data.keywords || current.keywords)
      setField("postLink", siteInfo.data.postLink || current.postLink)
      setField("sitemapUrl", siteInfo.data.sitemap || current.sitemapUrl)
      setField("logoUrl", siteInfo.data.logoUrl || current.logoUrl)
      setField("persona", siteInfo.data.persona || current.persona)
      clearErrors(["nameOfVoice", "describeBrand", "keywords", "postLink", "sitemapUrl", "persona"])
      setLastScrapedUrl(current.postLink)
    }
  }, [siteInfo, isFormReset, getValues, setField, clearErrors])

  const handleInputChange = useCallback(
    (e: any) => {
      const { name, value } = e.target
      setField(name, value)
      clearErrors(name)
      if (name === "postLink" && value !== lastScrapedUrl) {
        setLastScrapedUrl("")
      }
      setIsFormReset(false)
    },
    [lastScrapedUrl, setField, clearErrors]
  )

  const handleKeyDown = useCallback(
    (event: any) => {
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
        setField("keywords", [...formData.keywords, ...newKeywords])
        setInputValue("")
        clearErrors("keywords")
        setIsFormReset(false)
      }
    },
    [inputValue, formData.keywords, setField, clearErrors]
  )

  const handlePasteKeywords = useCallback(
    (event: any) => {
      extractKeywordsFromClipboard(event, {
        type: "keywords",
        cb: (items) => {
          const existing = new Set(formData.keywords.map((keyword) => keyword.trim().toLowerCase()))
          const seen = new Set()
          const newKeywords = items.filter((keyword) => {
            const normalizedKeyword = keyword.toLowerCase()
            if (!keyword || existing.has(normalizedKeyword) || seen.has(normalizedKeyword)) {
              return false
            }
            seen.add(normalizedKeyword)
            return true
          })

          if (newKeywords.length === 0) return

          setField("keywords", [...formData.keywords, ...newKeywords])
          setInputValue("")
          clearErrors("keywords")
          setIsFormReset(false)
        },
      })
    },
    [formData.keywords, setField, clearErrors]
  )

  const removeKeyword = useCallback(
    (keyword: any) => {
      setField(
        "keywords",
        getValues("keywords").filter((k) => k !== keyword)
      )
      setIsFormReset(false)
    },
    [setField, getValues]
  )

  const handleFileChange = useCallback((event: any) => {
    const file = event.target.files[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file type. Please upload a .csv file.")
      event.target.value = null
      return
    }
    const maxSizeInBytes = 20 * 1024
    if (file.size > maxSizeInBytes) {
      toast.error("File size exceeds 20KB limit. Please upload a smaller file.")
      event.target.value = null
      return
    }
    if (file.type !== "text/csv") {
      toast.error("Please upload a valid CSV file.")
      event.target.value = null
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const keywords = text
        .split(/,|\n|;/)
        .map((kw: any) => kw.trim())
        .filter((kw: any) => kw.length > 0)
      setField("keywords", [...new Set([...getValues("keywords"), ...keywords])])
      clearErrors("keywords")
      setIsFormReset(false)
    }
    reader.onerror = () => toast.error("Error reading CSV file.")
    reader.readAsText(file)
    event.target.value = null
  }, [setField, clearErrors, getValues])

  const handleLogoUpload = useCallback(async (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file type and size using global config
    const { types: acceptedTypes, max_size: maxSize } = VALID_IMAGE_CONFIG

    if (!acceptedTypes.includes(file.type)) {
      toast.error(
        `Invalid image type. Please upload: ${acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`
      )
      return
    }

    if (file.size > maxSize) {
      toast.error(`Image exceeds ${maxSize / (1024 * 1024)}MB limit.`)
      return
    }

    const formDataUpload = new FormData()
    formDataUpload.append("image", file)

    try {
      setIsUploading(true)
      const res = await uploadImage(formDataUpload, getValues("logoUrl")?.split("?")[0] || null)
      if (res?.url) {
        const bustedUrl = `${res.url}?t=${Date.now()}`
        setField("logoUrl", bustedUrl)
        toast.success("Logo uploaded successfully.")
      }
    } catch (err) {
      console.error("Logo upload failed:", err)
      toast.error("Failed to upload logo.")
    } finally {
      setIsUploading(false)
    }
  }, [setField, getValues])

  // The schema validates first, so `values` is complete by the time this runs and
  // `toBrandVoicePayload` is the only thing that shapes the request body.
  const handleSave = submitForm(async (values) => {
    if (isReadOnlyWorkspace) {
      toast.error("This workspace is read-only — exit to your own workspace to make changes.")
      return
    }
    setIsUploading(true)
    const payload = toBrandVoicePayload(values)

    const isDuplicate = brands.some(
      (brand) =>
        brand.postLink === payload.postLink && (values._id ? brand._id !== values._id : true)
    )

    if (isDuplicate) {
      toast.error("A brand voice already exists with that name and link.")
      setIsUploading(false)
      return
    }

    try {
      if (values._id) {
        await brandVoiceMutations.update.mutateAsync({ id: values._id, data: payload })
      } else {
        await brandVoiceMutations.create.mutateAsync(payload)
      }
      resetForm()
    } catch (error) {
      // The mutation already toasts what the server said; this only stops the
      // rejection from escaping and leaves a trace for debugging.
      console.error("Error saving brand voice:", error)
    } finally {
      setIsUploading(false)
    }
  },
  (invalid) => {
    // Each message renders inline beside its field, which is easy to miss when Save
    // sits well below them — pull the first failing field into view.
    const [firstField] = Object.keys(invalid)
    const field = firstField && document.getElementById(firstField)
    if (field) {
      field.scrollIntoView({ behavior: "smooth", block: "center" })
      field.focus({ preventScroll: true })
    }
  })

  const handleEdit = useCallback(
    (brand: any) => {
      reset({
        nameOfVoice: brand.nameOfVoice || "",
        postLink: brand.postLink || "",
        keywords: Array.isArray(brand.keywords) ? brand.keywords : [],
        describeBrand: brand.describeBrand || "",
        sitemapUrl: brand.sitemap || "",
        persona: brand.persona || "",
        logoUrl: brand.logoUrl || "",
        selectedVoice: brand,
        _id: brand._id,
      })
      setLastScrapedUrl(brand.postLink || "")
      setIsFormReset(false)
      setShowAllKeywords(false)
    },
    [reset]
  )

  const handleDelete = useCallback(
    (brand: any) => {
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
            toast.error("Failed to delete Brand Voice")
          }
        },
        confirmProps: {
          className:
            "border-red-200 bg-red-50 text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-white",
        },
      })
    },
    [brandVoiceMutations, formData.selectedVoice, resetForm, handlePopup]
  )

  const handleSelect = useCallback(
    (voice: any) => {
      setField("selectedVoice", voice)
      setIsFormReset(false)
    },
    [setField]
  )

  const handleFetchSiteInfo = useCallback(() => {
    const url = formData.postLink.trim()
    if (!url) {
      setFieldError("postLink", "Post link is required to fetch site info.")
      return
    }
    if (url === lastScrapedUrl) {
      toast.info("This URL has already been fetched.")
      return
    }
    try {
      new URL(url)
      fetchSiteInfo(url)
        .then(() => {
          setIsFormReset(false)
        })
        .catch(() => toast.error("Failed to fetch site info. Please try a different URL."))
    } catch {
      setFieldError("postLink", "Please enter a valid URL (e.g., https://example.com).")
    }
  }, [formData.postLink, lastScrapedUrl, fetchSiteInfo, setFieldError])

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
        {displayedKeywords.map((keyword) => (
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
              onClick={(e) => {
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

  // Checked after every hook has run unconditionally (rules-of-hooks) — this can flip
  // true/false within the same mounted instance as credits/subscription update live.
  if (showTrialMessage) {
    return <UpgradeModal featureName="Brand Voice" />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-2 sm:p-6 md:p-10 w-full mx-auto mb-20 md:mb-0"
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
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Your Brand Voice
          </h1>
        </div>
        <p className="text-gray-600 text-sm mb-4 sm:mb-6">
          Define your brand's unique tone and style to ensure consistent content creation.
        </p>

        {isReadOnlyWorkspace && (
          <div className="mb-4 sm:mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {readOnlyMessage}
          </div>
        )}

        {/* `display: contents` keeps the fieldset out of the layout while its disabled
            attribute still cascades to every input inside it — one guard instead of
            threading `disabled` through a dozen fields. */}
        <fieldset disabled={isReadOnlyWorkspace} className="contents">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="postLink" className="text-sm font-medium  flex gap-2 mb-1">
              Post or Blog Link <span className="text-red-500">*</span>
              <div
                className="tooltip tooltip-right"
                data-tip="Add a link of your home page to fetch site info"
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </div>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <motion.input
                id="postLink"
                type="url"
                name="postLink"
                value={formData.postLink}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com/blog"
                className={`p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base border-gray-300 flex-1 ${
                  errors.postLink?.message ? "input-error" : "focus:border-indigo-500"
                }`}
                whileFocus={{ scale: 1.01 }}
                aria-invalid={!!errors.postLink}
                aria-describedby={errors.postLink?.message ? "postLink-error" : undefined}
              />
              <button
                type="button"
                className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-4 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                onClick={handleFetchSiteInfo}
                disabled={
                  siteInfo.loading ||
                  (formData.postLink && formData.postLink === lastScrapedUrl) ||
                  showTrialMessage
                }
              >
                {siteInfo.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 sm:w-5 h-4 sm:h-5" />
                    Fetching...
                  </span>
                ) : (
                  "Fetch Site Info"
                )}
              </button>
            </div>
            {errors.postLink?.message && (
              <p id="postLink-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.postLink?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nameOfVoice" className="text-sm font-medium  flex gap-2 mb-1">
              Name of Voice <span className="text-red-500">*</span>
            </label>
            <motion.input
              id="nameOfVoice"
              type="text"
              name="nameOfVoice"
              value={formData.nameOfVoice}
              onChange={handleInputChange}
              placeholder="e.g., Friendly Tech"
              className={`p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base border-gray-300 w-full ${
                errors.nameOfVoice?.message ? "input-error" : "focus:border-indigo-500"
              }`}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.nameOfVoice}
              aria-describedby={errors.nameOfVoice?.message ? "nameOfVoice-error" : undefined}
            />
            {errors.nameOfVoice?.message && (
              <p id="nameOfVoice-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.nameOfVoice?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="logoUrl" className="text-sm font-medium flex gap-2 mb-1">
              Brand Logo (Optional)
              <div
                className="tooltip tooltip-right"
                data-tip="Add a logo URL or upload an image for your brand voice"
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </div>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <motion.input
                  id="logoUrl"
                  type="url"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="Paste Logo URL (e.g., https://example.com/logo.png)"
                  className="p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base border-gray-300 w-full"
                  whileFocus={{ scale: 1.01 }}
                />
                {formData.logoUrl && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                    onClick={() => setField("logoUrl", "")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="max-w-1/3 h flex gap-2">
                <label className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-4 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 ">
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Upload Logo"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleLogoUpload}
                    accept="image/*"
                    disabled={isUploading}
                  />
                </label>
                {formData.logoUrl && (
                  <div className="flex-end size-12 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                      key={formData.logoUrl}
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="keywords" className="text-sm font-medium  flex gap-2 mb-1">
              Keywords <span className="text-red-500">*</span>
              <div
                className="tooltip tooltip-right"
                data-tip="Upload a .csv file in the format: `Keyword` as header"
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </div>
            </label>
            <motion.div
              className={`flex bg-white border rounded-md p-3 flex-col gap-2 ${
                errors.keywords?.message ? "border-red-500" : "border-gray-300"
              }`}
              whileHover={{ boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)" }}
            >
              {renderKeywords}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  id="keywords"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePasteKeywords}
                  className="grow bg-transparent border-none text-black outline-none text-sm sm:text-base"
                  placeholder="Type a keyword and press Enter"
                  aria-describedby={errors.keywords?.message ? "keywords-error" : undefined}
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
            {errors.keywords?.message && (
              <p id="keywords-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.keywords?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sitemapUrl" className="text-sm font-medium  flex gap-2 mb-1">
              Sitemap URL <span className="text-red-500">*</span>
              <div
                className="tooltip tooltip-right"
                data-tip="Paste the URL of your XML sitemap (e.g., https://example.com/sitemap.xml)"
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </div>
            </label>
            <motion.input
              id="sitemapUrl"
              type="url"
              name="sitemapUrl"
              value={formData.sitemapUrl}
              onChange={handleInputChange}
              placeholder="e.g., https://example.com/sitemap.xml"
              className={`p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base border-gray-300 w-full ${
                errors.sitemapUrl?.message ? "input-error" : "focus:border-indigo-500"
              }`}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.sitemapUrl}
              aria-describedby={errors.sitemapUrl?.message ? "sitemapUrl-error" : undefined}
            />
            {errors.sitemapUrl?.message && (
              <p id="sitemapUrl-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.sitemapUrl?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="describeBrand" className="text-sm font-medium  flex gap-2 mb-1">
              Describe Your Brand <span className="text-red-500">*</span>
            </label>
            <motion.textarea
              id="describeBrand"
              name="describeBrand"
              value={formData.describeBrand}
              onChange={handleInputChange}
              placeholder="Describe your brand's tone and personality"
              className={`textarea border border-gray-300 w-full text-black bg-white focus:outline-none focus:ring-0 rounded-md text-sm sm:text-base p-4 ${
                errors.describeBrand?.message ? "textarea-error" : "focus:border-indigo-500"
              }`}
              rows={4}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.describeBrand}
              aria-describedby={errors.describeBrand?.message ? "describeBrand-error" : undefined}
            />
            {errors.describeBrand?.message && (
              <p id="describeBrand-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.describeBrand?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="persona" className="text-sm font-medium  flex gap-2 mb-1">
              Author Persona <span className="text-red-500">*</span>
              <div
                className="tooltip tooltip-top"
                data-tip="Describe the author's bio, writing style, tones (e.g., professional, casual), dialect preferences, target audiences, and brand identities. This helps generate content that resonates with your brand voice."
              >
                <span className="cursor-pointer">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
                </span>
              </div>
            </label>
            <motion.textarea
              id="persona"
              name="persona"
              value={formData.persona}
              onChange={handleInputChange}
              placeholder="e.g., A seasoned tech blogger with a friendly, conversational tone. Writes for developers and startup founders. Uses American English with occasional technical jargon."
              className={`textarea border border-gray-300 w-full text-black bg-white focus:outline-none focus:ring-0 rounded-md text-sm sm:text-base p-4 ${
                errors.persona?.message ? "textarea-error" : "focus:border-indigo-500"
              }`}
              rows={3}
              whileFocus={{ scale: 1.01 }}
              aria-invalid={!!errors.persona}
              aria-describedby={errors.persona?.message ? "persona-error" : undefined}
            />
            {errors.persona?.message && (
              <p id="persona-error" className="text-red-500 text-xs sm:text-sm mt-1">
                {errors.persona?.message}
              </p>
            )}
          </div>

          <div className="flex flex-row gap-2 sm:gap-3 justify-end pt-2">
            <button
              type="button"
              className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-2 sm:px-4 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[11px] sm:text-base flex-1 sm:flex-none"
              onClick={handleSave}
              title={isReadOnlyWorkspace ? readOnlyMessage : undefined}
              disabled={isUploading || showTrialMessage || isReadOnlyWorkspace}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <Loader2 className="animate-spin w-3 h-3 sm:w-5 sm:h-5" />
                  Saving...
                </span>
              ) : formData._id ? (
                "Update Brand Voice"
              ) : (
                "Save Brand Voice"
              )}
            </button>

            <button
              type="button"
              className="bg-linear-to-tr from-red-700 from-10% via-red-500 via-80% to-red-700 to-100% text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base flex-none sm:flex-none"
              onClick={resetForm}
              disabled={isUploading}
            >
              Clear
            </button>
          </div>
        </div>
        </fieldset>
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
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
          ) : brands.length > 0 ? (
            brands.map((item) => (
              <BrandVoicesComponent
                key={item._id}
                id={item._id}
                brandName={item.nameOfVoice}
                brandVoice={item.describeBrand}
                logoUrl={item.logoUrl}
                onSelect={() => handleSelect(item)}
                isSelected={formData.selectedVoice?._id === item._id}
                readOnly={isReadOnlyWorkspace}
                onEdit={(e: any) => {
                  e.stopPropagation()
                  handleEdit(item)
                }}
                onDelete={(e: any) => {
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
