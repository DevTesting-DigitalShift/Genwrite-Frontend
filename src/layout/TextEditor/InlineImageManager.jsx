import React, { useState, useEffect } from "react"
import { Reorder } from "framer-motion"
import { Edit3, Trash2, Image as ImageIcon, Check, X, ChevronUp, ChevronDown } from "lucide-react"
import { Popover, Input, message, Modal } from "antd"

/**
 * Parse all images from HTML content
 * Returns array of image objects with src, alt, and position info
 */
export const parseImagesFromHtml = html => {
  if (!html) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const imgElements = doc.querySelectorAll("img")

  const images = []
  imgElements.forEach((img, index) => {
    images.push({
      id: `img-${index}-${Date.now()}`,
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      index: index,
      outerHTML: img.outerHTML,
    })
  })

  return images
}

/**
 * Replace image in HTML content by index
 */
export const replaceImageInHtml = (html, imageIndex, newImageData) => {
  if (!html) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const imgElements = doc.querySelectorAll("img")

  if (imgElements[imageIndex]) {
    const img = imgElements[imageIndex]
    if (newImageData.src !== undefined) img.setAttribute("src", newImageData.src)
    if (newImageData.alt !== undefined) img.setAttribute("alt", newImageData.alt)
  }

  return doc.body.innerHTML
}

/**
 * Delete image from HTML content by index
 */
export const deleteImageFromHtml = (html, imageIndex) => {
  if (!html) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const imgElements = doc.querySelectorAll("img")

  if (imgElements[imageIndex]) {
    imgElements[imageIndex].remove()
  }

  return doc.body.innerHTML
}

/**
 * Reorder images in HTML content
 */
export const reorderImagesInHtml = (html, newOrder) => {
  if (!html || !newOrder || newOrder.length === 0) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const imgElements = Array.from(doc.querySelectorAll("img"))

  if (imgElements.length !== newOrder.length) return html

  // Create a map of old positions to new positions
  const reorderedImages = newOrder
    .map(item => {
      const originalImg = imgElements[item.originalIndex]
      return originalImg ? originalImg.cloneNode(true) : null
    })
    .filter(Boolean)

  // Replace images in order
  imgElements.forEach((img, index) => {
    if (reorderedImages[index]) {
      img.replaceWith(reorderedImages[index])
    }
  })

  return doc.body.innerHTML
}

/**
 * Move image up or down in HTML content
 */
export const moveImageInHtml = (html, imageIndex, direction) => {
  if (!html) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const imgElements = Array.from(doc.querySelectorAll("img"))

  const targetIndex = direction === "up" ? imageIndex - 1 : imageIndex + 1

  if (targetIndex < 0 || targetIndex >= imgElements.length) return html

  // Swap the images
  const currentImg = imgElements[imageIndex]
  const targetImg = imgElements[targetIndex]

  if (!currentImg || !targetImg) return html

  // Clone both images
  const currentClone = currentImg.cloneNode(true)
  const targetClone = targetImg.cloneNode(true)

  // Swap them
  currentImg.replaceWith(targetClone)
  targetImg.replaceWith(currentClone)

  return doc.body.innerHTML
}

/**
 * InlineImageCard - Displays a single image with edit controls
 */
const InlineImageCard = ({ image, imageIndex, totalImages, onUpdate, onDelete, onMove }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingAlt, setEditingAlt] = useState(false)
  const [altText, setAltText] = useState(image.alt || "")
  const [replaceModalOpen, setReplaceModalOpen] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState("")

  const isFirst = imageIndex === 0
  const isLast = imageIndex === totalImages - 1

  const handleUpdateAlt = () => {
    onUpdate(imageIndex, { alt: altText })
    setEditingAlt(false)
    setMenuOpen(false)
    message.success("Alt text updated")
  }

  const handleReplaceImage = () => {
    if (!newImageUrl) {
      message.error("Please enter an image URL")
      return
    }
    onUpdate(imageIndex, { src: newImageUrl })
    setReplaceModalOpen(false)
    setNewImageUrl("")
    setMenuOpen(false)
    message.success("Image replaced")
  }

  const handleDelete = () => {
    onDelete(imageIndex)
    setMenuOpen(false)
    message.success("Image deleted")
  }

  const menuContent = (
    <div className="min-w-[180px]">
      {editingAlt ? (
        <div className="space-y-2">
          <Input
            size="small"
            value={altText}
            onChange={e => setAltText(e.target.value)}
            placeholder="Enter alt text"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdateAlt}
              className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => setEditingAlt(false)}
              className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            onClick={() => {
              setAltText(image.alt || "")
              setEditingAlt(true)
            }}
            className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Alt Text
          </button>
          <button
            onClick={() => {
              setNewImageUrl(image.src || "")
              setReplaceModalOpen(true)
            }}
            className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" /> Replace Image
          </button>
          <div className="border-t my-1"></div>
          <button
            onClick={() => onMove(imageIndex, "up")}
            disabled={isFirst}
            className={`w-full px-2 py-1.5 text-left text-sm rounded flex items-center gap-2 ${
              isFirst ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
          >
            <ChevronUp className="w-4 h-4" /> Move Up
          </button>
          <button
            onClick={() => onMove(imageIndex, "down")}
            disabled={isLast}
            className={`w-full px-2 py-1.5 text-left text-sm rounded flex items-center gap-2 ${
              isLast ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
          >
            <ChevronDown className="w-4 h-4" /> Move Down
          </button>
          <div className="border-t my-1"></div>
          <button
            onClick={handleDelete}
            className="w-full px-2 py-1.5 text-left text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Image
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="relative group mb-4">
        <Popover
          content={menuContent}
          trigger="click"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          placement="bottom"
        >
          <div className="cursor-pointer relative">
            <img
              src={image.src}
              alt={image.alt || "Section image"}
              className="w-full h-auto object-cover rounded-lg shadow-sm transition-all group-hover:brightness-95"
            />
            {/* Overlay hint on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 shadow">
                Click to edit image
              </span>
            </div>
            {/* Image index badge */}
            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
              Image {imageIndex + 1} of {totalImages}
            </div>
          </div>
        </Popover>
      </div>

      {/* Replace Image Modal */}
      <Modal
        title="Replace Image"
        open={replaceModalOpen}
        onCancel={() => setReplaceModalOpen(false)}
        onOk={handleReplaceImage}
        okText="Replace"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Image URL</label>
            <Input
              value={newImageUrl}
              onChange={e => setNewImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          {newImageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
              <img
                src={newImageUrl}
                alt="Preview"
                className="max-h-40 rounded-lg"
                onError={e => (e.target.style.display = "none")}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

/**
 * InlineImageManager - Manages all images within a section's content
 */
export const InlineImageManager = ({ sectionContent, onContentChange }) => {
  const [images, setImages] = useState([])

  useEffect(() => {
    const parsedImages = parseImagesFromHtml(sectionContent)
    setImages(parsedImages)
  }, [sectionContent])

  const handleUpdateImage = (imageIndex, updates) => {
    const updatedHtml = replaceImageInHtml(sectionContent, imageIndex, updates)
    onContentChange(updatedHtml)
  }

  const handleDeleteImage = imageIndex => {
    const updatedHtml = deleteImageFromHtml(sectionContent, imageIndex)
    onContentChange(updatedHtml)
  }

  const handleMoveImage = (imageIndex, direction) => {
    const updatedHtml = moveImageInHtml(sectionContent, imageIndex, direction)
    onContentChange(updatedHtml)
  }

  if (images.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ImageIcon className="w-4 h-4" />
        <span className="font-medium">Section Images ({images.length})</span>
      </div>
      {images.map((image, index) => (
        <InlineImageCard
          key={image.id}
          image={image}
          imageIndex={index}
          totalImages={images.length}
          onUpdate={handleUpdateImage}
          onDelete={handleDeleteImage}
          onMove={handleMoveImage}
        />
      ))}
    </div>
  )
}

export default InlineImageManager
