import { Sparkles } from "lucide-react"
import ContentDiffViewer from "./ContentDiffViewer"
import useAiReviewStore from "@/store/useAiReviewStore"

/**
 * The review surface for an AI rewrite.
 *
 * Rendered as an overlay over the text editor alone: a pending rewrite stands in
 * for the editing surface, while the blog header above it, the editor sidebar
 * beside it, and the app header and nav rail all stay put and usable.
 *
 * The TipTap instance underneath stays mounted to receive the accepted side —
 * MainEditorPage marks it `invisible` meanwhile, which is what stops its sticky
 * toolbar (z-50) painting through this overlay. The low z-index here is
 * deliberate: the nav rail (z-30) expands over the content on hover and must
 * keep winning against it.
 *
 * There is no dismiss affordance: Accept and Keep Original at the foot of the
 * diff are the only ways out, so the decision is always explicit.
 */
const EditorAiReview = () => {
  const review = useAiReviewStore((s) => s.review)
  const closeReview = useAiReviewStore((s) => s.closeReview)

  if (!review) return null

  return (
    <section
      aria-label={review.title}
      className="editor-ai-review-shell absolute inset-0 z-10 flex flex-col bg-white"
    >
      <style>{`
        .editor-ai-review-shell {
          animation: editor-ai-review-in 260ms ease both;
        }
        @keyframes editor-ai-review-in {
          from { opacity: 0; transform: scale(0.995); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .editor-ai-review-shell { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white shrink-0">
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
    </section>
  )
}

export default EditorAiReview
