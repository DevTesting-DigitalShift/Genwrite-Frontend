import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { useMediaPricing } from "@store/usePricingStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { mediaQuery } from "@api/Media/Media.query"
import type { MediaAsset } from "@api/Media/Media.api"
import {
  cheapestImageCredits,
  imageCredits,
  resolveImageChoice,
  type ImageChoice,
} from "./imageOptions"
import { isPipelineMode, modelsForMode, type MediaMode } from "./mediaModes"
import type { MediaModel } from "./mediaOptions"
import {
  DEFAULT_RESOLUTION,
  effectiveResolution,
  resolutionsOf,
  usdPerUnitFor,
  type VideoResolution,
} from "./pipelinePricing"

export type ComposerTab = "image" | "video"
type ImageMode = Extract<MediaMode, "text_to_image" | "image_to_image">
type VideoMode = Extract<MediaMode, `${string}_to_video`>

/** Mirrors the backend's media.pricing.js#getMediaCreditCost for video: 1 credit = 1 cent, billed
 * per second for per-second models and flat per video otherwise. (Images are priced from each
 * model's own option table — see imageOptions.ts.) */
export const estimateCredits = (
  model: MediaModel,
  {
    durationSeconds,
    resolution = null,
  }: { durationSeconds: number; resolution?: VideoResolution | null }
) => {
  const units = model.unit === "second" ? durationSeconds : 1
  // Round to micro-cents first so float noise can't add a credit (0.168 × 5 × 100 = 84.00000000000001).
  return Math.ceil(Number((usdPerUnitFor(model, resolution) * units * 100).toFixed(6)))
}

/** What a model costs, for a model list: "from 1 credit" for an image model (its price depends on
 * the size and quality chosen), "5 credits / second" for a video model. */
export const formatRate = (model: MediaModel) => {
  if (model.imageOptions) {
    const from = cheapestImageCredits(model)
    return from === null ? "" : `from ${from} credit${from === 1 ? "" : "s"}`
  }
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
 * Everything the Image and Video composers share: the form state, the model picked from the live
 * pricing catalogue, the credit estimate, and the submit handler. Two tabs (image, video) with a
 * mode each. Text-to-image, image-to-image and text-to-video are driven from here; image-to-video
 * and reference-to-video run through the Auto Video pipeline (AutoVideoForm), which owns its own
 * form state.
 */
export function useMediaComposer() {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()

  const [tab, setTab] = useState<ComposerTab>("image")
  const [imageMode, setImageMode] = useState<ImageMode>("text_to_image")
  const [videoMode, setVideoMode] = useState<VideoMode>("text_to_video")
  const [prompt, setPrompt] = useState("")
  // Models + prices come only from the backend's pricing catalogue (live, or the cached copy of
  // its last good response), so a model added/removed or repriced there shows up here without a
  // frontend change — and with no catalogue there are no models, never made-up prices.
  const {
    media: mediaCatalogue,
    ready: pricingReady,
    failed: pricingFailed,
    retry: retryPricing,
  } = useMediaPricing()

  // The model picked per mode (so switching mode and back keeps each pick).
  const [pickedModels, setPickedModels] = useState<Partial<Record<MediaMode, string>>>({})
  const [imagePick, setImagePick] = useState<ImageChoice>({})
  // Image-to-image: the user's own uploaded image.
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)
  const [uploadingSource, setUploadingSource] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(5)
  const [resolution, setResolution] = useState<VideoResolution>(DEFAULT_RESOLUTION)
  const [aspectPick, setVideoAspectRatio] = useState<string | null>(null)

  const userCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const mode: MediaMode = tab === "image" ? imageMode : videoMode
  const setMode = (next: MediaMode) =>
    tab === "image" ? setImageMode(next as ImageMode) : setVideoMode(next as VideoMode)
  // Pipeline modes list and price their own models (see AutoVideoForm).
  const usesPipeline = isPipelineMode(mode)
  const tabModels = useMemo(
    // Cheapest first, so it's also the default pick.
    () => (usesPipeline ? [] : modelsForMode(mediaCatalogue, mode)),
    [mediaCatalogue, mode, usesPipeline]
  )
  // Falls back to the first model when nothing's picked yet, or the picked one was removed
  // from the catalogue since.
  const currentModel = tabModels.find((m) => m.id === pickedModels[mode]) ?? tabModels[0]
  const setModel = (id: string) => setPickedModels((prev) => ({ ...prev, [mode]: id }))

  // Image modes: the aspect ratio / resolution / quality the model offers, each with its price.
  const imageOptions = tab === "image" ? currentModel?.imageOptions : undefined
  const imageChoice = imageOptions ? resolveImageChoice(imageOptions, imagePick) : null
  const setImageChoice = (patch: ImageChoice) => setImagePick((prev) => ({ ...prev, ...patch }))
  const isEdit = mode === "image_to_image"

  // Video models only accept specific lengths — keep the picked one if this model supports it,
  // else fall back to 5s, else the model's first.
  const videoDurations = currentModel?.textVideo?.durations ?? []
  const videoDuration =
    videoDurations.length === 0 || videoDurations.includes(durationSeconds)
      ? durationSeconds
      : videoDurations.includes(5)
        ? 5
        : videoDurations[0]
  // The aspect ratios this model offers; a pick it doesn't offer (after switching models) falls
  // back to the model's first, the same way the image options do.
  const videoAspects = tab === "video" ? (currentModel?.textVideo?.aspectRatios ?? []) : []
  // `videoAspects[0]` is typed as a plain string, but is undefined for a model that lists none.
  const videoAspectRatio =
    (aspectPick && videoAspects.includes(aspectPick)
      ? aspectPick
      : (videoAspects[0] as string | undefined)) ?? null
  // Only resolution-priced video models take a resolution; images never do.
  const videoResolution = tab === "video" ? effectiveResolution(currentModel, resolution) : null
  const videoResolutions = tab === "video" ? resolutionsOf(currentModel) : []

  // null while the price of what's picked isn't known — Generate stays off rather than guess.
  const estimatedCredits: number | null =
    !currentModel || usesPipeline
      ? null
      : tab === "image"
        ? imageCredits(currentModel, imagePick)
        : estimateCredits(currentModel, {
            durationSeconds: videoDuration,
            resolution: videoResolution,
          })

  // Submitting only queues the job with fal — no waiting screen. The result arrives via the
  // webhook → "media:statusChanged" socket event, toasted app-wide by useMediaNotifications.
  const handleSubmitted = (asset: MediaAsset) => {
    setPrompt("")
    setSourceImageUrl(null)
    loadAuthenticatedUser()
    toast.success(
      `${asset.type === "image" ? "Image" : "Video"} generation started — ready in ${ETA_LABEL[asset.type]}`,
      { description: "We'll notify you when it's done — you can keep working meanwhile." }
    )
  }
  const generateImage = mediaQuery.useGenerateImage({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start image generation"),
  })
  const editImage = mediaQuery.useEditImage({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start the image edit"),
  })
  const generateVideo = mediaQuery.useGenerateVideo({
    onSuccess: handleSubmitted,
    onError: (err) => toast.error(err.message || "Failed to start video generation"),
  })
  const isSubmitting = generateImage.isPending || editImage.isPending || generateVideo.isPending

  /** Whether Generate can be pressed: a model, a known price, and (image-to-image) a finished upload. */
  const canGenerate =
    pricingReady &&
    Boolean(currentModel) &&
    estimatedCredits !== null &&
    !isSubmitting &&
    !(isEdit && (!sourceImageUrl || uploadingSource))

  const checkCredits = (needed: number) => {
    if (userCredits < needed) {
      handlePopup({
        title: "Insufficient Credits",
        description: `This generation needs about ${needed} credits. You have ${userCredits}.`,
        confirmText: "Get Credits",
        onConfirm: () => navigate("/pricing"),
      })
      return false
    }
    return true
  }

  const handleGenerate = () => {
    if (!currentModel || estimatedCredits === null) return
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Prompt must be at least 3 characters")
      return
    }
    if (isEdit && !sourceImageUrl) {
      toast.error("Add the image you want to edit")
      return
    }
    if (isEdit && uploadingSource) {
      toast.error("Wait for the image to finish uploading")
      return
    }
    if (!checkCredits(estimatedCredits)) return

    if (tab === "image" && imageChoice) {
      const body = {
        prompt: prompt.trim(),
        model: currentModel.id,
        aspectRatio: imageChoice.aspectRatio,
        resolution: imageChoice.resolution,
        ...(imageChoice.quality ? { quality: imageChoice.quality } : {}),
      }
      if (isEdit) editImage.mutate({ ...body, imageUrl: sourceImageUrl } as never)
      else generateImage.mutate(body as never)
    } else {
      generateVideo.mutate({
        prompt: prompt.trim(),
        model: currentModel.id,
        durationSeconds: videoDuration,
        ...(videoResolution ? { resolution: videoResolution } : {}),
        ...(videoAspectRatio ? { aspectRatio: videoAspectRatio } : {}),
      } as never)
    }
  }

  return {
    tab,
    setTab,
    prompt,
    setPrompt,
    mode,
    setMode,
    usesPipeline,
    isEdit,
    tabModels,
    currentModel,
    setModel,
    imageOptions,
    imageChoice,
    setImageChoice,
    sourceImageUrl,
    setSourceImageUrl,
    uploadingSource,
    setUploadingSource,
    videoDuration,
    videoDurations,
    setDurationSeconds,
    videoAspects,
    videoAspectRatio,
    setVideoAspectRatio,
    videoResolution,
    videoResolutions,
    setResolution,
    estimatedCredits,
    canGenerate,
    pricingReady,
    pricingFailed,
    retryPricing,
    userCredits,
    isSubmitting,
    handleGenerate,
    mediaCatalogue,
  }
}

export type MediaComposer = ReturnType<typeof useMediaComposer>
