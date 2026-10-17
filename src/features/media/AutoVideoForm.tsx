import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, ChevronDown, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { useMediaPricing } from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaPipelineQuery } from "@api/Media/MediaPipeline.query"
import type { CreateMediaPipelinePayload } from "@api/Media/MediaPipeline.api"
import {
  DEFAULT_RESOLUTION,
  effectiveResolution,
  estimatePipelineCredits,
  resolutionsOf,
  type AspectRatio,
  type VideoResolution,
} from "./pipelinePricing"
import { pacingAdvice } from "./scriptPacing"
import { RefinePromptButton } from "./RefinePromptButton"
import { ProductScreenshots } from "./ProductScreenshots"
import { modelsForMode } from "./mediaModes"
import { SourceImageUpload } from "./SourceImageUpload"

const ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: "16:9", label: "Landscape 16:9" },
  { id: "9:16", label: "Vertical 9:16" },
]

type SubtitleStyle = NonNullable<CreateMediaPipelinePayload["subtitleStyle"]>

/** Backend SUBTITLE_STYLES, described by how each one actually renders. */
const SUBTITLE_STYLES: { id: SubtitleStyle; label: string }[] = [
  { id: "hustle", label: "Bold, highlight current word" },
  { id: "slay", label: "Bold italic, highlight current word" },
  { id: "beans", label: "Words light up as spoken" },
  { id: "karl", label: "One word at a time" },
  { id: "simple", label: "Clean, no highlight" },
]

/** Picks the video's format from the uploaded frame's own orientation (square keeps the current one). */
function matchFormatTo(url: string, setAspectRatio: (ratio: AspectRatio) => void) {
  const img = new Image()
  img.onload = () => {
    if (img.naturalHeight > img.naturalWidth) setAspectRatio("9:16")
    else if (img.naturalWidth > img.naturalHeight) setAspectRatio("16:9")
  }
  img.src = url
}

/**
 * Media Studio's "Auto Video" form: one prompt in, one quality-checked video out. Everything
 * between (prompt refinement, candidate frames, automated QA, the retry) runs server-side —
 * see src/modules/media/pipeline/ on the backend — and progress shows in PipelineRuns.
 */
export function AutoVideoForm({ mode }: { mode: "image_to_video" | "reference_to_video" }) {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const {
    media: mediaCatalogue,
    ready: pricingReady,
    failed: pricingFailed,
    retry: retryPricing,
  } = useMediaPricing()

  const [modelId, setModelId] = useState("")
  const [duration, setDuration] = useState<number | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [prompt, setPrompt] = useState("")
  const [lockEndFrame, setLockEndFrame] = useState(false)
  const [resolution, setResolution] = useState<VideoResolution>(DEFAULT_RESOLUTION)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle | null>(null)
  const [productUrls, setProductUrls] = useState<string[]>([])
  const [uploadingRefs, setUploadingRefs] = useState(false)
  // By default we make the frames. Switched off, the user supplies the opening frame (required)
  // and, for models that take one, a closing frame (optional).
  const [autoFrames, setAutoFrames] = useState(true)
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null)
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null)
  const [uploadingFirst, setUploadingFirst] = useState(false)
  const [uploadingLast, setUploadingLast] = useState(false)
  const uploading = uploadingRefs || uploadingFirst || uploadingLast

  // Runs that carry the user's own product screenshots are reference-to-video; the rest animate a
  // generated opening frame (image-to-video). The backend tags every model with its mode, so each
  // list is built from the catalogue — cheapest first, which makes the first the default.
  const withReferences = mode === "reference_to_video"
  const models = useMemo(
    () => modelsForMode(mediaCatalogue, withReferences ? "reference_to_video" : "image_to_video"),
    [mediaCatalogue, withReferences]
  )
  const model = models.find((m) => m.id === modelId) ?? models[0]
  const durations = model?.frameVideo?.durations ?? []
  // The picked duration may not exist on a newly picked model (Boreal has no 9s). Snap to the next
  // longer one it does have — as the backend does — so a script isn't cut short; nothing picked yet: 5s.
  const durationSeconds =
    duration === null
      ? durations.includes(5)
        ? 5
        : (durations[0] ?? 5)
      : durations.includes(duration)
        ? duration
        : (durations.find((d) => d >= duration) ?? durations.at(-1) ?? duration)
  const durationSnapped = duration !== null && durations.length > 0 && durationSeconds !== duration
  // Animating forward from one frame looks most natural, so the end frame is opt-in, and only
  // offered where the model accepts one.
  const canLockEndFrame = model?.frameVideo?.endFrame === "optional"
  const ownFrames = !autoFrames
  // Models that can't take an end frame ignore a closing frame — it isn't offered or sent for them.
  const canUseLastFrame = ownFrames && model?.frameVideo?.endFrame !== "none"
  const useEndFrame = ownFrames
    ? canUseLastFrame && Boolean(lastFrameUrl)
    : canLockEndFrame && lockEndFrame
  // Only models with per-resolution pricing take a resolution; the rest render at a fixed one.
  const resolutionOptions = resolutionsOf(model)
  const videoResolution = effectiveResolution(model, resolution)
  // A quoted script longer than the clip allows comes out rushed — say so before they pay.
  const pacing = pacingAdvice(prompt, durationSeconds, durations)
  const screenshots = withReferences ? productUrls : []
  const takesScreenRefs = Boolean(model?.frameVideo?.referenceImages)

  // Priced only from the backend's catalogue — null while it (or a model's rate) isn't known.
  const price = model
    ? estimatePipelineCredits(mediaCatalogue, {
        videoModel: model.id,
        durationSeconds,
        resolution: videoResolution,
        useEndFrame,
        subtitles: subtitleStyle !== null,
        productImages: screenshots.length,
        // Frames the user supplies cost nothing to make.
        includeFrames: autoFrames,
      })
    : null
  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const create = mediaPipelineQuery.useCreate({
    onSuccess: () => {
      setPrompt("")
      setProductUrls([])
      setFirstFrameUrl(null)
      setLastFrameUrl(null)
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
    if (uploading) {
      toast.error("Wait for the images to finish uploading")
      return
    }
    if (withReferences && screenshots.length === 0) {
      toast.error("Add at least one reference image")
      return
    }
    if (ownFrames && !firstFrameUrl) {
      toast.error("Add your opening frame, or switch on Auto frames")
      return
    }
    if (price === null) {
      toast.error("Prices aren't available right now — try again in a moment")
      return
    }
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
      ...(videoResolution ? { resolution: videoResolution } : {}),
      useEndFrame,
      subtitleStyle,
      productImageUrls: screenshots,
      ...(ownFrames && firstFrameUrl
        ? { firstFrameUrl, ...(useEndFrame && lastFrameUrl ? { lastFrameUrl } : {}) }
        : {}),
    } as CreateMediaPipelinePayload)
  }

  // No prices yet means no models: wait for the backend's catalogue rather than show a guess.
  if (!pricingReady) {
    return pricingFailed ? (
      <div className="flex flex-col items-start gap-2 text-sm text-slate-600">
        <p>Prices couldn't be loaded, so video models aren't available right now.</p>
        <button
          type="button"
          onClick={retryPricing}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
      </div>
    ) : (
      <p className="text-sm text-slate-500">Loading models and prices…</p>
    )
  }
  if (models.length === 0) {
    return <p className="text-sm text-slate-500">Auto Video isn't available right now.</p>
  }

  const selectClass =
    "select outline-0 w-full h-11 rounded-lg border-gray-200 border mt-1 focus:border-[#4C5BD6] focus:ring-4 focus:ring-[#4C5BD6]/15"

  return (
    <>
      <div className="mb-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 transition-colors focus-within:border-[#4C5BD6] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#4C5BD6]/15">
          <label htmlFor="auto-video-prompt" className="sr-only">
            Describe your video
          </label>
          <textarea
            id="auto-video-prompt"
            className="block min-h-32 w-full resize-none rounded-t-xl bg-transparent p-4 text-base leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 sm:min-h-36 sm:p-5"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={2000}
            placeholder={
              'Describe your video… e.g. A young man in his bedroom holds up his phone to the camera and says: "This app changed my morning routine." Selfie-style, natural light'
            }
          />
          <div className="flex justify-end px-3 pb-3 sm:px-4">
            <RefinePromptButton prompt={prompt} kind="video" onRefined={setPrompt} />
          </div>
        </div>
        {pacing && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Your script is {pacing.words} words — about {pacing.neededSeconds}s at a natural pace,
              so at {durationSeconds}s it will sound rushed.{" "}
              {pacing.suggestedDuration ? (
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => setDuration(pacing.suggestedDuration)}
                >
                  Use {pacing.suggestedDuration} seconds
                </button>
              ) : (
                "Shorten it — this model can't go long enough."
              )}
            </p>
          </div>
        )}
      </div>

      <div className="mb-5 sm:mb-6 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm mt-0.5"
            checked={autoFrames}
            onChange={(e) => setAutoFrames(e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-semibold text-slate-800">Auto frames</span>
            <span className="block text-xs text-slate-500">
              {autoFrames
                ? "We create the opening frame from your description and check it for defects. Turn off to use your own."
                : "Using your own frames — nothing is generated for them, so they cost nothing."}
            </span>
          </span>
        </label>

        {ownFrames && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SourceImageUpload
              compact
              label="Opening frame"
              hint="The first image of the video."
              url={firstFrameUrl}
              onChange={(url) => {
                setFirstFrameUrl(url)
                if (url) matchFormatTo(url, setAspectRatio)
              }}
              onUploadingChange={setUploadingFirst}
            />
            {canUseLastFrame ? (
              <SourceImageUpload
                compact
                required={false}
                label="Closing frame"
                hint="Where the video should end up."
                url={lastFrameUrl}
                onChange={setLastFrameUrl}
                onUploadingChange={setUploadingLast}
              />
            ) : (
              <p className="self-center text-xs text-slate-500">
                This model animates forward from the opening frame, so there's no closing frame to
                add.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6 lg:grid-cols-3`}>
        <div className="form-control w-full col-span-2 sm:col-span-1">
          <label htmlFor="auto-video-model" className="label">
            <span className="label-text font-semibold">Model</span>
          </label>
          <select
            id="auto-video-model"
            className={selectClass}
            value={model?.id ?? ""}
            onChange={(e) => setModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
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
            className={selectClass}
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
          {durationSnapped && (
            <p className="mt-1 text-xs text-amber-700">
              {duration}s isn't offered by this model — using {durationSeconds}s.
            </p>
          )}
        </div>

        <div className="form-control w-full">
          <label htmlFor="auto-video-aspect" className="label">
            <span className="label-text font-semibold">Format</span>
          </label>
          <select
            id="auto-video-aspect"
            className={selectClass}
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
          <label htmlFor="auto-video-resolution" className="label">
            <span className="label-text font-semibold">Resolution</span>
          </label>
          <select
            id="auto-video-resolution"
            className={selectClass}
            value={videoResolution ?? ""}
            onChange={(e) => setResolution(e.target.value as VideoResolution)}
            disabled={resolutionOptions.length <= 1}
          >
            {resolutionOptions.length === 0 ? (
              <option value="">Set by the model</option>
            ) : (
              resolutionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                  {r === "1080p" ? " (sharpest)" : r === "480p" ? " (cheapest)" : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-control w-full">
          <label htmlFor="auto-video-subtitles" className="label">
            <span className="label-text font-semibold">Subtitles</span>
          </label>
          <select
            id="auto-video-subtitles"
            className={selectClass}
            value={subtitleStyle ?? ""}
            onChange={(e) => setSubtitleStyle((e.target.value || null) as SubtitleStyle | null)}
          >
            <option value="">No subtitles</option>
            {SUBTITLE_STYLES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {withReferences && (
        <>
          <ProductScreenshots
            urls={productUrls}
            onChange={setProductUrls}
            onUploadingChange={setUploadingRefs}
          />
          {screenshots.length > 0 && !takesScreenRefs && (
            <p className="-mt-3 mb-5 text-xs text-slate-500 sm:-mt-4 sm:mb-6">
              This model animates the opening frame, which shows your screen. Models marked "product
              refs" also receive the screenshots directly, which keeps the screen steadier.
            </p>
          )}
        </>
      )}

      {autoFrames && canLockEndFrame && (
        <label className="mb-5 sm:mb-6 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm mt-0.5"
            checked={lockEndFrame}
            onChange={(e) => setLockEndFrame(e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-semibold text-slate-800">Lock the ending frame</span>
            <span className="block text-xs text-slate-500">
              Also generates a closing shot and makes the video end exactly on it. Leave off for the
              most natural motion; turn on when the clip must land on a specific final pose.
            </span>
          </span>
        </label>
      )}

      {autoFrames && (
        <details className="group mb-5 sm:mb-6 rounded-xl border border-slate-100 bg-slate-50 text-xs leading-relaxed text-slate-600">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 p-3 font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 rounded-xl [&::-webkit-details-marker]:hidden">
            <ShieldCheck className="size-4 shrink-0 text-[#4C5BD6]" />
            How Auto Video works — quality-checked, retried once for free
            <ChevronDown className="ml-auto size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-3 pb-3 pl-9">
            We expand your idea into a realistic shot with a spoken script and sound, generate
            several opening frames{useEndFrame ? " (and closing frames)" : ""}, and keep the one
            that passes an automatic quality check before animating it with native audio
            {videoResolution ? ` in ${videoResolution}` : ""}. Put any lines the speaker should say
            in quotes and we'll keep them word for word. If the video shows defects or the speech is
            out of sync, we retry once at no extra cost. On-screen text is avoided on purpose,
            because AI video often garbles it.
          </p>
        </details>
      )}

      <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles size={14} className="text-[#4C5BD6]" />
          <span>
            Price{" "}
            <strong className="font-semibold text-slate-900">
              {price === null ? "—" : `${price} credits`}
            </strong>
          </span>
          <span className="text-slate-400">· includes the automatic retry</span>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={
            create.isPending ||
            uploading ||
            price === null ||
            (withReferences && screenshots.length === 0) ||
            (ownFrames && !firstFrameUrl)
          }
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#4C5BD6] px-7 text-base font-semibold text-white transition-colors hover:bg-[#3B4BB8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30 disabled:opacity-60 sm:w-auto"
        >
          {create.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Video"}
        </button>
      </div>
    </>
  )
}
