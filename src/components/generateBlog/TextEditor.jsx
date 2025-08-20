import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import DOMPurify from "dompurify"
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import {
  Bold,
  Italic,
  Underline as IconUnderline,
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
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  RotateCcw,
  Copy,
  Trash2,
  Upload,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { Input, Modal, Tooltip, message, Select, Button } from "antd"
import { marked } from "marked"
import TurndownService from "turndown"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { useProofreadingUI } from "./useProofreadingUI"
import Loading from "@components/Loading"
import { ReloadOutlined } from "@ant-design/icons"
import { sendRetryLines } from "@api/blogApi"
import { retryBlog } from "@store/slices/blogSlice"
// Configure marked for better HTML output
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
})

const FONT_OPTIONS = [
  { label: "Arial", value: "font-arial" },
  { label: "Georgia", value: "font-georgia" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
]

const TextEditor = ({
  blog,
  activeTab,
  setActiveTab,
  content,
  setContent,
  title,
  proofreadingResults,
  handleReplace,
  isSavingKeyword,
}) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [markdownPreview, setMarkdownPreview] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [selectionPosition, setSelectionPosition] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 })
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [tabSwitchWarning, setTabSwitchWarning] = useState(null)
  const [htmlContent, setHtmlContent] = useState("")
  const htmlEditorRef = useRef(null)
  const mdEditorRef = useRef(null)
  const dropdownRef = useRef(null)
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 })
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const hasShownToast = useRef(false)
  const location = useLocation()
  const fileInputRef = useRef(null) // Added for file input
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`
  const [editImageModalOpen, setEditImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const dispatch = useDispatch()

  const safeContent = content ?? blog?.content ?? ""

  // Helper function to convert markdown to HTML
  const markdownToHtml = useCallback((markdown) => {
    if (!markdown) return "<p></p>"
    try {
      const html = marked.parse( markdown
    .replace(/!\[(["'""])(.*?)\1\]\((.*?)\)/g, (_, __, alt, url) => `![${alt}](${url})`) // remove quotes from alt
    .replace(/'/g, "&apos;") )
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")
      doc.querySelectorAll("script").forEach((script) => script.remove())
      return doc.body.innerHTML
    } catch (error) {
      console.warn("Failed to parse markdown:", error)
      return `<p>${markdown}</p>`
    }
  }, [])

  // Helper function to convert HTML to markdown
  const htmlToMarkdown = useCallback((html) => {
    if (!html) return ""
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")
      doc.querySelectorAll("script").forEach((script) => script.remove())
      const cleanHtml = doc.body.innerHTML
      const turndownService = new TurndownService({
        strongDelimiter: "**",
        emDelimiter: "*",
        headingStyle: "atx",
        bulletListMarker: "-",
        codeDelimiter: "```",
        fence: "```",
        hr: "---",
      })

      turndownService.addRule("heading", {
        filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
        replacement: function (content, node) {
          const level = parseInt(node.nodeName.charAt(1))
          return "\n" + "#".repeat(level) + " " + content + "\n\n"
        },
      })

      turndownService.addRule("list", {
        filter: ["ul", "ol"],
        replacement: function (content, node) {
          return "\n" + content + "\n"
        },
      })

      turndownService.addRule("listItem", {
        filter: "li",
        replacement: function (content, node) {
          const parent = node.parentNode
          const isOrdered = parent.nodeName === "OL"
          const marker = isOrdered ? "1. " : "- "
          return marker + content.trim() + "\n"
        },
      })

      const markdown = turndownService.turndown(html)
      return markdown
    } catch (error) {
      console.warn("Failed to convert HTML to markdown:", error)
      return html
    }
  }, [])

  // Memoize initial content
  const initialContent = useMemo(() => {
    return safeContent ? marked.parse(safeContent, { gfm: true }) : "<p></p>"
  }, [safeContent])

  const normalEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          bold: { HTMLAttributes: { class: "font-bold" } },
          italic: { HTMLAttributes: { class: "italic" } },
          underline: { HTMLAttributes: { class: "underline" } },
          link: { HTMLAttributes: { class: "text-blue-600 underline" } },
        }),
        // Link.configure({ HTMLAttributes: { class: "text-blue-600 underline" } }),
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg mx-auto w-3/4 h-auto object-contain",
            style: "display: block;;",
          },
        }),
        // Underline,
        TextAlign.configure({ types: ["heading", "paragraph", "right"] }),
        ProofreadingDecoration.configure({
          suggestions: proofreadingResults,
        }),
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        const markdown = htmlToMarkdown(html)
        if (markdown !== safeContent) {
          setContent(markdown)
          setUnsavedChanges(true)
        }
      },
      editorProps: {
        attributes: {
          class: `prose max-w-none focus:outline-none p-4 min-h-[400px] opacity-100 ${selectedFont} blog-content editor-container`,
        },
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection
        setSelectionRange({ from, to })
      },
    },
    [selectedFont, proofreadingResults, htmlToMarkdown, setContent]
  )

  const { activeSpan, bubbleRef, applyChange, rejectChange } = useProofreadingUI(normalEditor)

  useEffect(() => {
    const scrollToTop = () => {
      if (activeTab === "Normal" && normalEditor && normalEditor?.view?.dom) {
        const editorElement = normalEditor.view.dom
        if (editorElement) {
          editorElement.scrollTop = 0
        }
      } else if (activeTab === "Markdown") {
        const textarea = mdEditorRef.current
        if (textarea) {
          textarea.scrollTop = 0
        }
      } else if (activeTab === "HTML") {
        const textarea = htmlEditorRef.current
        if (textarea) {
          textarea.scrollTop = 0
        }
      }
    }

    scrollToTop()
  }, [activeTab, normalEditor])

  // Handle tab switch loading
  useEffect(() => {
    setIsEditorLoading(true)
    const timer = setTimeout(() => {
      setIsEditorLoading(false)
      if (normalEditor && activeTab === "Normal") {
        normalEditor.commands.focus()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [activeTab, normalEditor])

  // Show message for failed blog status
  useEffect(() => {
    if (blog?.status === "failed" && !hasShownToast.current) {
      message.error("Your blog generation failed. You can write blog manually.")
      hasShownToast.current = true
    }
  }, [blog?.status])

  // Add custom styles
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.id = "text-editor-styles"
    styleElement.textContent = `
      .font-arial { font-family: Arial, sans-serif; }
      .font-georgia { font-family: Georgia, serif; }
      .font-mono { font-family: 'SF Mono', monospace; }
      .font-comic { font-family: "Comic Sans MS", cursive; }
      .bubble-menu {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        padding: 0.25rem;
        display: flex;
        gap: 0.25rem;
        z-index: 50;
      }
      .suggestion-highlight {
        background: #fefcbf;
        cursor: pointer;
      }
      .editor-container {
        width: 100% !important;
        background: white;
      }
      .editor-container h1 {
        font-size: 1.5rem;
      }
      .editor-container h2 {
        font-size: 1.25rem;
      }
      .editor-container h3 {
        font-size: 1rem;
      }
      .editor-container ul, .editor-container ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }
      .editor-container ul {
        list-style-type: disc;
      }
      .editor-container ol {
        list-style-type: decimal;
      }
      .editor-container li {
        margin: 0.5rem 0;
      }
      .editor-container p {
        color: #374151;
      }
      .editor-container strong {
        font-weight: bold;
        color: #1f2937;
      }
      .editor-container em {
        font-style: italic;
      }
      .editor-container a {
        color: #2563eb;
        text-decoration: underline;
        position: relative;
      }
      .editor-container a:hover {
        color: #1d4ed8;
      }
      .editor-container img {
        display: block;
        margin: 1.5rem auto;
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .editor-tab {
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        border-bottom: 2px solid transparent;
        color: #6b7280;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .editor-tab:hover {
        color: #3b82f6;
        background: #f8fafc;
      }
      .editor-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
        background: white;
      }
      .code-textarea {
        font-family: 'SF Mono', monospace;
        font-size: 14px;
        border: none;
        outline: none;
        resize: none;
        background: #f8fafc;
        color: #1f2937;
        padding: 1.5rem;
        border-radius: 0.5rem;
        white-space: pre-wrap;
      }
      .code-textarea:focus {
        background: white;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      .suggestion-tooltip {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 60;
        max-width: 300px;
        font-size: 0.875rem;
      }
      .proof-ui-bubble {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 60;
      }
    `
    document.head.appendChild(styleElement)
    return () => {
      const existingStyle = document.getElementById("text-editor-styles")
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle)
      }
    }
  }, [])

  // Update editor content only when necessary
  useEffect(() => {
    if (normalEditor && activeTab === "Normal" && !normalEditor.isDestroyed) {
      const currentHtml = normalEditor.getHTML()
      const newHtml = markdownToHtml(safeContent)
      if (currentHtml !== newHtml) {
        const { from, to } = normalEditor.state.selection
        normalEditor.commands.setContent(newHtml, false)
        normalEditor.commands.setTextSelection({ from, to })
      }
    }
  }, [safeContent, activeTab, normalEditor, markdownToHtml])

  // Update proofreading suggestions
  useEffect(() => {
    if (normalEditor) {
      const ext = normalEditor.extensionManager.extensions.find(
        (e) => e.name === "proofreadingDecoration"
      )
      if (ext) {
        ext.options.suggestions = proofreadingResults
        normalEditor.view.dispatch(normalEditor.view.state.tr)
      }
    }
  }, [proofreadingResults, normalEditor])

  // Set editor ready and cleanup
  useEffect(() => {
    if (normalEditor) {
      setEditorReady(true)
      return () => {
        if (!normalEditor.isDestroyed) {
          normalEditor.destroy()
        }
      }
    }
  }, [normalEditor])

  // Highlight code in HTML mode
  useEffect(() => {
    if (activeTab === "HTML" && !markdownPreview) {
      requestAnimationFrame(() => Prism.highlightAll())
    }
  }, [safeContent, activeTab, markdownPreview])

  useEffect(() => {
    const initialContent = blog?.content ?? ""
    if (safeContent !== initialContent) {
      setContent(initialContent)
    }
    if (normalEditor && !normalEditor.isDestroyed && activeTab === "Normal") {
      const htmlContent = initialContent ? marked.parse( initialContent
    .replace(/!\[(["'""])(.*?)\1\]\((.*?)\)/g, (_, __, alt, url) => `![${alt}](${url})`) // remove quotes from alt
    .replace(/'/g, "&apos;") , { gfm: true }) : "<p></p>"
      if (normalEditor.getHTML() !== htmlContent) {
        const { from, to } = normalEditor.state.selection
        normalEditor.commands.setContent(htmlContent, false)
        normalEditor.commands.setTextSelection({ from, to })
      }
    }
  }, [blog, normalEditor, activeTab, setContent])

  useEffect(() => {
    if (activeTab === "HTML") {
      setHtmlContent(markdownToHtml(safeContent).replace(/>\s*</g, ">\n<"))
    }
  }, [safeContent, activeTab, markdownToHtml])

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useLayoutEffect(() => {
    if (activeSpan instanceof HTMLElement && bubbleRef.current) {
      const spanRect = activeSpan.getBoundingClientRect()
      const bubbleHeight = bubbleRef.current.offsetHeight
      const top = spanRect.top + window.scrollY - bubbleHeight - 8
      const left = spanRect.left + window.scrollX
      setBubblePos({ top, left })
    }
  }, [activeSpan])

  const showUpgradePopup = () => {
    handlePopup({
      title: "Upgrade Required",
      description: (
        <>
          <span>Editing blogs is only available for Pro and Enterprise users.</span>
          <br />
          <span>Upgrade your plan to unlock this feature.</span>
        </>
      ),
      confirmText: "Buy Now",
      cancelText: "Cancel",
      onConfirm: () => navigate("/pricing"),
    })
  }

  const safeEditorAction = useCallback(
    (action) => {
      if (userPlan === "free" || userPlan === "basic") {
        showUpgradePopup()
        return
      }
      action()
    },
    [userPlan, handlePopup, navigate]
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
      setImageModalOpen(true)
    })
  }, [safeEditorAction])

  const handleRegenerate = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "Rewrite is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    } else {
      handlePopup({
        title: "Retry Blog Generation",
        description: `Are you sure you want to retry generating this blog?\nIt will be of 10 credits`,
        onConfirm: handleReGenerate,
      })
    }
  }

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

  const insertText = useCallback(
    (before, after, editorRef) => {
      const textarea = editorRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)
      const newText = `${before}${selectedText}${after}`
      const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end)
      setContent(newValue)
      setUnsavedChanges(true)
      requestAnimationFrame(() => {
        const newPosition = start + before.length + selectedText.length
        textarea.setSelectionRange(newPosition, newPosition)
        textarea.focus()
      })
    },
    [setContent]
  )

  const handleConfirmImage = useCallback(() => {
    if (!imageUrl || !/https?:\/\//i.test(imageUrl)) {
      message.error("Enter a valid image URL.")
      return
    }
    if (imageUrl.includes("<script") || imageUrl.includes("</script")) {
      message.error("Script tags are not allowed in image URLs.")
      return
    }
    if (activeTab === "Normal" && normalEditor) {
      const { from } = normalEditor.state.selection
      normalEditor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: imageAlt })
        .setTextSelection(from)
        .run()
      setImageModalOpen(false)
      message.success("Image added.")
    } else if (activeTab === "Markdown") {
      const markdownImage = `![${imageAlt}](${imageUrl})`
      insertText(markdownImage, "", mdEditorRef)
      setImageModalOpen(false)
      message.success("Image added.")
    } else if (activeTab === "HTML") {
      const htmlImage = `<img src="${imageUrl}" alt="${imageAlt}" />`
      insertText(htmlImage, "", htmlEditorRef)
      setImageModalOpen(false)
      message.success("Image added.")
    }
  }, [imageUrl, imageAlt, normalEditor, activeTab, insertText])

  const handleTextSelection = useCallback((e) => {
    const textarea = e.target
    if (textarea.selectionStart !== textarea.selectionEnd) {
      const rect = textarea.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setSelectionPosition({
        top: rect.top + scrollTop - 40,
        left: rect.left + 10,
      })
    } else {
      setSelectionPosition(null)
    }
  }, [])

  const handleRetry = async () => {
    if (!blog?._id) {
      message.error("Blog ID is missing.")
      return
    }
    if (!normalEditor && activeTab === "Normal") {
      message.error("Editor is not initialized.")
      return
    }
    let selectedText
    let from, to
    if (activeTab === "Normal") {
      const selection = normalEditor.state.selection
      from = selection.from
      to = selection.to
      if (from === to) {
        message.error("Please select some text to retry.")
        return
      }
      selectedText = normalEditor.state.doc.textBetween(from, to, "\n")
    } else {
      const editorRef = activeTab === "Markdown" ? mdEditorRef : htmlEditorRef
      const textarea = editorRef.current
      if (!textarea) {
        message.error("Editor is not initialized.")
        return
      }
      from = textarea.selectionStart
      to = textarea.selectionEnd
      if (from === to) {
        message.error("Please select some text to retry.")
        return
      }
      selectedText = textarea.value.substring(from, to)
    }
    setOriginalContent(selectedText)
    setSelectionRange({ from, to })
    const payload = {
      contentPart: selectedText.trim(),
    }
    if (normalEditor) {
      normalEditor.commands.blur()
    }
    try {
      setIsRetrying(true)
      const res = await sendRetryLines(blog._id, payload)
      if (res.data) {
        setRetryContent(res.data)
        setRetryModalOpen(true)
      } else {
        message.error("No content received from retry.")
      }
    } catch (error) {
      console.error("Retry failed:", error)
      message.error(error.message || "Retry failed.")
    } finally {
      setIsRetrying(false)
    }
  }

  const handleReGenerate = async () => {
    if (!blog?._id) {
      message.error("Blog ID is missing.")
      return
    }

    const payload = {
      createNew: true,
    }

    try {
      await dispatch(retryBlog({ id: blog._id, payload }))
      navigate("/blogs")
      // navigate("/blogs")
    } catch (error) {
      console.error("Retry failed:", error)
      message.error(error.message || "Retry failed.")
    }
  }

  const handleAcceptRetry = () => {
    if (!retryContent) return
    if (activeTab === "Normal" && normalEditor) {
      const parsedContent = markdownToHtml(retryContent)
      normalEditor
        .chain()
        .focus()
        .deleteRange({ from: selectionRange.from, to: selectionRange.to })
        .insertContentAt(selectionRange.from, parsedContent)
        .setTextSelection({
          from: selectionRange.from,
          to: selectionRange.from + parsedContent.length,
        })
        .run()
    } else {
      const editorRef = activeTab === "Markdown" ? mdEditorRef : htmlEditorRef
      const textarea = editorRef.current
      setContent((prev) => {
        const newContent =
          prev.substring(0, selectionRange.from) + retryContent + prev.substring(selectionRange.to)
        if (textarea) {
          requestAnimationFrame(() => {
            textarea.setSelectionRange(
              selectionRange.from,
              selectionRange.from + retryContent.length
            )
            textarea.focus()
          })
        }
        return newContent
      })
    }
    message.success("Selected lines replaced successfully!")
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
    setSelectionRange({ from: 0, to: 0 })
    setUnsavedChanges(true)
  }

  const handleRejectRetry = () => {
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
    setSelectionRange({ from: 0, to: 0 })
    message.info("Retry content discarded.")
  }

  const handleImageClick = useCallback((event) => {
    if (event.target.tagName === "IMG") {
      const { src, alt } = event.target
      setSelectedImage({ src, alt: alt || "" })
      setImageAlt(alt || "") // Set the existing alt text
      setEditImageModalOpen(true)
    }
  }, [])

  useEffect(() => {
    if (blog?.images?.length > 0) {
      let updatedContent = safeContent
      const imagePlaceholders = safeContent.match(/{Image:.*?}/g) || []
      imagePlaceholders.forEach((placeholder, index) => {
        const imageData = blog.images[index]
        if (imageData?.url) {
          updatedContent = updatedContent.replace(
            placeholder,
            `![${imageData.alt || "Image"}](${imageData.url})`
          )
        }
      })
      setContent(updatedContent)
    }
  }, [blog, safeContent, setContent])

  const handleDeleteImage = useCallback(() => {
    if (!selectedImage) return
    if (activeTab === "Normal" && normalEditor) {
      let deleted = false
      normalEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
          normalEditor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + 1 })
            .run()
          deleted = true
        }
      })
      if (deleted) {
        message.success("Image deleted.")
        setEditImageModalOpen(false)
        setSelectedImage(null)
        setImageAlt("")
        setUnsavedChanges(true)
      } else {
        message.error("Failed to delete image.")
      }
    } else if (activeTab === "Markdown") {
      const markdownImageRegex = new RegExp(
        `!\\[${escapeRegExp(selectedImage.alt || "")}\\]\\(${escapeRegExp(selectedImage.src)}\\)`,
        "g"
      )
      setContent((prev) => {
        const newContent = prev.replace(markdownImageRegex, "")
        setUnsavedChanges(true)
        return newContent
      })
      message.success("Image deleted.")
      setEditImageModalOpen(false)
      setSelectedImage(null)
      setImageAlt("")
    } else if (activeTab === "HTML") {
      const htmlImageRegex = new RegExp(
        `<img\\s+src="${escapeRegExp(selectedImage.src)}"\\s+alt="${escapeRegExp(
          selectedImage.alt || ""
        )}"\\s*/>`,
        "g"
      )
      setContent((prev) => {
        const html = markdownToHtml(prev)
        const updatedHtml = html.replace(htmlImageRegex, "")
        const newContent = htmlToMarkdown(updatedHtml)
        setUnsavedChanges(true)
        return newContent
      })
      message.success("Image deleted.")
      setEditImageModalOpen(false)
      setSelectedImage(null)
      setImageAlt("")
    }
  }, [selectedImage, normalEditor, activeTab, setContent, markdownToHtml, htmlToMarkdown])

  useEffect(() => {
    if (activeTab === "Normal" && normalEditor
       && normalEditor?.view?.dom
    ) {
      const editorElement = normalEditor.view.dom
      editorElement.addEventListener("click", handleImageClick)
      return () => {
        if(editorElement){
          editorElement.removeEventListener("click", handleImageClick)
        }
      }
    }
  }, [normalEditor, activeTab, handleImageClick])

  const handleConfirmEditImage = useCallback(() => {
    if (!selectedImage || !imageAlt) {
      message.error("Alt text is required.")
      return
    }
    if (activeTab === "Normal" && normalEditor) {
      let updated = false
      normalEditor.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === selectedImage.src) {
          normalEditor
            .chain()
            .focus()
            .setNodeSelection(pos)
            .setImage({ src: selectedImage.src, alt: imageAlt })
            .run()
          updated = true
        }
      })
      if (updated) {
        message.success("Image alt text updated.")
        setEditImageModalOpen(false)
        setSelectedImage(null)
        setImageAlt("")
        setUnsavedChanges(true)
      } else {
        message.error("Failed to update image alt text.")
      }
    } else if (activeTab === "Markdown") {
      const markdownImageRegex = new RegExp(
        `!\\[${escapeRegExp(selectedImage.alt || "")}\\]\\(${escapeRegExp(selectedImage.src)}\\)`,
        "g"
      )
      const newMarkdownImage = `![${imageAlt}](${selectedImage.src})`
      setContent((prev) => {
        const newContent = prev.replace(markdownImageRegex, newMarkdownImage)
        setUnsavedChanges(true)
        return newContent
      })
      message.success("Image alt text updated.")
      setEditImageModalOpen(false)
      setSelectedImage(null)
      setImageAlt("")
    } else if (activeTab === "HTML") {
      const htmlImageRegex = new RegExp(
        `<img\\s+src="${escapeRegExp(selectedImage.src)}"\\s+alt="${escapeRegExp(
          selectedImage.alt || ""
        )}"\\s*/>`,
        "g"
      )
      const newHtmlImage = `<img src="${selectedImage.src}" alt="${imageAlt}" />`
      setContent((prev) => {
        const html = markdownToHtml(prev)
        const updatedHtml = html.replace(htmlImageRegex, newHtmlImage)
        const newContent = htmlToMarkdown(updatedHtml)
        setUnsavedChanges(true)
        return newContent
      })
      message.success("Image alt text updated.")
      setEditImageModalOpen(false)
      setSelectedImage(null)
      setImageAlt("")
    }
  }, [selectedImage, imageAlt, normalEditor, activeTab, setContent, markdownToHtml, htmlToMarkdown])

  // Utility to escape special characters for regex
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  const handleTabSwitch = useCallback(
    (tab) => {
      if (unsavedChanges) {
        setTabSwitchWarning(tab)
      } else {
        setActiveTab(tab)
      }
    },
    [unsavedChanges, setActiveTab]
  )

  const handleConfirmTabSwitch = useCallback(() => {
    setUnsavedChanges(false)
    setActiveTab(tabSwitchWarning)
    setTabSwitchWarning(null)
  }, [tabSwitchWarning, setActiveTab])

  const handleCancelTabSwitch = useCallback(() => {
    setTabSwitchWarning(null)
  }, [])

  const hasScriptTag = (content) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")
    return !!doc.querySelector("script")
  }

  const handleFileImport = useCallback(
    (event) => {
      const file = event.target.files[0]
      if (!file) return

      const isMarkdown = activeTab === "Markdown" && file.name.endsWith(".md")
      const isHtml = activeTab === "HTML" && file.name.endsWith(".html")

      if (!isMarkdown && !isHtml) {
        message.error(`Please upload a ${activeTab === "Markdown" ? ".md" : ".html"} file.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        let fileContent = e.target.result
        if (isHtml && hasScriptTag(fileContent)) {
          message.error(
            "Script tags are not allowed in imported HTML content for security reasons."
          )
          return
        }
        setContent(fileContent)
        setUnsavedChanges(true)
        message.success(`${file.name} imported successfully!`)
      }
      reader.onerror = () => {
        message.error("Failed to read the file.")
      }
      reader.readAsText(file)

      event.target.value = null
    },
    [activeTab, setContent]
  )

  const FloatingToolbar = ({ editorRef, mode }) => {
    if (!selectionPosition || !editorRef.current) return null
    const formatActions = {
      Markdown: [
        {
          icon: <Bold className="w-4 h-4" />,
          action: () => safeEditorAction(() => insertText("**", "**", editorRef)),
        },
        {
          icon: <Italic className="w-4 h-4" />,
          action: () => safeEditorAction(() => insertText("*", "*", editorRef)),
        },
        {
          icon: <LinkIcon className="w-4 h-4" />,
          action: () => safeEditorAction(() => insertText("[", "](url)", editorRef)),
        },
        {
          icon: <ImageIcon className="w-4 h-4" />,
          action: handleAddImage,
        },
      ],
      HTML: [
        {
          icon: <Bold className="w-4 h-4" />,
          action: () => safeEditorAction(() => insertText("<strong>", "</strong>", editorRef)),
        },
        {
          icon: <Italic className="w-4 h-4" />,
          action: () => safeEditorAction(() => insertText("<em>", "</em>", editorRef)),
        },
        {
          icon: <LinkIcon className="w-4 h-4" />,
          action: () => safeEditorAction(() => insertText('<a href="url">', "</a>", editorRef)),
        },
        {
          icon: <ImageIcon className="w-4 h-4" />,
          action: handleAddImage,
        },
      ],
    }
    return (
      <motion.div
        className="absolute flex gap-2 bg-white shadow-lg p-2 rounded border z-50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={selectionPosition}
      >
        {formatActions[mode].map((action, index) => (
          <Tooltip key={index} title={action.icon.type.name}>
            <button onClick={action.action} className="p-1 rounded hover:bg-gray-100">
              {action.icon}
            </button>
          </Tooltip>
        ))}
      </motion.div>
    )
  }

  const isFullHtmlDocument = useCallback((text) => {
    return text.trim().startsWith("<!DOCTYPE html>") || text.trim().startsWith("<html")
  }, [])

  const handleRewrite = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "Rewrite is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    } else {
      handlePopup({
        title: "Rewrite Selected Lines",
        description: "Do you want to rewrite the selected lines? You can rewrite only 3 times.",
        onConfirm: handleRetry,
      })
    }
  }
  const renderToolbar = () => (
    <div className="bg-white border-x border-gray-200 shadow-sm px-4 py-2 flex items-center">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <Tooltip key={level} title={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  if (activeTab === "Normal") {
                    normalEditor.chain().focus().toggleHeading({ level }).run()
                  } else if (activeTab === "HTML") {
                    insertText(`<h${level}>`, `</h${level}>`, htmlEditorRef)
                  } else {
                    insertText(`${"#".repeat(level)} `, "", mdEditorRef)
                  }
                })
              }
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                activeTab === "Normal" && normalEditor?.isActive("heading", { level })
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              }`}
              aria-label={`Heading ${level}`}
              type="button"
            >
              {level === 1 && <Heading1 className="w-4 h-4" />}
              {level === 2 && <Heading2 className="w-4 h-4" />}
              {level === 3 && <Heading3 className="w-4 h-4" />}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="w-px h-6 bg-gray-200 mx-2" />
      <div className="flex gap-1">
        <Tooltip title="Bold">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") {
                  normalEditor.chain().focus().toggleBold().run()
                } else if (activeTab === "HTML") {
                  insertText("<strong>", "</strong>", htmlEditorRef)
                } else {
                  insertText("**", "**", mdEditorRef)
                }
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("bold")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            aria-label="Bold"
            type="button"
          >
            <Bold className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Italic">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") {
                  normalEditor.chain().focus().toggleItalic().run()
                } else if (activeTab === "HTML") {
                  insertText("<em>", "</em>", htmlEditorRef)
                } else {
                  insertText("*", "*", mdEditorRef)
                }
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("italic")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            aria-label="Italic"
            type="button"
          >
            <Italic className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Underline">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") {
                  normalEditor.chain().focus().toggleUnderline().run()
                } else if (activeTab === "HTML") {
                  insertText("<u>", "</u>", htmlEditorRef)
                } else {
                  insertText("<u>", "</u>", mdEditorRef)
                }
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("underline")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            aria-label="Underline"
            type="button"
          >
            <IconUnderline className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      <div className="w-px h-6 bg-gray-200 mx-2" />
      <div className="flex gap-1">
        {["left", "center", " personally"].map((align) => (
          <Tooltip key={align} title={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  if (activeTab === "Normal") {
                    normalEditor.chain().focus().setTextAlign(align).run()
                  } else {
                    insertText(
                      `<div style="text-align: ${align};">`,
                      "</div>",
                      activeTab === "HTML" ? htmlEditorRef : mdEditorRef
                    )
                  }
                })
              }
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                activeTab === "Normal" && normalEditor?.isActive({ textAlign: align })
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              }`}
              aria-label={`Align ${align}`}
              type="button"
            >
              {align === "left" && <AlignLeft className="w-4 h-4" />}
              {align === "center" && <AlignCenter className="w-4 h-4" />}
              {align === "right" && <AlignRight className="w-4 h-4" />}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="w-px h-6 bg-gray-200 mx-2" />
      <div className="flex gap-1">
        <Tooltip title="Bullet List">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") {
                  normalEditor.chain().focus().toggleBulletList().run()
                } else if (activeTab === "HTML") {
                  insertText("<ul>\n<li>", "</li>\n</ul>", htmlEditorRef)
                } else {
                  insertText("- ", "", mdEditorRef)
                }
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("bulletList")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            aria-label="Bullet List"
            type="button"
          >
            <List className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Ordered List">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") {
                  normalEditor.chain().focus().toggleOrderedList().run()
                } else if (activeTab === "HTML") {
                  insertText("<ol>\n<li>", "</li>\n</ol>", htmlEditorRef)
                } else {
                  insertText("1. ", "", mdEditorRef)
                }
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("orderedList")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            }`}
            aria-label="Ordered List"
            type="button"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      <div className="w-px h-6 bg-gray-200 mx-2" />
      <div className="flex gap-1">
        <Tooltip title="Link">
          <button
            onClick={handleAddLink}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
            aria-label="Link"
            type="button"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Image">
          <button
            onClick={handleAddImage}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
            aria-label="Image"
            type="button"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Undo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().undo().run())}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
            aria-label="Undo"
            type="button"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Redo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().redo().run())}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
            aria-label="Redo"
            type="button"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        {!pathDetect && (
          <Tooltip title="Rewrite">
            <button
              onClick={() =>
                safeEditorAction(() => {
                  handlePopup({
                    title: "Rewrite Selected Lines",
                    description:
                      "Do you want to rewrite the selected lines? You can rewrite only 3 times.",
                    onConfirm: handleRetry,
                  })
                })
              }
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
              aria-label="Rewrite"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Copy">
          <button
            onClick={() =>
              safeEditorAction(() => {
                navigator.clipboard.writeText(activeTab === "HTML" ? htmlContent : safeContent)
                message.success("Content copied to clipboard!")
              })
            }
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
            aria-label="Copy"
            type="button"
          >
            <Copy className="w-4 h-4" />
          </button>
        </Tooltip>
        {!pathDetect && (
          <Tooltip title="Regenerate Content">
            <button
              onClick={handleRegenerate}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
              aria-label="Regenerate"
              type="button"
            >
              <ReloadOutlined className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
        {(activeTab === "Markdown" || activeTab === "HTML") && (
          <Tooltip title={`Import ${activeTab === "Markdown" ? ".md" : ".html"} File`}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center"
              aria-label="Import File"
              type="button"
            >
              <Upload className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>
      {(activeTab === "Markdown" || activeTab === "HTML") && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept={activeTab === "Markdown" ? ".md" : ".html"}
          onChange={handleFileImport}
        />
      )}
      <div className="w-px h-6 bg-gray-200 mx-2" />
      <Select
        value={selectedFont}
        onChange={(value) => safeEditorAction(() => setSelectedFont(value))}
        className="w-32"
        aria-label="Font"
      >
        {FONT_OPTIONS.map((font) => (
          <Select.Option key={font.value} value={font.value}>
            {font.label}
          </Select.Option>
        ))}
      </Select>
      {(activeTab === "Markdown" || activeTab === "HTML") && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <Tooltip title={markdownPreview ? "Hide Preview" : "Show Preview"}>
            <button
              onClick={() => setMarkdownPreview(!markdownPreview)}
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                markdownPreview ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle Preview"
              type="button"
            >
              {markdownPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Tooltip>
        </>
      )}
    </div>
  )

  const renderContentArea = () => {
    if (isEditorLoading || !editorReady || blog?.status === "pending") {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border rounded-lg">
          <Loading />
        </div>
      )
    }

    if (markdownPreview && (activeTab === "Markdown" || activeTab === "HTML")) {
      if (activeTab === "HTML" && isFullHtmlDocument(htmlContent)) {
        // Render full HTML document in an iframe for HTML tab preview
        const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ["style"],
          ADD_ATTR: ["target"], // Allow target attribute for links
        })
        return (
          <div
            className={`p-8 rounded-lg rounded-t-none overflow-y-auto custom-scroll h-screen border border-gray-200 ${selectedFont}`}
          >
            {/* <h1 className="text-3xl font-bold mb-6 text-gray-900">{title || "Untitled"}</h1> */}
            <iframe srcDoc={sanitizedHtml} title="HTML Preview" sandbox="allow-same-origin" />
          </div>
        )
      }

      return (
        <div
          className={`p-8 rounded-lg rounded-t-none overflow-y-auto custom-scroll h-screen border border-gray-200 bg-white ${selectedFont}`}
        >
          {/* <h1 className="text-3xl font-bold mb-6 text-gray-900">{title || "Untitled"}</h1> */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              a: ({ href, children }) => (
                <Tooltip title={href} placement="top">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {children}
                  </a>
                </Tooltip>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="rounded-lg mx-auto my-3 w-3/4 h-auto shadow-sm"
                />
              ),
              h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-medium">{children}</h3>,
              p: ({ children }) => {
                return (
                  <p className="mb-4 leading-relaxed text-gray-700">
                    {React.Children.map(children, (child, index) => {
                      if (typeof child === "string") {
                        let remainingText = child
                        let elements = []
                        let keyIndex = 0
                        const sortedSuggestions = [...proofreadingResults].sort(
                          (a, b) => b.original.length - a.original.length
                        )
                        while (remainingText.length > 0) {
                          let matched = false
                          for (const suggestion of sortedSuggestions) {
                            const regex = new RegExp(
                              suggestion.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                              "i"
                            )
                            const match = remainingText.match(regex)
                            if (match && match.index === 0) {
                              elements.push(
                                <span
                                  key={`${index}-${keyIndex++}`}
                                  className="suggestion-highlight"
                                  onMouseEnter={() => setHoveredSuggestion(suggestion)}
                                  onMouseLeave={() => setHoveredSuggestion(null)}
                                >
                                  {match[0]}
                                  {hoveredSuggestion === suggestion && (
                                    <div
                                      className="suggestion-tooltip"
                                      style={{ top: "100%", left: 0 }}
                                    >
                                      <p className="text-sm mb-2">
                                        <strong>Suggested:</strong> {suggestion.change}
                                      </p>
                                      <button
                                        className="bg-blue-600 text-white px-2 py-1 rounded"
                                        onClick={() =>
                                          handleReplace(suggestion.original, suggestion.change)
                                        }
                                      >
                                        Replace
                                      </button>
                                    </div>
                                  )}
                                </span>
                              )
                              remainingText = remainingText.slice(match[0].length)
                              matched = true
                              break
                            }
                          }
                          if (!matched) {
                            let minIndex = remainingText.length
                            let nextMatch = null
                            for (const suggestion of sortedSuggestions) {
                              const regex = new RegExp(
                                suggestion.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                                "i"
                              )
                              const match = remainingText.match(regex)
                              if (match && match.index < minIndex) {
                                minIndex = match.index
                                nextMatch = match
                              }
                            }
                            if (minIndex === remainingText.length) {
                              elements.push(
                                <span key={`${index}-${keyIndex++}`}>{remainingText}</span>
                              )
                              remainingText = ""
                            } else {
                              elements.push(
                                <span key={`${index}-${keyIndex++}`}>
                                  {remainingText.slice(0, minIndex)}
                                </span>
                              )
                              remainingText = remainingText.slice(minIndex)
                            }
                          }
                        }
                        return elements
                      }
                      return child
                    })}
                  </p>
                )
              },
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "")
                return !inline && match ? (
                  <pre className="bg-gray-800 text-white p-4 rounded-lg">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 text-red-600 px-1 rounded" {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {safeContent}
          </ReactMarkdown>
        </div>
      )
    }

    return (
      <div className="bg-white border rounded-lg rounded-t-none shadow-sm">
        {activeTab === "Normal" && (
          <div className="h-screen overflow-auto custom-scroll">
            {normalEditor && (
              <BubbleMenu
                editor={normalEditor}
                className="flex gap-2 bg-white shadow-lg p-2 rounded-lg border border-gray-200"
              >
                <Tooltip title="Bold" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => {
                      safeEditorAction(() => {
                        normalEditor.chain().focus().toggleBold().run()
                      })
                    }}
                  >
                    <Bold className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Italic" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => {
                      safeEditorAction(() => {
                        normalEditor.chain().focus().toggleItalic().run()
                      })
                    }}
                  >
                    <Italic className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Heading" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={() => {
                      safeEditorAction(() => {
                        normalEditor.chain().focus().toggleHeading({ level: 2 }).run()
                      })
                    }}
                  >
                    <Heading2 className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Link" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={handleAddLink}
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Image" placement="top">
                  <button
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    onClick={handleAddImage}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                {!pathDetect && (
                  <Tooltip title="Rewrite" placement="top">
                    <button
                      className="p-2 rounded hover:bg-gray-200 text-gray-600"
                      onClick={handleRewrite}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}
              </BubbleMenu>
            )}
            <EditorContent editor={normalEditor} />
            {activeSpan instanceof HTMLElement && (
              <div
                className="proof-ui-bubble"
                ref={bubbleRef}
                style={{
                  position: "absolute",
                  top: bubblePos.top,
                  left: bubblePos.left,
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  Replace with: <strong>{activeSpan.dataset.suggestion}</strong>
                </div>
                <button onClick={applyChange}>✅ Accept</button>
                <button onClick={rejectChange} style={{ marginLeft: 6 }}>
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === "Markdown" && (
          <div className="h-screen">
            <textarea
              ref={mdEditorRef}
              value={safeContent}
              onChange={(e) => {
                setContent(e.target.value)
                setUnsavedChanges(true)
              }}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className={`w-full h-full p-4 text-sm focus:outline-none resize-none bg-white code-textarea custom-scroll ${selectedFont}`}
              placeholder="Enter Markdown here...\nUse # for headings, **bold**, *italic*, - for lists"
              style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}
            />
            <FloatingToolbar editorRef={mdEditorRef} mode="Markdown" />
          </div>
        )}
        {activeTab === "HTML" && (
          <div className="h-screen">
            <textarea
              ref={htmlEditorRef}
              value={htmlContent}
              onChange={(e) => {
                // const text = e.target.value
                // setHtmlContent(text)
                // const markdown = htmlToMarkdown(text)
                // setContent(markdown)
                // setUnsavedChanges(true)
                setContent(e.target.value)
                setUnsavedChanges(true)
              }}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="w-full h-full font-mono text-sm p-4 focus:outline-none resize-none bg-white code-textarea custom-scroll"
              placeholder="<h1>HTML Title</h1>\n<p>Paragraph with <a href='https://example.com'>link</a></p>\n<img src='image.jpg' alt='description' />"
              style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}
            />
            <FloatingToolbar editorRef={htmlEditorRef} mode="HTML" />
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(isRetrying || isSavingKeyword) && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loading />
        </motion.div>
      )}
      {retryModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Original Text</h4>
                <div className="p-4 bg-gray-100 rounded-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    className="prose"
                    components={{
                      a: ({ href, children }) => (
                        <Tooltip title={href} placement="top">
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {children}
                          </a>
                        </Tooltip>
                      ),
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    }}
                  >
                    {originalContent || "No text selected"}
                  </ReactMarkdown>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Improved Text</h4>
                <div className="p-4 bg-gray-50 rounded-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    className="prose"
                    components={{
                      a: ({ href, children }) => (
                        <Tooltip title={href} placement="top">
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {children}
                          </a>
                        </Tooltip>
                      ),
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    }}
                  >
                    {retryContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleRejectRetry}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Reject
              </button>
              <button
                onClick={handleAcceptRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {tabSwitchWarning && (
        <Modal
          title="Unsaved Changes"
          open={true}
          onOk={handleConfirmTabSwitch}
          onCancel={handleCancelTabSwitch}
          okText="Continue without Saving"
          cancelText="Cancel"
          centered
        >
          <p className="text-sm text-gray-600">
            You have unsaved changes. Switching tabs may cause you to lose your work. Are you sure
            you want to continue?
          </p>
        </Modal>
      )}
      {!pathDetect && (
        <div className="flex border-b bg-white shadow-sm border-x">
          {["Normal", "Markdown", "HTML"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              className={`editor-tab ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      {renderToolbar()}
      {renderContentArea()}
      <Modal
        title="Insert Link"
        open={linkModalOpen}
        onOk={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
        okText="Insert Link"
        cancelText="Cancel"
        centered
      >
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full mt-4"
          prefix={<LinkIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Include http:// or https://</p>
      </Modal>
      <Modal
        title="Edit Image Alt Text"
        open={editImageModalOpen}
        onOk={handleConfirmEditImage}
        onCancel={() => {
          setEditImageModalOpen(false)
          setSelectedImage(null)
          setImageAlt("")
        }}
        okText="Update Alt Text"
        cancelText="Cancel"
        footer={[
          <Button
            key="delete"
            onClick={handleDeleteImage}
            danger
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Image
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              setEditImageModalOpen(false)
              setSelectedImage(null)
              setImageAlt("")
            }}
          >
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={handleConfirmEditImage}>
            Update Alt Text
          </Button>,
        ]}
        centered
      >
        <Input
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="w-full mt-4"
          prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Provide alt text for accessibility</p>
        {selectedImage && (
          <div className="mt-4">
            <img
              src={selectedImage.src}
              alt={imageAlt || selectedImage.alt}
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}
      </Modal>
      <Modal
        title="Insert Image"
        open={imageModalOpen}
        onOk={handleConfirmImage}
        onCancel={() => setImageModalOpen(false)}
        okText="Insert Image"
        cancelText="Cancel"
        centered
      >
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full mt-4"
          prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Include http:// or https://</p>
        <Input
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="w-full mt-4"
          prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Provide alt text for accessibility</p>
      </Modal>
    </motion.div>
  )
}

export default TextEditor
