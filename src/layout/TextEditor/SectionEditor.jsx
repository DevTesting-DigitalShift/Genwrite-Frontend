import React, { useEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import {
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
  Undo,
  Redo,
  ExternalLink,
  X,
} from "lucide-react"
import { Tooltip, message, Modal, Input } from "antd"

const ToolbarButton = ({ active, onClick, disabled, children, title }) => (
  <Tooltip title={title}>
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`p-2 rounded-md transition-colors duration-150 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : active
          ? "bg-blue-100 text-blue-600"
          : "hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  </Tooltip>
)

const SectionEditor = ({ initialContent, onChange, onBlur }) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [selectedLink, setSelectedLink] = useState(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto object-contain my-4",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[200px] " +
          "[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 " +
          "[&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-3 " +
          "[&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mb-2 " +
          "[&>p]:mb-4 [&>p]:leading-relaxed " +
          "[&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-2 " +
          "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li]:mb-2 " +
          "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg",
      },
      handleClick: (view, pos, event) => {
        // Check if clicked on a link
        const link = event.target.closest("a")
        if (link) {
          event.preventDefault()
          setSelectedLink({
            href: link.href,
            text: link.textContent,
            element: link,
          })
          return true
        }
        setSelectedLink(null)
        return false
      },
    },
  })

  // Update content when initialContent changes externally
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, false)
    }
  }, [initialContent, editor])

  if (!editor) return null

  const handleAddLink = () => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, " ")
    setLinkText(selectedText)
    setLinkUrl("")
    setLinkModalOpen(true)
  }

  const confirmAddLink = () => {
    if (!linkUrl) {
      message.error("Please enter a URL")
      return
    }

    let url = linkUrl
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    if (linkText && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${linkText}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }

    setLinkModalOpen(false)
    setLinkUrl("")
    setLinkText("")
    message.success("Link added")
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
    setSelectedLink(null)
    message.success("Link removed")
  }

  const handleAddImage = () => {
    setImageUrl("")
    setImageModalOpen(true)
  }

  const confirmAddImage = () => {
    if (!imageUrl) {
      message.error("Please enter an image URL")
      return
    }

    let url = imageUrl
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    editor.chain().focus().setImage({ src: url }).run()
    setImageModalOpen(false)
    setImageUrl("")
    message.success("Image added")
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg flex-wrap">
        {/* Headings */}
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          title="Bold (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline (Ctrl+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          title="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          title="Align Left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align Center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align Right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link & Image */}
        <ToolbarButton title="Add Link" active={editor.isActive("link")} onClick={handleAddLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Add Image" onClick={handleAddImage}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo (Ctrl+Y)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Link Preview Bar */}
      {selectedLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b text-sm">
          <LinkIcon className="w-4 h-4 text-blue-600" />
          <a
            href={selectedLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate flex-1"
          >
            {selectedLink.href}
          </a>
          <Tooltip title="Open Link">
            <a
              href={selectedLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-blue-100 rounded"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </a>
          </Tooltip>
          <Tooltip title="Remove Link">
            <button onClick={removeLink} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-4" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      {/* Link Modal */}
      <Modal
        title="Add Link"
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        onOk={confirmAddLink}
        okText="Add Link"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Text (optional)
            </label>
            <Input
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              placeholder="Display text for the link"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <Input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        title="Add Image"
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        onOk={confirmAddImage}
        okText="Add Image"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <Input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </Modal>
    </div>
  )
}

export default SectionEditor
