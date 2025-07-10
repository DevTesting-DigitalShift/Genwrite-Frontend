import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
} from "lucide-react"

const Toolbar = ({ editor }) => {
  if (!editor) return null

  const setLink = () => {
    const url = window.prompt("Enter a URL")
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
  }

  const buttonStyle = "p-2 rounded hover:bg-gray-200 text-gray-600 transition-colors border border-transparent"
  const activeStyle = "p-2 rounded bg-blue-100 text-blue-700 border border-blue-400"

  return (
    <div className="flex flex-wrap gap-2 bg-gray-50 p-3 border-b border-gray-200 shadow-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? activeStyle : buttonStyle}
        aria-label="Toggle bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? activeStyle : buttonStyle}
        aria-label="Toggle italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? activeStyle : buttonStyle}
        aria-label="Toggle underline"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? activeStyle : buttonStyle}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? activeStyle : buttonStyle}
        aria-label="Toggle heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? activeStyle : buttonStyle}
        aria-label="Toggle heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? activeStyle : buttonStyle}
        aria-label="Toggle heading 3"
      >
        <Heading3 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? activeStyle : buttonStyle}
        aria-label="Toggle bullet list"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? activeStyle : buttonStyle}
        aria-label="Toggle ordered list"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={editor.isActive({ textAlign: "left" }) ? activeStyle : buttonStyle}
        aria-label="Align left"
      >
        <AlignLeft size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={editor.isActive({ textAlign: "center" }) ? activeStyle : buttonStyle}
        aria-label="Align center"
      >
        <AlignCenter size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={editor.isActive({ textAlign: "right" }) ? activeStyle : buttonStyle}
        aria-label="Align right"
      >
        <AlignRight size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={editor.isActive({ textAlign: "justify" }) ? activeStyle : buttonStyle}
        aria-label="Align justify"
      >
        <AlignJustify size={16} />
      </button>
      <button
        onClick={setLink}
        className={editor.isActive("link") ? activeStyle : buttonStyle}
        aria-label="Toggle link"
      >
        <LinkIcon size={16} />
      </button>
    </div>
  )
}

export default Toolbar