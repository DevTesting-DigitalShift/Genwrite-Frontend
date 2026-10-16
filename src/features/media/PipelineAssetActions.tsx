import { AlertTriangle, Film, RotateCcw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { useMediaPricing } from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaPipelineQuery } from "@api/Media/MediaPipeline.query"
import { resolveModelForMode } from "./mediaModes"
import { estimatePipelineCredits } from "./pipelinePricing"

/**
 * Preview-modal extras for a video delivered by an Auto Video run: the user's original idea
 * (the asset's own prompt is the auto-refined motion prompt), what the run cost, a warning if
 * the automatic check never passed it, and the manual Regenerate fallback. Regenerate is
 * always offered — the automated QA filters the worst failures but can't catch everything.
 */
export function PipelineAssetActions({
  pipelineId,
  onStarted,
}: {
  pipelineId: string
  onStarted?: () => void
}) {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { handlePopup } = useConfirmPopup()
  const { media: mediaCatalogue } = useMediaPricing()
  const { data: pipeline } = mediaPipelineQuery.useDetail(pipelineId)
  const regenerate = mediaPipelineQuery.useRegenerate({
    onSuccess: () => {
      loadAuthenticatedUser()
      toast.success("Regenerating — we'll notify you when it's ready")
      onStarted?.()
    },
    onError: (err) => toast.error(err.message || "Failed to regenerate"),
  })

  if (!pipeline) return null

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
  // A run made on a model that has since been removed restarts on its mode's cheapest one (the
  // backend does the same), so that's the model to price.
  const priceModel = resolveModelForMode(
    mediaCatalogue,
    pipeline.productImageUrls.length > 0 ? "reference_to_video" : "image_to_video",
    pipeline.videoModel
  )
  const priceOf = (includeFrames: boolean) =>
    priceModel
      ? estimatePipelineCredits(mediaCatalogue, {
          videoModel: priceModel.id,
          durationSeconds: pipeline.durationSeconds,
          resolution: pipeline.resolution,
          useEndFrame: pipeline.useEndFrame,
          subtitles: Boolean(pipeline.subtitles?.style),
          productImages: pipeline.productImageUrls.length,
          includeFrames,
        })
      : null

  const confirm = (mode: "video" | "full") => {
    const price = priceOf(mode === "full")
    if (price === null) {
      toast.error("Prices aren't available right now — try again in a moment")
      return
    }
    const short = userCredits < price
    handlePopup({
      title: mode === "video" ? "Regenerate the video?" : "Start over?",
      description: short
        ? `This costs ${price} credits, but you have ${userCredits}.`
        : mode === "video"
          ? `Keeps the same ${pipeline.useEndFrame ? "opening and closing frames" : "opening frame"} and re-animates it, with the automatic check and retry. Costs ${price} credits.`
          : `Starts again from your prompt with new frames. Costs ${price} credits.`,
      confirmText: mode === "video" ? "Regenerate video" : "Start over",
      confirmProps: { disabled: short },
      onConfirm: () => regenerate.mutate({ id: pipeline._id, mode }),
    })
  }

  return (
    <div className="space-y-3">
      {pipeline.qaWarning && (
        <div className="flex gap-2.5 rounded-xl bg-amber-50 p-3 text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed">
            Our automatic check found possible defects in this video, even after a retry.
            Regenerating it often helps.
          </p>
        </div>
      )}

      <section>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Your idea
        </h3>
        <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
          {pipeline.userPrompt}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
          <Sparkles size={11} className="text-[#4C5BD6]" />
          Auto Video · {pipeline.creditCost} credits for the whole run
          {pipeline.resolution ? ` · ${pipeline.resolution}` : ""}
        </p>
        {pipeline.unsubtitledVideoUrl && (
          <a
            href={pipeline.unsubtitledVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-block text-[11px] font-semibold text-[#4C5BD6] hover:underline"
          >
            Download without subtitles
          </a>
        )}
        {pipeline.subtitles?.status === "failed" && (
          <p className="mt-1.5 text-[11px] text-amber-700">
            Subtitles couldn't be added to this video — the subtitle cost was refunded.
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => confirm("video")}
          disabled={regenerate.isPending}
          className="btn h-11 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          <Film size={15} /> Regenerate video
        </button>
        <button
          type="button"
          onClick={() => confirm("full")}
          disabled={regenerate.isPending}
          className="btn h-11 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={15} /> Start over
        </button>
      </div>
    </div>
  )
}
