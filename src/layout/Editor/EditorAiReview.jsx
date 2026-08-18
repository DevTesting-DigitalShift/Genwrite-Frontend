import { useEffect } from "react"
import { Sparkles, X } from "lucide-react"
import ContentDiffViewer from "./ContentDiffViewer"
import useAiReviewStore from "@/store/useAiReviewStore"

/**
 * The in-editor review surface for an AI rewrite.
 *
 * Renders over the editor's content area — not in a dialog — so the proposed
 * change sits exactly where the content it replaces lives. The TipTap instance
 * stays mounted underneath, which is what lets the accepted side settle into
 * the real editor when the split resolves.
 */
const EditorAiReview = () => {
  const review = useAiReviewStore((s) => s.review)
  const closeReview = useAiReviewStore((s) => s.closeReview)

  // Esc dismisses the same way the close button does: keep the original.
  useEffect(() => {
    if (!review) return
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return
      review.onReject?.()
      closeReview()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [review, closeReview])

  if (!review) return null

  const dismiss = () => {
    review.onReject?.()
    closeReview()
  }

  return (
    <div className="editor-ai-review-shell absolute inset-0 z-30 flex flex-col bg-white">
      <style>{`
        .editor-ai-review-shell {
          animation: editor-ai-review-in 260ms ease both;
        }
        @keyframes editor-ai-review-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .editor-ai-review-shell { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-600 rounded-xl shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-gray-900 text-base tracking-tight truncate">
              {review.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {review.task || "Nothing is saved until you accept"}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                AI REFINED
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Keep original content"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
          onClick={dismiss}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <ContentDiffViewer
          oldMarkdown={review.original}
          newMarkdown={review.refined}
          acceptLabel={review.acceptLabel || "Accept Changes"}
          rejectLabel={review.rejectLabel || "Keep Original"}
          onAccept={() => {
            review.onAccept?.()
            closeReview()
          }}
          onReject={() => {
            review.onReject?.()
            closeReview()
          }}
        />
      </div>
    </div>
  )
}

export default EditorAiReview
