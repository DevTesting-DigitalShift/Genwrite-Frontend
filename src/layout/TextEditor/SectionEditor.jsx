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
  Plus,
  Minus,
} from "lucide-react"
import { Tooltip, message, Modal, Input, Dropdown, Button } from "antd"

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
}) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAltText, setImageAltText] = useState("")
  const [selectedLink, setSelectedLink] = useState(null)
  const [editLinkModalOpen, setEditLinkModalOpen] = useState(false)
  const [editLinkUrl, setEditLinkUrl] = useState("")
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
      Heading.configure({ levels: [3, 4] }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-gray-300 w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border border-gray-300",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 bg-gray-100 p-2 font-semibold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 p-2",
        },
      }),
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

        // Check if clicked on proofreading mark (original or suggestion)
        const proofMark = event.target.closest(
          ".proofreading-original, .proofreading-suggestion, .proofreading-mark"
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
        ext => ext.name === "proofreadingDecoration"
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

        {/* Table Dropdown */}
        <Dropdown
          menu={{
            items: [
              {
                key: "insert",
                label: (
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    <span>Insert 3×3 Table</span>
                  </div>
                ),
                onClick: () =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run(),
              },
              { type: "divider" },
              {
                key: "addRowBefore",
                label: (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Row Before</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().addRowBefore().run(),
                disabled: !editor.can().addRowBefore(),
              },
              {
                key: "addRowAfter",
                label: (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Row After</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().addRowAfter().run(),
                disabled: !editor.can().addRowAfter(),
              },
              {
                key: "deleteRow",
                label: (
                  <div className="flex items-center gap-2 text-red-500">
                    <Minus className="w-4 h-4" />
                    <span>Delete Row</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().deleteRow().run(),
                disabled: !editor.can().deleteRow(),
              },
              { type: "divider" },
              {
                key: "addColBefore",
                label: (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Column Before</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().addColumnBefore().run(),
                disabled: !editor.can().addColumnBefore(),
              },
              {
                key: "addColAfter",
                label: (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Column After</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().addColumnAfter().run(),
                disabled: !editor.can().addColumnAfter(),
              },
              {
                key: "deleteCol",
                label: (
                  <div className="flex items-center gap-2 text-red-500">
                    <Minus className="w-4 h-4" />
                    <span>Delete Column</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().deleteColumn().run(),
                disabled: !editor.can().deleteColumn(),
              },
              { type: "divider" },
              {
                key: "deleteTable",
                label: (
                  <div className="flex items-center gap-2 text-red-500">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Table</span>
                  </div>
                ),
                onClick: () => editor.chain().focus().deleteTable().run(),
                disabled: !editor.can().deleteTable(),
              },
            ],
          }}
          trigger={["click"]}
          placement="bottomLeft"
        >
          <div>
            <ToolbarButton title="Table" active={editor.isActive("table")}>
              <TableIcon className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </Dropdown>

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

      {/* Link Preview Bar - Edit and Delete options */}
      {selectedLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b text-sm">
          <LinkIcon className="w-4 h-4 text-blue-600" />
          <span className="text-blue-600 truncate flex-1">{selectedLink.href}</span>
          <Tooltip title="Edit Link">
            <button onClick={openEditLinkModal} className="p-1 hover:bg-blue-100 rounded">
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
          </Tooltip>
          <Tooltip title="Delete Link">
            <button onClick={removeLink} className="p-1 hover:bg-red-100 rounded">
              <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Image Modal */}
      <Modal
        title="Add Image"
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setImageModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={confirmAddImage}>
              Add Image
            </Button>
          </div>
        }
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

      {/* Edit Link Modal */}
      <Modal
        title="Edit Link"
        open={editLinkModalOpen}
        onCancel={() => setEditLinkModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditLinkModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={confirmEditLink}>
              Update Link
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
            <Input
              value={editLinkUrl}
              onChange={e => setEditLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={e => e.key === "Enter" && confirmEditLink()}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SectionEditor
