import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { motion } from "framer-motion"
import DOMPurify from "dompurify"
import {
  Bold,
  Italic,
  Underline as IconUnderline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RotateCcw,
  Trash2,
  Table as TableIcon,
  TableProperties,
  Columns,
  Rows,
  Plus,
  Minus,
  Sparkles,
  Check,
  ExternalLink,
} from "lucide-react"
import { Input, Modal, Tooltip, message, Select, Button, Flex, Popover } from "antd"
import { marked } from "marked"
import TurndownService from "turndown"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { ReloadOutlined, LoadingOutlined } from "@ant-design/icons"
import { sendRetryLines } from "@api/blogApi"
import { createPortal } from "react-dom"
import { getLinkPreview } from "link-preview-js"
import { useQueryClient } from "@tanstack/react-query"
import { useProofreadingUI } from "@/layout/Editor/useProofreadingUI"
import ContentDiffViewer from "../Editor/ContentDiffViewer"
import "./editor.css"
import { VideoEmbed } from "@/extensions/VideoEmbed"
import { Iframe } from "@/extensions/IframeExtension"
import { Figure, FigCaption } from "@/extensions/FigureExtension"
import Link from "@tiptap/extension-link"
import LoadingScreen from "@components/UI/LoadingScreen"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import Heading from "@tiptap/extension-heading"
import { AIBubbleMenu } from "./AIBubbleMenu"
import { generateAltText, enhanceImage, generateImage } from "@api/imageGalleryApi"
import { COSTS } from "@/data/blogData"
import ImageModal from "@components/ImageModal"
import { Node } from "@tiptap/core"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"

const renderer = {
  heading({ text, depth: level }) {
    const slug = String(text)
      .toLowerCase()
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "")
    return `<h${level} id="${slug}">${text}</h${level}>`
  },
}

marked.use({ renderer })

const FONT_OPTIONS = [
  { label: "Arial", value: "font-arial" },
  { label: "Georgia", value: "font-georgia" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
]

const TipTapEditor = ({ blog, content, setContent, unsavedChanges, setUnsavedChanges }) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false)
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 })
  const tableButtonRef = useRef(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [editingImageSrc, setEditingImageSrc] = useState(null)

  // Unified Image Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isEnhanceMode, setIsEnhanceMode] = useState(false)
  const [enhanceForm, setEnhanceForm] = useState({
    prompt: "",
    style: "photorealistic",
    quality: "2k",
  })
  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [genForm, setGenForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1024x1024",
  })

  const [editorReady, setEditorReady] = useState(false)
  const [linkPreview, setLinkPreview] = useState(null)
  const [linkPreviewPos, setLinkPreviewPos] = useState(null)
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(null)
  const [linkPreviewElement, setLinkPreviewElement] = useState(null)
  const hideTimeout = useRef(null)
  const previewCache = useRef({})
  const [lastSavedContent, setLastSavedContent] = useState("")
  const lastSavedContentRef = useRef(lastSavedContent)

  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { user } = useAuthStore()
  const userPlan = user?.subscription?.plan
  const location = useLocation()

  // Sync ref with state
  useEffect(() => {
    lastSavedContentRef.current = lastSavedContent
  }, [lastSavedContent])

  const normalizeContent = useCallback(str => str.replace(/\s+/g, " ").trim(), [])
  const safeContent = content ?? blog?.content ?? ""

  // ... (markdownToHtml and htmlToMarkdown unchanged - lines 104-142 in original file logic but we are skipping context for brevity in thought, ensuring we only replace what effectively changes or include surrounding lines if needed for context match)
  // Actually, I need to match the file content. I will target the block where useEditor is defined and the state definitions above it.

  // Let's rewrite the `useEditor` call and the new Ref setup.
  // I will just perform the specific edits.

  const markdownToHtml = useCallback(markdown => {
    if (!markdown) return "<p></p>"
    // Check if content looks like HTML (starts with common tags like <p, <div, <h, <section, <article)
    // or contains high density of HTML tags vs markdown symbols
    const trimmed = markdown.trim()
    const isHtml =
      /^\s*<(p|div|h[1-6]|section|article|table|ul|ol|blockquote|iframe|figure)/i.test(trimmed) ||
      (trimmed.includes("<") &&
        trimmed.includes(">") &&
        !trimmed.includes("## ") &&
        !trimmed.includes("**"))

    const rawHtml = isHtml
      ? markdown
      : marked.parse(
          markdown
            .replace(/!\[\s*["']?(.*?)["']?\s*\]\((.*?)\)/g, (_, alt, url) => `![${alt}](${url})`)
            .replace(/'/g, "'"),
          { gfm: true, breaks: true }
        )
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: [
        "iframe",
        "div",
        "table",
        "th",
        "td",
        "tr",
        "figure",
        "figcaption",
        "section",
        "article",
      ],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "src",
        "style",
        "title",
        "class",
        "id",
      ],
    })
  }, [])

  const htmlToMarkdown = useCallback(html => {
    if (!html) return ""
    const turndownService = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" })
    turndownService.keep([
      "p",
      "div",
      "iframe",
      "table",
      "tr",
      "th",
      "td",
      "figure",
      "figcaption",
      "section",
      "article",
    ])
    return turndownService.turndown(html)
  }, [])

  const handleLinkHover = useCallback(
    event => {
      const link = event.target.closest("a")
      if (!link) return

      const url = link.href
      if (!url) return

      // Don't show preview for internal anchors or mailto
      if (url.startsWith("#") || url.startsWith("mailto:")) return

      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current)
        hideTimeout.current = null
      }

      const rect = link.getBoundingClientRect()
      setLinkPreviewPos({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX })
      setLinkPreviewUrl(url)
      setLinkPreviewElement(link)

      if (previewCache.current[url]) {
        setLinkPreview(previewCache.current[url])
        return
      }

      setLinkPreview({ loading: true })

      getLinkPreview(url)
        .then(data => {
          previewCache.current[url] = data
          // Check if we are still looking for THIS url
          setLinkPreviewUrl(current => {
            if (current === url) {
              setLinkPreview(data)
            }
            return current
          })
        })
        .catch(err => {
          console.error("Link preview error:", err)
          setLinkPreview({ error: true, url })
        })
    },
    [setLinkPreview, setLinkPreviewPos, setLinkPreviewUrl, setLinkPreviewElement]
  )

  const handleLinkLeave = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      setLinkPreview(null)
      setLinkPreviewUrl(null)
      setLinkPreviewElement(null)
      setLinkPreviewPos(null)
    }, 300)
  }, [])

  const normalEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          // Disable default history if we wanted to control it, but StarterKit default is fine usually
        }),
        // Custom Heading with ID support
        Heading.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              id: {
                default: null,
                parseHTML: element => element.getAttribute("id"),
                renderHTML: attributes => {
                  if (!attributes.id) {
                    return {}
                  }
                  return { id: attributes.id }
                },
              },
            }
          },
        }).configure({ levels: [1, 2, 3, 4] }),
        // Custom Section Node to preserve <section> tags
        Node.create({
          name: "section",
          group: "block",
          content: "block+",
          draggable: false, // Sections usually container
          parseHTML() {
            return [{ tag: "section" }]
          },
          renderHTML({ HTMLAttributes }) {
            return ["section", HTMLAttributes, 0]
          },
          addAttributes() {
            return {
              id: {
                default: null,
                parseHTML: element => element.getAttribute("id"),
                renderHTML: attributes => {
                  if (!attributes.id) {
                    return {}
                  }
                  return { id: attributes.id }
                },
              },
              class: {
                default: "blog-section",
                parseHTML: element => element.getAttribute("class"),
                renderHTML: attributes => {
                  return { class: attributes.class }
                },
              },
            }
          },
        }),
        Image.configure({
          HTMLAttributes: { class: "rounded-lg mx-auto w-full h-auto object-contain" },
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Table.configure({
          resizable: false,
          allowTableNodeSelection: true,
          HTMLAttributes: { class: "border-2 w-full border-collapse p-2" },
        }),
        TableHeader.configure({
          HTMLAttributes: { class: "text-center font-bold border align-middle border-gray-400" },
        }),
        TableRow.configure({
          HTMLAttributes: { class: "text-center font-medium border align-middle border-gray-400" },
        }),
        TableCell.configure({
          HTMLAttributes: { class: "text-center font-medium border align-middle border-gray-400" },
        }),
        VideoEmbed,
        Figure,
        FigCaption,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-blue-600 hover:underline" },
        }),
        // Iframe,
      ],
      content: "<p></p>",
      editorProps: {
        attributes: {
          class: `prose max-w-none focus:outline-none p-4 min-h-[400px] ${selectedFont} blog-content editor-container`,
        },
        handleDOMEvents: {
          mouseover: (view, event) => {
            handleLinkHover(event)
            return false
          },
          mouseout: (view, event) => {
            handleLinkLeave()
            return false
          },
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        const markdown = htmlToMarkdown(html)
        setContent(markdown)

        const normCurrent = normalizeContent(markdown)
        const normSaved = normalizeContent(lastSavedContentRef.current ?? "")

        // Avoid setting true on initial load if contents are effectively same
        if (normCurrent !== normSaved) {
          setUnsavedChanges(true)
        } else {
          setUnsavedChanges(false)
        }
      },
    },
    [selectedFont, htmlToMarkdown, setContent, setUnsavedChanges, normalizeContent]
  )

  const safeEditorAction = useCallback(
    action => {
      if (userPlan === "free" || userPlan === "basic") {
        navigate("/pricing")
        return
      }
      action()
    },
    [userPlan, navigate]
  )

  const handleAddLink = useCallback(() => {
    if (!normalEditor || normalEditor.state.selection.empty) {
      message.error("Select text to link.")
      return
    }
    safeEditorAction(() => {
      setLinkUrl("")
      setLinkModalOpen(true)
    })
  }, [normalEditor, safeEditorAction])

  const handleAddImage = useCallback(() => {
    safeEditorAction(() => {
      setImageUrl("")
      setImageAlt("")
      setEditingImageSrc(null)
      setImageModalOpen(true)
    })
  }, [safeEditorAction])

  const handleSelectFromGallery = useCallback((url, alt) => {
    setImageUrl(url)
    setImageAlt(alt)
    setShowGalleryPicker(false)
  }, [])

  const handleConfirmLink = useCallback(() => {
    if (!linkUrl || !/https?:\/\//i.test(linkUrl)) {
      message.error("Enter a valid URL.")
      return
    }
    if (normalEditor) {
      const { from, to } = normalEditor.state.selection
      normalEditor
        .chain()
        .focus()
        .setLink({ href: linkUrl, target: "_blank", rel: "noopener noreferrer" })
        .setTextSelection({ from, to })
        .run()
      setLinkModalOpen(false)
      message.success("Link added.")
    }
  }, [linkUrl, normalEditor])

  // handleConfirmImage is now handled by ImageModal's onSave prop

  const handleSaveImageChanges = () => {
    if (normalEditor) {
      if (!imageUrl) {
        // Handle Delete if url is empty
        handleDeleteImage()
      } else {
        // Handle Update
        if (editingImageSrc) {
          normalEditor.state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.src === editingImageSrc) {
              const tr = normalEditor.state.tr
              tr.setNodeMarkup(pos, undefined, { src: imageUrl, alt: imageAlt || "" })
              normalEditor.view.dispatch(tr)
              return false
            }
          })
          message.success("Image updated")
        }
      }
      setEditModalOpen(false)
      setEditingImageSrc(null)
      setImageUrl("")
      setImageAlt("")
    }
  }

  const handleDeleteImage = () => {
    if (normalEditor && editingImageSrc) {
      let deleted = false
      normalEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === editingImageSrc) {
          // Check if parent is figure to also delete caption/attribution
          const $pos = normalEditor.state.doc.resolve(pos)
          const parent = $pos.parent

          if (parent.type.name === "figure") {
            // Delete the entire figure containing image and caption
            // The figure starts at $pos.before() and ends at $pos.after()
            const from = $pos.before()
            const to = $pos.after()
            normalEditor.chain().deleteRange({ from, to }).run()
          } else {
            // Just delete the image
            normalEditor
              .chain()
              .deleteRange({ from: pos, to: pos + 1 })
              .run()
          }
          deleted = true
          return false
        }
      })
      if (deleted) message.success("Image deleted")
    }
    setEditModalOpen(false)
    setEditingImageSrc(null)
  }

  const handleOpenAdvancedOptions = () => {
    setEditModalOpen(false)
    setImageModalOpen(true)
  }

  const handleImageClick = useCallback(event => {
    if (event.target.tagName === "IMG") {
      const { src, alt } = event.target
      setImageUrl(src)
      setImageAlt(alt || "")
      setEditingImageSrc(src)
      // Open Unified Modal instead of direct ImageModal
      setEditModalOpen(true)
      setIsEnhanceMode(false)
      setIsGenerateMode(false)
    }
  }, [])

  const handleAddTable = useCallback(() => {
    safeEditorAction(() => {
      setTableDropdownOpen(prev => !prev)
    })
  }, [safeEditorAction])

  const handleTableSelect = useCallback(
    (rows, cols) => {
      if (normalEditor) {
        // First close the dropdown
        setTableDropdownOpen(false)
        setHoveredCell({ row: 0, col: 0 })

        // Then insert table at current cursor position with a slight delay
        setTimeout(() => {
          normalEditor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
          message.success(`Table ${rows}x${cols} added.`)
        }, 100)
      }
    },
    [normalEditor]
  )

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

  useEffect(() => {
    if (normalEditor && blog?.content) {
      const html = markdownToHtml(blog.content)
      normalEditor.commands.setContent(html, false)

      // Calculate round-trip content to prevent false unsaved changes
      const currentHtml = normalEditor.getHTML()
      const roundTripMarkdown = htmlToMarkdown(currentHtml)

      setContent(roundTripMarkdown)
      setLastSavedContent(roundTripMarkdown)

      // Scroll to top after content is loaded
      setTimeout(() => {
        const editorContainer = document.querySelector(".flex-1.overflow-auto.custom-scroll")
        if (editorContainer) {
          editorContainer.scrollTop = 0
        }
      }, 100)
    }
  }, [normalEditor, blog, markdownToHtml])

  // Handle external content updates (e.g. from Sidebar AI tools)
  useEffect(() => {
    if (normalEditor && content) {
      const currentEditorMarkdown = htmlToMarkdown(normalEditor.getHTML())
      // Only update if significantly different to avoid loops
      // We use normalizeContent to ignore whitespace differences that might occur during conversion
      if (normalizeContent(content) !== normalizeContent(currentEditorMarkdown)) {
        const html = markdownToHtml(content)
        // emitUpdate: true ensures onUpdate fires to keep state in sync and check unsaved changes
        normalEditor.commands.setContent(html, true)
      }
    }
  }, [content, normalEditor, markdownToHtml, htmlToMarkdown, normalizeContent])

  useEffect(() => {
    setIsEditorLoading(true)
    const timer = setTimeout(() => {
      setIsEditorLoading(false)
      // Don't auto-focus to prevent scrolling to bottom
    }, 300)
    return () => clearTimeout(timer)
  }, [normalEditor])

  useEffect(() => {
    if (normalEditor) {
      setEditorReady(true)
      return () => {
        if (!normalEditor.isDestroyed) normalEditor.destroy()
      }
    }
  }, [normalEditor])

  useEffect(() => {
    if (normalEditor?.view?.dom) {
      const editorElement = normalEditor.view.dom
      editorElement.addEventListener("click", handleImageClick)
      return () => editorElement?.removeEventListener("click", handleImageClick)
    }
  }, [normalEditor, handleImageClick])

  // Listen for Highlight Section events from Sidebar
  useEffect(() => {
    const handleHighlight = event => {
      const sectionId = event.detail
      if (!normalEditor) return

      // Clear previous highlights from all elements
      // We look for elements with our specific highlight class
      const prevHighlights = normalEditor.view.dom.querySelectorAll(".ai-section-highlight")
      prevHighlights.forEach(el => {
        el.classList.remove(
          "ai-section-highlight",
          "bg-indigo-50",
          "ring-2",
          "ring-indigo-400",
          "ring-offset-2",
          "rounded-lg",
          "transition-all",
          "duration-300"
        )
      })

      if (!sectionId) return

      // Find the new element
      const element = normalEditor.view.dom.querySelector(`#${sectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })

        // Add highlight classes
        element.classList.add(
          "ai-section-highlight",
          "bg-indigo-50",
          "ring-2",
          "ring-indigo-400",
          "ring-offset-2",
          "rounded-lg",
          "transition-all",
          "duration-300"
        )
      }
    }

    window.addEventListener("highlight-section", handleHighlight)
    return () => window.removeEventListener("highlight-section", handleHighlight)
  }, [normalEditor])

  const renderToolbar = () => (
    <div className="bg-white border-x border-gray-200 shadow-sm px-2 sm:px-4 py-2 flex flex-wrap items-center justify-start gap-y-2 overflow-x-auto">
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4].map(level => (
          <Tooltip key={level} title={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => normalEditor.chain().focus().toggleHeading({ level }).run())
              }
              className={`p-2 rounded-md text-black ${
                normalEditor?.isActive("heading", { level })
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              }`}
              type="button"
            >
              {level === 1 && <Heading1 className="w-4 h-4" />}
              {level === 2 && <Heading2 className="w-4 h-4" />}
              {level === 3 && <Heading3 className="w-4 h-4" />}
              {level === 4 && <Heading4 className="w-4 h-4" />}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      {/* Text styles */}
      <div className="flex gap-1 shrink-0">
        <Tooltip title="Bold">
          <button
            onClick={() => safeEditorAction(() => normalEditor.chain().focus().toggleBold().run())}
            className={`p-2 rounded-md text-black ${
              normalEditor?.isActive("bold") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
            }`}
            type="button"
          >
            <Bold className="w-4 h-4 text-black" />
          </button>
        </Tooltip>
        <Tooltip title="Italic">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleItalic().run())
            }
            className={`p-2 rounded-md text-black ${
              normalEditor?.isActive("italic") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
            }`}
            type="button"
          >
            <Italic className="w-4 h-4 text-black" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      {/* Alignment */}
      <div className="flex gap-1 shrink-0">
        {["left", "center", "right"].map(align => (
          <Tooltip key={align} title={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => normalEditor.chain().focus().setTextAlign(align).run())
              }
              className={`p-2 rounded-md text-black ${
                normalEditor?.isActive({ textAlign: align })
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              }`}
              type="button"
            >
              {align === "left" && <AlignLeft className="w-4 h-4" />}
              {align === "center" && <AlignCenter className="w-4 h-4" />}
              {align === "right" && <AlignRight className="w-4 h-4" />}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      {/* Lists */}
      <div className="flex gap-1 shrink-0">
        <Tooltip title="Bullet List">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleBulletList().run())
            }
            className={`p-2 rounded-md text-black ${
              normalEditor?.isActive("bulletList")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            type="button"
          >
            <List className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Ordered List">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleOrderedList().run())
            }
            className={`p-2 rounded-md text-black ${
              normalEditor?.isActive("orderedList")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            type="button"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      {/* Media & Undo/Redo */}
      <div className="flex gap-1 shrink-0">
        <Tooltip title="Link">
          <button
            onClick={handleAddLink}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Image">
          <button
            onClick={handleAddImage}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <div className="relative" ref={tableButtonRef}>
          <Tooltip title="Table">
            <button
              onClick={handleAddTable}
              className={`p-2 rounded-md text-black hover:bg-gray-100 shrink-0 ${
                tableDropdownOpen ? "bg-blue-100 text-blue-600" : ""
              }`}
              type="button"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {tableDropdownOpen &&
          tableButtonRef.current &&
          createPortal(
            <div
              className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-9999"
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
                      className={`w-5 h-5 border border-gray-300 cursor-pointer text-black ${
                        rowIndex < hoveredCell.row && colIndex < hoveredCell.col
                          ? "bg-blue-500 border-blue-600"
                          : "bg-white hover:bg-blue-100"
                      }`}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex + 1, col: colIndex + 1 })}
                      onClick={() => handleTableSelect(rowIndex + 1, colIndex + 1)}
                    />
                  ))
                )}
              </div>
            </div>,
            document.body
          )}

        {/* Table Manipulation Menu - Only show when inside a table */}
        {normalEditor?.isActive("table") && (
          <Popover
            content={
              <div className="flex flex-col gap-1 min-w-[180px]">
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    normalEditor.chain().focus().addRowBefore().run()
                    message.success("Row added")
                  }}
                  disabled={!normalEditor.can().addRowBefore()}
                  className="justify-start"
                >
                  Add Row Before
                </Button>
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    normalEditor.chain().focus().addRowAfter().run()
                    message.success("Row added")
                  }}
                  disabled={!normalEditor.can().addRowAfter()}
                  className="justify-start"
                >
                  Add Row After
                </Button>
                <Button
                  size="small"
                  icon={<Minus className="w-3 h-3" />}
                  onClick={() => {
                    normalEditor.chain().focus().deleteRow().run()
                    message.success("Row deleted")
                  }}
                  disabled={!normalEditor.can().deleteRow()}
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
                    normalEditor.chain().focus().addColumnBefore().run()
                    message.success("Column added")
                  }}
                  disabled={!normalEditor.can().addColumnBefore()}
                  className="justify-start"
                >
                  Add Column Before
                </Button>
                <Button
                  size="small"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => {
                    normalEditor.chain().focus().addColumnAfter().run()
                  }}
                  disabled={!normalEditor.can().addColumnAfter()}
                  className="justify-start"
                >
                  Add Column After
                </Button>
                <Button
                  size="small"
                  icon={<Minus className="w-3 h-3" />}
                  onClick={() => {
                    normalEditor.chain().focus().deleteColumn().run()
                  }}
                  disabled={!normalEditor.can().deleteColumn()}
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
                    normalEditor.chain().focus().deleteTable().run()
                  }}
                  disabled={!normalEditor.can().deleteTable()}
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
            <Tooltip title="Table Options">
              <button
                className={`p-2 rounded-md text-black shrink-0 ${
                  normalEditor.isActive("table") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`}
                type="button"
              >
                <TableProperties className="w-4 h-4" />
              </button>
            </Tooltip>
          </Popover>
        )}

        <Tooltip title="Undo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().undo().run())}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Redo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().redo().run())}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      {/* Font Select */}
      <Select
        value={selectedFont}
        onChange={value => safeEditorAction(() => setSelectedFont(value))}
        className="w-32 shrink-0"
      >
        {FONT_OPTIONS.map(font => (
          <Select.Option key={font.value} value={font.value}>
            {font.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  )

  if (isEditorLoading || !editorReady) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border rounded-lg">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Toolbar - Fixed at top */}
      <div className="sticky top-0 bg-white shadow-sm shrink-0">{renderToolbar()}</div>

      {/* Editor Content - Scrollable */}
      <div className="flex-1 overflow-auto custom-scroll bg-white p-4">
        {normalEditor && (
          <AIBubbleMenu
            editor={normalEditor}
            blogId={blog?._id}
            sectionId={null}
            onContentUpdate={() => {}}
          >
            <Tooltip title="Bold">
              <button
                className="p-2 rounded hover:bg-gray-200"
                onClick={() =>
                  safeEditorAction(() => normalEditor.chain().focus().toggleBold().run())
                }
              >
                <Bold className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip title="Italic">
              <button
                className="p-2 rounded hover:bg-gray-200"
                onClick={() =>
                  safeEditorAction(() => normalEditor.chain().focus().toggleItalic().run())
                }
              >
                <Italic className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip title="Link">
              <button className="p-2 rounded hover:bg-gray-200" onClick={handleAddLink}>
                <LinkIcon className="w-5 h-5" />
              </button>
            </Tooltip>
          </AIBubbleMenu>
        )}
        <EditorContent editor={normalEditor} />
      </div>

      {/* Modals */}
      <Modal
        title="Insert Link"
        open={linkModalOpen}
        onOk={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
        footer={
          <Flex justify="end" gap={16}>
            <Button key="cancel" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button key="ok" type="primary" onClick={handleConfirmLink}>
              Ok
            </Button>
          </Flex>
        }
        centered
      >
        <Input
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          className="mt-4"
        />
      </Modal>

      {/* Unified Image Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <span>Edit Image</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={
          !isEnhanceMode && (
            <div className="flex items-center justify-between w-full">
              {/* Left: Destructive action */}
              <Button danger icon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteImage}>
                Delete
              </Button>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={handleOpenAdvancedOptions}>Advanced Options</Button>
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
          )
        }
        width={700}
        centered
        bodyStyle={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image Preview & Enhancement Trigger */}
          <div className="border rounded-lg bg-gray-50 p-2 flex flex-col items-center justify-center gap-3">
            <img
              src={imageUrl}
              alt={imageAlt || "Preview"}
              className="max-w-full rounded-lg object-contain"
              style={{ maxHeight: "300px" }}
              onError={e => {
                e.currentTarget.src = "https://via.placeholder.com/300?text=Preview"
              }}
            />

            {imageUrl && !isEnhanceMode && blog?.imageSource === "ai" && (
              <Button
                type="default"
                size="small"
                className="mt-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 flex items-center gap-2"
                onClick={() => {
                  setIsEnhanceMode(true)
                  setEnhanceForm(prev => ({ ...prev, prompt: imageAlt || "" }))
                }}
              >
                <Sparkles className="w-3 h-3" /> Enhance Image
                <span className="text-[10px] bg-purple-200 px-1 rounded ml-1 text-purple-700">
                  {COSTS.ENHANCE} credits
                </span>
              </Button>
            )}

            {/* Manual / Generate Options */}
            {!imageUrl && !isGenerateMode && (
              <div className="flex gap-2 w-full mt-2">
                <Button
                  block
                  onClick={() => setIsGenerateMode(true)}
                  className="flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" /> Generate Image
                </Button>
              </div>
            )}

            {/* Generation Controls */}
            {isGenerateMode && (
              <div className="w-full mt-2 bg-white p-3 rounded border border-blue-100 shadow-sm space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Prompt</label>
                  <Input.TextArea
                    placeholder="Describe image..."
                    value={genForm.prompt}
                    onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                    rows={2}
                    className="text-sm mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Style</label>
                    <Select
                      value={genForm.style}
                      onChange={val => setGenForm({ ...genForm, style: val })}
                      className="w-full mt-1"
                      size="small"
                      options={[
                        { value: "photorealistic", label: "Photorealistic" },
                        { value: "anime", label: "Anime" },
                        { value: "digital-art", label: "Digital Art" },
                        { value: "oil-painting", label: "Oil Painting" },
                        { value: "sketch", label: "Sketch" },
                        { value: "cinematic", label: "Cinematic" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Ratio</label>
                    <Select
                      value={genForm.aspectRatio}
                      onChange={val => setGenForm({ ...genForm, aspectRatio: val })}
                      className="w-full mt-1"
                      size="small"
                      options={[
                        { value: "1:1", label: "Square (1:1)" },
                        { value: "16:9", label: "Landscape (16:9)" },
                        { value: "9:16", label: "Portrait (9:16)" },
                        { value: "4:3", label: "Standard (4:3)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button size="small" onClick={() => setIsGenerateMode(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    className="bg-blue-600"
                    onClick={async () => {
                      if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
                        message.error(
                          "You have reached your AI Image generation limit. preventing generation."
                        )
                        return
                      }

                      const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                      if (credits < COSTS.GENERATE) {
                        message.error(`Insufficient credits. Need ${COSTS.GENERATE} credits.`)
                        return
                      }

                      if (!genForm.prompt.trim()) {
                        message.error("Please enter a prompt")
                        return
                      }

                      const hide = message.loading("Generating image...", 0)
                      try {
                        const response = await generateImage(genForm)
                        const newImage = response.image || response.data || response
                        if (newImage && newImage.url) {
                          setImageUrl(newImage.url)
                          setImageAlt(genForm.prompt)
                          message.success("Image generated! Save to apply.")
                          setIsGenerateMode(false)
                        }
                      } catch (err) {
                        console.error(err)
                        message.error("Failed to generate image")
                      } finally {
                        hide()
                      }
                    }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" /> Generate ({COSTS.GENERATE}c)
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {isEnhanceMode ? (
              <div className="w-full bg-white p-4 rounded border border-purple-100 shadow-sm space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Enhance Settings
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {COSTS.ENHANCE} credits
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Instruction</label>
                  <Input.TextArea
                    placeholder="Describe changes (e.g. make it high res, fix lighting)"
                    value={enhanceForm.prompt}
                    onChange={e => setEnhanceForm({ ...enhanceForm, prompt: e.target.value })}
                    rows={4}
                    className="text-sm mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Style</label>
                    <Select
                      value={enhanceForm.style}
                      onChange={val => setEnhanceForm({ ...enhanceForm, style: val })}
                      className="w-full mt-1"
                      options={[
                        { value: "photorealistic", label: "Photorealistic" },
                        { value: "anime", label: "Anime" },
                        { value: "digital-art", label: "Digital Art" },
                        { value: "oil-painting", label: "Oil Painting" },
                        { value: "cinematic", label: "Cinematic" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quality</label>
                    <Select
                      value={enhanceForm.quality || "2k"}
                      onChange={val => setEnhanceForm({ ...enhanceForm, quality: val })}
                      className="w-full mt-1"
                      options={[
                        { value: "1k", label: "Standard (1k)" },
                        { value: "2k", label: "High (2k)" },
                        { value: "4k", label: "Ultra (4k)" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Aspect Ratio</label>
                    <Select
                      value={enhanceForm.dimensions || "1024x1024"}
                      onChange={val => setEnhanceForm({ ...enhanceForm, dimensions: val })}
                      className="w-full mt-1"
                      options={[
                        { value: "1024x1024", label: "Square (1:1)" },
                        { value: "1280x720", label: "Landscape (16:9)" },
                        { value: "720x1280", label: "Portrait (9:16)" },
                        { value: "1024x768", label: "Standard (4:3)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-auto pt-4">
                  <Button onClick={() => setIsEnhanceMode(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    className="bg-purple-600"
                    onClick={async () => {
                      if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
                        message.error("You have reached your AI Image generation limit.")
                        return
                      }
                      const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                      if (credits < COSTS.ENHANCE) {
                        message.error(`Insufficient credits. Need ${COSTS.ENHANCE} credits.`)
                        return
                      }
                      if (!enhanceForm.prompt.trim()) {
                        message.error("Please enter an instruction")
                        return
                      }

                      const hide = message.loading("Enhancing image...", 0)
                      try {
                        const formData = new FormData()
                        formData.append("prompt", enhanceForm.prompt)
                        formData.append("style", enhanceForm.style)
                        formData.append("quality", enhanceForm.quality || "2k") // Pass quality
                        formData.append("dimensions", enhanceForm.dimensions || "1024x1024")
                        formData.append("imageUrl", imageUrl)

                        const response = await enhanceImage(formData)
                        const newImage = response.image || response.data || response
                        if (newImage && newImage.url) {
                          setImageUrl(newImage.url)
                          message.success("Image enhanced! Save to apply.")
                          setIsEnhanceMode(false)
                        }
                      } catch (err) {
                        console.error(err)
                        message.error("Failed to enhance image")
                      } finally {
                        hide()
                      }
                    }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" /> Generate
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Alt Text <span className="text-red-500">*</span>
                    </label>
                    {imageUrl && (
                      <Tooltip title="Generate Alt Text using AI">
                        <Button
                          type="text"
                          size="small"
                          className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600"
                          onClick={async () => {
                            const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                            if (credits < COSTS.ALT_TEXT) {
                              message.error(`Insufficient credits. Need ${COSTS.ALT_TEXT} credits.`)
                              return
                            }
                            const hide = message.loading("Generating alt text...", 0)
                            try {
                              const response = await generateAltText({ imageUrl })
                              const alt = response.altText || response.data?.altText
                              if (alt) {
                                setImageAlt(alt)
                                message.success("Alt text generated!")
                              }
                            } catch (err) {
                              console.error(err)
                              message.error("Failed to generate alt text")
                            } finally {
                              hide()
                            }
                          }}
                        >
                          <div className="w-3 h-3" /> Generate
                          <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">
                            {COSTS.ALT_TEXT} credits
                          </span>
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                  <Input.TextArea
                    value={imageAlt}
                    onChange={e => setImageAlt(e.target.value)}
                    placeholder="Describe the image for accessibility and SEO"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Helps with SEO and screen readers. Be descriptive and specific.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      <ImageModal
        open={imageModalOpen}
        onCancel={() => {
          setImageModalOpen(false)
          setEditingImageSrc(null)
        }}
        onSave={(url, alt) => {
          if (normalEditor) {
            normalEditor.chain().focus()

            if (!url) {
              // Handle Delete if url is empty (user cleared it)
              if (editingImageSrc) {
                let deleted = false
                normalEditor.state.doc.descendants((node, pos) => {
                  if (node.type.name === "image" && node.attrs.src === editingImageSrc) {
                    // Check if parent is figure to also delete caption/attribution
                    const $pos = normalEditor.state.doc.resolve(pos)
                    const parent = $pos.parent

                    if (parent.type.name === "figure") {
                      const from = $pos.before()
                      const to = $pos.after()
                      normalEditor.chain().deleteRange({ from, to }).run()
                    } else {
                      normalEditor
                        .chain()
                        .deleteRange({ from: pos, to: pos + 1 })
                        .run()
                    }
                    deleted = true
                    return false
                  }
                })
                if (deleted) message.success("Image deleted")
              }
            } else {
              // Handle Insert or Update
              if (editingImageSrc) {
                let targetPos = null
                let figCaptionRange = null

                normalEditor.state.doc.descendants((node, pos) => {
                  if (node.type.name === "image" && node.attrs.src === editingImageSrc) {
                    targetPos = pos

                    // Check for parent Figure to remove citation if image changed
                    if (url !== editingImageSrc) {
                      const $pos = normalEditor.state.doc.resolve(pos)
                      for (let d = $pos.depth; d > 0; d--) {
                        const ancestor = $pos.node(d)
                        if (ancestor.type.name === "figure") {
                          ancestor.forEach((child, offset) => {
                            if (child.type.name === "figcaption") {
                              figCaptionRange = {
                                from: $pos.start(d) + offset,
                                to: $pos.start(d) + offset + child.nodeSize,
                              }
                            }
                          })
                          break
                        }
                      }
                    }
                    return false
                  }
                })

                if (targetPos !== null) {
                  const tr = normalEditor.state.tr
                  tr.setNodeMarkup(targetPos, undefined, { src: url, alt: alt || "" })

                  if (figCaptionRange) {
                    tr.delete(figCaptionRange.from, figCaptionRange.to)
                  }

                  normalEditor.view.dispatch(tr)
                  message.success("Image updated")
                }
              } else {
                normalEditor
                  .chain()
                  .setImage({ src: url, alt: alt || "" })
                  .run()
                message.success("Image added")
              }
            }
            setImageModalOpen(false)
            setEditingImageSrc(null)
            setImageUrl("")
            setImageAlt("")
          }
        }}
        title={editingImageSrc ? "Edit Image" : "Add Image"}
        initialUrl={imageUrl}
        initialAlt={imageAlt}
        imageSourceType={editingImageSrc ? "thumbnail" : "url"}
        allowEnhance={blog?.imageSource !== "stock"}
      />

      {/* Link Preview Popover */}
      {linkPreview && linkPreviewPos && (
        <div
          className="fixed z-9999 pointer-events-none"
          style={{ top: `${linkPreviewPos.top}px`, left: `${linkPreviewPos.left}px` }}
          onMouseEnter={() => {
            if (hideTimeout.current) {
              clearTimeout(hideTimeout.current)
              hideTimeout.current = null
            }
          }}
          onMouseLeave={handleLinkLeave}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="link-hover-preview bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden w-[320px] pointer-events-auto"
          >
            {linkPreview.loading ? (
              <div className="p-4 flex items-center justify-center gap-3 text-gray-500">
                <LoadingOutlined spin className="text-blue-500" />
                <span className="text-sm">Fetching preview...</span>
              </div>
            ) : linkPreview.error ? (
              <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <div className="p-1.5 bg-gray-200 rounded text-gray-500">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate">
                    Link
                  </p>
                  <p className="text-xs text-gray-600 truncate font-medium">
                    {linkPreviewUrl || "External Link"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Image Header if available */}
                {(linkPreview.images?.[0] || linkPreview.favicons?.[0]) && (
                  <div className="relative h-32 bg-gray-100 overflow-hidden border-b border-gray-100">
                    <img
                      src={linkPreview.images?.[0] || linkPreview.favicons?.[0]}
                      alt="Link preview"
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.target.style.display = "none"
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200/50 flex items-center gap-1.5">
                      {linkPreview.favicons?.[0] && (
                        <img
                          src={linkPreview.favicons[0]}
                          className="w-3 h-3 rounded-sm"
                          alt="favicon"
                        />
                      )}
                      <span className="text-[10px] font-bold text-gray-600 truncate max-w-[120px]">
                        {linkPreview.siteName || new URL(linkPreviewUrl).hostname}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1.5">
                    {linkPreview.title || "No title available"}
                  </h4>
                  {linkPreview.description && (
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3">
                      {linkPreview.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-blue-600 font-medium truncate italic">
                        {linkPreviewUrl}
                      </p>
                    </div>
                    <a
                      href={linkPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 text-black shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default TipTapEditor
