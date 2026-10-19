import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Clock, Copy, Download, ImageIcon, Sparkles, Video, X } from "lucide-react"
import { toast } from "sonner"
import type { MediaAsset } from "@api/Media/Media.api"
import { EnhanceVideoAction } from "./EnhanceVideoAction"
import { PipelineAssetActions } from "./PipelineAssetActions"
import { RetryVideoAction } from "./RetryVideoAction"
import { STATUS_STYLES } from "./MediaAssetCard"
import { ETA_LABEL, formatRate, type MediaComposer } from "./useMediaComposer"
import { qualityLabel, resolutionLabel } from "./imageOptions"
import { isActiveAsset } from "./mediaLibraryUtils"
import type { MediaModel } from "./mediaOptions"

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

/** "16:9 · 2K · High quality" from what was recorded on the asset (older images have none). */
function describeImageSettings(asset: MediaAsset): string | null {
  if (asset.type !== "image") return null
  const meta = (asset.metadata ?? {}) as {
    aspectRatio?: string
    resolution?: string
    quality?: string | null
  }
  const parts = [
    meta.aspectRatio && (meta.aspectRatio === "match" ? "Match input" : meta.aspectRatio),
    meta.resolution && resolutionLabel(meta.resolution),
    meta.quality && `${qualityLabel(meta.quality)} quality`,
  ].filter(Boolean)
  return parts.length ? parts.join(" · ") : null
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

/**
 * Full view of one asset: the media beside a details column. An id rather than a snapshot is
 * tracked by the caller, so this always reflects the live cache entry (status flips from
 * processing → completed while it's open).
 */
export function AssetPreview({
  asset,
  assets,
  mediaCatalogue,
  onClose,
}: {
  asset: MediaAsset | null
  assets: MediaAsset[]
  mediaCatalogue: MediaComposer["mediaCatalogue"]
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = asset !== null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    closeRef.current?.focus()
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const modelLabel = (id: string) => mediaCatalogue[id]?.label ?? id
  const imageSettings = asset ? describeImageSettings(asset) : null

  return (
    <AnimatePresence>
      {asset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-0 backdrop-blur-xs sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 -z-10"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Media details"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl lg:flex-row lg:overflow-hidden"
          >
            <div className="relative flex h-[55vh] shrink-0 items-center justify-center bg-slate-950 p-2 sm:h-[60vh] sm:p-6 lg:h-auto lg:min-h-105 lg:flex-1 lg:shrink">
              {asset.resultUrl ? (
                asset.type === "image" ? (
                  <img
                    src={asset.resultUrl}
                    alt={asset.prompt}
                    className="max-h-full max-w-full rounded-lg object-contain sm:rounded-xl lg:max-h-[80vh]"
                  />
                ) : (
                  // AI-generated video has no dialogue/audio track to transcribe.
                  // biome-ignore lint/a11y/useMediaCaption: no source captions exist to attach
                  <video
                    src={asset.resultUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-lg sm:rounded-xl lg:max-h-[80vh]"
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  {isActiveAsset(asset) ? (
                    <>
                      <Clock className="size-8" aria-hidden />
                      <p className="px-6 text-center text-sm font-semibold">
                        Still generating — usually ready in {ETA_LABEL[asset.type]}. We'll notify
                        you when it's done.
                      </p>
                    </>
                  ) : (
                    <>
                      <X className="size-8 text-rose-400" aria-hidden />
                      <p className="px-6 text-center text-sm font-semibold text-rose-300">
                        {asset.errorMessage || "Generation failed"}
                      </p>
                    </>
                  )}
                </div>
              )}
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="absolute left-3 top-3 rounded-xl bg-black/50 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:left-4 sm:top-4"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="flex w-full shrink-0 flex-col lg:max-h-[92vh] lg:w-90 xl:w-100">
              <div className="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6 lg:overflow-y-auto">
                {/* Header: status, type, when */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[asset.status].className}`}
                  >
                    {STATUS_STYLES[asset.status].label}
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {asset.type === "image" ? (
                      <ImageIcon size={10} aria-hidden />
                    ) : (
                      <Video size={10} aria-hidden />
                    )}
                    {asset.type === "image" ? "Image" : "Video"}
                  </span>
                  {asset.createdAt && (
                    <span className="ml-auto text-[11px] text-slate-400">
                      {formatDateTime(asset.createdAt)}
                    </span>
                  )}
                </div>

                {/* Prompt — keeps the user's own line breaks/spacing; long prompts scroll
                    inside their own box instead of stretching the panel. */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {asset.pipelineId ? "Video prompt (auto-refined)" : "Prompt"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(asset.prompt)}
                      className="flex items-center gap-1 rounded text-[11px] font-semibold text-slate-500 transition-colors hover:text-[#4C5BD6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20"
                    >
                      <Copy size={12} aria-hidden /> Copy
                    </button>
                  </div>
                  <p className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    {asset.prompt}
                  </p>
                </section>

                {/* Details */}
                <section>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Details
                  </h3>
                  <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 text-sm">
                    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
                      <dt className="shrink-0 text-slate-500">Model</dt>
                      <dd className="min-w-0 text-right">
                        <p className="truncate font-semibold text-slate-800">
                          {modelLabel(asset.providerModel)}
                        </p>
                        <p
                          className="truncate font-mono text-[10px] text-slate-400"
                          title={asset.providerModel}
                        >
                          {asset.providerModel}
                        </p>
                      </dd>
                    </div>
                    {/* Auto Video children carry no charge of their own — the run's price
                        is shown by PipelineAssetActions instead. */}
                    {!asset.pipelineId && (
                      <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                        <dt className="text-slate-500">Credits used</dt>
                        <dd className="flex items-center gap-1 font-semibold text-slate-800">
                          <Sparkles size={12} className="text-[#4C5BD6]" aria-hidden />
                          {asset.creditCost}
                          {asset.status === "failed" && (
                            <span className="text-[11px] font-medium text-emerald-600">
                              (refunded)
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                    {/* How an image was made (recorded when it was submitted). */}
                    {imageSettings && (
                      <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                        <dt className="text-slate-500">Settings</dt>
                        <dd className="text-right text-slate-700">{imageSettings}</dd>
                      </div>
                    )}
                    {/* An image's price depends on its size and quality, so only the amount charged is shown. */}
                    {!asset.pipelineId &&
                      asset.type === "video" &&
                      mediaCatalogue[asset.providerModel] && (
                        <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                          <dt className="text-slate-500">Rate</dt>
                          <dd className="text-slate-600">
                            {formatRate({
                              id: asset.providerModel,
                              ...mediaCatalogue[asset.providerModel],
                            } as MediaModel)}
                          </dd>
                        </div>
                      )}
                  </dl>
                </section>

                <EnhanceVideoAction
                  asset={asset}
                  // Copies already made (or being made) from this video, so it isn't offered twice.
                  enhancedTo={assets
                    .filter(
                      (a) =>
                        a.status !== "failed" &&
                        (a.metadata as { enhancedFrom?: unknown })?.enhancedFrom === asset._id
                    )
                    .map((a) => String((a.metadata as { resolution?: unknown })?.resolution))}
                  onStarted={onClose}
                />

                <RetryVideoAction asset={asset} onStarted={onClose} />

                {asset.pipelineId && (
                  <PipelineAssetActions pipelineId={asset.pipelineId} onStarted={onClose} />
                )}
              </div>

              {asset.status === "completed" && asset.resultUrl && (
                <div className="shrink-0 border-t border-slate-100 p-4 sm:p-6">
                  <button
                    type="button"
                    onClick={() => handleDownload(asset)}
                    className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30"
                  >
                    <Download className="mr-2 size-4" aria-hidden />
                    Download
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
