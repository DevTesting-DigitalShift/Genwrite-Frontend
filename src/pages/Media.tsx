import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useSearchParams } from "react-router-dom"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { mediaQuery } from "@api/Media/Media.query"
import { AssetPreview } from "@/features/media/AssetPreview"
import { ComposerPanel } from "@/features/media/ComposerPanel"
import { MediaLibrary } from "@/features/media/MediaLibrary"
import { PipelineRuns } from "@/features/media/PipelineRuns"
import { PromptComposer } from "@/features/media/PromptComposer"
import { isActiveAsset } from "@/features/media/mediaLibrary"
import { useMediaComposer } from "@/features/media/useMediaComposer"

const LAYOUTS = [
  { id: "composer", label: "A · Composer" },
  { id: "split", label: "B · Split" },
] as const

const Media = () => {
  // Two candidate layouts are live while we pick one: ?ui=split for the workspace layout.
  const [searchParams, setSearchParams] = useSearchParams()
  const split = searchParams.get("ui") === "split"
  const [sheetOpen, setSheetOpen] = useState(false)
  const composer = useMediaComposer({ onSubmitted: () => setSheetOpen(false) })

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

  const setLayout = (id: (typeof LAYOUTS)[number]["id"]) => {
    const next = new URLSearchParams(searchParams)
    if (id === "split") next.set("ui", "split")
    else next.delete("ui")
    setSearchParams(next, { replace: true })
  }

  const library = (
    <MediaLibrary
      assets={assets}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={handleManualRefresh}
      onSelect={setPreviewId}
      gridClassName={
        split
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      }
    />
  )

  const header = (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 md:flex-row md:items-end">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Media Studio</h1>
        <p className="max-w-lg text-sm leading-relaxed text-slate-500">
          Generate posters, thumbnails, and short videos with AI — describe what you want, pick a
          model, and we'll handle the rest.
        </p>
      </div>
      {/* Temporary: compare the two candidate layouts; removed once one is chosen. */}
      <fieldset
        aria-label="Layout preview"
        className="m-0 flex w-fit min-w-0 rounded-lg border border-dashed border-slate-300 bg-white p-0.5 text-xs"
      >
        {LAYOUTS.map(({ id, label }) => {
          const active = (id === "split") === split
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setLayout(id)}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                active ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          )
        })}
      </fieldset>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>Media Studio | GenWrite</title>
      </Helmet>

      {/* pb leaves room for the global WhatsApp button so it never covers the last row. */}
      <div className="min-h-screen p-4 pb-28 sm:p-6 sm:pb-28">
        {split ? (
          <div className="lg:grid lg:grid-cols-[minmax(380px,40%)_minmax(0,1fr)] lg:items-start lg:gap-6 2xl:grid-cols-[minmax(420px,45%)_minmax(0,1fr)]">
            <aside
              aria-label="Create media"
              className="sticky top-24 hidden h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:block"
            >
              <ComposerPanel composer={composer} />
            </aside>
            <div className="min-w-0">
              {header}
              <PipelineRuns />
              {library}
            </div>

            {/* Below lg the panel lives in a bottom sheet, opened from a pill at the bottom. */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#4C5BD6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4C5BD6]/30 transition-colors hover:bg-[#3B4BB8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30 lg:hidden"
            >
              <Plus size={18} aria-hidden /> Create
            </button>
            <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
              <DialogContent className="bottom-0 left-0 top-auto flex max-h-[92vh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-2xl border-0 p-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-0 sm:rounded-t-2xl lg:hidden">
                <DialogTitle className="sr-only">Create media</DialogTitle>
                <DialogDescription className="sr-only">
                  Write a prompt, choose a model and generate an image or video.
                </DialogDescription>
                <div className="h-[85vh] min-h-0">
                  <ComposerPanel composer={composer} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <>
            {header}
            <div className="mb-8">
              <PromptComposer composer={composer} />
            </div>
            <PipelineRuns />
            {library}
          </>
        )}

        <AssetPreview
          asset={previewAsset}
          assets={assets}
          mediaCatalogue={composer.mediaCatalogue}
          onClose={closePreview}
          variant={split ? "drawer" : "modal"}
        />
      </div>
    </>
  )
}

export default Media
