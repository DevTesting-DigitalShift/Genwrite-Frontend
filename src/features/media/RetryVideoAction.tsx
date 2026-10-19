import { Loader2, RotateCw } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { mediaQuery } from "@api/Media/Media.query"
import type { GenerateVideoPayload, MediaAsset } from "@api/Media/Media.api"

type RetryMeta = { durationSeconds?: number; resolution?: string; aspectRatio?: string }

/** A failed text-to-video generation, rebuilt as the request that made it. Null for anything that
 * can't be replayed from the asset alone (Auto Video children, enhanced copies, images). */
export function retryVideoPayload(asset: MediaAsset): GenerateVideoPayload | null {
  const meta = (asset.metadata ?? {}) as RetryMeta & { enhancedFrom?: unknown }
  if (asset.type !== "video" || asset.status !== "failed") return null
  if (asset.pipelineId || meta.enhancedFrom) return null
  return {
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
  const retry = mediaQuery.useGenerateVideo({
    onSuccess: () => {
      loadAuthenticatedUser()
      toast.success("Retrying — we'll notify you when it's ready")
      onStarted?.()
    },
    onError: (err) => toast.error(err.message || "Couldn't retry the video"),
  })

  const payload = retryVideoPayload(asset)
  if (!payload) return null

  return (
    <section className="space-y-2 rounded-xl border border-rose-100 bg-rose-50/50 p-3">
      <p className="text-xs text-rose-700">
        The video provider hit an error or is having downtime. Your credits were refunded — you can
        try the same video again as a new generation.
      </p>
      <button
        type="button"
        onClick={() => retry.mutate(payload)}
        disabled={retry.isPending}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-[#4C5BD6] text-sm font-medium text-white transition-colors hover:bg-[#3f4cb8] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C5BD6]/30"
      >
        {retry.isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <RotateCw className="mr-2 size-4" aria-hidden />
        )}
        Try again
      </button>
    </section>
  )
}
