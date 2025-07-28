import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
  Image as ImageIcon,
  Undo2,
  Redo2,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { marked } from "marked"
import TurndownService from "turndown"
import { updateBlogById } from "@store/slices/blogSlice"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { useProofreadingUI } from "@components/generateBlog/useProofreadingUI"
import { sendRetryLines } from "@api/blogApi"
import { Select, Tooltip, message, Modal, Input } from "antd"
import Loading from "@components/Loading"
import { htmlToText } from "html-to-text"
import TextArea from "antd/es/input/TextArea"

const FONT_OPTIONS = [
  { label: "Arial", value: "font-arial" },
  { label: "Georgia", value: "font-georgia" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
]

/**
 * TextEditor component for editing blog content in multiple modes.
 */
const TextEditor = ({
  blog,
  activeTab,
  setActiveTab,
  proofreadingResults,
  content,
  setContent,
  title,
  setTitle,
  isSavingKeyword,
  showPreview,
}) => {
  const [isEditorLoading, setIsEditorLoading] = useState(false)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 })
  const [isRetrying, setIsRetrying] = useState(false)
  const [markdownPreview, setMarkdownPreview] = useState(false)
  const [bubbleMenuVisible, setBubbleMenuVisible] = useState(false)
  const htmlEditorRef = useRef(null)
  const mdEditorRef = useRef(null)
  const editorContainerRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan

  const safeContent = content ?? ""

  // Initialize Tiptap editor with better configuration
  const normalEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        Link.configure({
          HTMLAttributes: {
            class: "text-blue-600 underline hover:text-blue-800 transition-colors",
          },
          openOnClick: false,
        }),
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg mx-auto my-4 max-w-[800px] w-full h-auto shadow-sm",
          },
        }),
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        ProofreadingDecoration.configure({ suggestions: proofreadingResults }),
      ],
      content: safeContent ? marked.parse(safeContent, { gfm: true }) : "<p></p>",
      onUpdate: ({ editor }) => {
        const turndownService = new TurndownService({
          strongDelimiter: "**",
          emDelimiter: "*",
          headingStyle: "atx",
        })
        const markdown = turndownService.turndown(editor.getHTML())
        setContent(markdown)
      },
      editorProps: {
        attributes: {
          class: `prose prose-lg max-w-none focus:outline-none p-6 ${selectedFont}`,
          style: "line-height: 1.7; font-size: 16px;",
        },
        handleDOMEvents: {
          blur: () => {
            setBubbleMenuVisible(false)
            return false
          },
        },
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection
        setBubbleMenuVisible(from !== to)
      },
      onCreate: ({ editor }) => {
        // Ensure editor is properly initialized
        editor.commands.focus("start")
      },
      onDestroy: () => {
        setBubbleMenuVisible(false)
      },
    },
    [selectedFont, proofreadingResults]
  )

  const { activeSpan, bubbleRef, applyChange, rejectChange } = useProofreadingUI(normalEditor)

  // Handle tab switch loading with better state management
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

  // Enhanced styles with better visual feedback
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.id = "text-editor-styles"
    styleElement.textContent = `
      .font-arial { font-family: 'Arial', -apple-system, BlinkMacSystemFont, sans-serif; }
      .font-georgia { font-family: 'Georgia', 'Times New Roman', serif; }
      .font-mono { font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; }
      .font-comic { font-family: "Comic Sans MS", cursive; }
      
      // .prose { 
      //   max-width: none !important; 
      //   color: #1f2937;
      // }
      
      // .prose h1 { 
      //   font-size: 2.25rem; 
      //   font-weight: 800; 
      //   margin: 1.5rem 0 1rem 0;
      //   color: #111827;
      //   // border-bottom: 3px solid #3b82f6;
      //   padding-bottom: 0.5rem;
      // }
      
      // .prose h2 { 
      //   font-size: 1.875rem; 
      //   font-weight: 700; 
      //   margin: 1.25rem 0 0.75rem 0;
      //   color: #1f2937;
      // }
      
      // .prose h3 { 
      //   font-size: 1.5rem; 
      //   font-weight: 600; 
      //   margin: 1rem 0 0.5rem 0;
      //   color: #374151;
      // }
      
      .prose ul, .prose ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }
      
      .prose li {
        margin: 0.5rem 0;
        line-height: 1.6;
      }
      
      .prose p {
        margin: 0.75rem 0;
        line-height: 1.7;
      }
      
      .prose a {
        color: #3b82f6;
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
        transition: all 0.2s ease;
      }
      
      .prose a:hover {
        color: #1d4ed8;
        text-decoration-thickness: 2px;
      }
      
      /* Enhanced toolbar styles */
      .p-2 rounded hover:bg-gray-100 duration-200  {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid transparent;
        background: white;
        color: #6b7280;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .p-2 rounded hover:bg-gray-100 duration-200 :hover {
        background: #f3f4f6;
        color: #374151;
        border-color: #d1d5db;
      }
      
      .p-2 rounded hover:bg-gray-100 duration-200 .active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      .p-2 rounded hover:bg-gray-100 duration-200 :disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* Bubble menu styles */
      .bubble-menu {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 0.25rem;
        display: flex;
        gap: 0.25rem;
        z-index: 50;
      }
      
      /* Proofreading styles */
      .suggestion-highlight {
        background-image: linear-gradient(to right, #ef4444, #ef4444);
        background-position: bottom;
        background-size: 100% 2px;
        background-repeat: repeat-x;
        display: inline;
        cursor: pointer;
      }
      
      .suggestion-tooltip {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 60;
        max-width: 300px;
        font-size: 0.875rem;
      }
      
      .editor-container {
        width: 100% !important;
        background: white;
      }
      
      /* Improved focus styles */
      .ProseMirror:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      /* Tab styles */
      .editor-tab {
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        border-bottom: 2px solid transparent;
        color: #6b7280;
        transition: all 0.2s ease;
        cursor: pointer;
        border-radius: 0.5rem 0.5rem 0 0;
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
      
      /* Improved textarea styles */
      .code-textarea {
        font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
        font-size: 14px;
        line-height: 1.5;
        border: none;
        outline: none;
        resize: none;
        background: #f8fafc;
        color: #1f2937;
        padding: 1.5rem;
        border-radius: 0.5rem;
      }
      
      .code-textarea:focus {
        background: white;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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

  // Update editor content with better error handling
  useEffect(() => {
    if (normalEditor && activeTab === "Normal" && !normalEditor.isDestroyed) {
      try {
        const htmlContent = safeContent ? marked.parse(safeContent, { gfm: true }) : "<p></p>"
        normalEditor.commands.setContent(htmlContent, false)
      } catch (error) {
        console.warn("Failed to update editor content:", error)
      }
    }
  }, [safeContent, activeTab, normalEditor])

  // Highlight code in HTML mode
  useEffect(() => {
    if (activeTab === "html" && !showPreview) {
      requestAnimationFrame(() => {
        Prism.highlightAll()
      })
    }
  }, [safeContent, activeTab, showPreview])

  /**
   * Checks if the user has a valid plan for editing.
   */
  const safeEditorAction = useCallback(
    (action) => {
      if (["free", "basic"].includes(userPlan?.toLowerCase())) {
        handlePopup({
          title: "Upgrade Required",
          description: "Editing is only available for Pro and Enterprise users.",
          confirmText: "Upgrade",
          onConfirm: () => navigate("/pricing"),
        })
        return
      }
      action()
    },
    [userPlan, handlePopup, navigate]
  )

  /**
   * Enhanced toolbar button handler with proper focus management
   */
  const handleToolbarAction = useCallback(
    (action, activeCheck = null) => {
      if (!normalEditor || normalEditor.isDestroyed) return

      safeEditorAction(() => {
        try {
          const { from, to } = normalEditor.state.selection
          action()
          // Maintain selection after action
          setTimeout(() => {
            if (normalEditor && !normalEditor.isDestroyed) {
              normalEditor.commands.setTextSelection({ from, to })
              normalEditor.commands.focus()
            }
          }, 10)
        } catch (error) {
          console.warn("Toolbar action failed:", error)
        }
      })
    },
    [normalEditor, safeEditorAction]
  )

  /**
   * Adds a link to selected text.
   */
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

  /**
   * Confirms and applies a link.
   */
  const handleConfirmLink = useCallback(() => {
    if (!linkUrl || !/https?:\/\//i.test(linkUrl)) {
      message.error("Enter a valid URL.")
      return
    }
    if (normalEditor) {
      normalEditor
        .chain()
        .focus()
        .setLink({ href: linkUrl, target: "_blank", rel: "noopener noreferrer" })
        .run()
      setLinkModalOpen(false)
      message.success("Link added.")
    }
  }, [linkUrl, normalEditor])

  /**
   * Inserts formatting tags into textarea with better cursor management.
   */
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

      // Better cursor positioning
      requestAnimationFrame(() => {
        const newPosition = start + before.length + selectedText.length
        textarea.setSelectionRange(newPosition, newPosition)
        textarea.focus()
      })
    },
    [setContent]
  )

  /**
   * Enhanced retry functionality
   */
  const handleRetry = useCallback(async () => {
    if (!blog?._id) {
      message.error("Blog ID missing.")
      return
    }

    let selectedText, from, to

    if (activeTab === "Normal") {
      if (!normalEditor) return message.error("Editor not initialized.")
      const selection = normalEditor.state.selection
      from = selection.from
      to = selection.to
      if (from === to) return message.error("Select text to retry.")
      selectedText = normalEditor.state.doc.textBetween(from, to, "\n")
    } else {
      const editorRef = activeTab === "Markdown" ? mdEditorRef : htmlEditorRef
      const textarea = editorRef.current
      if (!textarea) return message.error("Editor not initialized.")
      from = textarea.selectionStart
      to = textarea.selectionEnd
      if (from === to) return message.error("Select text to retry.")
      selectedText = textarea.value.substring(from, to)
    }

    setOriginalContent(selectedText)
    setSelectionRange({ from, to })

    try {
      setIsRetrying(true)
      const res = await sendRetryLines(blog._id, { text: selectedText })
      if (res.data) {
        setRetryContent(res.data)
        setRetryModalOpen(true)
      } else {
        message.error("No content received.")
      }
    } catch (err) {
      console.error("Retry failed:", err)
      message.error("Retry failed.")
    } finally {
      setIsRetrying(false)
    }
  }, [blog?._id, activeTab, normalEditor])

  /**
   * Accepts retry content with better handling
   */
  const handleAcceptRetry = useCallback(() => {
    if (!retryContent) return

    if (activeTab === "Normal" && normalEditor) {
      try {
        const parsedContent = marked.parse(retryContent, { gfm: true })
        normalEditor
          .chain()
          .focus()
          .deleteRange({ from: selectionRange.from, to: selectionRange.to })
          .insertContent(parsedContent)
          .run()
      } catch (error) {
        console.error("Failed to accept retry:", error)
        message.error("Failed to apply changes.")
      }
    } else {
      setContent((prev) => {
        return (
          prev.substring(0, selectionRange.from) + retryContent + prev.substring(selectionRange.to)
        )
      })
    }

    message.success("Text replaced!")
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
  }, [retryContent, activeTab, normalEditor, selectionRange, setContent])

  /**
   * Enhanced toolbar with better visual feedback
   */
  const renderToolbar = () => (
    <div>
      <div className="p-4 border bg-white border-gray-200">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter blog title..."
          className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden leading-tight"
          maxLength={200}
          disabled={isSavingKeyword}
          rows={1}
        />
      </div>
      <div className="flex flex-wrap gap-2 p-4 py-2 border bg-white border-gray-200 border-y-0 items-center shadow-sm">
        {/* Heading Buttons */}
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => (
            <Tooltip key={level} title={`Heading ${level}`}>
              <button
                onClick={() =>
                  handleToolbarAction(
                    () => normalEditor.chain().focus().toggleHeading({ level }).run(),
                    () => normalEditor?.isActive("heading", { level })
                  )
                }
                className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                  activeTab === "Normal" && normalEditor?.isActive("heading", { level })
                    ? "active"
                    : ""
                }`}
              >
                {level === 1 && <Heading1 className="w-4 h-4" />}
                {level === 2 && <Heading2 className="w-4 h-4" />}
                {level === 3 && <Heading3 className="w-4 h-4" />}
              </button>
            </Tooltip>
          ))}

          <div className="h-6 w-px bg-gray-300 mx-2" />
        </div>

        {/* Formatting Buttons */}
        <div className="flex gap-1">
          <Tooltip title="Bold">
            <button
              onClick={() => {
                if (activeTab === "Normal") {
                  handleToolbarAction(() => normalEditor.chain().focus().toggleBold().run())
                } else if (activeTab === "html") {
                  insertText("<strong>", "</strong>", htmlEditorRef)
                } else {
                  insertText("**", "**", mdEditorRef)
                }
              }}
              className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                activeTab === "Normal" && normalEditor?.isActive("bold") ? "active" : ""
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip title="Italic">
            <button
              onClick={() => {
                if (activeTab === "Normal") {
                  handleToolbarAction(() => normalEditor.chain().focus().toggleItalic().run())
                } else if (activeTab === "html") {
                  insertText("<em>", "</em>", htmlEditorRef)
                } else {
                  insertText("*", "*", mdEditorRef)
                }
              }}
              className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                activeTab === "Normal" && normalEditor?.isActive("italic") ? "active" : ""
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip title="Underline">
            <button
              onClick={() => {
                if (activeTab === "Normal") {
                  handleToolbarAction(() => normalEditor.chain().focus().toggleUnderline().run())
                } else if (activeTab === "html") {
                  insertText("<u>", "</u>", htmlEditorRef)
                } else {
                  insertText("<u>", "</u>", mdEditorRef)
                }
              }}
              className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                activeTab === "Normal" && normalEditor?.isActive("underline") ? "active" : ""
              }`}
            >
              <IconUnderline className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="h-6 w-px bg-gray-300 mx-2" />
        </div>

        {/* Alignment Buttons */}
        <div className="flex gap-1">
          {["left", "center", "right"].map((align) => (
            <Tooltip key={align} title={`Align ${align}`}>
              <button
                onClick={() => {
                  if (activeTab === "Normal") {
                    handleToolbarAction(() =>
                      normalEditor.chain().focus().setTextAlign(align).run()
                    )
                  } else {
                    insertText(
                      `<div style="text-align: ${align};">`,
                      "</div>",
                      activeTab === "html" ? htmlEditorRef : mdEditorRef
                    )
                  }
                }}
                className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                  activeTab === "Normal" && normalEditor?.isActive({ textAlign: align })
                    ? "active"
                    : ""
                }`}
              >
                {align === "left" && <AlignLeft className="w-4 h-4" />}
                {align === "center" && <AlignCenter className="w-4 h-4" />}
                {align === "right" && <AlignRight className="w-4 h-4" />}
              </button>
            </Tooltip>
          ))}

          <div className="h-6 w-px bg-gray-300 mx-2" />
        </div>

        {/* List Buttons */}
        <div className="flex gap-1">
          <Tooltip title="Bullet List">
            <button
              onClick={() => {
                if (activeTab === "Normal") {
                  handleToolbarAction(() => normalEditor.chain().focus().toggleBulletList().run())
                } else if (activeTab === "html") {
                  insertText("<ul>\n<li>", "</li>\n</ul>", htmlEditorRef)
                } else {
                  insertText("- ", "", mdEditorRef)
                }
              }}
              className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                activeTab === "Normal" && normalEditor?.isActive("bulletList") ? "active" : ""
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip title="Ordered List">
            <button
              onClick={() => {
                if (activeTab === "Normal") {
                  handleToolbarAction(() => normalEditor.chain().focus().toggleOrderedList().run())
                } else if (activeTab === "html") {
                  insertText("<ol>\n<li>", "</li>\n</ol>", htmlEditorRef)
                } else {
                  insertText("1. ", "", mdEditorRef)
                }
              }}
              className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                activeTab === "Normal" && normalEditor?.isActive("orderedList") ? "active" : ""
              }`}
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="h-6 w-px bg-gray-300 mx-2" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Tooltip title="Link">
            <button onClick={handleAddLink} className="p-2 rounded hover:bg-gray-100 duration-200 ">
              <LinkIcon className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip title="Undo">
            <button
              onClick={() => handleToolbarAction(() => normalEditor?.chain().focus().undo().run())}
              className="p-2 rounded hover:bg-gray-100 duration-200 "
              disabled={!normalEditor?.can().undo()}
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip title="Redo">
            <button
              onClick={() => handleToolbarAction(() => normalEditor?.chain().focus().redo().run())}
              className="p-2 rounded hover:bg-gray-100 duration-200 "
              disabled={!normalEditor?.can().redo()}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* <Tooltip title="Clear Formatting">
            <button
              onClick={() => {
                if (activeTab === "Normal") {
                  handleToolbarAction(() =>
                    normalEditor.chain().focus().clearNodes().unsetAllMarks().run()
                  )
                } else {
                  setContent(htmlToText(safeContent, { wordwrap: false }))
                }
              }}
              className="p-2 rounded hover:bg-gray-100 duration-200 "
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip title="Retry Selected Text">
            <button
              onClick={handleRetry}
              className={`p-2 rounded hover:bg-gray-100 duration-200  ${isRetrying ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isRetrying}
            >
              <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            </button>
          </Tooltip> */}
        </div>

        {/* Font Selector */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedFont}
            onChange={(value) => safeEditorAction(() => setSelectedFont(value))}
            className="w-40"
          >
            {FONT_OPTIONS.map((font) => (
              <Option key={font.value} value={font.value}>
                {font.label}
              </Option>
            ))}
          </Select>
        </div>

        {/* Preview Toggle for Markdown/HTML */}
        {(activeTab === "Markdown" || activeTab === "html") && (
          <>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <Tooltip title={showPreview ? "Hide Preview" : "Show Preview"}>
              <button
                onClick={() => setMarkdownPreview(!markdownPreview)}
                className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                  showPreview ? "active" : ""
                }`}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  )

  /**
   * Renders the content area based on active tab.
   */
  const renderContentArea = () => {
    if (isEditorLoading || blog?.status === "pending") {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border rounded-lg">
          <Loading />
        </div>
      )
    }

    if (showPreview && (activeTab === "Markdown" || activeTab === "html")) {
      return (
        <div className={`p-8 rounded-lg rounded-t-none overflow-y-auto bg-white ${selectedFont}`}>
          <h1 className="text-3xl font-bold mb-6 text-gray-900">{title || "Untitled"}</h1>
          <div className="max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline transition-colors"
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
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              }}
            >
              {safeContent}
            </ReactMarkdown>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white border rounded-lg rounded-t-none h-screen overflow-auto shadow-sm">
        {/* Editor Content */}
        <div ref={editorContainerRef}>
          {activeTab === "Normal" && (
            <>
              <EditorContent editor={normalEditor} />

              {/* Enhanced Bubble Menu */}
              {normalEditor && !normalEditor.isDestroyed && bubbleMenuVisible && (
                <BubbleMenu
                  editor={normalEditor}
                  tippyOptions={{
                    duration: 200,
                    placement: "top",
                    hideOnClick: false,
                    interactive: true,
                    maxWidth: "none",
                  }}
                  className="bubble-menu"
                  shouldShow={({ editor, view, state, oldState }) => {
                    const { from, to } = state.selection
                    return from !== to
                  }}
                >
                  <button
                    onClick={() => normalEditor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                      normalEditor.isActive("bold") ? "active" : ""
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => normalEditor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                      normalEditor.isActive("italic") ? "active" : ""
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => normalEditor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                      normalEditor.isActive("underline") ? "active" : ""
                    }`}
                    title="Underline"
                  >
                    <IconUnderline className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  <button
                    onClick={handleAddLink}
                    className="p-2 rounded hover:bg-gray-100 duration-200 "
                    title="Add Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRetry}
                    className={`p-2 rounded hover:bg-gray-100 duration-200  ${
                      isRetrying ? "opacity-50" : ""
                    }`}
                    disabled={isRetrying}
                    title="Retry with AI"
                  >
                    <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
                  </button>
                </BubbleMenu>
              )}
            </>
          )}

          {activeTab === "Markdown" && (
            <div className="flex">
              <div className="w-1/2 border-r border-gray-200">
                <textarea
                  ref={mdEditorRef}
                  value={safeContent}
                  onChange={(e) => setContent(e.target.value)}
                  className={`code-textarea w-full h-full resize-none ${selectedFont}`}
                  placeholder="Write your Markdown content here..."
                  style={{ minHeight: "100%" }}
                />
              </div>
              <div className={`w-1/2 p-6 overflow-y-auto bg-gray-50 ${selectedFont}`}>
                <div className="prose prose-sm max-w-none">
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
                          className="rounded-lg mx-auto my-4 max-w-full h-auto"
                        />
                      ),
                    }}
                  >
                    {safeContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {activeTab === "html" && (
            <div className="h-screen">
              <textarea
                ref={htmlEditorRef}
                value={safeContent ? marked.parse(safeContent, { gfm: true }) : ""}
                onChange={(e) => {
                  const turndownService = new TurndownService({
                    strongDelimiter: "**",
                    emDelimiter: "*",
                  })
                  setContent(turndownService.turndown(e.target.value))
                }}
                className="code-textarea w-full h-full resize-none"
                placeholder="Write your HTML content here..."
                style={{ minHeight: "100%" }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Enhanced Tabs */}
      <div className="flex border-b bg-white shadow-sm">
        {["Normal", "Markdown", "html"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`editor-tab ${activeTab === tab ? "active" : ""}`}
          >
            <span className="flex items-center gap-2">
              {tab === "Normal" && <FileText className="w-4 h-4" />}
              {tab === "Markdown" && <FileText className="w-4 h-4" />}
              {tab === "html" && <FileText className="w-4 h-4" />}
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* Enhanced Toolbar */}
      {renderToolbar()}

      {/* Content Area */}
      {renderContentArea()}

      {/* Enhanced Link Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <span>Insert Link</span>
          </div>
        }
        open={linkModalOpen}
        onOk={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
        okText="Insert Link"
        cancelText="Cancel"
        centered
        className="link-modal"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full"
            prefix={<LinkIcon className="w-4 h-4 text-gray-400" />}
          />
          <p className="mt-2 text-xs text-gray-500">Make sure to include http:// or https://</p>
        </div>
      </Modal>

      {/* Enhanced Retry Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <span>AI Content Suggestion</span>
          </div>
        }
        open={retryModalOpen}
        onOk={handleAcceptRetry}
        onCancel={() => {
          setRetryModalOpen(false)
          setRetryContent(null)
          setOriginalContent(null)
          message.info("Changes discarded.")
        }}
        okText="Accept Changes"
        cancelText="Keep Original"
        centered
        width={800}
        className="retry-modal"
      >
        <div className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Original Content
            </label>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm leading-relaxed">
              {originalContent}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-blue-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              AI Suggested Content
            </label>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-green-800">{children}</strong>
                    ),
                  }}
                >
                  {retryContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Enhanced Proofreading Bubble */}
      {activeSpan && (
        <div ref={bubbleRef} className="suggestion-tooltip fixed" style={{ zIndex: 70 }}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Original:</p>
              <p className="text-sm text-gray-800 bg-red-50 p-2 rounded border">
                {activeSpan.original}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Suggestion:</p>
              <p className="text-sm text-gray-800 bg-green-50 p-2 rounded border">
                {activeSpan.change}
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => applyChange(activeSpan.original, activeSpan.change)}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => rejectChange(activeSpan.original)}
                className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors font-medium"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default TextEditor
