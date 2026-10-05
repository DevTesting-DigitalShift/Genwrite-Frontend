import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  Clapperboard,
  Clock,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Video,
  WandSparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaQuery } from "@api/Media/Media.query"
import type { MediaAsset } from "@api/Media/Media.api"
import usePricingStore from "@store/usePricingStore"
import { MasonryGrid, MasonryItem } from "@components/ui/MasonryGrid"
import { PURPOSES, type MediaModel, type Purpose } from "@/features/media/mediaOptions"
import { AutoVideoForm } from "@/features/media/AutoVideoForm"
import { PipelineRuns } from "@/features/media/PipelineRuns"
import { PipelineAssetActions } from "@/features/media/PipelineAssetActions"

/** Mirrors the backend's media.pricing.js#getMediaCreditCost exactly: 1 credit = 1 cent, and
 * only the unit the model is billed in counts — seconds for per-second video, megapixels for
 * per-megapixel images, otherwise a flat price per image/video. */
const estimateCredits = (
  model: MediaModel,
  { megapixels, durationSeconds }: { megapixels: number; durationSeconds: number }
) => {
  const units =
    model.unit === "second" ? durationSeconds : model.unit === "megapixel" ? megapixels : 1
  // Round to micro-cents first so float noise can't add a credit (0.168 × 5 × 100 = 84.00000000000001).
  return Math.ceil(Number((model.usdPerUnit * units * 100).toFixed(6)))
}

/** "5 credits / second", "4 credits / image" — the model's rate in the unit it's billed in. */
const formatRate = (model: MediaModel) => {
  const perUnit = Math.ceil(model.usdPerUnit * 100)
  return `${perUnit} credit${perUnit === 1 ? "" : "s"} / ${model.unit}`
}

/** Rough wait shown to the user — fal delivers the result via webhook, surfaced as a toast
 * by useMediaNotifications, so nothing on this page waits or polls for it. */
const ETA_LABEL: Record<MediaAsset["type"], string> = {
  image: "about a minute",
  video: "5–10 minutes",
}

const STATUS_STYLES: Record<MediaAsset["status"], { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-600 border-slate-200" },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-600 border-blue-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-600 border-rose-200" },
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

const isActive = (status: MediaAsset["status"]) => status === "queued" || status === "processing"

/** Memoised: socket updates patch single entries in the cached list, and only the cards
 * whose asset object actually changed should re-render. */
const AssetCard = memo(
  ({ asset, onSelect }: { asset: MediaAsset; onSelect: (id: string) => void }) => {
    const style = STATUS_STYLES[asset.status]
    const [loaded, setLoaded] = useState(false)

    return (
      <button
        type="button"
        onClick={() => onSelect(asset._id)}
        className="relative group rounded-lg overflow-hidden bg-gray-100 w-full text-left border border-gray-200"
      >
        {asset.status === "completed" && asset.resultUrl ? (
          asset.type === "image" ? (
            // Square shimmer until the real dimensions arrive, then the masonry cell snaps to
            // the image's natural aspect ratio — avoids a 0-height flash of badges-only cards.
            <div className={loaded ? "" : "aspect-square animate-pulse bg-slate-200"}>
              <img
                src={asset.resultUrl}
                alt={asset.prompt}
                className={`w-full h-auto object-cover transition-all duration-300 group-hover:scale-105 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
              />
            </div>
          ) : (
            <div className="relative aspect-video bg-slate-900">
              <video
                src={asset.resultUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 ml-0.5" />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4 sm:p-6 bg-linear-to-br from-slate-50 to-slate-100">
            {isActive(asset.status) ? (
              <>
                <Clock className="w-8 h-8 text-[#4C5BD6]" />
                <p className="text-xs font-semibold text-slate-500 text-center">
                  {asset.status === "queued" ? "Queued" : "Generating"} — ready in{" "}
                  {ETA_LABEL[asset.type]}
                </p>
              </>
            ) : (
              <>
                <X className="w-8 h-8 text-rose-400" />
                <p className="text-xs font-semibold text-rose-500 text-center line-clamp-2">
                  {asset.errorMessage || "Generation failed"}
                </p>
              </>
            )}
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${style.className}`}
          >
            {style.label}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200 flex items-center gap-1">
            {asset.type === "image" ? <ImageIcon size={10} /> : <Video size={10} />}
            <span className="hidden sm:inline">{asset.purpose.replace("_", " ")}</span>
          </span>
        </div>

        {asset.status === "completed" && (
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <p className="text-white text-xs line-clamp-2 font-medium">{asset.prompt}</p>
          </div>
        )}
      </button>
    )
  }
)

const Media = () => {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  // "auto" is the Auto Video pipeline (AutoVideoForm), which owns its own form state.
  const [tab, setTab] = useState<"image" | "video" | "auto">("image")
  const [prompt, setPrompt] = useState("")
  const [purpose, setPurpose] = useState<Purpose>("other")
  // Models + prices come from the backend's pricing catalogue, so a model added/removed or
  // repriced there shows up here without a frontend change. Image-to-image models need a
  // source image this prompt-only form can't provide, so they're not offered.
  const mediaCatalogue = usePricingStore((s) => s.catalogue.media)
  const modelsByKind = useMemo(() => {
    const all: MediaModel[] = Object.entries(mediaCatalogue)
      .filter(([, m]) => !m.requiresImage && !m.legacy)
      .map(([id, m]) => ({ id, ...m }))
    return {
      image: all.filter((m) => m.kind === "image"),
      video: all.filter((m) => m.kind === "video"),
    }
  }, [mediaCatalogue])
  const [imageModel, setImageModel] = useState("")
  const [videoModel, setVideoModel] = useState("")
  const [megapixels, setMegapixels] = useState(1)
  const [durationSeconds, setDurationSeconds] = useState(5)
  // An id rather than a snapshot so the preview modal always reflects the live cache entry
  // (status flips from processing → completed while it's open).
  const [previewId, setPreviewId] = useState<string | null>(null)

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const { data: list, isLoading, refetch, isFetching } = mediaQuery.useList({ page: 1, limit: 40 })
  // Belt-and-braces dedupe by _id — the cache layer already guards against double inserts,
  // but a duplicate key here would silently render the same card twice.
  const assets = useMemo(() => {
    const seen = new Set<string>()
    return (list?.data ?? []).filter((a) => {
      if (seen.has(a._id)) return false
      seen.add(a._id)
      return true
    })
  }, [list?.data])

  const previewAsset = previewId ? (assets.find((a) => a._id === previewId) ?? null) : null

  // Submitting only queues the job with fal — no waiting screen. The result arrives via the
  // webhook → "media:statusChanged" socket event, toasted app-wide by useMediaNotifications.
  const handleSubmitted = (asset: MediaAsset) => {
    setPrompt("")
    loadAuthenticatedUser()
    toast.success(
      `${asset.type === "image" ? "Image" : "Video"} generation started — ready in ${ETA_LABEL[asset.type]}`,
      { description: "We'll notify you when it's done, or hit Refresh to check." }
    )
  }
  const generateImage = mediaQuery.useGenerateImage({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start image generation"),
  })
  const generateVideo = mediaQuery.useGenerateVideo({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start video generation"),
  })
  const refresh = mediaQuery.useRefresh()

  const isSubmitting = generateImage.isPending || generateVideo.isPending
  const tabModels = tab === "auto" ? [] : modelsByKind[tab]
  // Falls back to the first model when nothing's picked yet, or the picked one was removed
  // from the catalogue since.
  const selectedModelId = tab === "image" ? imageModel : videoModel
  const currentModel = tabModels.find((m) => m.id === selectedModelId) ?? tabModels[0]
  // Video models only accept specific lengths — keep the picked one if this model supports it,
  // else fall back to 5s, else the model's first.
  const videoDurations = currentModel?.textVideo?.durations ?? []
  const videoDuration =
    videoDurations.length === 0 || videoDurations.includes(durationSeconds)
      ? durationSeconds
      : videoDurations.includes(5)
        ? 5
        : videoDurations[0]
  const estimatedCredits = currentModel
    ? estimateCredits(currentModel, { megapixels, durationSeconds: videoDuration })
    : 0
  const modelLabel = (id: string) => mediaCatalogue[id]?.label ?? id

  const activeIds = assets.filter((a) => isActive(a.status)).map((a) => a._id)

  // Asks the backend to check fal directly for every still-generating asset — the fallback
  // for a missed webhook. A no-op server-side for anything already resolved.
  const refreshActive = (ids: string[]) => {
    for (const id of ids) refresh.mutate(id)
  }

  // One automatic check when the page opens (once the list has loaded), so anything that
  // finished while the user was away shows up without them having to click Refresh.
  const autoRefreshedRef = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, right after the first load
  useEffect(() => {
    if (autoRefreshedRef.current || isLoading) return
    autoRefreshedRef.current = true
    refreshActive(activeIds)
  }, [isLoading])

  const handleManualRefresh = async () => {
    const { data } = await refetch()
    refreshActive((data?.data ?? []).filter((a) => isActive(a.status)).map((a) => a._id))
  }
  const isRefreshing = isFetching || refresh.isPending

  const checkCredits = () => {
    if (userCredits < estimatedCredits) {
      handlePopup({
        title: "Insufficient Credits",
        description: `This generation needs about ${estimatedCredits} credits. You have ${userCredits}.`,
        confirmText: "Get Credits",
        onConfirm: () => navigate("/pricing"),
      })
      return false
    }
    return true
  }

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Prompt must be at least 3 characters")
      return
    }
    if (!checkCredits()) return

    if (!currentModel) return
    if (tab === "image") {
      generateImage.mutate({
        prompt: prompt.trim(),
        model: currentModel.id,
        purpose,
        megapixels,
      } as never)
    } else {
      generateVideo.mutate({
        prompt: prompt.trim(),
        model: currentModel.id,
        purpose,
        durationSeconds: videoDuration,
      } as never)
    }
  }

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Prompt copied")
    } catch {
      toast.error("Couldn't copy the prompt")
    }
  }

  const handleDownload = async (asset: MediaAsset) => {
    if (!asset.resultUrl) return
    try {
      const response = await fetch(asset.resultUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${asset.type}-${asset._id}.${asset.type === "image" ? "png" : "mp4"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error("Failed to download")
    }
  }

  return (
    <>
      <Helmet>
        <title>Media Studio | GenWrite</title>
      </Helmet>

      <div className="min-h-screen p-4 sm:p-6">
        <div className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              Media Studio
            </h1>
            <p className="text-slate-500 text-sm font-medium max-w-lg leading-relaxed">
              Generate posters, thumbnails, and short videos with AI — describe what you want, pick
              a model, and we'll handle the rest.
            </p>
          </div>
        </div>

        {/* Generation form */}
        <div className="mb-8 sm:mb-12 rounded-lg border border-gray-300">
          <div className="p-4 sm:p-5">
            {/* Image / Video tabs */}
            <div className="flex sm:inline-flex p-1 mb-5 sm:mb-6 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setTab("image")}
                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${
                  tab === "image" ? "bg-white text-[#4C5BD6] shadow-sm" : "text-slate-500"
                }`}
              >
                <ImageIcon size={16} /> Image
              </button>
              <button
                type="button"
                onClick={() => setTab("video")}
                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${
                  tab === "video" ? "bg-white text-[#4C5BD6] shadow-sm" : "text-slate-500"
                }`}
              >
                <Video size={16} /> Video
              </button>
              <button
                type="button"
                onClick={() => setTab("auto")}
                className={`flex-1 sm:flex-none justify-center px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${
                  tab === "auto" ? "bg-white text-[#4C5BD6] shadow-sm" : "text-slate-500"
                }`}
              >
                <WandSparkles size={16} /> Auto Video
              </button>
            </div>

            {tab === "auto" ? (
              <AutoVideoForm />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-6">
                  <div className="form-control w-full">
                    <label htmlFor="media-model" className="label">
                      <span className="label-text font-semibold">Model</span>
                    </label>
                    <select
                      id="media-model"
                      className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
                      value={currentModel?.id ?? ""}
                      onChange={(e) =>
                        tab === "image"
                          ? setImageModel(e.target.value)
                          : setVideoModel(e.target.value)
                      }
                    >
                      {tabModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} · {formatRate(m)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label htmlFor="media-purpose" className="label">
                      <span className="label-text font-semibold">Purpose</span>
                    </label>
                    <select
                      id="media-purpose"
                      className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as typeof purpose)}
                    >
                      {PURPOSES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tag for organizing your library — doesn't change the output.
                    </p>
                  </div>

                  {tab === "image" ? (
                    <div className="form-control w-full sm:col-span-2 lg:col-span-1">
                      <label htmlFor="media-megapixels" className="label">
                        <span className="label-text font-semibold">Est. size (megapixels)</span>
                      </label>
                      <input
                        id="media-megapixels"
                        type="number"
                        inputMode="decimal"
                        min={0.25}
                        max={4}
                        step={0.25}
                        className="input outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1 px-4"
                        value={megapixels}
                        onChange={(e) => setMegapixels(Number(e.target.value) || 1)}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {currentModel?.unit === "megapixel"
                          ? "For cost estimation only — actual output size is set by the model."
                          : "This model is billed per image — size doesn't change the cost."}
                      </p>
                    </div>
                  ) : (
                    <div className="form-control w-full sm:col-span-2 lg:col-span-1">
                      <label htmlFor="media-duration" className="label">
                        <span className="label-text font-semibold">Duration (seconds)</span>
                      </label>
                      <select
                        id="media-duration"
                        className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
                        value={videoDuration}
                        onChange={(e) => setDurationSeconds(Number(e.target.value))}
                        disabled={videoDurations.length <= 1}
                      >
                        {videoDurations.map((d) => (
                          <option key={d} value={d}>
                            {d} seconds
                          </option>
                        ))}
                      </select>
                      {currentModel && currentModel.unit !== "second" && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          This model is billed per video — length doesn't change the cost.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-5 sm:mb-6">
                  <label htmlFor="media-prompt" className="label">
                    <span className="label-text font-semibold">
                      Prompt <span className="text-rose-500 text-lg">*</span>
                    </span>
                  </label>
                  <textarea
                    id="media-prompt"
                    className="textarea w-full min-h-30 sm:min-h-35 rounded-2xl p-4 sm:p-6 outline-0 border border-slate-200 bg-slate-50 resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      tab === "image"
                        ? "Describe the image you want... (e.g. A futuristic city skyline at dusk)"
                        : "Describe the video you want... (e.g. A drone shot flying over a mountain range at sunrise)"
                    }
                  />
                </div>

                <div className="pt-5 sm:pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                    <Sparkles size={14} className="text-[#4C5BD6]" />
                    Estimated cost:{" "}
                    <span className="text-slate-900">{estimatedCredits} credits</span>
                    {currentModel && (
                      <span className="font-medium text-slate-400">
                        ({formatRate(currentModel)})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isSubmitting}
                    className="btn btn-primary w-full sm:w-auto px-8 py-3 bg-[#4C5BD6] hover:bg-[#3B4BB8] rounded-lg border-0 shadow-none sm:shadow-lg sm:shadow-[#4C5BD6]/20 text-white font-bold text-base transition-all scale-100 hover:scale-[1.02] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `Generate ${tab === "image" ? "Image" : "Video"}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <PipelineRuns />

        {/* Gallery */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">Your library</h2>
            {activeIds.length > 0 && (
              <p className="text-xs text-slate-500">
                {activeIds.length} generating — videos can take 5–10 minutes. We'll notify you when
                they're ready.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        {isLoading && assets.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-count skeleton placeholder
              <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center">
            <Clapperboard className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media yet</h3>
            <p className="text-gray-500 text-sm">Generate your first image or video above</p>
          </div>
        ) : (
          <MasonryGrid className="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-3 sm:gap-x-4">
            {assets.map((asset) => (
              <MasonryItem key={asset._id} gapClassName="pb-3 sm:pb-4">
                <AssetCard asset={asset} onSelect={setPreviewId} />
              </MasonryItem>
            ))}
          </MasonryGrid>
        )}

        {/* Preview modal */}
        <AnimatePresence>
          {previewAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewId(null)}
                className="fixed inset-0 -z-10"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 24 }}
                className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-6xl bg-white sm:rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden"
              >
                <div className="relative shrink-0 lg:shrink lg:flex-1 bg-slate-950 flex items-center justify-center p-2 sm:p-6 h-[55vh] sm:h-[60vh] lg:h-auto lg:min-h-105">
                  {previewAsset.resultUrl ? (
                    previewAsset.type === "image" ? (
                      <img
                        src={previewAsset.resultUrl}
                        alt={previewAsset.prompt}
                        className="max-h-full max-w-full lg:max-h-[80vh] object-contain rounded-lg sm:rounded-xl"
                      />
                    ) : (
                      // AI-generated video has no dialogue/audio track to transcribe.
                      // biome-ignore lint/a11y/useMediaCaption: no source captions exist to attach
                      <video
                        src={previewAsset.resultUrl}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-full max-w-full lg:max-h-[80vh] rounded-lg sm:rounded-xl"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      {isActive(previewAsset.status) ? (
                        <>
                          <Clock className="w-8 h-8" />
                          <p className="text-sm font-semibold text-center px-6">
                            Still generating — usually ready in {ETA_LABEL[previewAsset.type]}.
                            We'll notify you when it's done.
                          </p>
                        </>
                      ) : (
                        <>
                          <X className="w-8 h-8 text-rose-400" />
                          <p className="text-sm font-semibold text-rose-300 text-center px-6">
                            {previewAsset.errorMessage || "Generation failed"}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewId(null)}
                    aria-label="Close preview"
                    className="absolute top-3 left-3 sm:top-4 sm:left-4 p-2.5 bg-black/50 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-md"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="w-full lg:w-90 xl:w-100 shrink-0 flex flex-col lg:max-h-[92vh]">
                  <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col gap-5 lg:overflow-y-auto">
                    {/* Header: status, type, when */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[previewAsset.status].className}`}
                      >
                        {STATUS_STYLES[previewAsset.status].label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 text-slate-600 flex items-center gap-1">
                        {previewAsset.type === "image" ? (
                          <ImageIcon size={10} />
                        ) : (
                          <Video size={10} />
                        )}
                        {previewAsset.type === "image" ? "Image" : "Video"}
                      </span>
                      {previewAsset.createdAt && (
                        <span className="ml-auto text-[11px] text-slate-400">
                          {formatDateTime(previewAsset.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Prompt — keeps the user's own line breaks/spacing; long prompts scroll
                        inside their own box instead of stretching the panel. */}
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {previewAsset.pipelineId ? "Video prompt (auto-refined)" : "Prompt"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(previewAsset.prompt)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#4C5BD6] transition-colors"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <p className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                        {previewAsset.prompt}
                      </p>
                    </section>

                    {/* Details */}
                    <section>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Details
                      </h3>
                      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 text-sm">
                        <div className="flex items-start justify-between gap-4 px-3 py-2.5">
                          <dt className="text-slate-500 shrink-0">Model</dt>
                          <dd className="min-w-0 text-right">
                            <p className="font-semibold text-slate-800 truncate">
                              {modelLabel(previewAsset.providerModel)}
                            </p>
                            <p
                              className="font-mono text-[10px] text-slate-400 truncate"
                              title={previewAsset.providerModel}
                            >
                              {previewAsset.providerModel}
                            </p>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                          <dt className="text-slate-500">Purpose</dt>
                          <dd className="font-semibold text-slate-800 capitalize">
                            {previewAsset.purpose.replace("_", " ")}
                          </dd>
                        </div>
                        {/* Auto Video children carry no charge of their own — the run's price
                            is shown by PipelineAssetActions instead. */}
                        {!previewAsset.pipelineId && (
                          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                            <dt className="text-slate-500">Credits used</dt>
                            <dd className="font-semibold text-slate-800 flex items-center gap-1">
                              <Sparkles size={12} className="text-[#4C5BD6]" />
                              {previewAsset.creditCost}
                              {previewAsset.status === "failed" && (
                                <span className="text-[11px] font-medium text-emerald-600">
                                  (refunded)
                                </span>
                              )}
                            </dd>
                          </div>
                        )}
                        {!previewAsset.pipelineId && mediaCatalogue[previewAsset.providerModel] && (
                          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                            <dt className="text-slate-500">Rate</dt>
                            <dd className="text-slate-600">
                              {formatRate({
                                id: previewAsset.providerModel,
                                ...mediaCatalogue[previewAsset.providerModel],
                              })}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </section>

                    {previewAsset.pipelineId && (
                      <PipelineAssetActions
                        pipelineId={previewAsset.pipelineId}
                        onStarted={() => setPreviewId(null)}
                      />
                    )}
                  </div>

                  {previewAsset.status === "completed" && previewAsset.resultUrl && (
                    <div className="shrink-0 border-t border-slate-100 p-4 sm:p-6">
                      <button
                        type="button"
                        onClick={() => handleDownload(previewAsset)}
                        className="btn btn-primary w-full h-12 rounded-lg bg-slate-900 border-none text-white font-medium hover:bg-black transition-all"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default Media
