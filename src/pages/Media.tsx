import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Clapperboard, Download, ImageIcon, Loader2, Sparkles, Video, X } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaQuery } from "@api/Media/Media.query"
import type { MediaAsset } from "@api/Media/Media.api"
import { getSocket } from "@utils/socket"
import ProgressLoadingScreen from "@components/ui/ProgressLoadingScreen"
import { MasonryGrid, MasonryItem } from "@components/ui/MasonryGrid"

/** Display-only catalogue mirroring GenWrite-Backend's constants/mediaModelPricing.js —
 * the backend is the source of truth for actual cost, this is purely for the UI's live
 * estimate before submitting. Keep in sync if the backend catalogue changes. */
const IMAGE_MODELS = [
  { id: "fal-ai/nano-banana", label: "Nano Banana", usdPerUnit: 0.0398, unit: "megapixel" },
  {
    id: "fal-ai/bytedance/seedream/v4/text-to-image",
    label: "Seedream v4",
    usdPerUnit: 0.03,
    unit: "image",
  },
  { id: "fal-ai/flux-pro/kontext", label: "Flux Kontext Pro", usdPerUnit: 0.04, unit: "image" },
  { id: "fal-ai/qwen-image", label: "Qwen Image", usdPerUnit: 0.02, unit: "megapixel" },
] as const

const VIDEO_MODELS = [
  { id: "fal-ai/wan-25-preview/text-to-video", label: "Wan 2.5", usdPerUnit: 0.05, unit: "second" },
  {
    id: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    label: "Kling 2.5 Turbo Pro",
    usdPerUnit: 0.07,
    unit: "second",
  },
  { id: "fal-ai/veo3.1", label: "Veo 3", usdPerUnit: 0.4, unit: "second" },
  { id: "fal-ai/ovi", label: "Ovi", usdPerUnit: 0.2, unit: "video (flat)" },
] as const

const PURPOSES = [
  { id: "poster", label: "Poster" },
  { id: "thumbnail", label: "Thumbnail" },
  { id: "reel", label: "Reel" },
  { id: "social_post", label: "Social post" },
  { id: "other", label: "Other" },
] as const

/** 1 credit = 1 cent, matching media.pricing.js#getMediaCreditCost exactly. */
const estimateCredits = (usdPerUnit: number, units: number) => Math.ceil(usdPerUnit * units * 100)

/** Upper bound on how long the full-screen generation overlay stays up before we give up
 * waiting and let the user carry on — the asset keeps polling in the gallery regardless.
 * Video models (Veo/Kling) routinely take a few minutes, so this is deliberately generous. */
const GENERATION_TIMEOUT_MS = 10 * 60 * 1000

const STATUS_STYLES: Record<MediaAsset["status"], { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-600 border-slate-200" },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-600 border-blue-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-600 border-rose-200" },
}

const isActive = (status: MediaAsset["status"]) => status === "queued" || status === "processing"

/** Memoised: the polling loop patches the list every few seconds while anything is
 * generating, and only the cards whose asset object actually changed should re-render. */
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
                <Loader2 className="w-8 h-8 text-[#4C5BD6] animate-spin" />
                <p className="text-xs font-semibold text-slate-500 text-center">
                  {asset.status === "queued" ? "Queued…" : "Generating…"}
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

  const [tab, setTab] = useState<"image" | "video">("image")
  const [prompt, setPrompt] = useState("")
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]["id"]>("other")
  const [imageModel, setImageModel] = useState<(typeof IMAGE_MODELS)[number]["id"]>(
    IMAGE_MODELS[0].id
  )
  const [videoModel, setVideoModel] = useState<(typeof VIDEO_MODELS)[number]["id"]>(
    VIDEO_MODELS[0].id
  )
  const [megapixels, setMegapixels] = useState(1)
  const [durationSeconds, setDurationSeconds] = useState(5)
  // Ids rather than snapshots so the preview modal / overlay always reflect the live cache
  // entry (status flips from processing → completed while they're open).
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const { data: list, isLoading } = mediaQuery.useList({ page: 1, limit: 40 })
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
  const pendingAsset = pendingId ? (assets.find((a) => a._id === pendingId) ?? null) : null

  const generateImage = mediaQuery.useGenerateImage({
    onSuccess: (asset) => {
      setPendingId(asset._id)
      setPrompt("")
      loadAuthenticatedUser()
    },
    onError: (err) => toast.error(err.message || "Failed to start image generation"),
  })
  const generateVideo = mediaQuery.useGenerateVideo({
    onSuccess: (asset) => {
      setPendingId(asset._id)
      setPrompt("")
      loadAuthenticatedUser()
    },
    onError: (err) => toast.error(err.message || "Failed to start video generation"),
  })
  const refresh = mediaQuery.useRefresh()

  const isSubmitting = generateImage.isPending || generateVideo.isPending
  const isGenerating = isSubmitting || pendingId !== null
  const currentModel =
    tab === "image"
      ? IMAGE_MODELS.find((m) => m.id === imageModel)
      : VIDEO_MODELS.find((m) => m.id === videoModel)
  const estimatedCredits = currentModel
    ? estimateCredits(currentModel.usdPerUnit, tab === "image" ? megapixels : durationSeconds)
    : 0

  // Resolve the full-screen wait once the pending asset settles: completed → open it in the
  // preview, failed → toast the backend's reason. The socket/polling below keep the cache
  // entry fresh, so this is purely a reaction to that.
  useEffect(() => {
    if (!pendingAsset) return
    if (pendingAsset.status === "completed") {
      setPendingId(null)
      setPreviewId(pendingAsset._id)
      toast.success(`${pendingAsset.type === "image" ? "Image" : "Video"} ready`)
    } else if (pendingAsset.status === "failed") {
      setPendingId(null)
      toast.error(pendingAsset.errorMessage || "Generation failed")
    }
  }, [pendingAsset])

  // Live updates via the "media:created"/"media:statusChanged" socket events — falls back to
  // the polling loop below for local dev / any missed delivery, since neither is guaranteed
  // (fal's webhook itself only fires when the backend has a public API_DOMAIN configured).
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleUpdate = (asset: MediaAsset) => mediaQuery.applyAssetUpdate(asset)
    socket.on("media:created", handleUpdate)
    socket.on("media:statusChanged", handleUpdate)
    return () => {
      socket.off("media:created", handleUpdate)
      socket.off("media:statusChanged", handleUpdate)
    }
  }, [])

  // Polling fallback: while any asset is queued/processing, nudge the backend to check fal
  // every few seconds. Safe to call repeatedly — refreshMediaAssetStatus is a no-op once an
  // asset resolves.
  const activeIds = assets.filter((a) => isActive(a.status)).map((a) => a._id)
  const activeIdsKey = activeIds.join(",")
  const refreshRef = useRef(refresh.mutate)
  refreshRef.current = refresh.mutate
  useEffect(() => {
    if (!activeIdsKey) return
    const ids = activeIdsKey.split(",")
    const interval = setInterval(() => {
      for (const id of ids) refreshRef.current(id)
    }, 4000)
    return () => clearInterval(interval)
  }, [activeIdsKey])

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

    if (tab === "image") {
      generateImage.mutate({
        prompt: prompt.trim(),
        model: imageModel,
        purpose,
        megapixels,
      } as never)
    } else {
      generateVideo.mutate({
        prompt: prompt.trim(),
        model: videoModel,
        purpose,
        durationSeconds,
      } as never)
    }
  }

  const handleGenerationTimeout = () => {
    setPendingId(null)
    toast.info("Still generating — it'll appear in your library below once it's ready")
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

      {isGenerating && (
        <ProgressLoadingScreen
          delay={0}
          maxDuration={GENERATION_TIMEOUT_MS}
          onTimeout={handleGenerationTimeout}
          message={
            tab === "video"
              ? "Generating your video… this can take a few minutes"
              : "Generating your image… this usually takes under a minute"
          }
        />
      )}

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-6">
              <div className="form-control w-full">
                <label htmlFor="media-model" className="label">
                  <span className="label-text font-semibold">Model</span>
                </label>
                <select
                  id="media-model"
                  className="select outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1"
                  value={tab === "image" ? imageModel : videoModel}
                  onChange={(e) =>
                    tab === "image"
                      ? setImageModel(e.target.value as typeof imageModel)
                      : setVideoModel(e.target.value as typeof videoModel)
                  }
                >
                  {(tab === "image" ? IMAGE_MODELS : VIDEO_MODELS).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
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
                    For cost estimation only — actual output size is set by the model.
                  </p>
                </div>
              ) : (
                <div className="form-control w-full sm:col-span-2 lg:col-span-1">
                  <label htmlFor="media-duration" className="label">
                    <span className="label-text font-semibold">Duration (seconds)</span>
                  </label>
                  <input
                    id="media-duration"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={30}
                    className="input outline-0 w-full h-12 rounded-lg border-gray-200 border mt-1 px-4"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value) || 5)}
                  />
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
                Estimated cost: <span className="text-slate-900">{estimatedCredits} credits</span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary w-full sm:w-auto px-8 py-3 bg-[#4C5BD6] hover:bg-[#3B4BB8] rounded-lg border-0 shadow-none sm:shadow-lg sm:shadow-[#4C5BD6]/20 text-white font-bold text-base transition-all scale-100 hover:scale-[1.02] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  `Generate ${tab === "image" ? "Image" : "Video"}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
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
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <p className="text-sm font-semibold">Generating…</p>
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

                <div className="w-full lg:w-90 xl:w-100 shrink-0 p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 lg:overflow-y-auto">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mb-3 ${STATUS_STYLES[previewAsset.status].className}`}
                    >
                      {STATUS_STYLES[previewAsset.status].label}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{previewAsset.prompt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-0">
                      <p className="text-slate-400 font-semibold mb-1">Model</p>
                      <p
                        className="text-slate-700 font-bold truncate"
                        title={previewAsset.providerModel}
                      >
                        {previewAsset.providerModel}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-slate-400 font-semibold mb-1">Cost</p>
                      <p className="text-slate-700 font-bold">{previewAsset.creditCost} credits</p>
                    </div>
                  </div>

                  {previewAsset.status === "completed" && previewAsset.resultUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(previewAsset)}
                      className="btn btn-primary w-full h-12 rounded-lg bg-slate-900 border-none text-white font-medium hover:bg-black transition-all mt-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
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
