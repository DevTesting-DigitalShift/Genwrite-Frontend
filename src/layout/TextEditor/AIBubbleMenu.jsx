import React, { useEffect, useState, useRef, useMemo } from "react"
import axiosInstance from "@/api"
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued"
import TurndownService from "turndown"
import { Sparkles, FileCheck, MessageSquare, Loader2 } from "lucide-react"
import { Tooltip, message, Modal, Input } from "antd"

// AI Bubble Menu Component - Custom implementation without TipTap BubbleMenu
const AIBubbleMenu = ({ editor, blogId, sectionId, onContentUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)

  // AI Result modal state
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false)
  const [originalContent, setOriginalContent] = useState("")
  const [newContent, setNewContent] = useState("")
  const [currentOperation, setCurrentOperation] = useState("")
  const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 })

  // Helper to convert HTML to Markdown for clean diff viewing
  const htmlToMarkdown = html => {
    if (!html) return ""
    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    })
    turndownService.keep(["table", "tr", "td", "th"])
    return turndownService.turndown(html)
  }

  const oldMarkdown = useMemo(() => htmlToMarkdown(originalContent), [originalContent])
  const newMarkdown = useMemo(() => htmlToMarkdown(newContent), [newContent])

  // Track selection changes and position the menu
  useEffect(() => {
    if (!editor) return

    const updateMenu = () => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, " ")

      if (text.trim().length > 0) {
        setSelectedText(text)
        setSelectionRange({ from, to })

        // Get selection coordinates
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()

          setMenuPosition({
            top: rect.top - 60, // Position above selection
            left: rect.left + rect.width / 2 - 150, // Center the menu
          })
          setShowMenu(true)
        }
      } else {
        setShowMenu(false)
      }
    }

    // Listen to selection updates
    editor.on("selectionUpdate", updateMenu)
    editor.on("update", updateMenu)

    return () => {
      editor.off("selectionUpdate", updateMenu)
      editor.off("update", updateMenu)
    }
  }, [editor])

  const handleAIOperation = async (operation, userInstructions = "") => {
    if (!blogId || !sectionId) {
      message.error("Blog ID or Section ID not found")
      return
    }

    const { from, to } = editor.state.selection
    const selectedContent = editor.state.doc.textBetween(from, to, " ")

    if (!selectedContent.trim()) {
      message.warning("Please select some text first")
      return
    }

    setIsProcessing(true)
    try {
      const response = await axiosInstance.post(`/blogs/${blogId}/sectionTask`, {
        sectionId: sectionId,
        task: operation,
        userInstructions: userInstructions,
        selectedText: selectedContent, // Send only selected text
      })

      if (response.data?.content) {
        // Store original and new content for comparison
        setOriginalContent(selectedContent)
        setNewContent(response.data.content)
        setCurrentOperation(operation)
        setAiResultModalOpen(true)
        setShowMenu(false)
        message.success(`${operation} completed! Review the changes.`)
      }
    } catch (error) {
      console.error("AI Operation Error:", error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to ${operation}. Please try again.`
      message.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setShowCustomPrompt(false)
      setCustomPrompt("")
    }
  }

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) {
      message.warning("Please enter a prompt")
      return
    }
    handleAIOperation("promptChanges", customPrompt)
  }

  // Handle accepting AI changes
  const handleAcceptAIChanges = () => {
    const { from, to } = selectionRange

    // Replace selected text with AI-generated content
    editor.chain().focus().deleteRange({ from, to }).insertContent(newContent).run()

    if (onContentUpdate) {
      onContentUpdate(editor.getHTML())
    }

    setAiResultModalOpen(false)
    message.success("Changes applied successfully!")
    // Reset state
    setOriginalContent("")
    setNewContent("")
    setCurrentOperation("")
  }

  // Handle declining AI changes
  const handleDeclineAIChanges = () => {
    setAiResultModalOpen(false)
    message.info("Changes discarded")
    // Reset state
    setOriginalContent("")
    setNewContent("")
    setCurrentOperation("")
  }

  if (!editor || !showMenu) {
    return (
      <>
        {/* AI Result Comparison Modal */}
        {aiResultModalOpen && (
          <Modal
            title={
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Review AI Changes - {currentOperation}</span>
              </div>
            }
            open={aiResultModalOpen}
            onCancel={handleDeclineAIChanges}
            footer={[
              <button
                key="decline"
                onClick={handleDeclineAIChanges}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Decline
              </button>,
              <button
                key="accept"
                onClick={handleAcceptAIChanges}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-2"
              >
                Accept Changes
              </button>,
            ]}
            width={1000}
            centered
            className="section-ai-diff-modal"
          >
            <div className="space-y-4">
              <div className="border rounded-lg overflow-y-auto max-h-[70vh]">
                <ReactDiffViewer
                  oldValue={oldMarkdown}
                  newValue={newMarkdown}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS}
                  leftTitle="Original Content"
                  rightTitle="AI Generated Content"
                  useDarkTheme={false}
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: "#ffffff",
                        addedBackground: "#e6ffec",
                        addedColor: "#1a7f37",
                        removedBackground: "#ffebe9",
                        removedColor: "#cf222e",
                        wordAddedBackground: "#abf2bc",
                        wordRemovedBackground: "#ffc1c0",
                      },
                    },
                    line: { fontSize: "14px", lineHeight: "1.6" },
                  }}
                />
              </div>
            </div>
          </Modal>
        )}
      </>
    )
  }

  return (
    <>
      {/* Floating Bubble Menu */}
      <div
        ref={menuRef}
        className="fixed z-[9999] flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
        style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        onMouseDown={e => e.preventDefault()} // Prevent losing selection
      >
        {isProcessing ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        ) : (
          <>
            <Tooltip title="Rewrite selected text with AI">
              <button
                onClick={() => handleAIOperation("rewrite")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Rewrite</span>
              </button>
            </Tooltip>

            <Tooltip title="Proofread and fix errors">
              <button
                onClick={() => handleAIOperation("proofread")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                <span className="font-medium">Proofread</span>
              </button>
            </Tooltip>

            <Tooltip title="Custom AI prompt">
              <button
                onClick={() => setShowCustomPrompt(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Custom Prompt</span>
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Custom Prompt Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Custom AI Prompt for Selected Text</span>
          </div>
        }
        open={showCustomPrompt}
        onCancel={() => {
          setShowCustomPrompt(false)
          setCustomPrompt("")
        }}
        footer={[
          <button
            key="cancel"
            onClick={() => {
              setShowCustomPrompt(false)
              setCustomPrompt("")
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>,
          <button
            key="submit"
            onClick={handleCustomPromptSubmit}
            disabled={!customPrompt.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          >
            {isProcessing ? "Processing..." : "Apply Changes"}
          </button>,
        ]}
        width={520}
      >
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Selected Text:</p>
            <p className="text-sm text-gray-800 line-clamp-3">{selectedText}</p>
          </div>

          <p className="text-sm text-gray-600">
            Enter your custom instructions for how you want to modify the selected text:
          </p>

          <Input.TextArea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="E.g., Make it more professional, add statistics, simplify the language..."
            rows={4}
            maxLength={2000}
            showCount
            autoFocus
          />

          <p className="text-xs text-gray-500">
            💡 Tip: Be specific about what changes you want to see in the selected text.
          </p>
        </div>
      </Modal>

      {/* AI Result Comparison Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Review AI Changes - {currentOperation}</span>
          </div>
        }
        open={aiResultModalOpen}
        onCancel={handleDeclineAIChanges}
        footer={[
          <button
            key="decline"
            onClick={handleDeclineAIChanges}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>,
          <button
            key="accept"
            onClick={handleAcceptAIChanges}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-2"
          >
            Accept Changes
          </button>,
        ]}
        width={1000}
        centered
        className="section-ai-diff-modal"
      >
        <div className="space-y-4">
          <div className="border rounded-lg overflow-y-auto max-h-[70vh]">
            <ReactDiffViewer
              oldValue={oldMarkdown}
              newValue={newMarkdown}
              splitView={true}
              compareMethod={DiffMethod.WORDS}
              leftTitle="Original Content"
              rightTitle="AI Generated Content"
              useDarkTheme={false}
              styles={{
                variables: {
                  light: {
                    diffViewerBackground: "#ffffff",
                    addedBackground: "#e6ffec",
                    addedColor: "#1a7f37",
                    removedBackground: "#ffebe9",
                    removedColor: "#cf222e",
                    wordAddedBackground: "#abf2bc",
                    wordRemovedBackground: "#ffc1c0",
                  },
                },
                line: { fontSize: "14px", lineHeight: "1.6" },
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export { AIBubbleMenu }
