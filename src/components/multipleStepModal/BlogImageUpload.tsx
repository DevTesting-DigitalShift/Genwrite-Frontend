import React, { useState, useEffect, useMemo } from "react"
import toast from "@utils/toast"
import ImageGalleryPicker from "@components/ImageGalleryPicker"
import {
  Upload as UploadIcon,
  Trash2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface UploadFile {
  uid: string
  name: string
  status: string
  url: string
  thumbUrl?: string
  originFileObj?: File
}

interface BlogImageUploadProps {
  id: string
  label: string
  initialFiles?: UploadFile[] // previously selected images
  maxCount?: number // default: 15
  onChange?: (files: UploadFile[]) => void
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE_MB = 1
const ITEMS_PER_PAGE_MOBILE = 6
const ITEMS_PER_PAGE_DESKTOP = 9

const BlogImageUpload: React.FC<BlogImageUploadProps> = ({
  id,
  label,
  initialFiles = [],
  maxCount = 15,
  onChange,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>(initialFiles)
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE_DESKTOP)

  // Detect screen size for responsive pagination
  useEffect(() => {
    const handleResize = () => {
      setPageSize(window.innerWidth >= 640 ? ITEMS_PER_PAGE_DESKTOP : ITEMS_PER_PAGE_MOBILE)
    }

    // Set initial size
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Sync initialFiles if provided later (e.g. when navigating back)
  useEffect(() => {
    if (
      initialFiles.length !== fileList.length ||
      initialFiles.some((f, i) => f.uid !== fileList[i]?.uid)
    ) {
      setFileList(initialFiles)
    }
  }, [initialFiles])

  // Reset to page 1 if current page exceeds total pages after deletion
  useEffect(() => {
    const totalPages = Math.ceil(fileList.length / pageSize)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [fileList.length, pageSize, currentPage])

  /** Validate and process file upload */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: UploadFile[] = []

    files.forEach(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type.`)
        return
      }

      if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
        toast.error(`${file.name} exceeds 1MB limit.`)
        return
      }

      validFiles.push({
        uid: `${Date.now()}-${file.name}`,
        name: file.name,
        status: "done",
        url: URL.createObjectURL(file), // Create object URL for preview
        originFileObj: file,
        thumbUrl: URL.createObjectURL(file),
      })
    })

    if (validFiles.length > 0) {
      const remainingSlots = maxCount - fileList.length
      if (validFiles.length > remainingSlots) {
        toast.error(`Only ${remainingSlots} more images allowed.`)
        validFiles.splice(remainingSlots)
      }

      const updated = [...fileList, ...validFiles]
      setFileList(updated)
      onChange?.(updated)
    }

    // Reset input
    e.target.value = ""
  }

  /** Handle image removal */
  const handleRemove = (file: UploadFile) => {
    const updated = fileList.filter(f => f.uid !== file.uid)
    setFileList(updated)
    onChange?.(updated)
  }

  /** Handle image selection from gallery */
  const handleSelectFromGallery = (url: string, alt: string) => {
    // Check if already at max count
    if (fileList.length >= maxCount) {
      toast.error(`Maximum ${maxCount} images allowed`)
      return
    }

    // Check if this URL already exists
    const exists = fileList.some(f => f.url === url)
    if (exists) {
      toast.error("This image is already added")
      return
    }

    // Create a new UploadFile object from the gallery image
    const newFile: UploadFile = {
      uid: `gallery-${Date.now()}-${Math.random()}`,
      name: alt || "Gallery Image",
      status: "done",
      url: url,
      thumbUrl: url,
    }

    const updated = [...fileList, newFile]
    setFileList(updated)
    onChange?.(updated)
    toast.success("Image added from gallery")
  }

  // Calculate paginated files
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return fileList.slice(startIndex, endIndex)
  }, [fileList, currentPage, pageSize])

  const totalPages = Math.ceil(fileList.length / pageSize)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center w-full flex-col sm:flex-row gap-2">
        <label htmlFor={id} className="font-medium text-sm sm:text-base">
          {label} (Max {maxCount}, each {MAX_SIZE_MB}MB)
        </label>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Gallery Picker Toggle */}
          <button
            onClick={() => setShowGalleryPicker(prev => !prev)}
            className={`btn btn-sm ${showGalleryPicker ? "btn-primary" : "btn-outline"} flex-1 sm:flex-none text-xs sm:text-sm`}
          >
            <ImageIcon size={16} className="mr-2" />
            {showGalleryPicker ? "Hide Gallery" : "Browse Gallery"}
          </button>

          {/* Upload from Device */}
          {fileList.length < maxCount && (
            <>
              <input
                type="file"
                id={id}
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor={id}
                className="btn btn-sm btn-outline border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 flex-1 sm:flex-none"
              >
                <UploadIcon size={16} className="mr-2" />
                Upload Device
              </label>
            </>
          )}
        </div>
      </div>

      {/* Gallery Picker Section */}
      {showGalleryPicker && (
        <div className="border-2 border-blue-200 rounded-lg p-3 sm:p-4 bg-gray-50 h-[400px] sm:h-[500px]">
          <ImageGalleryPicker
            onSelect={handleSelectFromGallery}
            selectedImageUrl={""} // Could track last selected if needed
          />
        </div>
      )}

      {/* Uploaded/Selected Images Grid with Pagination */}
      {fileList.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 border border-violet-200 rounded-lg p-2 min-h-[220px]">
            {paginatedFiles.map(file => {
              const url = file.thumbUrl || file.url
              return (
                <div
                  key={file.uid}
                  className="relative group rounded-lg overflow-hidden border border-base-200 aspect-4/3"
                >
                  <img
                    src={url}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      className="btn btn-circle btn-error btn-sm text-white"
                      onClick={() => handleRemove(file)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {fileList.length > pageSize && (
            <div className="flex justify-center mt-2">
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button className="join-item btn btn-sm pointer-events-none">
                  Page {currentPage} of {totalPages}
                </button>
                <button
                  className="join-item btn btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {fileList.length > pageSize && (
            <div className="text-center text-xs text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, fileList.length)} of {fileList.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BlogImageUpload
