import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input, Select, Slider, Pagination, Spin, Empty, Tag, Modal, message } from "antd"
import { Search, Image as ImageIcon, X, Download, ZoomIn, Filter, Sparkles } from "lucide-react"
import { Helmet } from "react-helmet"
import { getImages, searchImages } from "@api/imageGalleryApi"
import { debounce } from "lodash"

const { Option } = Select

const ImageGallery = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(24)
  const [totalImages, setTotalImages] = useState(0)
  const [minScore, setMinScore] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

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

      setImages(response.data || [])
      setTotalImages(response.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching images:", error)
      message.error("Failed to load images")
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, minScore, selectedTags, searchQuery])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchQuery(value)
      setCurrentPage(1)
    }, 500),
    []
  )

  const handleSearchChange = e => {
    debouncedSearch(e.target.value)
  }

  const handleTagToggle = tag => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
    setCurrentPage(1)
  }

  const handleScoreChange = value => {
    setMinScore(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page, size) => {
    setCurrentPage(page)
    if (size !== pageSize) {
      setPageSize(size)
      setCurrentPage(1)
    }
  }

  const handleImageClick = image => {
    setPreviewImage(image)
  }

  const handleDownload = async image => {
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
      message.error("Failed to download image")
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
    setMinScore(0)
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || minScore > 0

  return (
    <>
      <Helmet>
        <title>Image Gallery | GenWrite</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Image Gallery
              </h1>
              <p className="text-gray-600">
                Discover and download high-quality images for your content
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <span className="text-sm text-gray-500">Total Images:</span>
                <span className="ml-2 text-lg font-bold text-blue-600">{totalImages}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search images by description or tags..."
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                showFilters
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                  {(selectedTags.length > 0 ? 1 : 0) + (minScore > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedTags.includes(tag)
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Score Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Quality Score: {minScore}
                    </label>
                    <Slider
                      min={0}
                      max={100}
                      value={minScore}
                      onChange={handleScoreChange}
                      className="max-w-md"
                    />
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Images Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" />
          </div>
        ) : images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-lg"
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-xl font-semibold text-gray-700 mb-2">No images found</p>
                  <p className="text-gray-500">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search query"
                      : "No images available at the moment"}
                  </p>
                </div>
              }
            />
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8"
            >
              {images.map((image, index) => (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.description || "Gallery image"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm line-clamp-2 mb-2">
                        {image.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          <span className="text-white text-sm font-semibold">{image.score}</span>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleDownload(image)
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {image.tags && image.tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {image.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {image.tags.length > 2 && (
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
                          +{image.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalImages}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={[12, 24, 48, 96]}
                showTotal={total => `Total ${total} images`}
                className="bg-white px-6 py-4 rounded-xl shadow-lg"
              />
            </div>
          </>
        )}

        {/* Image Preview Modal */}
        <Modal
          open={!!previewImage}
          onCancel={() => setPreviewImage(null)}
          footer={null}
          width="90%"
          style={{ maxWidth: "1200px" }}
          centered
          className="image-preview-modal"
        >
          {previewImage && (
            <div className="p-4">
              <div className="mb-4">
                <img
                  src={previewImage.url}
                  alt={previewImage.description}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {previewImage.description || "Image Details"}
                </h3>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <span className="text-lg font-semibold">Quality Score: {previewImage.score}</span>
                </div>
                {previewImage.tags && previewImage.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {previewImage.tags.map((tag, i) => (
                        <Tag key={i} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleDownload(previewImage)}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}

export default ImageGallery
