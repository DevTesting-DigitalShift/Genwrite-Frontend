import React, { useState } from "react"
import { motion, Reorder, useDragControls } from "framer-motion"
import {
  Trash2,
  Lock,
  Edit3,
  Image as ImageIcon,
  Check,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react"
import { Tooltip, Input, message, Modal, Popover } from "antd"
import SectionEditor from "./SectionEditor"
import { useEditorContext } from "./EditorContext"

const SectionCard = ({ section, index }) => {
  const [editingTitle, setEditingTitle] = useState(false)
  const [imageMenuOpen, setImageMenuOpen] = useState(false)
  const [editingImageAlt, setEditingImageAlt] = useState(false)
  const [imageAltText, setImageAltText] = useState("")
  const [replaceImageModalOpen, setReplaceImageModalOpen] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState("")

  const {
    userPlan,
    editingIndex,
    setEditingIndex,
    handleDelete,
    handleSectionChange,
    handleSectionTitleChange,
    handleAddSection,
    handleMoveSection,
    sectionsCount,
    navigateToPricing,
    getSectionImage,
    proofreadingResults,
    handleReplace,
    onUpdateSectionImage,
    onDeleteSectionImage,
  } = useEditorContext()

  const locked = userPlan === "free" && index > 1
  const isEditing = editingIndex === index
  const sectionImage = getSectionImage?.(section.id)
  const isFirst = index === 0
  const isLast = index === sectionsCount - 1

  // Helper function to strip HTML tags for text comparison
  const stripHtml = html => {
    if (!html) return ""
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim()
  }

  // Filter proofreading suggestions that match this section's content
  const sectionSuggestions = (proofreadingResults || []).filter(suggestion => {
    if (!section.content || !suggestion.original) return false
    // Check if original text exists in the section content (plain text or HTML)
    const plainContent = stripHtml(section.content)
    return (
      section.content.includes(suggestion.original) || plainContent.includes(suggestion.original)
    )
  })

  // Handle accepting a proofreading suggestion
  const handleAcceptSuggestion = suggestion => {
    if (!suggestion?.original || !suggestion?.change) return

    // Call handleReplace which updates sections and removes from suggestion list
    if (handleReplace) {
      handleReplace(suggestion.original, suggestion.change)
      message.success("Change applied!")
    }
  }

  // Handle image alt text update
  const handleUpdateAlt = () => {
    if (onUpdateSectionImage && sectionImage) {
      onUpdateSectionImage(section.id, { ...sectionImage, altText: imageAltText })
      message.success("Alt text updated")
    }
    setEditingImageAlt(false)
    setImageMenuOpen(false)
  }

  // Handle image delete
  const handleDeleteImage = () => {
    if (onDeleteSectionImage) {
      onDeleteSectionImage(section.id)
      message.success("Image removed")
    }
    setImageMenuOpen(false)
  }

  // Handle image replace
  const handleReplaceImage = () => {
    if (!newImageUrl) {
      message.error("Please enter an image URL")
      return
    }
    if (onUpdateSectionImage && sectionImage) {
      onUpdateSectionImage(section.id, { ...sectionImage, url: newImageUrl })
      message.success("Image replaced")
    }
    setReplaceImageModalOpen(false)
    setNewImageUrl("")
    setImageMenuOpen(false)
  }

  // Image action menu content
  const imageMenuContent = (
    <div className="min-w-[150px]">
      {editingImageAlt ? (
        <div className="space-y-2">
          <Input
            size="small"
            value={imageAltText}
            onChange={e => setImageAltText(e.target.value)}
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
              onClick={() => setEditingImageAlt(false)}
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
              setImageAltText(sectionImage?.altText || "")
              setEditingImageAlt(true)
            }}
            className="w-full px-1 py-1 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Alt Text
          </button>
          <button
            onClick={() => {
              setNewImageUrl(sectionImage?.url || "")
              setReplaceImageModalOpen(true)
            }}
            className="w-full px-1 py-1 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" /> Replace Image
          </button>
          <button
            onClick={handleDeleteImage}
            className="w-full px-1 py-1 text-left text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Image
          </button>
        </div>
      )}
    </div>
  )

  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={section}
      id={section.id || `section-${index}`}
      dragListener={false}
      dragControls={dragControls}
      className="relative border rounded-xl p-5 shadow-sm bg-white mb-6 hover:shadow-md transition-shadow group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        zIndex: 50,
        cursor: "grabbing",
      }}
    >
      {/* Locked overlay for free users */}
      {locked && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 font-medium">Upgrade to unlock</p>
            <button
              onClick={e => {
                e.stopPropagation()
                navigateToPricing()
              }}
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Action buttons - move and delete */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Move Up */}
        <Tooltip title="Move Up">
          <button
            onClick={e => {
              e.stopPropagation()
              handleMoveSection(index, "up")
            }}
            disabled={isFirst}
            className={`p-1.5 rounded-lg transition-colors ${
              isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
          >
            <ChevronUp className="w-4 h-4 text-gray-500" />
          </button>
        </Tooltip>
        {/* Move Down */}
        <Tooltip title="Move Down">
          <button
            onClick={e => {
              e.stopPropagation()
              handleMoveSection(index, "down")
            }}
            disabled={isLast}
            className={`p-1.5 rounded-lg transition-colors ${
              isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </Tooltip>
        {/* Delete */}
        <Tooltip title="Delete Section">
          <button
            onClick={e => {
              e.stopPropagation()
              handleDelete(index)
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </Tooltip>
      </div>

      {/* Drag handle - functional for drag and drop */}
      {!locked && (
        <Tooltip title="Drag to reorder">
          <div
            className="absolute top-1/2 -left-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg z-30"
            onPointerDown={e => {
              e.preventDefault()
              dragControls.start(e)
            }}
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
        </Tooltip>
      )}

      {/* Section title - editable */}
      <div className="mb-3 pr-12">
        {editingTitle ? (
          <Input
            value={section.title}
            onChange={e => handleSectionTitleChange(index, e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onPressEnter={() => setEditingTitle(false)}
            autoFocus
            className="text-xl font-bold"
          />
        ) : (
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={e => {
              e.stopPropagation()
              setEditingTitle(true)
            }}
          >
            <h2 className="text-xl font-bold">{section.title}</h2>
            <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Section Image - with edit options */}
      {sectionImage && (
        <div className="mb-4 relative group">
          <Popover
            content={imageMenuContent}
            trigger="click"
            open={imageMenuOpen}
            onOpenChange={setImageMenuOpen}
            placement="bottom"
            className="p-0"
          >
            <div className="cursor-pointer relative">
              <img
                src={sectionImage.url}
                alt={sectionImage.altText || section.title}
                className="w-full h-full object-cover rounded-lg shadow-sm transition-all group-hover:brightness-95"
              />
              {/* Overlay hint on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 shadow">
                  Click to edit image
                </span>
              </div>
            </div>
          </Popover>
          {sectionImage.attribution?.name && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              Photo by{" "}
              <a
                href={sectionImage.attribution.profile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {sectionImage.attribution.name}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Replace Image Modal */}
      <Modal
        title="Replace Image"
        open={replaceImageModalOpen}
        onCancel={() => setReplaceImageModalOpen(false)}
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

      {/* Content area - always editable, no reveal */}
      {isEditing ? (
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          <SectionEditor
            initialContent={section.content}
            onChange={html => handleSectionChange(index, { content: html })}
            onBlur={() => setEditingIndex(null)}
            proofreadingResults={sectionSuggestions}
            onAcceptSuggestion={handleAcceptSuggestion}
          />
        </div>
      ) : (
        <div className="cursor-pointer group" onClick={() => !locked && setEditingIndex(index)}>
          <div
            className="prose max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
          {!locked && (
            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm text-gray-500">Click to edit</span>
            </div>
          )}
        </div>
      )}

      {/* Add Section Below - appears on hover */}
      {!locked && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity z-30">
          <Tooltip title="Add section below">
            <button
              onClick={e => {
                e.stopPropagation()
                handleAddSection(index)
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Section
            </button>
          </Tooltip>
        </div>
      )}
    </Reorder.Item>
  )
}

export default SectionCard
