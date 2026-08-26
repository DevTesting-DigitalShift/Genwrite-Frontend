import { create } from "zustand"
import { devtools } from "zustand/middleware"

/**
 * Holds the one AI rewrite that is currently awaiting a decision.
 *
 * Whichever surface ran the task (AI section tools, the selection bubble menu,
 * performance insights) raises the review here; the editor column renders it in
 * place of the content it would replace. Keeping it in a store means the diff
 * shows up inside the editor instead of in a dialog stacked on top of it, and
 * the editor instance underneath is never unmounted.
 *
 * A review carries its own commit callbacks, so each caller keeps the logic for
 * applying its own kind of change. Callbacks must close over everything they
 * need — the review outlives the render that raised it.
 */
const useAiReviewStore = create(
  devtools(
    (set) => ({
      /**
       * @type {null | {
       *   title: string,
       *   task?: string,
       *   original: string,
       *   refined: string,
       *   acceptLabel?: string,
       *   rejectLabel?: string,
       *   onAccept?: () => void,
       *   onReject?: () => void,
       * }}
       */
      review: null,

      openReview: (review) => set({ review }),

      closeReview: () => set({ review: null }),

      // Cleared on blog switch / account switch.
      reset: () => set({ review: null }),
    }),
    { name: "AiReviewStore" }
  )
)

export default useAiReviewStore
