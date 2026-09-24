import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import usePricingStore from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaPipelineQuery } from "@api/Media/MediaPipeline.query"
import type { CreateMediaPipelinePayload } from "@api/Media/MediaPipeline.api"
import { PURPOSES, type MediaModel, type Purpose } from "./mediaOptions"
import { estimatePipelineCredits, type AspectRatio } from "./pipelinePricing"

const ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: "16:9", label: "Landscape 16:9" },
  { id: "9:16", label: "Vertical 9:16" },
]

/**
 * Media Studio's "Auto Video" form: one prompt in, one quality-checked video out. Everything
 * between (prompt refinement, candidate frames, automated QA, the retry) runs server-side —
 * see src/modules/media/pipeline/ on the backend — and progress shows in PipelineRuns.
 */
export function AutoVideoForm() {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const mediaCatalogue = usePricingStore((s) => s.catalogue.media)

  // Only first/last-frame models can run this flow — the catalogue marks them with frameVideo.
  const models = useMemo<MediaModel[]>(
    () =>
      Object.entries(mediaCatalogue)
        .filter(([, m]) => m.frameVideo)
        .map(([id, m]) => ({ id, ...m })),
    [mediaCatalogue]
  )

  const [modelId, setModelId] = useState("")
  const [duration, setDuration] = useState<number | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [purpose, setPurpose] = useState<Purpose>("reel")
  const [prompt, setPrompt] = useState("")

  const model = models.find((m) => m.id === modelId) ?? models[0]
  const durations = model?.frameVideo?.durations ?? []
  // The picked duration may not exist on a newly picked model — fall back to its first.
  const durationSeconds =
    duration !== null && durations.includes(duration) ? duration : (durations[0] ?? 5)

  const price = model
    ? estimatePipelineCredits(mediaCatalogue, {
        videoModel: model.id,
        durationSeconds,
        aspectRatio,
      })
    : 0
  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const create = mediaPipelineQuery.useCreate({
    onSuccess: () => {
      setPrompt("")
      loadAuthenticatedUser()
      toast.success("Video generation started — usually ready in 5–10 minutes", {
        description:
          "We'll check the frames and the video for defects and retry automatically if needed.",
      })
    },
    onError: (err) => toast.error(err.message || "Failed to start video generation"),
  })

  const handleGenerate = () => {
    if (prompt.trim().length < 3) {
      toast.error("Prompt must be at least 3 characters")
      return
    }
    if (!model) return
    if (userCredits < price) {
      handlePopup({
        title: "Insufficient Credits",
        description: `This video costs ${price} credits. You have ${userCredits}.`,
        confirmText: "Get Credits",
        onConfirm: () => navigate("/pricing"),
      })
      return
    }
    create.mutate({
      prompt: prompt.trim(),
      videoModel: model.id,
      durationSeconds,
      aspectRatio,
      purpose,
    } as CreateMediaPipelinePayload)
  }

  if (models.length === 0) {
    return <p className="text-sm text-slate-500">Auto Video isn't available right now.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-6">
        <div className="form-control w-full">
          <label htmlFor="auto-video-model" className="label">
            <span className="label-text font-semibold">Model</span>
          </label>
          <select
            id="auto-video-model"
            className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
            value={model?.id ?? ""}
            onChange={(e) => setModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label.replace(" (Frames)", "")}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control w-full">
          <label htmlFor="auto-video-duration" className="label">
            <span className="label-text font-semibold">Duration</span>
          </label>
          <select
            id="auto-video-duration"
            className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
            value={durationSeconds}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={durations.length <= 1}
          >
            {durations.map((d) => (
              <option key={d} value={d}>
                {d} seconds
              </option>
            ))}
          </select>
        </div>

        <div className="form-control w-full">
          <label htmlFor="auto-video-aspect" className="label">
            <span className="label-text font-semibold">Format</span>
          </label>
          <select
            id="auto-video-aspect"
            className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
          >
            {ASPECT_RATIOS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control w-full">
          <label htmlFor="auto-video-purpose" className="label">
            <span className="label-text font-semibold">Purpose</span>
          </label>
          <select
            id="auto-video-purpose"
            className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as Purpose)}
          >
            {PURPOSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <label htmlFor="auto-video-prompt" className="label">
          <span className="label-text font-semibold">
            Describe your video <span className="text-rose-500 text-lg">*</span>
          </span>
        </label>
        <textarea
          id="auto-video-prompt"
          className="textarea w-full min-h-30 sm:min-h-35 rounded-2xl p-4 sm:p-6 outline-0 border border-slate-200 bg-slate-50 resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={2000}
          placeholder="e.g. A barista pouring latte art in a sunlit cafe, slow push-in"
        />
      </div>

      <div className="mb-5 sm:mb-6 flex gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs leading-relaxed text-slate-600">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#4C5BD6]" />
        <p>
          We expand your idea into a detailed shot, generate several opening and closing frames, and
          keep the ones that pass an automatic quality check before animating them. If the video
          shows defects, we retry once at no extra cost. On-screen text is avoided on purpose,
          because AI video often garbles it.
        </p>
      </div>

      <div className="pt-5 sm:pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
          <Sparkles size={14} className="text-[#4C5BD6]" />
          Price: <span className="text-slate-900">{price} credits</span>
          <span className="font-medium text-slate-400">(includes the automatic retry)</span>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={create.isPending}
          className="btn btn-primary w-full sm:w-auto px-8 py-3 bg-[#4C5BD6] hover:bg-[#3B4BB8] rounded-lg border-0 shadow-none sm:shadow-lg sm:shadow-[#4C5BD6]/20 text-white font-bold text-base transition-all scale-100 hover:scale-[1.02] disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Video"}
        </button>
      </div>
    </>
  )
}
