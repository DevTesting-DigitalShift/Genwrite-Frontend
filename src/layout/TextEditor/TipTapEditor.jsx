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
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { Input, Modal, Tooltip, message, Select, Button, Flex } from "antd"
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
import { Iframe } from "@/extensions/IframeExtension"
import LoadingScreen from "@components/UI/LoadingScreen"
import { computeCost } from "@/data/pricingConfig"
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

const TipTapEditor = ({ blog, content, setContent, unsavedChanges, setUnsavedChanges }) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [editorReady, setEditorReady] = useState(false)
  const [editImageModalOpen, setEditImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [linkPreview, setLinkPreview] = useState(null)
  const [linkPreviewPos, setLinkPreviewPos] = useState(null)
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(null)
  const [linkPreviewElement, setLinkPreviewElement] = useState(null)
  const hideTimeout = useRef(null)
  const [lastSavedContent, setLastSavedContent] = useState("")

  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan
  const location = useLocation()

  const normalizeContent = useCallback(str => str.replace(/\s+/g, " ").trim(), [])
  const safeContent = content ?? blog?.content ?? ""

  const markdownToHtml = useCallback(markdown => {
    if (!markdown) return "<p></p>"
    const rawHtml = marked.parse(
      markdown
        .replace(/!\[\s*["']?(.*?)["']?\s*\]\((.*?)\)/g, (_, alt, url) => `![${alt}](${url})`)
        .replace(/'/g, "'"),
      { gfm: true, breaks: true }
    )
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ["iframe", "div", "table", "th", "td", "tr"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "src",
        "style",
        "title",
        "class",
      ],
    })
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

  const normalEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
        }),
        Image.configure({
          HTMLAttributes: { class: "rounded-lg mx-auto w-3/4 h-auto object-contain" },
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Table.configure({
          resizable: false,
          HTMLAttributes: { class: "border-2 w-full border-collapse p-2 border-gray-800" },
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
        // Iframe,
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
        const normSaved = normalizeContent(lastSavedContent ?? "")
        setUnsavedChanges(normCurrent !== normSaved)
      },
    },
    [
      selectedFont,
      htmlToMarkdown,
      setContent,
      setUnsavedChanges,
      lastSavedContent,
      normalizeContent,
    ]
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
      setImageModalOpen(true)
    })
  }, [safeEditorAction])

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

  const handleConfirmImage = useCallback(() => {
    if (!imageUrl || !/https?:\/\//i.test(imageUrl)) {
      message.error("Enter a valid image URL.")
      return
    }
    if (normalEditor) {
      normalEditor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run()
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
      }
    }
  }, [selectedImage, imageAlt, normalEditor])

  const handleDeleteImage = useCallback(() => {
    if (!selectedImage || !normalEditor) return
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
      message.success("Image deleted.")
    }
  }, [selectedImage, normalEditor])

  useEffect(() => {
    if (normalEditor && blog?.content) {
      const html = markdownToHtml(blog.content)
      normalEditor.commands.setContent(html, false)
      setContent(blog.content)
      setLastSavedContent(blog.content)

      // Scroll to top after content is loaded
      setTimeout(() => {
        const editorContainer = document.querySelector(".flex-1.overflow-auto.custom-scroll")
        if (editorContainer) {
          editorContainer.scrollTop = 0
        }
      }, 100)
    }
  }, [normalEditor, blog, markdownToHtml])

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

  const renderToolbar = () => (
    <div className="bg-white border-x border-gray-200 shadow-sm px-2 sm:px-4 py-2 flex flex-wrap items-center justify-start gap-y-2 overflow-x-auto">
      <div className="flex gap-1 flex-shrink-0">
        {[1, 2, 3, 4].map(level => (
          <Tooltip key={level} title={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => normalEditor.chain().focus().toggleHeading({ level }).run())
              }
              className={`p-2 rounded-md transition-colors ${
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

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Text styles */}
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip title="Bold">
          <button
            onClick={() => safeEditorAction(() => normalEditor.chain().focus().toggleBold().run())}
            className={`p-2 rounded-md transition-colors ${
              normalEditor?.isActive("bold") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
            }`}
            type="button"
          >
            <Bold className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Italic">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleItalic().run())
            }
            className={`p-2 rounded-md transition-colors ${
              normalEditor?.isActive("italic") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
            }`}
            type="button"
          >
            <Italic className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Alignment */}
      <div className="flex gap-1 flex-shrink-0">
        {["left", "center", "right"].map(align => (
          <Tooltip key={align} title={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => normalEditor.chain().focus().setTextAlign(align).run())
              }
              className={`p-2 rounded-md transition-colors ${
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

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Lists */}
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip title="Bullet List">
          <button
            onClick={() =>
              safeEditorAction(() => normalEditor.chain().focus().toggleBulletList().run())
            }
            className={`p-2 rounded-md transition-colors ${
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
            className={`p-2 rounded-md transition-colors ${
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

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Media & Undo/Redo */}
      <div className="flex gap-1 flex-nowrap">
        <Tooltip title="Link">
          <button
            onClick={handleAddLink}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            type="button"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Image">
          <button
            onClick={handleAddImage}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            type="button"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Undo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().undo().run())}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            type="button"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title="Redo">
          <button
            onClick={() => safeEditorAction(() => normalEditor?.chain().focus().redo().run())}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            type="button"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

      {/* Font Select */}
      <Select
        value={selectedFont}
        onChange={value => safeEditorAction(() => setSelectedFont(value))}
        className="w-32 flex-shrink-0"
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
      <div className="sticky top-0 z-50 bg-white shadow-sm flex-shrink-0">{renderToolbar()}</div>

      {/* Editor Content - Scrollable */}
      <div className="flex-1 overflow-auto custom-scroll bg-white p-4">
        {normalEditor && (
          <BubbleMenu
            editor={normalEditor}
            className="flex gap-2 bg-white shadow-lg p-2 rounded-lg border"
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
          </BubbleMenu>
        )}
        <EditorContent editor={normalEditor} />
      </div>

      {/* Modals */}
      <Modal
        title="Insert Link"
        open={linkModalOpen}
        onOk={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
        centered
      >
        <Input
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          className="mt-4"
        />
      </Modal>

      <Modal
        title="Insert Image"
        open={imageModalOpen}
        onOk={handleConfirmImage}
        onCancel={() => setImageModalOpen(false)}
        centered
      >
        <Input
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-4"
        />
        <Input
          value={imageAlt}
          onChange={e => setImageAlt(e.target.value)}
          placeholder="Image description"
          className="mt-4"
        />
      </Modal>

      <Modal
        title="Edit Image"
        open={editImageModalOpen}
        onOk={handleConfirmEditImage}
        onCancel={() => {
          setEditImageModalOpen(false)
          setSelectedImage(null)
        }}
        footer={
          <Flex justify="end" gap={16}>
            <Button
              key="delete"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteImage}
            >
              Delete
            </Button>
            <Button key="cancel" onClick={() => setEditImageModalOpen(false)}>
              Cancel
            </Button>
            <Button key="ok" type="primary" onClick={handleConfirmEditImage}>
              Update
            </Button>
          </Flex>
        }
        centered
      >
        <Input
          value={imageAlt}
          onChange={e => setImageAlt(e.target.value)}
          placeholder="Alt text"
          className="mt-4"
        />
        {selectedImage && (
          <img src={selectedImage.src} alt={imageAlt} className="mt-4 rounded-lg max-w-full" />
        )}
      </Modal>
    </motion.div>
  )
}

export default TipTapEditor
