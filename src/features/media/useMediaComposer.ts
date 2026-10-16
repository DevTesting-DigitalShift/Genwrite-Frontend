import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import usePricingStore from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaQuery } from "@api/Media/Media.query"
import type { MediaAsset } from "@api/Media/Media.api"
import type { MediaModel, Purpose } from "./mediaOptions"
import {
  DEFAULT_RESOLUTION,
  effectiveResolution,
  resolutionsOf,
  usdPerUnitFor,
  type VideoResolution,
} from "./pipelinePricing"

export type ComposerTab = "image" | "video" | "auto"

/** Mirrors the backend's media.pricing.js#getMediaCreditCost exactly: 1 credit = 1 cent, and
 * only the unit the model is billed in counts — seconds for per-second video, megapixels for
 * per-megapixel images, otherwise a flat price per image/video. */
export const estimateCredits = (
  model: MediaModel,
  {
    megapixels,
    durationSeconds,
    resolution = null,
  }: { megapixels: number; durationSeconds: number; resolution?: VideoResolution | null }
) => {
  const units =
    model.unit === "second" ? durationSeconds : model.unit === "megapixel" ? megapixels : 1
  // Round to micro-cents first so float noise can't add a credit (0.168 × 5 × 100 = 84.00000000000001).
  return Math.ceil(Number((usdPerUnitFor(model, resolution) * units * 100).toFixed(6)))
}

/** "5 credits / second", "4 credits / image" — the model's rate in the unit it's billed in. */
export const formatRate = (model: MediaModel) => {
  const perUnit = Math.ceil(model.usdPerUnit * 100)
  return `${perUnit} credit${perUnit === 1 ? "" : "s"} / ${model.unit}`
}

/** Rough wait shown to the user — fal delivers the result via webhook, surfaced as a toast
 * by useMediaNotifications, so nothing on this page waits or polls for it. */
export const ETA_LABEL: Record<MediaAsset["type"], string> = {
  image: "about a minute",
  video: "5–10 minutes",
}

/**
 * Everything the Image and Video composers share, whichever layout renders them: the form state,
 * the model picked from the live pricing catalogue, the credit estimate, and the submit handler.
 * "auto" is the Auto Video pipeline (AutoVideoForm), which owns its own form state.
 */
export function useMediaComposer({ onSubmitted }: { onSubmitted?: () => void } = {}) {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  const [tab, setTab] = useState<ComposerTab>("image")
  const [prompt, setPrompt] = useState("")
  const [purpose, setPurpose] = useState<Purpose>("other")
  // Models + prices come from the backend's pricing catalogue, so a model added/removed or
  // repriced there shows up here without a frontend change. Image-to-image models need a
  // source image this prompt-only form can't provide, so they're not offered.
  const mediaCatalogue = usePricingStore((s) => s.catalogue.media)
  const modelsByKind = useMemo(() => {
    const all: MediaModel[] = Object.entries(mediaCatalogue)
      .filter(([, m]) => !m.requiresImage && !m.legacy && !m.unavailable)
      .map(([id, m]) => ({ id, ...m }))
    // Cheapest image model first (priced for one megapixel), so it's also the default pick.
    const cost = (m: MediaModel) => estimateCredits(m, { megapixels: 1, durationSeconds: 5 })
    return {
      image: all.filter((m) => m.kind === "image").sort((a, b) => cost(a) - cost(b)),
      video: all.filter((m) => m.kind === "video"),
    }
  }, [mediaCatalogue])
  const [imageModel, setImageModel] = useState("")
  const [videoModel, setVideoModel] = useState("")
  const [megapixels, setMegapixels] = useState(1)
  const [durationSeconds, setDurationSeconds] = useState(5)
  const [resolution, setResolution] = useState<VideoResolution>(DEFAULT_RESOLUTION)

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const tabModels = tab === "auto" ? [] : modelsByKind[tab]
  // Falls back to the first model when nothing's picked yet, or the picked one was removed
  // from the catalogue since.
  const selectedModelId = tab === "image" ? imageModel : videoModel
  const currentModel = tabModels.find((m) => m.id === selectedModelId) ?? tabModels[0]
  const setModel = (id: string) => (tab === "image" ? setImageModel(id) : setVideoModel(id))

  // Video models only accept specific lengths — keep the picked one if this model supports it,
  // else fall back to 5s, else the model's first.
  const videoDurations = currentModel?.textVideo?.durations ?? []
  const videoDuration =
    videoDurations.length === 0 || videoDurations.includes(durationSeconds)
      ? durationSeconds
      : videoDurations.includes(5)
        ? 5
        : videoDurations[0]
  // Only resolution-priced video models take a resolution; images never do.
  const videoResolution = tab === "video" ? effectiveResolution(currentModel, resolution) : null
  const videoResolutions = tab === "video" ? resolutionsOf(currentModel) : []
  const estimatedCredits = currentModel
    ? estimateCredits(currentModel, {
        megapixels,
        durationSeconds: videoDuration,
        resolution: videoResolution,
      })
    : 0

  // Submitting only queues the job with fal — no waiting screen. The result arrives via the
  // webhook → "media:statusChanged" socket event, toasted app-wide by useMediaNotifications.
  const handleSubmitted = (asset: MediaAsset) => {
    setPrompt("")
    loadAuthenticatedUser()
    onSubmitted?.()
    toast.success(
      `${asset.type === "image" ? "Image" : "Video"} generation started — ready in ${ETA_LABEL[asset.type]}`,
      { description: "We'll notify you when it's done, or hit Refresh to check." }
    )
  }
  const generateImage = mediaQuery.useGenerateImage({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start image generation"),
  })
  const generateVideo = mediaQuery.useGenerateVideo({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start video generation"),
  })
  const isSubmitting = generateImage.isPending || generateVideo.isPending

  const checkCredits = () => {
    if (userCredits < estimatedCredits) {
      handlePopup({
        title: "Insufficient Credits",
        description: `This generation needs about ${estimatedCredits} credits. You have ${userCredits}.`,
        confirmText: "Get Credits",
        onConfirm: () => navigate("/pricing"),
      })
      return false
    }
    return true
  }

  const handleGenerate = () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Prompt must be at least 3 characters")
      return
    }
    if (!checkCredits()) return

    if (!currentModel) return
    if (tab === "image") {
      generateImage.mutate({
        prompt: prompt.trim(),
        model: currentModel.id,
        purpose,
        megapixels,
      } as never)
    } else {
      generateVideo.mutate({
        prompt: prompt.trim(),
        model: currentModel.id,
        purpose,
        durationSeconds: videoDuration,
        ...(videoResolution ? { resolution: videoResolution } : {}),
      } as never)
    }
  }

  return {
    tab,
    setTab,
    prompt,
    setPrompt,
    purpose,
    setPurpose,
    tabModels,
    currentModel,
    setModel,
    megapixels,
    setMegapixels,
    videoDuration,
    videoDurations,
    setDurationSeconds,
    videoResolution,
    videoResolutions,
    setResolution,
    estimatedCredits,
    userCredits,
    isSubmitting,
    handleGenerate,
    mediaCatalogue,
  }
}

export type MediaComposer = ReturnType<typeof useMediaComposer>
