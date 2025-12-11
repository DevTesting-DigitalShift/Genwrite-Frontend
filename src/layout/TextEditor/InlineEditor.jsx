import React, { useEffect, useState, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Heading from "@tiptap/extension-heading"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting,
} from "lucide-react"
import { Tooltip } from "antd"

const ToolbarButton = ({ active, onClick, children, title }) => (
  <Tooltip title={title}>
    <button
      onClick={onClick}
      type="button"
      className={`p-1.5 rounded transition-colors ${
        active ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      {children}
    </button>
  </Tooltip>
)

const InlineEditor = ({
  value,
  onChange,
  placeholder,
  className = "",
  editorClassName = "",
  onBlur,
  autoFocus = false,
  singleLine = false,
}) => {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: {
          HTMLAttributes: {
            class: singleLine ? "inline" : "",
          },
        },
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onBlur: () => {
      // Delay hiding toolbar to allow button clicks
      setTimeout(() => {
        setShowToolbar(false)
        if (onBlur) onBlur()
      }, 200)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to

      if (hasSelection && containerRef.current) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          const containerRect = containerRef.current.getBoundingClientRect()

          setToolbarPosition({
            top: rect.top - containerRect.top - 45,
            left: Math.max(0, rect.left - containerRect.left + rect.width / 2 - 120),
          })
          setShowToolbar(true)
        }
      } else {
        setShowToolbar(false)
      }
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${editorClassName}`,
      },
      handleKeyDown: (view, event) => {
        if (singleLine && event.key === "Enter") {
          event.preventDefault()
          return true
        }
        return false
      },
    },
    autofocus: autoFocus,
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false)
    }
  }, [value, editor])

  if (!editor) return null

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }

  return (
    <div ref={containerRef} className={`inline-editor-wrapper relative ${className}`}>
      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-1 flex items-center gap-0.5"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          onMouseDown={e => e.preventDefault()}
        >
          <ToolbarButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <ToolbarButton title="Clear Formatting" onClick={clearFormatting}>
            <RemoveFormatting className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <div
        className={`border rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all ${
          !value || value === "<p></p>" ? "text-gray-400" : ""
        }`}
        data-placeholder={placeholder}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default InlineEditor
