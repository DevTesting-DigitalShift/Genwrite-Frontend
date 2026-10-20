import { Loader2, RotateCw } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { useMediaPricing } from "@store/usePricingStore"
import { mediaQuery } from "@api/Media/Media.query"
import type { GenerateVideoPayload, MediaAsset } from "@api/Media/Media.api"
import type { MediaModel } from "./mediaOptions"
import type { VideoResolution } from "./pipelinePricing"
import { estimateCredits } from "./useMediaComposer"

type RetryMeta = {
  durationSeconds?: number
  resolution?: string
  aspectRatio?: string
  retryOf?: string
  retriedBy?: string
}

const metaOf = (asset: MediaAsset) =>
  (asset.metadata ?? {}) as RetryMeta & { enhancedFrom?: unknown }

/** Each failed video gets one retry: spent once it has been retried, and a retry itself can't be retried. */
export const isRetryUsed = (asset: MediaAsset) => {
  const meta = metaOf(asset)
  return Boolean(meta.retryOf || meta.retriedBy)
}

/** A failed text-to-video generation, rebuilt as the request that made it. Null for anything that
 * can't be replayed from the asset alone (Auto Video children, enhanced copies, images) or whose
 * one retry is already used. */
export function retryVideoPayload(asset: MediaAsset): GenerateVideoPayload | null {
  const meta = metaOf(asset)
  if (asset.type !== "video" || asset.status !== "failed") return null
  if (asset.pipelineId || meta.enhancedFrom || isRetryUsed(asset)) return null
  return {
    retryOf: asset._id,
    prompt: asset.prompt,
    model: asset.providerModel,
    ...(meta.durationSeconds ? { durationSeconds: meta.durationSeconds } : {}),
    ...(meta.resolution ? { resolution: meta.resolution } : {}),
    ...(meta.aspectRatio ? { aspectRatio: meta.aspectRatio } : {}),
  } as GenerateVideoPayload
}

/**
 * "Try again" for a failed video: the provider can error out or have downtime, and the credits
 * were already refunded, so this submits the same request as a brand-new generation.
 */
export function RetryVideoAction({
  asset,
  onStarted,
}: {
  asset: MediaAsset
  onStarted?: () => void
}) {
  const loadAuthenticatedUser = useAuthStore((s) => s.loadAuthenticatedUser)
  const credits = useAuthStore((s) => (s.user?.credits?.base || 0) + (s.user?.credits?.extra || 0))
  const { media: mediaCatalogue } = useMediaPricing()
  const retry = mediaQuery.useGenerateVideo({
    onSuccess: () => {
      loadAuthenticatedUser()
      // The retried asset (and its spent "retriedBy" flag) arrives via the list cache / socket.
      mediaQuery.applyAssetUpdate({
        ...asset,
        metadata: { ...(asset.metadata as object), retriedBy: "pending" },
      } as MediaAsset)
      toast.success("Retrying — we'll notify you when it's ready")
      onStarted?.()
    },
    onError: (err) => toast.error(err.message || "Couldn't retry the video"),
  })

  if (asset.type !== "video" || asset.status !== "failed" || asset.pipelineId) return null
  const payload = retryVideoPayload(asset)
  if (!payload) {
    return isRetryUsed(asset) ? (
      <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        This video was already retried once, so it can't be retried again. You can start a new
        generation from the composer.
      </p>
    ) : null
  }

  const model = mediaCatalogue[asset.providerModel]
  const meta = metaOf(asset)
  const cost = model
    ? estimateCredits({ id: asset.providerModel, ...model } as MediaModel, {
        durationSeconds: meta.durationSeconds ?? 5,
        resolution: (meta.resolution as VideoResolution | undefined) ?? null,
      })
    : null
  const short = cost !== null && credits < cost

  return (
    <section className="space-y-2 rounded-xl border border-rose-100 bg-rose-50/50 p-3">
      <p className="text-xs text-rose-700">
        The video provider hit an error or is having downtime. Your credits were refunded — you can
        try the same video again once, as a new generation.
      </p>
      {short && (
        <p className="text-xs font-medium text-rose-700">
          This costs {cost} credits, but you have {credits}.
        </p>
      )}
      <button
        type="button"
        onClick={() => retry.mutate(payload)}
        disabled={retry.isPending || short}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#4C5BD6] text-sm font-medium text-white transition-colors hover:bg-[#3f4cb8] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30"
      >
        {retry.isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <RotateCw className="mr-2 size-4" aria-hidden />
        )}
        Try again{cost !== null ? ` · ${cost} credit${cost === 1 ? "" : "s"}` : ""}
      </button>
    </section>
  )
}
