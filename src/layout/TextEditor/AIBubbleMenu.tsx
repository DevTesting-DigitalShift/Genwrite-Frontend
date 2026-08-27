import { useEffect, useState, useRef } from "react"
import axiosInstance from "@/api"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { marked } from "marked"
import { DOMSerializer } from "@tiptap/pm/model"
import TurndownService from "turndown"
import useAiReviewStore from "@/store/useAiReviewStore"

// AI Bubble Menu Component - Custom implementation without TipTap BubbleMenu
const AIBubbleMenu = ({ editor, blogId, isArchived, onContentUpdate, children }) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)

  // The result is reviewed inside the editor, so this only needs to raise it.
  const openReview = useAiReviewStore((s) => s.openReview)
  const hasPendingReview = useAiReviewStore((s) => s.review !== null)

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

  const handleAIOperation = async (operation) => {
    if (!blogId) {
      toast.error("Blog ID not found")
      return
    }

    const { from, to } = editor.state.selection

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

    // Extract HTML content comprehensively from TipTap
    const selectedFragment = editor.state.doc.slice(expandFrom, expandTo)
    const tempDiv = document.createElement("div")
    const serializer = DOMSerializer.fromSchema(editor.schema)

    selectedFragment.content.forEach((node) => {
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

        setShowMenu(false)
        // Reviewed in place in the editor. The range is captured here because
        // the selection is gone by the time the user decides.
        openReview({
          title: "Review AI Changes",
          task: `Operation: ${operation}`,
          original: selectedHtmlContent,
          refined: htmlResponse,
          acceptLabel: "Accept & Apply",
          rejectLabel: "Keep Original",
          onAccept: () => {
            editor
              .chain()
              .focus()
              .deleteRange({ from: expandFrom, to: expandTo })
              .insertContent(htmlResponse)
              .run()
            if (onContentUpdate) onContentUpdate(editor.getHTML())
            toast.success("Changes applied successfully!")
          },
          onReject: () => toast.info("Changes discarded"),
        })
        toast.success(`${operation} completed! Review the changes.`)
      }
    } catch (error) {
      console.error("AI Operation Error:", error)
      if (error.response?.status === 402) {
        const neededCredits = error.response?.data?.neededCredits
        toast.error(
          `Insufficient credits. You need ${neededCredits || ""} credits to perform this operation.`
        )
      } else {
        toast.error(error.response?.data?.message || error.message || `Failed to ${operation}.`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Floating Bubble Menu */}
      {showMenu && !hasPendingReview && (
        <div
          ref={menuRef}
          // A toolbar of buttons. The mousedown handler only stops the editor selection
          // being lost on click — it is not an activation affordance of its own.
          role="toolbar"
          aria-label="AI text actions"
          className="fixed z-9999 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
                  type="button"
                  onClick={() => handleAIOperation("rewrite")}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                  disabled={isProcessing}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold">Rewrite</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export { AIBubbleMenu }
