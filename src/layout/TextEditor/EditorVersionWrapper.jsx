import React, { useState } from "react"
import { Switch, Tooltip } from "antd"
import { FileText, Layout } from "lucide-react"
import TipTapEditor from "./TipTapEditor"
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
  content,
  setContent,
  unsavedChanges,
  setUnsavedChanges,
  ...editorProps
}) => {
  // For testing: allow manual toggle (will be removed when backend integration is complete)
  const [manualVersion, setManualVersion] = useState(textVersion)
  const currentVersion = manualVersion

  const handleVersionToggle = checked => {
    setManualVersion(checked ? 1 : 2)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Version Toggle - For Testing Only */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Layout className="w-4 h-4 text-purple-600" />
              <span>Editor Version:</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-purple-200">
              <span
                className={`text-xs font-medium transition-colors ${
                  currentVersion === 2 ? "text-purple-600" : "text-gray-400"
                }`}
              >
                Section Editor
              </span>
              <Tooltip title="Toggle between TipTap Editor (v1) and Section Editor (v2)">
                <Switch
                  checked={currentVersion === 1}
                  onChange={handleVersionToggle}
                  size="small"
                  checkedChildren={<FileText className="w-3 h-3" />}
                  unCheckedChildren={<Layout className="w-3 h-3" />}
                />
              </Tooltip>
              <span
                className={`text-xs font-medium transition-colors ${
                  currentVersion === 1 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                TipTap Editor
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">
              Testing Mode
            </span>
            <span>Backend Version: {textVersion}</span>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        {currentVersion === 1 ? (
          <TipTapEditor
            blog={blog}
            content={content}
            setContent={setContent}
            unsavedChanges={unsavedChanges}
            setUnsavedChanges={setUnsavedChanges}
            {...editorProps}
          />
        ) : (
          <TextEditor
            blog={blog}
            content={content}
            setContent={setContent}
            unsavedChanges={unsavedChanges}
            setUnsavedChanges={setUnsavedChanges}
            {...editorProps}
          />
        )}
      </div>
    </div>
  )
}

export default EditorVersionWrapper
