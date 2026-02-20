import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { motion } from "framer-motion"
import DOMPurify from "dompurify"
import {
  Bold,
  Italic,
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
  Trash2,
  Table as TableIcon,
  TableProperties,
  Plus,
  Minus,
  Sparkles,
  Check,
  ExternalLink,
} from "lucide-react"
import toast from "@utils/toast"
import { marked } from "marked"
import TurndownService from "turndown"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { createPortal } from "react-dom"
import { getLinkPreview } from "link-preview-js"
import ContentDiffViewer from "../Editor/ContentDiffViewer"
import "./editor.css"
import { VideoEmbed } from "@/extensions/VideoEmbed"
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
// Removed unused Ant Design import

// Markdown Renderer
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

  // Table state
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false)
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 })
  const tableButtonRef = useRef(null)

  // Link state
  const [linkUrl, setLinkUrl] = useState("")

  // Image state
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
    dimensions: "1024x1024",
  })
  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [genForm, setGenForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1024x1024",
  })

  // Table Popover State
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false)

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

  // Sync ref with state
  useEffect(() => {
    lastSavedContentRef.current = lastSavedContent
  }, [lastSavedContent])

  const normalizeContent = useCallback(str => str.replace(/\s+/g, " ").trim(), [])

  // Markdown to HTML conversion
  const markdownToHtml = useCallback(markdown => {
    if (!markdown) return "<p></p>"
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

  // HTML to Markdown conversion
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
        StarterKit.configure({ heading: false }),
        Heading.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              id: {
                default: null,
                parseHTML: element => element.getAttribute("id"),
                renderHTML: attributes => {
                  if (!attributes.id) return {}
                  return { id: attributes.id }
                },
              },
            }
          },
        }).configure({ levels: [1, 2, 3, 4] }),
        Node.create({
          name: "section",
          group: "block",
          content: "block+",
          draggable: false,
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
                  if (!attributes.id) return {}
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
      toast.error("Select text to link.")
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

  const handleConfirmLink = useCallback(() => {
    if (!linkUrl || !/https?:\/\//i.test(linkUrl)) {
      toast.error("Enter a valid URL.")
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
      toast.success("Link added.")
    }
  }, [linkUrl, normalEditor])

  const handleSaveImageChanges = () => {
    if (normalEditor) {
      if (!imageUrl) {
        handleDeleteImage()
      } else {
        if (editingImageSrc) {
          normalEditor.state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.src === editingImageSrc) {
              const tr = normalEditor.state.tr
              tr.setNodeMarkup(pos, undefined, { src: imageUrl, alt: imageAlt || "" })
              normalEditor.view.dispatch(tr)
              return false
            }
          })
          toast.success("Image updated")
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
      if (deleted) toast.success("Image deleted")
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
        setTableDropdownOpen(false)
        setHoveredCell({ row: 0, col: 0 })

        setTimeout(() => {
          normalEditor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
          toast.success(`Table ${rows}x${cols} added.`)
        }, 100)
      }
    },
    [normalEditor]
  )

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        tableDropdownOpen &&
        tableButtonRef.current &&
        !tableButtonRef.current.contains(event.target) &&
        !event.target.closest(".fixed.bg-white")
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

      const currentHtml = normalEditor.getHTML()
      const roundTripMarkdown = htmlToMarkdown(currentHtml)

      setContent(roundTripMarkdown)
      setLastSavedContent(roundTripMarkdown)

      setTimeout(() => {
        const editorContainer = document.querySelector(".flex-1.overflow-auto.custom-scroll")
        if (editorContainer) {
          editorContainer.scrollTop = 0
        }
      }, 100)
    }
  }, [normalEditor, blog, markdownToHtml])

  useEffect(() => {
    if (normalEditor && content) {
      const currentEditorMarkdown = htmlToMarkdown(normalEditor.getHTML())
      if (normalizeContent(content) !== normalizeContent(currentEditorMarkdown)) {
        const html = markdownToHtml(content)
        normalEditor.commands.setContent(html, true)
      }
    }
  }, [content, normalEditor, markdownToHtml, htmlToMarkdown, normalizeContent])

  useEffect(() => {
    setIsEditorLoading(true)
    const timer = setTimeout(() => {
      setIsEditorLoading(false)
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

  // Highlights listener (kept same)
  useEffect(() => {
    const handleHighlight = event => {
      const sectionId = event.detail
      if (!normalEditor) return

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

      const element = normalEditor.view.dom.querySelector(`#${sectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
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
    <div className="bg-white border-x border-gray-200 overflow-hidden shadow-sm px-2 sm:px-4 py-2 flex flex-wrap items-center justify-start gap-y-2 overflow-x-auto">
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4].map(level => (
          <div key={level} className="tooltip tooltip-bottom" data-tip={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => normalEditor.chain().focus().toggleHeading({ level }).run())
              }
              className={`p-2 rounded-md text-black hover:bg-gray-100 ${
                normalEditor?.isActive("heading", { level }) ? "bg-blue-100 text-blue-600" : ""
              }`}
              type="button"
            >
              {level === 1 && <Heading1 className="w-4 h-4" />}
              {level === 2 && <Heading2 className="w-4 h-4" />}
              {level === 3 && <Heading3 className="w-4 h-4" />}
              {level === 4 && <Heading4 className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      <div className="flex gap-1 shrink-0">
        <div className="tooltip tooltip-bottom" data-tip="Bold">
          <button
            onClick={() => safeEditorAction(() => normalEditor.chain().focus().toggleBold().run())}
            className={`p-2 rounded-md text-black hover:bg-gray-100 ${
              normalEditor?.isActive("bold") ? "bg-blue-100 text-blue-600" : ""
            }`}
            type="button"
          >
            <Bold className="w-4 h-4 text-black" />
          </button>
        </div>
        <div className="tooltip tooltip-bottom" data-tip="Italic">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleItalic().run())
            }
            className={`p-2 rounded-md text-black hover:bg-gray-100 ${
              normalEditor?.isActive("italic") ? "bg-blue-100 text-blue-600" : ""
            }`}
            type="button"
          >
            <Italic className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      <div className="flex gap-1 shrink-0">
        {["left", "center", "right"].map(align => (
          <div key={align} className="tooltip tooltip-bottom" data-tip={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => normalEditor.chain().focus().setTextAlign(align).run())
              }
              className={`p-2 rounded-md text-black hover:bg-gray-100 ${
                normalEditor?.isActive({ textAlign: align }) ? "bg-blue-100 text-blue-600" : ""
              }`}
              type="button"
            >
              {align === "left" && <AlignLeft className="w-4 h-4" />}
              {align === "center" && <AlignCenter className="w-4 h-4" />}
              {align === "right" && <AlignRight className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      <div className="flex gap-1 shrink-0">
        <div className="tooltip tooltip-bottom" data-tip="Bullet List">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleBulletList().run())
            }
            className={`p-2 rounded-md text-black hover:bg-gray-100 ${
              normalEditor?.isActive("bulletList") ? "bg-blue-100 text-blue-600" : ""
            }`}
            type="button"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        <div className="tooltip tooltip-bottom" data-tip="Ordered List">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleOrderedList().run())
            }
            className={`p-2 rounded-md text-black hover:bg-gray-100 ${
              normalEditor?.isActive("orderedList") ? "bg-blue-100 text-blue-600" : ""
            }`}
            type="button"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      <div className="flex gap-1 shrink-0">
        <div className="tooltip tooltip-bottom" data-tip="Link">
          <button
            onClick={handleAddLink}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="tooltip tooltip-bottom" data-tip="Image">
          <button
            onClick={handleAddImage}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="relative" ref={tableButtonRef}>
          <div className="tooltip tooltip-bottom" data-tip="Table">
            <button
              onClick={handleAddTable}
              className={`p-2 rounded-md text-black hover:bg-gray-100 shrink-0 ${
                tableDropdownOpen ? "bg-blue-100 text-blue-600" : ""
              }`}
              type="button"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
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
                      className={`w-5 h-5 border border-gray-300 cursor-pointer ${
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

        {normalEditor?.isActive("table") && (
          <div className="relative inline-block">
            <div className="tooltip tooltip-bottom" data-tip="Table Options">
              <button
                className={`p-2 rounded-md text-black shrink-0 ${
                  normalEditor.isActive("table") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`}
                type="button"
                onClick={() => setTablePopoverOpen(!tablePopoverOpen)}
              >
                <TableProperties className="w-4 h-4" />
              </button>
            </div>
            {tablePopoverOpen && (
              <div className="absolute top-10 left-0 z-50 p-2 shadow-xl bg-white rounded-box w-52 border border-gray-200">
                <ul className="menu menu-sm p-0 gap-1">
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().addRowBefore().run()
                        toast.success("Row added")
                      }}
                      disabled={!normalEditor.can().addRowBefore()}
                    >
                      <Plus className="w-3 h-3" /> Add Row Before
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().addRowAfter().run()
                        toast.success("Row added")
                      }}
                      disabled={!normalEditor.can().addRowAfter()}
                    >
                      <Plus className="w-3 h-3" /> Add Row After
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().deleteRow().run()
                        toast.success("Row deleted")
                      }}
                      disabled={!normalEditor.can().deleteRow()}
                      className="text-error"
                    >
                      <Minus className="w-3 h-3" /> Delete Row
                    </button>
                  </li>
                  <div className="divider my-0"></div>
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().addColumnBefore().run()
                        toast.success("Column added")
                      }}
                      disabled={!normalEditor.can().addColumnBefore()}
                    >
                      <Plus className="w-3 h-3" /> Add Col Before
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().addColumnAfter().run()
                      }}
                      disabled={!normalEditor.can().addColumnAfter()}
                    >
                      <Plus className="w-3 h-3" /> Add Col After
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().deleteColumn().run()
                      }}
                      disabled={!normalEditor.can().deleteColumn()}
                      className="text-error"
                    >
                      <Minus className="w-3 h-3" /> Delete Col
                    </button>
                  </li>
                  <div className="divider my-0"></div>
                  <li>
                    <button
                      onClick={() => {
                        normalEditor.chain().focus().deleteTable().run()
                      }}
                      disabled={!normalEditor.can().deleteTable()}
                      className="text-error"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Table
                    </button>
                  </li>
                </ul>
              </div>
            )}
            {/* Backdrop to close popover */}
            {tablePopoverOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setTablePopoverOpen(false)}></div>
            )}
          </div>
        )}

        <div className="tooltip tooltip-bottom" data-tip="Undo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().undo().run())}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>
        <div className="tooltip tooltip-bottom" data-tip="Redo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().redo().run())}
            className="p-2 rounded-md text-black hover:bg-gray-100 shrink-0"
            type="button"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />

      <select
        value={selectedFont}
        onChange={e => safeEditorAction(() => setSelectedFont(e.target.value))}
        className="select select-bordered select-sm w-32 shrink-0"
      >
        {FONT_OPTIONS.map(font => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>
    </div>
  )

  if (isEditorLoading || !editorReady) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border border-gray-200 rounded-lg">
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
      <div className="sticky top-0 bg-white shadow-sm shrink-0 z-10">{renderToolbar()}</div>

      <div className="flex-1 overflow-auto custom-scroll bg-white p-4">
        {normalEditor && (
          <AIBubbleMenu
            editor={normalEditor}
            blogId={blog?._id}
            sectionId={null}
            onContentUpdate={() => {}}
          >
            <div className="tooltip tooltip-top" data-tip="Bold">
              <button
                className="p-2 rounded hover:bg-gray-200"
                onClick={() =>
                  safeEditorAction(() => normalEditor.chain().focus().toggleBold().run())
                }
              >
                <Bold className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="tooltip tooltip-top" data-tip="Italic">
              <button
                className="p-2 rounded hover:bg-gray-200"
                onClick={() =>
                  safeEditorAction(() => normalEditor.chain().focus().toggleItalic().run())
                }
              >
                <Italic className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="tooltip tooltip-top" data-tip="Link">
              <button className="p-2 rounded hover:bg-gray-200" onClick={handleAddLink}>
                <LinkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </AIBubbleMenu>
        )}
        <EditorContent editor={normalEditor} />
      </div>

      {/* Link Modal */}
      {linkModalOpen && (
        <div className="modal modal-open z-9999">
          <div className="modal-box p-6 border border-gray-200 shadow-xl rounded-2xl max-w-md">
            <h3 className="font-bold text-lg mb-4">Insert Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="input input-bordered w-full mb-6"
            />
            <div className="modal-action flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setLinkModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmLink}>
                Ok
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setLinkModalOpen(false)}></div>
        </div>
      )}

      {/* Unified Image Edit Modal */}
      {editModalOpen && (
        <div className="modal modal-open z-9999">
          <div className="modal-box w-11/12 max-w-4xl p-6 border border-gray-200 shadow-xl rounded-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>Edit Image</span>
            </h3>

            <div className="flex flex-col h-[calc(80vh-100px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                {/* Left Col */}
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-2 flex flex-col items-center justify-center gap-3">
                  <img
                    src={imageUrl}
                    alt={imageAlt || "Preview"}
                    className="max-w-full rounded-lg object-contain max-h-[300px]"
                    onError={e => {
                      e.currentTarget.src = "https://via.placeholder.com/300?text=Preview"
                    }}
                  />
                  {imageUrl && !isEnhanceMode && blog?.imageSource === "ai" && (
                    <button
                      className="btn btn-sm btn-outline btn-secondary gap-2"
                      onClick={() => {
                        setIsEnhanceMode(true)
                        setEnhanceForm(prev => ({ ...prev, prompt: imageAlt || "" }))
                      }}
                    >
                      <Sparkles className="w-3 h-3" /> Enhance Image
                      <div className="badge badge-secondary badge-outline badge-xs">
                        {COSTS.ENHANCE} credits
                      </div>
                    </button>
                  )}

                  {!imageUrl && !isGenerateMode && (
                    <button
                      className="btn btn-primary w-full gap-2"
                      onClick={() => setIsGenerateMode(true)}
                    >
                      <Sparkles className="w-4 h-4" /> Generate Image
                    </button>
                  )}

                  {isGenerateMode && (
                    <div className="w-full mt-2 bg-white p-3 rounded border border-blue-100 shadow-sm space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Prompt</label>
                        <textarea
                          className="textarea textarea-bordered w-full text-sm mt-1"
                          placeholder="Describe image..."
                          rows={2}
                          value={genForm.prompt}
                          onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Style</label>
                          <select
                            className="select select-bordered select-sm w-full mt-1"
                            value={genForm.style}
                            onChange={e => setGenForm({ ...genForm, style: e.target.value })}
                          >
                            <option value="photorealistic">Photorealistic</option>
                            <option value="anime">Anime</option>
                            <option value="digital-art">Digital Art</option>
                            <option value="oil-painting">Oil Painting</option>
                            <option value="sketch">Sketch</option>
                            <option value="cinematic">Cinematic</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Ratio</label>
                          <select
                            className="select select-bordered select-sm w-full mt-1"
                            value={genForm.aspectRatio}
                            onChange={e => setGenForm({ ...genForm, aspectRatio: e.target.value })}
                          >
                            <option value="1:1">Square (1:1)</option>
                            <option value="16:9">Landscape (16:9)</option>
                            <option value="9:16">Portrait (9:16)</option>
                            <option value="4:3">Standard (4:3)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-sm" onClick={() => setIsGenerateMode(false)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
                              toast.error("Limit reached.")
                              return
                            }
                            const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                            if (credits < COSTS.GENERATE) {
                              toast.error(`Need ${COSTS.GENERATE} credits.`)
                              return
                            }
                            if (!genForm.prompt.trim()) {
                              toast.error("Enter a prompt")
                              return
                            }
                            const hide = toast.loading("Generating...")
                            try {
                              const response = await generateImage(genForm)
                              const newImage = response.image || response.data || response
                              if (newImage && newImage.url) {
                                setImageUrl(newImage.url)
                                setImageAlt(genForm.prompt)
                                toast.success("Image generated!")
                                setIsGenerateMode(false)
                              }
                            } catch (err) {
                              toast.error("Failed to generate")
                            } finally {
                              hide()
                            }
                          }}
                        >
                          Generate ({COSTS.GENERATE}c)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Col */}
                <div className="space-y-4">
                  {isEnhanceMode ? (
                    <div className="w-full bg-white p-4 rounded border border-purple-100 shadow-sm space-y-4 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          Enhance Settings
                        </h3>
                        <div className="badge badge-secondary badge-outline">
                          {COSTS.ENHANCE} credits
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Instruction</label>
                        <textarea
                          className="textarea textarea-bordered w-full text-sm mt-1"
                          placeholder="Describe changes..."
                          rows={4}
                          value={enhanceForm.prompt}
                          onChange={e => setEnhanceForm({ ...enhanceForm, prompt: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Style</label>
                          <select
                            className="select select-bordered select-sm w-full mt-1"
                            value={enhanceForm.style}
                            onChange={e =>
                              setEnhanceForm({ ...enhanceForm, style: e.target.value })
                            }
                          >
                            <option value="photorealistic">Photorealistic</option>
                            <option value="anime">Anime</option>
                            <option value="digital-art">Digital Art</option>
                            <option value="oil-painting">Oil Painting</option>
                            <option value="cinematic">Cinematic</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Quality</label>
                          <select
                            className="select select-bordered select-sm w-full mt-1"
                            value={enhanceForm.quality}
                            onChange={e =>
                              setEnhanceForm({ ...enhanceForm, quality: e.target.value })
                            }
                          >
                            <option value="1k">Standard (1k)</option>
                            <option value="2k">High (2k)</option>
                            <option value="4k">Ultra (4k)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-auto pt-4">
                        <button className="btn btn-sm" onClick={() => setIsEnhanceMode(false)}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
                              toast.error("Limit reached.")
                              return
                            }
                            const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                            if (credits < COSTS.ENHANCE) {
                              toast.error(`Need ${COSTS.ENHANCE} credits.`)
                              return
                            }
                            if (!enhanceForm.prompt.trim()) {
                              toast.error("Enter instruction")
                              return
                            }
                            const hide = toast.loading("Enhancing...")
                            try {
                              const formData = new FormData()
                              formData.append("prompt", enhanceForm.prompt)
                              formData.append("style", enhanceForm.style)
                              formData.append("quality", enhanceForm.quality || "2k")
                              formData.append("dimensions", enhanceForm.dimensions || "1024x1024")
                              formData.append("imageUrl", imageUrl)

                              const response = await enhanceImage(formData)
                              const newImage = response.image || response.data || response
                              if (newImage && newImage.url) {
                                setImageUrl(newImage.url)
                                toast.success("Image enhanced!")
                                setIsEnhanceMode(false)
                              }
                            } catch (err) {
                              console.error(err)
                              toast.error("Failed to enhance")
                            } finally {
                              hide()
                            }
                          }}
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="label">
                          <span className="label-text">
                            Image URL <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={imageUrl}
                          onChange={e => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="label">
                            <span className="label-text">
                              Alt Text <span className="text-red-500">*</span>
                            </span>
                          </label>
                          {imageUrl && (
                            <div className="tooltip tooltip-left" data-tip="Generate Alt Text">
                              <button
                                className="btn btn-ghost btn-xs text-xs gap-1"
                                onClick={async () => {
                                  const credits =
                                    (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                                  if (credits < COSTS.ALT_TEXT) {
                                    toast.error(`Need ${COSTS.ALT_TEXT} credits.`)
                                    return
                                  }
                                  const hide = toast.loading("Generating...")
                                  try {
                                    const response = await generateAltText({ imageUrl })
                                    const alt = response.altText || response.data?.altText
                                    if (alt) {
                                      setImageAlt(alt)
                                      toast.success("Alt text generated!")
                                    }
                                  } catch (err) {
                                    toast.error("Failed")
                                  } finally {
                                    hide()
                                  }
                                }}
                              >
                                AI Generate{" "}
                                <div className="badge badge-ghost badge-xs">{COSTS.ALT_TEXT}c</div>
                              </button>
                            </div>
                          )}
                        </div>
                        <textarea
                          className="textarea textarea-bordered w-full"
                          rows={3}
                          value={imageAlt}
                          onChange={e => setImageAlt(e.target.value)}
                          placeholder="Describe image for SEO"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-action flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                {!isEnhanceMode ? (
                  <>
                    <button className="btn btn-error btn-outline gap-2" onClick={handleDeleteImage}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <div className="flex gap-2">
                      <button className="btn" onClick={handleOpenAdvancedOptions}>
                        Advanced
                      </button>
                      <button className="btn" onClick={() => setEditModalOpen(false)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary gap-2" onClick={handleSaveImageChanges}>
                        <Check className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full"></div> // Spacer logic if needed
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setEditModalOpen(false)}></div>
        </div>
      )}

      {/* Link Preview (unchanged) */}
    </motion.div>
  )
}

export default TipTapEditor
