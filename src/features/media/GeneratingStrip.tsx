import { Clock, ImageIcon, Video } from "lucide-react"
import type { MediaAsset } from "@api/Media/Media.api"
import { ETA_LABEL } from "./useMediaComposer"
import { STATUS_STYLES } from "./MediaAssetCard"

/**
 * What's rendering right now, pinned above the library so a fresh submission is visible
 * immediately instead of being one grey square somewhere in the grid. Results still arrive by
 * webhook + toast; this is just the "yes, it's working" confirmation.
 */
export function GeneratingStrip({
  assets,
  onSelect,
}: {
  assets: MediaAsset[]
  onSelect: (id: string) => void
}) {
  if (assets.length === 0) return null

  return (
    <section
      aria-label="In progress"
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-3"
    >
      <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
        </span>
        {assets.length} generating
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {assets.slice(0, 6).map((asset) => (
          <li key={asset._id}>
            <button
              type="button"
              onClick={() => onSelect(asset._id)}
              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border border-amber-200/70 bg-white p-2.5 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/25"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                {asset.type === "image" ? (
                  <ImageIcon size={18} aria-hidden />
                ) : (
                  <Video size={18} aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">
                  {asset.prompt}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={11} aria-hidden /> ready in {ETA_LABEL[asset.type]}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[asset.status].className}`}
              >
                {STATUS_STYLES[asset.status].label}
              </span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-amber-400/60" />
            </button>
          </li>
        ))}
      </ul>
      {assets.length > 6 && (
        <p className="mt-2 px-1 text-xs text-amber-800/80">
          +{assets.length - 6} more in your library below
        </p>
      )}
    </section>
  )
}
