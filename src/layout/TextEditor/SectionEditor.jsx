import React, { useEffect, useState, useRef } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { getLinkPreview } from "link-preview-js"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  ExternalLink,
  X,
  Trash2,
  Edit,
  Check,
  Loader2,
} from "lucide-react"
import { Tooltip, message, Modal, Input } from "antd"

const ToolbarButton = ({ active, onClick, disabled, children, title }) => (
  <Tooltip title={title}>
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`p-2 rounded-md transition-colors duration-150 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : active
          ? "bg-blue-100 text-blue-600"
          : "hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  </Tooltip>
)

const SectionEditor = ({ initialContent, onChange, onBlur, proofreadingResults = [] }) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAltText, setImageAltText] = useState("")
  const [selectedLink, setSelectedLink] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageEditMode, setImageEditMode] = useState(false)

  // Link hover preview state with metadata
  const [hoveredLink, setHoveredLink] = useState(null)
  const [linkPreviewData, setLinkPreviewData] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef(null)
  const editorContainerRef = useRef(null)
  const previewCacheRef = useRef({}) // Cache previews to avoid refetching

  // Proofreading state
  const [activeProofSpan, setActiveProofSpan] = useState(null)
  const proofBubbleRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto object-contain my-4 cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ProofreadingDecoration.configure({
        suggestions: proofreadingResults,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[200px] " +
          "[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 " +
          "[&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-3 " +
          "[&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mb-2 " +
          "[&>p]:mb-4 [&>p]:leading-relaxed " +
          "[&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-2 " +
          "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li]:mb-2 " +
          "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg",
      },
      handleClick: (view, pos, event) => {
        // Check if clicked on a link
        const link = event.target.closest("a")
        if (link) {
          event.preventDefault()
          setSelectedLink({
            href: link.href,
            text: link.textContent,
            element: link,
          })
          setSelectedImage(null)
          return true
        }

        // Check if clicked on an image
        const img = event.target.closest("img")
        if (img) {
          event.preventDefault()
          setSelectedImage({
            src: img.src,
            alt: img.alt || "",
            element: img,
          })
          setSelectedLink(null)
          setImageEditMode(false)
          return true
        }

        // Check if clicked on proofreading mark
        const proofMark = event.target.closest(".proofreading-mark")
        if (proofMark && proofMark.dataset.suggestion) {
          event.preventDefault()
          setActiveProofSpan(proofMark)
          return true
        }

        setSelectedLink(null)
        setSelectedImage(null)
        setActiveProofSpan(null)
        return false
      },
    },
  })

  // Update proofreading suggestions when they change
  useEffect(() => {
    if (editor && proofreadingResults?.length > 0) {
      const proofExt = editor.extensionManager.extensions.find(
        ext => ext.name === "proofreadingDecoration"
      )
      if (proofExt) {
        proofExt.options.suggestions = proofreadingResults
        editor.view.dispatch(editor.state.tr)
      }
    }
  }, [proofreadingResults, editor])

  // Update content when initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, false)
    }
  }, [initialContent, editor])

  if (!editor) return null

  // Proofreading handlers
  const applyProofChange = () => {
    if (!activeProofSpan || !editor) return

    const from = Number(activeProofSpan.dataset.from)
    const to = Number(activeProofSpan.dataset.to)
    const suggestion = activeProofSpan.dataset.suggestion

    if (!suggestion || isNaN(from) || isNaN(to)) return

    try {
      editor.chain().focus().deleteRange({ from, to }).insertContent(suggestion).run()
      setActiveProofSpan(null)
      message.success("Change applied")
    } catch (error) {
      console.error("Error applying change:", error)
    }
  }

  const rejectProofChange = () => {
    setActiveProofSpan(null)
  }

  // Link handlers
  const handleAddLink = () => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, " ")
    setLinkText(selectedText)
    setLinkUrl("")
    setLinkModalOpen(true)
  }

  const confirmAddLink = () => {
    if (!linkUrl) {
      message.error("Please enter a URL")
      return
    }

    let url = linkUrl
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    if (linkText && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${linkText}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }

    setLinkModalOpen(false)
    setLinkUrl("")
    setLinkText("")
    message.success("Link added")
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
    setSelectedLink(null)
    message.success("Link removed")
  }

  // Image handlers
  const handleAddImage = () => {
    setImageUrl("")
    setImageAltText("")
    setImageModalOpen(true)
  }

  const confirmAddImage = () => {
    if (!imageUrl) {
      message.error("Please enter an image URL")
      return
    }

    let url = imageUrl
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    editor.chain().focus().setImage({ src: url, alt: imageAltText }).run()
    setImageModalOpen(false)
    setImageUrl("")
    setImageAltText("")
    message.success("Image added")
  }

  const updateImageAlt = () => {
    if (selectedImage && selectedImage.element) {
      selectedImage.element.alt = imageAltText
      // Force content update
      onChange(editor.getHTML())
      setImageEditMode(false)
      message.success("Alt text updated")
    }
  }

  const deleteSelectedImage = () => {
    if (selectedImage && editor) {
      // Find and delete the image node
      const { state } = editor
      let imagePos = null

      state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
          imagePos = pos
          return false
        }
      })

      if (imagePos !== null) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: imagePos, to: imagePos + 1 })
          .run()
        setSelectedImage(null)
        message.success("Image deleted")
      }
    }
  }

  const replaceImage = () => {
    setImageUrl(selectedImage?.src || "")
    setImageAltText(selectedImage?.alt || "")
    setImageModalOpen(true)

    // Delete the old image first
    if (selectedImage && editor) {
      const { state } = editor
      let imagePos = null

      state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
          imagePos = pos
          return false
        }
      })

      if (imagePos !== null) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: imagePos, to: imagePos + 1 })
          .run()
      }
    }
    setSelectedImage(null)
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg flex-wrap">
        {/* Headings */}
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          title="Bold (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline (Ctrl+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          title="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          title="Align Left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align Center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align Right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link & Image */}
        <ToolbarButton title="Add Link" active={editor.isActive("link")} onClick={handleAddLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Add Image" onClick={handleAddImage}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo (Ctrl+Y)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Link Preview Bar */}
      {selectedLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b text-sm">
          <LinkIcon className="w-4 h-4 text-blue-600" />
          <a
            href={selectedLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate flex-1"
          >
            {selectedLink.href}
          </a>
          <Tooltip title="Open Link">
            <a
              href={selectedLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-blue-100 rounded"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </a>
          </Tooltip>
          <Tooltip title="Remove Link">
            <button onClick={removeLink} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Image Edit Bar */}
      {selectedImage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b text-sm">
          <ImageIcon className="w-4 h-4 text-purple-600" />
          {imageEditMode ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                size="small"
                value={imageAltText}
                onChange={e => setImageAltText(e.target.value)}
                placeholder="Alt text"
                className="flex-1"
              />
              <Tooltip title="Save">
                <button onClick={updateImageAlt} className="p-1 hover:bg-green-100 rounded">
                  <Check className="w-4 h-4 text-green-600" />
                </button>
              </Tooltip>
              <Tooltip title="Cancel">
                <button
                  onClick={() => setImageEditMode(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <>
              <span className="text-purple-700 truncate flex-1">
                {selectedImage.alt || "No alt text"}
              </span>
              <Tooltip title="Edit Alt Text">
                <button
                  onClick={() => {
                    setImageAltText(selectedImage.alt || "")
                    setImageEditMode(true)
                  }}
                  className="p-1 hover:bg-purple-100 rounded"
                >
                  <Edit className="w-4 h-4 text-purple-600" />
                </button>
              </Tooltip>
              <Tooltip title="Replace Image">
                <button onClick={replaceImage} className="p-1 hover:bg-blue-100 rounded">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                </button>
              </Tooltip>
              <Tooltip title="Delete Image">
                <button onClick={deleteSelectedImage} className="p-1 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      )}

      {/* Proofreading Popup */}
      {activeProofSpan && (
        <div
          ref={proofBubbleRef}
          className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b text-sm"
        >
          <span className="text-amber-700">
            <strong>Suggestion:</strong> {activeProofSpan.dataset.suggestion}
          </span>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={applyProofChange}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Accept
            </button>
            <button
              onClick={rejectProofChange}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div
        ref={editorContainerRef}
        className="p-4 relative"
        onClick={() => editor.chain().focus().run()}
        onMouseOver={e => {
          const link = e.target.closest("a")
          if (link) {
            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
            }
            // Set hover after a small delay to avoid flickering
            hoverTimeoutRef.current = setTimeout(async () => {
              const rect = link.getBoundingClientRect()
              const containerRect = editorContainerRef.current?.getBoundingClientRect()
              if (containerRect) {
                setHoverPosition({
                  x: Math.min(rect.left - containerRect.left, containerRect.width - 280),
                  y: rect.bottom - containerRect.top + 5,
                })
              }

              const linkHref = link.href
              setHoveredLink({
                href: linkHref,
                text: link.textContent,
              })

              // Check cache first
              if (previewCacheRef.current[linkHref]) {
                setLinkPreviewData(previewCacheRef.current[linkHref])
              } else {
                // Fetch link preview using getLinkPreview
                setIsLoadingPreview(true)
                setLinkPreviewData(null)
                try {
                  const preview = await getLinkPreview(linkHref, {
                    timeout: 5000,
                    followRedirects: "follow",
                    headers: {
                      "user-agent": "googlebot",
                    },
                  })

                  const previewData = {
                    title: preview.title || "",
                    description: preview.description || "",
                    image: preview.images?.[0] || preview.favicons?.[0] || "",
                    siteName: preview.siteName || new URL(linkHref).hostname,
                  }

                  previewCacheRef.current[linkHref] = previewData
                  setLinkPreviewData(previewData)
                } catch (error) {
                  console.log("Link preview failed:", error.message)
                  // Fallback: just show the URL
                  const fallbackData = {
                    title: "",
                    description: "",
                    image: "",
                    siteName: new URL(linkHref).hostname,
                  }
                  previewCacheRef.current[linkHref] = fallbackData
                  setLinkPreviewData(fallbackData)
                } finally {
                  setIsLoadingPreview(false)
                }
              }
            }, 300)
          }
        }}
        onMouseOut={e => {
          const link = e.target.closest("a")
          const relatedTarget = e.relatedTarget
          if (link && (!relatedTarget || !relatedTarget.closest?.(".link-hover-preview"))) {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
            }
            // Delay hiding to allow moving to the tooltip
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredLink(null)
              setLinkPreviewData(null)
            }, 200)
          }
        }}
      >
        <EditorContent editor={editor} />

        {/* Link Hover Preview Tooltip with Rich Preview */}
        {hoveredLink && !selectedLink && (
          <div
            className="link-hover-preview absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72"
            style={{ left: hoverPosition.x, top: hoverPosition.y }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
              }
            }}
            onMouseLeave={() => {
              setHoveredLink(null)
              setLinkPreviewData(null)
            }}
          >
            {isLoadingPreview ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-500">Loading preview...</span>
              </div>
            ) : linkPreviewData ? (
              <div>
                {/* Preview Image */}
                {linkPreviewData.image && (
                  <div className="mb-2 -mx-3 -mt-3">
                    <img
                      src={linkPreviewData.image}
                      alt=""
                      className="w-full h-32 object-cover rounded-t-lg"
                      onError={e => (e.target.style.display = "none")}
                    />
                  </div>
                )}

                {/* Preview Title */}
                {linkPreviewData.title && (
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                    {linkPreviewData.title}
                  </h4>
                )}

                {/* Preview Description */}
                {linkPreviewData.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {linkPreviewData.description}
                  </p>
                )}

                {/* Site Name */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <LinkIcon className="w-3 h-3" />
                  <span className="truncate">{linkPreviewData.siteName}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a
                  href={hoveredLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm truncate"
                >
                  {hoveredLink.href}
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-1 pt-2 border-t border-gray-100">
              <a
                href={hoveredLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Open
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(hoveredLink.href)
                  message.success("Link copied!")
                  setHoveredLink(null)
                }}
                className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Link Modal */}
      <Modal
        title="Add Link"
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        onOk={confirmAddLink}
        okText="Add Link"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Text (optional)
            </label>
            <Input
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              placeholder="Display text for the link"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <Input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        title="Add Image"
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        onOk={confirmAddImage}
        okText="Add Image"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text (optional)
            </label>
            <Input
              value={imageAltText}
              onChange={e => setImageAltText(e.target.value)}
              placeholder="Description of the image"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SectionEditor
