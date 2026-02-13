import { useState, useEffect, useCallback } from "react"
import { Pagination, Spin, Modal, message, Button, Input, Select, Tooltip, Tag, Switch } from "antd"
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
} from "lucide-react"
import { Helmet } from "react-helmet"
import DebouncedSearchInput from "@components/UI/DebouncedSearchInput"
import useAuthStore from "@store/useAuthStore"
import useImageStore from "@store/useImageStore"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { COSTS } from "@/data/blogData"

const { TextArea } = Input

// Skeleton Loader Component
const ImageSkeleton = () => {
  return (
    <div className="break-inside-avoid rounded-xl overflow-hidden bg-gray-100 animate-pulse">
      <div className="w-full aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300"></div>
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
            } bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-shimmer`}
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
  const { user, fetchUser } = useAuthStore()
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
      message.error("Failed to load images")
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
      message.error("You have reached your AI Image generation limit. preventing generation.")
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
      message.error("Please enter a prompt")
      return
    }

    if (countWords(genForm.prompt) < 10) {
      message.error("Prompt must be at least 10 words")
      return
    }

    setIsGenerating(true)
    try {
      const response = await generateImageStore(genForm)

      setGenForm({ ...genForm, prompt: "" })
      setShowErrors(false)
      fetchUser() // Update credits

      const newImage = response.image || response.data || response

      if (newImage && newImage.url) {
        setPreviewImage(newImage) // Open the lightbox with new image
        setEnhanceForm(prev => ({ ...prev, prompt: "" })) // Clear enhance input
      }

      loadImages() // Refresh gallery
    } catch (error) {
      console.error(error)
      message.error(error.response?.data?.message || "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEnhanceImage = async () => {
    if (!checkQuota()) return
    if (!checkCredits(COSTS.ENHANCE)) return
    if (!enhanceForm.prompt.trim()) return message.error("Please describe how to enhance")

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

      message.success("Image enhanced successfully!")
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
      message.error(error.response?.data?.message || "Enhancement failed")
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
      message.success("Alt text generated!")
      fetchUser()
    } catch (error) {
      console.error(error)
      message.error("Failed to generate alt text")
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
      message.success("Image link copied to clipboard!")
    } catch (error) {
      console.error(error)
      message.error("Failed to copy link")
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
      message.success("Image downloaded successfully!")
    } catch (error) {
      console.error(error)
      message.error("Failed to download image")
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

      {/* Full Screen Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <Spin size="large" className="scale-150 relative z-10" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-8">
            Dreaming up your masterpiece...
          </h3>
          <p className="text-gray-500 mt-2 font-medium">This usually takes about 10-20 seconds.</p>
        </div>
      )}

      <div className="min-h-screen p-3 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-4 mt-5 md:mt-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Explore Creations
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-md">
            Curated high-quality generations for your next project.
          </p>
        </div>

        {/* Creation Studio Section - Inline */}
        <div className="mb-8">
          {/* Creation Studio - Simplified Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            {/* Content Area */}
            <div className="transition-all duration-300 ease-in-out">
              {isGenerating ? (
                // Loading State
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                  <Spin size="large" className="scale-150" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mt-4">
                      Creating your masterpiece...
                    </h3>
                    <p className="text-gray-500 text-sm">This usually takes about 10-20 seconds.</p>
                  </div>
                </div>
              ) : (
                // Form State - Simplified & Polished
                <div className="p-6">
                  {/* Top Row: Type & Ratio & Size */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Style
                      </label>
                      <Select
                        value={genForm.style}
                        onChange={val => setGenForm({ ...genForm, style: val })}
                        className="w-full"
                        size="large"
                        options={[
                          { value: "photorealistic", label: "Photorealistic" },
                          { value: "anime", label: "Anime" },
                          { value: "digital-art", label: "Digital Art" },
                          { value: "oil-painting", label: "Oil Painting" },
                          { value: "cinematic", label: "Cinematic" },
                        ]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Dimension
                      </label>
                      <Select
                        value={genForm.aspectRatio}
                        onChange={val => setGenForm({ ...genForm, aspectRatio: val })}
                        className="w-full"
                        size="large"
                        options={[
                          { value: "1:1", label: "Square (1:1)" },
                          { value: "16:9", label: "Landscape (16:9)" },
                          { value: "9:16", label: "Portrait (9:16)" },
                          { value: "4:3", label: "Standard (4:3)" },
                          { value: "3:2", label: "Classic (3:2)" },
                        ]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Quality
                      </label>
                      <Select
                        value={genForm.imageSize}
                        onChange={val => setGenForm({ ...genForm, imageSize: val })}
                        className="w-full"
                        size="large"
                        options={[
                          { value: "1k", label: "Standard (1K)" },
                          { value: "2k", label: "High Res (2K)" },
                          { value: "4k", label: "Ultra (4K)" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Prompt Section */}
                  <div className="space-y-2 relative mb-6">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Prompt <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <TextArea
                      value={genForm.prompt}
                      onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                      maxLength={1000}
                      placeholder="Describe the image you want to create... (Minimum 10 words)"
                      className={`!min-h-[140px] !resize-none !text-base !rounded-xl transition-all p-4 shadow-sm ${
                        showErrors && countWords(genForm.prompt) < 10
                          ? "!border-red-400 focus:!border-red-500 focus:!ring-red-50"
                          : "!border-gray-200 focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-50/50"
                      }`}
                    />
                    {showErrors && !genForm.prompt.trim() && (
                      <p className="text-xs text-red-500 mt-1 animate-in slide-in-from-top-1">
                        Image prompt is required
                      </p>
                    )}
                    {showErrors && genForm.prompt.trim() && countWords(genForm.prompt) < 10 && (
                      <p className="text-xs text-red-500 mt-1 animate-in slide-in-from-top-1">
                        Please provide more detail (at least 10 words) for better results.
                      </p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Usage Limit Info */}
                    <div className="text-xs text-gray-500 font-medium order-2 md:order-1 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      Monthly Usage:{" "}
                      <span
                        className={`${user?.usage?.aiImages >= user?.usageLimits?.aiImages ? "text-red-600" : "text-gray-900"} font-bold ml-1`}
                      >
                        {user?.usage?.aiImages || 0} / {user?.usageLimits?.aiImages || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end order-1 md:order-2">
                      <Button
                        size="large"
                        onClick={() => {
                          setGenForm({
                            prompt: "",
                            style: "photorealistic",
                            aspectRatio: "1:1",
                            imageSize: "1k",
                          })
                          setShowErrors(false)
                        }}
                        className="!rounded-xl !border-gray-200 !text-gray-500 hover:!bg-gray-50 hover:!text-gray-700 font-medium px-6"
                      >
                        Reset
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleGenerateImage}
                        disabled={isGenerating}
                        icon={<Sparkles className="w-5 h-5" />}
                        className="!rounded-xl !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700 !shadow-lg !shadow-blue-200 !h-12 !px-8 !font-bold !text-base flex-1 md:flex-none"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6 sticky top-2 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-100 shadow-sm">
          <DebouncedSearchInput
            onSearch={setSearchQuery}
            placeholder="Search gallery..."
            debounceTime={500}
            className="!border-none !shadow-none !bg-transparent focus:!ring-0 text-base"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
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
                    <div className="flex gap-2 flex-shrink-0">
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
          {!loading && images.length > 0 && totalImages > 0 && (
            <div className="mt-12 flex justify-center">
              <Pagination
                current={currentPage}
                total={totalImages}
                pageSize={pageSize}
                onChange={page => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} images`}
              />
            </div>
          )}
        </div>

        {/* Preview Modal (Enhanced) */}
        <Modal
          open={!!previewImage}
          onCancel={() => setPreviewImage(null)}
          footer={null}
          centered
          width={1100}
          closeIcon={null}
          className="image-detail-modal !p-0"
          styles={{
            content: {
              padding: 0,
              borderRadius: "16px",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            },
            mask: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.7)" },
          }}
        >
          {previewImage && (
            <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[800px] max-h-[90vh] overflow-hidden">
              {/* Left: Image Canvas */}
              <div className="bg-[#0f1014] relative flex items-center justify-center p-4 lg:p-8 overflow-hidden group h-[35vh] lg:h-auto lg:flex-1 shrink-0">
                <div
                  className="absolute inset-0 opacity-20 blur-3xl saturate-200"
                  style={{
                    backgroundImage: `url(${previewImage.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                <img
                  src={previewImage.url}
                  alt={previewImage.description}
                  className="relative max-h-full max-w-full object-contain shadow-2xl rounded-lg z-10"
                />

                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 left-4 lg:top-6 lg:left-6 p-2 bg-black/40 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md z-20 border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Quick actions floating on image */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white z-20">
                  <button
                    onClick={() => handleCopyLink(previewImage)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors tooltip"
                    title="Copy Link"
                  >
                    <Copy size={18} />
                  </button>
                  <div className="w-px h-4 bg-white/20"></div>
                  <button
                    onClick={() => handleDownload(previewImage)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors tooltip"
                    title="Download Original"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>

              {/* Right: Premium Details Panel */}
              <div className="w-full lg:w-[400px] bg-white flex flex-col border-l border-gray-100 shadow-xl relative z-20 flex-1 lg:h-full overflow-hidden">
                {/* Header */}
                <div className="p-5 lg:p-6 border-b border-gray-50 flex-shrink-0 flex items-start justify-between bg-white relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                        {isEnhanceMode ? "Enhance Mode" : "Generated Image"}
                      </span>
                      {canEnhance(previewImage) && !isEnhanceMode && (
                        <span className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                          <Sparkles size={10} className="fill-blue-500 text-blue-500" /> AI Creative
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                      {isEnhanceMode ? "Enhance Image" : previewImage.title || "Untitled Creation"}
                    </h2>
                    {!isEnhanceMode && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{new Date().toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{previewImage.resolution || genForm.imageSize}</span>
                      </div>
                    )}
                  </div>
                  {isEnhanceMode && (
                    <button
                      onClick={() => setIsEnhanceMode(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 lg:p-6 custom-scrollbar space-y-6 relative">
                  {isEnhanceMode ? (
                    // INLINE ENHANCE FORM
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                      <p className="text-sm text-gray-500">
                        Describe what you want to improve or change in this image.
                      </p>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Instruction
                          </label>
                          <TextArea
                            value={enhanceForm.prompt}
                            onChange={e =>
                              setEnhanceForm({ ...enhanceForm, prompt: e.target.value })
                            }
                            placeholder="e.g. Make it higher definition, fix lighting, add a hat..."
                            rows={3}
                            className="!resize-none !text-sm !rounded-xl"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Style
                            </label>
                            <Select
                              value={enhanceForm.style}
                              onChange={val => setEnhanceForm({ ...enhanceForm, style: val })}
                              className="w-full"
                              options={[
                                { value: "photorealistic", label: "Photorealistic" },
                                { value: "anime", label: "Anime" },
                                { value: "digital-art", label: "Digital Art" },
                                { value: "oil-painting", label: "Oil Painting" },
                                { value: "cinematic", label: "Cinematic" },
                              ]}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Quality
                            </label>
                            <Select
                              value={enhanceForm.imageSize}
                              onChange={val => setEnhanceForm({ ...enhanceForm, imageSize: val })}
                              className="w-full"
                              options={[
                                { value: "1k", label: "Standard (1K)" },
                                { value: "2k", label: "High Res (2K)" },
                                { value: "4k", label: "Ultra (4K)" },
                              ]}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Aspect Ratio
                          </label>
                          <Select
                            value={enhanceForm.aspectRatio}
                            onChange={val => setEnhanceForm({ ...enhanceForm, aspectRatio: val })}
                            className="w-full"
                            options={[
                              { value: "1:1", label: "Square (1:1)" },
                              { value: "16:9", label: "Landscape (16:9)" },
                              { value: "9:16", label: "Portrait (9:16)" },
                              { value: "4:3", label: "Standard (4:3)" },
                              { value: "3:2", label: "Classic (3:2)" },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="bg-purple-50 p-3 rounded-xl flex justify-between items-center text-xs text-purple-700 border border-purple-100">
                        <span className="flex items-center gap-1 font-medium">
                          <Sparkles size={12} /> Enhancement Cost
                        </span>
                        <span className="font-bold">{COSTS.ENHANCE} credits</span>
                      </div>

                      <Button
                        type="primary"
                        block
                        size="large"
                        onClick={handleEnhanceImage}
                        loading={isEnhancing}
                        className="!bg-gradient-to-r !from-purple-600 !to-pink-600 !border-none !h-12 !rounded-xl !font-bold !shadow-lg !shadow-purple-100"
                      >
                        Enhance Now
                      </Button>
                    </div>
                  ) : (
                    // NORMAL DETAILS VIEW
                    <>
                      {/* Prompt Section */}
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Bot size={14} className="text-gray-400" /> Prompt Details
                        </h3>
                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed font-medium">
                          {previewImage.description || "No description provided."}
                        </div>
                      </div>

                      {/* Actions Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleGenerateAltText}
                          disabled={isGeneratingAlt}
                          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md transition-all group text-center"
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <Type size={18} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">
                            {isGeneratingAlt ? "Generating..." : "Generate Alt Text"}
                          </span>
                        </button>

                        <button
                          onClick={() => setIsEnhanceMode(true)}
                          disabled={!canEnhance(previewImage)}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 bg-white transition-all group text-center
                            ${
                              canEnhance(previewImage)
                                ? "hover:border-purple-200 hover:bg-purple-50/30 hover:shadow-md cursor-pointer"
                                : "opacity-50 cursor-not-allowed grayscale"
                            }`}
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                            <Wand2 size={18} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">
                            Enhance Image
                          </span>
                        </button>
                      </div>

                      {/* Generated Data */}
                      {generatedAltText && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                          <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Alt Text
                            Ready
                          </h3>
                          <div
                            onClick={() => {
                              navigator.clipboard.writeText(generatedAltText)
                              message.success("Copied to clipboard!")
                            }}
                            className="p-4 bg-green-50/50 text-green-900 text-xs rounded-xl border border-green-100 cursor-copy hover:bg-green-100 transition-all leading-relaxed relative group"
                          >
                            <Copy
                              size={12}
                              className="absolute top-2 right-2 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            {generatedAltText}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {previewImage.tags && previewImage.tags.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Tags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {previewImage.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[11px] font-semibold tracking-wide hover:border-gray-300 transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer Actions */}
                {!isEnhanceMode && (
                  <div className="p-5 lg:p-6 pt-2 bg-white flex flex-col gap-3 flex-shrink-0 mt-auto">
                    <Button
                      onClick={() => handleDownload(previewImage)}
                      type="primary"
                      size="large"
                      icon={<Download className="w-4 h-4" />}
                      className="!w-full !rounded-xl !h-12 !bg-gray-900 hover:!bg-black !shadow-lg !font-bold"
                    >
                      Download Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}

export default ImageGallery
