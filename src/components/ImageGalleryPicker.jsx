import { useState, useEffect, useCallback } from "react"
import { Search, Image as ImageIcon, Check } from "lucide-react"
import { getImages, searchImages } from "@api/imageGalleryApi"
import DebouncedSearchInput from "@components/ui/DebouncedSearchInput"
import toast from "@utils/toast"

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
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="break-inside-avoid rounded-xl overflow-hidden bg-gray-100 animate-pulse"
        >
          <div
            className={`w-full ${
              heights[index % heights.length]
            } bg-linear-to-br from-gray-200 via-gray-100 to-gray-200 bg-size-200% animate-shimmer`}
          ></div>
        </div>
      ))}
    </div>
  )
}

const ImageGalleryPicker = ({ onSelect, selectedImageUrl }) => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch images
  const fetchImages = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const params = { page, limit: pageSize }

        let response
        if (searchQuery.trim()) {
          response = await searchImages({ ...params, q: searchQuery })
        } else {
          response = await getImages(params)
        }

        const newImages = response.data || []
        const pagination = response.pagination || {}

        if (append) {
          setImages(prev => [...prev, ...newImages])
        } else {
          setImages(newImages)
        }

        // Check if there are more pages
        setHasMore(pagination.page < pagination.totalPages)
      } catch (error) {
        console.error("Error fetching images:", error)
        toast.error("Failed to load images")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [pageSize, searchQuery]
  )

  // Reset and fetch when search changes
  useEffect(() => {
    setCurrentPage(1)
    setImages([])
    fetchImages(1, false)
  }, [searchQuery])

  const handleImageClick = image => {
    if (onSelect) {
      onSelect(image.url, image.description || "")
    }
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchImages(nextPage, true)
  }

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="flex flex-col h-full">
        {/* Search Bar */}
        <div className="mb-4 shrink-0">
          <DebouncedSearchInput
            onSearch={setSearchQuery}
            placeholder="Search images..."
            debounceTime={500}
            className="input input-bordered w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Images Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading && images.length === 0 ? (
            <SkeletonGrid count={12} />
          ) : images.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No images found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4">
                {images.map(image => (
                  <div
                    key={image._id}
                    className={`break-inside-avoid relative group rounded-lg md:rounded-xl overflow-hidden cursor-pointer bg-gray-100 transition-all ${
                      selectedImageUrl === image.url
                        ? "ring-4 ring-blue-500 ring-offset-2"
                        : "hover:ring-2 hover:ring-blue-300"
                    }`}
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.description}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Selected Indicator */}
                    {selectedImageUrl === image.url && (
                      <div className="absolute top-2 right-2 p-2 bg-blue-600 rounded-full shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 md:p-4">
                      <p className="text-white text-xs md:text-sm line-clamp-2 font-medium">
                        {image.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn btn-lg px-6 md:px-8 rounded-lg w-full sm:w-auto"
                  >
                    {loadingMore && <span className="loading loading-spinner"></span>}
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ImageGalleryPicker
