import React, { useState } from "react"
import { Switch, Tooltip } from "antd"
import { FileText, Layout } from "lucide-react"
import TipTapEditor from "../layout/TextEditor/TipTapEditor"
import TextEditor from "./TextEditor"

/**
 * EditorVersionWrapper - Manages switching between two editor versions
 * @param {Object} props
 * @param {Object} props.blog - Blog data
 * @param {number} props.textVersion - Version from backend (1 = TipTap, 2 = Section Editor)
 * @param {string} props.content - Blog content
 * @param {Function} props.setContent - Content setter
 * @param {boolean} props.unsavedChanges - Unsaved changes flag
 * @param {Function} props.setUnsavedChanges - Unsaved changes setter
 * @param {Object} props.editorProps - Additional props to pass to editors
 */
const EditorVersionWrapper = ({
  blog,
  textVersion = 2, // Default to section editor
  currentVersion,
  onVersionChange,
  content,
  setContent,
  unsavedChanges,
  setUnsavedChanges,
  ...editorProps
}) => {
  // Controlled vs Uncontrolled logic
  const isControlled = currentVersion !== undefined
  // For uncontrolled usage (fallback)
  const [internalVersion, setInternalVersion] = useState(textVersion)

  // Determine active version
  const activeVersion = isControlled ? currentVersion : internalVersion

  const handleVersionToggle = checked => {
    const newVer = checked ? 1 : 2
    if (isControlled) {
      onVersionChange && onVersionChange(newVer)
    } else {
      setInternalVersion(newVer)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Content */}
      <div className="flex-1">
        <TipTapEditor
          blog={blog}
          content={content}
          setContent={setContent}
          unsavedChanges={unsavedChanges}
          setUnsavedChanges={setUnsavedChanges}
          {...editorProps}
        />
      </div>
    </div>
  )
}

export default EditorVersionWrapper
