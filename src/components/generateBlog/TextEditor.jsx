import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { motion } from "framer-motion"
import AnimatedContent from "./AnimatedContent"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import {
  Eye,
  EyeOff,
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
  Undo2,
  Redo2,
  RotateCcw,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { marked } from "marked"
import TurndownService from "turndown"
import SmallBottomBox from "@components/toolbox/SmallBottomBox"
import { fetchBlogById, updateBlogById } from "@store/slices/blogSlice"
import { toast } from "react-toastify"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { useProofreadingUI } from "@components/generateBlog/useProofreadingUI"
import { sendRetryLines } from "@api/blogApi"
import { Helmet } from "react-helmet"
import { Tooltip } from "antd"
import Loading from "@components/Loading"

const FONT_OPTIONS = [
  { label: "Inter", value: "font-sans" },
  { label: "Serif", value: "font-serif" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
]

const TextEditor = ({
  blog,
  activeTab,
  keywords,
  setKeywords,
  proofreadingResults,
  handleReplace,
  content,
  setContent,
  isSavingKeyword,
}) => {
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [selectionPosition, setSelectionPosition] = useState(null)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null)
  const htmlEditorRef = useRef(null)
  const mdEditorRef = useRef(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const hasInitializedRef = useRef(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 })
  const { handlePopup } = useConfirmPopup()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const hasShownToast = useRef(false)

  const AI_MODELS = [
    { id: "gemini", name: "Gemini", icon: "" },
    { id: "openai", name: "OpenAI", icon: "" },
  ]

  const safeContent = content ?? ""

  useEffect(() => {
    if (blog?.status === "failed" && !hasShownToast.current) {
      toast.error("Your blog generation failed. You can write blog manually.")
      hasShownToast.current = true
    }
  }, [blog?.status])

  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      .font-comic { font-family: "Comic Sans MS", cursive; }
      .prose { max-width: none !important; }
      .suggestion-highlight { 
        position: relative; 
        text-decoration: none; 
        background-image: linear-gradient(to right, red, red);
        background-position: bottom;
        background-size: 100% 2px;
        background-repeat: repeat-x;
        display: inline;
      }
      .suggestion-highlight:hover::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -2px;
        height: 2px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 2' preserveAspectRatio='none'%3E%3Cpolyline points='0,0 5,2 10,0' style='fill:none;stroke:red;stroke-width:1'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
      }
      .suggestion-tooltip {
        position: absolute;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
      content: safeContent ? marked.parse(safeContent, { gfm: true }) : "<p></p>",
      onUpdate: ({ editor }) => {
        const turndownService = new TurndownService({
          strongDelimiter: "**",
        })
        const markdown = turndownService.turndown(editor.getHTML())
        setContent(markdown)
      },
      editorProps: {
        attributes: {
          class: `prose max-w-none focus:outline-none p-4 min-h-[400px] opacity-100 ${selectedFont} blog-content`,
        },
      },
    },
    [activeTab, selectedFont]
  )

  const { activeSpan, bubbleRef, applyChange, rejectChange } = useProofreadingUI(normalEditor)

  useLayoutEffect(() => {
    if (activeSpan instanceof HTMLElement && bubbleRef.current) {
      const spanRect = activeSpan.getBoundingClientRect()
      const bubbleHeight = bubbleRef.current.offsetHeight

      const top = spanRect.top + window.scrollY - bubbleHeight - 8 // show above
      const left = spanRect.left + window.scrollX

      setBubblePos({ top, left })
    }
  }, [activeSpan])

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
    const initialContent = blog?.content ?? ""
    setContent(initialContent)

    if (normalEditor && !normalEditor.isDestroyed && activeTab === "normal") {
      const htmlContent = initialContent ? marked.parse(initialContent, { gfm: true }) : "<p></p>"
      normalEditor.commands.setContent(htmlContent)
    }

    setShowPreview(false)

    if (initialContent && !hasAnimated && !hasInitializedRef.current) {
      setIsAnimating(true)
      hasInitializedRef.current = true
    } else {
      setIsAnimating(false)
    }
  }, [blog, normalEditor, activeTab, setContent])

  useEffect(() => {
    if (activeTab === "html" && !showPreview) {
      Prism.highlightAll()
    }
  }, [safeContent, activeTab, showPreview])

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
      onConfirm: () => navigate("/upgrade"),
    })
  }

  const safeEditorAction = (action) => {
    if (userPlan === "free" || userPlan === "basic") {
      showUpgradePopup()
      return
    }
    action()
  }

  const handleSave = async () => {
    if (userPlan === "free" || userPlan === "basic") {
      showUpgradePopup()
      return
    }

    setIsSaving(true)

    try {
      const response = await dispatch(
        updateBlogById(blog._id, {
          title: blog?.title,
          content: safeContent,
          published: blog?.published,
          focusKeywords: blog?.focusKeywords,
          keywords,
        })
      )

      if (response.data?.content) {
        const updated = await dispatch(fetchBlogById(blog._id))
        const payload = updated?.payload
        if (payload) {
          setContent(payload.content ?? "")
          setKeywords(payload.keywords ?? [])
        }
        toast.success("Blog updated successfully")
      }
    } catch (error) {
      console.error("Error updating the blog:", error)
      toast.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnimationComplete = () => {
    setIsAnimating(false)
    setHasAnimated(true)
    if (blog?.content) setContent(blog.content)
  }

  const insertText = (before, after, editorRef) => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const newText = `${before}${selectedText}${after}`

    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end)
    setContent(newValue)

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + before.length + selectedText.length
      textarea.focus()
    }, 0)
  }

  const handleTextSelection = (e) => {
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
  }

  const handleRetry = async () => {
    if (!blog?._id) {
      toast.error("Blog ID is missing.")
      return
    }

    if (!normalEditor) {
      toast.error("Editor is not initialized.")
      return
    }

    const { from, to } = normalEditor.state.selection

    if (from === to) {
      toast.error("Please select some text to retry.")
      return
    }

    const selectedText = normalEditor.state.doc.textBetween(from, to, "\n")

    const payload = {
      contentPart: selectedText.trim(),
    }

    if (normalEditor) {
      normalEditor.commands.blur()
      normalEditor.commands.setTextSelection(0)
    }

    try {
      setIsRetrying(true)
      const res = await sendRetryLines(blog._id, payload)

      if (res.data) {
        setRetryContent(res.data)
        setRetryModalOpen(true)
      } else {
        toast.error("No content received from retry.")
      }
    } catch (error) {
      console.error("Retry failed:", error)
      toast.error(error.message || "Retry failed.")
    } finally {
      setIsRetrying(false)
    }
  }

  const handleAcceptRetry = () => {
    if (retryContent && normalEditor && activeTab === "normal") {
      const parsedContent = marked.parse(retryContent, { gfm: true })
      normalEditor
        .chain()
        .focus()
        .deleteRange({
          from: normalEditor.state.selection.from,
          to: normalEditor.state.selection.to,
        })
        .insertContent(parsedContent)
        .run()
      toast.success("Selected lines replaced successfully!")
    } else if (retryContent) {
      // For markdown/html modes, insert raw Markdown
      setContent((prev) => {
        const { from, to } = normalEditor?.state.selection || { from: 0, to: 0 }
        return prev.substring(0, from) + retryContent + prev.substring(to)
      })
      toast.success("Selected lines replaced successfully!")
    }
    setRetryModalOpen(false)
    setRetryContent(null)
  }

  const handleRejectRetry = () => {
    setRetryModalOpen(false)
    setRetryContent(null)
    toast.info("Retry content discarded.")
  }

  const FloatingToolbar = ({ editorRef, mode }) => {
    if (!selectionPosition || !editorRef.current) return null

    const formatActions = {
      markdown: [
        {
          icon: <Bold className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText("**", "**", editorRef)),
        },
        {
          icon: <Italic className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText("*", "*", editorRef)),
        },
        {
          icon: <LinkIcon className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText("[", "](url)", editorRef)),
        },
        {
          icon: <ImageIcon className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText("![alt](", ")", editorRef)),
        },
      ],
      html: [
        {
          icon: <Bold className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText("<strong>", "</strong>", editorRef)),
        },
        {
          icon: <Italic className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText("<em>", "</em>", editorRef)),
        },
        {
          icon: <LinkIcon className="w-5 h-5" />,
          action: () => safeEditorAction(() => insertText('<a href="url">', "</a>", editorRef)),
        },
        {
          icon: <ImageIcon className="w-5 h-5" />,
          action: () =>
            safeEditorAction(() => insertText('<img src="', '" alt="description" />', editorRef)),
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
          <button key={index} onClick={action.action}>
            {action.icon}
          </button>
        ))}
      </motion.div>
    )
  }

  const FontDropdown = () => (
    <select
      value={selectedFont}
      onChange={(e) => {
        if (userPlan === "free" || userPlan === "basic") {
          showUpgradePopup()
          return
        }
        setSelectedFont(e.target.value)
      }}
      className="p-2 rounded border bg-white hover:bg-gray-100"
    >
      {FONT_OPTIONS.map((font) => (
        <option key={font.value} value={font.value}>
          {font.label}
        </option>
      ))}
    </select>
  )

  const ModelDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button className="flex items-center gap-2 font-bold mr-4 hover:bg-gray-100 p-2 rounded">
        GenWrite
      </button>
    </div>
  )

  const ModelDropdown1 = () => (
    <div className="relative" ref={dropdownRef}>
      <button className="flex capitalize items-center gap-2 font-semibold mr-4 hover:bg-gray-100 p-2 rounded">
        {blog?.aiModel?.toLowerCase() === "gemini" ? (
          <span className="flex items-center gap-2">
            Gemini
            <img src="/Images/gemini.png" alt="gemini" className="w-5" />
          </span>
        ) : (
          <span className="flex items-center gap-2">
            ChatGPT
            <img src="/Images/chatgpt.png" alt="chatgpt" className="w-5" />
          </span>
        )}
      </button>
    </div>
  )

  const renderToolbar = () => (
    <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50 items-center">
      <ModelDropdown />
      <ModelDropdown1 />
      <FontDropdown />
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          onClick={() =>
            safeEditorAction(() => {
              if (activeTab === "normal") {
                normalEditor.chain().focus().toggleHeading({ level }).run()
              } else if (activeTab === "html") {
                insertText(`<h${level}>`, `</h${level}>`, htmlEditorRef)
              } else {
                insertText(`${"#".repeat(level)} `, "", mdEditorRef)
              }
            })
          }
          className={`p-2 rounded hover:bg-gray-100 ${
            activeTab === "normal" && normalEditor?.isActive("heading", { level })
              ? "bg-gray-200"
              : ""
          }`}
        >
          {level === 1 && <Heading1 className="w-5 h-5" />}
          {level === 2 && <Heading2 className="w-5 h-5" />}
          {level === 3 && <Heading3 className="w-5 h-5" />}
        </button>
      ))}
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().toggleBold().run()
            } else if (activeTab === "html") {
              insertText("<strong>", "</strong>", htmlEditorRef)
            } else {
              insertText("**", "**", mdEditorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("bold") ? "bg-gray-200" : ""
        }`}
      >
        <Bold className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().toggleItalic().run()
            } else if (activeTab === "html") {
              insertText("<em>", "</em>", htmlEditorRef)
            } else {
              insertText("*", "*", mdEditorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("italic") ? "bg-gray-200" : ""
        }`}
      >
        <Italic className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().setTextAlign("left").run()
            } else {
              const editorRef = activeTab === "html" ? htmlEditorRef : mdEditorRef
              insertText('<div style="text-align: left;">', "</div>", editorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive({ textAlign: "left" })
            ? "bg-gray-200"
            : ""
        }`}
      >
        <AlignLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().setTextAlign("center").run()
            } else {
              const editorRef = activeTab === "html" ? htmlEditorRef : mdEditorRef
              insertText('<div style="text-align: center;">', "</div>", editorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive({ textAlign: "center" })
            ? "bg-gray-200"
            : ""
        }`}
      >
        <AlignCenter className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().setTextAlign("right").run()
            } else {
              const editorRef = activeTab === "html" ? htmlEditorRef : mdEditorRef
              insertText('<div style="text-align: right;">', "</div>", editorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive({ textAlign: "right" })
            ? "bg-gray-200"
            : ""
        }`}
      >
        <AlignRight className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().toggleBulletList().run()
            } else if (activeTab === "html") {
              insertText("<ul>\n<li>", "</li>\n</ul>", htmlEditorRef)
            } else {
              insertText("- ", "", mdEditorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("bulletList") ? "bg-gray-200" : ""
        }`}
      >
        <List className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            if (activeTab === "normal") {
              normalEditor.chain().focus().toggleOrderedList().run()
            } else if (activeTab === "html") {
              insertText("<ol>\n<li>", "</li>\n</ol>", htmlEditorRef)
            } else {
              insertText("1. ", "", mdEditorRef)
            }
          })
        }
        className={`p-2 rounded hover:bg-gray-100 ${
          activeTab === "normal" && normalEditor?.isActive("orderedList") ? "bg-gray-200" : ""
        }`}
      >
        <ListOrdered className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            const url = prompt("Enter URL")
            if (url) {
              if (activeTab === "normal") {
                normalEditor.chain().focus().setLink({ href: url }).run()
              } else if (activeTab === "html") {
                insertText(`<a href="${url}">`, "</a>", htmlEditorRef)
              } else {
                insertText("[", `](${url})`, mdEditorRef)
              }
            }
          })
        }
        className="p-2 rounded hover:bg-gray-100"
      >
        <LinkIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          safeEditorAction(() => {
            const url = prompt("Enter Image URL")
            if (url) {
              if (activeTab === "normal") {
                normalEditor.chain().focus().setImage({ src: url }).run()
              } else if (activeTab === "html") {
                insertText(
                  `<img src="${url}" alt="description" class="max-w-full my-4 rounded-lg mx-auto" />`,
                  "",
                  htmlEditorRef
                )
              } else {
                insertText(`![Image](${url})`, "", mdEditorRef)
              }
            }
          })
        }
        className="p-2 rounded hover:bg-gray-100"
      >
        <ImageIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => safeEditorAction(() => normalEditor?.chain().focus().undo().run())}
        className="p-2 rounded hover:bg-gray-100"
      >
        <Undo2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => safeEditorAction(() => normalEditor?.chain().focus().redo().run())}
        className="p-2 rounded hover:bg-gray-100"
      >
        <Redo2 className="w-5 h-5" />
      </button>
      <SmallBottomBox id={blog?._id} />
    </div>
  )

  const renderContentArea = () => {
    if (!editorReady) return <div className="h-[calc(100vh-200px)] p-4">Loading editor...</div>

    if (isAnimating && blog?.content) {
      return (
        <div className="h-[calc(100vh-200px)] p-4 overflow-y-auto bg-white">
          <AnimatedContent content={blog.content} onComplete={handleAnimationComplete} />
        </div>
      )
    }

    if (showPreview && (activeTab === "markdown" || activeTab === "html")) {
      return (
        <div
          className={`h-[calc(100vh-200px)] p-6 border rounded-md overflow-y-auto bg-white ${selectedFont}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl lg:text-4xl font-bold text-center my-8" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl lg:text-3xl font-bold mt-10 mb-4" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl lg:text-2xl font-bold mt-8 mb-3" {...props} />
              ),
              p: ({ node, children, ...props }) => {
                const textContent = React.Children.toArray(children)
                  .map((child) => (typeof child === "string" ? child : ""))
                  .join("")
                return (
                  <p className="my-4 leading-relaxed" {...props}>
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
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-4" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-4" {...props} />,
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              a: ({ node, href, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              img: ({ node, ...props }) => (
                <img
                  className="max-w-sm mx-auto my-6 rounded-md shadow-md"
                  alt={props.alt || ""}
                  {...props}
                />
              ),
            }}
          >
            {safeContent}
          </ReactMarkdown>
        </div>
      )
    }

    const handleRewrite = () => {
      if (userPlan === "free" || userPlan === "basic") {
        handlePopup({
          title: "Upgrade Required",
          description: "Rewrite is only available for Pro and Enterprise users.",
          confirmText: "Buy Now",
          cancelText: "Cancel",
          onConfirm: () => navigate("/upgrade"),
        })
      } else {
        handlePopup({
          title: "Rewrite Selected Lines.",
          description: "Do you want to rewrite the selected lines? You can rewrite only 3 times.",
          onConfirm: handleRetry,
        })
      }
    }

    switch (activeTab) {
      case "normal":
        return (
          <div className="h-[calc(100vh-300px)] overflow-y-auto bg-white border rounded-lg">
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
                  zIndex: 50,
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

      case "markdown":
        return (
          <div className="h-[calc(100vh-300px)] overflow-y-auto bg-white border rounded-lg relative">
            <textarea
              ref={mdEditorRef}
              value={safeContent}
              onChange={(e) => setContent(e.target.value)}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className={`w-full h-full p-4 text-sm focus:outline-none resize-none bg-white ${selectedFont}`}
              placeholder="Enter Markdown here..."
            />
            <FloatingToolbar editorRef={mdEditorRef} mode="markdown" />
          </div>
        )

      case "html":
        return (
          <div className="h-[calc(100vh-300px)] overflow-y-auto bg-white border rounded-lg relative">
            <textarea
              ref={htmlEditorRef}
              value={safeContent ? marked.parse(safeContent).replace(/>(\s*)</g, ">\n<") : ""}
              onChange={(e) => {
                const text = e.target.value
                const turndownService = new TurndownService()
                const markdown = turndownService.turndown(text)
                setContent(markdown)
              }}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="w-full h-full font-mono text-sm p-4 focus:outline-none resize-none bg-white text-black"
              placeholder="<h1>HTML Title</h1>\n<p>Paragraph with <a href='https://example.com'>link</a></p>\n<img src='image.jpg' alt='description' />"
              style={{ whiteSpace: "pre-wrap" }}
            />
            <FloatingToolbar editorRef={htmlEditorRef} mode="html" />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex-grow p-4 relative -top-16">
      {retryModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
            <div className="p-4 bg-gray-50 rounded-md mb-4">
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
            <div className="flex justify-end gap-2">
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

      {(isRetrying || isSavingKeyword) && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loading />
        </motion.div>
      )}

      <Helmet>
        <title>Blog Editor | GenWrite</title>
      </Helmet>
      <div className="flex justify-end pr-10 items-center mb-4">
        {(activeTab === "markdown" || activeTab === "html") && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center px-3 py-1.5 rounded-md text-base font-medium mr-4 transition-colors focus:outline-none ${
              showPreview
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {showPreview ? (
              <EyeOff className="w-5 h-5 mr-1.5" />
            ) : (
              <Eye className="w-5 h-5 mr-1.5" />
            )}
            {showPreview ? "Editor" : "Preview"}
          </button>
        )}
        <motion.button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving || isAnimating}
        >
          {isSaving ? (
            <motion.span
              className="inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⟳
            </motion.span>
          ) : (
            "Save"
          )}
        </motion.button>
      </div>
      {renderToolbar()}
      {renderContentArea()}
    </div>
  )
}

export default TextEditor
