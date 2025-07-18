import React, { useState, useRef, useEffect } from "react"
import {
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"

const RichTextEditor = ({ title, onTitleChange, onContentChange }) => {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false)
  const contentRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    // Auto-resize title textarea
    if (titleRef.current) {
      titleRef.current.style.height = "auto"
      titleRef.current.style.height = titleRef.current.scrollHeight + "px"
    }
  }, [title])

  const formatText = (command, value) => {
    document.execCommand(command, false, value)
    if (contentRef.current) {
      onContentChange(contentRef.current.innerHTML)
    }
  }

  const handleContentChange = () => {
    if (contentRef.current) {
      onContentChange(contentRef.current.innerHTML)
    }
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      contentRef.current?.focus()
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: "bold", title: "Bold (Ctrl+B)" },
    { icon: Italic, command: "italic", title: "Italic (Ctrl+I)" },
    { icon: Underline, command: "underline", title: "Underline (Ctrl+U)" },
    { icon: Link, command: "createLink", title: "Insert Link", requiresValue: true },
    { icon: Heading1, command: "formatBlock", value: "h1", title: "Heading 1" },
    { icon: Heading2, command: "formatBlock", value: "h2", title: "Heading 2" },
    { icon: Heading3, command: "formatBlock", value: "h3", title: "Heading 3" },
    { icon: List, command: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
    { icon: Quote, command: "formatBlock", value: "blockquote", title: "Quote" },
    { icon: Code, command: "formatBlock", value: "pre", title: "Code Block" },
  ]

  return (
    <div className="h-full flex flex-col bg-white ">
      {/* Editor Container */}
      <div className="flex-1 overflow-y-auto">
        <div className=" px-8 py-12">
          {/* Title Input */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="Enter your title here..."
            className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden leading-tight mb-8"
            rows={1}
          />

          {/* Floating Toolbar */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center space-x-1">
            {toolbarButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (button.requiresValue) {
                      const url = prompt("Enter URL:")
                      if (url) formatText(button.command, url)
                    } else {
                      formatText(button.command, button.value)
                    }
                  }}
                  className="p-2 rounded hover:bg-gray-100 duration-200"
                  title={button.title}
                >
                  <Icon className="w-4 h-4 dark:text-gray-400" />
                </button>
              )
            })}
          </div>

          {/* Content Editor */}
          <div
            ref={contentRef}
            contentEditable
            onInput={handleContentChange}
            onFocus={() => setIsToolbarVisible(true)}
            onBlur={() => setTimeout(() => setIsToolbarVisible(false), 200)}
            className="min-h-96 text-lg outline-none prose prose-lg max-w-none mt-10"
            style={{ wordBreak: "break-word" }}
            suppressContentEditableWarning={true}
            placeholder="Start writing your story..."
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-6 text-xs text-gray-500">
        <div>Last saved: Just now</div>
        {/* <div className="flex items-center space-x-4">
          <span>Auto-save enabled</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div> */}
      </div>
    </div>
  )
}

export default RichTextEditor
