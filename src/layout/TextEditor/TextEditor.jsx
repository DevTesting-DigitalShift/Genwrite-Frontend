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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RotateCcw,
  Copy,
  Trash2,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { Input, Modal, Tooltip, message, Select, Button } from "antd"
import { marked } from "marked"
import TurndownService from "turndown"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { ProofreadingDecoration } from "@/extensions/ProofreadingDecoration"
import { ReloadOutlined } from "@ant-design/icons"
import { sendRetryLines } from "@api/blogApi"
import { retryBlog } from "@store/slices/blogSlice"
import { createPortal } from "react-dom"
import { getLinkPreview } from "link-preview-js"
import { useQueryClient } from "@tanstack/react-query"
import { useProofreadingUI } from "@/layout/Editor/useProofreadingUI"
import ContentDiffViewer from "../Editor/ContentDiffViewer"
import "./editor.css"
import { VideoEmbed } from "@/extensions/VideoEmbed"
import LoadingScreen from "@components/UI/LoadingScreen"

import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"

const FONT_OPTIONS = [
  { label: "Arial", value: "font-arial" },
  { label: "Georgia", value: "font-georgia" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
]

const TextEditor = ({
  blog,
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
  unsavedChanges,
  setUnsavedChanges,
  wordpressMetadata,
  handleSubmit,
}) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [editorReady, setEditorReady] = useState(false)
  const [selectionPosition, setSelectionPosition] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 })
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 })
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan
  const hasShownToast = useRef(false)
  const location = useLocation()
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
  const [lastSavedContent, setLastSavedContent] = useState("")

  const normalizeContent = useCallback(str => str.replace(/\s+/g, " ").trim(), [])

  const safeContent = content ?? blog?.content ?? ""

  const markdownToHtml = useCallback(markdown => {
    if (!markdown) return "<p></p>"
    const rawHtml = marked.parse(
      markdown
        .replace(/!\[\s*["']?(.*?)["']?\s*\]\((.*?)\)/g, (_, alt, url) => `![${alt}](${url})`) // remove quotes from alt
        .replace(/'/g, "'"),
      {
        gfm: true,
        breaks: true,
      }
    )
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ["iframe", "div", "table", "th", "td", "tr"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src", "style", "title"],
    })
    return cleanHtml

    // const result = unified()
    //   // Take Markdown as input and turn it into MD syntax tree
    //   .use(remarkParse)
    //   // Add support for frontmatter in Markdown
    //   .use(remarkFrontmatter, ["yaml"])
    //   // Prase and validate Markdown frontmatter (YAML)
    //   .use(remarkParseFrontmatter)
    //   // Switch from MD syntax tree to HTML syntax tree (remakr -> rehype)
    //   .use(remarkRehype, {
    //     // Necessary for support HTML embeds (see next plugin)
    //     allowDangerousHtml: true,
    //   })
    //   // Support HTML embedded inside markdown
    //   .use(rehypeRaw)
    //   // Improve code highlighting
    //   // .use(rehypeHighlight)
    //   // Serialize syntax tree to HTML
    //   .use(rehypeStringify)
    //   // And finally, process the input
    //   .processSync(markdown)
    // return result.toString()
  }, [])

  const htmlToMarkdown = useCallback(html => {
    if (!html) return ""
    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
    })
    turndownService.keep(["p", "div", "iframe", "table", "tr", "th", "td"])
    return turndownService.turndown(html)
  }, [])

  const initialContent = useMemo(() => {
    if (!safeContent) return "<p></p>"
    return markdownToHtml(safeContent)
  }, [safeContent])

  const lastNormalizedSavedContent = useRef(normalizeContent(lastSavedContent ?? ""))

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
          HTMLAttributes: { class: "rounded-lg mx-auto w-3/4 h-auto object-contain" },
        }),
        TextAlign.configure({ types: ["heading", "paragraph", "right"] }),
        Table.configure({
          resizable: false,
          HTMLAttributes: {
            class: "border-2 w-full border-collpase p-2 border-gray-800",
          },
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
        ProofreadingDecoration.configure({ suggestions: proofreadingResults }),
        VideoEmbed,
      ],
      content: "<p></p>",
      editorProps: {
        attributes: {
          class: `prose max-w-none focus:outline-none p-4 min-h-[400px] ${selectedFont} blog-content editor-container`,
        },
      },

      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        const markdown = htmlToMarkdown(html)

        setContent(markdown)

        const normCurrent = normalizeContent(markdown)
        const unsaved = normCurrent !== lastNormalizedSavedContent.current
        setUnsavedChanges(unsaved)
      },
    },
    [selectedFont, proofreadingResults, htmlToMarkdown, setContent, setUnsavedChanges]
  )

  const { activeSpan, bubbleRef, applyChange, rejectChange } = useProofreadingUI(normalEditor)

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
      setImageModalOpen(true)
    })
  }, [safeEditorAction])

  const handleReGenerate = async () => {
    if (!blog?._id) {
      message.error("Blog ID is missing.")
      return
    }

    const proceedWithRegenerate = async () => {
      const payload = {
        createNew: true,
      }
      try {
        await dispatch(retryBlog({ id: blog._id, payload }))
        queryClient.invalidateQueries({ queryKey: ["blogs"] })
        queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
        setUnsavedChanges(false)
        navigate("/blogs")
      } catch (error) {
        console.error("Retry failed:", error)
        message.error(error.message || "Retry failed.")
      }
    }

    await proceedWithRegenerate()
  }

  const handleRegenerate = async () => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
      return
    }

    const proceedWithRegenerate = async () => {
      const modelCostMap = {
        gemini: 10,
        chatgpt: 30,
        claude: 50,
      }

      const credits = modelCostMap[blog?.aiModel?.toLowerCase()] || 10 // fallback to 10

      handlePopup({
        title: "Regenerate Blog",
        description: (
          <>
            Are you sure you want to retry generating this blog?{" "}
            <span className="font-bold">This will cost {credits} credits</span>
          </>
        ),
        onConfirm: handleReGenerate,
      })
    }

    await proceedWithRegenerate()
  }

  const handleConfirmLink = useCallback(() => {
    if (!linkUrl || !/https?:\/\//i.test(linkUrl)) {
      message.error("Enter a valid URL.")
      return
    }

    const safeUrl = decodeURIComponent(linkUrl) // clean it

    if (normalEditor) {
      const { from, to } = normalEditor.state.selection
      normalEditor
        .chain()
        .focus()
        .setLink({ href: safeUrl, target: "_blank", rel: "noopener noreferrer" })
        .setTextSelection({ from, to })
        .run()
      setLinkModalOpen(false)
      message.success("Link added.")
    }
  }, [linkUrl, normalEditor])

  const handleConfirmImage = useCallback(() => {
    if (!imageUrl || !/https?:\/\//i.test(imageUrl)) {
      message.error("Enter a valid image URL.")
      return
    }
    if (imageUrl.includes("<script") || imageUrl.includes("</script")) {
      message.error("Script tags are not allowed in image URLs.")
      return
    }
    if (normalEditor) {
      const { from } = normalEditor.state.selection
      normalEditor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: imageAlt })
        .setTextSelection(from)
        .run()
      setImageModalOpen(false)
      message.success("Image added.")
    }
  }, [imageUrl, imageAlt, normalEditor])

  const handleImageClick = useCallback(event => {
    if (event.target.tagName === "IMG") {
      const { src, alt } = event.target
      setSelectedImage({ src, alt: alt || "" })
      setImageAlt(alt || "")
      setEditImageModalOpen(true)
    }
  }, [])

  const handleConfirmEditImage = useCallback(() => {
    if (!selectedImage || !imageAlt) {
      message.error("Alt text is required.")
      return
    }
    if (normalEditor) {
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
      } else {
        message.error("Failed to update image alt text.")
      }
    }
  }, [selectedImage, imageAlt, normalEditor])

  const escapeRegExp = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  const hasScriptTag = content => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")
    return !!doc.querySelector("script")
  }

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

  const handleRetry = async () => {
    if (!blog?._id) {
      message.error("Blog ID is missing.")
      return
    }
    if (!normalEditor) {
      message.error("Editor is not initialized.")
      return
    }
    const selection = normalEditor.state.selection
    const from = selection.from
    const to = selection.to
    if (from === to) {
      message.error("Please select some text to retry.")
      return
    }
    const selectedText = normalEditor.state.doc.textBetween(from, to, "\n")
    setOriginalContent(selectedText)
    setSelectionRange({ from, to })
    const payload = {
      contentPart: selectedText.trim(),
    }

    const proceedWithRetry = async () => {
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

    await proceedWithRetry()
  }

  const handleAcceptRetry = () => {
    if (!retryContent) return
    if (normalEditor) {
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
  }

  const handleRejectRetry = () => {
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
    setSelectionRange({ from: 0, to: 0 })
    message.info("Retry content discarded.")
  }

  const handleRewrite = () => {
    // Check plan
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
      return
    }

    // Show the rewrite confirmation popup directly
    handlePopup({
      title: "Rewrite Selected Lines",
      description: (
        <>
          Do you want to rewrite the selected lines?{" "}
          <span className="font-bold">You can rewrite only 3 times.</span>
        </>
      ),
      confirmText: "Yes, Rewrite",
      cancelText: "Cancel",
      onConfirm: handleRetry,
    })
  }

  const handleAcceptHumanizedContentModified = useCallback(() => {
    if (humanizedContent) {
      setContent(humanizedContent)
      if (normalEditor && !normalEditor.isDestroyed) {
        const htmlContent = markdownToHtml(humanizedContent)
        normalEditor.commands.setContent(htmlContent, false)
      }
      handleAcceptHumanizedContent()
    }
  }, [humanizedContent, setContent, normalEditor, markdownToHtml, handleAcceptHumanizedContent])

  const handleDeleteImage = useCallback(() => {
    if (!selectedImage) return
    if (normalEditor) {
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
      } else {
        message.error("Failed to delete image.")
      }
    }
  }, [selectedImage, normalEditor])

  function useNavigationBlocker(when) {
    const blocker = useBlocker(
      ({ currentLocation, nextLocation }) =>
        when && currentLocation.pathname !== nextLocation.pathname
    )
    return blocker
  }

  const blocker = useNavigationBlocker(unsavedChanges)

  useEffect(() => {
    if (normalEditor && blog?.content) {
      const html = markdownToHtml(blog.content)
      normalEditor.commands.setContent(html, false)
      setContent(blog.content)
      setLastSavedContent(blog.content)

      requestAnimationFrame(() => {
        if (normalEditor.view.dom) {
          normalEditor.view.dom.scrollTop = 0
          normalEditor.commands.setTextSelection(0) // put caret at start
        }
      })
    }
  }, [normalEditor, blog, markdownToHtml])

  useEffect(() => {
    setIsEditorLoading(true)
    const timer = setTimeout(() => {
      setIsEditorLoading(false)
      if (normalEditor) {
        normalEditor.commands.focus()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [normalEditor])

  useEffect(() => {
    if (blog?.status === "failed" && !hasShownToast.current) {
      message.error("Your blog generation failed. You can write blog manually.")
      hasShownToast.current = true
    }
  }, [blog?.status])

  useEffect(() => {
    const normCurrent = normalizeContent(content ?? "")
    const normSaved = normalizeContent(lastSavedContent ?? "")
    setUnsavedChanges(normCurrent !== normSaved)
  }, [content, lastSavedContent, normalizeContent, setUnsavedChanges])

  useEffect(() => {
    if (normalEditor) {
      const ext = normalEditor.extensionManager.extensions.find(
        e => e.name === "proofreadingDecoration"
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
    const handleClickOutside = event => {
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

  useEffect(() => {
    if (blog?.content && (content == null || content === "")) {
      setContent(blog.content)
    }
  }, [blog, content, setContent])

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
      // setLastSavedContent(updatedContent)
    }
  }, [blog, safeContent, setContent])

  useEffect(() => {
    if (normalEditor && normalEditor?.view?.dom) {
      const editorElement = normalEditor.view.dom
      editorElement.addEventListener("click", handleImageClick)
      return () => {
        if (editorElement) {
          editorElement.removeEventListener("click", handleImageClick)
        }
      }
    }
  }, [normalEditor, handleImageClick])

  useEffect(() => {
    const editorDom = normalEditor.view.dom

    const handleMouseOver = async e => {
      const link = e.target.closest("a")
      if (!link) return

      // 🛠 Fix encoding
      const rawUrl = link.href
      const decodedUrl = decodeURIComponent(rawUrl)

      const rect = link.getBoundingClientRect()
      const scrollY = window.scrollY || window.pageYOffset
      const scrollX = window.scrollX || window.pageXOffset

      setLinkPreviewPos({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      })
      setLinkPreviewUrl(decodedUrl)
      setLinkPreviewElement(link)

      try {
        const data = await getLinkPreview(decodedUrl) // use clean version
        setLinkPreview(data || { title: decodedUrl, description: "" })
      } catch (err) {
        console.error("Failed to fetch link preview:", err)
        setLinkPreview({ title: decodedUrl, description: "" })
      }
    }

    const handleMouseOut = e => {
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
  }, [normalEditor])

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("You have unsaved changes, are you sure you want to leave?")) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  useEffect(() => {
    const normCurrent = normalizeContent(content ?? "")
    const normSaved = normalizeContent(lastSavedContent ?? "")
    setUnsavedChanges(normCurrent !== normSaved)
  }, [content, lastSavedContent, normalizeContent])

  useEffect(() => {
    if (!normalEditor || normalEditor.isDestroyed) return

    const html = markdownToHtml(content)
    if (normalEditor.getHTML() !== html) {
      const editorDom = normalEditor.view.dom

      const selection = normalEditor.state.selection
      normalEditor.commands.setContent(html, false)
      normalEditor.commands.setTextSelection({ from: selection.from, to: selection.to })
    }
  }, [content, normalEditor, markdownToHtml])

  const renderToolbar = () => (
    <div className="bg-white border-x border-gray-200 shadow-sm px-2 sm:px-4 py-2 flex flex-wrap items-center justify-start gap-y-2 overflow-x-auto">
      {/* Headings */}
      <div className="flex gap-1 flex-shrink-0">
        {[1, 2, 3].map(level => (
          <Tooltip key={level} title={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  normalEditor.chain().focus().toggleHeading({ level }).run()
                })
              }
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                normalEditor?.isActive("heading", { level })
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
                normalEditor.chain().focus().toggleBold().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              normalEditor?.isActive("bold") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
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
                normalEditor.chain().focus().toggleItalic().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              normalEditor?.isActive("italic") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
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
                normalEditor.chain().focus().toggleUnderline().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              normalEditor?.isActive("underline")
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
        {["left", "center", "right"].map(align => (
          <Tooltip key={align} title={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  normalEditor.chain().focus().setTextAlign(align).run()
                })
              }
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                normalEditor?.isActive({ textAlign: align })
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
                normalEditor.chain().focus().toggleBulletList().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              normalEditor?.isActive("bulletList")
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
                normalEditor.chain().focus().toggleOrderedList().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              normalEditor?.isActive("orderedList")
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
              onClick={handleRewrite}
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
              aria-label="Rewrite"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
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
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Font Select */}
      <Select
        value={selectedFont}
        onChange={value => safeEditorAction(() => setSelectedFont(value))}
        className="w-32 flex-shrink-0"
        aria-label="Font"
      >
        {FONT_OPTIONS.map(font => (
          <Select.Option key={font.value} value={font.value}>
            {font.label}
          </Select.Option>
        ))}
      </Select>
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
          <LoadingScreen />
        </div>
      )
    }

    if (humanizedContent && showDiff) {
      if (!editorContent && !humanizedContent) {
        return (
          <div className="p-4 bg-white h-screen overflow-auto">
            <p className="text-gray-500">No content to compare.</p>
          </div>
        )
      }

      return (
        <ContentDiffViewer
          oldMarkdown={editorContent}
          newMarkdown={humanizedContent}
          onAccept={handleAcceptHumanizedContentModified}
          onReject={handleAcceptOriginalContent}
        />
      )
    }

    return (
      <div className="overflow-auto custom-scroll">
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

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(isRetrying || isSavingKeyword) && (
        <div className="bg-white flex items-center justify-center z-50">
          <LoadingScreen />
        </div>
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
      <div className="flex flex-col h-full">
        {/* Sticky header: Toolbar */}
        <div className="sticky top-0 z-50 bg-white shadow-sm">{renderToolbar()}</div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">{renderContentArea()}</div>
      </div>

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
              zIndex: 1000,
              maxWidth: "300px",
              minWidth: "200px",
              display: "block",
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
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => {
                      handleRemoveLink()
                    }}
                    size="small"
                    danger
                    style={{
                      flex: 1,
                      display: "block",
                    }}
                  >
                    Remove Link
                  </Button>
                  <Button
                    onClick={() => {
                      const pos = normalEditor.view.posAtDOM(linkPreviewElement, 0)
                      const end = pos + (linkPreviewElement.textContent?.length || 0)
                      normalEditor.chain().focus().setTextSelection({ from: pos, to: end }).run()
                      setLinkUrl(linkPreviewUrl)
                      setLinkModalOpen(true)
                      setLinkPreview(null)
                      setLinkPreviewPos(null)
                      setLinkPreviewUrl(null)
                      setLinkPreviewElement(null)
                    }}
                    size="small"
                    style={{
                      flex: 1,
                      display: "block",
                    }}
                  >
                    Edit Link
                  </Button>
                </div>
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
          onChange={e => setLinkUrl(e.target.value)}
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
          onChange={e => setImageAlt(e.target.value)}
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
          onChange={e => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full mt-4"
          // prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
        />
        <p className="mt-2 text-xs text-gray-500">Include http:// or https://</p>
        <Input
          value={imageAlt}
          onChange={e => setImageAlt(e.target.value)}
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
