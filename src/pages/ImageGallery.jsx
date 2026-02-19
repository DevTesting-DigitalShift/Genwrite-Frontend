import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Image as ImageIcon,
  X,
  Download,
  Copy,
  Wand2,
  Sparkles,
  Type,
  Bot,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { Helmet } from "react-helmet"
import DebouncedSearchInput from "@components/UI/DebouncedSearchInput"
import useAuthStore from "@store/useAuthStore"
import useImageStore from "@store/useImageStore"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { COSTS } from "@/data/blogData"
import toast from "@utils/toast"
import { AnimatePresence, motion } from "framer-motion"

// Skeleton Loader Component
const ImageSkeleton = () => {
  return (
    <div className="break-inside-avoid rounded-xl overflow-hidden bg-gray-100 animate-pulse">
      <div className="w-full aspect-3/4 bg-linear-to-br from-gray-200 to-gray-300"></div>
    </div>
  )
}

// Generate random heights for more natural masonry skeleton
const SkeletonGrid = ({ count = 12 }) => {
  const heights = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[2/3]", "aspect-[5/6]"]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="break-inside-avoid rounded-xl overflow-hidden bg-gray-100 animate-pulse"
        >
          <div
            className={`w-full ${
              heights[index % heights.length]
            } bg-linear-to-br from-gray-200 via-gray-100 to-gray-200 bg-size:[200%_200%] animate-shimmer`}
          ></div>
        </div>
      ))}
    </div>
  )
}

const ImageGallery = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(40)
  const [minScore, setMinScore] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  // New Features State
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGeneratingAlt, setIsGeneratingAlt] = useState(false)
  const [generatedAltText, setGeneratedAltText] = useState("")
  const [showErrors, setShowErrors] = useState(false)

  const [genForm, setGenForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1k",
  })

  // Enhance form needs extra fields now
  const [enhanceForm, setEnhanceForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1k",
  })

  // Toggle for inline enhance mode
  const [isEnhanceMode, setIsEnhanceMode] = useState(false)

  // Zustand stores
  const { user, fetchUserProfile: fetchUser } = useAuthStore()
  const {
    images,
    totalImages,
    loading,
    fetchImages,
    generateImage: generateImageStore,
    enhanceImage: enhanceImageStore,
    generateAltText: generateAltTextStore,
  } = useImageStore()

  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  // Calculate total pages
  const totalPages = Math.ceil(totalImages / pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, minScore, selectedTags])

  // Fetch images
  const loadImages = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        minScore: minScore > 0 ? minScore : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        q: searchQuery.trim() || undefined,
      }
      await fetchImages(params)
    } catch (error) {
      console.error("Error fetching images:", error)
      toast.error("Failed to load images")
    }
  }, [currentPage, pageSize, minScore, selectedTags, searchQuery, fetchImages])

  // Fetch images when page or filters change
  useEffect(() => {
    loadImages()
  }, [loadImages])

  const checkCredits = required => {
    if (userCredits < required) {
      handlePopup({
        title: "Insufficient Credits",
        description: `This action requires ${required} credits. You have ${userCredits}.`,
        confirmText: "Get Credits",
        onConfirm: () => navigate("/pricing"),
      })
      return false
    }
    return true
  }

  const checkQuota = () => {
    if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
      toast.error("You have reached your AI Image generation limit.")
      return false
    }
    return true
  }

  const countWords = str => {
    return str
      .trim()
      .split(/\s+/)
      .filter(n => n !== "").length
  }

  const handleGenerateImage = async () => {
    setShowErrors(true)
    if (!checkQuota()) return
    if (!checkCredits(COSTS.GENERATE)) return

    if (!genForm.prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    if (countWords(genForm.prompt) < 10) {
      toast.error("Prompt must be at least 10 words")
      return
    }

    setIsGenerating(true)
    try {
      const response = await generateImageStore(genForm)

      setGenForm({ ...genForm, prompt: "" })
      setShowErrors(false)
      fetchUser() // Update credits

      const newImage = response?.image || response?.data || response

      if (newImage && newImage.url) {
        setPreviewImage(newImage) // Open the lightbox with new image
        setEnhanceForm(prev => ({ ...prev, prompt: "" })) // Clear enhance input
      }

      loadImages() // Refresh gallery
    } catch (error) {
      console.error("Generation error:", error)
      toast.error(error.response?.data?.message || error.message || "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEnhanceImage = async () => {
    if (!checkQuota()) return
    if (!checkCredits(COSTS.ENHANCE)) return
    if (!enhanceForm.prompt.trim()) return toast.error("Please describe how to enhance")

    setIsEnhancing(true)
    try {
      const formData = new FormData()
      formData.append("prompt", enhanceForm.prompt)
      formData.append("style", enhanceForm.style)
      formData.append("aspectRatio", enhanceForm.aspectRatio)
      formData.append("quality", enhanceForm.imageSize)
      formData.append("existingImageId", previewImage._id)
      formData.append("imageUrl", previewImage.url)

      const response = await enhanceImageStore(formData)
      const newImage = response.data || response.image || response

      toast.success("Image enhanced successfully!")
      setIsEnhanceMode(false) // Close inline enhance mode
      setEnhanceForm(prev => ({ ...prev, prompt: "" })) // Clear enhance input

      // Update preview with new enhanced image immediately
      if (newImage && newImage.url) {
        // Force cache bust with timestamp
        const timestamp = new Date().getTime()
        const urlWithCacheBust = newImage.url.includes("?")
          ? `${newImage.url}&t=${timestamp}`
          : `${newImage.url}?t=${timestamp}`

        // Merge with previous image to strictly preserve metadata (description, tags)
        // while overwriting URL and ID
        setPreviewImage(prev => ({ ...prev, ...newImage, url: urlWithCacheBust }))
      } else {
        // Fallback
        console.warn("Unexpected enhance response structure:", response)
        if (response && response.url) {
          const timestamp = new Date().getTime()
          setPreviewImage(prev => ({ ...prev, ...response, url: `${response.url}?t=${timestamp}` }))
        }
      }

      fetchUser()
      loadImages()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Enhancement failed")
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleGenerateAltText = async () => {
    if (!checkCredits(COSTS.ALT_TEXT)) return

    setIsGeneratingAlt(true)
    try {
      const res = await generateAltTextStore(previewImage.url)
      setGeneratedAltText(res.altText)
      toast.success("Alt text generated!")
      fetchUser()
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate alt text")
    } finally {
      setIsGeneratingAlt(false)
    }
  }

  /**
   * Check if image is valid for enhancement.
   * Now strictly permissive: if it has an ID and URL, we allow it.
   */
  const canEnhance = img => {
    return img && img._id && img.url
  }

  const handleCopyLink = async (image, e) => {
    if (e) e.stopPropagation()
    try {
      await navigator.clipboard.writeText(image.url)
      toast.success("Image link copied to clipboard!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to copy link")
    }
  }

  const handleDownload = async (image, e) => {
    if (e) e.stopPropagation()
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `image-${image._id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Image downloaded successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to download image")
    }
  }

  const handleImageClick = image => {
    setPreviewImage(image)
    setGeneratedAltText("") // Reset alt text
    // Clear enhance prompt
    setEnhanceForm({ prompt: "", style: "photorealistic", aspectRatio: "1:1", imageSize: "1k" })
    setIsEnhanceMode(false) // Ensure we start in normal mode
  }

  return (
    <>
      <Helmet>
        <title>Image Gallery | GenWrite</title>
      </Helmet>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
            </div>
            <h3 className="text-3xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-8">
              Dreaming up your masterpiece...
            </h3>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">
              This usually takes about 10-20 seconds
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Creation Gallery</h1>
            <p className="text-slate-500 text-lg font-medium max-w-lg leading-relaxed">
              Explore high-quality AI generations and bring your vision to life with our premium
              creative tools.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-sm uppercase tracking-wider">
              {userCredits} Credits
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-slate-700 uppercase tracking-wider text-xs">
                      Style
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                    value={genForm.style}
                    onChange={e => setGenForm({ ...genForm, style: e.target.value })}
                  >
                    <option value="photorealistic">Photorealistic</option>
                    <option value="anime">Anime</option>
                    <option value="digital-art">Digital Art</option>
                    <option value="oil-painting">Oil Painting</option>
                    <option value="cinematic">Cinematic</option>
                  </select>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-slate-700 uppercase tracking-wider text-xs">
                      Dimension
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                    value={genForm.aspectRatio}
                    onChange={e => setGenForm({ ...genForm, aspectRatio: e.target.value })}
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:2">Classic (3:2)</option>
                  </select>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold text-slate-700 uppercase tracking-wider text-xs">
                      Quality
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                    value={genForm.imageSize}
                    onChange={e => setGenForm({ ...genForm, imageSize: e.target.value })}
                  >
                    <option value="1k">Standard (1K)</option>
                    <option value="2k">High Res (2K)</option>
                    <option value="4k">Ultra (4K)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="label">
                  <span className="label-text font-bold text-slate-700 uppercase tracking-wider text-xs">
                    Creative Prompt <span className="text-rose-500">*</span>
                  </span>
                </label>
                <textarea
                  className={`textarea textarea-bordered w-full min-h-[160px] rounded-2xl p-6 text-lg border-2 transition-all ${
                    showErrors && countWords(genForm.prompt) < 10
                      ? "border-rose-200 bg-rose-50"
                      : "border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  }`}
                  value={genForm.prompt}
                  onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                  placeholder="Describe your masterpiece in detail... (Minimum 10 words for best results)"
                />
                {showErrors && countWords(genForm.prompt) < 10 && (
                  <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-2">
                    <X size={14} /> Prompt must be at least 10 words.
                  </p>
                )}
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 px-4 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    Gen {user?.usage?.aiImages || 0} / {user?.usageLimits?.aiImages || 0}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setGenForm({
                        prompt: "",
                        style: "photorealistic",
                        aspectRatio: "1:1",
                        imageSize: "1k",
                      })
                      setShowErrors(false)
                    }}
                    className="btn btn-ghost h-14 px-8 rounded-2xl text-slate-500 font-bold border border-slate-100"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="btn btn-primary flex-1 md:flex-none h-14 px-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white font-black shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Art
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6 sticky top-2 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-100 shadow-sm">
          <DebouncedSearchInput
            onSearch={setSearchQuery}
            placeholder="Search gallery..."
            debounceTime={500}
            className="border-none! shadow-none! bg-transparent! focus:ring-0! text-base"
          />
        </div>

        <div>
          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {images.map((image, index) => (
              <div
                key={image._id}
                className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer bg-gray-100 mb-4"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.url}
                  alt={image.description}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between">
                    {/* Tags/badges if AI generated */}
                    {canEnhance(image) && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/30 flex items-center gap-1">
                          <Bot size={10} /> AI
                        </span>
                      </div>
                    )}

                    <p className="text-white text-sm line-clamp-2 font-medium mr-2">
                      {image.description}
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={e => handleCopyLink(image, e)}
                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 shadow-lg"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => handleDownload(image, e)}
                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading State - Skeleton */}
          {loading && images.length === 0 && <SkeletonGrid count={12} />}

          {/* Empty State */}
          {!loading && images.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No images found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && images.length > 0 && totalImages > 0 && totalPages > 1 && (
            <div className="mt-16 flex justify-center">
              <div className="join bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 p-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="join-item btn btn-ghost h-12 w-12 rounded-xl p-0 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border-none"
                >
                  <ChevronLeft size={20} />
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = currentPage
                  if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i

                  if (pageNum < 1 || pageNum > totalPages) return null

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`join-item btn h-12 w-12 rounded-xl text-sm font-black transition-all border-none ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                          : "btn-ghost text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="join-item btn btn-ghost h-12 w-12 rounded-xl p-0 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border-none"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {previewImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewImage(null)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[800px] border border-white/20"
              >
                {/* Left Side: Visual Canvas */}
                <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-6 lg:p-12 overflow-hidden group">
                  <div
                    className="absolute inset-0 opacity-40 blur-3xl saturate-200 transition-all duration-1000"
                    style={{
                      backgroundImage: `url(${previewImage.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <img
                      src={previewImage.url}
                      alt={previewImage.description}
                      className="max-h-full max-w-full object-contain rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                    />
                  </div>

                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-6 left-6 p-3 bg-black/40 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md z-20 border border-white/10"
                  >
                    <X size={24} />
                  </button>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 z-20">
                    <button
                      onClick={() => handleCopyLink(previewImage)}
                      className="p-3 hover:bg-white/20 text-white rounded-xl transition-colors"
                      title="Copy Link"
                    >
                      <Copy size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/10" />
                    <button
                      onClick={() => handleDownload(previewImage)}
                      className="p-3 hover:bg-white/20 text-white rounded-xl transition-colors"
                      title="Download"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>

                {/* Right Side: Configuration & AI Tools */}
                <div className="w-full lg:w-[450px] bg-white flex flex-col h-full overflow-hidden border-l border-slate-100">
                  {/* Panel Header */}
                  <div className="p-8 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isEnhanceMode ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}
                      >
                        {isEnhanceMode ? "AI Enhancement" : "Generation Details"}
                      </div>
                      <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">
                        HD+ Quality
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      {isEnhanceMode
                        ? "Optimize Vision"
                        : previewImage.title || "Untitled Creation"}
                    </h2>
                  </div>

                  {/* Scrollable Intelligence Area */}
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isEnhanceMode ? (
                      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                        <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Refinement Instruction
                          </label>
                          <textarea
                            className="textarea textarea-bordered w-full h-32 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-purple-500 transition-all p-4 font-medium"
                            value={enhanceForm.prompt}
                            onChange={e =>
                              setEnhanceForm({ ...enhanceForm, prompt: e.target.value })
                            }
                            placeholder="Describe how to refine this image... (e.g. fix lighting, add more detail, change style)"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                              Target Style
                            </label>
                            <select
                              className="select select-bordered w-full h-12 rounded-xl border-slate-100 font-bold"
                              value={enhanceForm.style}
                              onChange={e =>
                                setEnhanceForm({ ...enhanceForm, style: e.target.value })
                              }
                            >
                              <option value="photorealistic">Photorealistic</option>
                              <option value="anime">Anime</option>
                              <option value="digital-art">Digital Art</option>
                              <option value="cinematic">Cinematic</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                              Resolution
                            </label>
                            <select
                              className="select select-bordered w-full h-12 rounded-xl border-slate-100 font-bold"
                              value={enhanceForm.imageSize}
                              onChange={e =>
                                setEnhanceForm({ ...enhanceForm, imageSize: e.target.value })
                              }
                            >
                              <option value="1k">Pro (1K)</option>
                              <option value="2k">Ultra (2K)</option>
                              <option value="4k">Extreme (4K)</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles size={20} className="text-purple-600" />
                            <span className="text-sm font-bold text-purple-900">
                              Premium Upgrade
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-white rounded-lg text-xs font-black text-purple-600 border border-purple-200 shadow-sm">
                            {COSTS.ENHANCE} CR
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {/* Prompt Trace */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Bot size={16} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                              Intelligence Prompt
                            </span>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 text-slate-700 font-medium leading-relaxed italic">
                            "{previewImage.description || "Synthetically generated vision."}"
                          </div>
                        </div>

                        {/* Toolset */}
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={handleGenerateAltText}
                            disabled={isGeneratingAlt}
                            className="btn btn-ghost h-auto flex-col gap-3 p-6 rounded-[24px] border border-slate-100 hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all font-bold"
                          >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-500">
                              {isGeneratingAlt ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Type size={20} />
                              )}
                            </div>
                            <span className="text-xs">SEO Metadata</span>
                          </button>

                          <button
                            onClick={() => setIsEnhanceMode(true)}
                            disabled={!canEnhance(previewImage)}
                            className="btn btn-ghost h-auto flex-col gap-3 p-6 rounded-[24px] border border-slate-100 hover:bg-purple-50 hover:border-purple-100 hover:text-purple-600 transition-all font-bold"
                          >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-purple-500">
                              <Wand2 size={20} />
                            </div>
                            <span className="text-xs">AI Enhance</span>
                          </button>
                        </div>

                        {/* Resulting Intelligence */}
                        {generatedAltText && (
                          <div className="space-y-4 animate-in zoom-in-95 duration-500">
                            <label className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Optimized Alternative Text
                            </label>
                            <div
                              onClick={() => {
                                navigator.clipboard.writeText(generatedAltText)
                                toast.success("Copied to clipboard!")
                              }}
                              className="p-6 bg-emerald-50/30 rounded-[24px] border border-emerald-100 text-emerald-900 font-bold text-sm leading-relaxed cursor-pointer hover:bg-emerald-50 transition-all relative group"
                            >
                              <Copy
                                size={14}
                                className="absolute top-4 right-4 text-emerald-300 opacity-0 group-hover:opacity-100 transition-all"
                              />
                              {generatedAltText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Interaction Footer */}
                  <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                    {isEnhanceMode ? (
                      <div className="flex gap-4">
                        <button
                          onClick={() => setIsEnhanceMode(false)}
                          className="btn btn-ghost h-14 flex-1 rounded-2xl font-bold border border-slate-200 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleEnhanceImage}
                          className="btn btn-primary h-14 flex-2 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 border-none text-white font-black shadow-xl shadow-purple-200"
                        >
                          {isEnhancing ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Initiate Enhancement"
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(previewImage)}
                        className="btn btn-primary w-full h-15 rounded-2xl bg-slate-900 border-none text-white font-black shadow-xl hover:bg-black transition-all"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Download 4K Vision
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default ImageGallery
