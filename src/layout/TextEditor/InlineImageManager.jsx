import React, { useState, useEffect } from "react"
import { Reorder } from "framer-motion"
import { Edit3, Trash2, Image as ImageIcon, Check, X, ChevronUp, ChevronDown } from "lucide-react"
import { Input, message, Modal, Button } from "antd"

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
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [altText, setAltText] = useState(image.alt || "")
  const [imageUrl, setImageUrl] = useState(image.src || "")

  const isFirst = imageIndex === 0
  const isLast = imageIndex === totalImages - 1

  const handleSaveChanges = () => {
    const updates = {}
    if (altText !== image.alt) updates.alt = altText
    if (imageUrl !== image.src) updates.src = imageUrl

    if (Object.keys(updates).length > 0) {
      onUpdate(imageIndex, updates)
      message.success("Image updated successfully")
    }
    setEditModalOpen(false)
  }

  const handleDelete = () => {
    onDelete(imageIndex)
    setEditModalOpen(false)
    message.success("Image deleted")
  }

  const handleMoveUp = () => {
    onMove(imageIndex, "up")
    setEditModalOpen(false)
    message.success("Image moved up")
  }

  const handleMoveDown = () => {
    onMove(imageIndex, "down")
    setEditModalOpen(false)
    message.success("Image moved down")
  }

  return (
    <>
      <div className="relative group mb-4">
        <div
          className="cursor-pointer relative"
          onClick={() => {
            setAltText(image.alt || "")
            setImageUrl(image.src || "")
            setEditModalOpen(true)
          }}
        >
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
      </div>

      {/* Edit Image Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <span>Edit Image {imageIndex + 1}</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={
          <div className="flex items-center justify-between">
            {/* Left: Destructive action */}
            <Button danger icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
              Delete
            </Button>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                icon={<ChevronUp className="w-4 h-4" />}
                onClick={handleMoveUp}
                disabled={isFirst}
              >
                Move Up
              </Button>
              <Button
                icon={<ChevronDown className="w-4 h-4" />}
                onClick={handleMoveDown}
                disabled={isLast}
              >
                Move Down
              </Button>
              <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                icon={<Check className="w-4 h-4" />}
                onClick={handleSaveChanges}
              >
                Save
              </Button>
            </div>
          </div>
        }
        width={700}
        centered
        bodyStyle={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
      >
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="border rounded-lg overflow-hidden bg-gray-50 p-3 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={altText || "Preview"}
              className="max-w-full h-auto rounded-lg object-contain"
              style={{ maxHeight: "200px" }}
              onError={e => {
                e.target.src = image.src // Fallback to original if new URL fails
              }}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL <span className="text-red-500">*</span>
            </label>
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Describe what's in the image. This helps with SEO and accessibility.
            </p>
            <Input.TextArea
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility and SEO"
              rows={10}
            />
          </div>

          {/* Position Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Position</p>
            <p className="text-sm text-blue-700 font-medium">
              Image {imageIndex + 1} of {totalImages} in this section
            </p>
          </div>
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
