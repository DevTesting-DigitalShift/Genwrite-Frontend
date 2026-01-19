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
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { Iframe } from "@/extensions/IframeExtension"
import { getLinkPreview } from "link-preview-js"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading3,
  Heading4,
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
  Table as TableIcon,
  TableProperties,
  Plus,
  Minus,
  Youtube,
  Info,
} from "lucide-react"
import { Tooltip, message, Modal, Input, Button, Dropdown, Popover } from "antd"
import { createPortal } from "react-dom"
import ImageGalleryPicker from "@components/ImageGalleryPicker"
import { AIBubbleMenu } from "./AIBubbleMenu"
import { useEditorContext } from "./EditorContext"

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

const SectionEditor = ({
  initialContent,
  onChange,
  onBlur,
  proofreadingResults = [],
  onAcceptSuggestion,
  sectionId,
}) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAltText, setImageAltText] = useState("")
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [editLinkModalOpen, setEditLinkModalOpen] = useState(false)
  const [editLinkUrl, setEditLinkUrl] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageEditMode, setImageEditMode] = useState(false)
  const [imageEditModalOpen, setImageEditModalOpen] = useState(false)
  const [editImageAlt, setEditImageAlt] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [linkEditModalOpen, setLinkEditModalOpen] = useState(false)

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

  // YouTube embed modal state
  const [embedModalOpen, setEmbedModalOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeTitle, setYoutubeTitle] = useState("")
  const [youtubeError, setYoutubeError] = useState("")

  // Table grid selector state
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false)
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 })
  const tableButtonRef = useRef(null)

  // Get editor context for AI operations
  const { blogId } = useEditorContext()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [3, 4] }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: { class: "border-collapse border border-gray-300 w-full my-4" },
      }),
      TableRow.configure({ HTMLAttributes: { class: "border border-gray-300" } }),
      TableHeader.configure({
        HTMLAttributes: { class: "border border-gray-300 bg-gray-100 p-2 font-semibold text-left" },
      }),
      TableCell.configure({ HTMLAttributes: { class: "border border-gray-300 p-2" } }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto object-contain my-4 cursor-pointer",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Iframe,
      ProofreadingDecoration.configure({ suggestions: proofreadingResults }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[200px] " +
          "[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 " +
          "[&>h4]:text-base [&>h4]:font-medium [&>h4]:mb-2 [&>h4]:mt-3 " +
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
          const linkData = { href: link.href, text: link.textContent, element: link }
          setSelectedLink(linkData)
          setSelectedImage(null)
          // Open link edit modal
          setEditLinkUrl(linkData.href)
          setLinkEditModalOpen(true)
          return true
        }

        // Check if clicked on an image
        const img = event.target.closest("img")
        if (img) {
          event.preventDefault()
          const imageData = { src: img.src, alt: img.alt || "", element: img }
          setSelectedImage(imageData)
          setSelectedLink(null)
          setImageEditMode(false)
          // Open the image edit modal
          setEditImageAlt(imageData.alt)
          setEditImageUrl(imageData.src)
          setImageEditModalOpen(true)
          return true
        }

        // Check if clicked on proofreading mark (original or suggestion)
        const proofMark = event.target.closest(
          ".proofreading-original, .proofreading-suggestion, .proofreading-mark",
        )
        if (proofMark && (proofMark.dataset.suggestion || proofMark.dataset.original)) {
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

  // Update proofreading suggestions when they change (including when cleared)
  useEffect(() => {
    if (editor) {
      const proofExt = editor.extensionManager.extensions.find(
        ext => ext.name === "proofreadingDecoration",
      )
      if (proofExt) {
        proofExt.options.suggestions = proofreadingResults || []
        // Force a re-render of decorations
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

    const original = activeProofSpan.dataset.original
    const suggestion = activeProofSpan.dataset.suggestion

    if (!original || !suggestion) return

    // Use the callback from parent to properly update content and remove suggestion
    if (onAcceptSuggestion) {
      onAcceptSuggestion({ original, change: suggestion })
    } else {
      // Fallback: directly update in editor
      const from = Number(activeProofSpan.dataset.from)
      const to = Number(activeProofSpan.dataset.to)

      if (!isNaN(from) && !isNaN(to)) {
        try {
          editor.chain().focus().deleteRange({ from, to }).insertContent(suggestion).run()
          message.success("Change applied")
        } catch (error) {
          console.error("Error applying change:", error)
        }
      }
    }

    setActiveProofSpan(null)
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
    setLinkEditModalOpen(false)
    message.success("Link removed")
  }

  // Edit link handler - open modal to edit existing link
  const openEditLinkModal = () => {
    if (selectedLink) {
      setEditLinkUrl(selectedLink.href)
      setEditLinkModalOpen(true)
    }
  }

  // Confirm edit link - update the link URL
  const confirmEditLink = () => {
    if (!editLinkUrl) {
      message.error("Please enter a URL")
      return
    }

    let url = editLinkUrl
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    // Find and update the link in the editor
    if (editor && selectedLink) {
      const { state } = editor
      const { from, to } = state.selection

      // First unset the old link, then set new one
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()

      setEditLinkModalOpen(false)
      setEditLinkUrl("")
      setSelectedLink({ ...selectedLink, href: url })
      message.success("Link updated")
    }
  }

  // Image handlers
  const handleAddImage = () => {
    setImageUrl("")
    setImageAltText("")
    setShowGalleryPicker(false)
    setImageModalOpen(true)
  }

  const handleSelectFromGallery = (url, alt) => {
    setImageUrl(url)
    setImageAltText(alt)
    setShowGalleryPicker(false)
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

  // Handle saving image edits from modal
  const handleSaveImageEdit = () => {
    if (!selectedImage || !editor) return

    const { state } = editor
    let imagePos = null
    let imageNode = null

    // Find the image node
    state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
        imagePos = pos
        imageNode = node
        return false
      }
    })

    if (imagePos !== null && imageNode) {
      // Update the image with new attributes
      editor
        .chain()
        .focus()
        .deleteRange({ from: imagePos, to: imagePos + 1 })
        .setImage({ src: editImageUrl, alt: editImageAlt })
        .run()

      // Force content update
      onChange(editor.getHTML())
      setImageEditModalOpen(false)
      setSelectedImage(null)
      message.success("Image updated successfully")
    }
  }

  // Handle deleting image from modal
  const handleDeleteImageFromModal = () => {
    deleteSelectedImage()
    setImageEditModalOpen(false)
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
    // Just close the edit modal and open the add image modal
    setImageEditModalOpen(false)
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

  // YouTube URL validation
  const validateYouTubeUrl = url => {
    if (!url) return { valid: false, embedUrl: null, videoId: null }

    // Check if it's already an embed URL
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch) {
      return { valid: true, embedUrl: url, videoId: embedMatch[1] }
    }

    // Standard YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          valid: true,
          embedUrl: `https://www.youtube.com/embed/${match[1]}`,
          videoId: match[1],
        }
      }
    }

    return { valid: false, embedUrl: null, videoId: null }
  }

  // Website URL validation
  const validateWebsiteUrl = url => {
    if (!url) return false
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  }

  // Handle adding YouTube embed
  const handleAddYouTubeEmbed = () => {
    const result = validateYouTubeUrl(youtubeUrl)
    if (!result.valid) {
      setYoutubeError("Please enter a valid YouTube URL")
      return
    }
    if (!youtubeTitle.trim()) {
      message.warning("Please add a title for SEO")
      return
    }

    // Insert YouTube iframe using the extension
    editor.chain().focus().setIframe({ src: result.embedUrl, title: youtubeTitle.trim() }).run()

    // Reset form
    setYoutubeUrl("")
    setYoutubeTitle("")
    setYoutubeError("")
    setEmbedModalOpen(false)
    message.success("YouTube video added")
  }

  // Reset embed modal
  const resetEmbedModal = () => {
    setYoutubeUrl("")
    setYoutubeTitle("")
    setYoutubeError("")
    setEmbedModalOpen(false)
  }

  // Table handlers
  const handleAddTable = () => {
    setTableDropdownOpen(prev => !prev)
  }

  const handleTableSelect = (rows, cols) => {
    if (editor) {
      // First close the dropdown
      setTableDropdownOpen(false)
      setHoveredCell({ row: 0, col: 0 })

      // Then insert table at current cursor position with a slight delay
      setTimeout(() => {
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
        message.success(`Table ${rows}x${cols} added.`)
      }, 100)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        tableDropdownOpen &&
        tableButtonRef.current &&
        !tableButtonRef.current.contains(event.target) &&
        !event.target.closest(".fixed.bg-white") // Don't close if clicking inside the dropdown
      ) {
        setTableDropdownOpen(false)
        setHoveredCell({ row: 0, col: 0 })
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [tableDropdownOpen])

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg flex-wrap">
        {/* Headings */}
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 4"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 className="w-4 h-4" />
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

        {/* Link & Image & Table */}
        <ToolbarButton title="Add Link" active={editor.isActive("link")} onClick={handleAddLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Add Image" onClick={handleAddImage}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* YouTube Embed Button */}
        <ToolbarButton title="Add YouTube Video" onClick={() => setEmbedModalOpen(true)}>
          <Youtube className="w-4 h-4" />
        </ToolbarButton>

        {/* Table Grid Selector */}
        <div className="relative inline-block" ref={tableButtonRef}>
          <ToolbarButton
            title="Table"
            active={editor.isActive("table") || tableDropdownOpen}
            onClick={handleAddTable}
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {tableDropdownOpen &&
          tableButtonRef.current &&
          createPortal(
            <div
              className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-[9999]"
              style={{
                top: `${tableButtonRef.current.getBoundingClientRect().bottom + 8}px`,
                left: `${tableButtonRef.current.getBoundingClientRect().left}px`,
              }}
            >
              <div className="mb-2 text-xs text-gray-600 text-center">
                {hoveredCell.row > 0 && hoveredCell.col > 0
                  ? `${hoveredCell.row} x ${hoveredCell.col}`
                  : "Select table size"}
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
                {Array.from({ length: 10 }, (_, rowIndex) =>
                  Array.from({ length: 10 }, (_, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-5 h-5 border border-gray-300 cursor-pointer transition-colors ${
                        rowIndex < hoveredCell.row && colIndex < hoveredCell.col
                          ? "bg-blue-500 border-blue-600"
                          : "bg-white hover:bg-blue-100"
                      }`}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex + 1, col: colIndex + 1 })}
                      onClick={() => handleTableSelect(rowIndex + 1, colIndex + 1)}
                    />
                  )),
                )}
              </div>
            </div>,
            document.body,
          )}

        {/* Table Manipulation Menu - Only show when inside a table */}
        {editor?.isActive("table") && (
          <Popover
            content={
              <div className="flex flex-col gap-1 min-w-[180px]">
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().addRowBefore().run()
                    message.success("Row added")
                  }}
                  disabled={!editor.can().addRowBefore()}
                  className="justify-start"
                >
                  Add Row Before
                </Button>
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run()
                    message.success("Row added")
                  }}
                  disabled={!editor.can().addRowAfter()}
                  className="justify-start"
                >
                  Add Row After
                </Button>
                <Button
                  size="small"
                  icon={<Minus className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().deleteRow().run()
                    message.success("Row deleted")
                  }}
                  disabled={!editor.can().deleteRow()}
                  danger
                  className="justify-start"
                >
                  Delete Row
                </Button>
                <div className="border-t my-1" />
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().addColumnBefore().run()
                    message.success("Column added")
                  }}
                  disabled={!editor.can().addColumnBefore()}
                  className="justify-start"
                >
                  Add Column Before
                </Button>
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run()
                  }}
                  disabled={!editor.can().addColumnAfter()}
                  className="justify-start"
                >
                  Add Column After
                </Button>
                <Button
                  size="small"
                  icon={<Minus className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run()
                  }}
                  disabled={!editor.can().deleteColumn()}
                  danger
                  className="justify-start"
                >
                  Delete Column
                </Button>
                <div className="border-t my-1" />
                <Button
                  size="small"
                  icon={<Trash2 className="w-3 h-3" />}
                  onClick={() => {
                    editor.chain().focus().deleteTable().run()
                  }}
                  disabled={!editor.can().deleteTable()}
                  danger
                  className="justify-start"
                >
                  Delete Table
                </Button>
              </div>
            }
            trigger="click"
            placement="bottomLeft"
          >
            <div>
              <ToolbarButton title="Table Options" active={editor.isActive("table")}>
                <TableProperties className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </Popover>
        )}

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

      {/* Link Preview Bar - Removed, now using modal */}

      {/* Image Edit Bar - Removed, now using modal */}

      {/* Proofreading Popup - Shows when clicking on highlighted text */}
      {activeProofSpan && (
        <div
          ref={proofBubbleRef}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl  mx-4 mb-4 overflow-hidden mt-5"
        >
          {/* Header */}
          <div className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200 flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="text-sm font-semibold text-amber-800">AI Suggestion</span>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Original */}
            {/* <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                  <X className="w-2.5 h-2.5 text-red-500" />
                </div>
                <span className="text-xs font-semibold text-red-600 uppercase">Original</span>
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-gray-700">
                {activeProofSpan.dataset.original}
              </div>
            </div> */}

            {/* Suggested */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-green-500" />
                </div>
                <span className="text-xs font-semibold text-green-600 uppercase">Suggested</span>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-700">
                {activeProofSpan.dataset.suggestion}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={applyProofChange}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:shadow-md hover:scale-[1.02] transition-all"
              >
                <Check className="w-4 h-4" />
                Accept Change
              </button>
              <button
                onClick={rejectProofChange}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Dismiss
              </button>
            </div>
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
              setHoveredLink({ href: linkHref, text: link.textContent })

              // Check cache first
              if (previewCacheRef.current[linkHref]) {
                setLinkPreviewData(previewCacheRef.current[linkHref])
              } else {
                // Fetch link preview using getLinkPreview with CORS proxy
                setIsLoadingPreview(true)
                setLinkPreviewData(null)
                try {
                  const preview = await getLinkPreview(linkHref, {
                    proxyUrl: "https://api.allorigins.win/raw?url=",
                    timeout: 5000,
                    followRedirects: "follow",
                    headers: { "user-agent": "googlebot" },
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

        {/* AI Bubble Menu for selected text */}
        {editor && blogId && sectionId && (
          <AIBubbleMenu
            editor={editor}
            blogId={blogId}
            sectionId={sectionId}
            onContentUpdate={onChange}
          />
        )}

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
                  // Remove the link but keep the text
                  if (editor) {
                    editor.chain().focus().unsetLink().run()
                  }
                  setHoveredLink(null)
                  message.success("Link removed!")
                }}
                className="flex-1 px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
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
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setLinkModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={confirmAddLink}>
              Add Link
            </Button>
          </div>
        }
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

      {/* Image Modal with Gallery Picker */}
      <Modal
        title={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6 sm:pr-10">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>Add Image</span>
            </div>
            <Button
              size="small"
              type={showGalleryPicker ? "primary" : "default"}
              onClick={() => setShowGalleryPicker(prev => !prev)}
              className="text-xs w-full sm:w-auto"
              icon={<ImageIcon className="w-3 h-3" />}
            >
              {showGalleryPicker ? "Manual Entry" : "Browse Gallery"}
            </Button>
          </div>
        }
        open={imageModalOpen}
        onCancel={() => {
          setImageModalOpen(false)
          setShowGalleryPicker(false)
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setImageModalOpen(false)
                setShowGalleryPicker(false)
              }}
            >
              Cancel
            </Button>
            <Button type="primary" onClick={confirmAddImage}>
              Add Image
            </Button>
          </div>
        }
        width="100%"
        style={{ maxWidth: showGalleryPicker ? "1200px" : "600px", top: 20, paddingBottom: 0 }}
        centered
        bodyStyle={{ padding: 0, maxHeight: "85vh", overflow: "hidden" }}
        className="responsive-image-modal"
      >
        <div
          className={`flex flex-col ${showGalleryPicker ? "md:flex-row h-[85vh] md:h-[80vh]" : ""}`}
        >
          {/* Main Form - Top on Mobile, Left on Desktop */}
          <div
            className={`${
              showGalleryPicker
                ? "w-full md:w-[400px] border-b md:border-b-0 md:border-r"
                : "w-full"
            } p-4 sm:p-6 space-y-4 flex-shrink-0 ${showGalleryPicker ? "overflow-y-auto" : ""}`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <Input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                size="large"
              />
              {imageUrl && (
                <div className="mt-3 border rounded-lg overflow-hidden bg-gray-50 p-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-48 object-contain rounded"
                    onError={e => (e.target.style.display = "none")}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text (optional)
              </label>
              <Input
                value={imageAltText}
                onChange={e => setImageAltText(e.target.value)}
                placeholder="Description of the image"
                size="large"
              />
              <p className="text-xs text-gray-500 mt-1">Helps with SEO and accessibility</p>
            </div>
          </div>

          {/* Gallery Picker - Bottom on Mobile, Right on Desktop */}
          {showGalleryPicker && (
            <div className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-hidden min-h-[400px] md:min-h-0">
              <ImageGalleryPicker onSelect={handleSelectFromGallery} selectedImageUrl={imageUrl} />
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Link Modal - Comprehensive version */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <span>Edit Link</span>
          </div>
        }
        open={linkEditModalOpen}
        onCancel={() => {
          setLinkEditModalOpen(false)
          setSelectedLink(null)
        }}
        footer={
          <div className="flex items-center justify-between">
            {/* Left: Destructive action */}
            <Button danger icon={<Trash2 className="w-4 h-4" />} onClick={removeLink}>
              Delete Link
            </Button>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                icon={<ExternalLink className="w-4 h-4" />}
                onClick={() => window.open(editLinkUrl, "_blank")}
              >
                Open Link
              </Button>
              <Button onClick={() => setLinkEditModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                icon={<Check className="w-4 h-4" />}
                onClick={() => {
                  confirmEditLink()
                  setLinkEditModalOpen(false)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        }
        width={600}
        centered
      >
        <div className="space-y-4">
          {/* Current Link Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Current Link</p>
            <p className="text-sm text-blue-700 font-medium truncate">{selectedLink?.href}</p>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL <span className="text-red-500">*</span>
            </label>
            <Input
              value={editLinkUrl}
              onChange={e => setEditLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              The URL this link should point to. Must start with http:// or https://
            </p>
          </div>

          {/* Link Text Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
            <Input value={selectedLink?.text || ""} disabled />
            <p className="text-xs text-gray-500 mt-1">
              The visible text of the link (cannot be changed here)
            </p>
          </div>
        </div>
      </Modal>

      {/* YouTube Embed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>Add YouTube Video</span>
          </div>
        }
        open={embedModalOpen}
        onCancel={resetEmbedModal}
        footer={null}
        width={520}
        centered
      >
        {/* YouTube Form */}
        {embedModalOpen && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={youtubeUrl}
                onChange={e => {
                  setYoutubeUrl(e.target.value)
                  setYoutubeError("")
                }}
                placeholder="https://www.youtube.com/watch?v=... or embed URL"
                status={youtubeError ? "error" : ""}
              />
              {youtubeError && <p className="text-xs text-red-500 mt-1">{youtubeError}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Supports: youtube.com/watch, youtu.be, youtube.com/embed
              </p>
            </div>

            {/* Preview */}
            {youtubeUrl && validateYouTubeUrl(youtubeUrl).valid && (
              <div className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-900">
                  <iframe
                    src={validateYouTubeUrl(youtubeUrl).embedUrl}
                    title="Preview"
                    frameBorder="0"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={youtubeTitle}
                onChange={e => setYoutubeTitle(e.target.value)}
                placeholder="Video title for SEO and accessibility"
              />
            </div>

            <Button
              type="primary"
              onClick={handleAddYouTubeEmbed}
              disabled={!youtubeUrl || !youtubeTitle.trim()}
              block
              className="!bg-red-600 !hover:bg-red-700 !border-red-600"
              icon={<Youtube className="w-4 h-4" />}
            >
              Add YouTube Video
            </Button>
          </div>
        )}
      </Modal>

      {/* Image Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <span>Edit Image</span>
          </div>
        }
        open={imageEditModalOpen}
        onCancel={() => {
          setImageEditModalOpen(false)
          setSelectedImage(null)
        }}
        footer={
          <div className="flex items-center justify-between">
            {/* Left: Destructive action */}
            <Button
              danger
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteImageFromModal}
            >
              Delete Image
            </Button>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button icon={<ImageIcon className="w-4 h-4" />} onClick={replaceImage}>
                Replace
              </Button>
              <Button onClick={() => setImageEditModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                icon={<Check className="w-4 h-4" />}
                onClick={handleSaveImageEdit}
              >
                Save
              </Button>
            </div>
          </div>
        }
        width={800}
        centered
        bodyStyle={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
      >
        <div className="flex gap-4">
          {/* Image Preview (Left) */}
          <div className="w-[400px] flex-shrink-0 border rounded-lg overflow-hidden bg-gray-50 p-3 flex items-center justify-center">
            <img
              src={editImageUrl}
              alt={editImageAlt || "Preview"}
              className="max-w-full h-auto rounded-lg object-contain"
            />
          </div>
          {/* Details (Right) */}
          <div className="flex-1 space-y-3">
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={editImageUrl}
                onChange={e => setEditImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text <span className="text-red-500">*</span>
              </label>
              <Input.TextArea
                value={editImageAlt}
                onChange={e => setEditImageAlt(e.target.value)}
                placeholder="Describe the image for accessibility and SEO"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what's in the image. This helps with SEO and accessibility.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SectionEditor
