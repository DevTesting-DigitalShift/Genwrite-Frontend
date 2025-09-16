import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
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
import Loading from "@components/UI/Loading"
import { ReloadOutlined } from "@ant-design/icons"
import { sendRetryLines } from "@api/blogApi"
import { retryBlog } from "@store/slices/blogSlice"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { markdown } from "@codemirror/lang-markdown"
import { html } from "@codemirror/lang-html"
import { markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { lazy } from "react"
import { Suspense } from "react"
import { createPortal } from "react-dom"
import { getLinkPreview } from "link-preview-js" // Assume this library is installed via npm i link-preview-js
import { useQueryClient } from "@tanstack/react-query"
import { useProofreadingUI } from "@/layout/Editor/useProofreadingUI"

const ContentDiffViewer = lazy(() => import("@/layout/Editor/ContentDiffViewer"))

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

const MarkdownEditor = ({ content, onChange, className }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    let view
    if (containerRef.current) {
      const state = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          }),
        ],
      })
      view = new EditorView({ state, parent: containerRef.current })
    }
    return () => view?.destroy()
  }, [content, onChange])

  return <div ref={containerRef} className={`w-full h-full ${className}`} />
}

const HtmlEditor = ({ content, onChange, className }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    let view
    if (containerRef.current) {
      const state = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          html(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          }),
        ],
      })
      view = new EditorView({ state, parent: containerRef.current })
    }
    return () => view?.destroy()
  }, [content, onChange])

  return <div ref={containerRef} className={`h-screen ${className}`} />
}

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
  humanizedContent,
  showDiff,
  handleAcceptHumanizedContent,
  handleAcceptOriginalContent,
  editorContent,
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
  const htmlCmContainerRef = useRef(null)
  const mdCmContainerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 })
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.subscription?.plan
  const hasShownToast = useRef(false)
  const location = useLocation()
  const fileInputRef = useRef(null)
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`
  const [editImageModalOpen, setEditImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const dispatch = useDispatch()
  const [linkPreview, setLinkPreview] = useState(null)
  const [linkPreviewPos, setLinkPreviewPos] = useState(null)
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(null)
  const [linkPreviewElement, setLinkPreviewElement] = useState(null)
  const hideTimeout = useRef(null)
  const queryClient = useQueryClient()

  const safeContent = content ?? blog?.content ?? ""

  const markdownToHtml = useCallback((markdown) => {
    if (!markdown) return "<p></p>"
    try {
      const html = marked.parse(
        markdown
          .replace(/!\[(["'""])(.*?)\1\]\((.*?)\)/g, (_, __, alt, url) => `![${alt}](${url})`)
          .replace(/'/g, "&apos;")
      )
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")
      doc.querySelectorAll("script").forEach((script) => script.remove())
      return doc.body.innerHTML
    } catch (error) {
      console.warn("Failed to parse markdown:", error)
      return `<p>${markdown}</p>`
    }
  }, [])

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

      const markdown = turndownService.turndown(cleanHtml)
      return markdown
    } catch (error) {
      console.warn("Failed to convert HTML to markdown:", error)
      return html
    }
  }, [])

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
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg mx-auto w-3/4 h-auto object-contain",
            style: "display: block;",
          },
        }),
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
      }
    }
    scrollToTop()
  }, [activeTab, normalEditor])

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

  useEffect(() => {
    if (blog?.status === "failed" && !hasShownToast.current) {
      message.error("Your blog generation failed. You can write blog manually.")
      hasShownToast.current = true
    }
  }, [blog?.status])

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
      .cm-content {
        white-space: pre-wrap; 
        word-break: break-word;
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

  useEffect(() => {
    if (normalEditor && editorReady && blog?.content) {
      const html = normalEditor.getHTML()
      const normalizedMd = htmlToMarkdown(html)
      if (normalizedMd !== safeContent) {
        setContent(normalizedMd)
        setHtmlContent(markdownToHtml(normalizedMd).replace(/>\s*</g, ">\n<"))
      }
    }
  }, [normalEditor, editorReady, blog, htmlToMarkdown, markdownToHtml, safeContent, setContent])

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

  useEffect(() => {
    if (activeTab === "HTML" && !markdownPreview) {
      requestAnimationFrame(() => Prism.highlightAll())
    }
  }, [safeContent, activeTab, markdownPreview])

  useEffect(() => {
    const initialContent = blog?.content ?? ""
    if (safeContent !== initialContent) {
      setContent(initialContent)
      setUnsavedChanges(false)
    }
    if (normalEditor && !normalEditor.isDestroyed && activeTab === "Normal") {
      const htmlContent = initialContent
        ? marked.parse(
            initialContent
              .replace(/!\[(["'""])(.*?)\1\]\((.*?)\)/g, (_, __, alt, url) => `![${alt}](${url})`)
              .replace(/'/g, "&apos;"),
            { gfm: true }
          )
        : "<p></p>"
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
      setImageModalOpen(true)
    })
  }, [safeEditorAction])

  const handleRegenerate = () => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
    } else {
      handlePopup({
        title: "Retry Blog Generation",
        description: (
          <>
            Are you sure you want to retry generating this blog?{" "}
            <span className="font-bold">This will cost 10 credits</span>
          </>
        ),
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

  const insertText = useCallback((before, after, editorRef) => {
    // Adjusted for CodeMirror, but since FloatingToolbar is removed for simplicity, this is not used
  }, [])

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
      message.success("Image added.")
      setImageModalOpen(false)
    } else if (activeTab === "HTML") {
      message.success("Image added.")
      setImageModalOpen(false)
    }
  }, [imageUrl, imageAlt, normalEditor, activeTab])

  const handleTextSelection = useCallback((e) => {
    // Removed for CodeMirror compatibility, as FloatingToolbar is not implemented
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
      message.error("Please select some text to retry.")
      return
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
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
      navigate("/blogs")
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
      setImageAlt(alt || "")
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
      // setUnsavedChanges(false)
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
      setEditImageModalOpen(false)
      setSelectedImage(null)
      setImageAlt("")
    }
  }, [selectedImage, normalEditor, activeTab, setContent, markdownToHtml, htmlToMarkdown])

  useEffect(() => {
    if (activeTab === "Normal" && normalEditor && normalEditor?.view?.dom) {
      const editorElement = normalEditor.view.dom
      editorElement.addEventListener("click", handleImageClick)
      return () => {
        if (editorElement) {
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

  const isFullHtmlDocument = useCallback((text) => {
    return text.trim().startsWith("<!DOCTYPE html>") || text.trim().startsWith("<html")
  }, [])

  const handleRewrite = () => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
    } else {
      handlePopup({
        title: "Rewrite Selected Lines",
        description: (
          <>
            Do you want to rewrite the selected lines?{" "}
            <span className="font-bold">You can rewrite only 3 times.</span>
          </>
        ),
        onConfirm: handleRetry,
      })
    }
  }

  const handleAcceptHumanizedContentModified = useCallback(() => {
    if (humanizedContent) {
      setContent(humanizedContent)
      if (normalEditor && !normalEditor.isDestroyed) {
        const htmlContent = markdownToHtml(humanizedContent)
        normalEditor.commands.setContent(htmlContent, false)
      }
      setHtmlContent(markdownToHtml(humanizedContent).replace(/>\s*</g, ">\n<"))
      setUnsavedChanges(true)
      handleAcceptHumanizedContent()
    }
  }, [
    humanizedContent,
    setContent,
    normalEditor,
    markdownToHtml,
    setHtmlContent,
    handleAcceptHumanizedContent,
  ])

  // New effect for link hover preview and remove button
  useEffect(() => {
    const editorDom = normalEditor.view.dom

    const handleMouseOver = async (e) => {
      // Check if the target or its parent is an <a> tag
      const link = e.target.closest("a")

      const url = link.href

      const rect = link.getBoundingClientRect()
      const scrollY = window.scrollY || window.pageYOffset
      const scrollX = window.scrollX || window.pageXOffset

      // Set position for the preview
      const pos = {
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      }

      setLinkPreviewPos(pos)
      setLinkPreviewUrl(url)
      setLinkPreviewElement(link)

      try {
        const data = await getLinkPreview(url)
        setLinkPreview(data || { title: url, description: "" })
      } catch (err) {
        console.error("Failed to fetch link preview:", err)
        setLinkPreview({ title: url, description: "" })
      }
    }

    const handleMouseOut = (e) => {
      if (e.target.closest("a")) {
        if (hideTimeout.current) clearTimeout(hideTimeout.current)
        hideTimeout.current = setTimeout(() => {
          setLinkPreview(null)
          setLinkPreviewPos(null)
          setLinkPreviewUrl(null)
          setLinkPreviewElement(null)
        }, 200)
      }
    }

    // Use event delegation to handle dynamic content
    editorDom.addEventListener("mouseover", handleMouseOver, true)
    editorDom.addEventListener("mouseout", handleMouseOut, true)

    return () => {
      editorDom.removeEventListener("mouseover", handleMouseOver, true)
      editorDom.removeEventListener("mouseout", handleMouseOut, true)
      if (hideTimeout.current) clearTimeout(hideTimeout.current)
    }
  }, [activeTab, normalEditor])

  const handleRemoveLink = () => {
    if (!linkPreviewElement || !normalEditor) return

    const pos = normalEditor.view.posAtDOM(linkPreviewElement, 0)
    const end = pos + (linkPreviewElement.textContent?.length || 0)
    normalEditor.chain().focus().setTextSelection({ from: pos, to: end }).unsetLink().run()

    setLinkPreview(null)
    setLinkPreviewPos(null)
    setLinkPreviewUrl(null)
    setLinkPreviewElement(null)
  }

  const renderToolbar = () => (
    <div className="bg-white border-x border-gray-200 shadow-sm px-2 sm:px-4 py-2 flex flex-wrap items-center justify-start gap-y-2 overflow-x-auto">
      {/* Headings */}
      <div className="flex gap-1 flex-shrink-0">
        {[1, 2, 3].map((level) => (
          <Tooltip key={level} title={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  if (activeTab === "Normal")
                    normalEditor.chain().focus().toggleHeading({ level }).run()
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

      <div className="w-px h-6 bg-gray-200 mx-1 sm:mx-2 flex-shrink-0" />

      {/* Text styles */}
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip title="Bold">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") normalEditor.chain().focus().toggleBold().run()
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
                if (activeTab === "Normal") normalEditor.chain().focus().toggleItalic().run()
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
                if (activeTab === "Normal") normalEditor.chain().focus().toggleUnderline().run()
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

      <div className="w-px h-6 bg-gray-200 mx-1 sm:mx-2 flex-shrink-0" />

      {/* Alignment */}
      <div className="flex gap-1 flex-shrink-0">
        {["left", "center", "right"].map((align) => (
          <Tooltip key={align} title={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  if (activeTab === "Normal") normalEditor.chain().focus().setTextAlign(align).run()
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

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Lists */}
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip title="Bullet List">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") normalEditor.chain().focus().toggleBulletList().run()
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
                if (activeTab === "Normal") normalEditor.chain().focus().toggleOrderedList().run()
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

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Media & Undo/Redo & Rewrite/Copy/Regenerate/Import */}
      <div className="flex gap-1 flex-nowrap overflow-x-auto">
        <Tooltip title="Link">
          <button
            onClick={handleAddLink}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
            aria-label="Link"
            type="button"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Image">
          <button
            onClick={handleAddImage}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
            aria-label="Image"
            type="button"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Undo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().undo().run())}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
            aria-label="Undo"
            type="button"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Redo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().redo().run())}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
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
                handlePopup({
                  title: "Rewrite Selected Lines",
                  description:
                    "Do you want to rewrite the selected lines? You can rewrite only 3 times.",
                  onConfirm: handleRetry,
                })
              }
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
              aria-label="Rewrite"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Copy">
          <button
            onClick={() => {
              navigator.clipboard.writeText(activeTab === "HTML" ? htmlContent : safeContent)
              message.success("Content copied to clipboard!")
            }}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
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
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
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
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
              aria-label="Import File"
              type="button"
            >
              <Upload className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Hidden file input */}
      {(activeTab === "Markdown" || activeTab === "HTML") && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept={activeTab === "Markdown" ? ".md" : ".html"}
          onChange={handleFileImport}
        />
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Font Select */}
      <Select
        value={selectedFont}
        onChange={(value) => safeEditorAction(() => setSelectedFont(value))}
        className="w-32 flex-shrink-0"
        aria-label="Font"
      >
        {FONT_OPTIONS.map((font) => (
          <Select.Option key={font.value} value={font.value}>
            {font.label}
          </Select.Option>
        ))}
      </Select>

      {/* Markdown/HTML Preview */}
      {(activeTab === "Markdown" || activeTab === "HTML") && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />
          <Tooltip title={markdownPreview ? "Hide Preview" : "Show Preview"}>
            <button
              onClick={() => setMarkdownPreview(!markdownPreview)}
              className={`p-2 rounded-md flex items-center justify-center transition-colors duration-150 ${
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

  function computeLineDiff(original, updated) {
    if (!original || !updated) {
      console.warn("computeLineDiff: Empty or invalid input", { original, updated })
      return [{ lineNumber: 1, oldLine: "", newLine: "", type: "unchanged" }]
    }

    try {
      const originalLines = original.split("\n")
      const updatedLines = updated.split("\n")
      const maxLength = Math.max(originalLines.length, updatedLines.length)
      const result = []
      let lineNumber = 1

      for (let i = 0; i < maxLength; i++) {
        const originalLine = i < originalLines.length ? originalLines[i] : ""
        const updatedLine = i < updatedLines.length ? updatedLines[i] : ""

        if (originalLine === updatedLine) {
          result.push({
            lineNumber: lineNumber++,
            oldLine: originalLine,
            newLine: updatedLine,
            type: "unchanged",
          })
        } else {
          if (originalLine) {
            result.push({
              lineNumber: lineNumber++,
              oldLine: originalLine,
              newLine: "",
              type: "removed",
            })
          }
          if (updatedLine) {
            result.push({
              lineNumber: lineNumber++,
              oldLine: "",
              newLine: updatedLine,
              type: "added",
            })
          }
        }
      }

      return result.length > 0
        ? result
        : [{ lineNumber: 1, oldLine: "", newLine: "", type: "unchanged" }]
    } catch (error) {
      console.error("computeLineDiff error:", error)
      return [{ lineNumber: 1, oldLine: "", newLine: "", type: "unchanged" }]
    }
  }

  const renderContentArea = () => {
    if (isEditorLoading || !editorReady || blog?.status === "pending") {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border rounded-lg">
          <Loading />
        </div>
      )
    }

    if (activeTab === "Normal") {
      if (humanizedContent && showDiff) {
        if (!editorContent && !humanizedContent) {
          return (
            <div className="p-4 bg-white h-screen overflow-auto">
              <p className="text-gray-500">No content to compare.</p>
            </div>
          )
        }

        return (
          <Suspense fallback={<Loading />}>
            <ContentDiffViewer
              oldMarkdown={editorContent}
              newMarkdown={humanizedContent}
              onAccept={handleAcceptHumanizedContentModified}
              onReject={handleAcceptOriginalContent}
            />
          </Suspense>
        )
      } else {
        return (
          <div className="h-[500px] md:h-screen overflow-auto custom-scroll">
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
        )
      }
    }

    if (markdownPreview && (activeTab === "Markdown" || activeTab === "HTML")) {
      if (activeTab === "HTML" && isFullHtmlDocument(htmlContent)) {
        const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ["style"],
          ADD_ATTR: ["target"],
        })
        return (
          <div
            className={`p-8 rounded-lg rounded-t-none overflow-y-auto custom-scroll h-screen border border-gray-200 ${selectedFont}`}
          >
            <iframe srcDoc={sanitizedHtml} title="HTML Preview" sandbox="allow-same-origin" />
          </div>
        )
      }

      return (
        <div
          className={`p-8 rounded-lg rounded-t-none overflow-y-auto custom-scroll h-screen border border-gray-200 bg-white ${selectedFont}`}
        >
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
      <div className="bg-white border rounded-lg rounded-t-none shadow-sm h-[10vh] sm:h-[70vh] md:h-[80vh]">
        {activeTab === "Markdown" && (
          <MarkdownEditor
            content={safeContent}
            onChange={(newContent) => {
              setContent(newContent)
              setUnsavedChanges(true)
            }}
            className="h-full"
          />
        )}
        {activeTab === "HTML" && (
          <HtmlEditor
            content={htmlContent}
            onChange={(newHtml) => {
              setHtmlContent(newHtml)
              setContent(htmlToMarkdown(newHtml))
              setUnsavedChanges(true)
            }}
            className="h-full"
          />
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
          onCancel={handleCancelTabSwitch}
          centered
          className="rounded-lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCancelTabSwitch}
                className="rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleConfirmTabSwitch}
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Continue without Saving
              </Button>
            </div>
          }
        >
          <p className="text-gray-700">
            You have unsaved changes. Switching tabs may cause you to lose your work. Are you sure
            you want to continue?
          </p>
        </Modal>
      )}
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
      {renderToolbar()}
      {renderContentArea()}
      {linkPreviewPos &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: linkPreviewPos.top,
              left: linkPreviewPos.left,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 1000, // Increased zIndex to avoid conflicts
              maxWidth: "300px",
              minWidth: "200px",
              display: "block", // Explicitly ensure visibility
            }}
            onMouseEnter={() => {
              if (hideTimeout.current) clearTimeout(hideTimeout.current)
            }}
            onMouseLeave={() => {
              if (hideTimeout.current) clearTimeout(hideTimeout.current)
              hideTimeout.current = setTimeout(() => {
                setLinkPreview(null)
                setLinkPreviewPos(null)
                setLinkPreviewUrl(null)
                setLinkPreviewElement(null)
              }, 200)
            }}
          >
            {linkPreview ? (
              <>
                <h4 className="text-sm font-semibold truncate">
                  {linkPreview.title || "No title"}
                </h4>
                <p className="text-xs text-gray-600 truncate">{linkPreview.description}</p>
                {linkPreview.images && linkPreview.images[0] && (
                  <img
                    src={linkPreview.images[0]}
                    alt="preview"
                    style={{ width: "100%", height: "auto", marginTop: "8px", borderRadius: "4px" }}
                  />
                )}
                <Button
                  onClick={() => {
                    handleRemoveLink()
                  }}
                  size="small"
                  danger
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    display: "block", // Ensure button is visible
                  }}
                >
                  Remove Link
                </Button>
              </>
            ) : (
              <p className="text-xs">Loading preview...</p>
            )}
          </div>,
          document.body
        )}
      <Modal
        title="Insert Link"
        open={linkModalOpen}
        onOk={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setLinkModalOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button type="primary" onClick={handleConfirmLink} className="rounded-lg">
              Insert Link
            </Button>
          </div>
        }
        centered
      >
        <Input
          bordered={false} // removes AntD’s default border completely
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full mt-4 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
          <div className="flex justify-end gap-2">
            <Button
              key="delete"
              onClick={handleDeleteImage}
              danger
              icon={<Trash2 className="w-4 h-4" />}
              className="rounded-lg"
            >
              Delete Image
            </Button>
            <Button
              key="cancel"
              onClick={() => {
                setEditImageModalOpen(false)
                setSelectedImage(null)
                setImageAlt("")
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button key="ok" type="primary" onClick={handleConfirmEditImage} className="rounded-lg">
              Update Alt Text
            </Button>
          </div>,
        ]}
        centered
      >
        <Input
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="w-full mt-4"
          // prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
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
        onCancel={() => setImageModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setImageModalOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button type="primary" onClick={handleConfirmImage} className="rounded-lg">
              Insert Image
            </Button>
          </div>
        }
        centered
      >
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full mt-4"
          // prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Include http:// or https://</p>
        <Input
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="w-full mt-4"
          // prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Provide alt text for accessibility</p>
      </Modal>
    </motion.div>
  )
}

export default TextEditor
