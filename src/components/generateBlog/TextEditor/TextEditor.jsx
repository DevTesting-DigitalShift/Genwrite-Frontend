import React, { useState, useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { useProofreadingUI } from "../useProofreadingUI"
import { sendRetryLines } from "@api/blogApi"
import { retryBlog } from "@store/slices/blogSlice"
import { Modal, message } from "antd"
import { marked } from "marked"
import TurndownService from "turndown"
import Loading from "@components/Loading"
import Toolbar from "./EditorToolbar"
import EditorContentArea from "./EditorModals"

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
  const [editImageModalOpen, setEditImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [markdownPreview, setMarkdownPreview] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 })
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [tabSwitchWarning, setTabSwitchWarning] = useState(null)
  const [htmlContent, setHtmlContent] = useState("")
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.subscription?.plan
  const hasShownToast = useRef(false)
  const location = useLocation()
  const dispatch = useDispatch()
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`

  const safeContent = content ?? blog?.content ?? ""

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
      content: safeContent ? marked.parse(safeContent, { gfm: true }) : "<p></p>",
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
    [selectedFont, proofreadingResults, setContent]
  )

  const { activeSpan, bubbleRef, applyChange, rejectChange } = useProofreadingUI(normalEditor)

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
      .editor-container h1 { font-size: 1.5rem; }
      .editor-container h2 { font-size: 1.25rem; }
      .editor-container h3 { font-size: 1rem; }
      .editor-container ul, .editor-container ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }
      .editor-container ul { list-style-type: disc; }
      .editor-container ol { list-style-type: decimal; }
      .editor-container li { margin: 0.5rem 0; }
      .editor-container p { color: #374151; }
      .editor-container strong { font-weight: bold; color: #1f2937; }
      .editor-container em { font-style: italic; }
      .editor-container a { color: #2563eb; text-decoration: underline; position: relative; }
      .editor-container a:hover { color: #1d4ed8; }
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
      .editor-tab:hover { color: #3b82f6; background: #f8fafc; }
      .editor-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; background: white; }
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
    if (activeTab === "HTML") {
      setHtmlContent(markdownToHtml(safeContent).replace(/>\s*</g, ">\n<"))
    }
  }, [safeContent, activeTab, markdownToHtml])

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
        onConfirm: async () => {
          if (!blog?._id) {
            message.error("Blog ID is missing.")
            return
          }
          const payload = { createNew: true }
          try {
            await dispatch(retryBlog({ id: blog._id, payload }))
            navigate("/blogs")
          } catch (error) {
            console.error("Retry failed:", error)
            message.error(error.message || "Retry failed.")
          }
        },
      })
    }
  }

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
    const payload = { contentPart: selectedText.trim() }
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
      <Toolbar
        activeTab={activeTab}
        normalEditor={normalEditor}
        safeEditorAction={safeEditorAction}
        handleAddLink={handleAddLink}
        handleAddImage={handleAddImage}
        handleRegenerate={handleRegenerate}
        handleRetry={handleRetry}
        safeContent={safeContent}
        htmlContent={htmlContent}
        setContent={setContent}
        setUnsavedChanges={setUnsavedChanges}
        pathDetect={pathDetect}
        fileInputRef={fileInputRef}
        selectedFont={selectedFont}
        setSelectedFont={setSelectedFont}
        markdownPreview={markdownPreview}
        setMarkdownPreview={setMarkdownPreview}
      />
      <EditorContentArea
        activeTab={activeTab}
        normalEditor={normalEditor}
        safeContent={safeContent}
        htmlContent={htmlContent}
        setContent={setContent}
        setHtmlContent={setHtmlContent}
        setUnsavedChanges={setUnsavedChanges}
        proofreadingResults={proofreadingResults}
        handleReplace={handleReplace}
        isEditorLoading={isEditorLoading}
        editorReady={editorReady}
        blog={blog}
        humanizedContent={humanizedContent}
        showDiff={showDiff}
        handleAcceptHumanizedContent={handleAcceptHumanizedContent}
        handleAcceptOriginalContent={handleAcceptOriginalContent}
        editorContent={editorContent}
        markdownPreview={markdownPreview}
        selectedFont={selectedFont}
        linkModalOpen={linkModalOpen}
        setLinkModalOpen={setLinkModalOpen}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        imageModalOpen={imageModalOpen}
        setImageModalOpen={setImageModalOpen}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        imageAlt={imageAlt}
        setImageAlt={setImageAlt}
        editImageModalOpen={editImageModalOpen}
        setEditImageModalOpen={setEditImageModalOpen}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        retryModalOpen={retryModalOpen}
        setRetryModalOpen={setRetryModalOpen}
        originalContent={originalContent}
        setOriginalContent={setOriginalContent}
        retryContent={retryContent}
        setRetryContent={setRetryContent}
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        tabSwitchWarning={tabSwitchWarning}
        setTabSwitchWarning={setTabSwitchWarning}
        markdownToHtml={markdownToHtml}
        htmlToMarkdown={htmlToMarkdown}
        activeSpan={activeSpan}
        bubbleRef={bubbleRef}
        applyChange={applyChange}
        rejectChange={rejectChange}
      />
    </motion.div>
  )
}

export default TextEditor
