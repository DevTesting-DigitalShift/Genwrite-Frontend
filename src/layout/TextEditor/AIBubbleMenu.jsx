import React, { useEffect, useState, useRef, useMemo } from "react"
import axiosInstance from "@/api"
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued"
import TurndownService from "turndown"
import { marked } from "marked"
import { DOMSerializer } from "@tiptap/pm/model"
import { Sparkles, Loader2 } from "lucide-react"
import toast from "@utils/toast"

// AI Bubble Menu Component - Custom implementation without TipTap BubbleMenu
const AIBubbleMenu = ({ editor, blogId, sectionId, onContentUpdate, children }) => {
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleAIOperation = async operation => {
    if (!blogId) {
      toast.error("Blog ID not found")
      return
    }

    const { from, to } = editor.state.selection

    // Extract HTML content from selection using TipTap's DOMSerializer
    const selectedFragment = editor.state.doc.slice(from, to)

    // Create a temporary div to serialize the fragment
    const tempDiv = document.createElement("div")
    const serializer = DOMSerializer.fromSchema(editor.schema)

    selectedFragment.content.forEach(node => {
      tempDiv.appendChild(serializer.serializeNode(node))
    })

    const selectedHtmlContent = tempDiv.innerHTML

    if (!selectedHtmlContent.trim()) {
      toast.warning("Please select some text first")
      return
    }

    // Convert HTML to Markdown before sending to API
    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    })
    turndownService.keep(["table", "tr", "td", "th"])
    const markdownContent = turndownService.turndown(selectedHtmlContent)

    setIsProcessing(true)
    try {
      // Call the rewrite endpoint
      const response = await axiosInstance.post(`/blogs/${blogId}/rewrite`, {
        contentPart: markdownContent, // Send markdown content
      })

      if (response.data) {
        // The API returns markdown, convert it back to HTML
        const markdownResponse =
          typeof response.data === "string"
            ? response.data
            : response.data.content || response.data.message || ""
        const htmlResponse = await marked.parse(markdownResponse)

        // Store original HTML and new HTML for comparison
        setOriginalContent(selectedHtmlContent)
        setNewContent(htmlResponse)
        setCurrentOperation(operation)
        setAiResultModalOpen(true)
        setShowMenu(false)
        toast.success(`${operation} completed! Review the changes.`)
      }
    } catch (error) {
      console.error("AI Operation Error:", error)

      // Handle 402 Insufficient Credits error specifically
      if (error.response?.status === 402) {
        const neededCredits = error.response?.data?.neededCredits
        const errorMsg = neededCredits
          ? `Insufficient credits. You need ${neededCredits} credits to perform this operation.`
          : "Insufficient credits to perform this operation. Please add more credits."
        toast.error(errorMsg)
      } else {
        // Handle other errors
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          `Failed to ${operation}. Please try again.`
        toast.error(errorMessage)
      }
    } finally {
      setIsProcessing(false)
    }
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
    toast.success("Changes applied successfully!")
    // Reset state
    setOriginalContent("")
    setNewContent("")
    setCurrentOperation("")
  }

  // Handle declining AI changes
  const handleDeclineAIChanges = () => {
    setAiResultModalOpen(false)
    toast.info("Changes discarded")
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
          <div className="modal modal-open z-9999">
            <div className="modal-box w-11/12 max-w-5xl h-[80vh] flex flex-col p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Review AI Changes - {currentOperation}
                </h3>
                <button
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={handleDeclineAIChanges}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 custom-scroll">
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

              <div className="modal-action p-4 border-t mt-0 bg-gray-50 flex justify-end gap-2">
                <button onClick={handleDeclineAIChanges} className="btn btn-ghost">
                  Decline
                </button>
                <button onClick={handleAcceptAIChanges} className="btn btn-success text-white">
                  Accept Changes
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={handleDeclineAIChanges}>close</button>
            </form>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Floating Bubble Menu */}
      <div
        ref={menuRef}
        className="fixed z-9999 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
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
            {children && (
              <>
                {children}
                <div className="w-px h-5 bg-gray-200 mx-1" />
              </>
            )}
            <div className="tooltip tooltip-bottom" data-tip="Rewrite selected text with AI">
              <button
                onClick={() => handleAIOperation("rewrite")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                disabled={isProcessing}
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Rewrite</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* AI Result Comparison Modal - duplicated outside just in case but controlled by same state */}
      {aiResultModalOpen && (
        <div className="modal modal-open z-9999">
          <div className="modal-box w-11/12 max-w-5xl h-[80vh] flex flex-col p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Review AI Changes - {currentOperation}
              </h3>
              <button className="btn btn-sm btn-circle btn-ghost" onClick={handleDeclineAIChanges}>
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 custom-scroll">
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

            <div className="modal-action p-4 border-t mt-0 bg-gray-50 flex justify-end gap-2">
              <button onClick={handleDeclineAIChanges} className="btn btn-ghost">
                Decline
              </button>
              <button onClick={handleAcceptAIChanges} className="btn btn-success text-white">
                Accept Changes
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleDeclineAIChanges}>close</button>
          </form>
        </div>
      )}
    </>
  )
}

export { AIBubbleMenu }
