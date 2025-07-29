import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from "react"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
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
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  RotateCcw,
  Copy,
} from "lucide-react"
import { useSelector } from "react-redux"
import { Input, Modal, Tooltip, message, Select } from "antd"
import { marked } from "marked"
import TurndownService from "turndown"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { useProofreadingUI } from "./useProofreadingUI"
import Loading from "@components/Loading"
import { ReloadOutlined } from "@ant-design/icons"

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
  console.log({ content })
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [markdownPreview, setMarkdownPreview] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [selectionPosition, setSelectionPosition] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 })
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null)
  const htmlEditorRef = useRef(null)
  const mdEditorRef = useRef(null)
  const dropdownRef = useRef(null)
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 })
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const hasShownToast = useRef(false)

  const safeContent = content ?? blog?.content ?? ""

  // Helper function to convert markdown to HTML
  const markdownToHtml = useCallback((markdown) => {
    if (!markdown) return "<p></p>"

    try {
      // Parse markdown to HTML using marked
      const html = marked.parse(markdown)
      return html
    } catch (error) {
      console.warn("Failed to parse markdown:", error)
      return `<p>${markdown}</p>`
    }
  }, [])

  // Helper function to convert HTML to markdown
  const htmlToMarkdown = useCallback((html) => {
    if (!html) return ""

    try {
      const turndownService = new TurndownService({
        strongDelimiter: "**",
        emDelimiter: "*",
        headingStyle: "atx", // Use # for headings
        bulletListMarker: "-",
        codeDelimiter: "```",
        fence: "```",
        hr: "---",
      })

      // Configure turndown rules for better conversion
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
          bold: {
            HTMLAttributes: {
              class: "font-bold",
            },
          },
        }),
        Link.configure({
          HTMLAttributes: { class: "text-blue-600 underline" },
        }),
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg mx-auto my-4 max-w-[800px] w-full h-auto object-contain",
            style: "display: block; margin: 2rem auto;",
          },
        }),
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        ProofreadingDecoration.configure({
          suggestions: proofreadingResults,
        }),
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        const turndownService = new TurndownService({
          strongDelimiter: "**",
        })
        const markdown = turndownService.turndown(editor.getHTML())
        setContent(markdown)
      },
      editorProps: {
        attributes: {
          class: `prose max-w-none focus:outline-none p-4 min-h-[400px] opacity-100 ${selectedFont} blog-content editor-container`,
        },
      },
    },
    [selectedFont, proofreadingResults]
  )

  const { activeSpan, bubbleRef, applyChange, rejectChange } = useProofreadingUI(normalEditor)

  // Handle tab switch loading
  useEffect(() => {
    setIsEditorLoading(true)
    const timer = setTimeout(() => {
      setIsEditorLoading(false)
      if (normalEditor && activeTab === "Normal") {
        normalEditor.commands.focus("start")
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
        // font-weight: bold;
        // margin: 1.5rem 0 1rem 0;
        // line-height: 1.2;
        // color: #1f2937;
      }
      .editor-container h2 {
        font-size: 1.25rem;
        // font-weight: bold;
        // margin: 1.25rem 0 0.75rem 0;
        // line-height: 1.3;
        // color: #374151;
      }
      .editor-container h3 {
        font-size: 1rem;
        // font-weight: bold;
        // margin: 1rem 0 0.5rem 0;
        // line-height: 1.4;
        // color: #4b5563;
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
        // line-height: 1.6;
      }
      .editor-container p {
        // margin: 1rem 0;
        // line-height: 1.7;
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
      .ProseMirror:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
        // line-height: 1.5;
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

  // Update editor content when safeContent changes
  useEffect(() => {
    if (normalEditor && activeTab === "Normal" && !normalEditor.isDestroyed) {
      try {
        const htmlContent = markdownToHtml(safeContent)
        // Only update if content has actually changed
        if (normalEditor.getHTML() !== htmlContent) {
          normalEditor.commands.setContent(htmlContent, false)
        }
      } catch (error) {
        console.warn("Failed to update editor content:", error)
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
    setContent(initialContent)
    if (normalEditor && !normalEditor.isDestroyed && activeTab === "normal") {
      const htmlContent = initialContent ? marked.parse(initialContent, { gfm: true }) : "<p></p>"
      normalEditor.commands.setContent(htmlContent)
    }
  }, [blog, normalEditor, activeTab, setContent])

  // Handle click outside for model dropdown
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
        onConfirm: handleRetry,
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
      requestAnimationFrame(() => {
        const newPosition = start + before.length + selectedText.length
        textarea.setSelectionRange(newPosition, newPosition)
        textarea.focus()
      })
    },
    [setContent]
  )

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
  }

  const handleRejectRetry = () => {
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
    setSelectionRange({ from: 0, to: 0 })
    message.info("Retry content discarded.")
  }

  // Rest of your component methods remain the same...
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
      {/* Headings */}
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
      {/* Formatting */}
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
      {/* Alignment */}
      <div className="flex gap-1">
        {["left", "center", "right"].map((align) => (
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
      {/* Lists */}
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
      {/* Actions */}
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
        <Tooltip title="Copy">
          <button
            onClick={() =>
              safeEditorAction(() => {
                navigator.clipboard.writeText(safeContent)
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
      </div>
      <div className="w-px h-6 bg-gray-200 mx-2" />
      {/* Font Picker */}
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
      {/* Preview Toggle */}
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
      return (
        <div className={`p-8 rounded-lg rounded-t-none overflow-y-auto bg-white ${selectedFont}`}>
          <h1 className="text-3xl font-bold mb-6 text-gray-900">{title || "Untitled"}</h1>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="rounded-lg mx-auto my-6 max-w-full h-auto shadow-sm"
                />
              ),
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-blue-500 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">{children}</h3>
              ),
              p: ({ children }) => {
                const textContent = React.Children.toArray(children)
                  .map((child) => (typeof child === "string" ? child : ""))
                  .join("")
                return (
                  <p className="mb-4 leading-relaxed text-gray-700">
                    {React.Children.map(children, (child, index) => {
                      if (typeof child === "string") {
                        let remainingText = child
                        let elements = []
                        let keyIndex = 0
                        while (remainingText.length > 0) {
                          let matched = false
                          for (const suggestion of proofreadingResults) {
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
                            let nextMatchLength = 0
                            for (const suggestion of proofreadingResults) {
                              const regex = new RegExp(
                                suggestion.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                                "i"
                              )
                              const match = remainingText.match(regex)
                              if (match && match.index < minIndex) {
                                minIndex = match.index
                                nextMatchLength = match[0].length
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
          <div className="h-screen overflow-auto">
            {normalEditor && (
              <BubbleMenu
                editor={normalEditor}
                tippyOptions={{ duration: 100 }}
                className="flex gap-2 bg-white shadow-lg p-2 rounded border"
              >
                <Tooltip title="Bold" placement="top">
                  <button
                    onClick={() => {
                      safeEditorAction(() => {
                        normalEditor.chain().focus().toggleBold().run()
                        normalEditor.commands.blur()
                      })
                    }}
                  >
                    <Bold className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Italic" placement="top">
                  <button
                    onClick={() => {
                      safeEditorAction(() => {
                        normalEditor.chain().focus().toggleItalic().run()
                        normalEditor.commands.blur()
                      })
                    }}
                  >
                    <Italic className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Heading" placement="top">
                  <button
                    onClick={() => {
                      safeEditorAction(() => {
                        normalEditor.chain().focus().toggleHeading({ level: 2 }).run()
                        normalEditor.commands.blur()
                      })
                    }}
                  >
                    <Heading2 className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Link" placement="top">
                  <button onClick={handleAddLink}>
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip title="Rewrite" placement="top">
                  <button onClick={handleRewrite}>
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </Tooltip>
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
              onChange={(e) => setContent(e.target.value)}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className={`w-full h-full p-4 text-sm focus:outline-none resize-none bg-white code-textarea ${selectedFont}`}
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
              value={safeContent ? markdownToHtml(safeContent).replace(/>\s*</g, ">\n<") : ""}
              onChange={(e) => {
                const text = e.target.value
                const markdown = htmlToMarkdown(text)
                setContent(markdown)
              }}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="w-full h-full font-mono text-sm p-4 focus:outline-none resize-none bg-white code-textarea"
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
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
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
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
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
      <div className="flex border-b bg-white shadow-sm">
        {["Normal", "Markdown", "HTML"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`editor-tab ${activeTab === tab ? "active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* <div className="p-4 border bg-white border-gray-200">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter blog title..."
          className="w-full text-4xl font-bold bg-transparent border-none outline-none"
          maxLength={200}
        />
      </div> */}
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
    </motion.div>
  )
}

export default TextEditor
