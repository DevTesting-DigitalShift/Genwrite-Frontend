import React from "react"
import { Tooltip, Select, Button } from "antd"
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
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  RotateCcw,
  Copy,
  Upload,
} from "lucide-react"
import { ReloadOutlined } from "@ant-design/icons"

const FONT_OPTIONS = [
  { label: "Arial", value: "font-arial" },
  { label: "Georgia", value: "font-georgia" },
  { label: "Mono", value: "font-mono" },
  { label: "Comic Sans", value: "font-comic" },
]

const Toolbar = ({
  activeTab,
  normalEditor,
  safeEditorAction,
  handleAddLink,
  handleAddImage,
  handleRegenerate,
  handleRetry,
  safeContent,
  htmlContent,
  setContent,
  setUnsavedChanges,
  pathDetect,
  fileInputRef,
  selectedFont,
  setSelectedFont,
  markdownPreview,
  setMarkdownPreview,
}) => {
  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const isMarkdown = activeTab === "Markdown" && file.name.endsWith(".md")
    const isHtml = activeTab === "HTML" && file.name.endsWith(".html")

    if (!isMarkdown && !isHtml) {
      message.error(`Please upload a ${activeTab === "Markdown" ? ".md" : ".html"} file.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      let fileContent = e.target.result
      if (isHtml && fileContent.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi)) {
        message.error("Script tags are not allowed in imported HTML content for security reasons.")
        return
      }
      setContent(fileContent)
      setUnsavedChanges(true)
      message.success(`${file.name} imported successfully!`)
    }
    reader.onerror = () => {
      message.error("Failed to read the file.")
    }
    reader.readAsText(file)

    event.target.value = null
  }

  return (
    <div className="bg-white border-x border-gray-200 shadow-sm px-2 sm:px-4 py-2 flex flex-wrap items-center justify-start gap-y-2 overflow-x-auto">
      <div className="flex gap-1 flex-shrink-0">
        {[1, 2, 3].map((level) => (
          <Tooltip key={level} title={`Heading ${level}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  if (activeTab === "Normal")
                    normalEditor.chain().focus().toggleHeading({ level }).run()
                })
              }
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                activeTab === "Normal" && normalEditor?.isActive("heading", { level })
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
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip title="Bold">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") normalEditor.chain().focus().toggleBold().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("bold")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
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
                if (activeTab === "Normal") normalEditor.chain().focus().toggleItalic().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("italic")
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
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
                if (activeTab === "Normal") normalEditor.chain().focus().toggleUnderline().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("underline")
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
      <div className="flex gap-1 flex-shrink-0">
        {["left", "center", "right"].map((align) => (
          <Tooltip key={align} title={`Align ${align}`}>
            <button
              onClick={() =>
                safeEditorAction(() => {
                  if (activeTab === "Normal") normalEditor.chain().focus().setTextAlign(align).run()
                })
              }
              className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
                activeTab === "Normal" && normalEditor?.isActive({ textAlign: align })
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
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip title="Bullet List">
          <button
            onClick={() =>
              safeEditorAction(() => {
                if (activeTab === "Normal") normalEditor.chain().focus().toggleBulletList().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("bulletList")
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
                if (activeTab === "Normal") normalEditor.chain().focus().toggleOrderedList().run()
              })
            }
            className={`p-2 rounded-md transition-colors duration-150 flex items-center justify-center ${
              activeTab === "Normal" && normalEditor?.isActive("orderedList")
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
              onClick={() => handleRetry()}
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
              aria-label="Rewrite"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Copy">
          <button
            onClick={() => {
              navigator.clipboard.writeText(activeTab === "HTML" ? htmlContent : safeContent)
              message.success("Content copied to clipboard!")
            }}
            className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
            aria-label="Copy"
            type="button"
          >
            <Copy className="w-4 h-4" />
          </button>
        </Tooltip>
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
        {(activeTab === "Markdown" || activeTab === "HTML") && (
          <Tooltip title={`Import ${activeTab === "Markdown" ? ".md" : ".html"} File`}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0 flex items-center justify-center"
              aria-label="Import File"
              type="button"
            >
              <Upload className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>
      {(activeTab === "Markdown" || activeTab === "HTML") && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept={activeTab === "Markdown" ? ".md" : ".html"}
          onChange={handleFileImport}
        />
      )}
      <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />
      <Select
        value={selectedFont}
        onChange={(value) => safeEditorAction(() => setSelectedFont(value))}
        className="w-32 flex-shrink-0"
        aria-label="Font"
      >
        {FONT_OPTIONS.map((font) => (
          <Select.Option key={font.value} value={font.value}>
            {font.label}
          </Select.Option>
        ))}
      </Select>
      {(activeTab === "Markdown" || activeTab === "HTML") && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />
          <Tooltip title={markdownPreview ? "Hide Preview" : "Show Preview"}>
            <button
              onClick={() => setMarkdownPreview(!markdownPreview)}
              className={`p-2 rounded-md flex items-center justify-center transition-colors duration-150 ${
                markdownPreview ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle Preview"
              type="button"
            >
              {markdownPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Tooltip>
        </>
      )}
    </div>
  )
}

export default Toolbar
