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
import {
  getImages,
  searchImages,
  generateImage,
  enhanceImage,
  generateAltText,
} from "@api/imageGalleryApi"
import DebouncedSearchInput from "@components/UI/DebouncedSearchInput"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { fetchUserThunk } from "@/store/slices/authSlice"

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
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalImages, setTotalImages] = useState(0)
  const [minScore, setMinScore] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  // New Features State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGeneratingAlt, setIsGeneratingAlt] = useState(false)
  const [generatedAltText, setGeneratedAltText] = useState("")
  const [isCreationExpanded, setIsCreationExpanded] = useState(true)
  const [generationSuccess, setGenerationSuccess] = useState(false)

  const [genForm, setGenForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1024x1024",
  })

  const [enhanceForm, setEnhanceForm] = useState({ prompt: "", style: "photorealistic" })

  // Auth & Credits
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  // Constants
  const COSTS = { GENERATE: 2, ENHANCE: 5, ALT_TEXT: 2 }

  // Calculate total pages
  const totalPages = Math.ceil(totalImages / pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, minScore, selectedTags])

  // Fetch images
  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        minScore: minScore > 0 ? minScore : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }

      let response
      if (searchQuery.trim()) {
        response = await searchImages({ ...params, q: searchQuery })
      } else {
        response = await getImages(params)
      }

      const newImages = response.data || []
      const total = response.pagination?.total || 0

      setTotalImages(total)
      setImages(newImages)
    } catch (error) {
      console.error("Error fetching images:", error)
      message.error("Failed to load images")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, minScore, selectedTags, searchQuery])

  // Fetch images when page or filters change
  useEffect(() => {
    fetchImages()
  }, [fetchImages])

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

  const [showErrors, setShowErrors] = useState(false)

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
    setGenerationSuccess(false)
    try {
      // Assuming generateImage returns { image: { url, ... } } or similar structure.
      // Based on previous code, it returns response data directly or inside a wrapper.
      // Let's assume response structure matches getImages item structure for consistency.
      const response = await generateImage(genForm)

      message.success("Image generated successfully!")
      setGenerationSuccess(true)
      setGenForm({ ...genForm, prompt: "" })
      setShowErrors(false)
      dispatch(fetchUserThunk()) // Update credits

      // Handle Image Preview
      // Inspecting typical API response patterns for this project
      const newImage = response.image || response.data || response

      if (newImage && newImage.url) {
        setPreviewImage(newImage) // Open the lightbox with new image
      }

      fetchImages() // Refresh gallery
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
      formData.append("existingImageId", previewImage._id)
      formData.append("imageUrl", previewImage.url)

      await enhanceImage(formData)
      message.success("Image enhancement started! It will appear shortly.")
      setIsEnhanceModalOpen(false)
      setPreviewImage(null) // Close preview
      dispatch(fetchUserThunk())
      // Delay fetch slightly to allow backend processing if sync, or just refresh
      setTimeout(fetchImages, 1000)
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
      const res = await generateAltText({ imageUrl: previewImage.url })
      setGeneratedAltText(res.altText)
      message.success("Alt text generated!")
      dispatch(fetchUserThunk())
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
    // Pre-fill enhance prompt with description if available
    setEnhanceForm(prev => ({ ...prev, prompt: image.description || "" }))
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
              ) : generationSuccess ? (
                // Success State
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 bg-green-50/50 min-h-[400px]">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Image Generated Successfully!</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Your new creation has been added to the gallery below.
                  </p>
                  <button
                    onClick={() => setGenerationSuccess(false)}
                    className="mt-4 px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                  >
                    Generate Another
                  </button>
                </div>
              ) : (
                // Form State - Simplified & Polished
                <div className="p-6">
                  {/* Top Row: Type & Ratio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Type of Image
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
                        Aspect Ratio <span className="text-red-500">*</span>
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
                          { value: "5:4", label: "Traditional (5:4)" },
                          { value: "21:9", label: "Ultrawide (21:9)" },
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            showErrors &&
                            countWords(genForm.prompt) < 10 &&
                            genForm.prompt.length > 0
                              ? "text-red-500 bg-red-50 border-red-100"
                              : "text-gray-400 bg-gray-50 border-gray-100"
                          }`}
                        >
                          {countWords(genForm.prompt)} words
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {genForm.prompt.length}/1000
                        </span>
                      </div>
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
                            imageSize: "1024x1024",
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
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image._id}
                className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer bg-gray-100"
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

        {/* Enhance Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Wand2 className="text-purple-600" /> Enhance Image
            </div>
          }
          open={isEnhanceModalOpen}
          onCancel={() => setIsEnhanceModalOpen(false)}
          footer={null}
          centered
          width={500}
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Enhance or modify this image using AI. Describe what you want to improve or change.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instruction</label>
              <TextArea
                value={enhanceForm.prompt}
                onChange={e => setEnhanceForm({ ...enhanceForm, prompt: e.target.value })}
                placeholder="Make it higher definition, fix lighting, add a hat..."
                rows={4}
              />
            </div>

            <div className="bg-purple-50 p-3 rounded-lg flex justify-between items-center text-xs text-purple-700">
              <span>Cost: {COSTS.ENHANCE} credits</span>
              <span className="font-bold">Available: {userCredits}</span>
            </div>

            <Button
              type="primary"
              block
              size="large"
              onClick={handleEnhanceImage}
              loading={isEnhancing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 border-none h-12"
            >
              Enhance Image
            </Button>
          </div>
        </Modal>

        {/* Preview Modal (Enhanced) */}
        <Modal
          open={!!previewImage && !isEnhanceModalOpen}
          onCancel={() => setPreviewImage(null)}
          footer={null}
          centered
          width={1000}
          closeIcon={null}
          className="image-detail-modal"
          styles={{
            content: {
              padding: 0,
              borderRadius: "24px",
              overflow: "hidden",
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          {previewImage && (
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
              {/* Left: Image Container */}
              <div className="flex-1 relative group flex items-center justify-center p-2 bg-gray-50">
                <div className="relative max-h-full max-w-full shadow-lg rounded-lg overflow-hidden">
                  <img
                    src={previewImage.url}
                    alt={previewImage.description}
                    className="max-h-[85vh] w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Right: Details */}
              <div className="w-full md:w-[380px] bg-white p-6 md:p-6 flex flex-col overflow-y-auto border-l border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 leading-snug mb-4 flex items-center gap-2">
                  Image Details
                  {canEnhance(previewImage) && (
                    <Tooltip title="AI Generated">
                      <span className="bg-blue-100 text-blue-700 p-1 rounded-md text-xs">
                        <Bot size={14} />
                      </span>
                    </Tooltip>
                  )}
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-gray-600 leading-relaxed text-sm mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    {previewImage.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {/* Alt Text Button */}
                    <button
                      onClick={handleGenerateAltText}
                      className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                    >
                      <Type size={14} /> {isGeneratingAlt ? "Generating..." : "Generate Alt Text"}
                      <span className="bg-gray-200 px-1 rounded text-[10px] text-gray-500">
                        {COSTS.ALT_TEXT}c
                      </span>
                    </button>

                    {/* Enhance Button (Conditional) */}
                    {canEnhance(previewImage) ? (
                      <button
                        onClick={() => setIsEnhanceModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-all"
                      >
                        <Wand2 size={14} /> Enhance
                        <span className="bg-purple-200 px-1 rounded text-[10px] text-purple-700">
                          {COSTS.ENHANCE}c
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center text-xs text-gray-400 italic bg-gray-50 rounded-lg">
                        Enhance unavailable
                      </div>
                    )}
                  </div>

                  {generatedAltText && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                        Generated Alt Text
                      </label>
                      <Tooltip title="Click to copy">
                        <div
                          className="p-3 bg-green-50 text-green-800 text-xs rounded-lg border border-green-100 cursor-pointer hover:bg-green-100 transition-colors select-none"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedAltText)
                            message.success("Alt text copied!")
                          }}
                        >
                          {generatedAltText}
                        </div>
                      </Tooltip>
                    </div>
                  )}

                  {previewImage.tags && previewImage.tags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewImage.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-0 md:mt-6 pt-0 md:pt-6 border-t border-gray-100 space-y-3">
                  <button
                    onClick={() => handleCopyLink(previewImage)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy Image Link
                  </button>
                  <button
                    onClick={() => handleDownload(previewImage)}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Image
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}

export default ImageGallery
