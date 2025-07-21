import React, { useState, useCallback, useEffect, useRef } from "react"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Heading from "@tiptap/extension-heading"
import Image from "@tiptap/extension-image"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Copy,
  Image as ImageIcon,
} from "lucide-react"
import { Modal, Input, Button, Select, message, Tooltip } from "antd"

const ToolbarButton = ({ onClick, title, children, isActive }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-100 duration-200 ${isActive ? "bg-gray-200" : ""}`}
    title={title}
  >
    {children}
  </button>
)

const RichTextEditor = ({ title, onTitleChange, onContentChange }) => {
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [fontFamily, setFontFamily] = useState("Inter")
  const titleRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
        heading: false, // Disable default heading to use custom Heading extension
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-6",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-6",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-gray-300 pl-4 italic",
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800 cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }).extend({
        renderHTML({ node, HTMLAttributes }) {
          const level = node.attrs.level
          const classes = {
            1: "text-4xl font-bold mb-4",
            2: "text-3xl font-semibold mb-3",
            3: "text-2xl font-medium mb-2",
          }

          return [
            `h${level}`,
            {
              ...HTMLAttributes,
              class: classes[level],
            },
            0,
          ]
        },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "max-w-full h-auto my-2",
        },
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg lg:prose-xl focus:outline-none max-w-none",
        style: `font-family: ${fontFamily}, sans-serif;`,
      },
      handleClickOn: (view, pos, node, nodePos, event) => {
        if (node.type.name === "text" && node.marks.some((mark) => mark.type.name === "link")) {
          return false // Let the browser handle the link click
        }
        return true // Handle other clicks normally
      },
    },
  })

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto"
      titleRef.current.style.height = titleRef.current.scrollHeight + "px"
    }
  }, [title])

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      editor?.chain().focus().run()
    }
  }

  // Callback to open the link modal
  const showLinkModal = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href
    setLinkUrl(previousUrl || "")
    setIsLinkModalVisible(true)
  }, [editor])

  // Callback to handle closing the link modal
  const handleLinkModalCancel = () => {
    setIsLinkModalVisible(false)
    setLinkUrl("")
  }

  // Callback to handle setting the link from the modal
  const handleLinkModalOk = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    } else {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
    }
    setIsLinkModalVisible(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  // Callback to open the image modal
  const showImageModal = useCallback(() => {
    setImageUrl("")
    setImageAlt("")
    setIsImageModalVisible(true)
  }, [])

  // Callback to handle closing the image modal
  const handleImageModalCancel = () => {
    setIsImageModalVisible(false)
    setImageUrl("")
    setImageAlt("")
  }

  // Callback to handle inserting the image from the modal
  const handleImageModalOk = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run()
    }
    setIsImageModalVisible(false)
    setImageUrl("")
    setImageAlt("")
  }, [editor, imageUrl, imageAlt])

  // Font change handler
  const handleFontChange = (value) => {
    setFontFamily(value)
    if (editor) {
      editor.commands.setContent(editor.getHTML(), false, {
        preserveWhitespace: true,
        rootBlock: {
          attributes: {
            style: `font-family: ${value}, sans-serif;`,
          },
        },
      })
    }
  }

  // Copy content to clipboard
  const handleCopyContent = () => {
    if (editor) {
      const content = editor.getHTML()
      navigator.clipboard.writeText(content).then(
        () => {
          message.success("Content copied to clipboard!")
        },
        () => {
          message.error("Failed to copy content.")
        }
      )
    }
  }

  if (!editor) {
    return null
  }

  const toolbarButtons = [
    {
      icon: Undo,
      command: () => editor.chain().focus().undo().run(),
      isActive: false,
      title: "Undo (Ctrl+Z)",
    },
    {
      icon: Redo,
      command: () => editor.chain().focus().redo().run(),
      isActive: false,
      title: "Redo (Ctrl+Y)",
    },
    {
      icon: Bold,
      command: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      title: "Bold (Ctrl+B)",
    },
    {
      icon: Italic,
      command: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      title: "Italic (Ctrl+I)",
    },
    {
      icon: UnderlineIcon,
      command: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
      title: "Underline (Ctrl+U)",
    },
    {
      icon: LinkIcon,
      command: showLinkModal,
      isActive: editor.isActive("link"),
      title: "Insert Link",
    },
    {
      icon: ImageIcon,
      command: showImageModal,
      isActive: false,
      title: "Insert Image",
    },
    {
      icon: Heading1,
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
      title: "Heading 1",
    },
    {
      icon: Heading2,
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      title: "Heading 2",
    },
    {
      icon: Heading3,
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      title: "Heading 3",
    },
    {
      icon: List,
      command: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      title: "Bullet List",
    },
    {
      icon: ListOrdered,
      command: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      title: "Numbered List",
    },
    {
      icon: Quote,
      command: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      title: "Quote",
    },
    {
      icon: Code,
      command: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
      title: "Code Block",
    },
    {
      icon: AlignLeft,
      command: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
      title: "Align Left",
    },
    {
      icon: AlignCenter,
      command: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
      title: "Align Center",
    },
    {
      icon: AlignRight,
      command: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
      title: "Align Right",
    },
    {
      icon: AlignJustify,
      command: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
      title: "Align Justify",
    },
    {
      icon: Copy,
      command: handleCopyContent,
      isActive: false,
      title: "Copy Content",
    },
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-1 flex items-center space-x-1"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
            isActive={editor.isActive("bold")}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
            isActive={editor.isActive("italic")}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={showLinkModal}
            title="Insert Link"
            isActive={editor.isActive("link")}
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={showImageModal} title="Insert Image" isActive={false}>
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </BubbleMenu>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-12">
          <div className="p-4 border border-gray-200 rounded-lg mb-5">
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Your Title..."
              className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden leading-tight "
              rows={1}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center space-x-1 mb-4">
            {toolbarButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <Tooltip key={index} title={button.title} arrow>
                  <span>
                    <ToolbarButton onClick={button.command} isActive={button.isActive}>
                      <Icon className="w-4 h-4" />
                    </ToolbarButton>
                  </span>
                </Tooltip>
              )
            })}
            <Select
              defaultValue="Inter"
              onChange={handleFontChange}
              className="w-40"
              options={[
                { value: "Inter", label: "Inter" },
                { value: "Arial", label: "Arial" },
                { value: "Times New Roman", label: "Times New Roman" },
              ]}
            />
          </div>

          <div className="h-screen p-4 border border-gray-200 rounded-lg">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
      </div>

      <Modal
        title="Enter URL"
        open={isLinkModalVisible}
        onOk={handleLinkModalOk}
        onCancel={handleLinkModalCancel}
        footer={[
          <Button key="back" onClick={handleLinkModalCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleLinkModalOk}>
            Set Link
          </Button>,
        ]}
      >
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
          onPressEnter={handleLinkModalOk}
        />
      </Modal>

      <Modal
        title="Insert Image"
        open={isImageModalVisible}
        onOk={handleImageModalOk}
        onCancel={handleImageModalCancel}
        footer={[
          <Button key="back" onClick={handleImageModalCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleImageModalOk}>
            Insert Image
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              onPressEnter={handleImageModalOk}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alt Text</label>
            <Input
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Describe the image"
              onPressEnter={handleImageModalOk}
            />
          </div>
        </div>
      </Modal>

      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-6 text-xs text-gray-500">
        <div>Last saved: Just now</div>
      </div>
    </div>
  )
}

export default RichTextEditor
