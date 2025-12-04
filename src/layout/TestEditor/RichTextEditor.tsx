import React from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"

interface Props {
  initialContent: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ initialContent, onChange }: Props) {
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

      Link.configure({
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
    ],

    content: initialContent,

    onUpdate: ({ editor }) => onChange(editor.getHTML()),

    editorProps: {
      attributes: {
        class:
          "editor-content focus:outline-none " +
          "prose max-w-none " +
          // Headings
          "[&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mb-6 " +
          "[&>h2]:text-3xl [&>h2]:font-semibold [&>h2]:mb-5 " +
          "[&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mb-4 " +
          // Paragraphs
          "[&>p]:mb-10 " +
          // Lists
          "[&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-2 " +
          "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li]:mb-2",
      },
    },
  })

  if (!editor) return null

  const addLink = () => {
    const url = prompt("Enter URL:")
    if (!url) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b pb-2 mb-3">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="px-2 py-1 border rounded"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="px-2 py-1 border rounded"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="px-2 py-1 border rounded"
        >
          H3
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="px-2 py-1 border rounded"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="px-2 py-1 border rounded"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="px-2 py-1 border rounded"
        >
          U
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="px-2 py-1 border rounded"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="px-2 py-1 border rounded"
        >
          1. List
        </button>

        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="px-2 py-1 border rounded"
        >
          Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="px-2 py-1 border rounded"
        >
          Redo
        </button>

        <button onClick={addLink} className="px-2 py-1 border rounded">
          Link
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
