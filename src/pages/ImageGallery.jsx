import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input, Select, Slider, Spin, Empty, Tag, Modal, message, Button } from "antd"
import { Search, Image as ImageIcon, X, Download, Filter, Sparkles } from "lucide-react"
import { Helmet } from "react-helmet"
import { getImages, searchImages } from "@api/imageGalleryApi"
import { debounce } from "lodash"
import { useInView } from "react-intersection-observer"

const { Option } = Select

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
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
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
  const [hasMore, setHasMore] = useState(true)

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  })

  // Available tags (you can make this dynamic by fetching from backend)
  const availableTags = [
    "nature",
    "technology",
    "business",
    "lifestyle",
    "food",
    "travel",
    "architecture",
    "abstract",
    "people",
    "animals",
  ]

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    setImages([]) // Clear images to show loading state or fresh results
  }, [searchQuery, minScore, selectedTags])

  // Fetch images
  const fetchImages = useCallback(async () => {
    if (!hasMore && currentPage > 1) return

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

      setImages(prev => {
        if (currentPage === 1) return newImages
        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(img => img._id))
        const uniqueNewImages = newImages.filter(img => !existingIds.has(img._id))
        return [...prev, ...uniqueNewImages]
      })

      setHasMore(newImages.length === pageSize) // If we got full page, maybe more exists
    } catch (error) {
      console.error("Error fetching images:", error)
      message.error("Failed to load images")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, minScore, selectedTags, searchQuery, hasMore])

  // Initial fetch and pagination trigger
  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setCurrentPage(prev => prev + 1)
    }
  }, [inView, hasMore, loading])

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchQuery(value)
    }, 500),
    []
  )

  const handleSearchChange = e => {
    debouncedSearch(e.target.value)
  }

  const handleTagToggle = tag => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const handleScoreChange = value => {
    setMinScore(value)
  }

  const handleImageClick = image => {
    setPreviewImage(image)
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

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
    setMinScore(0)
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || minScore > 0

  return (
    <>
      <Helmet>
        <title>Image Gallery | GenWrite</title>
      </Helmet>

      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Explore Creations
              </h1>
              <p className="text-gray-500 text-sm mt-2 max-w-md">
                Curated high-quality generations for your next project
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>
          </div>
        </motion.div>

        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${searchQuery}-${selectedTags.join(",")}-${minScore}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
            >
              {images.map((image, index) => (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
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
                      <p className="text-white text-sm line-clamp-2 font-medium mr-2">
                        {image.description}
                      </p>
                      <button
                        onClick={e => handleDownload(image, e)}
                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-lg flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

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

          {/* Infinite Scroll Loader */}
          {hasMore && images.length > 0 && (
            <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
              {loading && <Spin size="large" />}
            </div>
          )}
        </div>

        {/* Enhanced Modal */}
        <Modal
          open={!!previewImage}
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
              <div className="flex-1 relative group flex items-center justify-center p-2">
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
              <div className="w-full md:w-[350px] bg-white p-6 md:p-4 flex flex-col overflow-y-auto border-l border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 leading-snug mb-4">
                  Prompt Details
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-gray-600 leading-relaxed text-sm mb-6">
                    {previewImage.description || "No description provided for this generation."}
                  </p>

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
