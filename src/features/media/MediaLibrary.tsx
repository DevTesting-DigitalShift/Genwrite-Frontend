import { useMemo, useState } from "react"
import { Clapperboard, RefreshCw, Search, SearchX } from "lucide-react"
import type { MediaAsset } from "@api/Media/Media.api"
import { MasonryGrid, MasonryItem } from "@components/ui/MasonryGrid"
import { GeneratingStrip } from "./GeneratingStrip"
import { useMediaPricing } from "@store/usePricingStore"
import { MediaAssetCard } from "./MediaAssetCard"
import { SettingChip } from "./SettingChip"
import {
  LIBRARY_TABS,
  countByTab,
  filterAssets,
  isActiveAsset,
  sortAssets,
  type LibrarySort,
  type LibraryTab,
} from "./mediaLibraryUtils"

const GRID_COLUMNS = "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
]

/**
 * The user's library: filter tabs with counts, prompt search, sort, and the masonry grid.
 * Filtering runs on the page of assets already loaded, so it's instant and needs no API.
 */
export function MediaLibrary({
  assets,
  isLoading,
  isRefreshing,
  onRefresh,
  onSelect,
}: {
  assets: MediaAsset[]
  isLoading: boolean
  isRefreshing: boolean
  onRefresh: () => void
  onSelect: (id: string) => void
}) {
  const [tab, setTab] = useState<LibraryTab>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<LibrarySort>("newest")

  const { media: mediaCatalogue } = useMediaPricing()
  const counts = useMemo(() => countByTab(assets), [assets])
  const visible = useMemo(
    () => sortAssets(filterAssets(assets, tab, query), sort),
    [assets, tab, query, sort]
  )
  const generating = useMemo(() => assets.filter(isActiveAsset), [assets])
  const filtering = tab !== "all" || query.trim() !== ""

  return (
    <section aria-label="Your library" className="@container">
      {tab !== "generating" && <GeneratingStrip assets={generating} onSelect={onSelect} />}

      <div className="mb-4 flex flex-col gap-3 @5xl:flex-row @5xl:items-center @5xl:justify-between">
        <div
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 @5xl:pb-0"
          role="tablist"
          aria-label="Filter library"
        >
          {LIBRARY_TABS.map(({ id, label }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 ${
                  active
                    ? "bg-[#4C5BD6]/10 text-[#4C5BD6]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    id === "generating" && counts.generating > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {counts[id]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 @5xl:w-60 @5xl:flex-none">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts"
              aria-label="Search your library"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#4C5BD6] focus:ring-4 focus:ring-[#4C5BD6]/15"
            />
          </div>
          <SettingChip
            label="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(id) => setSort(id as LibrarySort)}
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh library"
            title="Check for finished generations"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/20 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      {isLoading && assets.length === 0 ? (
        <div className={`grid gap-3 sm:gap-4 ${GRID_COLUMNS}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-count skeleton placeholder
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
          <Clapperboard className="mb-4 size-14 text-slate-300" aria-hidden />
          <h3 className="mb-1 text-lg font-semibold text-slate-800">No media yet</h3>
          <p className="text-sm text-slate-500">
            Write a prompt above and generate your first image or video.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <SearchX className="mb-3 size-10 text-slate-300" aria-hidden />
          <h3 className="mb-1 text-base font-semibold text-slate-800">Nothing matches</h3>
          <p className="mb-4 text-sm text-slate-500">Try a different filter or search.</p>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setTab("all")
                setQuery("")
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <MasonryGrid className={`gap-x-3 sm:gap-x-4 ${GRID_COLUMNS}`}>
          {visible.map((asset) => (
            <MasonryItem key={asset._id} gapClassName="pb-3 sm:pb-4">
              <MediaAssetCard
                asset={asset}
                onSelect={onSelect}
                // A removed model isn't in the catalogue any more — fall back to what it made.
                modelLabel={
                  mediaCatalogue[asset.providerModel]?.label ??
                  (asset.type === "image" ? "Image" : "Video")
                }
              />
            </MasonryItem>
          ))}
        </MasonryGrid>
      )}
    </section>
  )
}
