import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { mediaQuery } from "@api/Media/Media.query"
import { AssetPreview } from "@/features/media/AssetPreview"
import { MediaLibrary } from "@/features/media/MediaLibrary"
import { PipelineRuns } from "@/features/media/PipelineRuns"
import { PromptComposer } from "@/features/media/PromptComposer"
import { isActiveAsset } from "@/features/media/mediaLibrary"
import { useMediaComposer } from "@/features/media/useMediaComposer"

const Media = () => {
  const composer = useMediaComposer()

  // An id rather than a snapshot so the preview always reflects the live cache entry
  // (status flips from processing → completed while it's open).
  const [previewId, setPreviewId] = useState<string | null>(null)
  const closePreview = useCallback(() => setPreviewId(null), [])

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

  const refresh = mediaQuery.useRefresh()
  const isRefreshing = isFetching || refresh.isPending

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
    refreshActive(assets.filter(isActiveAsset).map((a) => a._id))
  }, [isLoading])

  const handleManualRefresh = async () => {
    const { data } = await refetch()
    refreshActive((data?.data ?? []).filter(isActiveAsset).map((a) => a._id))
  }

  return (
    <>
      <Helmet>
        <title>Media Studio | GenWrite</title>
      </Helmet>

      {/* pb leaves room for the global WhatsApp button so it never covers the last row. */}
      <div className="min-h-screen p-4 pb-28 sm:p-6 sm:pb-28">
        <div className="mb-6 space-y-1.5 sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Media Studio</h1>
          <p className="max-w-lg text-sm leading-relaxed text-slate-500">
            Generate images and short videos with AI — describe what you want, pick a model, and
            we'll handle the rest.
          </p>
        </div>

        <div className="mb-8">
          <PromptComposer composer={composer} />
        </div>
        <PipelineRuns />
        <MediaLibrary
          assets={assets}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleManualRefresh}
          onSelect={setPreviewId}
        />

        <AssetPreview
          asset={previewAsset}
          assets={assets}
          mediaCatalogue={composer.mediaCatalogue}
          onClose={closePreview}
        />
      </div>
    </>
  )
}

export default Media
