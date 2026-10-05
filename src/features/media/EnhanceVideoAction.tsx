import { useState } from "react"
import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import usePricingStore from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaQuery } from "@api/Media/Media.query"
import type { MediaAsset } from "@api/Media/Media.api"
import { enhanceOptions, type EnhanceResolution } from "./enhance"

const LABELS: Record<EnhanceResolution, string> = { "1080p": "1080p (Full HD)", "4k": "4K" }

/**
 * "Enhance" for a finished video: upscale it to a higher resolution only when it's wanted, so
 * clips can be generated cheaply at 480p/720p first. Creates a new video next to the original;
 * the result shows up in the library like any other generation.
 */
export function EnhanceVideoAction({
  asset,
  enhancedTo,
  onStarted,
}: {
  asset: MediaAsset
  /** Resolutions this video already has an enhanced copy of (pending or done). */
  enhancedTo: string[]
  onStarted?: () => void
}) {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { handlePopup } = useConfirmPopup()
  const mediaCatalogue = usePricingStore((s) => s.catalogue.media)
  const options = enhanceOptions(
    asset.metadata as { resolution?: unknown; durationSeconds?: unknown },
    mediaCatalogue,
    enhancedTo
  )
  const [picked, setPicked] = useState<EnhanceResolution | null>(null)

  const enhance = mediaQuery.useEnhance({
    onSuccess: () => {
      loadAuthenticatedUser()
      toast.success("Enhancing — we'll notify you when it's ready")
      onStarted?.()
    },
    onError: (err) => toast.error(err.message || "Failed to enhance video"),
  })

  if (asset.type !== "video" || asset.status !== "completed" || options.length === 0) return null

  const option = options.find((o) => o.resolution === picked) ?? options[0]
  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
  const currentResolution = String((asset.metadata as { resolution?: unknown })?.resolution)

  const handleClick = () => {
    const short = userCredits < option.credits
    handlePopup({
      title: `Enhance to ${LABELS[option.resolution]}?`,
      description: short
        ? `This costs ${option.credits} credits, but you have ${userCredits}.`
        : `Upscales this ${currentResolution} video with an AI upscaler and saves it as a new video — the original stays. Costs ${option.credits} credits.`,
      confirmText: "Enhance",
      confirmProps: { disabled: short },
      onConfirm: () =>
        enhance.mutate({ id: asset._id, payload: { resolution: option.resolution } }),
    })
  }

  return (
    <section className="rounded-xl border border-slate-100 p-3 space-y-2">
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Wand2 size={12} /> Enhance
      </h3>
      <p className="text-xs text-slate-500">
        Generated at {currentResolution}. Upscale it to a sharper resolution only when you need it.
      </p>
      <div className="flex gap-2">
        <select
          aria-label="Target resolution"
          className="select outline-0 h-11 flex-1 rounded-lg border-gray-200 border"
          value={option.resolution}
          onChange={(e) => setPicked(e.target.value as EnhanceResolution)}
          disabled={options.length <= 1}
        >
          {options.map((o) => (
            <option key={o.resolution} value={o.resolution}>
              {LABELS[o.resolution]} · {o.credits} credits
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleClick}
          disabled={enhance.isPending}
          className="btn h-11 rounded-lg border-0 bg-[#4C5BD6] px-5 text-white font-semibold hover:bg-[#3B4BB8] disabled:opacity-60 flex items-center gap-1.5"
        >
          {enhance.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles size={14} />}
          Enhance
        </button>
      </div>
    </section>
  )
}
