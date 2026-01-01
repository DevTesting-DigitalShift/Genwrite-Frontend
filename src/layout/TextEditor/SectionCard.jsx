import React, { useState, useEffect, useMemo } from "react"
import { Reorder, useDragControls } from "framer-motion"
import axiosInstance from "@/api"
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued"
import TurndownService from "turndown"
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
  Film,
  Sparkles,
  FileCheck,
  MessageSquare,
} from "lucide-react"
import { Tooltip, Input, message, Modal, Button } from "antd"
import SectionEditor from "./SectionEditor"
import { useEditorContext } from "./EditorContext"
import { EmbedCard, parseEmbedsFromHtml } from "./EmbedManager"

// Helper function to strip markdown and HTML from text
function toPlainText(input = "") {
  return (
    input
      // remove everything from markdown image start till end
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      // remove HTML tags (even broken ones)
      .replace(/<[^>]*>/g, " ")
      // remove markdown links but keep text
      .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
      // remove markdown bold / italic
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // normalize spaces
      .replace(/\s+/g, " ")
      .trim()
  )
}

const SectionCard = ({ section, index }) => {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [imageAltText, setImageAltText] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // Embed state for display
  const [sectionEmbeds, setSectionEmbeds] = useState([])

  // AI Operations state
  const [aiOperationModalOpen, setAiOperationModalOpen] = useState(false)
  const [selectedAiOperation, setSelectedAiOperation] = useState(null) // 'rewrite', 'proofread', 'promptChanges'
  const [customPrompt, setCustomPrompt] = useState("")
  const [isProcessingAI, setIsProcessingAI] = useState(false)

  // AI Result comparison modal
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false)
  const [originalContent, setOriginalContent] = useState("")
  const [newContent, setNewContent] = useState("")
  const [currentOperation, setCurrentOperation] = useState("")

  // Helper to convert HTML to Markdown for clean diff viewing
  const htmlToMarkdown = html => {
    if (!html) return ""
    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    })
    turndownService.keep(["table", "tr", "td", "th"])
    return turndownService.turndown(html)
  }

  const oldMarkdown = useMemo(() => htmlToMarkdown(originalContent), [originalContent])
  const newMarkdown = useMemo(() => htmlToMarkdown(newContent), [newContent])

  const {
    blogId,
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

  // No longer restricting content for free/basic users - all sections are accessible
  const locked = false
  const isEditing = editingIndex === index
  const sectionImage = getSectionImage?.(section.id)
  const isFirst = index === 0
  const isLast = index === sectionsCount - 1

  // Parse embeds from section content
  useEffect(() => {
    if (section.content) {
      const parsedEmbeds = parseEmbedsFromHtml(section.content)
      setSectionEmbeds(parsedEmbeds)
    }
  }, [section.content])

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

  // Handle saving image changes
  const handleSaveImageChanges = async () => {
    if (onUpdateSectionImage && sectionImage) {
      const updates = {}
      if (imageAltText !== sectionImage.altText) updates.altText = imageAltText
      if (imageUrl !== sectionImage.url) updates.url = imageUrl

      if (Object.keys(updates).length > 0) {
        onUpdateSectionImage(section.id, { ...sectionImage, ...updates })

        // Save changes to the database immediately
        if (blogId) {
          try {
            await axiosInstance.put(`/blogs/${blogId}`, {
              images: true, // Flag to indicate we're updating images
            })
            message.success("Image updated and saved successfully")
          } catch (error) {
            console.error("Error saving image changes:", error)
            message.error("Image updated but failed to save to database")
          }
        } else {
          message.success("Image updated successfully")
        }
      }
    }
    setEditModalOpen(false)
  }

  // Handle image delete
  const handleDeleteImage = () => {
    if (onDeleteSectionImage) {
      onDeleteSectionImage(section.id)
      message.success("Image removed")
    }
    setEditModalOpen(false)
  }

  // Handle AI Operations
  const handleAIOperation = operation => {
    setSelectedAiOperation(operation)
    if (operation === "promptChanges") {
      setAiOperationModalOpen(true)
    } else {
      // For rewrite and proofread, execute immediately
      executeAIOperation(operation, "")
    }
  }

  const executeAIOperation = async (operation, userInstructions = "") => {
    if (!blogId) {
      message.error("Blog ID not found. Please save the blog first.")
      return
    }

    setIsProcessingAI(true)
    try {
      const response = await axiosInstance.post(`/blogs/${blogId}/sectionTask`, {
        sectionId: section.id,
        task: operation,
        userInstructions: userInstructions,
      })

      // Store original and new content for comparison
      if (response.data?.content) {
        setOriginalContent(section.content)
        setNewContent(response.data.content)
        setCurrentOperation(operation)
        setAiResultModalOpen(true)
        message.success(`${operation} completed! Review the changes.`)
      }
    } catch (error) {
      console.error("AI Operation Error:", error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to ${operation} section. Please try again.`
      message.error(errorMessage)
    } finally {
      setIsProcessingAI(false)
      setAiOperationModalOpen(false)
      setCustomPrompt("")
    }
  }

  // Handle accepting AI changes
  const handleAcceptAIChanges = () => {
    handleSectionChange(index, { content: newContent })
    setAiResultModalOpen(false)
    message.success("Changes applied successfully!")
    // Reset state
    setOriginalContent("")
    setNewContent("")
    setCurrentOperation("")
  }

  // Handle declining AI changes
  const handleDeclineAIChanges = () => {
    setAiResultModalOpen(false)
    message.info("Changes discarded")
    // Reset state
    setOriginalContent("")
    setNewContent("")
    setCurrentOperation("")
  }

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) {
      message.warning("Please enter a prompt")
      return
    }
    executeAIOperation("promptChanges", customPrompt)
  }

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
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <h2 className="text-xl font-bold">{toPlainText(section.title)}</h2>

            <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* AI Operations Toolbar */}
      {!locked && !isEditing && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-500 font-medium">AI Actions:</span>
          <Tooltip title="Rewrite this section with AI">
            <button
              onClick={() => handleAIOperation("rewrite")}
              disabled={isProcessingAI}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3" />
              Rewrite
            </button>
          </Tooltip>
          <Tooltip title="Proofread and fix errors">
            <button
              onClick={() => handleAIOperation("proofread")}
              disabled={isProcessingAI}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileCheck className="w-3 h-3" />
              Proofread
            </button>
          </Tooltip>
          <Tooltip title="Custom AI prompt">
            <button
              onClick={() => handleAIOperation("promptChanges")}
              disabled={isProcessingAI}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-3 h-3" />
              Custom Prompt
            </button>
          </Tooltip>
          {isProcessingAI && (
            <span className="text-xs text-gray-500 animate-pulse">Processing...</span>
          )}
        </div>
      )}

      {/* Section Image - with unified edit modal */}
      {sectionImage && (
        <div className="my-4 relative group">
          <div
            className="cursor-pointer relative"
            onClick={() => {
              setImageAltText(sectionImage?.altText || "")
              setImageUrl(sectionImage?.url || "")
              setEditModalOpen(true)
            }}
          >
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

      {/* Unified Image Edit Modal - URL replacement only */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <span>Edit Section Image</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={
          <div className="flex items-center justify-between w-full">
            {/* Left: Destructive action */}
            <Button danger icon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteImage}>
              Delete Image
            </Button>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                icon={<Check className="w-4 h-4" />}
                onClick={handleSaveImageChanges}
              >
                Save Changes
              </Button>
            </div>
          </div>
        }
        width={700}
        centered
        bodyStyle={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image Preview */}
          <div className="border rounded-lg bg-gray-50 p-2 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={imageAltText || "Preview"}
              className="max-w-full rounded-lg object-contain"
              style={{ maxHeight: "300px" }}
              onError={e => {
                e.currentTarget.src = sectionImage?.url
              }}
            />
          </div>

          {/* Right: Image Details */}
          <div className="space-y-4">
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
              <p className="text-xs text-gray-500 mt-1">Enter a URL to replace the image</p>
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text <span className="text-red-500">*</span>
              </label>
              <Input.TextArea
                value={imageAltText}
                onChange={e => setImageAltText(e.target.value)}
                placeholder="Describe the image for accessibility and SEO"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Helps with SEO and screen readers. Be descriptive and specific.
              </p>
            </div>
          </div>
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
          {/* Show proofreading badge when there are suggestions */}
          {sectionSuggestions.length > 0 && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              <span className="font-medium text-amber-700">
                {sectionSuggestions.length} suggestion{sectionSuggestions.length > 1 ? "s" : ""}
              </span>
              <span className="text-amber-600">• Click to review</span>
            </div>
          )}
          <div
            className="prose max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
          {!locked && !sectionSuggestions.length && (
            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm text-gray-500">Click to edit</span>
            </div>
          )}
        </div>
      )}

      {/* Add Section Below - appears on hover, but not on last section */}
      {!locked && !isLast && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
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

      {/* Custom Prompt Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Custom AI Prompt</span>
          </div>
        }
        open={aiOperationModalOpen}
        onCancel={() => {
          setAiOperationModalOpen(false)
          setCustomPrompt("")
        }}
        footer={[
          <button
            key="cancel"
            onClick={() => {
              setAiOperationModalOpen(false)
              setCustomPrompt("")
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>,
          <button
            key="submit"
            onClick={handleCustomPromptSubmit}
            disabled={!customPrompt.trim() || isProcessingAI}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          >
            {isProcessingAI ? "Processing..." : "Apply Changes"}
          </button>,
        ]}
        width={520}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Enter your custom instructions for how you want to modify this section:
          </p>
          <Input.TextArea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="E.g., Make it more professional, add statistics, simplify the language..."
            rows={4}
            maxLength={2000}
            showCount
            autoFocus
          />
          <p className="text-xs text-gray-500">
            💡 Tip: Be specific about what changes you want to see in this section.
          </p>
        </div>
      </Modal>

      {/* AI Result Comparison Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Review AI Changes - {currentOperation}</span>
          </div>
        }
        open={aiResultModalOpen}
        onCancel={handleDeclineAIChanges}
        footer={[
          <button
            key="decline"
            onClick={handleDeclineAIChanges}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>,
          <button
            key="accept"
            onClick={handleAcceptAIChanges}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-2"
          >
            Accept Changes
          </button>,
        ]}
        width={1000}
        centered
        className="section-ai-diff-modal"
      >
        <div className="space-y-4">
          <div className="border rounded-lg overflow-y-auto max-h-[70vh]">
            <ReactDiffViewer
              oldValue={oldMarkdown}
              newValue={newMarkdown}
              splitView={true}
              compareMethod={DiffMethod.WORDS}
              leftTitle="Original Content"
              rightTitle="AI Generated Content"
              useDarkTheme={false}
              styles={{
                variables: {
                  light: {
                    diffViewerBackground: "#ffffff",
                    addedBackground: "#e6ffec",
                    addedColor: "#1a7f37",
                    removedBackground: "#ffebe9",
                    removedColor: "#cf222e",
                    wordAddedBackground: "#abf2bc",
                    wordRemovedBackground: "#ffc1c0",
                  },
                },
                line: {
                  fontSize: "14px",
                  lineHeight: "1.6",
                },
              }}
            />
          </div>
        </div>
      </Modal>
    </Reorder.Item>
  )
}

export default SectionCard
