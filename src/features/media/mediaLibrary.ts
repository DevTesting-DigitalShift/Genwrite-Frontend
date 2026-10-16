import type { MediaAsset } from "@api/Media/Media.api"

export type LibraryTab = "all" | "image" | "video" | "generating" | "failed"
export type LibrarySort = "newest" | "oldest"

export const LIBRARY_TABS: { id: LibraryTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "generating", label: "Generating" },
  { id: "failed", label: "Failed" },
]

export const isActiveAsset = (asset: Pick<MediaAsset, "status">) =>
  asset.status === "queued" || asset.status === "processing"

const matchesTab = (asset: MediaAsset, tab: LibraryTab) => {
  switch (tab) {
    case "all":
      return true
    case "image":
    case "video":
      return asset.type === tab
    case "generating":
      return isActiveAsset(asset)
    case "failed":
      return asset.status === "failed"
  }
}

const createdMs = (asset: MediaAsset) => (asset.createdAt ? new Date(asset.createdAt).getTime() : 0)

/** Filters the already-loaded page of assets by tab and by a free-text match on the prompt or
 * purpose (so "ugc" finds every UGC ad even when the prompt never says it). */
export const filterAssets = (
  assets: MediaAsset[],
  tab: LibraryTab,
  query: string
): MediaAsset[] => {
  const needle = query.trim().toLowerCase()
  return assets.filter((asset) => {
    if (!matchesTab(asset, tab)) return false
    if (!needle) return true
    return (
      asset.prompt.toLowerCase().includes(needle) ||
      asset.purpose.replace("_", " ").toLowerCase().includes(needle)
    )
  })
}

/** Newest first by default. Ties keep their incoming order (Array#sort is stable). */
export const sortAssets = (assets: MediaAsset[], sort: LibrarySort): MediaAsset[] =>
  [...assets].sort((a, b) =>
    sort === "newest" ? createdMs(b) - createdMs(a) : createdMs(a) - createdMs(b)
  )

export const countByTab = (assets: MediaAsset[]): Record<LibraryTab, number> => ({
  all: assets.length,
  image: assets.filter((a) => a.type === "image").length,
  video: assets.filter((a) => a.type === "video").length,
  generating: assets.filter(isActiveAsset).length,
  failed: assets.filter((a) => a.status === "failed").length,
})

/** "2m ago", "3h ago", "5d ago" — falls back to a short date once it's over a week old. */
export const timeAgo = (iso: string | undefined, now = Date.now()): string => {
  if (!iso) return ""
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
