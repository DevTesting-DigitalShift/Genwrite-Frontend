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
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import Highlight from "@tiptap/extension-highlight"
import { Tooltip, Modal, Input, message } from "antd"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
  Table as TableIcon,
  Highlighter,
  X,
  Check,
} from "lucide-react"

const ToolbarButton = ({ active, onClick, disabled, children, title }) => (
  <Tooltip title={title} placement="top">
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`p-1.5 rounded transition-all duration-150 ${
        disabled
          ? "opacity-40 cursor-not-allowed text-gray-400"
          : active
          ? "bg-blue-100 text-blue-600 shadow-sm"
          : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  </Tooltip>
)

const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 mx-1" />

const BasicEditor = ({ content, onChange, placeholder = "Start writing..." }) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4] }),
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4 mx-auto block",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-gray-300 w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border border-gray-300",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 bg-gray-100 p-2 font-semibold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 p-2",
        },
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-4 " +
          "[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h1]:text-gray-900 " +
          "[&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:text-gray-800 " +
          "[&>h3]:text-xl [&>h3]:font-medium [&>h3]:mb-2 [&>h3]:mt-4 [&>h3]:text-gray-800 " +
          "[&>h4]:text-lg [&>h4]:font-medium [&>h4]:mb-2 [&>h4]:mt-3 [&>h4]:text-gray-700 " +
          "[&>p]:mb-4 [&>p]:leading-relaxed [&>p]:text-gray-700 " +
          "[&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-2 " +
          "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li]:mb-2 " +
          "[&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>blockquote]:my-4 [&>blockquote]:bg-blue-50 [&>blockquote]:py-2 [&>blockquote]:rounded-r-lg " +
          "[&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 " +
          "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:mx-auto [&_img]:block " +
          "[&_table]:border-collapse [&_table]:w-full [&_table]:my-4 " +
          "[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-2 [&_th]:text-left " +
          "[&_td]:border [&_td]:border-gray-300 [&_td]:p-2 " +
          "[&_mark]:bg-yellow-200 [&_mark]:px-1 [&_mark]:rounded",
      },
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false)
    }
  }, [content, editor])

  if (!editor) return null

  const openLinkModal = () => {
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, "")
    setLinkText(selectedText)
    setLinkUrl(editor.getAttributes("link").href || "")
    setLinkModalOpen(true)
  }

  const addLink = () => {
    if (!linkUrl) {
      message.error("Please enter a URL")
      return
    }

    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`

    if (linkText && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${linkText}</a>`).run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }

    setLinkModalOpen(false)
    setLinkUrl("")
    setLinkText("")
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
  }

  const openImageModal = () => {
    setImageUrl("")
    setImageAlt("")
    setImageModalOpen(true)
  }

  const addImage = () => {
    if (!imageUrl) {
      message.error("Please enter an image URL")
      return
    }
    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run()
    setImageModalOpen(false)
    setImageUrl("")
    setImageAlt("")
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-3 py-2">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            active={editor.isActive("heading", { level: 4 })}
            title="Heading 4"
          >
            <Heading4 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            active={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Blockquote & Code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Divider"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link */}
          <ToolbarButton onClick={openLinkModal} active={editor.isActive("link")} title="Add Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor.isActive("link") && (
            <ToolbarButton onClick={removeLink} title="Remove Link">
              <Unlink className="w-4 h-4" />
            </ToolbarButton>
          )}

          {/* Image */}
          <ToolbarButton onClick={openImageModal} title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>

          {/* Table */}
          <ToolbarButton onClick={addTable} title="Insert Table">
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />

      {/* Link Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <span>Add Link</span>
          </div>
        }
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onPressEnter={addLink}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Text (optional)
            </label>
            <Input
              placeholder="Display text"
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              onPressEnter={addLink}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setLinkModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addLink}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Add Link
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <span>Add Image</span>
          </div>
        }
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              onPressEnter={addImage}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text (optional)
            </label>
            <Input
              placeholder="Image description"
              value={imageAlt}
              onChange={e => setImageAlt(e.target.value)}
              onPressEnter={addImage}
            />
          </div>
          {imageUrl && (
            <div className="border rounded-lg p-2 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <img
                src={imageUrl}
                alt={imageAlt || "Preview"}
                className="max-h-32 mx-auto rounded"
                onError={e => (e.target.style.display = "none")}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setImageModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addImage}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Add Image
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default BasicEditor
