import React, { useEffect, useState, useRef, useMemo } from "react"
import axiosInstance from "@/api"
import { Sparkles, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { marked } from "marked"
import { DOMSerializer } from "@tiptap/pm/model"
import TurndownService from "turndown"
import ContentDiffViewer from "../Editor/ContentDiffViewer"

// AI Bubble Menu Component - Custom implementation without TipTap BubbleMenu
const AIBubbleMenu = ({ editor, blogId, isArchived, sectionId, onContentUpdate, children }) => {
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

  // Track selection changes and position the menu
  useEffect(() => {
    if (!editor) return

    const updateMenu = () => {
      // Never show menu if blog is archived
      if (isArchived) {
        setShowMenu(false)
        return
      }

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

    if (isArchived) {
      setShowMenu(false)
    }

    return () => {
      editor.off("selectionUpdate", updateMenu)
      editor.off("update", updateMenu)
    }
  }, [editor, isArchived])

  const handleAIOperation = async operation => {
    if (!blogId) {
      toast.error("Blog ID not found")
      return
    }

    let { from, to } = editor.state.selection

    // Expand selection to encompass full block nodes
    const $from = editor.state.doc.resolve(from)
    const $to = editor.state.doc.resolve(to)

    let expandFrom = from
    let expandTo = to

    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).isBlock) {
        expandFrom = $from.before(d)
        break
      }
    }

    for (let d = $to.depth; d > 0; d--) {
      if ($to.node(d).isBlock) {
        expandTo = $to.after(d)
        break
      }
    }

    setSelectionRange({ from: expandFrom, to: expandTo })

    // Extract HTML content comprehensively from TipTap
    const selectedFragment = editor.state.doc.slice(expandFrom, expandTo)
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

    // Map to markdown for API
    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    })
    turndownService.keep(["table", "tr", "td", "th"])
    const markdownContent = turndownService.turndown(selectedHtmlContent)

    setIsProcessing(true)
    try {
      const response = await axiosInstance.post(`/blogs/${blogId}/rewrite`, {
        contentPart: markdownContent,
      })

      if (response.data) {
        const markdownResponse =
          typeof response.data === "string"
            ? response.data
            : response.data.content || response.data.message || ""
        const htmlResponse = await marked.parse(markdownResponse)

        setOriginalContent(selectedHtmlContent)
        setNewContent(htmlResponse)
        setCurrentOperation(operation)
        setAiResultModalOpen(true)
        setShowMenu(false)
        toast.success(`${operation} completed! Review the changes.`)
      }
    } catch (error) {
      console.error("AI Operation Error:", error)
      if (error.response?.status === 402) {
        const neededCredits = error.response?.data?.neededCredits
        toast.error(`Insufficient credits. You need ${neededCredits || ""} credits to perform this operation.`)
      } else {
        toast.error(error.response?.data?.message || error.message || `Failed to ${operation}.`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAcceptAIChanges = () => {
    const { from, to } = selectionRange
    editor.chain().focus().deleteRange({ from, to }).insertContent(newContent).run()
    if (onContentUpdate) onContentUpdate(editor.getHTML())
    setAiResultModalOpen(false)
    toast.success("Changes applied successfully!")
    resetState()
  }

  const handleDeclineAIChanges = () => {
    setAiResultModalOpen(false)
    toast.info("Changes discarded")
    resetState()
  }

  const resetState = () => {
    setOriginalContent("")
    setNewContent("")
    setCurrentOperation("")
  }

  return (
    <>
      {/* Floating Bubble Menu */}
      {showMenu && !aiResultModalOpen && (
        <div
          ref={menuRef}
          className="fixed z-9999 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          onMouseDown={e => e.preventDefault()}
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
      )}

      {/* AI Result Comparison Modal */}
      {aiResultModalOpen && (
        <div className="modal modal-open z-9999">
          <div className="modal-box w-11/12 max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-gray-100 shadow-2xl bg-white">
            <div className="flex items-center justify-between p-5 px-8 border-b border-gray-50 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tight">Review AI Changes</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Processing: {currentOperation}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                      AI GENERATED
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                onClick={handleDeclineAIChanges}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-0 pb-6 sm:p-0 sm:pb-6 bg-slate-50/50">
              <ContentDiffViewer
                oldMarkdown={originalContent}
                newMarkdown={newContent}
                onAccept={handleAcceptAIChanges}
                onReject={handleDeclineAIChanges}
                acceptLabel="Accept & Apply"
                rejectLabel="Decline Changes"
              />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-slate-900/60 backdrop-blur-md">
            <button onClick={handleDeclineAIChanges}>close</button>
          </form>
        </div>
      )}
    </>
  )
}

export { AIBubbleMenu }


