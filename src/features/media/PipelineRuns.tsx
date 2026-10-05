import { useMemo, useState } from "react"
import { Check, Loader2, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import usePricingStore from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaPipelineQuery } from "@api/Media/MediaPipeline.query"
import type { MediaPipeline } from "@api/Media/MediaPipeline.api"
import { estimatePipelineCredits } from "./pipelinePricing"

type Step = { stage: MediaPipeline["stage"]; label: string }

const STEPS: Step[] = [
  { stage: "refining", label: "Refining prompt" },
  { stage: "first_frames", label: "Opening frame" },
  { stage: "last_frames", label: "Closing frame" },
  { stage: "video", label: "Video + quality check" },
  { stage: "subtitles", label: "Subtitles" },
]

/** The closing-frame and subtitle steps only exist for runs that use them. */
const stepsFor = (pipeline: MediaPipeline) =>
  STEPS.filter(
    s =>
      (s.stage !== "last_frames" || pipeline.useEndFrame) &&
      (s.stage !== "subtitles" || pipeline.subtitles?.style)
  )

/** Failed runs stay on screen this long so the user sees what happened and can retry. */
const FAILED_VISIBLE_MS = 24 * 60 * 60 * 1000

function stepDetail(pipeline: MediaPipeline): string {
  if (pipeline.stage === "video") {
    return pipeline.videoAttempts > 1
      ? "The first take didn't pass our quality check, so we're retrying"
      : pipeline.useEndFrame
        ? "Animating between the two frames with sound — usually a few minutes"
        : "Animating the opening frame with sound — usually a few minutes"
  }
  if (
    (pipeline.stage === "first_frames" || pipeline.stage === "last_frames") &&
    pipeline.stageRound > 1
  ) {
    return "No candidate passed our quality check yet, so we're generating new ones"
  }
  if (pipeline.stage === "subtitles") return "Timing the captions to the speech and adding them"
  if (pipeline.stage === "refining") return "Turning your idea into a detailed shot"
  return "Generating candidates and checking them for defects"
}

function Stepper({ pipeline }: { pipeline: MediaPipeline }) {
  const steps = stepsFor(pipeline)
  const current =
    pipeline.stage === "completed" ? steps.length : steps.findIndex(s => s.stage === pipeline.stage) // -1 for "failed"
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {steps.map(({ label }, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span
              className={`flex size-4 items-center justify-center rounded-full ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-[#4C5BD6] text-white"
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {done ? (
                <Check size={10} />
              ) : active ? (
                <Loader2 size={10} className="animate-spin" />
              ) : null}
            </span>
            <span className={done || active ? "text-slate-700" : "text-slate-400"}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function FrameThumb({ url, label }: { url: string | null; label: string }) {
  return (
    <div className="w-20 sm:w-24 shrink-0">
      <div className="aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full animate-pulse bg-slate-200" />
        )}
      </div>
      <p className="mt-1 text-[10px] font-medium text-slate-400 text-center">{label}</p>
    </div>
  )
}

/**
 * Live progress for Auto Video runs that haven't landed in the library yet: every running
 * pipeline, plus recently failed ones (with a one-click retry) until dismissed. Kept current
 * by the "mediaPipeline:updated" socket event (useMediaNotifications); completed runs drop
 * out here and appear as a video in the library.
 */
export function PipelineRuns() {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { handlePopup } = useConfirmPopup()
  const mediaCatalogue = usePricingStore(s => s.catalogue.media)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())

  const { data } = mediaPipelineQuery.useList({ page: 1, limit: 10 })
  const regenerate = mediaPipelineQuery.useRegenerate({
    onSuccess: () => {
      loadAuthenticatedUser()
      toast.success("Started a new attempt")
    },
    onError: err => toast.error(err.message || "Failed to start a new attempt"),
  })

  const runs = useMemo(
    () =>
      (data?.data ?? []).filter(p => {
        if (p.stage === "completed" || dismissed.has(p._id)) return false
        if (p.stage !== "failed") return true
        return Date.now() - new Date(p.updatedAt).getTime() < FAILED_VISIBLE_MS
      }),
    [data?.data, dismissed]
  )

  if (runs.length === 0) return null

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const handleRetry = (pipeline: MediaPipeline) => {
    const price = estimatePipelineCredits(mediaCatalogue, {
      videoModel: pipeline.videoModel,
      durationSeconds: pipeline.durationSeconds,
      resolution: pipeline.resolution,
      useEndFrame: pipeline.useEndFrame,
      subtitles: Boolean(pipeline.subtitles?.style),
    })
    handlePopup({
      title: "Try again?",
      description:
        userCredits < price
          ? `A new attempt costs ${price} credits, but you have ${userCredits}.`
          : `This starts over from your prompt and costs ${price} credits (the failed run was refunded).`,
      confirmText: "Try again",
      confirmProps: { disabled: userCredits < price },
      onConfirm: () => regenerate.mutate({ id: pipeline._id, mode: "full" }),
    })
  }

  return (
    <div className="mb-6 space-y-3">
      {runs.map(pipeline => (
        <div
          key={pipeline._id}
          className="rounded-lg border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <div className="flex gap-2">
            <FrameThumb url={pipeline.firstFrameUrl} label="Opening" />
            {pipeline.useEndFrame && <FrameThumb url={pipeline.lastFrameUrl} label="Closing" />}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p
              className="text-sm font-semibold text-slate-800 line-clamp-1"
              title={pipeline.userPrompt}
            >
              {pipeline.userPrompt}
            </p>
            {pipeline.stage === "failed" ? (
              <p className="text-xs font-medium text-rose-600">
                {pipeline.errorMessage || "Generation failed"} — {pipeline.creditCost} credits
                refunded
              </p>
            ) : (
              <>
                <Stepper pipeline={pipeline} />
                <p className="text-xs text-slate-500">{stepDetail(pipeline)}</p>
              </>
            )}
          </div>

          {pipeline.stage === "failed" && (
            <div className="flex sm:flex-col gap-2 sm:justify-center">
              <button
                type="button"
                onClick={() => handleRetry(pipeline)}
                disabled={regenerate.isPending}
                className="btn btn-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Try again
              </button>
              <button
                type="button"
                onClick={() => setDismissed(prev => new Set(prev).add(pipeline._id))}
                aria-label="Dismiss"
                className="btn btn-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <X size={14} /> Dismiss
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
