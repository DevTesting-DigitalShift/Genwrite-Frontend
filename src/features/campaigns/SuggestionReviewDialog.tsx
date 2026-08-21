import { useState } from "react"
import type { ComponentType, ReactNode } from "react"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog"
import { Button } from "@components/ui/button"
import ContentDiffViewerUntyped from "@/layout/Editor/ContentDiffViewer"
import {
  useBlogDetailsQuery,
  useApplyInsightMutation as useApplyInsightUntyped,
  useConfirmInsightMutation as useConfirmInsightUntyped,
} from "@api/queries/blogQueries"
import { COSTS } from "@/data/blogData"
import { useCreditConfirm } from "./useCreditConfirm"
import { PanelError, PanelLoading } from "./CampaignStates"
import type { CampaignLiveSuggestion } from "@/types/campaign"

// blogQueries is untyped JS, so TS infers `void` mutation variables — pin the shapes
// the BlogInsight endpoints actually take.
type MutationHandle<TVars, TResult> = () => {
  mutateAsync: (vars: TVars) => Promise<TResult>
  isPending: boolean
}

const useApplyInsightMutation = useApplyInsightUntyped as unknown as MutationHandle<
  { id: string; suggestionId: string; scope?: "section" | "whole" },
  { content: string; suggestionId: string; scope: string }
>

const useConfirmInsightMutation = useConfirmInsightUntyped as unknown as MutationHandle<
  { id: string; suggestionId: string; content: string; republish?: boolean },
  { content: string }
>

const ContentDiffViewer = ContentDiffViewerUntyped as ComponentType<{
  oldMarkdown: string
  newMarkdown: string
  onAccept?: () => void
  onReject?: () => void
  acceptLabel?: string
  rejectLabel?: string
}>

interface SuggestionReviewDialogProps {
  suggestion: CampaignLiveSuggestion | null
  blogTitle: string
  onClose: () => void
  /** Fired after a rewrite is committed, so the caller can refresh its lists. */
  onApplied: () => void
}

/**
 * Review-then-commit for a campaign suggestion, mirroring the editor's BlogInsight
 * flow: generating the rewrite spends credits but changes nothing, and the blog is
 * only rewritten once the user accepts the diff.
 */
export function SuggestionReviewDialog({
  suggestion,
  blogTitle,
  onClose,
  onApplied,
}: SuggestionReviewDialogProps) {
  const [rewrite, setRewrite] = useState<string | null>(null)
  const { confirmSpend } = useCreditConfirm()

  const blogId = suggestion?.blogId ?? ""
  const { data: blog, isLoading: isBlogLoading, isError: isBlogError } = useBlogDetailsQuery(blogId)
  const applyMutation = useApplyInsightMutation()
  const confirmMutation = useConfirmInsightMutation()

  const handleGenerate = () => {
    if (!suggestion) return
    confirmSpend({
      title: "Generate rewrite",
      description: `We'll rewrite "${suggestion.sectionTitle}" in ${blogTitle}. Nothing is saved until you accept the result.`,
      cost: COSTS.BLOG_INSIGHT.APPLY,
      confirmText: "Generate",
      onConfirm: async () => {
        try {
          const result = await applyMutation.mutateAsync({
            id: suggestion.blogId,
            suggestionId: suggestion.suggestionId,
            scope: "section",
          })
          setRewrite(result?.content ?? "")
        } catch {
          // useApplyInsightMutation already toasts the failure.
        }
      },
    })
  }

  const handleAccept = async () => {
    if (!suggestion || rewrite == null) return
    try {
      await confirmMutation.mutateAsync({
        id: suggestion.blogId,
        suggestionId: suggestion.suggestionId,
        content: rewrite,
        republish: false,
      })
      toast.success("Rewrite applied to the blog")
      onApplied()
      onClose()
    } catch {
      // useConfirmInsightMutation already toasts the failure.
    }
  }

  let body: ReactNode
  if (!suggestion) {
    body = null
  } else if (isBlogLoading) {
    body = <PanelLoading label="Loading the blog…" />
  } else if (isBlogError || !blog) {
    body = <PanelError title="Couldn't load this blog" description="It may have been deleted." />
  } else if (rewrite == null) {
    body = (
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl bg-muted/40 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Issue
            </p>
            <p className="mt-1 text-sm">{suggestion.issue}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommendation
            </p>
            <p className="mt-1 text-sm">{suggestion.recommendation}</p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={applyMutation.isPending}
          className="w-full sm:w-auto"
        >
          {applyMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate rewrite ({COSTS.BLOG_INSIGHT.APPLY} credits)
        </Button>
      </div>
    )
  } else {
    body = (
      <div className="space-y-3">
        {confirmMutation.isPending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Saving the rewrite…
          </p>
        )}
        <ContentDiffViewer
          oldMarkdown={blog.content ?? ""}
          newMarkdown={rewrite}
          onAccept={handleAccept}
          onReject={() => setRewrite(null)}
          acceptLabel="Apply to blog"
          rejectLabel="Discard"
        />
      </div>
    )
  }

  return (
    <Dialog
      open={!!suggestion}
      onOpenChange={(open: boolean) => {
        if (!open && !confirmMutation.isPending) onClose()
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {suggestion?.sectionTitle || "Review suggestion"}
          </DialogTitle>
          <DialogDescription className="truncate">{blogTitle}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
