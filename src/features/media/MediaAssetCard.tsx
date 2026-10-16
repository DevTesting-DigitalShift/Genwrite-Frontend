import { memo, useState } from "react"
import { Clock, ImageIcon, Video, X } from "lucide-react"
import type { MediaAsset } from "@api/Media/Media.api"
import { ETA_LABEL } from "./useMediaComposer"
import { isActiveAsset, timeAgo } from "./mediaLibrary"

export const STATUS_STYLES: Record<MediaAsset["status"], { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-600 border-slate-200" },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-600 border-blue-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-600 border-rose-200" },
}

/** Memoised: socket updates patch single entries in the cached list, and only the cards
 * whose asset object actually changed should re-render.
 *
 * A finished card shows just the media — the status and model pills and the prompt appear on
 * hover or keyboard focus (and always on touch screens, which have no hover). Cards that are
 * still generating or failed always carry their status, since that is what the user is
 * looking for on them. */
export const MediaAssetCard = memo(
  ({
    asset,
    onSelect,
    modelLabel,
  }: {
    asset: MediaAsset
    onSelect: (id: string) => void
    /** The model's display name, shown on hover. */
    modelLabel: string
  }) => {
    const style = STATUS_STYLES[asset.status]
    const [loaded, setLoaded] = useState(false)
    const resultUrl = asset.resultUrl ?? undefined
    const completed = asset.status === "completed" && Boolean(resultUrl)
    // Visible on hover/focus, and always on touch screens.
    const reveal =
      "opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"

    return (
      <button
        type="button"
        onClick={() => onSelect(asset._id)}
        aria-label={`Open ${asset.type}: ${asset.prompt}`}
        className="group relative block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left shadow-xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30"
      >
        {completed ? (
          asset.type === "image" ? (
            // Square shimmer until the real dimensions arrive, then the masonry cell snaps to
            // the image's natural aspect ratio — avoids a 0-height flash of badges-only cards.
            <div className={loaded ? "" : "aspect-square animate-pulse bg-slate-200"}>
              <img
                src={resultUrl}
                alt=""
                className={`h-auto w-full object-cover transition-all duration-300 group-hover:scale-[1.03] ${
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
                src={resultUrl}
                className="h-full w-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/30">
                <span className="flex size-11 items-center justify-center rounded-full bg-white/90 shadow-sm">
                  <Video className="ml-0.5 size-4 text-slate-900" aria-hidden />
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden bg-linear-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
            {isActiveAsset(asset) ? (
              <>
                <Clock className="size-8 text-[#4C5BD6]" aria-hidden />
                <p className="text-center text-xs font-semibold text-slate-500">
                  {asset.status === "queued" ? "Queued" : "Generating"} — ready in{" "}
                  {ETA_LABEL[asset.type]}
                </p>
                <span className="absolute inset-x-0 bottom-0 h-1 animate-pulse bg-[#4C5BD6]/30" />
              </>
            ) : (
              <>
                <X className="size-8 text-rose-400" aria-hidden />
                <p className="line-clamp-3 text-center text-xs font-semibold text-rose-500">
                  {asset.errorMessage || "Generation failed"}
                </p>
              </>
            )}
          </div>
        )}

        {!completed && (
          <span
            className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${style.className}`}
          >
            {style.label}
          </span>
        )}
        <span
          className={`absolute right-2 top-2 flex max-w-[60%] items-center gap-1 rounded-full border border-slate-200 bg-white/85 px-2 py-0.5 text-[10px] font-bold text-slate-600 backdrop-blur-sm ${
            completed ? reveal : ""
          }`}
        >
          {asset.type === "image" ? (
            <ImageIcon size={10} aria-hidden />
          ) : (
            <Video size={10} aria-hidden />
          )}
          {modelLabel}
        </span>

        {completed && (
          <span
            className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/75 via-black/20 to-transparent p-3 pt-10 ${reveal}`}
          >
            <span className="line-clamp-2 text-xs font-medium text-white">{asset.prompt}</span>
            <span className="shrink-0 text-[10px] font-medium text-white/80">
              {timeAgo(asset.createdAt)}
            </span>
          </span>
        )}
      </button>
    )
  }
)
MediaAssetCard.displayName = "MediaAssetCard"
